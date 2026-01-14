# New-API 项目开发规范文档

本文档为 AI 编程助手和开发人员提供项目开发规范指南。

---

## 一、构建和测试命令

### 1.1 后端（Go）

**运行项目**
```bash
go run main.go
```

**构建可执行文件**
```bash
go build -o new-api main.go
```

**运行所有测试**
```bash
go test ./...
```

**运行单个测试文件**
```bash
go test ./relay/common/override_test.go
```

**运行特定测试函数**
```bash
go test -run TestApplyParamOverrideTrimPrefix ./relay/common/
```

**查看测试覆盖率**
```bash
go test -cover ./...
```

**生成覆盖率报告**
```bash
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out
```

**格式化代码**
```bash
go fmt ./...
```

**代码静态检查**
```bash
go vet ./...
```

### 1.2 前端（Bun + Vite）

**安装依赖**
```bash
cd web && bun install
```

**开发模式**
```bash
cd web && bun run dev
```

**构建生产版本**
```bash
cd web && bun run build
```

**预览构建结果**
```bash
cd web && bun run preview
```

**代码检查**
```bash
cd web && bun run lint
```

**代码格式化**
```bash
cd web && bun run lint:fix
```

**ESLint 检查**
```bash
cd web && bun run eslint
```

**ESLint 自动修复**
```bash
cd web && bun run eslint:fix
```

### 1.3 Docker

**构建镜像**
```bash
docker build -t new-api .
```

**运行容器**
```bash
docker run -p 3000:3000 new-api
```

**使用 Docker Compose**
```bash
docker-compose up -d
```

**停止服务**
```bash
docker-compose down
```

---

## 二、项目结构说明

### 2.1 后端目录结构

```
.
├── common/          # 公共工具函数和常量
├── constant/        # 常量定义
├── controller/      # HTTP 请求处理器（处理请求、返回响应）
├── dto/             # 数据传输对象
├── logger/          # 日志工具
├── middleware/      # Gin 中间件（认证、限流等）
├── model/           # 数据库模型和业务逻辑
├── pkg/             # 外部包封装
├── relay/           # API 中继和转发逻辑
│   ├── channel/     # 各渠道的具体实现
│   ├── common/      # 中继公共逻辑
│   └── helper/      # 辅助函数（价格计算、流处理等）
├── router/          # 路由配置
├── service/         # 业务服务层
├── setting/         # 配置管理
├── types/           # 类型定义
└── main.go          # 程序入口
```

### 2.2 前端目录结构

```
web/
├── src/
│   ├── components/  # 可复用组件
│   │   ├── auth/    # 认证相关组件
│   │   ├── common/  # 通用组件
│   │   ├── layout/  # 布局组件
│   │   ├── settings/ # 设置相关组件
│   │   └── table/   # 表格组件
│   ├── pages/       # 页面组件
│   ├── locales/     # 国际化文件
│   ├── utils/       # 工具函数
│   └── App.jsx      # 应用入口
├── public/          # 静态资源
└── package.json     # 依赖配置
```

### 2.3 核心模块职责

**controller**：处理 HTTP 请求，参数验证，调用 model/service，返回响应

**model**：数据库模型定义，CRUD 操作，业务逻辑封装

**service**：复杂业务逻辑，跨模块调用，外部服务集成

**middleware**：请求拦截，认证授权，日志记录，限流等

**relay**：API 请求转发，协议转换，负载均衡

---

## 三、Go 代码风格规范

### 3.1 Import 组织规则

采用**三段式组织**，每段之间空一行：

1. **标准库**（Go 官方包）
2. **项目内部包**（github.com/QuantumNous/new-api/...）
3. **第三方包**（其他外部依赖）

各段内部按字母顺序排列。

**示例**：
```go
import (
    // 标准库
    "context"
    "encoding/json"
    "fmt"
    "strings"
    
    // 项目内部包
    "github.com/QuantumNous/new-api/common"
    "github.com/QuantumNous/new-api/constant"
    "github.com/QuantumNous/new-api/model"
    
    // 第三方包
    "github.com/gin-gonic/gin"
    "gorm.io/gorm"
)
```

### 3.2 错误处理模式

**立即返回模式**：
- 检测到错误后立即返回
- 避免深层嵌套
- 正常逻辑保持在主流程

