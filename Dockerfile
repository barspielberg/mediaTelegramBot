FROM denoland/deno:ubuntu

# Install dependencies
RUN apt-get update && apt-get install -y curl unzip && rm -rf /var/lib/apt/lists/*

# Install latest ngrok (official binary)
RUN curl -fsSL https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.zip -o ngrok.zip \
    && unzip ngrok.zip \
    && mv ngrok /usr/local/bin/ngrok \
    && chmod +x /usr/local/bin/ngrok \
    && rm ngrok.zip

# Set user dir permissions
WORKDIR /home
RUN mkdir deno && chown deno:deno deno

# Cache deno packages
WORKDIR /app
USER deno

COPY src/pkg src/pkg
RUN deno cache --allow-import src/pkg/index.ts

# Add project and run
COPY . .
RUN deno cache --allow-import src/index.ts

CMD ["run", "--allow-import", "--allow-net", "--allow-read", "--allow-env", "--allow-run", "src/index.ts"]
