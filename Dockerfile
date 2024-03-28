FROM oven/bun:lastest

WORKDIR /app

COPY . .

RUN bun run build

EXPOSE 8080

CMD ["./app"]