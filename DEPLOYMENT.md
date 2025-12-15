# 🚀 Production Deployment Guide

Guide for deploying the AI Maternal & Child Health Tracker to production.

## 🎯 Prerequisites

- Production PostgreSQL database
- Node.js 18+ on server
- Domain name with SSL certificate
- Hugging Face API key: `your_huggingface_api_key_here`

## 🔧 Environment Configuration

### Backend Production .env

```env
# Server
PORT=5000
NODE_ENV=production

# Database (use production database)
DATABASE_URL=postgresql://user:password@prod-host:5432/maternal_health

# Hugging Face AI
HUGGINGFACE_API_KEY=your_huggingface_api_key_here

# Security (generate new secure keys)
JWT_SECRET=your-very-long-random-secure-production-secret-key-here

# CORS (use production frontend URL)
CORS_ORIGIN=https://your-domain.com

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
```

### Frontend Production .env

```env
VITE_API_URL=https://api.your-domain.com/api
```

## 📦 Backend Deployment

### Option 1: Traditional Server

#### 1. Setup Server
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2
```

#### 2. Deploy Backend
```bash
# Clone or upload your code
cd /var/www/maternal-health-backend

# Install dependencies
npm install

# Build TypeScript
npm run build

# Setup environment
cp .env.example .env
nano .env  # Configure production values

# Run database migrations
npm run db:push

# Seed initial data
npm run seed

# Start with PM2
pm2 start npm --name "maternal-health-api" -- start
pm2 startup
pm2 save
```

#### 3. Setup Nginx Reverse Proxy
```nginx
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### 4. Setup SSL with Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.your-domain.com
```

### Option 2: Docker Deployment

#### 1. Create Backend Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

#### 2. Create docker-compose.prod.yml
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: maternal_health
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/maternal_health
      HUGGINGFACE_API_KEY: ${HF_API_KEY}
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: production
    ports:
      - "5000:5000"
    depends_on:
      - postgres
    restart: unless-stopped

volumes:
  postgres_data:
```

#### 3. Deploy with Docker
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Option 3: Cloud Platforms

#### Heroku
```bash
# Install Heroku CLI
heroku login

# Create app
heroku create maternal-health-api

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set HUGGINGFACE_API_KEY=your_huggingface_api_key_here
heroku config:set JWT_SECRET=your-secret-key
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

#### Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Link database
railway add postgresql

# Set environment variables via dashboard

# Deploy
railway up
```

#### DigitalOcean App Platform
1. Connect GitHub repository
2. Select Node.js environment
3. Add PostgreSQL database
4. Configure environment variables
5. Deploy

## 🎨 Frontend Deployment

### Option 1: Vercel (Recommended)

#### 1. Install Vercel CLI
```bash
npm install -g vercel
```

#### 2. Deploy
```bash
# Build
npm run build

# Deploy
vercel --prod

# Or connect GitHub for auto-deploy
```

#### 3. Configure Environment
Add in Vercel dashboard:
```
VITE_API_URL=https://api.your-domain.com/api
```

### Option 2: Netlify

#### 1. Install Netlify CLI
```bash
npm install -g netlify-cli
```

#### 2. Deploy
```bash
# Build
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

#### 3. Configure
Create `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Option 3: Traditional Server

```bash
# Build frontend
npm run build

# Upload dist/ folder to server
scp -r dist/* user@server:/var/www/maternal-health/

# Nginx configuration
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/maternal-health;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 🗄️ Database Setup

### PostgreSQL Production

#### 1. Create Database
```sql
CREATE DATABASE maternal_health;
CREATE USER maternal_user WITH ENCRYPTED PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE maternal_health TO maternal_user;
```

#### 2. Run Migrations
```bash
cd backend
npm run db:push
npm run seed
```

#### 3. Backup Strategy
```bash
# Daily backup cron job
0 2 * * * pg_dump -U maternal_user maternal_health > /backups/db-$(date +\%Y\%m\%d).sql
```

### Managed Database Services

- **AWS RDS**: PostgreSQL managed service
- **DigitalOcean Databases**: Managed PostgreSQL
- **Heroku Postgres**: Integrated PostgreSQL
- **Supabase**: PostgreSQL with extras

## 🔒 Security Checklist

### Backend
- [ ] Set strong `JWT_SECRET` (32+ characters random)
- [ ] Use HTTPS only
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Set secure headers
- [ ] Regular security updates
- [ ] Database connection encryption
- [ ] Environment variable security

### Frontend
- [ ] HTTPS only
- [ ] Content Security Policy
- [ ] XSS protection headers
- [ ] Secure cookies
- [ ] Regular dependency updates

### Database
- [ ] Strong passwords
- [ ] Network isolation
- [ ] Regular backups
- [ ] Encryption at rest
- [ ] Access logging
- [ ] Limited user permissions

## 📊 Monitoring

### Backend Monitoring
```bash
# PM2 monitoring
pm2 monit

# Logs
pm2 logs maternal-health-api

# Status
pm2 status
```

### Health Checks
```bash
# API health
curl https://api.your-domain.com/health

# Database connection
curl https://api.your-domain.com/api/analytics/dashboard
```

### Log Management
- Use PM2 logs for Node.js
- Setup log rotation
- Consider ELK stack or similar
- Monitor error rates

## 🚀 Performance Optimization

### Backend
- Enable compression
- Use Redis for caching
- Database connection pooling
- Rate limiting
- CDN for static assets

### Frontend
- Code splitting
- Lazy loading
- Image optimization
- Service workers
- CDN distribution

### Database
- Create indexes on frequently queried columns
- Regular VACUUM and ANALYZE
- Connection pooling
- Query optimization

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: cd backend && npm ci
      - run: cd backend && npm run build
      - run: cd backend && npm test
      # Deploy to your server

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      # Deploy to Vercel/Netlify
```

## 📈 Scaling

### Horizontal Scaling
- Load balancer (Nginx, AWS ELB)
- Multiple backend instances
- Database read replicas
- Redis for session management

### Vertical Scaling
- Increase server resources
- Database optimization
- Code optimization
- Caching strategies

## 🆘 Troubleshooting

### Backend Issues
```bash
# Check logs
pm2 logs maternal-health-api

# Restart service
pm2 restart maternal-health-api

# Database connection
npm run db:studio
```

### Frontend Issues
- Check browser console
- Verify API_URL environment variable
- Check CORS configuration
- Verify SSL certificates

## 📋 Maintenance

### Regular Tasks
- [ ] Weekly security updates
- [ ] Daily database backups
- [ ] Monthly log rotation
- [ ] Quarterly dependency updates
- [ ] Monitor disk space
- [ ] Check error logs
- [ ] Review performance metrics

### Updates
```bash
# Backend updates
cd backend
npm update
npm audit fix
npm run build
pm2 restart maternal-health-api

# Frontend updates
npm update
npm audit fix
npm run build
# Redeploy
```

## ✅ Deployment Checklist

- [ ] Production database created and configured
- [ ] Environment variables set correctly
- [ ] SSL certificates installed
- [ ] CORS configured for production domain
- [ ] JWT_SECRET changed from default
- [ ] Database migrations run
- [ ] Initial data seeded
- [ ] Health checks passing
- [ ] Monitoring setup
- [ ] Backup strategy in place
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Error logging setup
- [ ] Documentation updated

## 🎉 Post-Deployment

1. Test all features in production
2. Monitor error logs
3. Check performance metrics
4. Verify AI predictions working
5. Test CSV upload functionality
6. Verify authentication flow
7. Check database connections
8. Monitor API response times

---

**Your production deployment is complete! 🚀**

