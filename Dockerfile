# Multi-stage build for MVS 2.0 Application
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies with legacy peer deps to resolve TypeScript conflicts
RUN npm ci --only=production --legacy-peer-deps && npm cache clean --force
RUN cd client && npm ci --only=production --legacy-peer-deps && npm cache clean --force
RUN cd server && npm ci --only=production --legacy-peer-deps && npm cache clean --force

# Build stage for client
FROM base AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
COPY client/ ./
RUN npm ci --legacy-peer-deps
RUN npm run build

# Build stage for server
FROM base AS server-builder
WORKDIR /app/server
COPY server/package*.json ./
COPY server/ ./
RUN npm ci --legacy-peer-deps
RUN npm run build

# Production stage
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=client-builder --chown=nextjs:nodejs /app/client/build ./client/build
COPY --from=server-builder --chown=nextjs:nodejs /app/server/dist ./server/dist
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=deps --chown=nextjs:nodejs /app/client/node_modules ./client/node_modules
COPY --from=deps --chown=nextjs:nodejs /app/server/node_modules ./server/node_modules

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Switch to non-root user
USER nextjs

# Start the application
CMD ["sh", "-c", "cd /app/server && export VAPID_PUBLIC_KEY='BEbywFAUA1ePFFECIq-8KH_XYADQJzYmQKdOwgYPWaCcFfcFJjc0vMIKiYwhrdr5Ed-6m4bi2KJ9f15Bq31w3MY' && export VAPID_PRIVATE_KEY='aOFGQKrtQ63dVTiVM-0eohK8A6bzjGfVi8CLIPqKeBs' && npm start"]
