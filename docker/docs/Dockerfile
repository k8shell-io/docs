FROM node:20-alpine AS build
WORKDIR /app
COPY files/package*.json ./
RUN npm ci --omit=dev
COPY files/ ./
ENV NODE_ENV=production
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
RUN npm i -g serve@14
COPY --from=build /app/build ./build
EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"]
