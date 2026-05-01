import { handleProxyRequest } from '../utils/proxy.js';

export async function onRequest(context) {
  return handleProxyRequest(context);
}
