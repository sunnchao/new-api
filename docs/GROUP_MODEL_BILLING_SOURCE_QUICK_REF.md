# 分组模型计费 - 资金来源限制 - 快速参考卡

## 🚀 快速开始

### 1. 基本配置

```json
{
  "分组名": {
    "模型名": {
      "billing_source": "值"
    }
  }
}
```

### 2. billing_source 可选值

| 值 | 说明 | 用途 |
|----|------|------|
| `""` | 不限制（默认） | 使用用户偏好 |
| `"wallet_only"` | 仅余额 | 企业独立结算 |
| `"subscription_only"` | 仅订阅 | 套餐专属模型 |
| `"wallet_first"` | 优先余额 | 余额为主 |
| `"subscription_first"` | 优先订阅 | 订阅为主 |

---

## 📋 常用配置示例

### VIP 专属模型
```json
{
  "vip": {
    "gpt-4": {
      "billing_source": "subscription_only"
    }
  }
}
```

### 企业独立结算
```json
{
  "enterprise": {
    "*": {
      "billing_source": "wallet_only"
    }
  }
}
```

### 鼓励使用订阅
```json
{
  "default": {
    "*": {
      "billing_source": "subscription_first"
    }
  }
}
```

### 完整配置
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

---

## 🧪 快速测试

### 测试 1：仅订阅模式

**配置**：`"billing_source": "subscription_only"`

| 用户状态 | 预期结果 |
|---------|---------|
| 有订阅 + 有余额 | ✅ 用订阅 |
| 无订阅 + 有余额 | ❌ 失败 |

### 测试 2：仅余额模式

**配置**：`"billing_source": "wallet_only"`

| 用户状态 | 预期结果 |
|---------|---------|
| 有余额 + 有订阅 | ✅ 用余额 |
| 无余额 + 有订阅 | ❌ 失败 |

### 测试 3：优先级验证

**用户偏好**：`wallet_first`（优先余额）  
**分组配置**：`"billing_source": "subscription_only"`

**预期**：✅ 使用订阅（配置覆盖偏好）

---

## 🔍 快速调试

### 查看配置
```bash
curl http://localhost:3000/api/option/ | jq '.data[] | select(.key=="GroupModelBilling")'
```

### 查看日志
```bash
tail -f logs/app.log | grep "BillingSource"
```

### 测试请求
```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Authorization: Bearer sk-xxx" \
  -d '{"model": "gpt-4", "messages": [{"role": "user", "content": "test"}]}'
```

---

## 🚨 常见错误

| 错误信息 | 原因 | 解决 |
|---------|------|------|
| `no active subscription` | 设置了 `subscription_only` 但无订阅 | 购买订阅或改为 `subscription_first` |
| `用户额度不足` | 设置了 `wallet_only` 但无余额 | 充值或改为 `wallet_first` |
| `不是合法的 JSON` | JSON 格式错误 | 检查引号和逗号 |

---

## ⚡ 优先级规则

```
分组配置（billing_source）  ← 最高优先级
    ↓
用户计费偏好
    ↓
系统默认（subscription_first）
```

**重点**：分组配置会完全覆盖用户偏好！

---

## 📊 决策表

| 场景 | 推荐配置 |
|------|---------|
| 高级模型作为套餐权益 | `subscription_only` |
| 企业客户独立结算 | `wallet_only` |
| 提高订阅利用率 | `subscription_first` |
| 防止请求失败 | `subscription_first` 或 `wallet_first` |
| 灵活使用两种资金 | 不设置（使用用户偏好） |

---

## 🔗 完整文档

- **实施报告**：`GROUP_MODEL_BILLING_SOURCE_IMPLEMENTATION.md`
- **详细文档**：`GROUP_MODEL_BILLING_SOURCE.md`
- **功能总览**：`GROUP_MODEL_BILLING.md`

---

## 📞 配置路径

**管理后台 → 设置 → 分组倍率设置 → 分组模型计费类型覆盖**

---

## ✅ 功能状态

- ✅ 后端实现完成
- ✅ 前端界面完成
- ✅ 编译测试通过
- ✅ 文档已完善

**版本**：v1.0.0  
**发布日期**：2026-03-26
