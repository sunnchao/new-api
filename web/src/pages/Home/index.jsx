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

import React, { useContext, useEffect, useState } from 'react';
import {
  Button,
  Typography,
  Input,
  ScrollList,
  ScrollItem,
  Card,
  Row,
  Col,
} from '@douyinfe/semi-ui';
import { API, showError, copy, showSuccess } from '../../helpers';
import { useIsMobile } from '../../hooks/common/useIsMobile';
import { API_ENDPOINTS } from '../../constants/common.constant';
import { StatusContext } from '../../context/Status';
import { useActualTheme } from '../../context/Theme';
import { marked } from 'marked';
import { useTranslation } from 'react-i18next';
import {
  IconGithubLogo,
  IconPlay,
  IconFile,
  IconCopy,
} from '@douyinfe/semi-icons';
import { Link } from 'react-router-dom';
import NoticeModal from '../../components/layout/NoticeModal';
import {
  Moonshot,
  OpenAI,
  XAI,
  Zhipu,
  Volcengine,
  Cohere,
  Claude,
  Gemini,
  Suno,
  Minimax,
  Wenxin,
  Spark,
  Qingyan,
  DeepSeek,
  Qwen,
  Midjourney,
  Grok,
  AzureAI,
  Hunyuan,
  Xinference,
} from '@lobehub/icons';

const { Text } = Typography;

