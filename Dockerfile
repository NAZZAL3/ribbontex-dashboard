FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/

RUN npm install \
  && npm install --prefix server \
  && npm install --prefix client

COPY server ./server
COPY client ./client

RUN npm run build --prefix client

ENV NODE_ENV=production
ENV PORT=3001
ENV DATA_DIR=/app/server/data
ENV TZ=Asia/Amman

EXPOSE 3001

CMD ["node", "server/index.js"]
