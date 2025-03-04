FROM cypress/browsers

WORKDIR /app

ENV PATH=/app/node_modules/.bin:$PATH
ENV TZ=Asia/Tashkent

RUN apt-get update && apt-get install -y curl

RUN npx cypress install # Install Cypress binary into image

COPY package*.json ./
RUN npm install
COPY . .

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
