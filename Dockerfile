FROM mcr.microsoft.com/playwright:v1.51.0-noble

WORKDIR /app

ENV PATH=/app/node_modules/.bin:$PATH
ENV TZ=Asia/Tashkent

COPY package.json /app/
RUN npm install

COPY . /app/

# Ensure additional required libraries are installed
RUN apt-get update && apt-get install -y \
    libnss3 libatk-bridge2.0-0 libdrm-dev libxkbcommon-dev \
    libgbm-dev libasound-dev libatspi2.0-0 libxshmfence-dev curl

# Install supercronic
ENV SUPERCRONIC_URL=https://github.com/aptible/supercronic/releases/download/v0.2.33/supercronic-linux-amd64 \
    SUPERCRONIC_SHA1SUM=71b0d58cc53f6bd72cf2f293e09e294b79c666d8 \
    SUPERCRONIC=supercronic-linux-amd64
RUN curl -fsSLO "$SUPERCRONIC_URL" \
 && echo "${SUPERCRONIC_SHA1SUM}  ${SUPERCRONIC}" | sha1sum -c - \
 && chmod +x "$SUPERCRONIC" \
 && mv "$SUPERCRONIC" "/usr/local/bin/${SUPERCRONIC}" \
 && ln -s "/usr/local/bin/${SUPERCRONIC}" /usr/local/bin/supercronic

# Start cron in the foreground
CMD ["sh", "-c", "supercronic /app/.docker/crontab"]
