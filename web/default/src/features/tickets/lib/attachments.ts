export const MAX_TICKET_ATTACHMENT_COUNT = 6
export const TICKET_ATTACHMENT_URL_PREFIX = '/uploads/tickets/'

function getTicketAttachmentBaseUrl() {
  return (
    import.meta.env.VITE_REACT_APP_SERVER_URL ||
    (import.meta.env.DEV ? 'http://localhost:3000' : '')
  )
}

export function parseTicketAttachmentUrls(value?: string | null): string[] {
  if (!value) return []
  try {
    const urls = JSON.parse(value)
    if (!Array.isArray(urls)) return []
    return urls.filter(
      (url): url is string =>
        typeof url === 'string' && url.startsWith(TICKET_ATTACHMENT_URL_PREFIX)
    )
  } catch {
    return []
  }
}

export function serializeTicketAttachmentUrls(urls: string[]): string {
  const safeUrls = urls.filter((url) =>
    url.startsWith(TICKET_ATTACHMENT_URL_PREFIX)
  )
  return safeUrls.length > 0 ? JSON.stringify(safeUrls) : ''
}

export function resolveTicketAttachmentUrl(
  url: string,
  baseUrl = getTicketAttachmentBaseUrl()
) {
  if (!url || !url.startsWith(TICKET_ATTACHMENT_URL_PREFIX) || !baseUrl) {
    return url
  }
  return `${baseUrl.replace(/\/$/, '')}${url}`
}
