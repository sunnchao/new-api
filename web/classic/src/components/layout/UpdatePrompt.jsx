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

import React, { useCallback, useEffect, useState } from 'react';
import { Button, Modal } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

const versionKey = 'app_manifest_version';
const versionDismissKey = 'app_manifest_version_dismissed';

const UpdatePrompt = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [updateModal, setUpdateModal] = useState({
    visible: false,
    latestVersion: '',
  });

  const checkManifestVersion = useCallback(async () => {
    try {
      const response = await fetch(`/manifest.json?ts=${Date.now()}`, {
        cache: 'no-store',
      });
      if (!response.ok) {
        return;
      }
      const manifest = await response.json();
      const latestVersion = manifest?.version;
      if (!latestVersion) {
        return;
      }
      const localVersion = localStorage.getItem(versionKey);
      const dismissedVersion = sessionStorage.getItem(versionDismissKey);
      if (!localVersion) {
        localStorage.setItem(versionKey, latestVersion);
        return;
      }
      if (localVersion !== latestVersion && dismissedVersion !== latestVersion) {
        setUpdateModal({ visible: true, latestVersion });
      }
    } catch (error) {
      console.warn('Failed to check manifest version', error);
    }
  }, []);

  useEffect(() => {
    checkManifestVersion();
  }, [checkManifestVersion]);

  useEffect(() => {
    if (!location.pathname) {
      return;
    }
    checkManifestVersion();
  }, [location.pathname, checkManifestVersion]);

  useEffect(() => {
    const handleFocus = () => {
      checkManifestVersion();
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkManifestVersion();
      }
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [checkManifestVersion]);

  const handleUpdateNow = () => {
    if (updateModal.latestVersion) {
      localStorage.setItem(versionKey, updateModal.latestVersion);
      sessionStorage.removeItem(versionDismissKey);
    }
    window.location.reload();
  };

  const handleUpdateLater = () => {
    if (updateModal.latestVersion) {
      sessionStorage.setItem(versionDismissKey, updateModal.latestVersion);
    }
    setUpdateModal((prev) => ({ ...prev, visible: false }));
  };

  return (
    <Modal
      title={t('发现新版本')}
      visible={updateModal.visible}
      onCancel={handleUpdateLater}
      footer={
        <div className='flex justify-end gap-2'>
          <Button type='tertiary' onClick={handleUpdateLater}>
            {t('稍后提醒')}
          </Button>
          <Button type='primary' onClick={handleUpdateNow}>
            {t('立即刷新')}
          </Button>
        </div>
      }
    >
      <div className='text-sm text-gray-600'>
        {t('检测到新的版本，请刷新页面以获取最新内容。')}
      </div>
    </Modal>
  );
};

export default UpdatePrompt;
