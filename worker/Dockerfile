FROM node:18-alpine

# Install Docker CLI (latest version from docker-cli package)
RUN apk add --no-cache docker-cli

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY src ./src

CMD ["node", "src/worker.js"]