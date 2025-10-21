# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Install ALL deps (dev included) for Docusaurus build
COPY package*.json ./
RUN npm ci

# Copy the whole project (must include: docs, static, plugins, docusaurus.config.ts)
COPY . .

# Build static site (remark plugins run here)
ENV NODE_ENV=production
RUN npm run build

# Runtime stage (serve static files)
FROM nginx:alpine AS runtime
COPY --from=build /app/build /usr/share/nginx/html
# Optional: custom nginx config, caching, etc.