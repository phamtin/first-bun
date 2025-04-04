# Build stage
FROM oven/bun:slim AS builder

WORKDIR /app

# Install all dependencies (including devDependencies for building)
COPY . .
COPY .env .env

RUN bun install

# Build the app
RUN bun build ./src/index.ts --target bun --outdir ./build --minify

# Runtime stage
FROM oven/bun:slim

WORKDIR /app

# Copy only the built output and necessary runtime files
COPY --from=builder /app/build ./build
COPY --from=builder /app/.env .env 

# Set environment variables
ENV NODE_ENV=production
ENV BUN_ENV=production

# Run the compiled app
CMD ["bun", "run", "./build/index.js"]

EXPOSE 8000