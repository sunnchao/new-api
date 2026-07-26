import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildTicketListUrl,
  buildTicketSearchUrl,
  getTicketActionState,
  getTicketCloseUrl,
  getTicketDetailPath,
  getTicketListPath,
  formatTicketTime,
  parseTicketAttachmentUrls,
  resolveTicketAttachmentUrl,
  serializeTicketAttachmentUrls,
  summarizeTicketStatuses,
} from './utils.js';

test('buildTicketListUrl preserves page, page size, and supported filters', () => {
  assert.equal(
    buildTicketListUrl({
      isAdmin: true,
      page: 2,
      pageSize: 20,
      status: 3,
      category: 'billing',
      priority: 2,
    }),
    '/api/ticket/?p=2&page_size=20&status=3&category=billing&priority=2',
  );

  assert.equal(
    buildTicketListUrl({ isAdmin: false, page: 1, pageSize: 10, status: 0 }),
    '/api/ticket/self?p=1&page_size=10',
  );
});

test('buildTicketSearchUrl chooses user or admin search endpoint', () => {
  assert.equal(
    buildTicketSearchUrl({
      isAdmin: false,
      keyword: 'quota error',
      page: 1,
      pageSize: 10,
    }),
    '/api/ticket/self/search?keyword=quota+error&p=1&page_size=10',
  );

  assert.equal(
    buildTicketSearchUrl({
      isAdmin: true,
      keyword: 'billing',
      page: 3,
      pageSize: 10,
      status: 1,
    }),
    '/api/ticket/search?keyword=billing&p=3&page_size=10&status=1',
  );
});

test('summarizeTicketStatuses counts current page status buckets', () => {
  const summary = summarizeTicketStatuses([
    { status: 1 },
    { status: 1 },
    { status: 3 },
    { status: 4 },
  ]);

  assert.deepEqual(summary, {
    total: 4,
    pending: 2,
    progress: 0,
    replied: 1,
    closed: 1,
  });
});

test('formatTicketTime handles unix seconds and empty values', () => {
  assert.equal(formatTicketTime(0), '-');
  assert.match(formatTicketTime(1717200000), /^\d{4}/);
});

test('ticket navigation paths respect admin console mode', () => {
  assert.equal(getTicketDetailPath(7, true), '/console/ticket/7');
  assert.equal(getTicketDetailPath(7, false), '/ticket/7');
  assert.equal(getTicketListPath(true), '/console/tickets');
  assert.equal(getTicketListPath(false), '/tickets');
  assert.equal(getTicketCloseUrl(7, true), '/api/ticket/7/status');
  assert.equal(getTicketCloseUrl(7, false), '/api/ticket/7/close');
});

test('admin ticket action state keeps closed tickets read-only except delete', () => {
  assert.deepEqual(
    getTicketActionState({ status: 1, assigned_admin_id: 0 }, 12),
    {
      canAssignToSelf: true,
      canClose: true,
      canDelete: true,
    },
  );

  assert.deepEqual(
    getTicketActionState({ status: 4, assigned_admin_id: 0 }, 12),
    {
      canAssignToSelf: false,
      canClose: false,
      canDelete: true,
    },
  );
});

test('ticket attachment helpers preserve uploaded image urls', () => {
  const urls = [
    '/api/uploads/tickets/202605/a.png',
    '/api/uploads/tickets/202605/b.jpg',
  ];

  assert.equal(serializeTicketAttachmentUrls(urls), JSON.stringify(urls));
  assert.deepEqual(parseTicketAttachmentUrls(JSON.stringify(urls)), urls);
  assert.deepEqual(parseTicketAttachmentUrls(''), []);
  assert.deepEqual(parseTicketAttachmentUrls('not-json'), []);
  assert.equal(
    resolveTicketAttachmentUrl(
      '/api/uploads/tickets/202605/a.png',
      'http://localhost:3000/',
    ),
    'http://localhost:3000/api/uploads/tickets/202605/a.png',
  );
  assert.equal(
    resolveTicketAttachmentUrl(
      '/uploads/tickets/202605/a.png',
      'http://localhost:3000/',
    ),
    'http://localhost:3000/api/uploads/tickets/202605/a.png',
  );
  assert.equal(
    resolveTicketAttachmentUrl(
      'https://cdn.example.com/a.png',
      'http://localhost:3000',
    ),
    'https://cdn.example.com/a.png',
  );
});
