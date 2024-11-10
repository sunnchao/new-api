import React, { useEffect, useState } from 'react';
import { API, copy, getTodayStartTimestamp, isAdmin, showError, showSuccess, timestamp2string } from '../helpers';

import {
  Table,
  Avatar,
  Button,
  Card,
  Form,
  Layout,
  Modal,
  Select,
  Space,
  Spin,
  Tag,
  Tooltip,
  Row,
  Col,
  Typography
} from '@douyinfe/semi-ui';
import { Descriptions } from '@arco-design/web-react';
import { IconLightningStroked } from '@douyinfe/semi-icons';
import { ITEMS_PER_PAGE } from '../constants';
import { renderAudioModelPrice, renderGroup, renderModelPrice, renderNumber, renderQuota, stringToColor } from '../helpers/render';
import Paragraph from '@douyinfe/semi-ui/lib/es/typography/paragraph';
import { getLogOther } from '../helpers/other.js';
import { useIsMobile } from '../helpers/hooks.js';

const { Header } = Layout;

function renderTimestamp(timestamp) {
  return <>{timestamp2string(timestamp)}</>;
}

const MODE_OPTIONS = [
  { key: 'all', text: '全部用户', value: 'all' },
  { key: 'self', text: '当前用户', value: 'self' }
];

const colors = [
  'amber',
  'blue',
  'cyan',
  'green',
  'grey',
  'indigo',
  'light-blue',
  'lime',
  'orange',
  'pink',
  'purple',
  'red',
  'teal',
  'violet',
  'yellow'
];

function renderType(type) {
  switch (type) {
    case 1:
      return (
        <Tag color="cyan" size="large">
          {' '}
          充值{' '}
        </Tag>
      );
    case 2:
      return (
        <Tag color="lime" size="large">
          {' '}
          消费{' '}
        </Tag>
      );
    case 3:
      return (
        <Tag color="orange" size="large">
          {' '}
          管理{' '}
        </Tag>
      );
    case 4:
      return (
        <Tag color="purple" size="large">
          {' '}
          系统{' '}
        </Tag>
      );
    case 5:
      return (
        <Tag color="green" size="large">
          {' '}
          签到{' '}
        </Tag>
      );
    case 6:
      return (
        <Tag color="green" size="large">
          {' '}
          登录{' '}
        </Tag>
      );
    default:
      return (
        <Tag color="black" size="large">
          {' '}
          未知{' '}
        </Tag>
      );
  }
}

function renderIsStream(bool) {
  if (bool) {
    return (
      <Tag color="blue" size="large">
        流
      </Tag>
    );
  } else {
    return (
      <Tag color="purple" size="large">
        非流
      </Tag>
    );
  }
}

function renderUseTime(type) {
  const time = parseInt(type);
  if (time < 101) {
    return (
      <Tag color="green" size="large">
        {' '}
        {time} s{' '}
      </Tag>
    );
  } else if (time < 300) {
    return (
      <Tag color="orange" size="large">
        {' '}
        {time} s{' '}
      </Tag>
    );
  } else {
    return (
      <Tag color="red" size="large">
        {' '}
        {time} s{' '}
      </Tag>
    );
  }
}

function renderFirstUseTime(type) {
  let time = parseFloat(type) / 1000.0;
  time = time.toFixed(1);
  if (time < 3) {
    return (
      <Tag color="green" size="large">
        {' '}
        {time} s{' '}
      </Tag>
    );
  } else if (time < 10) {
    return (
      <Tag color="orange" size="large">
        {' '}
        {time} s{' '}
      </Tag>
    );
  } else {
    return (
      <Tag color="red" size="large">
        {' '}
        {time} s{' '}
      </Tag>
    );
  }
}

