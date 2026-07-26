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
    targetUrl = context.env.TARGET_URL || 'https://openai-replay.wochirou.com',
    headers: extraHeaders = {},
    transformRequest,
    transformResponse
  } = options;

  const isRedirectStatus = (status) => {
    return status === 301 || status === 302 || status === 303 || status === 307 || status === 308;
  };

  const shouldIncludeBody = (method) => {
    const m = (method || '').toUpperCase();
    return m !== 'GET' && m !== 'HEAD';
  };

  const normalizeTargetBase = (base) => {
    // Avoid accidental double slashes when concatenating.
    return String(base || '').replace(/\/+$/, '');
  };

  const fetchWithRedirects = async (initialUrl, requestInit, { maxRedirects = 5 } = {}) => {
    let currentUrl = initialUrl;
    let method = requestInit.method;
    let body = requestInit.body;
    let redirects = 0;

    const allowedHost = (() => {
      try {
        return new URL(initialUrl).host;
      } catch {
        return null;
      }
    })();

    // We handle redirects manually so we can replay buffered bodies safely.
    while (true) {
      const response = await fetch(currentUrl, {
        ...requestInit,
        method,
        body,
        redirect: 'manual'
      });

      if (!isRedirectStatus(response.status)) {
        return response;
      }

      const location = response.headers.get('Location');
      if (!location) {
        return response;
      }

      if (redirects >= maxRedirects) {
        return response;
      }

      const nextUrl = new URL(location, currentUrl).toString();
      const nextHost = new URL(nextUrl).host;

      // Avoid leaking headers/body to an unexpected host via open redirects.
      if (allowedHost && nextHost !== allowedHost) {
        return response;
      }

      if (context.env.NODE_ENV !== 'production') {
        console.log('Upstream redirect:', response.status, '->', nextUrl);
      }

      // We are going to follow, so we won't return this response.
      try {
        response.body?.cancel();
      } catch {
        // ignore
      }

      // Mirror fetch redirect behavior for 303 (and common 301/302 POST downgrade).
      if (response.status === 303 || ((response.status === 301 || response.status === 302) && String(method).toUpperCase() === 'POST')) {
        method = 'GET';
        body = undefined;
      }

      currentUrl = nextUrl;
      redirects += 1;
    }
  };

  // 获取原始请求的信息
  const { request } = context;
  // 在读取/缓冲 body 之前 clone，避免自定义 transform 里需要读取请求体时失败。
  const requestForTransforms = request.clone();
  const url = new URL(request.url);

  // 创建新的请求URL，包括查询字符串
  const newUrl = `${normalizeTargetBase(targetUrl)}${url.pathname}${url.search || ''}`;

  // 开发环境下输出日志
  if (context.env.NODE_ENV !== 'production') {
    console.log('Proxy request to:', newUrl);
  }

  // 准备新请求的头部
  const newHeaders = new Headers(request.headers);

  // 这些头部在代理请求里通常无意义/不可设置，避免潜在异常。
  newHeaders.delete('host');
  newHeaders.delete('content-length');

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
  let bufferedBody;
  if (shouldIncludeBody(request.method) && request.body) {
    // Cloudflare Workers 的 Request.body 是 stream（一次性），遇到 307/308 等重定向时需要可重放的 body。
    bufferedBody = await request.arrayBuffer();
  }

  let newRequestInit = {
    method: request.method,
    headers: newHeaders,
    body: bufferedBody,
    redirect: 'manual'
  };

  // 如果提供了请求转换函数，应用转换
  if (transformRequest && typeof transformRequest === 'function') {
    newRequestInit = await transformRequest(newRequestInit, requestForTransforms, context);
  }

  try {
    // 发送代理请求
    const response = await fetchWithRedirects(newUrl, newRequestInit);

    // 如果提供了响应转换函数，应用转换
    if (transformResponse && typeof transformResponse === 'function') {
      return await transformResponse(response, requestForTransforms, context);
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
    return new Response(
      JSON.stringify({
        error: 'Proxy request failed',
        message: error.message
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
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
