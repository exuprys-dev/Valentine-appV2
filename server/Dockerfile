# Production-ready Dockerfile for Express server
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --production

# Copy source
COPY . .

# Use PORT from env or default to 3000
ENV PORT 3000
EXPOSE 3000

CMD ["node", "index.js"]
