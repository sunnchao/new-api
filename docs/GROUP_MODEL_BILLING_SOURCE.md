# 分组模型计费 - 资金来源限制功能

## ✅ 功能概述

在 `GroupModelBilling` 配置中增加了 `billing_source` 字段，允许为特定分组使用特定模型时，强制限制使用哪种资金来源（余额或订阅）。

---

## 🎯 应用场景

### 场景 1：VIP 分组强制使用订阅
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
- VIP 用户使用 gpt-4 时，必须使用订阅套餐
- 即使用户有余额，也不能用余额支付
- 如果没有可用订阅，请求会失败

**用途**：
- 套餐专属模型，防止用户用余额"偷用"
- 确保高级模型只有订阅用户能使用

### 场景 2：企业分组强制使用余额
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
- 企业用户所有模型都只能用余额支付
- 不消耗订阅额度

**用途**：
- 企业客户要求独立结算
- 防止订阅和余额混用导致账目混乱

### 场景 3：测试分组优先使用订阅
```json
{
  "test": {
    "gpt-3.5-turbo": {
      "billing_source": "subscription_first"
    }
  }
}
```
**效果**：
- 测试分组优先消耗订阅额度
- 订阅不足时才使用余额

**用途**：
- 鼓励测试用户使用订阅套餐
- 订阅作为主要消费方式，余额作为备用

---

## 📝 配置格式

### 完整配置示例

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
    "claude-3-opus": {
      "quota_type": 1,
      "model_price": 1.0,
      "billing_source": "wallet_only"
    }
  },
  "default": {
    "*": {
      "billing_source": "wallet_first"
    }
  }
}
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `quota_type` | int | 否 | 计费类型：0=按量计费，1=按次计费 |
| `model_price` | float | 条件 | 按次计费时的价格（美元），`quota_type=1` 时必填 |
| `billing_source` | string | 否 | 资金来源限制，见下表 |

### billing_source 可选值

| 值 | 说明 | 行为 |
|----|------|------|
| `""` 或不设置 | 不限制（默认） | 使用用户的计费偏好设置 |
| `"wallet_only"` | 仅允许余额 | 只能用余额支付，有订阅也不用 |
| `"subscription_only"` | 仅允许订阅 | 只能用订阅支付，有余额也不用 |
| `"wallet_first"` | 优先余额 | 先用余额，余额不足时用订阅 |
| `"subscription_first"` | 优先订阅 | 先用订阅，订阅不足时用余额 |

---

## 🔄 优先级规则

资金来源的最终决策优先级（从高到低）：

1. **GroupModelBilling 配置**（最高优先级）
   - 如果为该分组+模型设置了 `billing_source`，直接使用
   
2. **用户计费偏好**（次优先级）
   - 如果没有分组配置，使用用户在个人设置中的计费偏好
   
3. **系统默认**（最低优先级）
   - 默认为 `subscription_first`（优先订阅）

### 示例流程

```
API 请求（vip 分组 + gpt-4 模型）
  ↓
检查 GroupModelBilling["vip"]["gpt-4"]
  ↓
找到 billing_source = "subscription_only"
  ↓
覆盖用户偏好，强制使用订阅
  ↓
检查用户是否有可用订阅
  ↓ 有
使用订阅扣费 ✅
  ↓ 无
请求失败，提示"需要订阅套餐" ❌
```

---

## 🔧 配置方法

### 1. 访问配置页面

**路径**：管理后台 → 设置 → 分组倍率设置

### 2. 编辑配置

在"分组模型计费类型覆盖"文本框中输入 JSON 配置：

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

### 3. 保存配置

点击"保存"按钮，系统会验证 JSON 格式并保存。

### 4. 测试验证

1. 使用 VIP 分组的 Token 调用 gpt-4
2. 查看用户余额和订阅状态
3. 验证是否按配置的资金来源扣费

---

## 📊 测试场景

### 测试 1：仅订阅模式

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

**测试步骤**：
1. 用户有余额 $100，无订阅
2. 使用 vip 分组 Token 调用 gpt-4
3. **预期**：请求失败，提示需要订阅

