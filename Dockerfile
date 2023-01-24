FROM denoland/deno:latest

WORKDIR /app

USER deno

COPY src/pkg src/pkg

RUN deno cache src/pkg/index.ts

ADD . .

RUN deno cache src/index.ts

CMD ["run", "--unstable", "--allow-net", "--allow-read", "--allow-env", "src/index.ts"]