FROM node:18-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN yarn install
COPY . .
EXPOSE 4200 8080 3000
CMD ["yarn", "nx", "serve", "api"]
