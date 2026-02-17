# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

RUN pnpm install --frozen-lockfile
RUN pnpm db:generate

# Stage 2: Build
FROM node:20-alpine AS build
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./
COPY . .

RUN pnpm build

# Stage 3: Production
FROM node:20-alpine AS production
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/prisma ./prisma

EXPOSE 3000

CMD ["pnpm", "start"]
