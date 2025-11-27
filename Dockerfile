# STAGE 1: Base
FROM node:20-alpine AS base
WORKDIR /app
# FIX 1: Install openssl for Prisma
RUN apk add --no-cache libc6-compat openssl

# STAGE 2: Dependencies
FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma/
# Install prod dependencies
RUN npm ci --omit=dev

# STAGE 3: Builder
FROM base AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma/
RUN npm ci 
COPY . .
# Generate Prisma Client
RUN npx prisma generate
# Build TypeScript
RUN npm run build

# STAGE 4: Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Create user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 expressjs

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules

# FIX 2: Copy the generated Prisma Client from builder
# (This prevents Prisma from trying to re-generate it at runtime)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Copy application code
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# FIX 3: Give permission to the user to write to node_modules 
# (Necessary if npx tries to download migration engines)
RUN chown -R expressjs:nodejs /app/node_modules
RUN chown -R expressjs:nodejs /app/prisma

# Switch to non-root user
USER expressjs

EXPOSE 4000

CMD ["node", "dist/server.js"]