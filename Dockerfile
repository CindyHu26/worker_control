FROM node:18-alpine AS base
RUN npm install -g pnpm

FROM base AS builder
WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy all workspace packages
COPY packages ./packages
COPY server ./server

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build shared package first
RUN pnpm --filter @worker-control/shared build

# Build server
RUN pnpm --filter server build

# Production stage
FROM base AS runner
WORKDIR /app

# Copy node_modules and built files
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/package.json ./server/package.json
COPY --from=builder /app/server/prisma ./server/prisma

# Set working directory to server
WORKDIR /app/server

# Expose port
EXPOSE 3001

# Start server
CMD ["node", "dist/src/index.js"]
