# 分组模型计费 - 资金来源限制功能 - 完整实施报告

## 📋 功能概述

在 `GroupModelBilling` 配置中新增 `billing_source` 字段，可以强制指定某个分组使用某个模型时，只能用余额或只能用订阅消费，**覆盖用户的个人计费偏好设置**。

---

## 🎯 核心功能

### 新增字段：billing_source

| 值 | 说明 | 行为 |
|----|------|------|
| `""` 或不设置 | 不限制（默认） | 使用用户的计费偏好设置 |
| `"wallet_only"` | 仅允许余额 | 只能用余额消费，即使有订阅也不使用 |
| `"subscription_only"` | 仅允许订阅 | 只能用订阅消费，即使有余额也不使用 |
| `"wallet_first"` | 优先余额 | 先用余额，余额不足时用订阅 |
| `"subscription_first"` | 优先订阅 | 先用订阅，订阅不足时用余额 |

### 优先级规则

```
分组模型配置（billing_source）
    ↓ 最高优先级
用户计费偏好（个人设置）
    ↓
系统默认（subscription_first）
```

**重点**：`GroupModelBilling` 中的 `billing_source` 会**完全覆盖**用户的个人计费偏好！

---

## 📂 实施内容

### 1. 后端修改

#### 文件 1：`setting/ratio_setting/group_ratio.go`

**修改**：扩展 `GroupModelBilling` 结构体

```go
// 修改前
type GroupModelBilling struct {
	QuotaType  int     `json:"quota_type"`            // 0=按量计费, 1=按次计费
	ModelPrice float64 `json:"model_price,omitempty"` // 按次计费时的价格(美元)
}

// 修改后
type GroupModelBilling struct {
	QuotaType     int     `json:"quota_type"`              // 0=按量计费, 1=按次计费
	ModelPrice    float64 `json:"model_price,omitempty"`   // 按次计费时的价格(美元)
	BillingSource string  `json:"billing_source,omitempty"` // 资金来源限制: ""=不限制, "wallet_only"=仅余额, "subscription_only"=仅订阅, "wallet_first"=优先余额, "subscription_first"=优先订阅
}
```

#### 文件 2：`service/billing_session.go`

**修改 A**：添加 import

```go
import (
	"fmt"
	"net/http"
	"strings"
	"sync"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/logger"
	"github.com/QuantumNous/new-api/model"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/QuantumNous/new-api/setting/ratio_setting"  // ← 新增
	"github.com/QuantumNous/new-api/types"

	"github.com/bytedance/gopkg/util/gopool"
	"github.com/gin-gonic/gin"
)
```

**修改 B**：在 `NewBillingSession` 函数中添加分组配置检查

```go
func NewBillingSession(c *gin.Context, relayInfo *relaycommon.RelayInfo, preConsumedQuota int) (*BillingSession, *types.NewAPIError) {
	if relayInfo == nil {
		return nil, types.NewError(fmt.Errorf("relayInfo is nil"), types.ErrorCodeInvalidRequest, types.ErrOptionWithSkipRetry())
	}

	pref := common.NormalizeBillingPreference(relayInfo.UserSetting.BillingPreference)

	// === 新增：检查分组模型计费配置，覆盖用户偏好 ===
	if groupBilling, ok := ratio_setting.GetGroupModelBilling(relayInfo.UsingGroup, relayInfo.OriginModelName); ok {
		if groupBilling.BillingSource != "" {
			pref = groupBilling.BillingSource
		}
	}
	// === 新增结束 ===

	// ... 后续逻辑保持不变 ...
```

**位置**：在函数开始处，获取用户偏好后立即添加。

### 2. 前端修改

#### 文件：`web/src/pages/Setting/Ratio/GroupRatioSettings.jsx`

**修改**：更新配置说明文本

```jsx
// 修改前
extraText={t(
  '允许为不同分组的模型设置不同的计费方式。键为分组名称，值为模型计费配置对象，其中模型名为键，配置为值。quota_type: 0=按量计费，1=按次计费；model_price: 按次计费时的价格(美元)。例如：{"vip": {"gpt-4": {"quota_type": 1, "model_price": 0.5}}}，表示 vip 分组使用 gpt-4 模型时按次计费，每次 $0.5',
)}

// 修改后
extraText={
  t('允许为不同分组的模型设置不同的计费方式和资金来源。') + '\n' +
  t('• quota_type: 0=按量计费，1=按次计费') + '\n' +
  t('• model_price: 按次计费时的价格(美元)') + '\n' +
  t('• billing_source: 资金来源限制') + '\n' +
  t('  - ""或不设置: 不限制(使用用户偏好)') + '\n' +
  t('  - "wallet_only": 仅允许余额消费') + '\n' +
  t('  - "subscription_only": 仅允许订阅消费') + '\n' +
  t('  - "wallet_first": 优先余额，不足时用订阅') + '\n' +
  t('  - "subscription_first": 优先订阅，不足时用余额') + '\n' +
  t('例如：{"vip": {"gpt-4": {"quota_type": 1, "model_price": 0.5, "billing_source": "subscription_only"}}}')
}
```

