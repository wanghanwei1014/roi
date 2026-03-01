# 系统设计文档

## 1. 系统整体架构

本系统采用前后端分离架构，前端使用 Next.js 14 进行客户端渲染（CSR），后端使用 Express.js 提供 RESTful API，数据存储在 MySQL 数据库中。

```
┌──────────────────────┐     HTTP/JSON     ┌──────────────────────┐     SQL      ┌─────────────┐
│   Frontend (Next.js) │ ◄──────────────► │  Backend (Express)    │ ◄──────────► │   MySQL     │
│   - React 18         │    Port 3000      │  - TypeScript         │   Port 3306  │   8.0+      │
│   - TailwindCSS      │    ←→ Port 3001   │  - RESTful API        │              │             │
│   - Recharts         │                   │  - CSV Import         │              │             │
└──────────────────────┘                   └──────────────────────┘              └─────────────┘
```

### 数据流向

```
CSV 文件 → 后端解析 → 数据清洗 → 计算 insufficient 标识 → 批量写入 MySQL
                                                                    ↓
前端 Recharts 渲染 ← API JSON 响应 ← 后端查询/计算移动平均/预测 ← MySQL 查询
```

## 2. 数据库设计

### 2.1 ER 图

系统使用单表设计 `roi_data`，因为数据来源单一且查询模式固定。

```
┌─────────────────────────────────────┐
│             roi_data                │
├─────────────────────────────────────┤
│ PK  id              INT AUTO_INC   │
│     date            DATE           │
│     day_of_week     VARCHAR(10)    │
│     app             VARCHAR(20)    │
│     bid_type        VARCHAR(10)    │
│     country         VARCHAR(20)    │
│     installs        INT            │
│     roi_day0        DECIMAL(10,2)  │
│     roi_day1        DECIMAL(10,2)  │
│     roi_day3        DECIMAL(10,2)  │
│     roi_day7        DECIMAL(10,2)  │
│     roi_day14       DECIMAL(10,2)  │
│     roi_day30       DECIMAL(10,2)  │
│     roi_day60       DECIMAL(10,2)  │
│     roi_day90       DECIMAL(10,2)  │
│     insufficient_day0  TINYINT(1)  │
│     insufficient_day1  TINYINT(1)  │
│     insufficient_day3  TINYINT(1)  │
│     insufficient_day7  TINYINT(1)  │
│     insufficient_day14 TINYINT(1)  │
│     insufficient_day30 TINYINT(1)  │
│     insufficient_day60 TINYINT(1)  │
│     insufficient_day90 TINYINT(1)  │
│     created_at      TIMESTAMP      │
├─────────────────────────────────────┤
│ IDX idx_app         (app)          │
│ IDX idx_country     (country)      │
│ IDX idx_date        (date)         │
│ IDX idx_app_country_date           │
│     (app, country, date)           │
└─────────────────────────────────────┘
```

### 2.2 设计说明

- **ROI 字段**：8 个 ROI 维度（当日~90日）使用 `DECIMAL(10,2)` 存储百分比数值
- **insufficient 标识**：每个 ROI 维度配对一个 `TINYINT(1)` 标识字段，用于区分"真实 0%"和"日期不足 0%"
- **判断逻辑**：数据截止日期为 2025-07-12，若 `投放日期 + N天 > 截止日期`，则该 ROI 周期标记为 insufficient
- **索引设计**：联合索引 `(app, country, date)` 覆盖最常用的筛选查询模式

## 3. API 接口设计规范

基础 URL: `http://localhost:3001/api`

### 3.1 获取筛选选项

```
GET /api/filters

Response 200:
{
  "success": true,
  "data": {
    "apps": ["App-1", "App-2", "App-3", "App-4", "App-5"],
    "countries": ["美国", "英国"],
    "bidTypes": ["CPI"]
  }
}
```

### 3.2 查询 ROI 数据

