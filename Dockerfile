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

# Copy prisma schema
COPY prisma ./prisma

# Copy generated Prisma client from builder (avoids needing prisma CLI in prod)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy build output (Nitro outputs to .output)
COPY --from=builder /app/.output ./.output

EXPOSE 3000

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

CMD ["node", ".output/server/index.mjs"]
