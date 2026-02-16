FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
COPY server ./server
RUN npm install
EXPOSE 4000
CMD ["npm", "run", "start", "-w", "server"]
