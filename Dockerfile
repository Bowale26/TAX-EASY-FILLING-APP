FROM node:20-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --only=production
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/build ./build
COPY --from=builder /usr/src/app/server.ts ./server.ts
COPY --from=builder /usr/src/app/server.js ./server.js
EXPOSE 8080
CMD [ "node", "server.js" ]
