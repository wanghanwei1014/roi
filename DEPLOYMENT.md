# 部署说明文档

## 1. 环境依赖清单

| 依赖 | 最低版本 | 说明 |
|------|---------|------|
| Node.js | 18.0+ | JavaScript 运行环境 |
| npm | 9.0+ | 包管理器（随 Node.js 安装） |
| MySQL | 8.0+ | 关系型数据库 |

## 2. 数据库安装和配置

### 2.1 安装 MySQL

**Windows:**
从 https://dev.mysql.com/downloads/installer/ 下载安装包并安装。

**macOS:**
```bash
brew install mysql
brew services start mysql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

### 2.2 配置 MySQL

```bash
# 登录 MySQL
mysql -u root -p

# 创建数据库
CREATE DATABASE roi_analysis DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# （可选）创建专用用户
CREATE USER 'roi_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON roi_analysis.* TO 'roi_user'@'localhost';
FLUSH PRIVILEGES;
```

或直接执行初始化脚本：

```bash
mysql -u root -p < backend/init.sql
```

## 3. 项目安装步骤

### 3.1 克隆项目

```bash
git clone <repository-url>
cd roi1
```

### 3.2 安装后端依赖

```bash
cd backend
npm install
```

### 3.3 配置后端环境变量

创建 `backend/.env` 文件：

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=roi_analysis
PORT=3001
```

### 3.4 安装前端依赖

```bash
cd ../frontend
npm install
```

### 3.5 配置前端环境变量

创建 `frontend/.env.local` 文件：

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## 4. 数据库初始化和 CSV 数据导入

### 4.1 初始化数据表

启动后端服务时会自动创建数据表（如果不存在）。也可以手动执行：

```bash
mysql -u root -p roi_analysis < backend/init.sql
```

### 4.2 导入 CSV 数据

**方式一：命令行导入**

```bash
cd backend
npm run import-csv
```

**方式二：API 导入**

先启动后端服务，然后执行：

```bash
curl -X POST http://localhost:3001/api/import
```

导入成功后会显示 "Successfully imported 910 records"。

## 5. 项目启动方式

### 开发模式

```bash
# 终端 1 - 后端
cd backend
npm run dev
# 服务运行在 http://localhost:3001

# 终端 2 - 前端
cd frontend
npm run dev
# 应用运行在 http://localhost:3000
```

### 验证服务

```bash
# 检查后端健康状态
curl http://localhost:3001/api/health

# 检查数据是否已导入
curl "http://localhost:3001/api/filters"
```

## 6. 生产环境配置

### 6.1 构建项目

```bash
# 构建后端
cd backend
npm run build

# 构建前端
cd ../frontend
npm run build
```

### 6.2 生产环境变量

**后端 (.env):**
```env
DB_HOST=your_production_db_host
DB_PORT=3306
DB_USER=roi_user
DB_PASSWORD=strong_production_password
DB_NAME=roi_analysis
PORT=3001
NODE_ENV=production
```

**前端 (.env.local):**
```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
```

### 6.3 启动生产服务

```bash
# 后端
cd backend
npm start

# 前端
cd ../frontend
npm start
```

### 6.4 使用 PM2 管理进程（推荐）

```bash
npm install -g pm2

# 启动后端
cd backend
pm2 start dist/index.js --name roi-backend

# 启动前端
cd ../frontend
pm2 start npm --name roi-frontend -- start

# 查看状态
pm2 status

# 设置开机自启
pm2 save
pm2 startup
```

### 6.5 Nginx 反向代理配置（可选）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 后端 API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 7. 常见问题

### Q: 后端启动报数据库连接错误

确认 MySQL 服务已启动，检查 `.env` 中的数据库配置是否正确。

### Q: 前端显示"加载失败"

1. 确认后端服务正在运行（http://localhost:3001/api/health）
2. 确认已导入 CSV 数据
3. 检查 `frontend/.env.local` 中的 API 地址配置

### Q: 数据导入显示 0 条记录

确认 `app_roi_data.csv` 文件位于项目根目录下，且文件编码为 UTF-8。
