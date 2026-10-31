FROM node:22-bookworm-slim

WORKDIR /usr/local

COPY package.json package-lock.json ./
RUN npm ci && npm cache clean --force
ENV PATH=/usr/local/node_modules/.bin:$PATH

WORKDIR /usr/local/app