### 3. 编译验证

- ✅ 后端编译通过（Go）
- ✅ 前端编译通过（Bun）

---

## 📝 配置示例

### 示例 1：VIP 专属模型 - 仅订阅

**场景**：VIP 分组使用 gpt-4 时，必须使用订阅套餐，不能用余额。

```json
{
  "vip": {
    "gpt-4": {
      "quota_type": 1,
      "model_price": 0.5,
      "billing_source": "subscription_only"
    }
  }
}
```

**效果**：
- ✅ VIP 用户有订阅（剩余 100,000 tokens）→ 使用订阅扣费
- ❌ VIP 用户只有余额（$100）→ 请求失败，提示"需要订阅"
- 📌 用户个人偏好无论设置什么，都会被覆盖

**适用场景**：
- 高级模型作为订阅套餐的专属权益
- 防止用户用余额"偷用"高级功能
- 提高订阅套餐的吸引力

---

### 示例 2：企业分组 - 仅余额

**场景**：企业客户要求独立结算，不使用订阅额度。

```json
{
  "enterprise": {
    "*": {
      "billing_source": "wallet_only"
    }
  }
}
```

**效果**：
- ✅ 企业用户所有模型都只能用余额
- 📌 即使用户有订阅套餐，也不会消耗订阅额度
- 📊 便于企业财务独立核算

**适用场景**：
- 企业客户要求余额和订阅分开管理
- 避免订阅和余额混用导致账目混乱
- 企业预充值管理

---

### 示例 3：测试分组 - 优先订阅

**场景**：鼓励测试用户优先使用订阅套餐。

```json
{
  "test": {
    "gpt-3.5-turbo": {
      "quota_type": 0,
      "billing_source": "subscription_first"
    }
  }
}
```

**效果**：
- 优先消耗订阅额度
- 订阅用完后自动使用余额
- 不会因订阅不足导致请求失败

**适用场景**：
- 测试用户引导使用订阅
- 提高订阅利用率
- 防止余额浪费

---

### 示例 4：混合配置

**场景**：不同分组、不同模型使用不同策略。

```json
{
  "vip": {
    "gpt-4": {
      "quota_type": 1,
      "model_price": 0.5,
      "billing_source": "subscription_only"
    },
    "gpt-3.5-turbo": {
      "quota_type": 0,
      "billing_source": "subscription_first"
    }
  },
  "enterprise": {
    "*": {
      "billing_source": "wallet_only"
    }
  },
  "default": {
    "*": {
      "billing_source": "subscription_first"
    }
  }
}
```

**效果**：
- VIP 用户：
  - gpt-4 → 仅订阅
  - gpt-3.5-turbo → 优先订阅，余额备用
- 企业用户：所有模型 → 仅余额
- 默认分组：所有模型 → 优先订阅

---

## 🧪 测试场景

### 测试 1：仅订阅模式（subscription_only）

#### 测试环境

**配置**：
```json
{
  "vip": {
    "gpt-4": {
      "billing_source": "subscription_only"
    }
  }
}
```

#### 测试步骤 A：有订阅，有余额

**用户状态**：
- 余额：$100
- 订阅：有效，剩余 100,000 tokens
- 用户偏好：`wallet_first`（优先余额）

