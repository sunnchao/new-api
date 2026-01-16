# 订阅资源包功能集成文档

## 一、功能概述

### 1.1 功能简介

订阅资源包（Packages Subscription）是一个完整的订阅制计费系统，允许用户购买包含固定额度的服务套餐。该功能支持多种服务类型，实现订阅优先扣费、多订阅叠加、混合计费等高级特性。

### 1.2 核心特性

- **多服务类型支持**：claude_code、codex_code、gemini_code
- **灵活的套餐配置**：支持按天/周/月/季度计费，或永久有效
- **额度制计费**：套餐包含固定额度，用完即止
- **多订阅叠加**：用户可同时拥有多个订阅，系统优先消耗快过期的订阅
- **混合计费**：订阅额度用尽后自动降级使用普通余额
- **余额购买**：使用钱包余额直接购买套餐

### 1.3 适用场景

- 为特定 AI 服务（如 Claude Code）提供独立的订阅计费
- 企业用户批量购买固定额度的服务包
- 促销活动赠送限时体验套餐
- 区分不同服务等级的用户权益

### 1.4 技术架构

```
用户请求 → API 网关 → 权限验证 → 订阅检查 → 额度扣费 → 服务调用
                                    ↓
                            订阅额度充足？
                            ├── 是 → 从订阅扣费
                            └── 否 → 从余额扣费
```

---

## 二、数据库设计

> **重要说明**：数据库结构完全复用 one-api，已存在于数据库中，无需创建新表。

### 2.1 PackagesSubscription（订阅表）

存储用户的订阅记录，跟踪订阅状态和额度使用情况。

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | int | 主键，自增 |
| hash_id | string | 唯一标识，用于前端展示 |
| user_id | int | 用户ID，索引 |
| service_type | varchar(50) | 服务类型：claude_code/codex_code/gemini_code |
| plan_type | string | 套餐类型标识 |
| status | string | 状态：active/expired/cancelled/pending/exhausted |
| start_time | int64 | 开始时间戳 |
| end_time | int64 | 结束时间戳，索引 |
| auto_renew | bool | 是否自动续费 |
| total_quota | int | 总额度 |
| remain_quota | int | 剩余额度 |
| used_quota | int | 已使用额度 |
| price | float64 | 购买价格 |
| currency | string | 货币类型，默认 USD |
| payment_method | string | 支付方式 |
| order_id | string | 订单号，索引 |
| created_time | int64 | 创建时间 |
| updated_time | int64 | 更新时间 |
| client_fingerprint | string | 客户端指纹（暂不使用） |
| allowed_clients | string | 允许的客户端列表（暂不使用） |
| max_client_count | int | 最大客户端数量，默认3 |

**状态流转**：
- pending → active（支付成功）
- active → expired（到期）
- active → cancelled（用户取消）
- active → exhausted（额度用尽）

### 2.2 PackagesPlan（套餐表）

定义可购买的套餐配置信息。

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | int | 主键，自增 |
| hash_id | string | 唯一标识 |
| name | string | 套餐名称 |
| type | string | 套餐类型标识，唯一 |
| service_type | varchar(50) | 服务类型 |
| description | string | 套餐描述 |
| price | float64 | 价格 |
| currency | string | 货币类型 |
| total_quota | int | 包含的总额度 |
| max_client_count | int | 最大客户端数量 |
| is_unlimited_time | bool | 是否永久有效 |
| duration_months | int | 时长（月），兼容字段 |
| duration_unit | varchar(20) | 时长单位：day/week/month/quarter |
| duration_value | int | 时长数值 |
| features | json | 套餐特性，JSON格式 |
| is_active | bool | 是否启用 |
| show_in_portal | bool | 是否在前台显示 |
| sort_order | int | 排序顺序 |
| created_time | int64 | 创建时间 |
| updated_time | int64 | 更新时间 |

**时长单位说明**：
- day：天（86400秒）
- week：周（604800秒）
- month：月（2592000秒，约30天）
- quarter：季度（7776000秒，约90天）

### 2.3 PackagesUsageLog（使用日志表）

记录每次服务调用的详细信息。

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | int | 主键 |
| user_id | int | 用户ID |
| subscription_id | string | 订阅ID |
| request_type | string | 请求类型 |
| tokens_used | int | 消耗的Token数 |
| client_info | string | 客户端信息 |
| ip_address | string | IP地址 |
| user_agent | string | 用户代理 |
| created_time | int64 | 创建时间 |

