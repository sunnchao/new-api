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
import React, { useRef, useState } from 'react';
import { Button, Typography } from '@douyinfe/semi-ui';
import { ImagePlus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { API, showError } from '../../helpers';
import {
  MAX_TICKET_ATTACHMENT_COUNT,
  resolveTicketAttachmentUrl,
} from './utils';

const { Text } = Typography;

export function TicketAttachmentList({ urls = [], onRemove }) {
  const { t } = useTranslation();
  if (!urls.length) return null;

  return (
    <div className='classic-ticket-attachment-grid'>
      {urls.map((url) => (
        <div key={url} className='classic-ticket-attachment-item'>
          <a
            href={resolveTicketAttachmentUrl(url)}
            target='_blank'
            rel='noreferrer'
            title={t('Open attachment')}
          >
            <img
              src={resolveTicketAttachmentUrl(url)}
              alt={t('Attachment image')}
              loading='lazy'
            />
          </a>
          {onRemove && (
            <button
              type='button'
              className='classic-ticket-attachment-remove'
              title={t('Remove attachment')}
              onClick={() => onRemove(url)}
            >
              <X size={13} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export function TicketAttachmentUploader({ value = [], onChange, disabled }) {
  const { t } = useTranslation();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const removeUrl = (url) => {
    onChange(value.filter((item) => item !== url));
  };

  const uploadFiles = async (files) => {
    const remaining = MAX_TICKET_ATTACHMENT_COUNT - value.length;
    if (remaining <= 0) {
      showError(t('You can upload up to 6 images'));
      return;
    }

    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith('image/'),
    );
    if (imageFiles.length !== files.length) {
      showError(t('Only image files are supported'));
    }
    if (!imageFiles.length) return;

    const selectedFiles = imageFiles.slice(0, remaining);
    if (imageFiles.length > remaining) {
      showError(t('You can upload up to 6 images'));
    }

    setUploading(true);
    const uploadedUrls = [];
    try {
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await API.post('/api/ticket/attachments', formData, {
          skipErrorHandler: true,
        });
        if (res.data.success && res.data.data?.url) {
          uploadedUrls.push(res.data.data.url);
        } else {
          showError(res.data.message || t('Attachment upload failed'));
        }
      }
      if (uploadedUrls.length) {
        onChange([...value, ...uploadedUrls]);
      }
    } catch (e) {
      showError(e.response?.data?.message || e.message);
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  return (
    <div className='classic-ticket-attachment-uploader'>
      <input
        ref={inputRef}
        type='file'
        accept='image/*'
        multiple
        className='classic-ticket-attachment-input'
        onChange={(event) => uploadFiles(event.target.files || [])}
      />
      <div className='classic-ticket-attachment-uploader-row'>
        <Button
          type='tertiary'
          icon={<ImagePlus size={15} />}
          loading={uploading}
          disabled={
            disabled || uploading || value.length >= MAX_TICKET_ATTACHMENT_COUNT
          }
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? t('Uploading image') : t('Upload images')}
        </Button>
        <Text type='tertiary' size='small'>
          {t('Only image files are supported')} · {value.length}/
          {MAX_TICKET_ATTACHMENT_COUNT}
        </Text>
      </div>
      <TicketAttachmentList
        urls={value}
        onRemove={disabled ? null : removeUrl}
      />
    </div>
  );
}
