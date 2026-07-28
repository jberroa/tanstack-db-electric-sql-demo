# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm (pin to v9 to match lockfileVersion 9)
RUN corepack enable && corepack prepare pnpm@9 --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install all deps (including dev for build)
RUN pnpm install --frozen-lockfile

# Copy prisma and generate client
COPY prisma ./prisma
COPY prisma.config.ts ./
# DATABASE_URL is required by prisma.config.ts at generate time; no live DB needed
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/debt_calculator_dev"
RUN pnpm exec prisma generate

# Copy source and build
COPY . .
RUN pnpm run build

# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

# Copy package files and install prod deps only
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# Prisma CLI is a devDependency; add it in the runner for migrate deploy on boot
RUN pnpm add prisma@7 --prod

# Copy prisma schema, migrations, and config
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Copy generated Prisma client from builder (output is src/generated/prisma per schema)
COPY --from=builder /app/src/generated ./src/generated

# Copy build output (Nitro outputs to .output)
COPY --from=builder /app/.output ./.output

EXPOSE 3000

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", ".output/server/index.mjs"]