---

## 三、JSON 字段处理方案

### 3.1 类型适配

one-api 使用 `database.JSONType[map[string]interface{}]` 处理 JSON 字段，而 new-api 使用 `JSONValue` 类型（定义在 `model/prefill_group.go`）。

### 3.2 适配策略

将 PackagesPlan 的 Features 字段从 `database.JSONType[map[string]interface{}]` 改为 `JSONValue`。

**修改说明**：复制 one-api 代码时，将 Features 字段类型声明替换为 `JSONValue`。

### 3.3 JSONValue 类型说明

new-api 的 JSONValue 类型已实现以下接口：
- driver.Valuer：支持数据库写入
- sql.Scanner：支持从数据库读取（兼容 []byte 和 string）
- json.Marshaler：JSON 序列化
- json.Unmarshaler：JSON 反序列化

---

## 四、核心业务逻辑

### 4.1 订阅购买流程

1. 用户选择套餐，发起购买请求
2. 系统验证套餐有效性和用户余额
3. 从用户余额扣除套餐价格对应的额度
4. 创建订阅记录，状态设为 active
5. 记录消费日志
6. 返回订阅信息

### 4.2 额度扣费机制

**订阅优先策略**：
1. 检查用户是否有对应服务类型的有效订阅
2. 获取所有有效订阅，按到期时间升序排序
3. 优先从快过期的订阅扣费
4. 单个订阅额度不足时，继续从下一个订阅扣费
5. 所有订阅额度不足时，剩余部分从普通余额扣费

**多订阅叠加逻辑**：
- 用户可同时拥有多个相同服务类型的订阅
- 系统自动选择最优扣费策略（优先消耗快过期的）
- 支持一次请求跨多个订阅扣费

**混合计费**：
- 订阅额度 + 普通余额可在一次请求中混合使用
- 记录日志时区分订阅消费和余额消费的比例

### 4.3 套餐授予机制

GrantPlanToUser 函数支持两种模式：

**叠加模式**（allowStack = true）：
- 检查用户是否有同类型的活跃订阅
- 如有，在原订阅基础上增加额度和时长
- 更新 total_quota、remain_quota、end_time

**独立模式**（allowStack = false）：
- 直接创建新的订阅记录
- 不影响现有订阅

### 4.4 订阅过期检查

定时任务每小时执行：
1. 查询所有 status = 'active' 且 end_time <= 当前时间的订阅
2. 将这些订阅的 status 更新为 'expired'
3. 记录日志

### 4.5 客户端验证

> **说明**：该功能暂不实现，相关字段已预留。

后续实现时需要：
- 验证客户端指纹
- 管理允许的客户端列表
- 限制最大客户端数量

---

## 五、API 接口规范

### 5.1 用户端接口

#### GET /api/user/packages/plans
获取可购买的套餐列表。

**权限要求**：用户登录

**请求参数**：无

**响应格式**：
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "hash_id": "xxx",
      "name": "基础套餐",
      "type": "basic",
      "service_type": "claude_code",
      "price": 10.0,
      "total_quota": 100000,
      "duration_unit": "month",
      "duration_value": 1
    }
  ]
}
```

---

#### GET /api/user/packages/subscriptions
获取用户的订阅列表。

**权限要求**：用户登录

**请求参数**：无

**响应格式**：
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "hash_id": "xxx",
      "service_type": "claude_code",
      "plan_type": "basic",
      "status": "active",
      "total_quota": 100000,
      "remain_quota": 50000,
      "end_time": 1234567890,
      "package_plan": {
        "type": "basic",
        "description": "基础套餐"
      }
    }
  ]
}
```

---

#### POST /api/user/packages/purchase
购买订阅套餐。

**权限要求**：用户登录

**请求参数**：
```json
{
  "plan_type": "basic",
  "hash_id": "xxx",
  "payment_method": "balance"
}
```

**业务逻辑**：
1. 验证套餐存在且可购买
2. 计算需要扣除的余额额度（price * QuotaPerUnit）
3. 验证用户余额充足
4. 扣除余额，创建订阅
5. 返回订阅信息

