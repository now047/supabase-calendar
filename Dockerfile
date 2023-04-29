FROM node:slim AS builder

WORKDIR /app
COPY package.json package-lock.json ./
COPY public/ public/
COPY src/ src/
COPY craco.config.js tsconfig.json tailwind.config.js ./
RUN apt-get update && apt-get install -y python3 make g++
RUN npm ci
RUN npm run build

FROM nginx:1.23.2-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/build /usr/share/nginx/html
RUN touch /var/run/nginx.pid
RUN chown -R nginx:nginx /var/run/nginx.pid /usr/share/nginx/html /var/cache/nginx /var/log/nginx /etc/nginx/conf.d
USER nginx
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
