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

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AutoComplete } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import { API, showError } from '../../../../helpers';

const buildOwnerLabel = (userId, userName) => {
  const normalizedId = userId ?? '-';
  const normalizedName = userName || '-';
  return `${normalizedName} (ID: ${normalizedId})`;
};

const buildOwnerOption = (user) => ({
  label: buildOwnerLabel(user?.id, user?.username),
  value: String(user?.id),
  username: user?.username || '',
});

const AdminTokenOwnerSelect = ({
  value,
  ownerName,
  onChange,
  readOnly = false,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState([]);
  const timerRef = useRef(null);

  // Display value: in edit mode show label, in create mode show the raw input
  const [inputValue, setInputValue] = useState('');

  // Sync input value when value/ownerName change externally
  useEffect(() => {
    if (value != null) {
      setInputValue(ownerName ? buildOwnerLabel(value, ownerName) : String(value));
    } else {
      setInputValue('');
    }
  }, [value, ownerName]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const searchUsers = async (keyword) => {
    const normalizedKeyword = (keyword || '').trim();
    if (normalizedKeyword === '') {
      setOptions([]);
      return;
    }

    setLoading(true);
    try {
      const res = await API.get(
        `/api/user/search?keyword=${encodeURIComponent(normalizedKeyword)}&group=&p=1&page_size=20`,
      );
      const { success, message, data } = res.data || {};
      if (!success) {
        showError(message || t('搜索用户失败'));
        return;
      }

      const remoteOptions = (data?.items || [])
        .filter((user) => user?.id)
        .map(buildOwnerOption);

      setOptions(remoteOptions);
    } catch (error) {
      showError(error?.message || t('搜索用户失败'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (keyword) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      searchUsers(keyword).then();
    }, 250);
  };

  const handleSelect = (selectedValue) => {
    const matched = options.find((item) => item.value === selectedValue) || null;
    if (matched) {
      const parsedId = parseInt(matched.value, 10);
      onChange?.(parsedId, { value: parsedId, username: matched.username });
    }
  };

  const handleChange = (value) => {
    setInputValue(value);
    // Try to parse as user ID directly
    const parsed = parseInt(value, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      onChange?.(parsed, { value: parsed, username: '' });
    } else {
      onChange?.(undefined, null);
    }
  };

  // Read-only mode: show plain text
  if (readOnly) {
    const displayText = value != null
      ? buildOwnerLabel(value, ownerName)
      : t('暂无数据');
    return (
      <div
        className='w-full px-3 py-1.5 rounded border border-gray-200 bg-gray-50 text-gray-700 text-sm leading-6'
        style={{ minHeight: 32 }}
      >
        {displayText}
      </div>
    );
  }

  // Create mode: AutoComplete with free text + search suggestions
  return (
    <AutoComplete
      value={inputValue}
      data={options}
      onSearch={handleSearch}
      onSelect={handleSelect}
      onChange={handleChange}
      loading={loading}
      placeholder={t('输入用户名搜索或直接输入用户 ID')}
      showClear
      style={{ width: '100%' }}
    />
  );
};

export default AdminTokenOwnerSelect;