const Home = () => {
  const { t, i18n } = useTranslation();
  const [statusState] = useContext(StatusContext);
  const actualTheme = useActualTheme();
  const [homePageContentLoaded, setHomePageContentLoaded] = useState(false);
  const [homePageContent, setHomePageContent] = useState('');
  const [noticeVisible, setNoticeVisible] = useState(false);
  const isMobile = useIsMobile();
  const isDemoSiteMode = statusState?.status?.demo_site_enabled || false;
  const docsLink = statusState?.status?.docs_link || '';
  const serverAddress =
    statusState?.status?.server_address || `${window.location.origin}`;
  const endpointItems = API_ENDPOINTS.map((e) => ({ value: e }));
  const [endpointIndex, setEndpointIndex] = useState(0);
  const isChinese = i18n.language.startsWith('zh');

  const displayHomePageContent = async () => {
    setHomePageContent(localStorage.getItem('home_page_content') || '');
    const res = await API.get('/api/home_page_content');
    const { success, message, data } = res.data;
    if (success) {
      let content = data;
      if (!data.startsWith('https://')) {
        content = marked.parse(data);
      }
      setHomePageContent(content);
      localStorage.setItem('home_page_content', content);

      // 如果内容是 URL，则发送主题模式
      if (data.startsWith('https://')) {
        const iframe = document.querySelector('iframe');
        if (iframe) {
          iframe.onload = () => {
            iframe.contentWindow.postMessage({ themeMode: actualTheme }, '*');
            iframe.contentWindow.postMessage({ lang: i18n.language }, '*');
          };
        }
      }
    } else {
      showError(message);
      setHomePageContent('加载首页内容失败...');
    }
    setHomePageContentLoaded(true);
  };

  const handleCopyBaseURL = async () => {
    const ok = await copy(serverAddress);
    if (ok) {
      showSuccess(t('已复制到剪切板'));
    }
  };

  useEffect(() => {
    const checkNoticeAndShow = async () => {
      const lastCloseDate = localStorage.getItem('notice_close_date');
      const today = new Date().toDateString();
      if (lastCloseDate !== today) {
        try {
          const res = await API.get('/api/notice');
          const { success, data } = res.data;
          if (success && data && data.trim() !== '') {
            setNoticeVisible(true);
          }
        } catch (error) {
          console.error('获取公告失败:', error);
        }
      }
    };

    checkNoticeAndShow();
  }, []);

  useEffect(() => {
    displayHomePageContent().then();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setEndpointIndex((prev) => (prev + 1) % endpointItems.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [endpointItems.length]);

  return (
    <div className='w-full overflow-x-hidden'>
      <NoticeModal
        visible={noticeVisible}
        onClose={() => setNoticeVisible(false)}
        isMobile={isMobile}
      />
      {homePageContentLoaded && homePageContent === '' ? (
        <div className='w-full overflow-x-hidden'>
          {/* Banner 部分 */}
          <div className='w-full border-b border-semi-color-border min-h-[500px] md:min-h-[600px] lg:min-h-[700px] relative overflow-x-hidden'>
            {/* 背景模糊晕染球 */}
            <div className='blur-ball blur-ball-indigo' />
            <div className='blur-ball blur-ball-teal' />
            <div className='flex items-center justify-center h-full px-4 py-20 md:py-24 lg:py-32 mt-10'>
              {/* 居中内容区 */}
              <div className='flex flex-col items-center justify-center text-center max-w-4xl mx-auto'>
                <div className='flex flex-col items-center justify-center mb-6 md:mb-8'>
                  <h1
                    className={`text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-semi-color-text-0 leading-tight ${isChinese ? 'tracking-wide md:tracking-wider' : ''}`}
                  >
                    <>
                      {t('统一的')}
                      <br />
                      <span className='shine-text'>{t('大模型接口网关')}</span>
                    </>
                  </h1>
                  <p className='text-base md:text-lg lg:text-xl text-semi-color-text-1 mt-4 md:mt-6 max-w-xl'>
                    {t('更好的价格，更好的稳定性，只需要将模型基址替换为：')}
                  </p>
                  {/* BASE URL 与端点选择 */}
                  <div className='flex flex-col md:flex-row items-center justify-center gap-4 w-full mt-4 md:mt-6 max-w-md'>
                    <Input
                      readonly
                      value={serverAddress}
                      className='flex-1 !rounded-full'
                      size={isMobile ? 'default' : 'large'}
                      suffix={
                        <div className='flex items-center gap-2'>
                          <ScrollList
                            bodyHeight={32}
                            style={{ border: 'unset', boxShadow: 'unset' }}
                          >
                            <ScrollItem
                              mode='wheel'
                              cycled={true}
                              list={endpointItems}
                              selectedIndex={endpointIndex}
                              onSelect={({ index }) => setEndpointIndex(index)}
                            />
                          </ScrollList>
                          <Button
                            type='primary'
                            onClick={handleCopyBaseURL}
                            icon={<IconCopy />}
                            className='!rounded-full'
                          />
                        </div>
                      }
                    />
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className='flex flex-row gap-4 justify-center items-center'>
                  <Link to='/console'>
                    <Button
                      theme='solid'
                      type='primary'
                      size={isMobile ? 'default' : 'large'}
                      className='!rounded-3xl px-8 py-2'
                      icon={<IconPlay />}
                    >
                      {t('获取密钥')}
                    </Button>
                  </Link>
                  {isDemoSiteMode && statusState?.status?.version ? (
                    <Button
                      size={isMobile ? 'default' : 'large'}
                      className='flex items-center !rounded-3xl px-6 py-2'
                      icon={<IconGithubLogo />}
                      onClick={() =>
                        window.open(
                          'https://github.com/QuantumNous/new-api',
                          '_blank',
                        )
                      }
                    >
                      {statusState.status.version}
                    </Button>
                  ) : (
                    docsLink && (
                      <Button
                        size={isMobile ? 'default' : 'large'}
                        className='flex items-center !rounded-3xl px-6 py-2'
                        icon={<IconFile />}
                        onClick={() => window.open(docsLink, '_blank')}
                      >
                        {t('文档')}
                      </Button>
                    )
                  )}
                </div>

                {/* 框架兼容性图标 */}
                <div className='mt-12 md:mt-16 lg:mt-20 w-full'>
                  <div className='flex items-center mb-6 md:mb-8 justify-center'>
                    <Text
                      type='tertiary'
                      className='text-lg md:text-xl lg:text-2xl font-light'
                    >
                      {t('支持众多的大模型供应商')}
                    </Text>
                  </div>
                  <div className='flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6 lg:gap-8 max-w-5xl mx-auto px-4'>
                    <div className='w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center'>
                      <Moonshot size={40} />
                    </div>
                    <div className='w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center'>
                      <OpenAI size={40} />
                    </div>
                    <div className='w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center'>
                      <XAI size={40} />
                    </div>
                    <div className='w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center'>
                      <Zhipu.Color size={40} />
                    </div>
                    <div className='w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center'>
                      <Volcengine.Color size={40} />
                    </div>
                    <div className='w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center'>
                      <Cohere.Color size={40} />
                    </div>
                    <div className='w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center'>
                      <Claude.Color size={40} />
                    </div>
                    <div className='w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center'>
                      <Gemini.Color size={40} />
                    </div>
                    <div className='w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center'>
                      <Suno size={40} />
                    </div>
                    <div className='w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center'>
                      <Minimax.Color size={40} />
                    </div>
                    <div className='w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center'>
                      <Wenxin.Color size={40} />
                    </div>
                    <div className='w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center'>
                      <Spark.Color size={40} />
                    </div>
                    <div className='w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center'>
                      <Qingyan.Color size={40} />
                    </div>
                    <div className='w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center'>
                      <DeepSeek.Color size={40} />
                    </div>
                    <div className='w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center'>
                      <Qwen.Color size={40} />
                    </div>
                    <div className='w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center'>
                      <Midjourney size={40} />
                    </div>
                    <div className='w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center'>
                      <Grok size={40} />
                    </div>
                    <div className='w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center'>
                      <AzureAI.Color size={40} />
                    </div>
                    <div className='w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center'>
                      <Hunyuan.Color size={40} />
                    </div>
                    <div className='w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center'>
                      <Xinference.Color size={40} />
                    </div>
                    <div className='w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center'>
                      <Typography.Text className='!text-lg sm:!text-xl md:!text-2xl lg:!text-3xl font-bold'>
                        30+
                      </Typography.Text>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className='w-full py-16 md:py-20 lg:py-24 px-4 md:px-8'>
            <div className='max-w-6xl mx-auto'>
              <div className='text-center mb-12 md:mb-16'>
                <div className='inline-block px-4 py-2 rounded-full bg-semi-color-fill-1 border border-semi-color-border text-sm text-semi-color-text-2 mb-4'>
                  {t('AI-Powered Development')}
                </div>
                <h2 className='text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-semi-color-primary to-purple-600 bg-clip-text text-transparent mb-4'>
                  {t('Vibe Coding')}
                </h2>
                <p className='text-lg md:text-xl text-semi-color-text-1'>
                  {t('AI 编程助手全家桶')}
                </p>
                <p className='text-base md:text-lg text-semi-color-text-2 mt-2 max-w-2xl mx-auto'>
                  {t('三款强大 AI 编程工具，覆盖终端、IDE、云端全场景，全面提升您的开发效率')}
                </p>
              </div>

              <Row gutter={[24, 24]} className='mt-8'>
                <Col span={24} md={8}>
                  <Link to='/claude-code' className='block h-full group'>
                    <Card
                      shadows='hover'
                      className='h-full !rounded-2xl border-2 hover:border-purple-400 dark:hover:border-purple-600 transition-all duration-300 !bg-white dark:!bg-semi-color-fill-0'
                      bodyStyle={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}
                    >
                      <div className='flex items-center justify-between mb-6'>
                         <div className='p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300'>
                            <svg className='w-6 h-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' />
                            </svg>
                         </div>
                        <span className='px-3 py-1 rounded-full bg-purple-50 text-purple-600 text-xs font-bold dark:bg-purple-900/30 dark:text-purple-300'>
                          Anthropic
                        </span>
                      </div>
                      <h3 className='text-xl md:text-2xl font-bold text-semi-color-text-0 mb-2 group-hover:text-purple-600 transition-colors'>
                        Claude Code
                      </h3>
                      <p className='text-sm text-semi-color-text-2 mb-6 min-h-[40px]'>
                        {t('终端集成 · 结对编程 · 深度理解')}
                      </p>
                      <ul className='space-y-3 mt-auto'>
                        <li className='text-sm text-semi-color-text-1 flex items-start'>
                          <div className='w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mr-3 mt-0.5'>
                            <svg className='w-3 h-3 text-purple-600 dark:text-purple-400' fill='currentColor' viewBox='0 0 20 20'>
                               <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                            </svg>
                          </div>
                          {t('Claude Opus 4.5 驱动')}
                        </li>
                        <li className='text-sm text-semi-color-text-1 flex items-start'>
                          <div className='w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mr-3 mt-0.5'>
                            <svg className='w-3 h-3 text-purple-600 dark:text-purple-400' fill='currentColor' viewBox='0 0 20 20'>
                               <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                            </svg>
                          </div>
                          {t('深度理解代码上下文')}
                        </li>
                        <li className='text-sm text-semi-color-text-1 flex items-start'>
                           <div className='w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mr-3 mt-0.5'>
                            <svg className='w-3 h-3 text-purple-600 dark:text-purple-400' fill='currentColor' viewBox='0 0 20 20'>
                               <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                            </svg>
                          </div>
                          {t('智能调试与文档生成')}
                        </li>
                         <li className='text-sm text-semi-color-text-1 flex items-start'>
                           <div className='w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mr-3 mt-0.5'>
                            <svg className='w-3 h-3 text-purple-600 dark:text-purple-400' fill='currentColor' viewBox='0 0 20 20'>
                               <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                            </svg>
                          </div>
                          {t('全平台 CLI 支持')}
                        </li>
                      </ul>
                    </Card>
                  </Link>
                </Col>

                <Col span={24} md={8}>
                  <Link to='/codex-code' className='block h-full group'>
                    <Card
                      shadows='hover'
                      className='h-full !rounded-2xl border-2 hover:border-green-400 dark:hover:border-green-600 transition-all duration-300 !bg-white dark:!bg-semi-color-fill-0'
                      bodyStyle={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}
                    >
                      <div className='flex items-center justify-between mb-6'>
                         <div className='p-3 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-300'>
                            <svg className='w-6 h-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                               <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' />
                            </svg>
                         </div>
                        <span className='px-3 py-1 rounded-full bg-green-50 text-green-600 text-xs font-bold dark:bg-green-900/30 dark:text-green-300'>
                          OpenAI
                        </span>
                      </div>
                      <h3 className='text-xl md:text-2xl font-bold text-semi-color-text-0 mb-2 group-hover:text-green-600 transition-colors'>
                        Codex CLI
                      </h3>
                      <p className='text-sm text-semi-color-text-2 mb-6 min-h-[40px]'>
                        {t('企业级 · 智能重构 · 实时联网')}
                      </p>
                      <ul className='space-y-3 mt-auto'>
                        <li className='text-sm text-semi-color-text-1 flex items-start'>
                           <div className='w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3 mt-0.5'>
                            <svg className='w-3 h-3 text-green-600 dark:text-green-400' fill='currentColor' viewBox='0 0 20 20'>
                               <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                            </svg>
                          </div>
                          {t('GPT 5.2驱动')}
                        </li>
                        <li className='text-sm text-semi-color-text-1 flex items-start'>
                           <div className='w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3 mt-0.5'>
                            <svg className='w-3 h-3 text-green-600 dark:text-green-400' fill='currentColor' viewBox='0 0 20 20'>
                               <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                            </svg>
                          </div>
                          {t('实时联网能力')}
                        </li>
                        <li className='text-sm text-semi-color-text-1 flex items-start'>
                           <div className='w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3 mt-0.5'>
                            <svg className='w-3 h-3 text-green-600 dark:text-green-400' fill='currentColor' viewBox='0 0 20 20'>
                               <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                            </svg>
                          </div>
                          {t('智能代码重构')}
                        </li>
                         <li className='text-sm text-semi-color-text-1 flex items-start'>
                           <div className='w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3 mt-0.5'>
                            <svg className='w-3 h-3 text-green-600 dark:text-green-400' fill='currentColor' viewBox='0 0 20 20'>
                               <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                            </svg>
                          </div>
                          {t('VSCode 深度集成')}
                        </li>
                      </ul>
                    </Card>
                  </Link>
                </Col>

                <Col span={24} md={8}>
                  <Link to='/gemini-code' className='block h-full group'>
                    <Card
                      shadows='hover'
                      className='h-full !rounded-2xl border-2 hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-300 !bg-white dark:!bg-semi-color-fill-0'
                      bodyStyle={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}
                    >
                      <div className='flex items-center justify-between mb-6'>
                         <div className='p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300'>
                            <svg className='w-6 h-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                               <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 10V3L4 14h7v7l9-11h-7z' />
                            </svg>
                         </div>
                        <span className='px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold dark:bg-blue-900/30 dark:text-blue-300'>
                          Google
                        </span>
                      </div>
                      <h3 className='text-xl md:text-2xl font-bold text-semi-color-text-0 mb-2 group-hover:text-blue-600 transition-colors'>
                        Gemini CLI
                      </h3>
                      <p className='text-sm text-semi-color-text-2 mb-6 min-h-[40px]'>
                        {t('超大上下文 · Agent模式 · 多模态')}
                      </p>
                      <ul className='space-y-3 mt-auto'>
                        <li className='text-sm text-semi-color-text-1 flex items-start'>
                           <div className='w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3 mt-0.5'>
                            <svg className='w-3 h-3 text-blue-600 dark:text-blue-400' fill='currentColor' viewBox='0 0 20 20'>
                               <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                            </svg>
                          </div>
                          {t('1M tokens 超大上下文')}
                        </li>
                        <li className='text-sm text-semi-color-text-1 flex items-start'>
                           <div className='w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3 mt-0.5'>
                            <svg className='w-3 h-3 text-blue-600 dark:text-blue-400' fill='currentColor' viewBox='0 0 20 20'>
                               <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                            </svg>
                          </div>
                          {t('Agent Mode 自动规划')}
                        </li>
                        <li className='text-sm text-semi-color-text-1 flex items-start'>
                           <div className='w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3 mt-0.5'>
                            <svg className='w-3 h-3 text-blue-600 dark:text-blue-400' fill='currentColor' viewBox='0 0 20 20'>
                               <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                            </svg>
                          </div>
                          {t('内置 Google Search')}
                        </li>
                        <li className='text-sm text-semi-color-text-1 flex items-start'>
                           <div className='w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3 mt-0.5'>
                            <svg className='w-3 h-3 text-blue-600 dark:text-blue-400' fill='currentColor' viewBox='0 0 20 20'>
                               <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                            </svg>
                          </div>
                          {t('多模态输入支持')}
                        </li>
                      </ul>
                    </Card>
                  </Link>
                </Col>
              </Row>
            </div>
          </div>

          <div className='w-full py-16 md:py-24 lg:py-32 px-4 md:px-8 relative overflow-hidden'>
            <div className='absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-[1200px] pointer-events-none'>
               <div className='absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-100/30 dark:bg-purple-900/10 rounded-full blur-[100px]' />
               <div className='absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-100/30 dark:bg-blue-900/10 rounded-full blur-[100px]' />
            </div>
            
            <div className='max-w-7xl mx-auto relative z-10'>
              <div className='text-center mb-16 md:mb-20'>
                <h2 className='text-3xl md:text-4xl lg:text-5xl font-bold text-semi-color-text-0 mb-6 tracking-tight'>
                  {t('核心优势')}
                </h2>
                <p className='text-lg md:text-xl text-semi-color-text-2 max-w-3xl mx-auto leading-relaxed'>
                  {t('我们为您的AI应用提供企业级性能保障，确保每一次调用都稳定高效')}
                </p>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-10'>
                {[
                  {
                    icon: (
                      <svg className='w-7 h-7 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 10V3L4 14h7v7l9-11h-7z' />
                      </svg>
                    ),
                    color: 'from-blue-500 to-indigo-600',
                    shadow: 'shadow-blue-500/20',
                    hoverBg: 'group-hover:bg-blue-50/50 dark:group-hover:bg-blue-900/10',
                    hoverBorder: 'group-hover:border-blue-200 dark:group-hover:border-blue-800',
                    title: t('极速响应'),
                    items: [
                      t('毫秒级API响应时间'),
                      t('千万级并发处理能力'),
                      t('智能负载均衡系统'),
                      t('超两年稳定运行验证')
                    ]
                  },
                  {
                     icon: (
                      <svg className='w-7 h-7 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                      </svg>
                    ),
                    color: 'from-emerald-500 to-teal-600',
                     shadow: 'shadow-emerald-500/20',
                     hoverBg: 'group-hover:bg-emerald-50/50 dark:group-hover:bg-emerald-900/10',
                     hoverBorder: 'group-hover:border-emerald-200 dark:group-hover:border-emerald-800',
                    title: t('全球网络'),
                    items: [
                      t('全球多区域节点部署'),
                      t('CN2 GIA专线接入'),
                      t('全球70+高速中转节点'),
                      t('智能路由优化')
                    ]
                  },
                  {
                     icon: (
                      <svg className='w-7 h-7 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                      </svg>
                    ),
                    color: 'from-violet-500 to-purple-600',
                     shadow: 'shadow-violet-500/20',
                     hoverBg: 'group-hover:bg-violet-50/50 dark:group-hover:bg-violet-900/10',
                     hoverBorder: 'group-hover:border-violet-200 dark:group-hover:border-violet-800',
                    title: t('透明计费'),
                    items: [
                      t('官方标准计费模式'),
                      t('无任何隐藏费用'),
                      t('按需使用成本可控'),
                      t('账户余额永不过期')
                    ]
                  },
                  {
                     icon: (
                      <svg className='w-7 h-7 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' />
                      </svg>
                    ),
                    color: 'from-orange-500 to-amber-600',
                     shadow: 'shadow-orange-500/20',
                     hoverBg: 'group-hover:bg-orange-50/50 dark:group-hover:bg-orange-900/10',
                     hoverBorder: 'group-hover:border-orange-200 dark:group-hover:border-orange-800',
                    title: t('全面兼容'),
                    items: [
                      t('完美兼容OpenAI, Claude, Gemini'),
                      t('支持全球所有主流大语言模型'),
                      t('轻松集成现有应用工作流'),
                      t('模型库与功能持续更新')
                    ]
                  },
                  {
                     icon: (
                      <svg className='w-7 h-7 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z' />
                      </svg>
                    ),
                    color: 'from-pink-500 to-rose-600',
                     shadow: 'shadow-pink-500/20',
                     hoverBg: 'group-hover:bg-pink-50/50 dark:group-hover:bg-pink-900/10',
                     hoverBorder: 'group-hover:border-pink-200 dark:group-hover:border-pink-800',
                    title: t('服务保障'),
                    items: [
                      t('7x24小时在线服务'),
                      t('便捷的在线自助充值'),
                      t('详尽的消费日志查询'),
                      t('专业工程师技术支持')
                    ]
                  },
                  {
                     icon: (
                      <svg className='w-7 h-7 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' />
                      </svg>
                    ),
                    color: 'from-cyan-500 to-blue-600',
                     shadow: 'shadow-cyan-500/20',
                     hoverBg: 'group-hover:bg-cyan-50/50 dark:group-hover:bg-cyan-900/10',
                     hoverBorder: 'group-hover:border-cyan-200 dark:group-hover:border-cyan-800',
                    title: t('Midjourney支持'),
                    items: [
                      t('内置提示词中文优化'),
                      t('高速稳定的反向代理'),
                      t('同步支持最新版本'),
                      t('高并发任务处理')
                    ]
                  }
                ].map((item, index) => (
                  <div key={index} className={`group bg-white dark:bg-semi-color-fill-0 ${item.hoverBg} border border-semi-color-border ${item.hoverBorder} rounded-2xl p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}>
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} ${item.shadow} flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300`}>
                      {item.icon}
                    </div>
                    <h3 className='text-xl font-bold text-semi-color-text-0 mb-4'>
                      {item.title}
                    </h3>
                    <ul className='space-y-3'>
                      {item.items.map((subItem, idx) => (
                        <li key={idx} className='text-[15px] text-semi-color-text-1 flex items-start'>
                           <span className={`inline-block w-1.5 h-1.5 rounded-full bg-gradient-to-br ${item.color} mt-2 mr-2.5 flex-shrink-0 opacity-50`}></span>
                           {subItem}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className='w-full py-16 md:py-24 lg:py-32 px-4 md:px-8'>
            <div className='max-w-6xl mx-auto'>
              <div className='text-center mb-16 md:mb-20'>
                <h2 className='text-3xl md:text-4xl lg:text-5xl font-bold text-semi-color-text-0 mb-6'>
                  {t('联系我们')}
                </h2>
                <p className='text-lg md:text-xl text-semi-color-text-2 max-w-2xl mx-auto leading-relaxed'>
                  {t('我们的团队随时为您提供支持和帮助，解决您在使用过程中遇到的任何问题')}
                </p>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 max-w-5xl mx-auto'>
                <a href='mailto:chirou.api@outlook.com' className='block group h-full'>
                  <div className='h-full bg-white dark:bg-semi-color-fill-0 border border-semi-color-border group-hover:border-blue-200 dark:group-hover:border-blue-800 group-hover:bg-blue-50/30 dark:group-hover:bg-blue-900/10 rounded-3xl p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden'>
                     <div className='absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500' />
                    
                    <div className='w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300'>
                      <svg className='w-8 h-8 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
                      </svg>
                    </div>
                    <h3 className='text-xl font-bold text-semi-color-text-0 mb-2 group-hover:text-blue-600 transition-colors'>
                      {t('邮件支持')}
                    </h3>
                    <p className='text-base text-semi-color-text-1 mb-4'>
                      {t('发送邮件联系我们，通常在24小时内回复')}
                    </p>
                    <p className='text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 py-2 px-4 rounded-full inline-block'>
                      chirou.api@outlook.com
                    </p>
                  </div>
                </a>

                <div className='block h-full cursor-default group'>
                  <div className='h-full bg-white dark:bg-semi-color-fill-0 border border-semi-color-border group-hover:border-emerald-200 dark:group-hover:border-emerald-800 group-hover:bg-emerald-50/30 dark:group-hover:bg-emerald-900/10 rounded-3xl p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden'>
                     <div className='absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500' />
                    <div className='w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-300'>
                      <svg className='w-8 h-8 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' />
                      </svg>
                    </div>
                    <h3 className='text-xl font-bold text-semi-color-text-0 mb-2'>
                      {t('QQ 交流群')}
                    </h3>
                    <p className='text-base text-semi-color-text-1 mb-4'>
                      {t('加入用户交流群，获取最新资讯')}
                    </p>
                     <p className='text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 py-2 px-4 rounded-full inline-block select-all'>
                      924076327
                    </p>
                  </div>
                </div>

                <a href='https://t.me/chirou_api' target='_blank' rel='noopener noreferrer' className='block group h-full'>
                  <div className='h-full bg-white dark:bg-semi-color-fill-0 border border-semi-color-border group-hover:border-cyan-200 dark:group-hover:border-cyan-800 group-hover:bg-cyan-50/30 dark:group-hover:bg-cyan-900/10 rounded-3xl p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden'>
                     <div className='absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-bl-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500' />
                    <div className='w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center mb-6 shadow-lg shadow-cyan-500/30 group-hover:scale-110 transition-transform duration-300'>
                      <svg className='w-8 h-8 text-white' fill='currentColor' viewBox='0 0 24 24'>
                        <path d='M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z' />
                      </svg>
                    </div>
                    <h3 className='text-xl font-bold text-semi-color-text-0 mb-2 group-hover:text-cyan-600 transition-colors'>
                      Telegram
                    </h3>
                    <p className='text-base text-semi-color-text-1 mb-4'>
                      {t('关注 TG 频道，获取实时通知')}
                    </p>
                    <p className='text-sm font-medium text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20 py-2 px-4 rounded-full inline-block'>
                      @chirou_api
                    </p>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className='overflow-x-hidden w-full'>
          {homePageContent.startsWith('https://') ? (
            <iframe
              src={homePageContent}
              className='w-full h-screen border-none'
            />
          ) : (
            <div
              className='mt-[60px]'
              dangerouslySetInnerHTML={{ __html: homePageContent }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Home;
