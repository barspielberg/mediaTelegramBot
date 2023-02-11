FROM denoland/deno:ubuntu

# install ngrok
RUN apt update 

RUN apt -y install curl

RUN curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null 

RUN echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | tee /etc/apt/sources.list.d/ngrok.list 

RUN apt update 

RUN apt -y install ngrok

# set user dir permissions 
WORKDIR /home

RUN mkdir deno

RUN chown deno:deno deno

# cache deno packages
WORKDIR /app

USER deno

COPY src/pkg src/pkg

RUN deno cache src/pkg/index.ts

# add project and run
ADD . .

RUN deno cache src/index.ts

CMD ["run", "--allow-net", "--allow-read", "--allow-env","--allow-run", "src/index.ts"]