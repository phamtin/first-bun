FROM oven/bun AS builder

WORKDIR /app

COPY package.json .
COPY tsconfig.json .
COPY apps/shared apps/shared
COPY apps/api apps/api
COPY .env .env

WORKDIR /app/apps/api

RUN bun install --filter api

RUN bun build ./index.ts --target bun --outdir ./build --minify

# Runtime stage
FROM oven/bun:slim

COPY --from=builder /app/apps/api/build ./build
COPY --from=builder /app/.env .env 

ENV BUN_ENV=production

CMD ["bun", "run", "./build/index.js"]

EXPOSE 8000