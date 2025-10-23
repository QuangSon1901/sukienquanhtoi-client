FROM node:20-alpine

# Cài đặt dependencies cần thiết
RUN apk add --no-cache \
    libc6-compat \
    git \
    curl

# Tạo thư mục làm việc
WORKDIR /app

# Copy package files từ root project
COPY package*.json ./

# Cài đặt dependencies
RUN npm ci || npm install

# Copy toàn bộ source code từ root project
COPY . .

# Tạo thư mục data nếu chưa có
RUN mkdir -p /app/data

# Expose port
EXPOSE 3000

# Development mode
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

# Start development server
CMD ["npm", "run", "dev"]