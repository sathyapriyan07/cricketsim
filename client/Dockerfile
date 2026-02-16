FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
COPY client ./client
RUN npm install
RUN npm run build -w client

FROM nginx:stable-alpine
COPY --from=build /app/client/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
