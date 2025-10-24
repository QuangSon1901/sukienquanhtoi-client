# 🎉 Sự Kiện Quanh Tôi - Event Map Application

Next.js application hiển thị bản đồ sự kiện với Docker support.

## 📋 Yêu Cầu Hệ Thống

- Docker >= 20.10
- Docker Compose >= 2.0
- Git
- Make (optional, để dùng Makefile commands)

## 🚀 Cài Đặt & Khởi Động

### Lần Đầu Setup
```bash
# Clone repo
git clone <repo-url>
cd <project-folder>

# Setup tự động (tạo thư mục, build, start development)
make setup

# Hoặc manual
chmod +x setup.sh
./setup.sh
```

---

## 💻 Development Mode

### Start Development
```bash
# Khởi động development
make up
# hoặc
docker-compose up -d

# Xem logs
make logs

# Visit: http://localhost:3000
```

### Các Lệnh Development Thường Dùng
```bash
# Stop development
make down

# Restart
make restart

# Install dependencies
make install

# Build Next.js (trong container)
make build-app

# Vào shell container
make shell

# Rebuild từ đầu nếu có vấn đề
make rebuild
```

### Cấu Trúc Development

- **Port**: 3000
- **Hot reload**: Enabled (code changes tự động reload)
- **Volumes**: Code được mount vào container
- **Node modules**: Isolated trong container

---

## 🚢 Production Mode

### Deploy Production Lần Đầu
```bash
# Cách 1: Dùng script tự động
chmod +x deploy-prod.sh
./deploy-prod.sh

# Cách 2: Dùng Makefile
make deploy

# Cách 3: Manual
docker-compose --profile production build --no-cache
docker-compose --profile production up -d
```

### Update Code Trên Production
```bash
# Khi đã push code mới lên Git
git pull
make prod-update

# Hoặc manual:
git pull
docker-compose --profile production down
docker-compose --profile production build --no-cache
docker-compose --profile production up -d
```

### Các Lệnh Production Thường Dùng
```bash
# Start production
make prod

# Stop production
make prod-down

# Restart production
make prod-restart

# Xem logs
make prod-logs

# Rebuild production từ đầu
make prod-rebuild

# Vào shell production
make prod-shell
```

### Cấu Trúc Production

- **Port**: 80 (Nginx) → 3001 (Next.js)
- **Build**: Standalone output (optimized)
- **Nginx**: Reverse proxy với caching
- **No volumes**: Code được COPY vào image khi build

---

## 🔧 Troubleshooting

### Web không update sau khi push code
```bash
# Rebuild production hoàn toàn
make prod-rebuild

# Clear browser cache: Ctrl + Shift + R (hoặc Cmd + Shift + R trên Mac)
```

### Permission denied errors
```bash
# Vào container với root
make prod-shell-root

# Fix permissions
chown -R nextjs:nodejs /app
```

### Container không start
```bash
# Xem logs chi tiết
make prod-logs

# Kiểm tra status
make ps

# Rebuild từ đầu
make clean
make prod-build
make prod
```

### Next.js không tìm thấy app directory
```bash
# Đảm bảo code đã được copy vào image
make prod-shell
ls -la /app/app

# Nếu không có → rebuild
make prod-rebuild
```

### Cache issues (web không update)
```bash
# 1. Hard refresh browser: Ctrl + Shift + R
# 2. Rebuild production image
make prod-rebuild
# 3. Clear Docker build cache
docker builder prune -af
make prod-rebuild
```

---

## 📁 Cấu Trúc Thư Mục
```
project/
├── app/                        # Next.js App Router (routes)
│   ├── layout.tsx
│   ├── page.tsx
│   └── api/
├── components/                 # React components
├── public/                     # Static files
├── docker/
│   ├── app/
│   │   └── Dockerfile          # Development
│   ├── app-prod/
│   │   └── Dockerfile          # Production (standalone build)
│   └── nginx/
│       ├── Dockerfile
│       └── default.conf        # Nginx config
├── data/
│   └── events.json             # Data file (mounted read-only)
├── docker-compose.yml
├── Makefile
├── setup.sh
├── deploy-prod.sh
├── next.config.mjs             # Next.js config với output: 'standalone'
├── package.json
├── tailwind.config.ts
└── README.md
```

---

## 🌐 URLs

- **Development**: http://localhost:3000
- **Production**: http://localhost (port 80)
- **Production Direct**: http://localhost:3001 (bypass Nginx)

