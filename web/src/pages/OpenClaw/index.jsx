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

import React from 'react';
import { Typography, Card, Tabs, TabPane, Space, List, Tag, Button, Row } from '@douyinfe/semi-ui';
import { Zap, Shield, Globe, Terminal, ArrowRight, CheckCircle2, Download, Key, Rocket } from 'lucide-react';
import InstallationGuide from '../../components/InstallationGuide';

const { Title, Paragraph, Text } = Typography;

const OpenClawTutorial = () => {
  const features = [
    {
      icon: <Globe className='text-blue-500' size={24} />,
      title: '多渠道 Gateway 网关',
      description: '通过一个 Gateway 进程连接 WhatsApp、Telegram、Discord、iMessage 等渠道',
    },
    {
      icon: <Shield className='text-green-500' size={24} />,
      title: '多智能体路由',
      description: '按智能体、工作区或发送者隔离会话，适合多人和多任务场景',
    },
    {
      icon: <Terminal className='text-purple-500' size={24} />,
      title: 'Web 控制界面',
      description: '在浏览器中管理聊天、配置、会话和节点，便于日常运维与排障',
    },
    {
      icon: <Zap className='text-orange-500' size={24} />,
      title: '媒体与插件扩展',
      description: '支持图片、音频、文档，并可通过插件扩展更多消息渠道',
    },
  ];

  const techSpecs = [
    {
      title: 'CLI 工具',
      description: 'npm 全局安装，命令行管理 Gateway 与渠道',
      icon: <Terminal size={20} />,
    },
    {
      title: '配置文件',
      description: '统一配置位于 ~/.openclaw/openclaw.json',
      icon: <Zap size={20} />,
    },
    {
      title: '部署方式',
      description: '支持本地与远程部署，兼容 Windows/macOS/Linux',
      icon: <Globe size={20} />,
    },
  ];

  const overviewSteps = [
    {
      title: "功能概览",
      content: (
        <div>
          <Paragraph className='mb-4'>
            OpenClaw 是一个 AI 智能体 Gateway 网关，通过单个网关进程连接聊天应用与智能体，统一管理会话、路由和渠道配置。
          </Paragraph>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {features.map((feature, index) => (
              <div
                key={index}
                className='p-4 rounded-xl transition-all duration-300'
                style={{
                  background: 'var(--semi-color-fill-0)',
                  border: '1px solid var(--semi-color-border)',
                }}
              >
                <div className='mb-3'>{feature.icon}</div>
                <Title heading={5} className='mb-2'>{feature.title}</Title>
                <Text type='tertiary' size='small'>{feature.description}</Text>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      title: "技术规格",
      content: (
        <div>
          <Paragraph className='mb-4'>了解 OpenClaw 的技术规格：</Paragraph>
          <div className='space-y-3'>
            {techSpecs.map((spec, index) => (
              <div
                key={index}
                className='flex items-center gap-4 p-4 rounded-lg'
                style={{
                  background: 'var(--semi-color-fill-0)',
                  border: '1px solid var(--semi-color-border)',
                }}
              >
                <div className='flex-shrink-0 text-blue-500'>{spec.icon}</div>
                <div>
                  <Title heading={5} style={{ margin: 0 }}>{spec.title}</Title>
                  <Text type='secondary'>{spec.description}</Text>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }
  ];

  const installSteps = [
    {
      title: "安装 CLI 工具",
      content: (
        <div>
          <Paragraph className='mb-4'>支持 Windows、macOS、Linux 系统：</Paragraph>
          <div className='space-y-3'>
            <div>
              <Text strong className='mb-2 block'>使用 npm 全局安装：</Text>
              <div className='p-4 bg-gray-900 text-gray-100 rounded-lg font-mono text-sm'>
                <div>npm install -g openclaw</div>
              </div>
            </div>
            <div>
              <Text strong className='mb-2 block'>验证安装：</Text>
              <div className='p-4 bg-gray-900 text-gray-100 rounded-lg font-mono text-sm'>
                <div>openclaw --version</div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "配置 API（openclaw.json）",
      content: (
        <div>
          <Paragraph className='mb-4'>将 API 提供商信息写入 <Text code>~/.openclaw/openclaw.json</Text>：</Paragraph>
          <List
            dataSource={[
              '打开或创建 ~/.openclaw/openclaw.json',
              '在 providers 下添加服务商配置（baseUrl、apiKey、api、models）',
              '在 agents.defaults.model.primary 中指定默认模型',
              '保存后重启 openclaw，使配置生效'
            ]}
            renderItem={(item) => (
              <List.Item className='!p-3 !border-b-0 hover:bg-gray-50 rounded-lg transition-colors'>
                <div className='flex items-center gap-3'>
                  <CheckCircle2 size={18} className='text-green-500 flex-shrink-0' />
                  <span className='text-gray-700'>{item}</span>
                </div>
              </List.Item>
            )}
            split={false}
          />
          <div className='mt-6'>
            <Text strong className='mb-2 block'>配置示例：</Text>
            <div className='p-4 bg-gray-900 text-gray-100 rounded-lg font-mono text-sm overflow-x-auto'>
              <pre className='m-0 whitespace-pre-wrap'>{`{
  "providers": {
    "chirou": {
      "baseUrl": "https://api.wochirou.com",
      "apiKey": "你自己的 API Key",
      "api": "anthropic-messages",
      "models": [
        {
          "id": "claude-opus-4-5-20251101",
          "name": "Claude Opus 4.5",
          "reasoning": true,
          "input": ["text", "image"],
          "cost": {
            "input": 0,
            "output": 0,
            "cacheRead": 0,
            "cacheWrite": 0
          },
          "contextWindow": 200000,
          "maxTokens": 8192
        }
      ]
    }
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "chirou/claude-opus-4-5-20251101"
      }
    }
  }
}`}</pre>
            </div>
            <Text type='tertiary' size='small' className='mt-2 block'>
              请将示例中的 <Text code>apiKey</Text> 和模型信息替换为你自己的可用配置。
            </Text>
          </div>
        </div>
      )
    },
    {
      title: "启动 OpenClaw",
      content: (
        <div>
          <Paragraph className='mb-4'>开始 AI 结对编程之旅：</Paragraph>
          <div className='space-y-4'>
            <div>
              <Text strong className='mb-2 block'>启动 OpenClaw CLI：</Text>
              <div className='p-4 bg-gray-900 text-gray-100 rounded-lg font-mono text-sm'>
                <div>openclaw</div>
              </div>
            </div>
            <Paragraph>
              OpenClaw 会自动扫描您的项目，理解代码结构，并为您提供智能建议。
            </Paragraph>
          </div>
        </div>
      )
    }
  ];

  const apiKeySteps = [
    {
      title: "准备 API 参数",
      content: (
        <div>
          <Paragraph className='mb-4'>
            编辑 openclaw.json 前，请先准备以下参数：
          </Paragraph>
          <List
            dataSource={[
              '服务端点：例如 https://api.wochirou.com',
              '访问密钥：你自己的 API Key',
              'API 协议：例如 anthropic-messages',
              '模型 ID：例如 claude-opus-4-5-20251101',
              '默认模型路由：providersName/modelId（如 chirou/claude-opus-4-5-20251101）'
            ]}
            renderItem={(item) => (
              <List.Item className='!p-3 !border-b-0 hover:bg-gray-50 rounded-lg transition-colors'>
                <div className='flex items-center gap-3'>
                  <CheckCircle2 size={18} className='text-green-500 flex-shrink-0' />
                  <span className='text-gray-700'>{item}</span>
                </div>
              </List.Item>
            )}
            split={false}
          />
        </div>
      )
    },
    {
      title: "验证配置",
      content: (
        <div>
          <Paragraph className='mb-4'>保存配置后，可通过以下命令验证是否生效：</Paragraph>
          <div className='space-y-3'>
            <div>
              <Text strong className='mb-2 block'>启动 OpenClaw：</Text>
              <div className='p-4 bg-gray-900 text-gray-100 rounded-lg font-mono text-sm'>
                <div>openclaw</div>
              </div>
            </div>
            <div>
              <Text strong className='mb-2 block'>若需重新加载配置，可重启网关或 CLI 进程：</Text>
              <div className='p-4 bg-gray-900 text-gray-100 rounded-lg font-mono text-sm'>
                <div>openclaw gateway --port 18789</div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const tutorialSteps = [
    {
      title: "基础用法",
      content: (
        <div>
          <Paragraph className='mb-4'>OpenClaw 的基础使用方式：</Paragraph>
          <div className='space-y-4'>
            <div>
              <Text strong className='mb-2 block'>启动 OpenClaw：</Text>
              <div className='p-4 bg-gray-900 text-gray-100 rounded-lg font-mono text-sm overflow-x-auto'>
                <div className='mb-2'>$ openclaw</div>
                <div className='text-green-400'>Hello! I'm OpenClaw. How can I help you with your project today?</div>
              </div>
            </div>
            <div>
              <Text strong className='mb-2 block'>提出请求：</Text>
              <div className='p-4 bg-gray-900 text-gray-100 rounded-lg font-mono text-sm overflow-x-auto'>
                <div className='mb-2'>Refactor the user authentication module</div>
                <div className='text-blue-300'>I'll help you refactor the auth module. First, let me analyze the current implementation in src/auth...</div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "高级功能",
      content: (
        <div>
          <Paragraph className='mb-4'>OpenClaw 的高级功能：</Paragraph>
          <List
            dataSource={[
              {
                title: '代码审查',
                description: '让 OpenClaw 审查您的代码，发现潜在问题'
              },
              {
                title: '单元测试',
                description: '自动生成单元测试代码'
              },
              {
                title: '文档生成',
                description: '为函数和类自动生成文档注释'
              },
              {
                title: '性能优化',
                description: '分析代码性能，提供优化建议'
              }
            ]}
            renderItem={(item) => (
              <List.Item>
                <div className='p-4 rounded-lg' style={{ background: 'var(--semi-color-fill-0)' }}>
                  <div className='flex items-center gap-2 mb-2'>
                    <CheckCircle2 size={18} className='text-blue-500' />
                    <Text strong>{item.title}</Text>
                  </div>
                  <Text type='secondary'>{item.description}</Text>
                </div>
              </List.Item>
            )}
          />
        </div>
      )
    }
  ];

  const ctaCards = [
    {
      number: '1',
      title: '安装 CLI 工具',
      description: '支持 Windows, macOS, Linux',
      icon: <Download size={32} className='text-blue-500' />,
    },
    {
      number: '2',
      title: '配置 API 密钥',
      description: '编辑 openclaw.json 并设置默认模型',
      icon: <Key size={32} className='text-green-500' />,
    },
    {
      number: '3',
      title: '启动 OpenClaw',
      description: '开始 AI 结对编程之旅',
      icon: <Rocket size={32} className='text-purple-500' />,
    },
  ];

  function openOfficialWebsite() {
    window.open('https://openclaw.ai/', '_blank');
  }

  function openOfficialDocWebsite() {
    window.open('https://docs.openclaw.ai/start/getting-started', '_blank');
  }

  return (
      <div className='w-full overflow-x-hidden mt-20'>

    <div className='p-6 mx-auto'>
      <div className='mb-8'>
        <div className='inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white mb-6'>
          <Zap size={16} />
          <Text className='text-sm font-medium'>OpenClaw</Text>
        </div>

        <Title heading={1} className='mb-4 text-4xl md:text-5xl font-bold'>
          OpenClaw Gateway 使用教程
        </Title>

        <div className={'mt-3 mb-6'}>
          <Paragraph className='text-xl' style={{ color: 'var(--semi-color-text-1)', maxWidth: '800px' }}>
            本页聚焦 OpenClaw 的基础能力与 API 配置方式，帮助你快速完成安装、接入模型并开始使用。
          </Paragraph>
        </div>

        <Space>
          <Button type='primary' size='large' theme='solid' onClick={() => openOfficialWebsite()}>
            前往官网
          </Button>
          {/*<Button size='large'>*/}
          {/*  立即开始*/}
          {/*</Button>*/}
          <Button size='large' theme='light' type='tertiary' onClick={() => openOfficialDocWebsite()}>
            查看文档
            <ArrowRight size={16} className='ml-2' />
          </Button>
        </Space>t
      </div>

      <Card
        className='mb-8'
        headerLine={true}
        title={
          <div className='flex items-center gap-2'>
            <div className='w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full'></div>
            <Title heading={5} style={{ margin: 0 }}>功能概览</Title>
          </div>
        }
      >
        <Tabs type='button' size='large'>
          <TabPane tab='功能概览' itemKey='overview'>
            <InstallationGuide steps={overviewSteps} />
          </TabPane>

          <TabPane tab='安装指南' itemKey='install'>
            <InstallationGuide steps={installSteps} />
          </TabPane>

          <TabPane tab='配置密钥' itemKey='apikey'>
            <InstallationGuide steps={apiKeySteps} />
          </TabPane>

          <TabPane tab='使用教程' itemKey='tutorial'>
            <InstallationGuide steps={tutorialSteps} />
          </TabPane>
        </Tabs>
      </Card>

      <Row className={'mt-8'}></Row>
      <Card
        className='mb-8'
        headerLine={true}
        title={
          <div className='flex items-center gap-2'>
            <div className='w-1 h-6 bg-gradient-to-b from-green-500 to-emerald-600 rounded-full'></div>
            <Title heading={5} style={{ margin: 0 }}>准备好开始吗？</Title>
          </div>
        }
      >
        <Paragraph className='text-lg mb-6'>
          只需简单三步，即可将您的开发效率提升到一个新的高度。
        </Paragraph>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          {ctaCards.map((card, index) => (
            <div
              key={index}
              className='p-6 rounded-xl transition-all duration-300 hover:scale-105 cursor-pointer'
              style={{
                background: 'var(--semi-color-fill-0)',
                border: '1px solid var(--semi-color-border)',
              }}
            >
              <div className='mb-4'>
                <div className='text-6xl font-bold text-gray-200'>{card.number}</div>
              </div>
              <div className='mb-3'>{card.icon}</div>
              <Title heading={4} className='mb-2'>{card.title}</Title>
              <Text type='secondary'>{card.description}</Text>
            </div>
          ))}
        </div>
      </Card>
    </div>
      </div>
          );
};

export default OpenClawTutorial;
