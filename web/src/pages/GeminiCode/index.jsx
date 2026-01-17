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
import { Sparkles, Brain, ArrowRight, CheckCircle2, Layers, Download, Key, Rocket } from 'lucide-react';
import InstallationGuide from '../../components/InstallationGuide';

const { Title, Paragraph, Text } = Typography;

const GeminiCodeTutorial = () => {
  const features = [
    {
      icon: <Sparkles className='text-purple-500' size={24} />,
      title: '超大上下文窗口',
      description: '1M tokens 上下文，处理超大规模项目',
    },
    {
      icon: <Brain className='text-blue-500' size={24} />,
      title: 'Agent Mode',
      description: '自动规划任务，智能执行复杂操作',
    },
    {
      icon: <ArrowRight className='text-green-500' size={24} />,
      title: 'Google Search',
      description: '实时联网搜索，获取最新信息',
    },
    {
      icon: <CheckCircle2 className='text-orange-500' size={24} />,
      title: 'Git 集成',
      description: '自动生成提交信息和代码审查',
    },
    {
      icon: <Layers className='text-cyan-500' size={24} />,
      title: 'Gemini 3 Pro',
      description: 'Google AI 最新模型驱动',
    },
  ];

  const techSpecs = [
    {
      title: 'CLI 工具',
      description: 'npm 全局安装',
      icon: <Download size={20} />,
    },
    {
      title: 'Google AI',
      description: 'Gemini 3 Pro',
      icon: <Sparkles size={20} />,
    },
    {
      title: '1M Context',
      description: '超大上下文窗口',
      icon: <Layers size={20} />,
    },
  ];

  const overviewSteps = [
    {
      title: "功能概览",
      content: (
        <div>
          <Paragraph className='mb-4'>
            Gemini Code 拥有 1M tokens 超大上下文窗口，支持多模态输入。内置 Agent Mode 和 Google Search，重新定义 AI 辅助编程。
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
          <Paragraph className='mb-4'>了解 Gemini Code 的技术规格：</Paragraph>
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
                <div className='flex-shrink-0 text-purple-500'>{spec.icon}</div>
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
      title: "安装 CLI",
      content: (
        <div>
          <Paragraph className='mb-4'>安装 Gemini 命令行工具：</Paragraph>
          <div className='space-y-3'>
            <div>
              <Text strong className='mb-2 block'>使用 npm 全局安装：</Text>
              <div className='p-4 bg-gray-900 text-gray-100 rounded-lg font-mono text-sm'>
                <div>npm install -g @google/gemini-cli</div>
              </div>
            </div>
            <div>
              <Text strong className='mb-2 block'>验证安装：</Text>
              <div className='p-4 bg-gray-900 text-gray-100 rounded-lg font-mono text-sm'>
                <div>gemini --version</div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "配置密钥",
      content: (
        <div>
          <Paragraph className='mb-4'>配置 API 密钥和环境变量：</Paragraph>
          <List
            dataSource={[
              '在本平台获取您的 Google AI API Key',
              '运行 gemini configure 命令',
              '输入 API Key 和自定义端点地址',
              '设置 GOOGLE_API_KEY 环境变量（可选）'
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
          <div className='mt-6 p-4 rounded-xl bg-purple-50 border border-purple-100'>
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
      title: "开始编程",
      content: (
        <div>
          <Paragraph className='mb-4'>启动 Gemini CLI：</Paragraph>
          <div className='space-y-3'>
            <div>
              <Text strong className='mb-2 block'>启动 Gemini：</Text>
              <div className='p-4 bg-gray-900 text-gray-100 rounded-lg font-mono text-sm'>
                <div>gemini</div>
              </div>
            </div>
            <Paragraph>
              Gemini 会自动分析您的项目，支持多模态输入（文本、图像、代码）。
            </Paragraph>
          </div>
        </div>
      )
    }
  ];

  const ctaCards = [
    {
      number: '1',
      title: '安装 CLI',
      description: '安装 Gemini 命令行工具',
      icon: <Download size={32} className='text-purple-500' />,
    },
    {
      number: '2',
      title: '配置密钥',
      description: '配置 API 密钥和环境变量',
      icon: <Key size={32} className='text-blue-500' />,
    },
    {
      number: '3',
      title: '开始编程',
      description: '启动 Gemini CLI',
      icon: <Rocket size={32} className='text-green-500' />,
    },
  ];

  return (
    <div className='w-full overflow-x-hidden mt-20'>
      <div className='p-6 max-w-6xl mx-auto'>
      <div className='mb-8'>
        <div className='inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 text-white mb-6'>
          <Sparkles size={16} />
          <Text className='text-sm font-medium'>Gemini 3 Pro 强力驱动</Text>
        </div>

        <Title heading={1} className='mb-4 text-4xl md:text-5xl font-bold'>
          Gemini Code Google AI 编程助手
        </Title>

        <Paragraph className='text-xl mb-6' style={{ color: 'var(--semi-color-text-1)', maxWidth: '800px' }}>
          拥有 1M tokens 超大上下文窗口，支持多模态输入。内置 Agent Mode 和 Google Search，重新定义 AI 辅助编程。
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
            <Brain size={20} className='text-gray-500' />
            <Text strong>终端示例</Text>
          </div>
          <div className='p-4 bg-gray-900 text-gray-100 rounded-lg font-mono text-sm overflow-x-auto'>
            <div className='mb-2'>$ gemini agent --task "Analyze this image"</div>
            <div className='text-green-400 mb-3'>Analyzing image content... I see a UI design for a login page. It contains email/password fields and a "Sign In" button.</div>
            <div className='mb-2'>Generate React code for this UI</div>
            <div className='text-blue-300'>Generating React component... "Done! Created `LoginPage.tsx`"</div>
          </div>
        </div>
      </div>

      <Card
        className='mb-8'
        headerLine={true}
        title={
          <div className='flex items-center gap-2'>
            <div className='w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full'></div>
            <Title heading={3} style={{ margin: 0 }}>功能概览</Title>
          </div>
        }
      >
        <Tabs type='button' size='large'>
          <TabPane tab='功能概览' itemKey='overview'>
            <InstallationGuide steps={overviewSteps} />
          </TabPane>

          <TabPane tab='安装 CLI' itemKey='install'>
            <InstallationGuide steps={installSteps} />
          </TabPane>

          <TabPane tab='配置密钥' itemKey='apikey'>
            <InstallationGuide steps={[installSteps[1]]} />
          </TabPane>

          <TabPane tab='开始编程' itemKey='programming'>
            <InstallationGuide steps={[installSteps[2]]} />
          </TabPane>
        </Tabs>
      </Card>

      <Card
        className='mb-8'
        headerLine={true}
        title={
          <div className='flex items-center gap-2'>
            <div className='w-1 h-6 bg-gradient-to-b from-pink-500 to-purple-500 rounded-full'></div>
            <Title heading={3} style={{ margin: 0 }}>准备好开始了吗？</Title>
          </div>
        }
      >
        <Paragraph className='text-lg mb-6'>
          只需三个步骤，即可开始使用 Gemini CLI 进行 AI 编程
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

export default GeminiCodeTutorial;
