# 云函数代理工具使用说明

## 概述

为了减少代码重复，我们创建了一个通用的代理处理工具 `utils/proxy.js`，所有的云函数现在都使用这个共享的代理逻辑。

## 文件结构

```
functions/
├── utils/
│   └── proxy.js           # 共享的代理处理工具
├── api/[[req]].js         # 使用共享工具的云函数
├── claude/[[req]].js      # 使用共享工具的云函数
├── gemini/[[req]].js      # 使用共享工具的云函数
├── kling/[[req]].js       # 使用共享工具的云函数
├── mcp/[[req]].js         # 使用共享工具的云函数
├── mj/[[req]].js          # 使用共享工具的云函数
├── suno/[[req]].js        # 使用共享工具的云函数
└── v1/[[req]].js          # 使用共享工具的云函数
```

## 基本使用

每个云函数现在都简化为：

```javascript
import { handleProxyRequest } from '../utils/proxy.js';

export async function onRequest(context) {
  return handleProxyRequest(context);
}
```

## 高级用法

如果需要自定义代理行为，可以使用 `createProxyHandler` 函数：

```javascript
import { createProxyHandler } from '../utils/proxy.js';

export async function onRequest(context) {
  return createProxyHandler(context, {
    // 自定义目标URL
    targetUrl: 'https://custom-api.example.com',
    
    // 添加自定义请求头
    headers: {
      'X-Custom-Header': 'value'
    },
    
    // 请求转换函数
    transformRequest: async (requestInit, originalRequest, context) => {
      // 修改请求配置
      return requestInit;
    },
    
    // 响应转换函数
    transformResponse: async (response, originalRequest, context) => {
      // 修改响应
      return response;
    }
  });
}
```

## 功能特性

- ✅ **统一的代理逻辑**：所有云函数使用相同的代理处理逻辑
- ✅ **Cookie 保持**：自动传递和维护 Cookie
- ✅ **查询参数支持**：完整支持 URL 查询参数
- ✅ **请求方法保持**：支持 GET、POST、PUT、DELETE 等所有 HTTP 方法
- ✅ **错误处理**：统一的错误处理和响应
- ✅ **环境变量支持**：通过 `TARGET_URL` 环境变量配置目标地址
- ✅ **可扩展性**：支持自定义请求和响应转换

## 环境变量

- `TARGET_URL`: 目标API的基础URL（默认：https://openai-replay.wochirou.com）
- `NODE_ENV`: 环境模式，非生产环境会输出调试日志

## 代码减少统计

重构前：每个云函数 ~40 行重复代码 × 7 个文件 = ~280 行
重构后：共享工具 ~70 行 + 每个云函数 ~4 行 × 7 个文件 = ~98 行

**减少代码量：约 65%**