**示例**：
```go
func ProcessData(id int) (*Data, error) {
    // 错误立即返回
    if id <= 0 {
        return nil, errors.New("invalid id")
    }
    
    data, err := GetData(id)
    if err != nil {
        return nil, err
    }
    
    // 正常逻辑
    processedData := transform(data)
    return processedData, nil
}
```

**日志记录**：
- 使用 `common.SysLog()` 记录系统信息日志
- 使用 `common.SysError()` 记录错误日志
- 使用 `common.FatalLog()` 记录致命错误

**Controller 层错误响应**：
```go
if err != nil {
    c.JSON(http.StatusOK, gin.H{
        "success": false,
        "message": err.Error(),
    })
    return
}
```

### 3.3 命名约定

**变量命名**：camelCase
- 局部变量：`userId`, `channelData`, `startTime`
- 描述性命名：`enabledChannels`, `totalQuota`
- 单字母仅用于短作用域：`i`, `err`, `v`

**函数命名**：
- 导出函数：PascalCase（`GetUserById`, `UpdateChannel`）
- 非导出函数：camelCase（`parseStatus`, `validateInput`）
- 动词开头：`Get`, `Create`, `Update`, `Delete`, `Validate`, `Parse`

**结构体命名**：PascalCase
- 清晰描述实体：`Channel`, `User`, `PackagesSubscription`
- 避免缩写：`Config` 而非 `Cfg`

**常量命名**：PascalCase
- 清晰的语义：`ChannelStatusEnabled`, `RoleAdminUser`
- 分组定义：
```go
const (
    ChannelStatusUnknown  = 0
    ChannelStatusEnabled  = 1
    ChannelStatusDisabled = 2
)
```

**文件命名**：snake_case
- `packages_subscription.go`
- `user_operation.go`

### 3.4 注释风格

**函数注释**：
- 导出函数必须有注释
- 注释以函数名开头
- 简洁描述功能和参数

```go
// GetUserById 根据用户ID获取用户信息
// selectAll 为 true 时返回完整信息，否则不返回敏感字段
func GetUserById(id int, selectAll bool) (*User, error) {
    // ...
}
```

**复杂逻辑注释**：
```go
// 对于 Ollama 渠道，使用特殊处理
if channel.Type == constant.ChannelTypeOllama {
    // ...
}

// statusFilter: -1 all, 1 enabled, 0 disabled (include auto & manual)
statusFilter := parseStatusFilter(statusParam)
```

**中英文混用规范**：
- 支持中英文混用
- 优先使用中文便于理解
- 技术术语可使用英文

**TODO 标记**：
```go
// TODO: 实现支付回调验证
// FIXME: 修复并发情况下的竞态问题
```

### 3.5 常用代码模式

**Controller 模式**：
```go
func HandlerName(c *gin.Context) {
    // 1. 解析参数
    id, err := strconv.Atoi(c.Param("id"))
    if err != nil {
        c.JSON(http.StatusOK, gin.H{
            "success": false,
            "message": "参数错误",
        })
        return
    }
    
    // 2. 调用 Model/Service
    data, err := model.GetData(id)
    if err != nil {
        c.JSON(http.StatusOK, gin.H{
            "success": false,
            "message": err.Error(),
        })
        return
    }
    
    // 3. 返回响应
    c.JSON(http.StatusOK, gin.H{
        "success": true,
        "data":    data,
    })
    return // 显式 return
}
```

**Model 模式**：
```go
// 结构体定义
type Channel struct {
    Id     int    `json:"id"`
    Name   string `json:"name" gorm:"index"`
    Status int    `json:"status" gorm:"default:1"`
}

// CRUD 方法
func GetChannelById(id int) (*Channel, error) {
    channel := &Channel{Id: id}
    err := DB.First(channel, "id = ?", id).Error
    if err != nil {
        return nil, err
    }
    return channel, nil
}

func (c *Channel) Update() error {
    return DB.Save(c).Error
}
```

**Middleware 模式**：
```go
func AuthMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        // 验证逻辑
        token := c.GetHeader("Authorization")
        if token == "" {
            c.JSON(http.StatusUnauthorized, gin.H{
                "success": false,
                "message": "未授权",
            })
            c.Abort()
            return
        }
        
        // 设置上下文
        c.Set("user_id", userId)
        
        c.Next()
    }
}
```

