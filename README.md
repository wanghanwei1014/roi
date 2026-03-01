# 广告 ROI 数据分析系统

基于真实移动应用广告投放数据的 ROI 多时间维度趋势分析系统，支持数据筛选、移动平均、预测分析和交互式图表可视化。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 14 + React 18 + TypeScript + TailwindCSS + Recharts |
| 后端 | Node.js 18+ + Express.js + TypeScript |
| 数据库 | MySQL 8.0+ |
| UI 组件 | Radix UI（ShadCN 风格） |

## 快速启动

### 1. 安装依赖

```bash
# 后端
cd backend
npm install

# 前端
cd ../frontend
npm install
```

### 2. 配置数据库

确保 MySQL 已启动，然后创建数据库：

```bash
mysql -u root -p < backend/init.sql
```

或在 MySQL 客户端中执行 `backend/init.sql` 脚本。

### 3. 启动服务

```bash
# 终端1 - 启动后端 (端口 3001)
cd backend
npm run dev

# 终端2 - 启动前端 (端口 3000)
cd frontend
npm run dev
```

### 4. 导入数据

后端启动后，通过 API 导入 CSV 数据：

```bash
# 方式1: 通过 API 导入
curl -X POST http://localhost:3001/api/import

# 方式2: 通过脚本导入
cd backend
npm run import-csv
```

### 5. 访问系统

打开浏览器访问 http://localhost:3000

## 核心功能

- **多维度 ROI 趋势图**：当日、1日、3日、7日、14日、30日、60日、90日
- **筛选控制**：按应用、国家、出价类型筛选
- **移动平均线**：7日移动平均平滑趋势
- **ROI 预测**：基于线性回归的短期预测（虚线显示）
- **100% 回本线**：红色参考线标注回本阈值
- **对数/线性刻度切换**：适应不同数据量级
- **暗色模式**：支持亮色/暗色主题切换
- **响应式设计**：适配桌面端和移动端
- **智能 0% 处理**：区分真实 0% 和日期不足 0%

## 项目结构

```
roi1/
├── backend/          # Express.js 后端 API 服务
├── frontend/         # Next.js 14 前端应用
├── app_roi_data.csv  # 原始数据文件
├── README.md         # 本文件
├── DESIGN.md         # 系统设计文档
├── USER_GUIDE.md     # 用户使用指南
└── DEPLOYMENT.md     # 部署说明文档
```

## 环境变量

### 后端 (backend/.env)

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=roi_analysis
PORT=3001
```

### 前端 (frontend/.env.local)

```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## 相关文档

- [系统设计文档](DESIGN.md)
- [用户使用指南](USER_GUIDE.md)
- [部署说明文档](DEPLOYMENT.md)
