import React from 'react';
import { Button } from '@douyinfe/semi-ui';
import { SiTelegram } from 'react-icons/si';

const TelegramLoginButton = ({ dataOnauth, botName }) => {
  const handleClick = () => {
    const telegramAuthUrl = `https://oauth.telegram.org/authorize?bot_id=${botName}&request_write_access=1`;

    const width = 550;
    const height = 450;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      telegramAuthUrl,
      'telegram_login',
      `width=${width},height=${height},left=${left},top=${top}`,
    );

    const checkPopup = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(checkPopup);
        return;
      }

      try {
        const url = popup.location.href;
        if (url.startsWith('tg://login') || url.includes('t.me/')) {
          // Telegram OAuth closed without auth
        }

        if (popup.location.hash) {
          const hash = popup.location.hash.substring(1);
          const params = new URLSearchParams(hash);
          const data = {
            id: params.get('id'),
            first_name: params.get('first_name'),
            last_name: params.get('last_name'),
            username: params.get('username'),
            photo_url: params.get('photo_url'),
            auth_date: params.get('auth_date'),
            hash: params.get('hash'),
          };

          if (data.id && data.hash) {
            dataOnauth(data);
            popup.close();
            clearInterval(checkPopup);
          }
        }
      } catch (e) {
        // Cross-origin error, ignore
      }
    }, 500);

    const messageHandler = (event) => {
      if (event.data && event.data.source === 'telegram-login') {
        dataOnauth(event.data);
        popup?.close();
        window.removeEventListener('message', messageHandler);
        clearInterval(checkPopup);
      }
    };

    window.addEventListener('message', messageHandler);

    const closeInterval = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(closeInterval);
        clearInterval(checkPopup);
        window.removeEventListener('message', messageHandler);
      }
    }, 1000);
  };

  return (
    <Button
      theme='outline'
      className='w-full h-12 flex items-center justify-center !rounded-full border border-gray-200 hover:bg-gray-50 transition-colors'
      type='tertiary'
      icon={<SiTelegram size={24} />}
      onClick={handleClick}
    >
      <span className='ml-3'>Login with Telegram</span>
    </Button>
  );
};

export default TelegramLoginButton;
