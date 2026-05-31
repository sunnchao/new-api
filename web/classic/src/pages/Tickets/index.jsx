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
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Button,
  Tag,
  Modal,
  Form,
  Select,
  Input,
  Typography,
  Dropdown,
  Space,
} from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Inbox,
  CheckCircle2,
  Eye,
  MoreHorizontal,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  TicketCheck,
  UserCheck,
} from 'lucide-react';
import {
  API,
  getUserIdFromLocalStorage,
  showError,
  showSuccess,
} from '../../helpers';
import { createCardProPagination } from '../../helpers/utils';
import CardPro from '../../components/common/ui/CardPro';
import CardTable from '../../components/common/ui/CardTable';
import { useIsMobile } from '../../hooks/common/useIsMobile';
import {
  PAGE_SIZE,
  PRIORITY_COLORS,
  STATUS_COLORS,
  TICKET_PRIORITY_MAP,
  TICKET_STATUS_MAP,
  buildTicketListUrl,
  buildTicketSearchUrl,
  formatTicketTime,
  getTicketActionState,
  getTicketCloseUrl,
  getTicketDetailPath,
  getCategoryLabel,
  getTextPreview,
  serializeTicketAttachmentUrls,
  summarizeTicketStatuses,
} from './utils';
import { TicketAttachmentUploader } from './TicketAttachments';
import './i18n';
import './index.css';

const { Title: SemiTitle, Text } = Typography;

function TicketEmptyState({ icon: Icon, title, description, children }) {
  return (
    <div className='classic-ticket-empty'>
      <div className='classic-ticket-empty-icon'>
        <Icon size={24} />
      </div>
      <Text strong>{title}</Text>
      {description && (
        <Text type='tertiary' className='classic-ticket-empty-text'>
          {description}
        </Text>
      )}
      {children && (
        <div className='classic-ticket-empty-actions'>{children}</div>
      )}
    </div>
  );
}

