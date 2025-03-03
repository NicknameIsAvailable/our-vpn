FROM node:18
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn install
RUN yarn nx build api
CMD ["node", "dist/apps/api/main.js"]
