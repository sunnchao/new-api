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

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SEO_CONFIG = {
  default: {
    title: 'Chirou API - 新一代大模型网关与AI管理系统',
    description: 'Chirou API 是开源的大模型网关与AI资产管理系统，支持 OpenAI、Claude、Gemini、Azure、Midjourney 等多种 AI 模型接口聚合管理。',
    keywords: 'Chirou API,OpenAI API,AI网关,大模型管理,API聚合,Claude API,Gemini API'
  },
  routes: {
    '/': {
      title: 'Chirou API - 新一代大模型网关与AI管理系统 | 首页',
      description: '开源的大模型网关与AI管理系统，支持 OpenAI、Claude、Gemini、Azure、Midjourney 等多种 AI 模型接口聚合管理。'
    },
    '/panel/dashboard': {
      title: '控制台 - Chirou API',
      description: '查看 API 使用统计、模型调用数据、费用分析等实时数据看板。'
    },
    '/panel/token': {
      title: '令牌管理 - Chirou API',
      description: '管理 API 令牌、设置访问权限、查看令牌使用情况。'
    },
    '/panel/channel': {
      title: '渠道管理 - Chirou API',
      description: '配置和管理多个 AI 模型渠道，包括 OpenAI、Claude、Gemini、Azure 等。'
    },
    '/panel/model': {
      title: '模型管理 - Chirou API',
      description: '管理支持的 AI 模型列表、配置模型参数和定价策略。'
    },
    '/pricing': {
      title: '价格方案 - Chirou API',
      description: '查看 Chirou API 的定价方案和各模型的费用标准。'
    },
    '/about': {
      title: '关于我们 - Chirou API',
      description: '了解 Chirou API 项目背景、开发团队和开源协议。'
    }
  }
};

export const useSEO = () => {
  const location = useLocation();

  useEffect(() => {
    const route = SEO_CONFIG.routes[location.pathname] || SEO_CONFIG.default;
    
    // Update title
    document.title = route.title;
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', route.description);
    }
    
    // Update OG tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', route.title);
    }
    
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute('content', route.description);
    }
    
    // Update Twitter tags
    const twitterTitle = document.querySelector('meta[property="twitter:title"]');
    if (twitterTitle) {
      twitterTitle.setAttribute('content', route.title);
    }
    
    const twitterDescription = document.querySelector('meta[property="twitter:description"]');
    if (twitterDescription) {
      twitterDescription.setAttribute('content', route.description);
    }
    
    // Update canonical URL
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute('href', `https://wochirou.com${location.pathname}`);
    }
  }, [location]);
};

export default useSEO;