**响应格式**：
```json
{
  "success": true,
  "message": "订阅已使用余额支付并激活",
  "data": {
    "id": 1,
    "status": "active"
  }
}
```

---

#### POST /api/user/packages/cancel
取消订阅。

**权限要求**：用户登录

**请求参数**：
```json
{
  "hash_id": "xxx"
}
```

**业务逻辑**：
1. 验证订阅属于当前用户
2. 将订阅状态更新为 cancelled
3. 关闭自动续费

**响应格式**：
```json
{
  "success": true,
  "message": "订阅已取消"
}
```

---

#### GET /api/user/packages/usage-stats
获取使用统计。

**权限要求**：用户登录

**请求参数**：
- start_time: 开始时间戳（可选，默认30天前）
- end_time: 结束时间戳（可选，默认当前）

**响应格式**：
```json
{
  "success": true,
  "data": {
    "total_requests": 1234,
    "type_stats": [
      {
        "request_type": "chat",
        "count": 1000
      }
    ]
  }
}
```

---

### 5.2 管理端接口

#### GET /api/packages-admin/subscriptions
获取所有订阅列表（分页）。

**权限要求**：管理员

**请求参数**：
- page: 页码，默认1
- page_size: 每页数量，默认20
- user_id: 用户ID（可选，筛选条件）
- status: 状态（可选，筛选条件）
- service_type: 服务类型（可选，筛选条件）

**响应格式**：
```json
{
  "success": true,
  "data": [],
  "total": 100,
  "page": 1,
  "page_size": 20
}
```

---

#### GET /api/packages-admin/users/search
搜索用户（用于赠送订阅时选择用户）。

**权限要求**：管理员

**请求参数**：
- keyword: 搜索关键词（用户ID/用户名/邮箱）
- page: 页码
- page_size: 每页数量

---

#### POST /api/packages-admin/grant-subscription
管理员赠送订阅给用户。

**权限要求**：管理员

**请求参数**：
```json
{
  "user_id": 1,
  "plan_type": "basic",
  "allow_stack": false
}
```

---

#### DELETE /api/packages-admin/subscriptions/:id
删除/取消订阅。

**权限要求**：管理员

**路径参数**：
- id: 订阅ID

---

#### GET /api/packages-admin/plans
获取所有套餐列表（包含隐藏的）。

**权限要求**：管理员

---

#### GET /api/packages-admin/plans/:id
获取套餐详情。

**权限要求**：管理员

---

#### POST /api/packages-admin/plans
创建新套餐。

**权限要求**：管理员

**请求参数**：
```json
{
  "name": "高级套餐",
  "type": "premium",
  "service_type": "claude_code",
  "description": "包含更多额度",
  "price": 50.0,
  "total_quota": 500000,
  "duration_unit": "month",
  "duration_value": 1,
  "is_active": true,
  "show_in_portal": true
}
```

---

#### PUT /api/packages-admin/plans/:id
更新套餐。

**权限要求**：管理员

---

#### DELETE /api/packages-admin/plans/:id
删除套餐。

**权限要求**：管理员

**业务逻辑**：
- 检查是否有关联的订阅
- 有关联订阅时禁止删除

---

## 六、集成实施步骤

### 6.1 后端集成

#### 步骤 1：创建模型文件

**文件**：model/packages_subscription.go

**操作**：
1. 复制 one-api 的 model/packages_subscription.go
2. 修改包导入路径
3. 将 Features 字段类型从 database.JSONType 改为 JSONValue
4. 适配工具函数调用

**包路径替换清单**：

| one-api | new-api |
|---------|---------|
| one-api/common/logger | github.com/QuantumNous/new-api/logger |
| one-api/common/utils | github.com/QuantumNous/new-api/common |
| one-api/common/database | （移除，使用 JSONValue） |
| one-api/model | github.com/QuantumNous/new-api/model |

**工具函数映射**：

| one-api | new-api |
|---------|---------|
| utils.GetTimestamp() | common.GetTimestamp() |
| utils.GetUUID() | 需确认（可能是 common.GetUUID()） |
| logger.SysLog() | common.SysLog() |
| logger.SysError() | common.SysError() |

---

#### 步骤 2：数据库迁移配置

**文件**：model/main.go

**修改位置 1**：migrateDB() 函数

