FROM node:18-alpine AS builder
WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn nx build tg-bot

FROM node:18-alpine AS runner
WORKDIR /app

COPY --from=builder /app/dist/apps/tg-bot ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

CMD ["node", "dist/main.js"]
