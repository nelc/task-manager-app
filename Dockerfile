# Multi-stage build for production-ready image

# Stage 1: Build frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Build backend and final image
FROM node:18-alpine
WORKDIR /app

# Install production dependencies for backend
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy backend code
COPY backend/ ./

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist ./public

# Create data directory for SQLite database
RUN mkdir -p /app/data && chown -R node:node /app

# Use non-root user
USER node

# Expose port 8080
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get({host:'127.0.0.1',port:8080,path:'/health',timeout:5000},(r)=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>{try{const j=JSON.parse(d);process.exit(j.status==='healthy'?0:1)}catch(e){process.exit(1)}})}).on('error',()=>process.exit(1))"

# Start the application
CMD ["node", "server.js"]