---

## 四、数据库规范

### 4.1 GORM 使用规范

**模型定义**：
```go
type User struct {
    Id          int     `json:"id"`
    Username    string  `json:"username" gorm:"uniqueIndex"`
    Email       string  `json:"email" gorm:"index"`
    Role        int     `json:"role" gorm:"default:1"`
    Quota       int     `json:"quota" gorm:"default:0"`
    CreatedTime int64   `json:"created_time" gorm:"bigint"`
    DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}
```

**常用 GORM 标签**：
- `primaryKey`：主键
- `uniqueIndex`：唯一索引
- `index`：普通索引
- `default:value`：默认值
- `not null`：非空约束
- `type:varchar(100)`：指定数据库类型
- `column:name`：自定义列名
- `gorm:"-"`：忽略该字段

**JSON 字段处理**：
使用 new-api 的 `JSONValue` 类型（定义在 model/prefill_group.go）

```go
type Model struct {
    Config JSONValue `json:"config" gorm:"type:json"`
}
```

**时间字段**：
```go
CreatedTime int64 `json:"created_time" gorm:"bigint"`
UpdatedTime int64 `json:"updated_time" gorm:"bigint"`
```

**软删除**：
```go
DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
```

### 4.2 迁移规范

**添加新模型到 AutoMigrate**：

在 `model/main.go` 中：

1. **migrateDB() 函数**：
```go
func migrateDB() error {
    err := DB.AutoMigrate(
        &Channel{},
        &Token{},
        // ... 添加新模型
        &YourNewModel{},
    )
    return err
}
```

2. **migrateDBFast() 函数**：
```go
migrations := []struct {
    model interface{}
    name  string
}{
    {&Channel{}, "Channel"},
    {&Token{}, "Token"},
    // ... 添加新模型
    {&YourNewModel{}, "YourNewModel"},
}
```

### 4.3 查询规范

**条件查询**：
```go
// 单条件
DB.Where("status = ?", 1).Find(&channels)

// 多条件
DB.Where("status = ? AND type = ?", 1, 2).Find(&channels)

// IN 查询
DB.Where("id IN ?", []int{1, 2, 3}).Find(&channels)
```

**分页查询**：
```go
page := 1
pageSize := 20
offset := (page - 1) * pageSize

var total int64
DB.Model(&Channel{}).Count(&total)

var channels []Channel
DB.Offset(offset).Limit(pageSize).Find(&channels)
```

**预加载**：
```go
DB.Preload("User").Find(&channels)
```

**事务处理**：
```go
err := DB.Transaction(func(tx *gorm.DB) error {
    if err := tx.Create(&user).Error; err != nil {
        return err
    }
    if err := tx.Create(&profile).Error; err != nil {
        return err
    }
    return nil
})
```

---

## 五、API 设计规范

### 5.1 Gin 路由规范

**路由组织**：
```go
// 用户端路由
userRoute := router.Group("/api/user")
userRoute.Use(middleware.UserAuth())
{
    userRoute.GET("/profile", controller.GetProfile)
    userRoute.PUT("/profile", controller.UpdateProfile)
}

// 管理端路由
adminRoute := router.Group("/api/admin")
adminRoute.Use(middleware.AdminAuth())
{
    adminRoute.GET("/users", controller.GetUsers)
}
```

**RESTful 风格**：
- GET /api/resources - 获取列表
- GET /api/resources/:id - 获取单个
- POST /api/resources - 创建
- PUT /api/resources/:id - 更新
- DELETE /api/resources/:id - 删除

### 5.2 响应格式

**成功响应**：
```json
{
  "success": true,
  "message": "",
  "data": {}
}
```

**错误响应**：
```json
{
  "success": false,
  "message": "错误描述"
}
```

**分页响应**：
```json
{
  "success": true,
  "data": [],
  "total": 100,
  "page": 1,
  "page_size": 20
}
```

### 5.3 请求验证

**参数绑定**：
```go
type CreateUserRequest struct {
    Username string `json:"username" binding:"required"`
    Email    string `json:"email" binding:"required,email"`
    Age      int    `json:"age" binding:"gte=0,lte=120"`
}

var req CreateUserRequest
if err := c.ShouldBindJSON(&req); err != nil {
    c.JSON(http.StatusBadRequest, gin.H{
        "success": false,
        "message": err.Error(),
    })
    return
}
```