在 AutoMigrate 调用中添加三个模型：
- &PackagesSubscription{}
- &PackagesPlan{}
- &PackagesUsageLog{}

**修改位置 2**：migrateDBFast() 函数

在 migrations 切片中添加三个模型配置：
```go
{&PackagesSubscription{}, "PackagesSubscription"},
{&PackagesPlan{}, "PackagesPlan"},
{&PackagesUsageLog{}, "PackagesUsageLog"},
```

---

#### 步骤 3：创建控制器

**文件**：controller/packages.go

**操作**：
1. 复制 one-api 的 controller/packages.go
2. 修改包导入路径
3. 适配权限验证方式
4. 适配响应格式（确保使用 new-api 的 gin.H 格式）

**权限常量映射**（需确认）：

| one-api | new-api |
|---------|---------|
| config.RoleAdminUser | constant.RoleAdminUser 或 common.RoleAdminUser |

---

#### 步骤 4：路由配置

**文件**：router/api-router.go（或 router 包中的主路由文件）

**添加用户端路由组**：
```go
// 用户端套餐路由
packagesRoute := userRoute.Group("/packages")
packagesRoute.Use(middleware.UserAuth())
{
    packagesRoute.GET("/plans", controller.GetPackagesPlans)
    packagesRoute.GET("/subscriptions", controller.GetPackagesSubscription)
    packagesRoute.POST("/purchase", controller.PurchasePackagesSubscription)
    packagesRoute.POST("/cancel", controller.CancelPackagesSubscription)
    packagesRoute.GET("/usage-stats", controller.GetPackagesUsageStats)
}
```

**添加管理端路由组**：
```go
// 管理端套餐路由
packagesAdminRouter := router.Group("/api/packages-admin")
packagesAdminRouter.Use(middleware.AdminAuth())
{
    packagesAdminRouter.GET("/subscriptions", controller.GetAllPackagesSubscriptions)
    packagesAdminRouter.GET("/users/search", controller.AdminSearchUsers)
    packagesAdminRouter.POST("/grant-subscription", controller.AdminGrantPackagesSubscription)
    packagesAdminRouter.DELETE("/subscriptions/:id", controller.AdminCancelPackagesSubscription)
    
    packagesAdminRouter.GET("/plans", controller.GetPackagesPlans)
    packagesAdminRouter.GET("/plans/:id", controller.GetPackagesPlanById)
    packagesAdminRouter.POST("/plans", controller.CreatePackagesPlan)
    packagesAdminRouter.PUT("/plans/:id", controller.UpdatePackagesPlan)
    packagesAdminRouter.DELETE("/plans/:id", controller.DeletePackagesPlan)
}
```

---

#### 步骤 5：计费逻辑集成

**新建文件**：relay/helper/packages_quota.go

**功能**：
- 封装订阅检查逻辑
- 封装订阅扣费逻辑
- 提供钩子函数接口

**集成点**：
在 relay 层的计费逻辑中添加钩子调用，实现订阅优先、混合计费的逻辑。

**参考 one-api 的实现**：
- relay/relay_util/quota.go 中的订阅扣费逻辑
- 需要在 new-api 的对应位置添加类似逻辑

---

#### 步骤 6：初始化配置

**文件**：main.go

**修改位置**：InitResources() 函数

**添加内容**：
在函数末尾添加调用：
```go
model.InitPackagesPlans()
```

这将初始化默认的套餐配置（如果需要）。

---

### 6.2 定时任务配置

**检查 new-api 是否有现有的定时任务系统**：
- 查找 cron 相关代码
- 确定定时任务的集成方式

**如果需要添加 cron 系统**：
1. 引入依赖：github.com/robfig/cron/v3
2. 在 main.go 中初始化 cron
3. 添加任务

**任务 1：过期订阅检查**
- 执行频率：每小时（"0 * * * *"）
- 功能：调用 model.CheckExpiredPackagesSubscriptions()

**任务 2：到期提醒（可选）**
- 执行频率：每天上午9点（"0 9 * * *"）
- 功能：检查7天/3天/1天内到期的订阅，发送提醒

**任务 3：月度重置（可选）**
- 执行频率：每月1号（"0 0 1 * *"）
- 功能：调用 model.ResetMonthlyClaudeCodeUsage()

