FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist
COPY data ./data 2>/dev/null || true

EXPOSE 5000

CMD ["npm", "start"]