```
GET /api/roi-data?app=App-1&country=美国&mode=moving_avg&window=7

Query 参数:
  - app (必选): 应用名称
  - country (可选): 国家地区
  - bidType (可选): 出价类型
  - startDate (可选): 起始日期 YYYY-MM-DD
  - endDate (可选): 结束日期 YYYY-MM-DD
  - mode (可选): raw | moving_avg，默认 raw
  - window (可选): 移动平均窗口大小，默认 7

Response 200:
{
  "success": true,
  "data": [
    {
      "date": "2025-04-13",
      "app": "App-1",
      "country": "美国",
      "installs": 4849,
      "roi": {
        "day0":  { "value": 6.79,  "insufficient": false },
        "day1":  { "value": 14.24, "insufficient": false },
        ...
      }
    }
  ],
  "prediction": [
    {
      "date": "2025-07-13",
      "app": "App-1",
      "country": "美国",
      "installs": 0,
      "roi": { "day0": { "value": 8.5, "insufficient": false }, ... },
      "isPrediction": true
    }
  ],
  "meta": {
    "total": 91,
    "dateRange": ["2025-04-13", "2025-07-12"]
  }
}
```

### 3.3 导入 CSV 数据

```
POST /api/import

支持两种方式:
1. 无请求体 - 读取服务器上的 app_roi_data.csv
2. multipart/form-data - 上传 CSV 文件（字段名: file）

Response 200:
{
  "success": true,
  "message": "Successfully imported 910 records",
  "imported": 910
}
```

### 3.4 健康检查

```
GET /api/health

Response 200:
{
  "status": "ok",
  "timestamp": "2025-07-12T00:00:00.000Z"
}
```

## 4. 前端组件架构

```
App (layout.tsx)
├── ThemeProvider (next-themes)
└── Home (page.tsx)
    ├── Header
    │   ├── 页面标题（动态显示 App-X）
    │   ├── 副标题（显示模式 + 数据范围）
    │   └── ThemeToggle
    ├── FilterBar
    │   ├── Select - 用户安装渠道 (固定 Apple)
    │   ├── Select - 出价类型
    │   ├── Select - 国家地区
    │   └── Select - APP
    ├── ControlPanel
    │   ├── RadioGroup - 数据显示模式
    │   └── RadioGroup - Y轴刻度
    └── ROIChart
        ├── LineChart (Recharts)
        │   ├── 8x Line (ROI 趋势线)
        │   ├── ReferenceLine (100% 回本线)
        │   ├── CustomTooltip (悬停详情)
        │   └── Legend (可交互图例)
        └── ResponsiveContainer
```

### 关键组件说明

| 组件 | 文件 | 职责 |
|------|------|------|
| FilterBar | `components/FilterBar.tsx` | 渲染 4 个下拉筛选器，向父组件传递选中值 |
| ControlPanel | `components/ControlPanel.tsx` | 渲染显示模式和刻度类型的单选框控制 |
| ROIChart | `components/ROIChart.tsx` | 核心图表组件，渲染趋势线/回本线/预测/Tooltip/Legend |
| ThemeToggle | `components/ThemeToggle.tsx` | 亮色/暗色主题切换按钮 |
| useROIData | `hooks/useROIData.ts` | 自定义 Hook，管理所有状态和 API 调用 |

### 状态管理

使用 React Hooks + 自定义 Hook 模式，无需引入额外状态管理库：
- `useROIData` Hook 集中管理筛选参数、数据获取、加载状态
- 筛选参数变化自动触发 API 请求（通过 `useEffect` + `useCallback`）
- 图表 Line 显示/隐藏状态在 `ROIChart` 组件内部管理

## 5. 数据处理

### 5.1 CSV 数据清洗

- 日期格式：`2025-04-13(日)` → 分离日期 `2025-04-13` 和星期 `日`
- 百分比转换：`6.79%` → `6.79`，`1,280.47%` → `1280.47`
- 空值/异常值处理：无法解析时默认为 0

### 5.2 移动平均算法

采用居中移动平均（窗口大小默认 7）：
- 对每个日期取前后各 3 天的数据
- 排除 insufficient 标记的数据点
- 计算窗口内有效值的算术平均

### 5.3 预测算法

基于二次多项式回归（带曲率衰减）：
- 取最近 21 天有效数据作为训练集（不少于 5 个有效点）
- 对每个 ROI 维度独立拟合二次多项式 `y = c0 + c1*x + c2*x²`（数据不足 3 点时退化为线性回归）
- 预测时以训练集最后一个值为锚点，沿斜率和曲率向未来延伸
- 曲率随预测步长指数衰减（`exp(-0.06*h)`），防止远期预测发散
- 向未来延伸 7 天生成预测值
- 预测值下限为 0（不出现负值）
- 若数据末尾存在 insufficient 缺口，也会回填预测值