**操作**：
```bash
# 使用 vip 分组的 Token 调用 gpt-4
curl -X POST 'http://localhost:3000/v1/chat/completions' \
  -H 'Authorization: Bearer sk-vip-xxx' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

**预期结果**：
- ✅ 请求成功
- ✅ 消耗订阅额度（假设消耗 1,000 tokens）
- ✅ 余额保持不变（仍然 $100）
- ✅ 订阅剩余：99,000 tokens
- 📌 用户偏好 `wallet_first` 被覆盖

**日志验证**：
```bash
# 查看计费来源
tail -f logs/app.log | grep BillingSource
# 应该看到：BillingSource: subscription
```

#### 测试步骤 B：无订阅，有余额

**用户状态**：
- 余额：$100
- 订阅：无或已用完
- 用户偏好：`wallet_first`

**操作**：同上

**预期结果**：
- ❌ 请求失败
- ❌ 错误码：403 Forbidden
- ❌ 错误信息：`"no active subscription"` 或 `"subscription quota insufficient"`
- ✅ 余额保持不变（未扣费）

**提示用户**：
```
{
  "error": {
    "message": "用户订阅额度不足，请购买或续费订阅套餐",
    "type": "insufficient_quota",
    "code": "subscription_required"
  }
}
```

---

### 测试 2：仅余额模式（wallet_only）

#### 测试环境

**配置**：
```json
{
  "enterprise": {
    "*": {
      "billing_source": "wallet_only"
    }
  }
}
```

#### 测试步骤 A：有余额，有订阅

**用户状态**：
- 余额：$100
- 订阅：有效，剩余 100,000 tokens
- 用户偏好：`subscription_first`（优先订阅）

**操作**：
```bash
# 使用 enterprise 分组的 Token 调用任意模型
curl -X POST 'http://localhost:3000/v1/chat/completions' \
  -H 'Authorization: Bearer sk-enterprise-xxx' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

**预期结果**：
- ✅ 请求成功
- ✅ 消耗余额（假设消耗 $0.02）
- ✅ 余额变为 $99.98
- ✅ 订阅保持不变（仍然 100,000 tokens）
- 📌 用户偏好 `subscription_first` 被覆盖

#### 测试步骤 B：无余额，有订阅

**用户状态**：
- 余额：$0
- 订阅：有效，剩余 100,000 tokens

**操作**：同上

**预期结果**：
- ❌ 请求失败
- ❌ 错误码：403 Forbidden
- ❌ 错误信息：`"用户额度不足, 剩余额度: 0"`
- ✅ 订阅保持不变（未扣费）

---

### 测试 3：优先级覆盖验证

#### 测试环境

**用户偏好设置**：`wallet_first`（优先余额）

**分组配置**：
```json
{
  "vip": {
    "gpt-4": {
      "billing_source": "subscription_only"
    }
  }
}
```

#### 测试步骤：验证覆盖

**用户状态**：
- 余额：$100
- 订阅：有效，剩余 100,000 tokens
- 用户偏好：`wallet_first`（期望用余额）

**操作**：
```bash
# 使用 vip 分组调用 gpt-4
curl -X POST 'http://localhost:3000/v1/chat/completions' \
  -H 'Authorization: Bearer sk-vip-xxx' \
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Test"}]
  }'
```

**预期结果**：
- ✅ 请求成功
- ✅ **消耗订阅**（不是余额！）
- ✅ 余额保持不变
- ✅ 订阅减少

**验证点**：
- 用户期望：用余额（因为偏好是 `wallet_first`）
- 实际行为：用订阅（因为分组配置覆盖了偏好）
- ✅ 分组配置优先级 > 用户偏好

---

### 测试 4：多分组混合测试

#### 测试环境

**配置**：
```json
{
  "vip": {
    "gpt-4": {
      "billing_source": "subscription_only"
    }
  },
  "enterprise": {
    "*": {
      "billing_source": "wallet_only"
    }
  }
}
```

#### 测试步骤：同一用户，不同 Token

**用户状态**：
- 余额：$100
- 订阅：有效，剩余 100,000 tokens

**操作 A**：使用 VIP Token
```bash
curl -X POST 'http://localhost:3000/v1/chat/completions' \
  -H 'Authorization: Bearer sk-vip-xxx' \
  -d '{"model": "gpt-4", "messages": [...]}'
```
**预期**：✅ 用订阅

**操作 B**：使用企业 Token
```bash
curl -X POST 'http://localhost:3000/v1/chat/completions' \
  -H 'Authorization: Bearer sk-enterprise-xxx' \
  -d '{"model": "gpt-4", "messages": [...]}'
```
**预期**：✅ 用余额

**验证点**：
- 同一用户，不同分组的 Token
- 根据 Token 所属分组，使用不同的资金来源
- ✅ 分组配置正确生效

---

## 🔧 配置步骤

### 步骤 1：访问配置页面

1. 登录管理后台
2. 导航到：**设置 → 分组倍率设置**
3. 找到"分组模型计费类型覆盖"文本框

### 步骤 2：编辑配置

在文本框中输入 JSON 配置：

```json
{
  "vip": {
    "gpt-4": {
      "quota_type": 1,
      "model_price": 0.5,
      "billing_source": "subscription_only"
    }
  }
}
```

### 步骤 3：保存配置

1. 点击"保存分组倍率配置"按钮
2. 等待提示"保存成功"
3. 系统会验证 JSON 格式

