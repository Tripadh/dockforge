FROM node:20

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY src ./src

CMD ["node", "src/server.js"]