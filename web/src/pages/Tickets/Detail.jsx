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
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button,
  Tag,
  Typography,
  TextArea,
  Spin,
  Space,
  Modal,
} from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  CheckCircle2,
  MessageSquare,
  Send,
  Trash2,
  UserCheck,
  UserRound,
} from 'lucide-react';
import {
  API,
  getUserIdFromLocalStorage,
  showError,
  showSuccess,
} from '../../helpers';
import {
  PRIORITY_COLORS,
  STATUS_COLORS,
  TICKET_PRIORITY_MAP,
  TICKET_STATUS_MAP,
  formatTicketTime,
  getTicketActionState,
  getTicketCloseUrl,
  getTicketListPath,
  getCategoryLabel,
  isTicketClosed,
  parseTicketAttachmentUrls,
  serializeTicketAttachmentUrls,
} from './utils';
import {
  TicketAttachmentList,
  TicketAttachmentUploader,
} from './TicketAttachments';
import './i18n';
import './index.css';

const { Title: SemiTitle, Text } = Typography;

const TicketDetail = ({ isAdmin = false }) => {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [userContext, setUserContext] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyAttachments, setReplyAttachments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const currentAdminId = useMemo(
    () => (isAdmin ? getUserIdFromLocalStorage() : 0),
    [isAdmin],
  );

  const loadDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get(`/api/ticket/${id}`);
      if (res.data.success) {
        setTicket(res.data.data.ticket);
        setMessages(res.data.data.messages || []);
        setUserContext(res.data.data.user_context || null);
      } else {
        showError(res.data.message);
      }
    } catch (e) {
      showError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadCategories = async () => {
    try {
      const res = await API.get('/api/ticket/categories');
      if (res.data.success) {
        setCategories(res.data.data || []);
      }
    } catch (e) {
      /* keep detail usable without category labels */
    }
  };

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);
  useEffect(() => {
    loadCategories();
  }, []);

  const handleReply = async () => {
    if (!replyContent.trim()) {
      showError(t('Message cannot be empty'));
      return;
    }
    setSending(true);
    try {
      const res = await API.post(`/api/ticket/${id}/message`, {
        content: replyContent,
        attachment_urls: serializeTicketAttachmentUrls(replyAttachments),
      });
      if (res.data.success) {
        showSuccess(t('Reply sent successfully'));
        setReplyContent('');
        setReplyAttachments([]);
        loadDetail();
      } else {
        showError(res.data.message);
      }
    } catch (e) {
      showError(e.message);
    } finally {
      setSending(false);
    }
  };

  const handleClose = async () => {
    setClosing(true);
    try {
      const res = isAdmin
        ? await API.put(getTicketCloseUrl(id, true), { status: 4 })
        : await API.put(getTicketCloseUrl(id, false));
      if (res.data.success) {
        showSuccess(t('Ticket closed successfully'));
        navigate(getTicketListPath(isAdmin));
      } else {
        showError(res.data.message);
      }
    } catch (e) {
      showError(e.message);
    } finally {
      setClosing(false);
    }
  };

  const handleAssignToMe = async () => {
    if (currentAdminId <= 0) {
      showError(t('Unable to identify current admin'));
      return;
    }

    setAssigning(true);
    try {
      const res = await API.put(`/api/ticket/${id}/assign`, {
        admin_id: currentAdminId,
      });
      if (res.data.success) {
        showSuccess(t('Ticket assigned successfully'));
        loadDetail();
      } else {
        showError(res.data.message);
      }
    } catch (e) {
      showError(e.message);
    } finally {
      setAssigning(false);
    }
  };

  const handleDelete = () => {
    Modal.confirm({
      title: t('Delete Ticket'),
      content: t('Are you sure you want to delete this ticket?'),
      okText: t('Delete Ticket'),
      cancelText: t('Cancel'),
      onOk: () => {
        (async () => {
          setDeleting(true);
          try {
            const res = await API.delete(`/api/ticket/${id}`);
            if (res.data.success) {
              showSuccess(t('Ticket deleted successfully'));
              navigate(getTicketListPath(true));
            } else {
              showError(res.data.message);
            }
          } catch (e) {
            showError(e.message);
          } finally {
            setDeleting(false);
          }
        })();
      },
    });
  };

  const categoryLabel = useMemo(
    () => getCategoryLabel(categories, ticket?.category),
    [categories, ticket?.category],
  );
  const closed = isTicketClosed(ticket);
  const actionState = getTicketActionState(ticket, currentAdminId);
  const hasUserContext =
    isAdmin &&
    userContext &&
    Object.keys(userContext).length > 0 &&
    !userContext.error;

  if (loading) {
    return (
      <div className='classic-ticket-detail classic-ticket-detail-state w-full mx-auto relative min-h-screen lg:min-h-0 mt-[60px] px-2'>
        <Spin size='large' />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className='classic-ticket-detail classic-ticket-detail-state w-full mx-auto relative min-h-screen lg:min-h-0 mt-[60px] px-2'>
        <Text type='tertiary'>{t('No tickets found')}</Text>
      </div>
    );
  }

  return (
    <div className='classic-ticket-detail w-full mx-auto relative min-h-screen lg:min-h-0 mt-[60px] px-2'>
      <div className='classic-ticket-detail-header'>
        <div className='classic-ticket-detail-title-group'>
          <Button
            theme='borderless'
            type='tertiary'
            icon={<ArrowLeft size={16} />}
            onClick={() => navigate(getTicketListPath(isAdmin))}
          >
            {t('Back')}
          </Button>
          <div className='classic-ticket-detail-title-copy'>
            <Text type='tertiary'>#{ticket.id}</Text>
            <SemiTitle heading={3} className='classic-ticket-detail-title'>
              {ticket.title}
            </SemiTitle>
          </div>
        </div>
        <div className='classic-ticket-detail-actions'>
          {!closed && (
            <Button
              theme='solid'
              type='danger'
              loading={closing}
              onClick={handleClose}
            >
              {t('Close Ticket')}
            </Button>
          )}
          {isAdmin && actionState.canAssignToSelf && (
            <Button
              theme='borderless'
              type='tertiary'
              icon={<UserCheck size={16} />}
              loading={assigning}
              onClick={handleAssignToMe}
            >
              {t('Assign to me')}
            </Button>
          )}
          {isAdmin && (
            <Button
              theme='borderless'
              type='danger'
              icon={<Trash2 size={16} />}
              loading={deleting}
              onClick={handleDelete}
            >
              {t('Delete Ticket')}
            </Button>
          )}
        </div>
      </div>

      <div className='classic-ticket-detail-meta'>
        <Tag color={STATUS_COLORS[ticket.status]}>
          {t(TICKET_STATUS_MAP[ticket.status])}
        </Tag>
        <Tag>{categoryLabel}</Tag>
        <Tag color={PRIORITY_COLORS[ticket.priority]}>
          {t(TICKET_PRIORITY_MAP[ticket.priority])}
        </Tag>
        <Text type='tertiary'>
          {t('Created At')}: {formatTicketTime(ticket.created_at)}
        </Text>
        <Text type='tertiary'>
          {t('Updated At')}: {formatTicketTime(ticket.updated_at)}
        </Text>
        {ticket.closed_at > 0 && (
          <Text type='tertiary'>
            {t('Closed At')}: {formatTicketTime(ticket.closed_at)}
          </Text>
        )}
      </div>

      <div
        className={`classic-ticket-detail-grid ${hasUserContext ? '' : 'classic-ticket-detail-grid--single'}`}
      >
        <main className='classic-ticket-detail-main'>
          <section className='classic-ticket-panel'>
            <div className='classic-ticket-panel-header'>
              <Text strong>{t('Description')}</Text>
            </div>
            <p className='classic-ticket-description'>{ticket.description}</p>
            <TicketAttachmentList
              urls={parseTicketAttachmentUrls(ticket.attachment_urls)}
            />
          </section>

          <section className='classic-ticket-panel'>
            <div className='classic-ticket-panel-header'>
              <Space spacing={8}>
                <MessageSquare size={16} />
                <Text strong>{t('Messages')}</Text>
              </Space>
              <Text type='tertiary'>{messages.length}</Text>
            </div>

            <div className='classic-ticket-messages'>
              {messages.length === 0 ? (
                <div className='classic-ticket-message-empty'>
                  <MessageSquare size={20} />
                  <Text type='tertiary'>{t('No messages yet')}</Text>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`classic-ticket-message-row ${msg.is_admin ? 'classic-ticket-message-row--admin' : 'classic-ticket-message-row--user'}`}
                  >
                    <div
                      className={`classic-ticket-message ${msg.is_admin ? 'classic-ticket-message--admin' : 'classic-ticket-message--user'}`}
                    >
                      <div className='classic-ticket-message-meta'>
                        <span>{msg.is_admin ? t('Admin') : t('User')}</span>
                        <span>{formatTicketTime(msg.created_at)}</span>
                      </div>
                      <p>{msg.content}</p>
                      <TicketAttachmentList
                        urls={parseTicketAttachmentUrls(msg.attachment_urls)}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {closed ? (
            <div className='classic-ticket-closed-notice'>
              <CheckCircle2 size={18} />
              <Text>{t('This ticket is closed')}</Text>
            </div>
          ) : (
            <div className='classic-ticket-reply-form'>
              <TextArea
                value={replyContent}
                onChange={setReplyContent}
                placeholder={t('Type your reply')}
                rows={3}
              />
              <TicketAttachmentUploader
                value={replyAttachments}
                onChange={setReplyAttachments}
                disabled={sending}
              />
              <Button
                theme='solid'
                icon={<Send size={15} />}
                loading={sending}
                onClick={handleReply}
              >
                {t('Reply')}
              </Button>
            </div>
          )}
        </main>

        {hasUserContext && (
          <aside className='classic-ticket-panel classic-ticket-user-panel'>
            <div className='classic-ticket-panel-header'>
              <Space spacing={8}>
                <UserRound size={16} />
                <Text strong>{t('User Info')}</Text>
              </Space>
            </div>
            <div className='classic-ticket-user-grid'>
              <div>
                <Text type='tertiary'>{t('Username')}</Text>
                <strong>{userContext.username || '-'}</strong>
              </div>
              <div>
                <Text type='tertiary'>{t('Email')}</Text>
                <strong>{userContext.email || '-'}</strong>
              </div>
              <div>
                <Text type='tertiary'>{t('Balance')}</Text>
                <strong>{userContext.quota ?? '-'}</strong>
              </div>
              <div>
                <Text type='tertiary'>{t('Used Quota')}</Text>
                <strong>{userContext.used_quota ?? '-'}</strong>
              </div>
              <div>
                <Text type='tertiary'>{t('User Status')}</Text>
                <strong>{userContext.status ?? '-'}</strong>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

export default TicketDetail;
