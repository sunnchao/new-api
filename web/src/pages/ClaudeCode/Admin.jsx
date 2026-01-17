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
import { Card, Table, Button, Modal, Form, Toast, Typography, Tag, Banner } from '@douyinfe/semi-ui';
import { API, showError } from '../../helpers';
import { Shield, UserPlus } from 'lucide-react';

const { Title } = Typography;

const ClaudeCodeAdmin = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [users, setUsers] = useState([]);

  const columns = [
    {
      title: '用户ID',
      dataIndex: 'user_id',
      key: 'user_id',
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
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
        return <Tag color={colorMap[status] || 'grey'}>{status}</Tag>;
      },
    },
    {
      title: '开始时间',
      dataIndex: 'start_time',
      key: 'start_time',
      render: (time) => new Date(time * 1000).toLocaleString(),
    },
    {
      title: '结束时间',
      dataIndex: 'end_time',
      key: 'end_time',
      render: (time) => new Date(time * 1000).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button
          type='danger'
          size='small'
          onClick={() => handleCancelSubscription(record.id)}
          disabled={record.status !== 'active'}
        >
          取消订阅
        </Button>
      ),
    },
  ];

  const loadSubscriptions = async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/vibecoding/subscriptions');
      const { success, data } = res.data;
      if (success) {
        setSubscriptions(data || []);
      }
    } catch (error) {
      showError('加载订阅列表失败');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await API.get('/api/user');
      const { success, data } = res.data;
      if (success) {
        setUsers(data || []);
      }
    } catch (error) {
      showError('加载用户列表失败');
    }
  };

  const handleGrantSubscription = async (values) => {
    try {
      const res = await API.post('/api/vibecoding/subscription/grant', values);
      const { success, message } = res.data;
      if (success) {
        Toast.success('授予订阅成功');
        setShowGrantModal(false);
        loadSubscriptions();
      } else {
        showError(message || '授予订阅失败');
      }
    } catch (error) {
      showError('授予订阅失败');
    }
  };

  const handleCancelSubscription = async (id) => {
    try {
      const res = await API.post(`/api/vibecoding/subscription/${id}/cancel`);
      const { success, message } = res.data;
      if (success) {
        Toast.success('取消订阅成功');
        loadSubscriptions();
      } else {
        showError(message || '取消订阅失败');
      }
    } catch (error) {
      showError('取消订阅失败');
    }
  };

  useEffect(() => {
    loadSubscriptions();
    loadUsers();
  }, []);

  return (
    <div className='p-6'>
      <Banner
        fullMode={false}
        type='info'
        bordered
        icon={<Shield size={20} />}
        closeIcon={null}
        className='mb-6'
        description='管理员专属：管理所有用户的 Claude Code 订阅'
      />
      
      <Card
        headerLine={true}
        title={
          <div className='flex items-center gap-2'>
            <div className='w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full'></div>
            <Title heading={3} style={{ margin: 0 }}>Claude Code 订阅管理</Title>
          </div>
        }
        headerExtraContent={
          <Button 
            type='primary' 
            icon={<UserPlus size={18} />}
            onClick={() => setShowGrantModal(true)}
            theme='solid'
          >
            授予订阅
          </Button>
        }
      >

        <Table
          columns={columns}
          dataSource={subscriptions}
          loading={loading}
          pagination={{ pageSize: 10 }}
          rowKey='id'
        />
      </Card>

      <Modal
        title='授予订阅'
        visible={showGrantModal}
        onCancel={() => setShowGrantModal(false)}
        footer={null}
      >
        <Form
          onSubmit={(values) => handleGrantSubscription(values)}
          labelPosition='left'
          labelWidth='100px'
        >
          <Form.Select
            field='user_id'
            label='用户'
            placeholder='选择用户'
            rules={[{ required: true, message: '请选择用户' }]}
          >
            {users.map((user) => (
              <Form.Select.Option key={user.id} value={user.id}>
                {user.username} (ID: {user.id})
              </Form.Select.Option>
            ))}
          </Form.Select>

          <Form.Select
            field='plan_type'
            label='订阅类型'
            placeholder='选择订阅类型'
            rules={[{ required: true, message: '请选择订阅类型' }]}
            initValue='monthly'
          >
            <Form.Select.Option value='monthly'>月度订阅</Form.Select.Option>
            <Form.Select.Option value='yearly'>年度订阅</Form.Select.Option>
            <Form.Select.Option value='lifetime'>终身订阅</Form.Select.Option>
          </Form.Select>

          <Form.InputNumber
            field='duration_days'
            label='有效期(天)'
            placeholder='输入有效天数'
            rules={[{ required: true, message: '请输入有效天数' }]}
            initValue={30}
            min={1}
          />

          <div className='flex justify-end gap-2 mt-4'>
            <Button onClick={() => setShowGrantModal(false)}>取消</Button>
            <Button type='primary' htmlType='submit'>
              确认授予
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default ClaudeCodeAdmin;
