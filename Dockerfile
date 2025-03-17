FROM oven/bun:slim

WORKDIR /app

COPY package.json .
COPY bun.lockb .

RUN bun install --production

COPY src src
COPY tsconfig.json .
COPY .env .env

ENV NODE_ENV=production
ENV BUN_ENV=production

CMD ["bun", "src/index.ts"]

EXPOSE 8000