**测试步骤 2**：
1. 用户有余额 $100，有订阅（剩余 100,000 tokens）
2. 使用 vip 分组 Token 调用 gpt-4
3. **预期**：成功，消耗订阅额度，余额不变

### 测试 2：仅余额模式

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

**测试步骤**：
1. 用户有余额 $100，有订阅（剩余 100,000 tokens）
2. 使用 enterprise 分组 Token 调用任意模型
3. **预期**：成功，消耗余额，订阅额度不变

### 测试 3：优先级覆盖

**用户设置**：计费偏好 = `wallet_first`（优先余额）

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

**测试步骤**：
1. 用户偏好是优先余额
2. 但分组配置强制仅订阅
3. 使用 vip 分组 Token 调用 gpt-4
4. **预期**：只能用订阅，不能用余额（分组配置覆盖用户偏好）

---

## 🚨 错误处理

### 错误 1：仅订阅模式但无可用订阅

**配置**：
```json
{
  "billing_source": "subscription_only"
}
```

**场景**：用户有余额但没有订阅

**错误信息**：
```
用户额度不足, 剩余额度: 0
或
no active subscription
```

**解决方法**：
- 提示用户购买订阅套餐
- 或者修改配置为 `subscription_first`（允许余额作为备用）

### 错误 2：仅余额模式但余额不足

**配置**：
```json
{
  "billing_source": "wallet_only"
}
```

**场景**：用户有订阅但余额不足

**错误信息**：
```
用户额度不足, 剩余额度: 100
```

**解决方法**：
- 提示用户充值
- 或者修改配置为 `wallet_first`（允许订阅作为备用）

---

## 💡 最佳实践

### 1. 渐进式限制

**不推荐**：
```json
{
  "vip": {
    "*": {
      "billing_source": "subscription_only"
    }
  }
}
```
这会强制 VIP 分组所有模型都只能用订阅，可能导致大量失败。

**推荐**：
```json
{
  "vip": {
    "gpt-4": {
      "billing_source": "subscription_only"
    },
    "gpt-3.5-turbo": {
      "billing_source": "subscription_first"
    }
  }
}
```
只对高级模型强制订阅，其他模型允许回退。

### 2. 提供明确提示

在前端或 API 文档中明确说明哪些分组/模型有资金来源限制。

### 3. 监控失败率

定期检查因资金来源限制导致的请求失败率，及时调整策略。

### 4. 测试环境验证

在生产环境应用前，先在测试环境验证配置是否符合预期。

---

## 🔍 调试技巧

### 查看实际计费来源

检查日志中的 `BillingSource` 字段：

```bash
# 查看最近的计费日志
tail -f logs/app.log | grep BillingSource
```

### 验证配置加载

```bash
# 查看当前配置
curl -X GET 'http://localhost:3000/api/option/' | jq '.data[] | select(.key=="GroupModelBilling")'
```

### 前端调试

打开浏览器控制台：

```javascript
// 查看分组模型计费配置
console.log(pricingData.groupModelBilling);

// 检查特定分组和模型
const config = pricingData.groupModelBilling['vip']?.['gpt-4'];
console.log('Billing source:', config?.billing_source);
```

---

## 📚 相关文档

- `docs/GROUP_MODEL_BILLING.md` - 分组模型计费功能总览
- `docs/GROUP_MODEL_BILLING_TEST.md` - 测试指南
- `docs/SUBSCRIPTION_MANAGEMENT_OVERVIEW.md` - 订阅系统概览

---

## 🎉 总结

**资金来源限制功能**为分组模型计费提供了更精细的控制：

- ✅ 可以强制某些分组/模型只用订阅或余额
- ✅ 可以设置优先级策略
- ✅ 覆盖用户个人偏好设置
- ✅ 灵活配置，按需启用

**使用建议**：
- 对高级/专属模型使用 `subscription_only`
- 对企业客户使用 `wallet_only` 保证独立结算
- 对普通用户使用 `subscription_first` 鼓励订阅
- 保留 `wallet_first` 作为备用降级策略

**配置原则**：
- 分组配置 > 用户偏好 > 系统默认
- 清晰的限制 > 模糊的策略
- 提供回退 > 强制单一来源
