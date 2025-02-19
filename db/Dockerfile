FROM node:18
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
COPY db/prisma prisma
RUN npx prisma generate --schema db/prisma/schema.prisma
