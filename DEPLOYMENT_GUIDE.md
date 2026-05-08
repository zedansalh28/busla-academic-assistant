# Busla - Full System Deployment Guide

## 📋 Overview

This guide covers deployment of the complete Busla system:

- Backend: Node.js/Express with SQLite
- Frontend: Next.js React application
- Database: SQLite
- LLM: Cohere API

## 🏗️ System Requirements

### Minimum

- Node.js 16+
- 512MB RAM
- 100MB storage
- Internet connection for Cohere API

### Recommended

- Node.js 18+
- 2GB RAM
- 500MB storage
- HTTPS enabled

## 🚀 Local Deployment

### Step 1: Clone/Setup Project

```bash
cd /Users/marae/Desktop/final-project
```

### Step 2: Setup Backend

```bash
cd backend
npm install

# Configure environment
cp .env.example .env

# Edit .env with your settings:
# COHERE_API_KEY=your_api_key_here
# DATABASE_PATH=./data.db
# PORT=3001
# NODE_ENV=development

# Initialize database
npm run init-db

# Start backend
npm run dev
```

Backend will be available at: `http://localhost:3001`

### Step 3: Setup Frontend

```bash
cd ../frontend
npm install

# Configure environment
cp .env.local.example .env.local

# Update .env.local:
# NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Start frontend (development)
npm run dev

# OR build for production
npm run build
npm start
```

Frontend will be available at: `http://localhost:3000`

## 🌐 Production Deployment

### Backend Deployment (Heroku Example)

```bash
cd backend

# Create Heroku app
heroku create busla-api

# Set environment variables
heroku config:set COHERE_API_KEY=your_key
heroku config:set NODE_ENV=production
heroku config:set DATABASE_PATH=/tmp/busla.db

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

### Frontend Deployment (Vercel Example)

```bash
cd frontend

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variable
vercel env add NEXT_PUBLIC_API_URL https://busla-api.herokuapp.com/api

# Production deployment
vercel --prod
```

### Docker Deployment

#### Backend Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install --production

COPY . .
EXPOSE 3001

ENV NODE_ENV=production
CMD ["npm", "start"]
```

#### Frontend Dockerfile

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["npm", "start"]
```

#### docker-compose.yml

```yaml
version: "3.8"

services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      DATABASE_PATH: /data/busla.db
      COHERE_API_KEY: ${COHERE_API_KEY}
      NODE_ENV: production
    volumes:
      - busla_data:/data

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3001/api
    depends_on:
      - backend

volumes:
  busla_data:
```

Run with Docker:

```bash
docker-compose up -d
```

## 📦 Production Build

### Backend Build

```bash
cd backend

# Create production build
npm run build

# Verify build
npm start

# Test endpoints
curl http://localhost:3001/api/health
```

### Frontend Build

```bash
cd frontend

# Create production build
npm run build

# Test build
npm start

# Access at http://localhost:3000
```

## 🔧 Environment Variables

### Backend (.env)

```
# API Configuration
COHERE_API_KEY=your_cohere_api_key
NODE_ENV=production

# Database
DATABASE_PATH=./data.db

# Server
PORT=3001
HOST=0.0.0.0

# CORS
ALLOWED_ORIGINS=https://busla.app,https://www.busla.app

# Logging
LOG_LEVEL=info
```

### Frontend (.env.local)

```
# API Configuration
NEXT_PUBLIC_API_URL=https://api.busla.app/api

# Analytics (optional)
NEXT_PUBLIC_ANALYTICS_ID=your_id
```

## 📊 Database Management

### Backup Database

```bash
# SQLite backup
cp data.db data.db.backup

# Or use SQLite CLI
sqlite3 data.db ".backup data.db.backup"
```

### Restore Database

```bash
# Restore from backup
cp data.db.backup data.db

# Or restore with SQLite
sqlite3 data.db ".restore data.db.backup"
```

### Database Optimization

```bash
# Vacuum database
sqlite3 data.db "VACUUM;"

# Analyze database
sqlite3 data.db "ANALYZE;"