**常用验证标签**：
- `required`：必填
- `email`：邮箱格式
- `min=n`：最小值
- `max=n`：最大值
- `gte=n`：大于等于
- `lte=n`：小于等于

### 5.4 权限控制

**中间件使用**：
```go
// 需要用户登录
route.Use(middleware.UserAuth())

// 需要管理员权限
route.Use(middleware.AdminAuth())
```

**权限检查**：
```go
userId := c.GetInt("id")
role := c.GetInt("role")

if role < constant.RoleAdminUser {
    c.JSON(http.StatusForbidden, gin.H{
        "success": false,
        "message": "权限不足",
    })
    return
}
```

---

## 六、前端代码规范

### 6.1 Semi-UI 组件使用

**常用组件**：
- **Card**：卡片容器
- **Button**：按钮（type: primary/secondary/tertiary/warning/danger）
- **Modal**：弹窗
- **Table**：表格（支持分页、排序、筛选）
- **Form**：表单（Form.Input, Form.Select 等）
- **Toast**：轻提示
- **Banner**：通知横幅
- **Tag**：标签
- **Typography**：排版（Title, Text, Paragraph）
- **Space**：间距容器
- **Spin**：加载状态

**主题配置**：
项目使用 @douyinfe/semi-ui，支持明暗主题切换。

### 6.2 API 调用规范

**使用 API 工具函数**：
```javascript
import { API } from 'utils/api';

// GET 请求
const res = await API.get('/api/user/profile');

// POST 请求
const res = await API.post('/api/user/profile', {
  username: 'test'
});

// PUT 请求
const res = await API.put('/api/user/profile', data);

// DELETE 请求
const res = await API.delete('/api/user/profile');
```

**错误处理**：
```javascript
import { showError, showSuccess } from 'utils/common';

try {
  const res = await API.post('/api/endpoint', data);
  if (res.data.success) {
    showSuccess('操作成功');
  } else {
    showError(res.data.message);
  }
} catch (error) {
  showError('请求失败');
}
```

### 6.3 状态管理

**Redux 使用**（如果项目使用）：
```javascript
import { useSelector, useDispatch } from 'react-redux';

const user = useSelector((state) => state.account.user);
const dispatch = useDispatch();
```

**本地状态**：
```javascript
const [loading, setLoading] = useState(false);
const [data, setData] = useState([]);
```

### 6.4 国际化

**使用 i18n**：
```javascript
import { useTranslation } from 'react-i18next';

function Component() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('page.title')}</h1>
      <p>{t('page.description')}</p>
    </div>
  );
}
```

**翻译文件位置**：
- `web/src/locales/zh/` - 中文
- `web/src/locales/en/` - 英文

---

## 七、测试规范

### 7.1 Go 测试规范

**测试文件命名**：
- 与被测试文件放在同一目录
- 以 `_test.go` 结尾
- 例如：`channel.go` → `channel_test.go`

**测试函数命名**：
```go
func TestFunctionName(t *testing.T) {
    // 测试代码
}
```

**Table-Driven Tests**：
```go
func TestAdd(t *testing.T) {
    tests := []struct {
        name     string
        a, b     int
        expected int
    }{
        {"positive", 1, 2, 3},
        {"negative", -1, -2, -3},
        {"zero", 0, 0, 0},
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            result := Add(tt.a, tt.b)
            if result != tt.expected {
                t.Errorf("got %d, want %d", result, tt.expected)
            }
        })
    }
}
```

**断言**：
```go
if got != want {
    t.Errorf("got %v, want %v", got, want)
}

if err != nil {
    t.Fatalf("unexpected error: %v", err)
}
```

**辅助函数**：
```go
func assertJSONEqual(t *testing.T, want, got string) {
    t.Helper()
    // 断言逻辑
}
```

---

## 八、日志规范

### 8.1 日志函数

**系统日志**：
```go
common.SysLog("服务启动成功")
common.SysLog(fmt.Sprintf("监听端口: %d", port))
```

**错误日志**：
```go
common.SysError("数据库连接失败: " + err.Error())
```

