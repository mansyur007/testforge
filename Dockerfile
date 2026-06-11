# glibc base (node:20-slim) — Alpine/musl mismatches the @next/swc glibc binary
# that npm resolves for linux-x64, and Prisma also prefers glibc+openssl.
FROM node:20-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
COPY . .
# NEXT_PUBLIC_* are inlined at build time, so they must be set before `next build`.
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_GITHUB_REPO
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_GITHUB_REPO=$NEXT_PUBLIC_GITHUB_REPO
RUN npx prisma generate && npm run build

FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/prisma ./prisma
EXPOSE 3000
# db push idempoten: membuat schema saat volume masih kosong
CMD ["sh", "-c", "npx prisma db push --skip-generate && node prisma/seed.mjs && npx next start"]