---

### 6.3 前端集成

#### Material-UI → Semi-UI 组件映射表

| Material-UI | Semi-UI | 说明 |
|-------------|---------|------|
| Card | Card | 卡片容器 |
| CardContent | Card（内置） | 卡片内容 |
| Button | Button | 按钮 |
| Typography | Typography | 文字排版 |
| Grid | Row/Col | 栅格布局 |
| Box | div + style | 布局容器 |
| Stack | Space | 间距布局 |
| Chip | Tag | 标签 |
| LinearProgress | Progress | 进度条 |
| CircularProgress | Spin | 加载动画 |
| Alert | Banner | 提示横幅 |
| Dialog | Modal | 弹窗 |
| DialogTitle | Modal.Header | 弹窗标题 |
| DialogContent | Modal.Content | 弹窗内容 |
| DialogActions | Modal.Footer | 弹窗操作区 |
| TextField | Input | 输入框 |
| Select | Select | 下拉选择 |
| MenuItem | Select.Option | 下拉选项 |
| Tabs | Tabs | 选项卡 |
| Tab | TabPane | 选项卡面板 |
| Divider | Divider | 分割线 |
| IconButton | Button + icon | 图标按钮 |
| FormControl | Form.Item | 表单项 |
| InputLabel | Form.Label | 表单标签 |

---

#### 页面结构

建议的文件结构：

```
web/src/
├── pages/
│   └── Subscriptions/
│       └── index.jsx           # 订阅管理主页面
├── components/
│   └── PackagesMenu/
│       └── index.jsx           # 顶部套餐菜单组件
└── locales/
    ├── zh/
    │   └── packages.json       # 中文翻译
    └── en/
        └── packages.json       # 英文翻译
```

---

#### 路由配置

**路由路径**：/panel/subscriptions

**添加位置**：在路由配置文件中添加新路由

**菜单位置**：用户面板侧边栏或顶部导航

---

#### 翻译键清单

需要添加的 i18n 键：

**菜单相关**：
- packages.menu.title - "套餐订阅"
- packages.menu.viewAll - "查看全部"
- packages.menu.noPlan - "暂无套餐"

**订阅相关**：
- packages.subscription.title - "我的订阅"
- packages.subscription.active - "生效中"
- packages.subscription.expired - "已过期"
- packages.subscription.cancelled - "已取消"

**套餐相关**：
- packages.plan.buy - "立即购买"
- packages.plan.price - "价格"
- packages.plan.quota - "额度"
- packages.plan.duration - "时长"

**操作相关**：
- packages.purchase.confirm - "确认购买"
- packages.purchase.success - "购买成功"
- packages.cancel.confirm - "确认取消"
- packages.cancel.success - "取消成功"

---

## 七、测试检查清单

### 7.1 后端测试

数据库相关：
- [ ] 数据库迁移正常执行，三个表创建成功
- [ ] 索引正确创建

API 接口测试：
- [ ] 套餐列表接口返回正确数据
- [ ] 用户订阅列表接口返回正确数据
- [ ] 购买流程正常完成
- [ ] 余额正确扣除
- [ ] 订阅记录正确创建
- [ ] 取消订阅流程正常工作
- [ ] 管理员接口权限验证正确
- [ ] 套餐CRUD操作正常
- [ ] 使用统计接口返回正确

定时任务：
- [ ] 订阅过期检查任务正常执行
- [ ] 过期订阅状态正确更新

### 7.2 前端测试

页面渲染：
- [ ] 套餐列表正确展示
- [ ] 订阅状态正确显示
- [ ] 余额显示正确
- [ ] 额度进度条正确显示

交互流程：
- [ ] 购买弹窗正常打开
- [ ] 余额不足提示正确
- [ ] 购买成功后列表自动刷新
- [ ] 取消订阅流程正常
- [ ] 错误提示正确显示

UI/UX：
- [ ] 响应式布局正确
- [ ] 移动端适配正常
- [ ] 多语言切换正常
- [ ] 组件样式正确

### 7.3 集成测试

完整流程：
- [ ] 用户注册 → 充值 → 购买订阅 → 使用服务 → 订阅过期
- [ ] 多订阅购买 → 叠加扣费测试
- [ ] 订阅额度用尽 → 自动降级使用余额
- [ ] 混合计费计算正确

