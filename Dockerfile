FROM oven/bun:1

WORKDIR /

COPY . .

RUN bun install

EXPOSE 8080

CMD ["bun run /src/index.ts"]