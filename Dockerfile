# Use Node 20 for better compatibility with modern packages
FROM node:20-alpine AS base

# 1. Install pnpm manually (Bypasses Corepack KeyID errors)
# ENV PNPM_HOME="/pnpm"
# ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm

# --- Dependencies stage ---
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy lockfile and manifest
COPY package.json pnpm-lock.yaml* ./

# Install ALL dependencies (needed for build and prisma)
RUN \
  if [ -f pnpm-lock.yaml ]; then pnpm i --frozen-lockfile; \
  else echo "pnpm-lock.yaml not found." && exit 1; \
  fi

# --- Builder stage ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# Generate Prisma Client
RUN pnpm prisma generate

# Build the application
RUN pnpm run build

# --- Production runner stage ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache curl

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy the public folder
COPY --from=builder /app/public ./public

# Set permissions for the .next folder
RUN mkdir .next && chown nextjs:nodejs .next

# IMPORTANT: Leverage Next.js standalone output
# Standalone mode traces Prisma and bundles it into the standalone folder
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema (required for migrations or runtime checks)
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Healthcheck for Coolify stability
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Start the Next.js application with migrations
CMD sh -c "pnpm prisma migrate deploy && node server.js"