边界情况：
- [ ] 余额不足时无法购买
- [ ] 订阅过期后无法使用
- [ ] 额度用尽后状态正确更新
- [ ] 并发购买订阅处理正确

---

## 八、文件修改清单

### 8.1 新增文件（零侵入）

| 文件路径 | 说明 | 行数估计 |
|----------|------|---------|
| model/packages_subscription.go | 订阅相关模型和业务逻辑 | ~700 行 |
| controller/packages.go | 订阅相关API控制器 | ~650 行 |
| relay/helper/packages_quota.go | 订阅计费辅助函数 | ~200 行 |
| web/src/pages/Subscriptions/index.jsx | 订阅管理页面 | ~400 行 |
| web/src/components/PackagesMenu/index.jsx | 套餐菜单组件 | ~200 行 |

### 8.2 修改文件（最小侵入）

| 文件路径 | 修改位置 | 修改内容 |
|----------|----------|----------|
| model/main.go | migrateDB() 函数 | 添加3个模型到 AutoMigrate |
| model/main.go | migrateDBFast() 函数 | 添加3个模型到 migrations 切片 |
| main.go | InitResources() 函数 | 添加 model.InitPackagesPlans() 调用 |
| router/api-router.go | SetRouter() 函数 | 添加用户端和管理端路由组 |
| relay 计费相关文件 | 计费逻辑处 | 添加订阅扣费钩子函数调用 |
| web/src/routes | 路由配置 | 添加 /panel/subscriptions 路由 |
| web/src/locales | 翻译文件 | 添加订阅相关翻译键 |

### 8.3 修改内容详细说明

**model/main.go 修改示例**：

migrateDB() 函数中：
```go
err := DB.AutoMigrate(
    &Channel{},
    &Token{},
    &User{},
    // ... 其他现有模型
    &PackagesSubscription{},  // 新增
    &PackagesPlan{},          // 新增
    &PackagesUsageLog{},      // 新增
)
```

migrateDBFast() 函数中：
```go
migrations := []struct {
    model interface{}
    name  string
}{
    // ... 其他现有模型
    {&PackagesSubscription{}, "PackagesSubscription"},  // 新增
    {&PackagesPlan{}, "PackagesPlan"},                  // 新增
    {&PackagesUsageLog{}, "PackagesUsageLog"},          // 新增
}
```

---

## 九、常见问题与注意事项

### 9.1 database.JSONType vs JSONValue

**问题**：one-api 的 database.JSONType 是泛型类型，new-api 使用 JSONValue（基于 json.RawMessage）。

**解决方案**：
- 将 PackagesPlan 结构体中的 Features 字段类型从 `database.JSONType[map[string]interface{}]` 改为 `JSONValue`
- JSONValue 已在 new-api 的 model/prefill_group.go 中定义
- 使用时需要进行 JSON 序列化/反序列化

**使用示例**：
```go
// 设置 Features
featuresMap := map[string]interface{}{
    "key1": "value1",
    "key2": 123,
}
featuresJSON, _ := json.Marshal(featuresMap)
plan.Features = JSONValue(featuresJSON)

// 读取 Features
var featuresMap map[string]interface{}
json.Unmarshal(plan.Features, &featuresMap)
```

### 9.2 包路径替换

**问题**：one-api 使用相对导入路径（如 "one-api/common"），new-api 使用完整的 Go module 路径。

**解决方案**：
复制代码时进行批量替换：
- one-api/common → github.com/QuantumNous/new-api/common
- one-api/model → github.com/QuantumNous/new-api/model
- one-api/controller → github.com/QuantumNous/new-api/controller

### 9.3 工具函数差异

**问题**：部分工具函数的包位置不同。

**解决方案**：
确认以下函数在 new-api 中的位置：
- utils.GetTimestamp() → common.GetTimestamp()
- utils.GetUUID() → 需要确认（可能在 common 包中）
- logger.SysLog() → common.SysLog()
- logger.SysError() → common.SysError()

### 9.4 权限常量位置

**问题**：one-api 的权限常量在 config 包，new-api 可能在不同位置。

**解决方案**：
在 new-api 中查找权限相关常量的定义位置：
- 可能在 constant 包
- 可能在 common 包
- 确认后进行替换

