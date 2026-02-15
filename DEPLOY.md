# 部署文档 - Ubuntu 环境

本文档提供了将 **Common Quiz** 项目部署到 Ubuntu 服务器的详细步骤。项目包含 Node.js 后端和 Vue 3 (Vite) 前端。

## 一、 环境要求

- **操作系统**: Ubuntu 20.04+ (建议)
- **Node.js**: v18.0.0+
- **Nginx**: 用于反向代理和静态资源托管
- **PM2**: 用于管理 Node.js 后端进程

---

## 二、 安装基础环境

在服务器上运行以下命令安装 Node.js 和 Nginx：

```bash
# 更新软件包
sudo apt update && sudo apt upgrade -y

# 安装 Node.js (使用 NodeSource)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 Nginx
sudo apt install -y nginx

# 安装 PM2
sudo npm install -y pm2 -g
```

---

## 三、 项目部署步骤

### 1. 克隆代码
```bash
cd /var/www
# 请替换为你的实际仓库地址
git clone <your-repository-url> common-quiz
cd common-quiz
```

### 2. 后端部署 (Backend)
```bash
cd backend
npm install

# 配置环境变量 (如有需要)
# cp .env.example .env
# nano .env

# 使用 PM2 启动后端
pm2 start index.js --name "quiz-backend"

# 设置 PM2 自启动
pm2 save
pm2 startup
```

### 3. 前端构建 (Frontend)
```bash
cd ../frontend
npm install

# 构建生产环境代码
npm run build
```
构建完成后，静态文件将生成在 `frontend/dist` 目录下。

---

## 四、 Nginx 配置

### 1. 创建配置文件
将项目根目录下的 `nginx.conf` 内容复制到 Nginx 配置中：

```bash
sudo nano /etc/nginx/sites-available/common-quiz
```

### 2. 启用配置并重启
```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/common-quiz /etc/nginx/sites-enabled/

# 测试配置是否正确
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

---

## 五、 常用命令

- **查看后端日志**: `pm2 logs quiz-backend`
- **重启后端**: `pm2 restart quiz-backend`
- **查看 Nginx 错误日志**: `sudo tail -f /var/log/nginx/error.log`
