# ── Stage 1: Builder ─────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first — before source code
# This is intentional (explained below)
COPY package*.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma

# Install ALL dependencies (including devDependencies)
# We need TypeScript compiler here
RUN npm ci

# Generate Prisma client (needs to happen before compile)
RUN npx prisma generate

# Now copy source code and compile
COPY . .
RUN npm run build

# ── Stage 2: Production ──────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma

# Install ONLY production dependencies — no TypeScript, no dev tools
RUN npm ci --omit=dev

# Generate Prisma client again for this clean environment
RUN npx prisma generate

# Copy compiled JS from the builder stage
# Everything else (source .ts files, node_modules from builder) stays behind
COPY --from=builder /app/dist ./dist

EXPOSE 3001

# Run migrations then start the compiled app
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main"]