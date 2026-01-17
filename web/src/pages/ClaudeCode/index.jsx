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
import { Typography, Card, Tabs, TabPane, Space, List, Tag, Button } from '@douyinfe/semi-ui';
import { Code2, Zap, Shield, Globe, Terminal, ArrowRight, CheckCircle2, Download, Key, Rocket } from 'lucide-react';
import InstallationGuide from '../../components/InstallationGuide';

const { Title, Paragraph, Text } = Typography;

const ClaudeCodeTutorial = () => {
  const features = [
    {
      icon: <Zap className='text-blue-500' size={24} />,
      title: '智能代码生成',
      description: '基于 Claude 3.7 Sonnet 的强大能力，快速生成高质量、可维护的代码片段和完整模块',
    },
    {
      icon: <Globe className='text-green-500' size={24} />,
      title: '深度代码分析',
      description: '深入理解现有代码库结构，提供精准的重构建议和架构优化方案',
    },
    {
      icon: <Shield className='text-purple-500' size={24} />,
      title: '智能调试助手',
      description: '自动定位 Bug 根源，提供修复建议，甚至直接生成修复代码',
    },
    {
      icon: <Code2 className='text-orange-500' size={24} />,
      title: '自动化文档',
      description: '一键生成清晰、规范的代码文档和 API 说明，保持文档与代码同步',
    },
    {
      icon: <Terminal className='text-cyan-500' size={24} />,
      title: '命令行集成',
      description: '强大的 CLI 工具，让 AI 助手无缝融入终端工作流',
    },
  ];

  const techSpecs = [
    {
      title: 'CLI 工具',
      description: 'npm 全局安装—轻量命令行界面',
      icon: <Terminal size={20} />,
    },
    {
      title: 'Claude Sonnet 4.5',
      description: 'Anthropic 官方模型',
      icon: <Zap size={20} />,
    },
    {
      title: '跨平台支持',
      description: 'Windows/macOS/Linux',
      icon: <Globe size={20} />,
    },
  ];

  const overviewSteps = [
    {
      title: "功能概览",
      content: (
        <div>
          <Paragraph className='mb-4'>
            Claude Code 是一款强大的 AI 编程助手，不仅仅是代码补全工具，更是您的智能结对编程伙伴。
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
          <Paragraph className='mb-4'>了解 Claude Code 的技术规格：</Paragraph>
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
                <div>npm install -g @anthropic-ai/claude-code</div>
              </div>
            </div>
            <div>
              <Text strong className='mb-2 block'>验证安装：</Text>
              <div className='p-4 bg-gray-900 text-gray-100 rounded-lg font-mono text-sm'>
                <div>claude --version</div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "配置 API 密钥",
      content: (
        <div>
          <Paragraph className='mb-4'>连接到 Chirou API 服务：</Paragraph>
          <List
            dataSource={[
              '在本平台获取您的 API Key',
              '运行 claude configure 命令',
              '输入 API Key 和自定义端点地址',
              '配置完成后即可使用'
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
          <div className='mt-6 p-4 rounded-xl bg-blue-50 border border-blue-100'>
            <div className='flex items-center gap-2 mb-2'>
              <Tag color='cyan'>API 端点</Tag>
              <Text type='secondary' size='small'>配置时请使用此地址</Text>
            </div>
            <Text code copyable className='text-base'>{window.location.origin}/v1</Text>
          </div>
        </div>
      )
    },
    {
      title: "启动 Claude Code",
      content: (
        <div>
          <Paragraph className='mb-4'>开始 AI 结对编程之旅：</Paragraph>
          <div className='space-y-4'>
            <div>
              <Text strong className='mb-2 block'>启动 Claude CLI：</Text>
              <div className='p-4 bg-gray-900 text-gray-100 rounded-lg font-mono text-sm'>
                <div>claude</div>
              </div>
            </div>
            <Paragraph>
              Claude 会自动扫描您的项目，理解代码结构，并为您提供智能建议。
            </Paragraph>
          </div>
        </div>
      )
    }
  ];

  const apiKeySteps = [
    {
      title: "获取 API Key",
      content: (
        <div>
          <Paragraph className='mb-4'>
            在本平台注册账户后，进入 API 管理页面创建新的 API Key。
          </Paragraph>
          <List
            dataSource={[
              '登录 Chirou API 平台',
              '进入"令牌管理"页面',
              '点击"新建令牌"',
              '设置令牌名称和权限',
              '复制生成的 API Key'
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
      title: "配置环境变量",
      content: (
        <div>
          <Paragraph className='mb-4'>设置环境变量（可选，更安全）：</Paragraph>
          <div className='space-y-3'>
            <div>
              <Text strong className='mb-2 block'>在 ~/.bashrc 或 ~/.zshrc 中添加：</Text>
              <div className='p-4 bg-gray-900 text-gray-100 rounded-lg font-mono text-sm'>
                <div>export ANTHROPIC_API_KEY="your-api-key"</div>
              </div>
            </div>
            <div>
              <Text strong className='mb-2 block'>然后运行：</Text>
              <div className='p-4 bg-gray-900 text-gray-100 rounded-lg font-mono text-sm'>
                <div>source ~/.bashrc</div>
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
          <Paragraph className='mb-4'>Claude Code 的基础使用方式：</Paragraph>
          <div className='space-y-4'>
            <div>
              <Text strong className='mb-2 block'>启动 Claude：</Text>
              <div className='p-4 bg-gray-900 text-gray-100 rounded-lg font-mono text-sm overflow-x-auto'>
                <div className='mb-2'>$ claude</div>
                <div className='text-green-400'>Hello! I'm Claude Code. How can I help you with your project today?</div>
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
          <Paragraph className='mb-4'>Claude Code 的高级功能：</Paragraph>
          <List
            dataSource={[
              {
                title: '代码审查',
                description: '让 Claude 审查您的代码，发现潜在问题'
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
      description: '连接到 Chirou API 服务',
      icon: <Key size={32} className='text-green-500' />,
    },
    {
      number: '3',
      title: '启动 Claude Code',
      description: '开始 AI 结对编程之旅',
      icon: <Rocket size={32} className='text-purple-500' />,
    },
  ];

  return (
      <div className='w-full overflow-x-hidden mt-20'>

    <div className='p-6 max-w-6xl mx-auto'>
      <div className='mb-8'>
        <div className='inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white mb-6'>
          <Zap size={16} />
          <Text className='text-sm font-medium'>Claude 4.5 Sonnet 强力驱动</Text>
        </div>

        <Title heading={1} className='mb-4 text-4xl md:text-5xl font-bold'>
          Claude Code 下一代 AI 编程助手
        </Title>

        <Paragraph className='text-xl mb-6' style={{ color: 'var(--semi-color-text-1)', maxWidth: '800px' }}>
          不仅仅是代码补全，而是真正的结对编程伙伴。在您的终端中直接运行，深度理解项目上下文，自动化处理繁琐任务。
        </Paragraph>

        <Space className='mb-8'>
          <Button type='primary' size='large' theme='solid'>
            订阅管理
          </Button>
          <Button size='large'>
            立即开始
          </Button>
          <Button size='large' theme='light' type='tertiary'>
            查看文档
            <ArrowRight size={16} className='ml-2' />
          </Button>
        </Space>

        <div className='p-6 rounded-xl' style={{ background: 'var(--semi-color-fill-1)', border: '1px solid var(--semi-color-border)' }}>
          <div className='flex items-center gap-2 mb-4'>
            <Terminal size={20} className='text-gray-500' />
            <Text strong>终端示例</Text>
          </div>
          <div className='p-4 bg-gray-900 text-gray-100 rounded-lg font-mono text-sm overflow-x-auto'>
            <div className='mb-2'>$ claude</div>
            <div className='text-green-400 mb-3'>Hello! I'm Claude Code. How can I help you with your project today?</div>
            <div className='mb-2'>Refactor the user authentication module</div>
            <div className='text-blue-300'>I'll help you refactor the auth module. First, let me analyze the current implementation in src/auth...</div>
          </div>
        </div>
      </div>

      <Card
        className='mb-8'
        headerLine={true}
        title={
          <div className='flex items-center gap-2'>
            <div className='w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full'></div>
            <Title heading={3} style={{ margin: 0 }}>功能概览</Title>
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

      <Card
        className='mb-8'
        headerLine={true}
        title={
          <div className='flex items-center gap-2'>
            <div className='w-1 h-6 bg-gradient-to-b from-green-500 to-emerald-600 rounded-full'></div>
            <Title heading={3} style={{ margin: 0 }}>准备好开始了吗？</Title>
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

export default ClaudeCodeTutorial;
