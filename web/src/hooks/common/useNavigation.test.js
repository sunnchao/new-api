import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { useNavigation } from './useNavigation.js';

const t = (value) => value;

function renderNavigation(docsLink = '', headerNavModules = null) {
  let result;

  function Probe() {
    result = useNavigation(t, docsLink, headerNavModules);
    return React.createElement('div');
  }

  renderToStaticMarkup(React.createElement(Probe));
  return result.mainNavLinks;
}

test('classic public navigation defaults include subscription plans and contact links', () => {
  const links = renderNavigation();

  assert.deepEqual(
    links.map((link) => ({ key: link.itemKey, to: link.to })),
    [
      { key: 'home', to: '/' },
      { key: 'console', to: '/console' },
      { key: 'pricing', to: '/pricing' },
      { key: 'subscriptions', to: '/subscription-plans' },
      { key: 'vibecoding', to: undefined },
      { key: 'about', to: '/about' },
      { key: 'contact', to: '/contact' },
    ],
  );
  assert.equal(
    links.find((link) => link.itemKey === 'subscriptions')?.text,
    '订阅广场',
  );
});

test('classic public navigation respects disabled subscription and contact modules', () => {
  const links = renderNavigation('', {
    home: true,
    console: true,
    pricing: { enabled: true, requireAuth: false },
    subscriptions: { enabled: false, requireAuth: false },
    vibecoding: true,
    docs: true,
    about: true,
    contact: false,
  });

  assert.equal(
    links.some((link) => link.itemKey === 'subscriptions'),
    false,
  );
  assert.equal(
    links.some((link) => link.itemKey === 'contact'),
    false,
  );
});
