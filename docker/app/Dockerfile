FROM node:20-alpine

# Install dependencies
RUN apk add --no-cache libc6-compat git curl

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm install

# Copy source code
COPY . .

# Create data directory
RUN mkdir -p /app/data

EXPOSE 3000

ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

CMD ["npm", "run", "dev"]