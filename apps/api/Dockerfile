FROM node:18-alpine
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build api
EXPOSE 8080
CMD ["yarn", "start", "api"]
