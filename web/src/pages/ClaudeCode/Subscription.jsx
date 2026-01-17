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

import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, Toast, Typography, Tag, Empty, Banner, Steps } from '@douyinfe/semi-ui';
import { API, showError } from '../../helpers';
import { Sparkles, CreditCard, CheckCircle2 } from 'lucide-react';

const { Title, Text } = Typography;

const ClaudeCodeSubscription = () => {
  const [mySubscriptions, setMySubscriptions] = useState([]);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const columns = [
    {
      title: '订阅类型',
      dataIndex: 'plan_type',
      key: 'plan_type',
      render: (type) => <Tag color='blue'>{type}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colorMap = {
          active: 'green',
          expired: 'grey',
          cancelled: 'orange',
        };
        const labelMap = {
          active: '生效中',
          expired: '已过期',
          cancelled: '已取消',
        };
        return <Tag color={colorMap[status] || 'grey'}>{labelMap[status] || status}</Tag>;
      },
    },
    {
      title: '开始时间',
      dataIndex: 'start_time',
      key: 'start_time',
      render: (time) => new Date(time * 1000).toLocaleString('zh-CN'),
    },
    {
      title: '结束时间',
      dataIndex: 'end_time',
      key: 'end_time',
      render: (time) => new Date(time * 1000).toLocaleString('zh-CN'),
    },
  ];

  const loadMySubscriptions = async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/vibecoding/my-subscriptions');
      const { success, data } = res.data;
      if (success) {
        setMySubscriptions(data || []);
      }
    } catch (error) {
      showError('加载订阅信息失败');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailablePlans = async () => {
    try {
      const res = await API.get('/api/vibecoding/plans');
      const { success, data } = res.data;
      if (success) {
        setAvailablePlans(data || []);
      }
    } catch (error) {
      showError('加载订阅方案失败');
    }
  };

  const handlePurchase = async (values) => {
    try {
      const res = await API.post('/api/vibecoding/subscription/purchase', values);
      const { success, message } = res.data;
      if (success) {
        Toast.success('购买成功');
        setShowPurchaseModal(false);
        loadMySubscriptions();
      } else {
        showError(message || '购买失败');
      }
    } catch (error) {
      showError('购买失败');
    }
  };

  useEffect(() => {
    loadMySubscriptions();
    loadAvailablePlans();
  }, []);

  const hasActiveSubscription = mySubscriptions.some(sub => sub.status === 'active');

  return (
    <div className='p-6 max-w-6xl mx-auto'>
      <Banner
        fullMode={false}
        type='success'
        bordered
        icon={<Sparkles size={20} />}
        closeIcon={null}
        className='mb-6'
        description={
          hasActiveSubscription 
            ? '您已激活 Claude Code 订阅，尽情享受 AI 编程体验！' 
            : '订阅 Claude Code，开启智能编程新时代'
        }
      />
      
      {!hasActiveSubscription && (
        <Card
          className='mb-6'
          headerLine={true}
          title={
            <div className='flex items-center gap-2'>
              <div className='w-1 h-6 bg-gradient-to-b from-orange-500 to-red-500 rounded-full'></div>
              <Title heading={3} style={{ margin: 0 }}>订阅流程</Title>
            </div>
          }
        >
          <div className='p-4'>
            <Steps type="basic">
              <Steps.Step 
                title="选择方案" 
                description="浏览并选择适合您的订阅计划" 
                icon={<CreditCard size={20} />}
              />
              <Steps.Step 
                title="确认支付" 
                description="完成支付流程" 
                icon={<CheckCircle2 size={20} />}
              />
              <Steps.Step 
                title="立即激活" 
                description="自动开通权限，即刻使用" 
                icon={<Sparkles size={20} />}
              />
            </Steps>
          </div>
        </Card>
      )}

      <Card 
        className='mb-6'
        headerLine={true}
        title={
          <div className='flex items-center gap-2'>
            <div className='w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full'></div>
            <Title heading={3} style={{ margin: 0 }}>我的订阅</Title>
          </div>
        }
        headerExtraContent={
          !hasActiveSubscription && (
            <Button 
              type='primary' 
              icon={<CreditCard size={18} />}
              onClick={() => setShowPurchaseModal(true)}
              theme='solid'
            >
              购买订阅
            </Button>
          )
        }
      >

        {mySubscriptions.length > 0 ? (
          <Table
            columns={columns}
            dataSource={mySubscriptions}
            loading={loading}
            pagination={false}
            rowKey='id'
          />
        ) : (
          <Empty
            title='暂无订阅'
            description='您还没有任何订阅，购买订阅后即可使用 Claude Code'
          />
        )}
      </Card>

      {availablePlans.length > 0 && (
        <Card
          headerLine={true}
          title={
            <div className='flex items-center gap-2'>
              <div className='w-1 h-6 bg-gradient-to-b from-green-500 to-emerald-600 rounded-full'></div>
              <Title heading={3} style={{ margin: 0 }}>订阅方案</Title>
            </div>
          }
        >
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            {availablePlans.map((plan) => (
              <div
                key={plan.id}
                className='rounded-xl p-6 transition-all duration-300 hover:scale-105'
                style={{ 
                  background: plan.recommended ? 'var(--semi-color-primary-light-default)' : 'var(--semi-color-fill-0)',
                  border: plan.recommended ? '2px solid var(--semi-color-primary)' : '1px solid var(--semi-color-border)',
                }}
              >
                {plan.recommended && (
                  <Tag color='blue' size='large' className='mb-3'>
                    推荐
                  </Tag>
                )}
                <Title heading={4} className='mb-2'>
                  {plan.name}
                </Title>
                <div className='text-3xl font-bold mb-4' style={{ color: 'var(--semi-color-primary)' }}>
                  ¥{plan.price}
                  <Text className='text-base font-normal' type='tertiary'>
                    /{plan.duration_days}天
                  </Text>
                </div>
                <ul className='space-y-3 mb-6'>
                  {plan.features?.map((feature, idx) => (
                    <li key={idx} className='flex items-start gap-2'>
                      <CheckCircle2 size={18} className='text-green-500 mt-0.5 flex-shrink-0' />
                      <Text>{feature}</Text>
                    </li>
                  ))}
                </ul>
                <Button
                  block
                  type={plan.recommended ? 'primary' : 'secondary'}
                  theme={plan.recommended ? 'solid' : 'light'}
                  size='large'
                  onClick={() => handlePurchase({ plan_id: plan.id })}
                  disabled={hasActiveSubscription}
                >
                  {hasActiveSubscription ? '已有订阅' : '立即购买'}
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal
        title='购买订阅'
        visible={showPurchaseModal}
        onCancel={() => setShowPurchaseModal(false)}
        footer={null}
      >
        <Form
          onSubmit={(values) => handlePurchase(values)}
          labelPosition='left'
          labelWidth='100px'
        >
          <Form.Select
            field='plan_id'
            label='选择方案'
            placeholder='选择订阅方案'
            rules={[{ required: true, message: '请选择订阅方案' }]}
          >
            {availablePlans.map((plan) => (
              <Form.Select.Option key={plan.id} value={plan.id}>
                {plan.name} - ¥{plan.price} / {plan.duration_days}天
              </Form.Select.Option>
            ))}
          </Form.Select>

          <div className='flex justify-end gap-2 mt-4'>
            <Button onClick={() => setShowPurchaseModal(false)}>取消</Button>
            <Button type='primary' htmlType='submit'>
              确认购买
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default ClaudeCodeSubscription;
