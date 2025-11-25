# STAGE 1: Base (Shared configuration)
FROM node:20-alpine AS base
WORKDIR /app
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat

# STAGE 2: Dependencies (Install ONLY production deps)
FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma/
# Install dependencies (production only) to cache them
RUN npm ci --omit=dev

# STAGE 3: Builder (Install ALL deps to build TypeScript)
FROM base AS builder
COPY package.json package-lock.json ./
COPY prisma ./prisma/
RUN npm ci 
COPY . .
# 1. Generate Prisma Client (Ensure it matches the Alpine OS)
RUN npx prisma generate
# 2. Compile TypeScript to JavaScript (dist folder)
RUN npm run build

# STAGE 4: Runner (Final Production Image)
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 expressjs

# Copy only necessary files from previous stages
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# Change ownership to non-root user
USER expressjs

# Expose the port
EXPOSE 4000

# Start the server
CMD ["node", "dist/server.js"]