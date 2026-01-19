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

import React, { useEffect, useRef, useState } from 'react';
import {
  Button,
  Form,
  Input,
  Modal,
  Space,
  Switch,
  Table,
} from '@douyinfe/semi-ui';
import {
  IconDelete,
  IconEdit,
  IconPlus,
  IconSave,
  IconSearch,
} from '@douyinfe/semi-icons';
import { API, showError, showSuccess } from '../../../helpers';
import { useTranslation } from 'react-i18next';

export default function GroupRatioVisualEditor(props) {
  const { t } = useTranslation();
  const [groups, setGroups] = useState([]);
  const [visible, setVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentGroup, setCurrentGroup] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const formRef = useRef(null);
  const pageSize = 10;

  useEffect(() => {
    try {
      const groupRatio = JSON.parse(props.options.GroupRatio || '{}');
      const userUsableGroups = JSON.parse(
        props.options.UserUsableGroups || '{}',
      );
      const groupNames = new Set([
        ...Object.keys(groupRatio),
        ...Object.keys(userUsableGroups),
      ]);

      const groupData = Array.from(groupNames).map((name) => {
        const ratio = groupRatio[name] === undefined ? '' : groupRatio[name];
        const userLabel =
          userUsableGroups[name] === undefined ? '' : userUsableGroups[name];
        return {
          name,
          ratio: ratio === '' ? '' : String(ratio),
          userLabel: userLabel === '' ? '' : String(userLabel),
          userVisible: userUsableGroups[name] !== undefined,
        };
      });

      setGroups(groupData);
    } catch (error) {
      console.error('JSON解析错误:', error);
    }
  }, [props.options]);

  const getPagedData = (data, page, size) => {
    const start = (page - 1) * size;
    return data.slice(start, start + size);
  };

  const filteredGroups = groups.filter((group) => {
    const keywordMatch = searchText
      ? group.name.includes(searchText) || group.userLabel?.includes(searchText)
      : true;
    return keywordMatch;
  });

  const pagedData = getPagedData(filteredGroups, currentPage, pageSize);

  const SubmitData = async () => {
    setLoading(true);
    const output = {
      GroupRatio: {},
      UserUsableGroups: {},
    };

    try {
      groups.forEach((group) => {
        if (group.ratio !== '') {
          output.GroupRatio[group.name] = parseFloat(group.ratio);
        }
        if (group.userVisible) {
          output.UserUsableGroups[group.name] =
            group.userLabel && group.userLabel.trim() !== ''
              ? group.userLabel.trim()
              : group.name;
        }
      });

      const finalOutput = {
        GroupRatio: JSON.stringify(output.GroupRatio, null, 2),
        UserUsableGroups: JSON.stringify(output.UserUsableGroups, null, 2),
      };

      const requestQueue = Object.entries(finalOutput).map(([key, value]) =>
        API.put('/api/option/', { key, value }),
      );

      const results = await Promise.all(requestQueue);
      if (results.includes(undefined)) {
        return showError(t('部分保存失败，请重试'));
      }

      for (const res of results) {
        if (!res.data.success) {
          return showError(res.data.message);
        }
      }

      showSuccess(t('保存成功'));
      props.refresh();
    } catch (error) {
      console.error('保存失败:', error);
      showError(t('保存失败，请重试'));
    } finally {
      setLoading(false);
    }
  };

  const deleteGroup = (name) => {
    setGroups((prev) => prev.filter((group) => group.name !== name));
  };

  const resetModalState = () => {
    setCurrentGroup(null);
    setIsEditMode(false);
  };

  const editGroup = (record) => {
    setIsEditMode(true);
    const groupCopy = { ...record };
    setCurrentGroup(groupCopy);
    setVisible(true);

    setTimeout(() => {
      if (formRef.current) {
        formRef.current.setValues({
          name: groupCopy.name,
          ratio: groupCopy.ratio,
          userLabel: groupCopy.userLabel,
          userVisible: groupCopy.userVisible,
        });
      }
    }, 0);
  };

  const addOrUpdateGroup = (values) => {
    const ratioValue = values.ratio === '' ? '' : values.ratio;
    if (ratioValue !== '' && isNaN(ratioValue)) {
      showError(t('请输入数字倍率'));
      return;
    }

    const existingGroupIndex = groups.findIndex(
      (group) => group.name === values.name,
    );

    if (existingGroupIndex >= 0) {
      setGroups((prev) =>
        prev.map((group, index) => {
          if (index !== existingGroupIndex) return group;
          return {
            name: values.name,
            ratio: values.ratio || '',
            userLabel: values.userLabel || '',
            userVisible: Boolean(values.userVisible),
          };
        }),
      );

      setVisible(false);
      showSuccess(t('更新成功'));
      return;
    }

    if (groups.some((group) => group.name === values.name)) {
      showError(t('分组名称已存在'));
      return;
    }

    setGroups((prev) => [
      {
        name: values.name,
        ratio: values.ratio || '',
        userLabel: values.userLabel || '',
        userVisible: Boolean(values.userVisible),
      },
      ...prev,
    ]);
    setVisible(false);
    showSuccess(t('添加成功'));
  };

  const columns = [
    {
      title: t('分组名称'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('分组倍率'),
      dataIndex: 'ratio',
      key: 'ratio',
    },
    {
      title: t('用户可见'),
      dataIndex: 'userVisible',
      key: 'userVisible',
      render: (value, record) => (
        <Switch
          checked={Boolean(value)}
          onChange={(checked) => {
            setGroups((prev) =>
              prev.map((group) =>
                group.name === record.name
                  ? { ...group, userVisible: checked }
                  : group,
              ),
            );
          }}
        />
      ),
    },
    {
      title: t('用户可选描述'),
      dataIndex: 'userLabel',
      key: 'userLabel',
      render: (text) => text || '- ',
    },
    {
      title: t('操作'),
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type='primary'
            icon={<IconEdit />}
            onClick={() => editGroup(record)}
          />
          <Button
            icon={<IconDelete />}
            type='danger'
            onClick={() => deleteGroup(record.name)}
          />
        </Space>
      ),
    },
  ];

  return (
    <>
      <Space vertical align='start' style={{ width: '100%' }}>
        <Space className='mt-2'>
          <Button
            icon={<IconPlus />}
            onClick={() => {
              resetModalState();
              setVisible(true);
            }}
          >
            {t('添加分组')}
          </Button>
          <Button type='primary' icon={<IconSave />} onClick={SubmitData} loading={loading}>
            {t('应用更改')}
          </Button>
          <Input
            prefix={<IconSearch />}
            placeholder={t('搜索分组名称')}
            value={searchText}
            onChange={(value) => {
              setSearchText(value);
              setCurrentPage(1);
            }}
            style={{ width: 200 }}
            showClear
          />
        </Space>
        <Table
          columns={columns}
          dataSource={pagedData}
          pagination={{
            currentPage: currentPage,
            pageSize: pageSize,
            total: filteredGroups.length,
            onPageChange: (page) => setCurrentPage(page),
            showTotal: true,
            showSizeChanger: false,
          }}
          rowKey='name'
        />
      </Space>

      <Modal
        title={isEditMode ? t('编辑分组') : t('添加分组')}
        visible={visible}
        onCancel={() => {
          resetModalState();
          setVisible(false);
        }}
        onOk={() => {
          if (currentGroup) {
            addOrUpdateGroup(currentGroup);
          }
        }}
      >
        <Form getFormApi={(api) => (formRef.current = api)}>
          <Form.Input
            field='name'
            label={t('分组名称')}
            placeholder='vip'
            required
            disabled={isEditMode}
            onChange={(value) =>
              setCurrentGroup((prev) => ({ ...(prev || {}), name: value }))
            }
          />
          <Form.Input
            field='ratio'
            label={t('分组倍率')}
            placeholder={t('输入倍率')}
            onChange={(value) =>
              setCurrentGroup((prev) => ({ ...(prev || {}), ratio: value }))
            }
            initValue={currentGroup?.ratio || ''}
          />
          <Form.Switch
            field='userVisible'
            label={t('对用户可见')}
            onChange={(checked) =>
              setCurrentGroup((prev) => ({ ...(prev || {}), userVisible: checked }))
            }
            initValue={currentGroup?.userVisible || false}
          />
          <Form.Input
            field='userLabel'
            label={t('用户可选描述')}
            placeholder={t('输入用户可选描述')}
            onChange={(value) =>
              setCurrentGroup((prev) => ({ ...(prev || {}), userLabel: value }))
            }
            initValue={currentGroup?.userLabel || ''}
          />
        </Form>
      </Modal>
    </>
  );
}