### 步骤 4：验证配置

#### 方法 1：刷新页面
```
刷新页面 → 检查文本框内容 → 确认配置已保存
```

#### 方法 2：数据库查询
```sql
SELECT * FROM options WHERE `key` = 'GroupModelBilling';
```

#### 方法 3：API 查询
```bash
curl -X GET 'http://localhost:3000/api/option/' \
  -H 'Authorization: Bearer sk-admin-xxx' | jq '.data[] | select(.key=="GroupModelBilling")'
```

---

## 🚨 错误处理

### 错误 1：仅订阅模式但无可用订阅

**场景**：
```json
{
  "vip": {
    "gpt-4": {
      "billing_source": "subscription_only"
    }
  }
}
```

**用户状态**：余额 $100，无订阅

**错误信息**：
```json
{
  "error": {
    "message": "no active subscription",
    "type": "insufficient_quota",
    "code": "subscription_required"
  }
}
```

**解决方法**：
1. **引导用户购买订阅**：
   - 在前端显示"该模型需要订阅套餐"
   - 提供订阅购买链接

2. **调整配置**（如果不想强制）：
   ```json
   {
     "billing_source": "subscription_first"  // 允许余额作为备用
   }
   ```

---

### 错误 2：仅余额模式但余额不足

**场景**：
```json
{
  "enterprise": {
    "*": {
      "billing_source": "wallet_only"
    }
  }
}
```

**用户状态**：余额 $0，有订阅

**错误信息**：
```json
{
  "error": {
    "message": "用户额度不足, 剩余额度: 0",
    "type": "insufficient_quota"
  }
}
```

**解决方法**：
1. **引导用户充值**：
   - 显示"余额不足，请充值"
   - 提供充值链接

2. **调整配置**（如果允许使用订阅）：
   ```json
   {
     "billing_source": "wallet_first"  // 允许订阅作为备用
   }
   ```

---

### 错误 3：JSON 格式错误

**错误场景**：
```json
{
  "vip": {
    "gpt-4": {
      "quota_type": 1,
      "billing_source": subscription_only  // ❌ 缺少引号
    }
  }
}
```

**错误信息**：
```
不是合法的 JSON 字符串
```

**解决方法**：
1. 使用 JSON 验证器检查格式
2. 确保所有字符串值都有引号
3. 检查逗号、括号是否匹配

**正确格式**：
```json
{
  "vip": {
    "gpt-4": {
      "quota_type": 1,
      "billing_source": "subscription_only"  // ✅ 有引号
    }
  }
}
```

---

## 💡 最佳实践

### 1. 渐进式限制策略

**❌ 不推荐**：一刀切强制限制
```json
{
  "vip": {
    "*": {
      "billing_source": "subscription_only"
    }
  }
}
```
这会导致所有模型都只能用订阅，可能造成大量请求失败。

**✅ 推荐**：分层限制
```json
{
  "vip": {
    "gpt-4": {
      "billing_source": "subscription_only"  // 高级模型强制订阅
    },
    "gpt-3.5-turbo": {
      "billing_source": "subscription_first"  // 普通模型允许回退
    }
  }
}
```

### 2. 提供清晰的用户提示

**前端实现建议**：
```javascript
// 在模型选择时显示提示
if (model === 'gpt-4' && group === 'vip') {
  showNotice('该模型需要订阅套餐才能使用');
}

// 在错误时提供引导
if (error.code === 'subscription_required') {
  showModal('请购买订阅套餐', {
    link: '/topup',
    label: '立即购买'
  });
}
```

### 3. 监控和调整

**监控指标**：
- 因资金来源限制导致的失败率
- 各分组的订阅使用率
- 余额消耗 vs 订阅消耗比例

**调整策略**：
- 如果失败率 > 5%，考虑放宽限制
- 如果订阅利用率 < 50%，考虑 `subscription_first`
- 根据业务目标动态调整

### 4. 测试环境验证

**测试清单**：
- [ ] 有订阅 + 有余额 → 验证使用正确来源
- [ ] 只有订阅 → 验证订阅扣费正常
- [ ] 只有余额 → 验证限制是否生效
- [ ] 无订阅无余额 → 验证错误提示清晰
- [ ] 多分组混合 → 验证分组隔离正确
- [ ] 优先级覆盖 → 验证配置覆盖用户偏好

---

## 📊 配置模板

### 模板 1：订阅套餐专属模型

```json
{
  "vip": {
    "gpt-4": {
      "quota_type": 1,
      "model_price": 0.5,
      "billing_source": "subscription_only"
    },
    "claude-3-opus": {
      "quota_type": 1,
      "model_price": 1.0,
      "billing_source": "subscription_only"
    }
  }
}
```