### 9.5 时间戳函数

**注意事项**：
确保使用 new-api 的 common.GetTimestamp() 函数获取时间戳，保持一致性。该函数通常返回 int64 类型的 Unix 时间戳。

### 9.6 UUID 生成

**注意事项**：
确认 new-api 中 UUID 生成函数的位置和名称。如果没有现成的函数，可能需要：
- 引入 github.com/google/uuid 包
- 或使用其他 UUID 生成方法

### 9.7 QuotaPerUnit 配置

**说明**：
QuotaPerUnit 是货币到额度的转换比率，用于计算余额购买时需要扣除的额度。

**使用位置**：
在 controller/packages.go 的购买逻辑中：
```go
costQuota := int(math.Round(plan.Price * QuotaPerUnit))
```

**获取方式**：
在 new-api 中查找 QuotaPerUnit 的定义位置（通常在 common 包或配置中）。

---

## 十、后续扩展规划

### 10.1 客户端指纹验证

**目标**：限制订阅可使用的设备数量。

**实现要点**：
- 实现 ClientFingerprint 结构体的验证逻辑
- 添加客户端注册和管理接口
- 在服务调用时验证客户端合法性
- 提供管理界面查看和管理授权设备

### 10.2 支付系统集成

**目标**：支持在线支付购买订阅。

**实现要点**：
- 对接第三方支付（Stripe、支付宝、微信支付等）
- 实现支付回调处理
- 支持多种支付方式
- 订单状态管理
- 退款处理

### 10.3 更多服务类型

**目标**：扩展支持更多 AI 服务的订阅。

**实现要点**：
- 添加新的服务类型常量
- 为每种服务类型配置独立的套餐
- 支持不同服务类型的独立计费规则
- 提供服务类型的使用统计

### 10.4 订阅分析报表

**目标**：提供订阅业务的数据分析。

**实现要点**：
- 订阅转化率统计
- 收入分析（按时间、套餐类型等维度）
- 用户留存分析
- 套餐使用率统计
- 可视化图表展示

### 10.5 优惠券和促销

**目标**：支持优惠券和促销活动。

**实现要点**：
- 优惠券生成和管理
- 折扣码系统
- 限时促销活动
- 邀请奖励机制
- 批量发放优惠券

---

## 附录：关键代码片段参考

### A.1 订阅扣费核心逻辑（参考）

来自 one-api 的 relay/relay_util/quota.go：

```go
// 检查是否使用订阅
if q.useSubscription && quota > 0 && q.packageServiceType != "" {
    // 获取所有活跃订阅，按到期时间升序
    subscriptions, err := model.GetUserActivePackagesSubscriptions(
        q.userId, 
        q.packageServiceType, 
        true,
    )
    
    if err == nil && len(subscriptions) > 0 {
        remainingQuota := quota
        
        // 依次从订阅中扣费
        for i := range subscriptions {
            if remainingQuota <= 0 {
                break
            }
            
            sub := &subscriptions[i]
            deductQuota := remainingQuota
            if sub.RemainQuota < deductQuota {
                deductQuota = sub.RemainQuota
            }
            
            // 从该订阅扣费
            err := model.UpdateClaudeCodeUsage(sub.Id, deductQuota)
            if err == nil {
                q.subscriptionQuota += deductQuota
                remainingQuota -= deductQuota
            }
        }
        
        // 如果订阅额度充足
        if remainingQuota <= 0 {
            q.subscriptionHandled = true
            return nil
        }
        
        // 剩余部分从普通余额扣费
        q.quotaFromBalance = remainingQuota
        quota = remainingQuota
    }
}
```

### A.2 套餐时长计算（参考）

```go
func (plan *PackagesPlan) DurationSeconds() int64 {
    if plan == nil {
        return 0
    }
    plan.NormalizeDurationFields()
    
    baseSeconds, ok := durationUnitToSeconds[plan.DurationUnit]
    if !ok {
        baseSeconds = durationUnitToSeconds[DurationUnitMonth]
    }
    
    return int64(plan.DurationValue) * baseSeconds
}
```

---

## 文档版本

- **版本**: 1.0
- **创建日期**: 2025-01-15
- **最后更新**: 2025-01-15
- **维护者**: AI Assistant

---

**文档结束**
