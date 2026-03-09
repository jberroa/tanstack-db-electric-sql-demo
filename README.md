# Debt Payoff Calculator

This is a debt payoff calculator built with [TanStack DB](https://tanstack.com/db) for local state management and server-backed data.

It helps users organize their debts, choose a payoff strategy (Avalanche vs. Snowball), and visualize their journey to becoming debt-free.

## 🚀 Tech Stack

- **Framework:** [TanStack Start](https://tanstack.com/start)
- **State/Sync:** [TanStack DB](https://tanstack.com/db) + [TanStack Query](https://tanstack.com/query)
- **Database:** PostgreSQL (ORM: [Prisma](https://www.prisma.io/))
- **Auth:** [Better Auth](https://better-auth.com/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)

## ✨ Features

- **Instant Updates:** Data refreshes immediately after changes, with optimistic updates for a snappy experience.
- **Payoff Strategies:** Compare "Snowball" (lowest balance first) vs. "Avalanche" (highest interest first) methods.
- **Visualizations:** Interactive charts and schedules to see exactly when each debt will be paid off.

## 🛠️ Getting Started

Follow these steps to get the app running locally.

### Prerequisites

- **Node.js 22** (required for Prisma migrations; use `nvm use` if you have [.nvmrc](.nvmrc))
- npm or pnpm
- Docker (for the database)

### 1. Install Dependencies

```bash
npm install
# or: pnpm install
```

### 2. Configure Environment Variables

Create a `.env.local` file (or use `.env.development`) with:

```env
# Required for the app (already in .env.development)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/debt_calculator_dev"
BETTER_AUTH_SECRET="super-secret-dev-key"
BETTER_AUTH_URL="http://localhost:3000"

# Optional: Add for Google OAuth (otherwise email/password sign-in is used)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
VITE_GOOGLE_AUTH_ENABLED=true
```

Email/password authentication works without any OAuth setup. Add the Google variables only if you want "Sign in with Google".

### 3. Start Backend Services

Start PostgreSQL using Docker Compose:

```bash
npm run dc:up
# or: pnpm dc:up
```

### 4. Setup Database

Apply the Prisma schema and generate the client. **Node 22 is required** for migrations; run `nvm use` if you use nvm:

```bash
npm run db:migrate -- dev   # Apply migrations (or use Docker to run migration SQL if migrate fails)
npm run db:generate        # Generate Prisma client (requires Node 22)
# or: pnpm db:migrate dev && pnpm db:generate
```

### 5. Run the App

Start the development server:

```bash
npm run dev
# or: pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Troubleshooting

- **"Cannot find native binding" / oxc-transform**: On Apple Silicon (M1/M2/M3), add `@oxc-transform/binding-darwin-arm64` explicitly: `pnpm add -D @oxc-transform/binding-darwin-arm64@0.96.0`
- **Node version**: Use Node 22 for migrations (`nvm use` with `.nvmrc`)

## 💡 How it Works

1.  **PostgreSQL** acts as the source of truth.
2.  **Server Functions** fetch and persist data; TanStack Query handles caching and refetching.
3.  **TanStack DB** manages the client-side collection state and renders updates after mutations.

## 📝 License

MIT
