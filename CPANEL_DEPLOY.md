# 🚀 Libertamedia - cPanel Deployment Guide

## ⚡ QUICK DEPLOY (5 menit)

### Step 1: SSH ke cPanel Server
```bash
ssh username@yourdomain.com
cd ~/public_html/libertamedia
```

### Step 2: Clone Repository
```bash
git clone https://github.com/ludgerusaja-eng/libertamedia.git .
git checkout improve/ui-accessibility-state-management
```

### Step 3: Setup Environment
```bash
# Copy env template
cp .env.example .env.production

# Edit dengan credentials Anda
nano .env.production
# Masukkan:
# GEMINI_API_KEY=your_key_here
# VITE_API_BASE_URL=https://yourdomain.com/api
# NODE_ENV=production
# PORT=3000
```

### Step 4: Install & Build
```bash
npm install
npm run build
```

### Step 5: Start Server
```bash
# Background process
NODE_ENV=production PORT=3000 nohup npm start > server.log 2>&1 &

# Verify
curl http://localhost:3000/api/health
```

---

## 📊 cPanel Autodeployment (Recommended)

### Using cPanel Git Integration

1. **Login ke cPanel → Clone Repository**
   - Go to cPanel → Version Control → Clone Repository
   - URL: `https://github.com/ludgerusaja-eng/libertamedia.git`
   - Branch: `improve/ui-accessibility-state-management`
   - Click Clone

2. **Setup Build Hook** (dalam cPanel)
   - After cloning, go to Repository Management
   - Click "Manage" pada repository
   - Setup deployment branch ke `improve/ui-accessibility-state-management`

### Automatic Redeploy Script

Create file: `/home/username/deploy.sh`

```bash
#!/bin/bash
cd ~/public_html/libertamedia
git pull origin improve/ui-accessibility-state-management
npm install
npm run build
pkill -f "node dist/server.cjs" || true
sleep 2
NODE_ENV=production PORT=3000 nohup npm start > server.log 2>&1 &
echo "✅ Deployed!"
```

Make executable:
```bash
chmod +x ~/deploy.sh
```

### Setup Cron Job untuk Auto Deploy

1. cPanel → Cron Jobs
2. Add new Cron Job:
   - Interval: Every 5 minutes
   - Command: `/bin/bash /home/username/deploy.sh`

Sekarang setiap 5 menit akan check untuk updates dan auto deploy!

---

## 🔄 Manual Deploy via Git Push

```bash
# Lokal, push ke branch
git add .
git commit -m "feat: update UI"
git push origin improve/ui-accessibility-state-management

# Di server (via SSH), pull & deploy
ssh username@yourdomain.com
cd ~/public_html/libertamedia
git pull origin improve/ui-accessibility-state-management
npm run build
pkill -f "node dist/server.cjs"
sleep 2
NODE_ENV=production PORT=3000 nohup npm start > server.log 2>&1 &
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
lsof -i :3000
kill -9 <PID>
```

### Check Server Status
```bash
ps aux | grep "node dist/server.cjs"
tail -f ~/public_html/libertamedia/server.log
```

### Restart Server
```bash
pkill -f "node dist/server.cjs"
sleep 2
NODE_ENV=production PORT=3000 nohup npm start > server.log 2>&1 &
```

### Check Health
```bash
curl http://localhost:3000/api/health
curl https://yourdomain.com/api/health
```

---

## ✅ Production Checklist

- [ ] Domain pointing ke cPanel
- [ ] SSL certificate installed
- [ ] Node.js 18+ installed via cPanel
- [ ] `.env.production` configured with GEMINI_API_KEY
- [ ] Build successful (`npm run build`)
- [ ] Server running (`curl http://localhost:3000/api/health`)
- [ ] Accessible via domain (`curl https://yourdomain.com/api/health`)
- [ ] Logs being generated (`tail -f server.log`)

---

## 📈 Monitoring

### Real-time Logs
```bash
tail -f ~/public_html/libertamedia/server.log
```

### API Stats
```bash
curl https://yourdomain.com/api/stats
```

### RSS Feed
```bash
curl https://yourdomain.com/rss.xml
```

---

## 🎯 Next: Merge to Main

Setelah semua working di staging, merge ke main:

```bash
git checkout main
git merge improve/ui-accessibility-state-management
git push origin main
```

Selesai! 🎉
