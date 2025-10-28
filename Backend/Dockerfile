# --- deps: install ALL deps (incl. dev) so we can build ---
FROM node:20-alpine AS deps
WORKDIR /app
# ensure dev deps are installed even if .npmrc / env says "production"
ENV NODE_ENV=development
ENV NPM_CONFIG_PRODUCTION=false
COPY package*.json ./
RUN npm ci --include=dev
# safety guard: if typescript still missing (bad lockfile), install it
RUN npm ls typescript || npm i -D typescript@5.6.3 @types/node@20.11.0

# --- build: compile TS using deps stage ---
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build   # should execute: tsc -p tsconfig.json

# --- run: only prod deps + compiled JS ---
FROM node:20-alpine AS run
WORKDIR /app
# for healthcheck used in docker-compose
RUN apk add --no-cache curl
COPY package*.json ./
ENV NODE_ENV=production
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
ENV HOST=0.0.0.0 PORT=4000
EXPOSE 4000
CMD ["node","dist/app.js"]