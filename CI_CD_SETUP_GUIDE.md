# 🚀 CI/CD Pipeline Setup Guide (No-Docker / PM2 & Vercel)

This guide provides a clean, production-ready Continuous Integration (CI) and Continuous Deployment (CD) setup for your **Next.js 16 (React 19 + TypeScript 5 + Tailwind CSS v4)** application **without Docker**.

---

## 📌 1. Pipeline Architecture & Flowcharts

### 🔄 CI Pipeline Flow (Pull Requests & Branch Commits)
Runs on GitHub Actions to ensure bad or broken code is never merged:

```mermaid
flowchart TD
    A[Push / Pull Request to main or develop] --> B[GitHub Actions Runner: ubuntu-latest]
    B --> C[Checkout Code & Setup Node.js 20]
    C --> D[Restore npm & Next.js Build Cache]
    D --> E[npm ci: Clean Dependency Install]
    E --> F[npm run type-check: TypeScript Verification]
    F -->|Error Found| G[❌ Block PR & Notify Developer]
    F -->|Passes| H[npm run build: Production Build Check]
    H -->|Build Fails| G
    H -->|Passes| I[✅ CI Succeeded: Safe to Merge]
```

---

### 🚢 CD Pipeline Flow (Automatic Deployment via SSH + PM2)
Runs automatically whenever code is merged into `main`:

```mermaid
flowchart TD
    A[Merge to main branch] --> B[Trigger CD Workflow on GitHub Actions]
    B --> C[Validate Type Checks & Build on Runner]
    C --> D[Securely SSH into Production VPS / Cloud Server]
    D --> E[Navigate to App Directory: cd /var/www/my-app]
    E --> F[git pull origin main -- Fetch Latest Code]
    F --> G[npm ci -- Install New Packages]
    G --> H[npm run build -- Next.js Production Build]
    H --> I[pm2 reload ecosystem.config.js --update-env]
    I --> J[🎉 Zero-Downtime Reload Complete!]
```

---

## 📁 2. Files in Your Project

| File Path | Description |
| :--- | :--- |
| [`.github/workflows/ci.yml`](file:///d:/cicd/front/.github/workflows/ci.yml) | Continuous Integration: Automated TypeScript check & build caching. |
| [`.github/workflows/cd-pm2.yml`](file:///d:/cicd/front/.github/workflows/cd-pm2.yml) | Continuous Deployment: Zero-downtime SSH deployment with PM2. |
| [`.github/workflows/cd-vercel.yml`](file:///d:/cicd/front/.github/workflows/cd-vercel.yml) | (Alternative) Serverless automated deployment to Vercel. |
| [`ecosystem.config.js`](file:///d:/cicd/front/ecosystem.config.js) | PM2 cluster configuration for Next.js (auto-restart, memory limit, zero downtime). |
| [`package.json`](file:///d:/cicd/front/package.json) | Includes `"type-check": "tsc --noEmit"` for CI verification. |

---

## 🛠️ 3. Step-by-Step Server & CI/CD Setup

### Step 1: Connect Your Project to GitHub

If you haven't pushed this repository to GitHub yet:

```bash
cd front
git init
git add .
git commit -m "feat: complete Next.js app with PM2 CI/CD pipeline"
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git
git push -u origin main
```

---

### Step 2: Configure GitHub Repository Secrets

Go to your GitHub repository -> **Settings** -> **Secrets and variables** -> **Actions** -> **New repository secret**:

| Secret Name | Description | Example Value |
| :--- | :--- | :--- |
| `SERVER_HOST` | Server Public IP or Domain | `198.51.100.1` or `yourdomain.com` |
| `SERVER_USER` | Server Login User | `ubuntu` or `root` |
| `SERVER_SSH_KEY` | Private SSH Key for Authentication | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `SERVER_PORT` | SSH Port (default is 22) | `22` |
| `APP_DIR` | Project folder path on your server | `/var/www/my-app` |

> [!TIP]
> **Creating a Dedicated Deploy Key**:
> Run on your computer or server:
> ```bash
> ssh-keygen -t ed25519 -C "github-actions-deploy" -f deploy_key
> ```
> 1. Copy `deploy_key.pub` into `~/.ssh/authorized_keys` on your server.
> 2. Copy the content of `deploy_key` into the `SERVER_SSH_KEY` GitHub secret.

---

### Step 3: Server Preparation (One-Time Setup on your VPS / Linux Server)

SSH into your Ubuntu/Debian server and run:

```bash
# 1. Update system packages
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js 20 LTS & Git
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git

# 3. Install PM2 globally
sudo npm install -g pm2

# 4. Create directory and clone project
sudo mkdir -p /var/www/my-app
sudo chown -R $USER:$USER /var/www/my-app
git clone https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git /var/www/my-app
cd /var/www/my-app

# 5. First-time install & launch
npm ci
npm run build
pm2 start ecosystem.config.js
pm2 save

# 6. Auto-start PM2 on system reboot
pm2 startup systemd
# (Copy and execute the command that PM2 prints on your terminal)
```

---

### Step 4: Reverse Proxy & Free SSL Setup (Nginx + Let's Encrypt)

Route incoming domain traffic (Port 80/443) to Next.js on port 3000:

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

Create `/etc/nginx/sites-available/next-app`:

```nginx
server {
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
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

Enable site and activate free SSL:

```bash
sudo ln -s /etc/nginx/sites-available/next-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Issue free SSL:
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## ⚡ 4. How PM2 Zero-Downtime Reload Works

In [`ecosystem.config.js`](file:///d:/cicd/front/ecosystem.config.js), Next.js runs in **cluster mode**:
```bash
pm2 reload ecosystem.config.js --update-env
```
- Instead of stopping the server (which causes 502 Bad Gateway errors), PM2 reloads worker processes one by one.
- In-flight HTTP requests are gracefully completed before a worker is recycled.
- Users never experience downtime during deployments!

---

## 🌐 5. Serverless Alternative: Vercel (No Server to Manage)

If you do not want to manage a VPS at all:
1. Push your repository to GitHub.
2. Link the repository directly on [Vercel](https://vercel.com).
3. Every Git push will automatically build and deploy serverlessly with zero server setup!
