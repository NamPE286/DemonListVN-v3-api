FROM oven/bun:1

WORKDIR /app

COPY . .

RUN bun install
RUN bun run build

EXPOSE 8080

CMD ["./app"]