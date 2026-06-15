FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist
COPY data ./data

EXPOSE 5000

CMD ["npm", "start"]
