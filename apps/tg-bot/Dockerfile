FROM node:18
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn install
RUN yarn nx build tg-bot
CMD ["node", "dist/apps/tg-bot/main.js"]
