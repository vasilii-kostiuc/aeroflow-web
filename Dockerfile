# Production image: the built SPA inside Caddy. Caddy serves the static files
# and is also the entry point of the deploy stack (HTTPS, /api to core); its
# Caddyfile comes from the deploy configuration, not from this image.
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
# API calls stay same-origin: /api is routed to core by the same Caddy.
ENV VITE_CORE_API_URL=/api
RUN npm run build

FROM caddy:2-alpine

COPY --from=build /app/dist /srv