# Get size
ls -lh data.db
```

## 🔒 Security Checklist

- ✅ Use HTTPS in production
- ✅ Set strong Cohere API key
- ✅ Configure CORS properly
- ✅ Use environment variables for secrets
- ✅ Enable database encryption (optional)
- ✅ Regular backups
- ✅ Monitor API usage
- ✅ Rate limiting configured
- ✅ Input validation enabled
- ✅ Error logging without sensitive data

## 📈 Performance Optimization

### Backend

```javascript
// Enable compression
const compression = require("compression");
app.use(compression());

// Set up caching
app.set("etag", "strong");

// Connection pooling for database
```

### Frontend

```javascript
// Image optimization (Next.js automatic)
// Code splitting (Next.js automatic)
// CSS minification (Tailwind production)
// JavaScript minification (SWC)
```

### Database

```bash
# Index frequently queried columns
CREATE INDEX idx_user_id ON conversations(user_id);
CREATE INDEX idx_session_id ON messages(session_id);

# Vacuum and analyze
VACUUM;
ANALYZE;
```

## 🔍 Monitoring & Logging

### Backend Logging

```javascript
// Morgan for HTTP logging
const morgan = require("morgan");
app.use(morgan("combined"));

// Winston for app logging
const winston = require("winston");
```

### Frontend Monitoring

```javascript
// Sentry for error tracking
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### Health Checks

```bash
# Backend health
curl http://localhost:3001/api/health

# Frontend health (if implemented)
curl http://localhost:3000/api/health
```

## 🚨 Troubleshooting

### Port Already in Use

```bash
# Find process on port 3001
lsof -i :3001

# Kill process
kill -9 <PID>

# Or use different port
PORT=3002 npm start
```

### Database Lock

```bash
# Check database status
sqlite3 data.db "SELECT * FROM pragma_integrity_check();"

# Reset database if corrupted
rm data.db
npm run init-db
```

### API Connection Failed

```bash
# Check Cohere API key
curl https://api.cohere.ai/v1/check \
  -H "Authorization: Bearer $COHERE_API_KEY"

# Verify endpoint
curl http://localhost:3001/api/chat \
  -H "Content-Type: application/json"
```

### Frontend Build Error

```bash
# Clear cache
rm -rf .next

# Clear node_modules
rm -rf node_modules
npm install

# Rebuild
npm run build
```

## 📱 Scaling

### Horizontal Scaling

For multiple backend instances:

```javascript
// Use environment variable to balance load
const INSTANCE_ID = process.env.INSTANCE_ID;

// Store sessions in distributed cache
// Use Redis instead of in-memory store
```

### Database Scaling

```javascript
// For SQLite to PostgreSQL migration:
// 1. Export SQLite data
// 2. Create PostgreSQL schema
// 3. Migrate data
// 4. Update connection string
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy Busla

on: [push]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm run build
      - run: npm run deploy
        env:
          DEPLOY_TOKEN: ${{ secrets.DEPLOY_TOKEN }}
```

## 📊 Capacity Planning

### Storage

- Per user: ~1KB
- Per message: ~500B
- Per study plan: ~2KB
- 10,000 users with history: ~50MB

### Memory

- Node.js process: 100-300MB
- Frontend: Minimal (client-side)
- Database cache: Variable

### CPU

- Message processing: Low-Medium
- LLM API calls: Depends on Cohere
- Frontend build: Medium (one-time)

## 🎯 Performance Targets

- Backend response time: < 500ms
- Frontend load time: < 2s
- Chat message processing: < 1s
- Database query time: < 100ms

## 📞 Support

For issues:

1. Check logs: `npm run logs`
2. Test endpoints: `curl http://localhost:3001/api`
3. Verify environment: `printenv`
4. Check database: `sqlite3 data.db ".tables"`

## 📚 Additional Resources

- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Express Production](https://expressjs.com/en/advanced/best-practice-performance.html)
- [SQLite Optimization](https://www.sqlite.org/bestpractice.html)
- [Cohere API Docs](https://docs.cohere.ai/)

---

Deployment ready! 🚀
