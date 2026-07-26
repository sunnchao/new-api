/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
export const PAGE_SIZE = 10;
export const MAX_TICKET_ATTACHMENT_COUNT = 6;
export const TICKET_ATTACHMENT_URL_PREFIX = '/uploads/tickets/';

function getTicketAttachmentBaseUrl() {
  return (
    import.meta.env?.VITE_REACT_APP_SERVER_URL ||
    (import.meta.env?.DEV ? 'http://localhost:3000' : '')
  );
}

export const TICKET_STATUS_MAP = {
  1: 'Pending',
  2: 'In Progress',
  3: 'Replied',
  4: 'Closed',
};

export const TICKET_PRIORITY_MAP = {
  1: 'Low',
  2: 'Medium',
  3: 'High',
};

export const STATUS_COLORS = {
  1: 'blue',
  2: 'orange',
  3: 'green',
  4: 'grey',
};

export const PRIORITY_COLORS = {
  1: 'light-blue',
  2: 'amber',
  3: 'red',
};

function appendIfPresent(query, key, value) {
  if (
    value !== undefined &&
    value !== null &&
    value !== '' &&
    Number(value) !== 0
  ) {
    query.set(key, String(value));
  }
}

export function buildTicketListUrl({
  isAdmin = false,
  page = 1,
  pageSize = PAGE_SIZE,
  status = 0,
  category = '',
  priority = 0,
} = {}) {
  const query = new URLSearchParams({
    p: String(page),
    page_size: String(pageSize),
  });

  appendIfPresent(query, 'status', status);
  if (isAdmin) {
    appendIfPresent(query, 'category', category);
    appendIfPresent(query, 'priority', priority);
  }

  return `${isAdmin ? '/api/ticket/' : '/api/ticket/self'}?${query.toString()}`;
}

export function buildTicketSearchUrl({
  isAdmin = false,
  keyword = '',
  page = 1,
  pageSize = PAGE_SIZE,
  status = 0,
} = {}) {
  const query = new URLSearchParams({
    keyword,
    p: String(page),
    page_size: String(pageSize),
  });

  appendIfPresent(query, 'status', status);

  return `${isAdmin ? '/api/ticket/search' : '/api/ticket/self/search'}?${query.toString()}`;
}

export function formatTicketTime(value) {
  if (!value) return '-';
  const date = new Date(value * 1000);
  const pad = (number) => String(number).padStart(2, '0');
  return (
    [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())].join(
      '-',
    ) + ` ${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

export function getCategoryLabel(categories = [], value) {
  return (
    categories.find((category) => category.value === value)?.label ||
    value ||
    '-'
  );
}

export function getTextPreview(value, maxLength = 72) {
  const text = String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

export function parseTicketAttachmentUrls(value) {
  if (!value) return [];
  try {
    const urls = JSON.parse(value);
    if (!Array.isArray(urls)) return [];
    return urls.filter(
      (url) =>
        typeof url === 'string' && url.startsWith(TICKET_ATTACHMENT_URL_PREFIX),
    );
  } catch {
    return [];
  }
}

export function serializeTicketAttachmentUrls(urls = []) {
  const safeUrls = urls.filter(
    (url) =>
      typeof url === 'string' && url.startsWith(TICKET_ATTACHMENT_URL_PREFIX),
  );
  return safeUrls.length > 0 ? JSON.stringify(safeUrls) : '';
}

export function resolveTicketAttachmentUrl(
  url,
  baseUrl = getTicketAttachmentBaseUrl(),
) {
  if (!url || !url.startsWith(TICKET_ATTACHMENT_URL_PREFIX) || !baseUrl) {
    return url;
  }
  return `${baseUrl.replace(/\/$/, '')}${url}`;
}

export function isTicketClosed(ticket) {
  return ticket?.status === 4;
}

export function getTicketDetailPath(ticketId, isAdmin = false) {
  return `${isAdmin ? '/console/ticket' : '/ticket'}/${ticketId}`;
}

export function getTicketListPath(isAdmin = false) {
  return isAdmin ? '/console/tickets' : '/tickets';
}

export function getTicketCloseUrl(ticketId, isAdmin = false) {
  return isAdmin
    ? `/api/ticket/${ticketId}/status`
    : `/api/ticket/${ticketId}/close`;
}

export function getTicketActionState(ticket, currentAdminId = 0) {
  const closed = isTicketClosed(ticket);
  const assignedAdminId = Number(ticket?.assigned_admin_id || 0);
  const adminId = Number(currentAdminId || 0);

  return {
    canAssignToSelf: !closed && adminId > 0 && assignedAdminId !== adminId,
    canClose: !closed,
    canDelete: true,
  };
}

export function summarizeTicketStatuses(tickets = []) {
  return tickets.reduce(
    (summary, ticket) => {
      summary.total += 1;
      if (ticket.status === 1) summary.pending += 1;
      if (ticket.status === 2) summary.progress += 1;
      if (ticket.status === 3) summary.replied += 1;
      if (ticket.status === 4) summary.closed += 1;
      return summary;
    },
    { total: 0, pending: 0, progress: 0, replied: 0, closed: 0 },
  );
}
