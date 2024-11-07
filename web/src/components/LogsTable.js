import React, { useEffect, useState } from 'react';
import {
  API,
  copy,
  getTodayStartTimestamp,
  isAdmin,
  isMobile,
  showError,
  showSuccess,
  timestamp2string,
} from "../helpers";

import {
  Avatar,
  Button,
  Card,
  Form,
  Layout,
  Modal,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
  Row,
  Col,
  Typography,
  Descriptions,
} from "@douyinfe/semi-ui";
import { IconLightningStroked } from "@douyinfe/semi-icons";
import { ITEMS_PER_PAGE } from "../constants";
import {
  renderGroup,
  renderModelPrice,
  renderNumber,
  renderQuota,
  stringToColor,
} from "../helpers/render";
import Paragraph from "@douyinfe/semi-ui/lib/es/typography/paragraph";
import { getLogOther } from "../helpers/other.js";

const { Header } = Layout;

function renderTimestamp(timestamp) {
  return <>{timestamp2string(timestamp)}</>;
}

const MODE_OPTIONS = [
  { key: "all", text: "全部用户", value: "all" },
  { key: "self", text: "当前用户", value: "self" },
];

const colors = [
  "amber",
  "blue",
  "cyan",
  "green",
  "grey",
  "indigo",
  "light-blue",
  "lime",
  "orange",
  "pink",
  "purple",
  "red",
  "teal",
  "violet",
  "yellow",
];

function renderType(type) {
  switch (type) {
    case 1:
      return (
        <Tag color="cyan" size="large">
          {" "}
          充值{" "}
        </Tag>
      );
    case 2:
      return (
        <Tag color="lime" size="large">
          {" "}
          消费{" "}
        </Tag>
      );
    case 3:
      return (
        <Tag color="orange" size="large">
          {" "}
          管理{" "}
        </Tag>
      );
    case 4:
      return (
        <Tag color="purple" size="large">
          {" "}
          系统{" "}
        </Tag>
      );
    case 5:
      return (
        <Tag color="green" size="large">
          {" "}
          签到{" "}
        </Tag>
      );
    case 6:
      return (
        <Tag color="green" size="large">
          {" "}
          登录{" "}
        </Tag>
      );
    default:
      return (
        <Tag color="black" size="large">
          {" "}
          未知{" "}
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
        {" "}
        {time} s{" "}
      </Tag>
    );
  } else if (time < 300) {
    return (
      <Tag color="orange" size="large">
        {" "}
        {time} s{" "}
      </Tag>
    );
  } else {
    return (
      <Tag color="red" size="large">
        {" "}
        {time} s{" "}
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
        {" "}
        {time} s{" "}
      </Tag>
    );
  } else if (time < 10) {
    return (
      <Tag color="orange" size="large">
        {" "}
        {time} s{" "}
      </Tag>
    );
  } else {
    return (
      <Tag color="red" size="large">
        {" "}
        {time} s{" "}
      </Tag>
    );
  }
}

const LogsTable = ({ groups }) => {
  const columns = [
    {
      title: '时间/IP',
      fixed: true,
      width: 150,
      dataIndex: 'timestamp2string',
      render: (text, record, index) => {
        return (
          <Space vertical wrap align="left" spacing={8}>
            <div>{text}</div>
            <div>
              <Tag
                onClick={() => {
                  copyText(record.request_ip);
                }}
                color="grey"
              >
                {record.request_ip}
              </Tag>
            </div>
          </Space>
        );
      }
    },
    {
      title: '渠道',
      dataIndex: 'channel',
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
      render: (text, record, index) => {
        return record.type === 0 || record.type === 2 ? <>{<span> {text} </span>}</> : <></>;
      }
    },
    {
      title: '补全',
      dataIndex: 'completion_tokens',
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
  const isAdminUser = isAdmin();
  let now = new Date();
  // 初始化start_timestamp为今天0点
  const [inputs, setInputs] = useState({
    username: '',
    user_id: '',
    token_name: '',
    model_name: '',
    start_timestamp: timestamp2string(getTodayStartTimestamp()),
    end_timestamp: timestamp2string(now.getTime() / 1000 + 3600),
    channel: '',
  });
  const { username, user_id, token_name, model_name, start_timestamp, end_timestamp, channel } =
    inputs;

  const [stat, setStat] = useState({
    quota: 0,
    token: 0,
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
        centered: true,
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
      if (other?.ws) {
        expandDataLocal.push({
          key: '语音输入',
          value: other.audio_input,
        });
        expandDataLocal.push({
          key: '语音输出',
          value: other.audio_output,
        });
        expandDataLocal.push({
          key: '文字输入',
          value: other.text_input,
        });
        expandDataLocal.push({
          key: '文字输出',
          value: other.text_output,
        });
      }
      expandDataLocal.push({
        key: '日志详情',
        value: logs[i].content,
      })
      if (logs[i].type === 2) {
        let content = renderModelPrice(
            logs[i].prompt_tokens,
            logs[i].completion_tokens,
            other.model_ratio,
            other.model_price,
            other.completion_ratio,
            other.group_ratio,
        );
        expandDataLocal.push({
          key: '计费过程',
          value: content,
        });
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
    return <Descriptions data={expandData[record.key]} />;
  };

  return (
    <>
      <Card title="请求日志">
        <Spin spinning={loadingStat}>
          <Card style={{ width: '100%' }}>
            <Row>
              <Col span={24} sm={24} md={8} lg={8} xl={8} xxl={8}>
                <Descriptions
                  layout={isMobile() ? 'vertical' : 'horizontal'}
                  row={1}
                  data={[
                    {
                      key: '总消耗额度',
                      value: (
                        <Tag color="green" size="large" style={{ marginTop: 15 }}>
                          {renderQuota(stat.quota)}
                        </Tag>
                      ),
                    },
                  ]}
                />
              </Col>
              <Col span={24} sm={24} md={8} lg={8} xl={8} xxl={8}>
                <Descriptions
                  layout={isMobile() ? 'vertical' : 'horizontal'}
                  row={1}
                  data={[
                    {
                      key: '近一分钟内请求次数',
                      value: (
                        <Tag color="blue" size="large" style={{ marginTop: 15 }}>
                          {stat.rpm}
                        </Tag>
                      ),
                    },
                  ]}
                />
              </Col>
              <Col span={24} sm={24} md={8} lg={8} xl={8} xxl={8}>
                <Descriptions
                  layout={isMobile() ? 'vertical' : 'horizontal'}
                  row={1}
                  data={[
                    {
                      key: '近一分钟内消耗Token数',
                      value: (
                        <Tag color="purple" size="large" style={{ marginTop: 15 }}>
                          {stat.tpm}
                        </Tag>
                      ),
                    },
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
            <Button
              label="查询"
              type="primary"
              htmlType="submit"
              className="btn-margin-right"
              onClick={refresh}
              loading={loading}
            >
              查询
            </Button>
          </Form>
        </Card>

        <Table
          style={{ width: '100%' }}
          columns={columns}
          expandedRowRender={expandRowRender}
          dataSource={logs}
          rowKey="key"
          scroll={{ x: 'max-content', y: 'max-content' }}
          pagination={{
            currentPage: activePage,
            pageSize: pageSize,
            total: logCount,
            pageSizeOpts: [10, 20, 50, 100],
            showSizeChanger: true,
            onPageSizeChange: (size) => {
              handlePageSizeChange(size);
            },
            onPageChange: handlePageChange,
            formatPageText: false,
            size: isMobile() ? 'small' : 'default',
            showTotal: true,
          }}
        />
      </Card>
    </>
  );
};

export default LogsTable;