const LogsTable = ({ groups }) => {
  const isMobile = useIsMobile();

  const columns = [
    {
      title: '时间/IP',
      dataIndex: 'timestamp2string',
      render: (text, record, index) => {
        return (
          <div>
            <Space vertical wrap align="left" spacing={8}>
              <div>{text}</div>
            </Space>
          </div>
        );
      }
    },
    {
      title: '渠道',
      dataIndex: 'channel',
      width: 100,
      className: isAdmin() ? 'tableShow' : 'tableHiddle',
      render: (text, record, index) => {
        return isAdminUser ? (
          record.type === 0 || record.type === 2 ? (
            <div>
              {
                <Tag color={colors[parseInt(text) % colors.length]} size="large">
                  {' '}
                  {text}{' '}
                </Tag>
              }
            </div>
          ) : (
            <></>
          )
        ) : (
          <></>
        );
      }
    },
    {
      title: '用户',
      dataIndex: 'username',
      className: isAdmin() ? 'tableShow' : 'tableHiddle',
      render: (text, record, index) => {
        return isAdminUser ? (
          <div>
            <Avatar size="small" color={stringToColor(text)} style={{ marginRight: 4 }} onClick={() => showUserInfo(record.user_id)}>
              {typeof text === 'string' && text.slice(0, 1)}
            </Avatar>
            {text}
          </div>
        ) : (
          <></>
        );
      }
    },
    {
      title: '令牌',
      dataIndex: 'token_name',
      width: 120,
      render: (text, record, index) => {
        return record.type === 0 || record.type === 2 ? (
          <div>
            <Tag
              color="grey"
              size="large"
              onClick={() => {
                copyText(text);
              }}
            >
              {' '}
              {text}{' '}
            </Tag>
          </div>
        ) : (
          <></>
        );
      }
    },
    {
      title: '令牌分组',
      dataIndex: 'token_group',
      width: 120,
      render: (text, record, index) => {
        return record.type === 0 || record.type === 2 ? <div>{renderGroup(text, groups)}</div> : <></>;
      }
    },
    {
      title: '模型',
      dataIndex: 'model_name',
      render: (text, record, index) => {
        return record.type === 0 || record.type === 2 ? (
          <>
            <Tag
              color={stringToColor(text)}
              size="large"
              onClick={() => {
                copyText(text);
              }}
            >
              {' '}
              {text}{' '}
            </Tag>
          </>
        ) : (
          <></>
        );
      }
    },
    {
      title: '用时/首字',
      dataIndex: 'use_time',
      headerCellStyle: {
        'min-width': '150px'
      },
      render: (text, record, index) => {
        if (record.is_stream) {
          let other = getLogOther(record.other);
          return (
            <>
              <Space>
                {renderUseTime(text)}
                {renderFirstUseTime(other.frt)}
                {renderIsStream(record.is_stream)}
              </Space>
            </>
          );
        } else {
          return (
            <>
              <Space>
                {renderUseTime(text)}
                {renderIsStream(record.is_stream)}
              </Space>
            </>
          );
        }
      }
    },
    {
      title: '提示',
      dataIndex: 'prompt_tokens',
      width: 100,
      render: (text, record, index) => {
        return record.type === 0 || record.type === 2 ? <>{<span> {text} </span>}</> : <></>;
      }
    },
    {
      title: '补全',
      dataIndex: 'completion_tokens',
      width: 100,
      render: (text, record, index) => {
        return parseInt(text) > 0 && (record.type === 0 || record.type === 2) ? <>{<span> {text} </span>}</> : <></>;
      }
    },
    {
      title: '花费',
      dataIndex: 'quota',
      render: (text, record, index) => {
        return record.type === 0 || record.type === 2 ? <>{renderQuota(text, 6)}</> : <></>;
      }
    },
    {
      title: '重试',
      dataIndex: 'retry',
      className: isAdmin() ? 'tableShow' : 'tableHiddle',
      render: (text, record, index) => {
        let content = '渠道：' + record.channel;
        if (record.other !== '') {
          let other = JSON.parse(record.other);
          if (other === null) {
            return <></>;
          }
          if (other.admin_info !== undefined) {
            if (
              other.admin_info.use_channel !== null &&
              other.admin_info.use_channel !== undefined &&
              other.admin_info.use_channel !== ''
            ) {
              // channel id array
              let useChannel = other.admin_info.use_channel;
              let useChannelStr = useChannel.join('->');
              content = `渠道：${useChannelStr}`;
            }
          }
        }
        return isAdminUser ? record.type === 0 || record.type === 2 ? <div>{content}</div> : <></> : <></>;
      }
    },
    {
      title: '详情',
      dataIndex: 'content',
      width: 120,
      ...(isMobile ? {} : { fixed: 'right' }),
      render: (text, record, index) => {
        let other = getLogOther(record.other);
        if (other == null || (record.type !== 2 && record.type !== 5)) {
          return (
            <Space style={{ width: '100%' }} vertical align="left">
              <Paragraph
                ellipsis={{
                  rows: 2,
                  showTooltip: {
                    type: 'popover',
                    opts: { style: { width: 120 } }
                  }
                }}
                style={{ maxWidth: 120 }}
              >
                {text}
              </Paragraph>
              <Paragraph
                type="link"
                link
                onClick={() => (expandedRowKeys.includes(record.id) ? setExpandedRowKeys([]) : setExpandedRowKeys([record.id]))}
              >
                查看详情
              </Paragraph>
            </Space>
          );
        }

        return (
          <Space style={{ width: '100%' }} vertical align="left">
            <Paragraph
              ellipsis={{
                rows: 2
              }}
              style={{ maxWidth: 120 }}
            >
              {record.type === 2 ? '调用消费' : '签到'}
            </Paragraph>
            <Paragraph
              type="link"
              link
              onClick={() => (expandedRowKeys.includes(record.id) ? setExpandedRowKeys([]) : setExpandedRowKeys([record.id]))}
            >
              查看详情
            </Paragraph>
          </Space>
        );
      }
    }
  ];

  const [logs, setLogs] = useState([]);
  const [expandData, setExpandData] = useState({});
  const [showStat, setShowStat] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStat, setLoadingStat] = useState(false);
  const [activePage, setActivePage] = useState(1);
  const [logCount, setLogCount] = useState(ITEMS_PER_PAGE);
  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);
  const [logType, setLogType] = useState(0);
  const [expandedRowKeys, setExpandedRowKeys] = useState([487050]);
  const isAdminUser = isAdmin();
  let now = new Date();
  // 初始化start_timestamp为今天0点
  const [inputs, setInputs] = useState({
    username: '',
    user_id: '',
    token_name: '',
    model_name: '',
    start_timestamp: timestamp2string(getTodayStartTimestamp()),
    end_timestamp: timestamp2string(getTodayStartTimestamp() + 3600 * 24),
    channel: ''
  });
  const { username, user_id, token_name, model_name, start_timestamp, end_timestamp, channel } = inputs;

  const [stat, setStat] = useState({
    quota: 0,
    token: 0,
    rpm: 0,
    tpm: 0
  });

  const handleInputChange = (value, name) => {
    setInputs((inputs) => ({ ...inputs, [name]: value }));
  };

  const getLogSelfStat = async () => {
    let localStartTimestamp = Date.parse(start_timestamp) / 1000;
    let localEndTimestamp = Date.parse(end_timestamp) / 1000;
    let url = `/api/log/self/stat?type=${logType}&token_name=${token_name}&model_name=${model_name}&start_timestamp=${localStartTimestamp}&end_timestamp=${localEndTimestamp}`;
    url = encodeURI(url);
    let res = await API.get(url);
    const { success, message, data } = res.data;
    if (success) {
      setStat(data);
    } else {
      showError(message);
    }
  };

  const getLogStat = async () => {
    let localStartTimestamp = Date.parse(start_timestamp) / 1000;
    let localEndTimestamp = Date.parse(end_timestamp) / 1000;
    let url = `/api/log/stat?type=${logType}&username=${username}&user_id=${user_id}&token_name=${token_name}&model_name=${model_name}&start_timestamp=${localStartTimestamp}&end_timestamp=${localEndTimestamp}&channel=${channel}`;
    url = encodeURI(url);
    let res = await API.get(url);
    const { success, message, data } = res.data;
    if (success) {
      setStat(data);
    } else {
      showError(message);
    }
  };

  const handleEyeClick = async () => {
    if (loadingStat) {
      return;
    }
    setLoadingStat(true);
    if (isAdminUser) {
      await getLogStat();
    } else {
      await getLogSelfStat();
    }
    setShowStat(true);
    setLoadingStat(false);
  };

  const showUserInfo = async (userId) => {
    if (!isAdminUser) {
      return;
    }
    const res = await API.get(`/api/user/${userId}`);
    const { success, message, data } = res.data;
    if (success) {
      Modal.info({
        title: '用户信息',
        content: (
          <div style={{ padding: 12 }}>
            <p>用户名: {data.username}</p>
            <p>余额: {renderQuota(data.quota)}</p>
            <p>已用额度：{renderQuota(data.used_quota)}</p>
            <p>请求次数：{renderNumber(data.request_count)}</p>
          </div>
        ),
        centered: true
      });
    } else {
      showError(message);
    }
  };

  const setLogsFormat = (logs) => {
    let expandDatesLocal = {};
    for (let i = 0; i < logs.length; i++) {
      logs[i].timestamp2string = timestamp2string(logs[i].created_at);
      logs[i].key = '' + logs[i].id;
      logs[i].label = '' + logs[i].id;
      let other = getLogOther(logs[i].other);
      let expandDataLocal = [];
      if (isAdmin()) {
        // let content = '渠道：' + logs[i].channel;
        // if (other.admin_info !== undefined) {
        //   if (
        //     other.admin_info.use_channel !== null &&
        //     other.admin_info.use_channel !== undefined &&
        //     other.admin_info.use_channel !== ''
        //   ) {
        //     // channel id array
        //     let useChannel = other.admin_info.use_channel;
        //     let useChannelStr = useChannel.join('->');
        //     content = `渠道：${useChannelStr}`;
        //   }
        // }
        // expandDataLocal.push({
        //   key: '渠道重试',
        //   value: content,
        // })
      }
      if (other?.ws || other?.audio) {
        expandDataLocal.push({
          key: '语音输入',
          label: '语音输入',
          value: other.audio_input
        });
        expandDataLocal.push({
          key: '语音输出',
          label: '语音输出',
          value: other.audio_output
        });
        expandDataLocal.push({
          key: '文字输入',
          label: '文字输入',
          value: other.text_input
        });
        expandDataLocal.push({
          key: '文字输出',
          label: '文字输出',
          value: other.text_output
        });
      }
      expandDataLocal.push({
        key: '请求 IP',
        label: '请求 IP',
        value: logs[i].request_ip
      });
      expandDataLocal.push({
        key: '日志详情',
        label: '日志详情',
        value: logs[i].content
      });
      if (logs[i].type === 2) {
        let content = '';
        if (other?.ws || other?.audio) {
          content = renderAudioModelPrice(
            other.text_input,
            other.text_output,
            other.model_ratio,
            other.model_price,
            other.completion_ratio,
            other.audio_input,
            other.audio_output,
            other?.audio_ratio,
            other?.audio_completion_ratio,
            other.group_ratio
          );
        } else {
          content = renderModelPrice(
            logs[i].prompt_tokens,
            logs[i].completion_tokens,
            other.model_ratio,
            other.model_price,
            other.completion_ratio,
            other.group_ratio
          );
        }
        if (!logs[i].is_error) {
          expandDataLocal.push({
            key: '计费过程',
            label: '计费过程',
            value: content
          });
        }
      }

      expandDatesLocal[logs[i].key] = expandDataLocal;
    }

    setExpandData(expandDatesLocal);

    setLogs(logs);
  };

  const loadLogs = async (startIdx, pageSize, logType = 0) => {
    setLoading(true);

    let url = '';
    let localStartTimestamp = Date.parse(start_timestamp) / 1000;
    let localEndTimestamp = Date.parse(end_timestamp) / 1000;
    if (isAdminUser) {
      url = `/api/log/?p=${startIdx}&page_size=${pageSize}&type=${logType}&username=${username}&token_name=${token_name}&model_name=${model_name}&start_timestamp=${localStartTimestamp}&end_timestamp=${localEndTimestamp}&channel=${channel}&user_id=${user_id}`;
    } else {
      url = `/api/log/self/?p=${startIdx}&page_size=${pageSize}&type=${logType}&token_name=${token_name}&model_name=${model_name}&start_timestamp=${localStartTimestamp}&end_timestamp=${localEndTimestamp}`;
    }
    url = encodeURI(url);
    const res = await API.get(url);
    const { success, message, data } = res.data;
    if (success) {
      const newPageData = data.items;
      setActivePage(data.page);
      setPageSize(data.page_size);
      setLogCount(data.total);

      setLogsFormat(newPageData);
    } else {
      showError(message);
    }
    setLoading(false);
  };

  const handlePageChange = (page) => {
    setActivePage(page);
    loadLogs(page, pageSize, logType).then((r) => {});
  };

  const handlePageSizeChange = async (size) => {
    localStorage.setItem('page-size', size + '');
    setPageSize(size);
    setActivePage(1);
    loadLogs(activePage, size)
      .then()
      .catch((reason) => {
        showError(reason);
      });
  };

  const refresh = async () => {
    setActivePage(1);
    handleEyeClick();
    await loadLogs(activePage, pageSize, logType);
  };

  const copyText = async (text) => {
    if (await copy(text)) {
      showSuccess('已复制：' + text);
    } else {
      Modal.error({ title: '无法复制到剪贴板，请手动复制', content: text });
    }
  };

  useEffect(() => {
    const localPageSize = parseInt(localStorage.getItem('page-size')) || ITEMS_PER_PAGE;
    setPageSize(localPageSize);
    loadLogs(activePage, localPageSize)
      .then()
      .catch((reason) => {
        showError(reason);
      });
    handleEyeClick();
  }, []);

  const expandRowRender = (record, index) => {
    return (
      <Descriptions
        style={{ width: '100%' }}
        layout={'vertical'}
        column={1}
        data={expandData[record.key]}
        labelStyle={{ whiteSpace: 'nowrap' }}
        valueStyle={{
          maxWidth: '100%',
          overflow: 'auto'
        }}
      />
    );
  };

  return (
    <>
      <Card title="请求日志" bordered={false} headerStyle={{ padding: 0 }} bodyStyle={{ paddingLeft: 0, paddingRight: 0 }}>
        <Spin spinning={loadingStat}>
          <Card style={{ width: '100%' }}>
            <Row>
              <Col span={24} sm={24} md={8} lg={8} xl={8} xxl={8}>
                <Descriptions
                  layout={isMobile ? 'vertical' : 'vertical'}
                  data={[
                    {
                      key: '总消耗额度',
                      label: '总消耗额度',
                      value: (
                        <Tag color="green" size="large">
                          {renderQuota(stat.quota)}
                        </Tag>
                      )
                    }
                  ]}
                />
              </Col>
              <Col span={24} sm={24} md={8} lg={8} xl={8} xxl={8}>
                <Descriptions
                  layout={isMobile ? 'vertical' : 'vertical'}
                  data={[
                    {
                      key: '近一分钟内请求次数',
                      label: '近一分钟内请求次数',
                      value: (
                        <Tag color="blue" size="large">
                          {stat.rpm}
                        </Tag>
                      )
                    }
                  ]}
                />
              </Col>
              <Col span={24} sm={24} md={8} lg={8} xl={8} xxl={8}>
                <Descriptions
                  layout={isMobile ? 'vertical' : 'vertical'}
                  data={[
                    {
                      key: '近一分钟内消耗Token数',
                      label: '近一分钟内消耗Token数',
                      value: (
                        <Tag color="purple" size="large">
                          {stat.tpm}
                        </Tag>
                      )
                    }
                  ]}
                />
              </Col>
            </Row>
          </Card>
        </Spin>

        <Card bordered={false} bodyStyle={{ paddingLeft: 0, paddingRight: 0 }}>
          <Form layout={'horizontal'} labelPosition={'inset'} style={{ marginTop: 10 }}>
            <Form.Input
              field="token_name"
              label="令牌名称"
              style={{ width: 200 }}
              value={token_name}
              placeholder={'可选值'}
              name="token_name"
              onChange={(value) => handleInputChange(value, 'token_name')}
            />
            <Form.Input
              field="model_name"
              label="模型名称"
              style={{ width: 200 }}
              value={model_name}
              placeholder="可选值"
              name="model_name"
              onChange={(value) => handleInputChange(value, 'model_name')}
            />
            <Form.DatePicker
              field="start_timestamp"
              label="起始时间"
              style={{ width: 272 }}
              initValue={start_timestamp}
              value={start_timestamp}
              type="dateTime"
              name="start_timestamp"
              onChange={(value) => handleInputChange(value, 'start_timestamp')}
            />
            <Form.DatePicker
              field="end_timestamp"
              fluid
              label="结束时间"
              style={{ width: 272 }}
              initValue={end_timestamp}
              value={end_timestamp}
              type="dateTime"
              name="end_timestamp"
              onChange={(value) => handleInputChange(value, 'end_timestamp')}
            />
            <Form.Select
              field="log_type"
              fluid
              label="日志类型"
              initValue="0"
              onChange={(value) => {
                setLogType(parseInt(value));
                loadLogs(0, pageSize, parseInt(value));
              }}
            >
              <Select.Option value="0">全部</Select.Option>
              <Select.Option value="1">充值</Select.Option>
              <Select.Option value="2">消费</Select.Option>
              <Select.Option value="3">管理</Select.Option>
              <Select.Option value="4">系统</Select.Option>
              <Select.Option value="5">签到</Select.Option>
            </Form.Select>
            {isAdminUser && (
              <>
                <Form.Input
                  field="channel"
                  label="渠道 ID"
                  style={{ width: 200 }}
                  value={channel}
                  placeholder="可选值"
                  name="channel"
                  onChange={(value) => handleInputChange(value, 'channel')}
                />
                <Form.Input
                  field="username"
                  label="用户名称"
                  style={{ width: 200 }}
                  value={username}
                  placeholder={'可选值'}
                  name="username"
                  onChange={(value) => handleInputChange(value, 'username')}
                />
                <Form.Input
                  field="user_id"
                  label="用户ID"
                  style={{ width: 200 }}
                  value={user_id}
                  placeholder={'可选值'}
                  name="user_id"
                  onChange={(value) => handleInputChange(value, 'user_id')}
                />
              </>
            )}
            <Button label="查询" type="primary" htmlType="submit" className="btn-margin-right" onClick={refresh} loading={loading}>
              查询
            </Button>
          </Form>
        </Card>

        <Table
          style={{ width: '100%' }}
          columns={columns}
          border={false}
          expandedRowRender={expandRowRender}
          expandedRowKeys={expandedRowKeys}
          expandIcon={<></>}
          hideExpandedColumn={true}
          dataSource={logs}
          loading={loading}
          rowKey="id"
          scroll={{ x: 'max-content', y: true, scrollToFirstRowOnChange: true }}
          pagination={{
            currentPage: activePage,
            current: activePage,
            pageSize: pageSize,
            total: logCount,
            pageSizeOpts: [10, 20, 50, 100],
            showSizeChanger: true,
            onPageSizeChange: (size) => {
              handlePageSizeChange(size);
            },
            onPageChange: handlePageChange,
            onChange: handlePageChange,
            formatPageText: false,
            size: isMobile ? 'mini' : 'default',
            showTotal: true,
            showJumper: !isMobile
          }}
        />
      </Card>
    </>
  );
};

export default LogsTable;
