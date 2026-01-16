/**
 * 通用的API代理处理函数
 * @param {Object} context - Cloudflare Functions上下文对象
 * @param {Object} options - 可选配置项
 * @param {string} options.targetUrl - 自定义目标URL，默认使用环境变量
 * @param {Object} options.headers - 额外的请求头
 * @param {Function} options.transformRequest - 请求转换函数
 * @param {Function} options.transformResponse - 响应转换函数
 * @returns {Promise<Response>} 代理后的响应
 */
export async function createProxyHandler(context, options = {}) {
  const {
    targetUrl = context.env.TARGET_URL || "https://openai-replay.wochirou.com",
    headers: extraHeaders = {},
    transformRequest,
    transformResponse
  } = options;

  // 获取原始请求的信息
  const { request } = context;
  const url = new URL(request.url);

  // 创建新的请求URL，包括查询字符串
  const newUrl = `${targetUrl}${url.pathname}${url.search || ''}`;
  
  // 开发环境下输出日志
  if (context.env.NODE_ENV !== 'production') {
    console.log('Proxy request to:', newUrl);
  }

  // 准备新请求的头部
  const newHeaders = new Headers(request.headers);
  
  // 添加额外的请求头
  Object.entries(extraHeaders).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });

  // 保持Cookie
  const cookies = request.headers.get('Cookie');
  if (cookies) {
    newHeaders.set('Cookie', cookies);
  }

  // 创建新的请求对象
  let newRequestInit = {
    method: request.method,
    headers: newHeaders,
    body: request.method !== 'GET' ? request.body : undefined,
    redirect: 'follow'
  };

  // 如果提供了请求转换函数，应用转换
  if (transformRequest && typeof transformRequest === 'function') {
    newRequestInit = await transformRequest(newRequestInit, request, context);
  }

  try {
    // 发送代理请求
    const response = await fetch(newUrl, newRequestInit);

    // 如果提供了响应转换函数，应用转换
    if (transformResponse && typeof transformResponse === 'function') {
      return await transformResponse(response, request, context);
    }

    // 返回标准代理响应
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  } catch (error) {
    // 错误处理
    console.error('Proxy request failed:', error);
    return new Response(JSON.stringify({
      error: 'Proxy request failed',
      message: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

/**
 * 简化的代理处理函数，用于标准的代理场景
 * @param {Object} context - Cloudflare Functions上下文对象
 * @returns {Promise<Response>} 代理后的响应
 */
export async function handleProxyRequest(context) {
  return createProxyHandler(context);
}