FROM node:18-alpine AS builder
WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn nx build api

FROM node:18-alpine AS runner
WORKDIR /app

COPY --from=builder /app/dist/apps/api ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

CMD ["node", "dist/main.js"]