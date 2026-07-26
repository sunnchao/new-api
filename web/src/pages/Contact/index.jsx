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

import React, { useMemo, useState } from 'react';
import { Button, Modal, Typography } from '@douyinfe/semi-ui';
import {
  IconCopy,
  IconLink,
  IconMail,
  IconQrCode,
  IconSend,
  IconUserGroup,
} from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';
import { copy, showSuccess } from '../../helpers';
import qqGroupQrCode from '../../assets/qq-group-qrcode.jpg';
import './i18n';
import './index.css';

const { Title, Text } = Typography;

const Contact = () => {
  const { t } = useTranslation();
  const [qrVisible, setQrVisible] = useState(false);

  const contactMethods = useMemo(
    () => [
      {
        key: 'email',
        title: t('邮件支持'),
        description: t('发送邮件联系我们，通常在24小时内回复'),
        label: t('邮箱地址'),
        value: 'chirou.api@outlook.com',
        href: 'mailto:chirou.api@outlook.com',
        icon: IconMail,
        copyLabel: t('复制邮箱'),
        actionLabel: t('发送邮件'),
        accent: '#2f7cf6',
        softAccent: 'rgba(47, 124, 246, 0.12)',
      },
      {
        key: 'qq',
        title: t('QQ 交流群'),
        description: t('加入用户交流群，获取最新资讯'),
        label: t('群号'),
        value: '924076327',
        icon: IconUserGroup,
        copyLabel: t('复制群号'),
        actionLabel: t('查看二维码'),
        accent: '#10a37f',
        softAccent: 'rgba(16, 163, 127, 0.12)',
      },
    ],
    [t],
  );

  const handleCopy = async (value) => {
    const ok = await copy(value);
    if (ok) {
      showSuccess(t('复制成功'));
    }
  };

  return (
    <div className='classic-contact-page'>
      <main className='classic-contact-shell'>
        <section className='classic-contact-layout'>
          <div className='classic-contact-primary'>
            <div className='classic-contact-hero'>
              <div className='classic-contact-eyebrow'>
                <IconSend size='small' />
                <span>{t('联系我们')}</span>
              </div>

              <div className='classic-contact-heading'>
               
                <Text className='classic-contact-lead'>
                  {t(
                    '账户、套餐、接入或使用问题，都可以通过这些渠道直接联系团队。',
                  )}
                </Text>
              </div>

              <div className='classic-contact-note'>
                {t(
                  '推荐先通过邮件描述问题并附上账户信息，复杂问题会更快定位。',
                )}
              </div>
            </div>

            <section
              className='classic-contact-methods'
              aria-label={t('直达支持')}
            >
              {contactMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <article
                    key={method.key}
                    className='classic-contact-method'
                    style={{
                      '--contact-accent': method.accent,
                      '--contact-accent-soft': method.softAccent,
                    }}
                  >
                    <div className='classic-contact-icon'>
                      <Icon size='large' />
                    </div>

                    <div className='classic-contact-method-content'>
                      <div>
                        <Title heading={4} style={{ margin: 0 }}>
                          {method.title}
                        </Title>
                        <Text type='tertiary' className='classic-contact-muted'>
                          {method.description}
                        </Text>
                      </div>

                      <div className='classic-contact-value-row'>
                        <span className='classic-contact-value-label'>
                          {method.label}
                        </span>
                        {method.href ? (
                          <a
                            href={method.href}
                            className='classic-contact-value'
                          >
                            {method.value}
                          </a>
                        ) : (
                          <span className='classic-contact-value'>
                            {method.value}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className='classic-contact-actions'>
                      {method.key === 'qq' ? (
                        <>
                          <Button
                            icon={<IconQrCode />}
                            theme='borderless'
                            type='tertiary'
                            aria-label={method.actionLabel}
                            onClick={() => setQrVisible(true)}
                          />
                          <Button
                            icon={<IconLink />}
                            theme='borderless'
                            type='tertiary'
                            aria-label={t('一键加群')}
                            onClick={() => window.open('https://qm.qq.com/q/GJeiqkSsQA', '_blank', 'noopener,noreferrer')}
                          />
                        </>
                      ) : (
                        <Button
                          theme='solid'
                          type='primary'
                          size='small'
                          onClick={() => {
                            window.location.href = method.href;
                          }}
                        >
                          {method.actionLabel}
                        </Button>
                      )}
                      <Button
                        icon={<IconCopy />}
                        theme='borderless'
                        type='tertiary'
                        aria-label={method.copyLabel}
                        onClick={() => handleCopy(method.value)}
                      />
                    </div>
                  </article>
                );
              })}
            </section>
          </div>

          <aside className='classic-contact-qr-panel'>
            <div className='classic-contact-qr-copy'>
              <Text className='classic-contact-kicker'>{t('QQ 交流群')}</Text>
              <Title heading={3} style={{ margin: '6px 0 0' }}>
                {t('扫码加入 QQ 交流群')}
              </Title>
              <Text type='tertiary' className='classic-contact-muted'>
                {t('扫码加入群聊，或复制群号手动搜索。')}
              </Text>
              <a
                href='https://qm.qq.com/q/GJeiqkSsQA'
                target='_blank'
                rel='noopener noreferrer'
                className='classic-contact-quick-join'
              >
                <IconLink size='small' />
                <span>{t('一键加群')}</span>
              </a>
            </div>

            <button
              type='button'
              className='classic-contact-qr-frame'
              onClick={() => setQrVisible(true)}
              aria-label={t('查看二维码')}
            >
              <img
                src={qqGroupQrCode}
                alt={t('QQ 交流群二维码')}
                className='classic-contact-qr-image'
              />
            </button>

            <div className='classic-contact-qr-actions'>
              <span className='classic-contact-qr-number'>
                {contactMethods[1].value}
              </span>
              <Button
                icon={<IconCopy />}
                theme='borderless'
                type='tertiary'
                aria-label={t('复制群号')}
                onClick={() => handleCopy(contactMethods[1].value)}
              />
              <Button
                icon={<IconQrCode />}
                theme='borderless'
                type='tertiary'
                aria-label={t('查看二维码')}
                onClick={() => setQrVisible(true)}
              />
            </div>
          </aside>
        </section>
      </main>

      <Modal
        visible={qrVisible}
        title={t('QQ 交流群二维码')}
        footer={null}
        onCancel={() => setQrVisible(false)}
        centered
      >
        <div className='classic-contact-modal-body'>
          <img
            src={qqGroupQrCode}
            alt={t('QQ 交流群二维码')}
            className='classic-contact-modal-qr'
          />
          <Text type='tertiary' className='classic-contact-modal-number'>
            {contactMethods[1].value}
          </Text>
          <a
            href='https://qm.qq.com/q/GJeiqkSsQA'
            target='_blank'
            rel='noopener noreferrer'
            className='classic-contact-quick-join'
          >
            <IconLink size='small' />
            <span>{t('一键加群')}</span>
          </a>
        </div>
      </Modal>
    </div>
  );
};

export default Contact;