const Tickets = ({ isAdmin = false }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [tickets, setTickets] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState(0);
  const [createVisible, setCreateVisible] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [createAttachments, setCreateAttachments] = useState([]);
  const formApiRef = useRef(null);
  const currentAdminId = useMemo(
    () => (isAdmin ? getUserIdFromLocalStorage() : 0),
    [isAdmin],
  );

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const trimmedKeyword = searchKeyword.trim();
      const url = trimmedKeyword
        ? buildTicketSearchUrl({
            isAdmin,
            keyword: trimmedKeyword,
            page,
            pageSize: PAGE_SIZE,
            status: statusFilter,
          })
        : buildTicketListUrl({
            isAdmin,
            page,
            pageSize: PAGE_SIZE,
            status: statusFilter,
            category: categoryFilter,
            priority: priorityFilter,
          });
      const res = await API.get(url);
      if (res.data.success) {
        setTickets(res.data.data?.items || []);
        setTotal(res.data.data?.total || 0);
      } else {
        showError(res.data.message);
      }
    } catch (e) {
      showError(e.message);
    } finally {
      setLoading(false);
    }
  }, [
    categoryFilter,
    isAdmin,
    page,
    priorityFilter,
    searchKeyword,
    statusFilter,
  ]);

  const loadCategories = async () => {
    try {
      const res = await API.get('/api/ticket/categories');
      if (res.data.success) {
        setCategories(res.data.data || []);
      }
    } catch (e) {
      /* ignore */
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);
  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const handleCreate = async (values) => {
    try {
      const res = await API.post('/api/ticket/', {
        ...values,
        attachment_urls: serializeTicketAttachmentUrls(createAttachments),
      });
      if (res.data.success) {
        showSuccess(t('Ticket created successfully'));
        setCreateVisible(false);
        setCreateAttachments([]);
        formApiRef.current?.reset();
        loadTickets();
      } else {
        showError(res.data.message);
      }
    } catch (e) {
      showError(e.message);
    }
  };

  const handleSearch = () => {
    setPage(1);
    setSearchKeyword(keyword.trim());
  };

  const handleReset = () => {
    setKeyword('');
    setSearchKeyword('');
    setStatusFilter(0);
    setCategoryFilter('');
    setPriorityFilter(0);
    setPage(1);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTickets();
    setRefreshing(false);
  };

  const handleFilterChange = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const refreshAfterMutation = async () => {
    if (tickets.length === 1 && page > 1) {
      setPage(page - 1);
      return;
    }
    await loadTickets();
  };

  const runTicketAction = async (loadingKey, action) => {
    setActionLoading(loadingKey);
    try {
      const res = await action();
      if (res.data.success) return true;
      showError(res.data.message);
    } catch (e) {
      showError(e.message);
    } finally {
      setActionLoading('');
    }
    return false;
  };

  const handleViewTicket = (ticket) => {
    navigate(getTicketDetailPath(ticket.id, isAdmin));
  };

  const handleAssignToMe = async (ticket) => {
    if (currentAdminId <= 0) {
      showError(t('Unable to identify current admin'));
      return;
    }

    const success = await runTicketAction(`assign-${ticket.id}`, () =>
      API.put(`/api/ticket/${ticket.id}/assign`, {
        admin_id: currentAdminId,
      }),
    );
    if (success) {
      showSuccess(t('Ticket assigned successfully'));
      await refreshAfterMutation();
    }
  };

  const handleCloseTicket = async (ticket) => {
    const success = await runTicketAction(`close-${ticket.id}`, () =>
      isAdmin
        ? API.put(getTicketCloseUrl(ticket.id, true), { status: 4 })
        : API.put(getTicketCloseUrl(ticket.id, false)),
    );
    if (success) {
      showSuccess(t('Ticket closed successfully'));
      await refreshAfterMutation();
    }
  };

  const handleDeleteTicket = (ticket) => {
    Modal.confirm({
      title: t('Delete Ticket'),
      content: t('Are you sure you want to delete this ticket?'),
      okText: t('Delete Ticket'),
      cancelText: t('Cancel'),
      onOk: () => {
        (async () => {
          const success = await runTicketAction(`delete-${ticket.id}`, () =>
            API.delete(`/api/ticket/${ticket.id}`),
          );
          if (success) {
            showSuccess(t('Ticket deleted successfully'));
            await refreshAfterMutation();
          }
        })();
      },
    });
  };

  const renderTicketActions = (ticket) => {
    const actionState = getTicketActionState(
      ticket,
      isAdmin ? currentAdminId : 0,
    );
    const menuItems = [
      isAdmin &&
        actionState.canAssignToSelf && {
          node: 'item',
          name: t('Assign to me'),
          onClick: () => handleAssignToMe(ticket),
        },
      isAdmin &&
        actionState.canClose && {
          node: 'item',
          name: t('Close Ticket'),
          onClick: () => handleCloseTicket(ticket),
        },
      isAdmin && {
        node: 'item',
        name: t('Delete Ticket'),
        type: 'danger',
        onClick: () => handleDeleteTicket(ticket),
      },
    ].filter(Boolean);

    return (
      <Space spacing={6} wrap className='classic-ticket-actions'>
        <Button
          type='tertiary'
          size='small'
          icon={<Eye size={14} />}
          onClick={() => handleViewTicket(ticket)}
        >
          {t('View')}
        </Button>
        {isAdmin && actionState.canAssignToSelf && (
          <Button
            type='tertiary'
            size='small'
            icon={<UserCheck size={14} />}
            loading={actionLoading === `assign-${ticket.id}`}
            onClick={() => handleAssignToMe(ticket)}
          >
            {t('Assign to me')}
          </Button>
        )}
        {actionState.canClose && (
          <Button
            theme='borderless'
            type='danger'
            size='small'
            icon={<CheckCircle2 size={14} />}
            loading={actionLoading === `close-${ticket.id}`}
            onClick={() => handleCloseTicket(ticket)}
          >
            {t('Close Ticket')}
          </Button>
        )}
        {isAdmin && (
          <Dropdown trigger='click' position='bottomRight' menu={menuItems}>
            <Button
              type='tertiary'
              size='small'
              icon={<MoreHorizontal size={14} />}
            />
          </Dropdown>
        )}
      </Space>
    );
  };

  const summary = useMemo(() => summarizeTicketStatuses(tickets), [tickets]);

  const summaryItems = [
    { label: t('Current Page'), value: summary.total, icon: TicketCheck },
    { label: t('Pending'), value: summary.pending, color: STATUS_COLORS[1] },
    {
      label: t('In Progress'),
      value: summary.progress,
      color: STATUS_COLORS[2],
    },
    { label: t('Replied'), value: summary.replied, color: STATUS_COLORS[3] },
    { label: t('Closed'), value: summary.closed, color: STATUS_COLORS[4] },
  ];

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 76,
      render: (id) => <span className='classic-ticket-id'>#{id}</span>,
    },
    {
      title: t('Title'),
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <button
          type='button'
          className='classic-ticket-title-link'
          onClick={() => handleViewTicket(record)}
        >
          <span className='classic-ticket-title-text'>{text}</span>
          {record.description && (
            <span className='classic-ticket-title-preview'>
              {getTextPreview(record.description)}
            </span>
          )}
        </button>
      ),
    },
    {
      title: t('Category'),
      dataIndex: 'category',
      key: 'category',
      width: 130,
      render: (value) => <Tag>{getCategoryLabel(categories, value)}</Tag>,
    },
    {
      title: t('Priority'),
      dataIndex: 'priority',
      key: 'priority',
      width: 110,
      render: (value) => (
        <Tag color={PRIORITY_COLORS[value]}>
          {t(TICKET_PRIORITY_MAP[value])}
        </Tag>
      ),
    },
    {
      title: t('Status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (value) => (
        <Tag color={STATUS_COLORS[value]}>{t(TICKET_STATUS_MAP[value])}</Tag>
      ),
    },
    ...(isAdmin
      ? [
          {
            title: t('Assigned To'),
            dataIndex: 'assigned_admin_id',
            key: 'assigned_admin_id',
            width: 120,
            render: (value) => (
              <Text type='tertiary'>{value > 0 ? `#${value}` : '-'}</Text>
            ),
          },
        ]
      : []),
    {
      title: t('Created At'),
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (value) => <Text type='tertiary'>{formatTicketTime(value)}</Text>,
    },
    {
      title: t('Updated At'),
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 150,
      render: (value) => <Text type='tertiary'>{formatTicketTime(value)}</Text>,
    },
    {
      title: t('Actions'),
      dataIndex: 'actions',
      key: 'actions',
      width: isAdmin ? 260 : 170,
      fixed: 'right',
      render: (_, record) => renderTicketActions(record),
    },
  ];

  const statsArea = (
    <div className='classic-ticket-summary-grid'>
      {summaryItems.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className='classic-ticket-summary-item'>
            <div>
              <Text type='tertiary' size='small'>
                {item.label}
              </Text>
              <strong>{item.value}</strong>
            </div>
            {Icon ? (
              <Icon size={18} />
            ) : (
              <span
                className='classic-ticket-summary-dot'
                data-color={item.color}
              />
            )}
          </div>
        );
      })}
    </div>
  );

  const searchArea = (
    <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-2 w-full'>
      <div className='flex items-center gap-2 flex-1 min-w-0 flex-wrap'>
        <Input
          value={keyword}
          prefix={<Search size={14} />}
          placeholder={t('Search tickets')}
          onChange={setKeyword}
          onEnterPress={handleSearch}
          style={{ width: isMobile ? '100%' : 240 }}
        />
        <Button theme='solid' type='tertiary' onClick={handleSearch}>
          {t('Search')}
        </Button>
        <Button
          theme='borderless'
          type='tertiary'
          icon={<RotateCcw size={14} />}
          onClick={handleReset}
        >
          {t('Reset')}
        </Button>
      </div>
      <div className='flex items-center gap-2 flex-wrap'>
        <Select
          value={statusFilter}
          onChange={handleFilterChange(setStatusFilter)}
          style={{ width: 150 }}
        >
          <Select.Option value={0}>{t('All Statuses')}</Select.Option>
          {Object.entries(TICKET_STATUS_MAP).map(([key, value]) => (
            <Select.Option key={key} value={Number(key)}>
              {t(value)}
            </Select.Option>
          ))}
        </Select>
        {isAdmin && (
          <>
            <Select
              value={categoryFilter}
              onChange={handleFilterChange(setCategoryFilter)}
              style={{ width: 150 }}
            >
              <Select.Option value=''>{t('All Categories')}</Select.Option>
              {categories.map((category) => (
                <Select.Option key={category.value} value={category.value}>
                  {category.label}
                </Select.Option>
              ))}
            </Select>
            <Select
              value={priorityFilter}
              onChange={handleFilterChange(setPriorityFilter)}
              style={{ width: 150 }}
            >
              <Select.Option value={0}>{t('All Priorities')}</Select.Option>
              {Object.entries(TICKET_PRIORITY_MAP).map(([key, value]) => (
                <Select.Option key={key} value={Number(key)}>
                  {t(value)}
                </Select.Option>
              ))}
            </Select>
          </>
        )}
        <Button
          theme='borderless'
          type='tertiary'
          icon={
            <RefreshCw
              size={14}
              className={refreshing ? 'classic-ticket-spin' : ''}
            />
          }
          disabled={refreshing}
          onClick={handleRefresh}
        >
          {t('Refresh')}
        </Button>
      </div>
    </div>
  );

  const ticketEmpty = (
    <TicketEmptyState
      icon={Inbox}
      title={t('No tickets found')}
      description={searchKeyword ? t('No matching tickets found') : ''}
    >
      {isAdmin ? (
        <Button
          theme='outline'
          type='tertiary'
          icon={<RefreshCw size={14} />}
          onClick={handleRefresh}
        >
          {t('Refresh')}
        </Button>
      ) : (
        <Button
          theme='solid'
          icon={<Plus size={14} />}
          onClick={() => setCreateVisible(true)}
        >
          {t('Create Ticket')}
        </Button>
      )}
    </TicketEmptyState>
  );

  return (
    <div className='w-full mx-auto relative min-h-screen lg:min-h-0 mt-[60px] px-2 pb-10'>
      <div className='flex items-center justify-between gap-4 mb-4'>
        <div>
          <SemiTitle heading={3} className='!mb-1'>
            {isAdmin ? t('Ticket Management') : t('My Tickets')}
          </SemiTitle>
          <Text type='tertiary'>
            {t('Total Tickets')}: {total}
          </Text>
        </div>
        {!isAdmin && (
          <Button
            theme='solid'
            icon={<Plus size={15} />}
            onClick={() => setCreateVisible(true)}
          >
            {t('Create Ticket')}
          </Button>
        )}
      </div>

      <CardPro
        type='type2'
        statsArea={statsArea}
        searchArea={searchArea}
        paginationArea={createCardProPagination({
          currentPage: page,
          pageSize: PAGE_SIZE,
          total,
          onPageChange: setPage,
          isMobile,
          t,
        })}
        t={t}
      >
        <CardTable
          rowKey='id'
          columns={columns}
          dataSource={tickets}
          loading={loading}
          hidePagination
          scroll={{ x: isAdmin ? 1240 : 1020 }}
          empty={ticketEmpty}
        />
      </CardPro>

      <Modal
        title={t('Create Ticket')}
        visible={createVisible}
        onOk={() => formApiRef.current?.submitForm()}
        onCancel={() => {
          setCreateVisible(false);
          setCreateAttachments([]);
        }}
        width={560}
      >
        <Form
          className='classic-ticket-create-form'
          getFormApi={(api) => {
            formApiRef.current = api;
          }}
          onSubmit={handleCreate}
        >
          <Form.Input
            field='title'
            label={t('Title')}
            placeholder={t('Ticket title')}
            rules={[{ required: true, message: t('Title is required') }]}
          />
          <Form.Select
            field='category'
            label={t('Category')}
            placeholder={t('All Categories')}
            rules={[{ required: true, message: t('Category is required') }]}
          >
            {categories.map((cat) => (
              <Select.Option key={cat.value} value={cat.value}>
                {cat.label}
              </Select.Option>
            ))}
          </Form.Select>
          <Form.Select field='priority' label={t('Priority')} initValue={1}>
            <Select.Option value={1}>{t('Low')}</Select.Option>
            <Select.Option value={2}>{t('Medium')}</Select.Option>
            <Select.Option value={3}>{t('High')}</Select.Option>
          </Form.Select>
          <Form.TextArea
            field='description'
            label={t('Description')}
            placeholder={t('Describe your issue')}
            rules={[{ required: true, message: t('Description is required') }]}
            rows={5}
          />
          <div className='classic-ticket-form-attachments'>
            <Text strong>{t('Attachments')}</Text>
            <TicketAttachmentUploader
              value={createAttachments}
              onChange={setCreateAttachments}
            />
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Tickets;
