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

import React, { useState, useEffect } from 'react';
import { useTokenKeys } from '../../hooks/chat/useTokenKeys';
import { Spin, Modal, List, Typography } from '@douyinfe/semi-ui';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchTokens } from '../../helpers/token';
import { renderGroup } from '../../helpers/render';

const ChatPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const { serverAddress, isLoading } = useTokenKeys(id);
  const [tokens, setTokens] = useState([]);
  const [selectedKey, setSelectedKey] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const loadTokens = async () => {
      const fetchedTokens = await fetchTokens();
      fetchedTokens?.reverse()
      setTokens(fetchedTokens);
      if (fetchedTokens.length > 0) {
        setShowModal(true);
      }
    };
    if (!isLoading) {
      loadTokens();
    }
  }, [isLoading]);

  const comLink = (key) => {
    if (!serverAddress || !key) return '';
    let link = '';
    if (id) {
      let chats = localStorage.getItem('chats');
      if (chats) {
        chats = JSON.parse(chats);
        if (Array.isArray(chats) && chats.length > 0) {
          for (let k in chats[id]) {
            link = chats[id][k];
            link = link.replaceAll(
              '{address}',
              encodeURIComponent(serverAddress),
            );
            link = link.replaceAll('{key}', 'sk-' + key);
          }
        }
      }
    }
    return link;
  };

  const handleTokenSelect = (key) => {
    setSelectedKey(key);
    setShowModal(false);
  };

  const iframeSrc = selectedKey ? comLink(selectedKey) : '';

  return (
    <>
      <Modal
        title={t('选择令牌')}
        visible={showModal}
        onCancel={() => setShowModal(false)}
        footer={null}
        width={600}
      >
        <List
          className={'mb-4'}
          dataSource={tokens}
          split={false}
          renderItem={(token) => (
            <List.Item
              style={{
                cursor: 'pointer',
                padding: '16px',
                marginBottom: '8px',
                border: '1px solid var(--semi-color-border)',
                transition: 'all 0.2s',
                backgroundColor: 'var(--semi-color-bg-1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--semi-color-primary)';
                e.currentTarget.style.backgroundColor = 'var(--semi-color-fill-0)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--semi-color-border)';
                e.currentTarget.style.backgroundColor = 'var(--semi-color-bg-1)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              onClick={() => handleTokenSelect(token.key)}
            >
              <div style={{ width: '100%' }} className={'flex '}>
                <Typography.Text strong style={{ fontSize: '14px' }}>
                  {token.name || 'sk-' + token.key.substring(0, 8) + '...'}
                </Typography.Text>
                <div className={'ml-4'}>
                  {t('分组')}：{renderGroup(token.group || '', token.backup_group || '')}
                </div>
              </div>
            </List.Item>
          )}
        />
      </Modal>

      {!isLoading && iframeSrc ? (
        <iframe
          src={iframeSrc}
          style={{
            width: '100%',
            height: 'calc(100vh - 64px)',
            border: 'none',
            marginTop: '64px',
          }}
          title='Token Frame'
          allow='camera;microphone'
        />
      ) : (
        <div className='fixed inset-0 w-screen h-screen flex items-center justify-center bg-white/80 z-[1000] mt-[60px]'>
          <div className='flex flex-col items-center'>
            <Spin size='large' spinning={true} tip={null} />
            <span
              className='whitespace-nowrap mt-2 text-center'
              style={{ color: 'var(--semi-color-primary)' }}
            >
              {t('正在跳转...')}
            </span>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatPage;
