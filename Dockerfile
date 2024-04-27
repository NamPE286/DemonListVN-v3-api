FROM oven/bun:1

WORKDIR /app

COPY . .

RUN bun install

EXPOSE 8080

CMD ["bun run ./src/index.ts"]