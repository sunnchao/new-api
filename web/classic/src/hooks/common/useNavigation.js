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

import { useMemo } from 'react';

export const defaultHeaderNavModules = {
  home: true,
  console: true,
  pricing: {
    enabled: true,
    requireAuth: false,
  },
  subscriptions: {
    enabled: true,
    requireAuth: false,
  },
  vibecoding: true,
  docs: true,
  about: true,
  contact: true,
};

const accessModuleKeys = new Set(['pricing', 'subscriptions']);

function normalizeAccessModule(value, fallback) {
  if (typeof value === 'boolean') {
    return {
      enabled: value,
      requireAuth: fallback.requireAuth,
    };
  }

  if (value && typeof value === 'object') {
    return {
      enabled:
        typeof value.enabled === 'boolean' ? value.enabled : fallback.enabled,
      requireAuth:
        typeof value.requireAuth === 'boolean'
          ? value.requireAuth
          : fallback.requireAuth,
    };
  }

  return { ...fallback };
}

export function normalizeHeaderNavModules(rawModules) {
  const normalized = {
    ...defaultHeaderNavModules,
    pricing: { ...defaultHeaderNavModules.pricing },
    subscriptions: { ...defaultHeaderNavModules.subscriptions },
  };

  if (!rawModules || typeof rawModules !== 'object') {
    return normalized;
  }

  Object.entries(rawModules).forEach(([key, value]) => {
    if (accessModuleKeys.has(key)) {
      normalized[key] = normalizeAccessModule(value, normalized[key]);
      return;
    }

    if (typeof value === 'boolean') {
      normalized[key] = value;
    }
  });

  return normalized;
}

export function parseHeaderNavModulesConfig(rawConfig) {
  if (!rawConfig) {
    return normalizeHeaderNavModules(null);
  }

  if (typeof rawConfig === 'object') {
    return normalizeHeaderNavModules(rawConfig);
  }

  try {
    return normalizeHeaderNavModules(JSON.parse(rawConfig));
  } catch (error) {
    console.error('解析顶栏模块配置失败:', error);
    return normalizeHeaderNavModules(null);
  }
}

export const useNavigation = (t, docsLink, headerNavModules) => {
  const mainNavLinks = useMemo(() => {
    const modules = normalizeHeaderNavModules(headerNavModules);

    const allLinks = [
      {
        text: t('首页'),
        itemKey: 'home',
        to: '/',
      },
      {
        text: t('控制台'),
        itemKey: 'console',
        to: '/console',
      },
      {
        text: t('模型广场'),
        itemKey: 'pricing',
        to: '/pricing',
      },
      {
        text: t('订阅广场'),
        itemKey: 'subscriptions',
        to: '/subscription-plans',
      },
      {
        text: 'VibeCoding',
        itemKey: 'vibecoding',
        items: [
          {
            itemKey: 'vibecoding-claude',
            text: 'Claude Code',
            to: '/vibecoding/claude',
          },
          {
            itemKey: 'vibecoding-codex',
            text: 'Codex Code',
            to: '/vibecoding/codex',
          },
          {
            itemKey: 'vibecoding-gemini',
            text: 'Gemini Code',
            to: '/vibecoding/gemini',
          },
        ],
      },
      ...(docsLink
        ? [
            {
              text: t('文档'),
              itemKey: 'docs',
              items: [
                // {
                //   itemKey: 'docs-official',
                //   text: t('官方文档'),
                //   isExternal: true,
                //   externalLink: docsLink,
                // },
                {
                  itemKey: 'docs-openclaw',
                  text: 'OpenClaw',
                  to: '/openclaw',
                },
              ],
            },
          ]
        : []),
      {
        text: t('关于'),
        itemKey: 'about',
        to: '/about',
      },
      {
        text: t('联系我们'),
        itemKey: 'contact',
        to: '/contact',
      },
    ];

    // 根据配置过滤导航链接
    return allLinks.filter((link) => {
      if (link.itemKey === 'docs') {
        return docsLink && modules.docs;
      }
      if (link.itemKey === 'pricing') {
        // 支持新的pricing配置格式
        return typeof modules.pricing === 'object'
          ? modules.pricing.enabled
          : modules.pricing;
      }
      if (link.itemKey === 'subscriptions') {
        return typeof modules.subscriptions === 'object'
          ? modules.subscriptions.enabled
          : modules.subscriptions;
      }
      if (link.itemKey === 'vibecoding') {
        return modules.vibecoding !== false;
      }
      return modules[link.itemKey] === true;
    });
  }, [t, docsLink, headerNavModules]);

  return {
    mainNavLinks,
  };
};