---

## 📦 Backup & Restore
```bash
# Backup data
make backup

# Restore từ backup
make restore file=backups/events_20250124_120000.json
```

---

## 🛠️ Workflow Khuyên Dùng

### Local Development

1. Clone repo
2. `make setup` (lần đầu)
3. Code & test trong folder `app/`, `components/`
4. `make logs` để debug
5. Push lên Git

### Deploy Production

1. SSH vào server production
2. `cd /path/to/project`
3. `git pull` (pull code mới)
4. `make prod-update` (rebuild & restart)
5. Check logs: `make prod-logs`
6. Visit website và test

### Hot Fix Production
```bash
# 1. Fix code locally
git add .
git commit -m "fix: something"
git push

# 2. Trên server production
ssh user@server
cd /path/to/project
git pull
make prod-rebuild  # Rebuild nhanh & khởi động lại
```

### Khi Gặp Vấn đề Cache
```bash
# Trên server production
make prod-down
docker builder prune -af  # Xóa build cache
make prod-rebuild
```

---

## 🔐 Security Notes

- Production chạy với user `nextjs` (non-root)
- Data folder mount read-only (`:ro`)
- Nginx làm reverse proxy và handle caching
- Environment variables được isolate giữa dev và prod

---

## 🐛 Common Issues

### 1. "Couldn't find any pages or app directory"

**Nguyên nhân**: Code chưa được copy vào container

**Giải pháp**:
```bash
make prod-rebuild
```

### 2. Web hiển thị code cũ sau khi deploy

**Nguyên nhân**: Browser cache hoặc Next.js build cache

**Giải pháp**:
```bash
# 1. Hard refresh browser
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)

# 2. Rebuild production
make prod-rebuild
```

### 3. Permission denied khi npm install

**Nguyên nhân**: File permissions không đúng

**Giải pháp**:
```bash
make prod-shell-root
chown -R nextjs:nodejs /app
```

### 4. Port 80 already in use

**Nguyên nhân**: Nginx hoặc service khác đang dùng port 80

**Giải pháp**:
```bash
# Check process đang dùng port 80
sudo lsof -i :80

# Stop nginx system
sudo systemctl stop nginx

# Hoặc đổi port trong docker-compose.yml
ports:
  - "8080:80"  # Dùng port 8080 thay vì 80
```

---

## 📞 Support

Nếu gặp vấn đề:

1. Check logs: `make prod-logs`
2. Check container status: `make ps`
3. Kiểm tra code trong container: `make prod-shell` → `ls -la /app/app`
4. Rebuild: `make prod-rebuild`
5. Contact: [your-contact]

---

## 📝 Commands Cheat Sheet

### Development
| Command | Description |
|---------|-------------|
| `make help` | Xem tất cả commands |
| `make setup` | Setup lần đầu |
| `make up` | Start development |
| `make down` | Stop development |
| `make restart` | Restart development |
| `make logs` | Xem logs |
| `make shell` | Vào shell container |
| `make install` | Install dependencies |
| `make rebuild` | Rebuild development |

### Production
| Command | Description |
|---------|-------------|
| `make deploy` | Deploy production (script) |
| `make prod` | Start production |
| `make prod-down` | Stop production |
| `make prod-restart` | Restart production |
| `make prod-logs` | Xem production logs |
| `make prod-shell` | Vào shell production |
| `make prod-update` | Update code & redeploy |
| `make prod-rebuild` | Rebuild production từ đầu |

### Utilities
| Command | Description |
|---------|-------------|
| `make ps` | Xem status containers |
| `make stats` | Xem resource usage |
| `make backup` | Backup data |
| `make clean` | Clean all |

---

## 🚀 Quick Start Guide

### Development (Local)
```bash
make setup    # Lần đầu
make up       # Start
make logs     # Check logs
```

### Production (Server)
```bash
# Lần đầu deploy
git clone <repo>
cd <project>
make deploy

# Update code
git pull
make prod-update

# Emergency rebuild
make prod-rebuild
```

---

## ⚡ Performance Tips

1. **Nginx caching**: Static files được cache 1 năm
2. **Standalone build**: Image size nhỏ hơn ~50%
3. **Multi-stage build**: Chỉ copy files cần thiết
4. **Production mode**: React optimizations enabled

---

## 📚 Additional Resources

- Next.js Docs: https://nextjs.org/docs
- Docker Docs: https://docs.docker.com
- Docker Compose: https://docs.docker.com/compose