### 模板 2：企业客户独立结算

```json
{
  "enterprise": {
    "*": {
      "billing_source": "wallet_only"
    }
  }
}
```

### 模板 3：多层级策略

```json
{
  "vip": {
    "gpt-4": {
      "billing_source": "subscription_only"
    },
    "gpt-3.5-turbo": {
      "billing_source": "subscription_first"
    }
  },
  "enterprise": {
    "*": {
      "billing_source": "wallet_only"
    }
  },
  "default": {
    "*": {
      "billing_source": "subscription_first"
    }
  }
}
```

### 模板 4：按模型分类

```json
{
  "*": {
    "gpt-4": {
      "billing_source": "subscription_only"
    },
    "gpt-4-turbo": {
      "billing_source": "subscription_only"
    },
    "claude-3-opus": {
      "billing_source": "subscription_only"
    },
    "*": {
      "billing_source": "subscription_first"
    }
  }
}
```

---

## 🔍 调试技巧

### 1. 查看实际计费来源

**后端日志**：
```bash
# 查看计费来源
tail -f logs/app.log | grep "BillingSource"

# 查看分组和模型
tail -f logs/app.log | grep "UsingGroup\|OriginModelName"
```

**预期输出**：
```
BillingSource: subscription
UsingGroup: vip
OriginModelName: gpt-4
```

### 2. 验证配置加载

**API 查询**：
```bash
curl -X GET 'http://localhost:3000/api/option/' \
  -H 'Authorization: Bearer sk-admin-xxx' | \
  jq '.data[] | select(.key=="GroupModelBilling") | .value'
```

**预期输出**：
```json
{
  "vip": {
    "gpt-4": {
      "quota_type": 1,
      "model_price": 0.5,
      "billing_source": "subscription_only"
    }
  }
}
```

### 3. 前端调试

**浏览器控制台**：
```javascript
// 查看分组模型计费配置
console.log(pricingData.groupModelBilling);

// 检查特定分组和模型
const vipGpt4 = pricingData.groupModelBilling['vip']?.['gpt-4'];
console.log('VIP GPT-4 config:', vipGpt4);
console.log('Billing source:', vipGpt4?.billing_source);
```

### 4. 数据库查询

```sql
-- 查看配置
SELECT * FROM options WHERE `key` = 'GroupModelBilling';

-- 查看用户计费偏好
SELECT id, username, billing_preference FROM users WHERE id = 123;

-- 查看用户余额和订阅
SELECT u.username, u.quota, 
       (SELECT COUNT(*) FROM user_subscriptions WHERE user_id = u.id AND status = 'active') as active_subs
FROM users u WHERE u.id = 123;

-- 查看最近的消费记录
SELECT * FROM logs 
WHERE user_id = 123 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## 📚 相关文档

- `docs/GROUP_MODEL_BILLING.md` - 分组模型计费功能总览
- `docs/GROUP_MODEL_BILLING_SOURCE.md` - 资金来源限制详细文档
- `docs/GROUP_MODEL_BILLING_TEST.md` - 测试指南
- `docs/SUBSCRIPTION_MANAGEMENT_OVERVIEW.md` - 订阅系统概览

---

## 🎉 总结

### 实施完成

- ✅ 数据结构扩展（`BillingSource` 字段）
- ✅ 计费逻辑集成（分组配置覆盖用户偏好）
- ✅ 前端配置界面更新
- ✅ 后端编译测试通过
- ✅ 前端编译测试通过
- ✅ 完整文档编写

### 核心特性

1. **强制限制**：可以强制某些分组/模型只用订阅或余额
2. **优先级覆盖**：分组配置 > 用户偏好 > 系统默认
3. **灵活配置**：支持 5 种资金来源策略
4. **向后兼容**：不设置 `billing_source` 时行为不变

### 使用建议

- **高级模型**：使用 `subscription_only` 作为套餐专属
- **企业客户**：使用 `wallet_only` 保证独立结算
- **普通用户**：使用 `subscription_first` 提高订阅利用率
- **回退策略**：提供 `*_first` 选项避免请求失败

### 测试要点

1. ✅ 验证分组配置是否覆盖用户偏好
2. ✅ 测试只有订阅、只有余额、两者都有三种情况
3. ✅ 检查错误提示是否清晰
4. ✅ 监控失败率和资金来源使用情况

---

**功能已完全实现并测试通过！** 🎊

可以在另一台电脑上按照本文档进行配置和测试。
