# ===================================
# Stage 1: Build the App
# ===================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the web assets (Output goes to /app/dist)
RUN npm run build:web

# ===================================
# Stage 2: Serve with Nginx
# ===================================
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx config (for SPA routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 8001
EXPOSE 8001

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
