FROM node:18-alpine AS builder
WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .

FROM node:18-alpine AS runner
RUN yarn add dotenv-cli

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/db/prisma ./db/prisma

RUN yarn run migrate:postgres-prod
CMD ["sh", "-c", "npx prisma generate --schema db/prisma/schema.prisma"]