**致命错误**：
```go
common.FatalLog("无法初始化数据库")
```

### 8.2 日志格式

**结构化日志**：
```go
logger.LogInfo(ctx, fmt.Sprintf("user_id=%d action=%s", userId, action))
```

### 8.3 敏感信息处理

**禁止记录**：
- API 密钥
- 用户密码
- Token 完整值
- 信用卡信息

**可记录的脱敏信息**：
```go
// Token 只记录前几位
maskedToken := token[:8] + "..."
common.SysLog(fmt.Sprintf("Token: %s", maskedToken))
```

---

## 九、Git 提交规范

### 9.1 Commit Message 格式

```
<类型>: <简短描述>

<详细说明（可选）>

<关联问题（可选）>
```

**类型**：
- `feat`: 新功能
- `fix`: 修复 Bug
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具相关

**示例**：
```
feat: 添加订阅资源包功能

- 实现套餐管理接口
- 实现订阅购买流程
- 添加订阅过期检查定时任务

Closes #123
```

### 9.2 分支命名规范

- `feature/xxx`：功能分支
- `fix/xxx`：修复分支
- `docs/xxx`：文档分支
- `refactor/xxx`：重构分支

### 9.3 PR 规范

**PR 标题**：简洁描述变更内容

**PR 描述**：
- 变更内容概述
- 相关 Issue
- 测试说明
- 注意事项

---

## 十、性能优化指南

### 10.1 数据库优化

**索引优化**：
- 为常用查询字段添加索引
- WHERE 条件字段
- JOIN 字段
- ORDER BY 字段

**避免 N+1 查询**：
```go
// 不好 - N+1 查询
for _, channel := range channels {
    user, _ := GetUserById(channel.UserId)
}

// 好 - 使用 Preload
DB.Preload("User").Find(&channels)
```

**批量操作**：
```go
// 批量插入
DB.CreateInBatches(users, 100)

// 批量更新
DB.Model(&User{}).Where("status = ?", 0).Update("status", 1)
```

### 10.2 缓存策略

**Redis 缓存**：
- 缓存热点数据
- 设置合理的过期时间
- 使用缓存穿透保护

**内存缓存**：
- 使用 sync.Map 或其他并发安全的 map
- 定期清理过期数据

### 10.3 并发控制

**Mutex 保护**：
```go
var mu sync.Mutex

func UpdateSharedData() {
    mu.Lock()
    defer mu.Unlock()
    // 修改共享数据
}
```

**Goroutine 池**：
```go
import "github.com/bytedance/gopkg/util/gopool"

gopool.Go(func() {
    // 异步任务
})
```

### 10.4 前端性能优化

**代码分割**：
- 使用 React.lazy 和 Suspense
- 路由级别的代码分割

**避免不必要的渲染**：
- 使用 React.memo
- 使用 useMemo 和 useCallback

**列表优化**：
- 虚拟滚动（大列表）
- 分页加载

---

## 十一、常用工具函数

### 11.1 时间处理

```go
// 获取当前时间戳
timestamp := common.GetTimestamp()

// 格式化时间
timeStr := time.Unix(timestamp, 0).Format("2006-01-02 15:04:05")
```

### 11.2 字符串处理

```go
// UUID 生成
uuid := common.GetUUID()

// 字符串拼接（性能优化）
var builder strings.Builder
builder.WriteString("part1")
builder.WriteString("part2")
result := builder.String()
```

### 11.3 数值计算

```go
import "math"

// 四舍五入
rounded := int(math.Round(float64Value))

// 向上取整
ceiling := int(math.Ceil(float64Value))
```

---

## 十二、安全规范

### 12.1 输入验证

- 所有用户输入必须验证
- 使用 binding 标签验证参数
- 防止 SQL 注入（使用参数化查询）

### 12.2 认证授权

- 所有敏感接口必须认证
- 使用中间件统一处理
- Token 安全存储

### 12.3 密码处理

```go
// 密码哈希
hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)

// 密码验证
err := bcrypt.CompareHashAndPassword(hashedPassword, []byte(inputPassword))
```

---

## 文档版本

- **版本**: 1.0
- **创建日期**: 2025-01-15
- **最后更新**: 2025-01-15
- **维护者**: AI Assistant

---

**文档结束**
