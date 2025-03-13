FROM node:18-alpine AS base
WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn nx run-many --target=build --projects=api,tg-bot,vpn,xui