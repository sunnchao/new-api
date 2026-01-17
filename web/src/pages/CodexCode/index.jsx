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
import { Cpu, Zap, ArrowRight, CheckCircle2, Download, Settings } from 'lucide-react';
import InstallationGuide from '../../components/InstallationGuide';

const { Title, Paragraph, Text } = Typography;

const CodexCodeTutorial = () => {
  const features = [
    {
      icon: <Cpu className='text-blue-500' size={24} />,
      title: '智能代码生成',
      description: '基于 GPT-5.1 的高质量代码生成和智能补全',
    },
    {
      icon: <ArrowRight className='text-green-500' size={24} />,
      title: '深度分析',
      description: '深度分析和理解整个代码库结构',
    },
    {
      icon: <Settings className='text-purple-500' size={24} />,
      title: '智能重构',
      description: '智能重构代码，应用最佳设计模式',
    },
    {
      icon: <CheckCircle2 className='text-orange-500' size={24} />,
      title: 'Git 集成',
      description: '自动生成提交信息和代码审查',
    },
    {
      icon: <Zap className='text-cyan-500' size={24} />,
      title: 'GPT-5 驱动',
      description: '企业级 AI 编程助手，强大的推理能力',
    },
  ];

  const techSpecs = [
    {
      title: 'CLI 工具',
      description: 'npm 全局安装',
      icon: <Download size={20} />,
    },
    {
      title: 'GPT-5.1 模型',
      description: '企业级 AI 助手',
      icon: <Cpu size={20} />,
    },
    {
      title: '网络访问',
      description: '实时联网能力',
      icon: <ArrowRight size={20} />,
    },
  ];

  const overviewSteps = [
    {
      title: "功能概览",
      content: (
        <div>
          <Paragraph className='mb-4'>
            CodeX 是一款企业级 AI 编程助手，基于 GPT-5.1 模型，提供深度代码分析和智能重构能力。
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
          <Paragraph className='mb-4'>了解 CodeX 的技术规格：</Paragraph>
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
                <div className='flex-shrink-0 text-green-500'>{spec.icon}</div>
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

  const envSteps = [
    {
      title: "安装 CLI 工具",
      content: (
        <div>
          <Paragraph className='mb-4'>安装 CodeX 命令行工具：</Paragraph>
          <div className='space-y-3'>
            <div>
              <Text strong className='mb-2 block'>使用 npm 全局安装：</Text>
              <div className='p-4 bg-gray-900 text-gray-100 rounded-lg font-mono text-sm'>
                <div>npm install -g @codex/cli</div>
              </div>
            </div>
            <div>
              <Text strong className='mb-2 block'>验证安装：</Text>
              <div className='p-4 bg-gray-900 text-gray-100 rounded-lg font-mono text-sm'>
                <div>codex --version</div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "配置环境依赖",
      content: (
        <div>
          <Paragraph className='mb-4'>确保您的开发环境满足要求：</Paragraph>
          <List
            dataSource={[
              'Node.js 18.0 或更高版本',
              'Git 版本控制工具',
              'Visual Studio Code 或其他编辑器',
              '稳定的网络连接'
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
    }
  ];

  const vscodeSteps = [
    {
      title: "安装 VSCode 扩展",
      content: (
        <div>
          <Paragraph className='mb-4'>在 VSCode 中安装 CodeX 扩展：</Paragraph>
          <List
            dataSource={[
              '打开 VSCode 扩展面板（Ctrl+Shift+X）',
              '搜索 "CodeX Assistant"',
              '点击安装按钮',
              '安装完成后重启 VSCode'
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
      title: "配置 IDE 插件",
      content: (
        <div>
          <Paragraph className='mb-4'>配置 CodeX 插件：</Paragraph>
          <div className='space-y-3'>
            <div>
              <Text strong className='mb-2 block'>打开插件设置：</Text>
              <div className='p-4 bg-gray-900 text-gray-100 rounded-lg font-mono text-sm'>
                <div>VSCode: Settings → Extensions → CodeX</div>
              </div>
            </div>
            <Paragraph>
              配置 API Key、端点地址和其他设置项。
            </Paragraph>
            <div className='mt-4 p-4 rounded-xl bg-green-50 border border-green-100'>
              <div className='flex items-center gap-2 mb-2'>
                <Tag color='cyan'>API 端点</Tag>
                <Text type='secondary' size='small'>配置时请使用此地址</Text>
              </div>
              <Text code copyable className='text-base'>{window.location.origin}/v1</Text>
            </div>
          </div>
        </div>
      )
    }
  ];

  const ctaCards = [
    {
      number: '1',
      title: '环境准备',
      description: '安装 CLI 工具和依赖',
      icon: <Download size={32} className='text-blue-500' />,
    },
    {
      number: '2',
      title: 'VSCode 配置',
      description: '配置 IDE 插件和快捷键',
      icon: <Settings size={32} className='text-green-500' />,
    },
  ];

  return (
    <div className='w-full overflow-x-hidden mt-20'>
      <div className='p-6 max-w-6xl mx-auto'>
      <div className='mb-8'>
        <div className='inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white mb-6'>
          <Cpu size={16} />
          <Text className='text-sm font-medium'>GPT-5.1 强力驱动</Text>
        </div>

        <Title heading={1} className='mb-4 text-4xl md:text-5xl font-bold'>
          CodeX 企业级 AI 编程助手
        </Title>

        <Paragraph className='text-xl mb-6' style={{ color: 'var(--semi-color-text-1)', maxWidth: '800px' }}>
          不仅仅是代码补全，而是真正的结对编程伙伴。基于 GPT-5.1 模型，提供深度代码分析和智能重构能力。
        </Paragraph>

        <Space className='mb-8'>
          <Button type='primary' size='large' theme='solid'>
            立即开始
          </Button>
          <Button size='large' theme='light' type='tertiary'>
            了解更多
            <ArrowRight size={16} className='ml-2' />
          </Button>
        </Space>

        <div className='p-6 rounded-xl' style={{ background: 'var(--semi-color-fill-1)', border: '1px solid var(--semi-color-border)' }}>
          <div className='flex items-center gap-2 mb-4'>
            <Cpu size={20} className='text-gray-500' />
            <Text strong>终端示例</Text>
          </div>
          <div className='p-4 bg-gray-900 text-gray-100 rounded-lg font-mono text-sm overflow-x-auto'>
            <div className='mb-2'>$ codex</div>
            <div className='text-green-400 mb-3'>CodeX CLI v2.0.0 - Powered by GPT-5</div>
            <div className='mb-2'>Analyze the current project structure</div>
            <div className='text-blue-300'>Scanning project files... Found 124 files. Project structure analysis complete. Detected React + Vite configuration.</div>
          </div>
        </div>
      </div>

      <Card
        className='mb-8'
        headerLine={true}
        title={
          <div className='flex items-center gap-2'>
            <div className='w-1 h-6 bg-gradient-to-b from-green-500 to-emerald-600 rounded-full'></div>
            <Title heading={3} style={{ margin: 0 }}>功能概览</Title>
          </div>
        }
      >
        <Tabs type='button' size='large'>
          <TabPane tab='功能概览' itemKey='overview'>
            <InstallationGuide steps={overviewSteps} />
          </TabPane>

          <TabPane tab='环境准备' itemKey='environment'>
            <InstallationGuide steps={envSteps} />
          </TabPane>

          <TabPane tab='VSCode 配置' itemKey='vscode'>
            <InstallationGuide steps={vscodeSteps} />
          </TabPane>
        </Tabs>
      </Card>

      <Card
        className='mb-8'
        headerLine={true}
        title={
          <div className='flex items-center gap-2'>
            <div className='w-1 h-6 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full'></div>
            <Title heading={3} style={{ margin: 0 }}>准备好开始了吗？</Title>
          </div>
        }
      >
        <Paragraph className='text-lg mb-6'>
          只需简单两步，即可将您的开发效率提升到一个新的高度。
        </Paragraph>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
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

export default CodexCodeTutorial;
