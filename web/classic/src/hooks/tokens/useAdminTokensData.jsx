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

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { API, showError, showSuccess } from '../../helpers';
import { ITEMS_PER_PAGE } from '../../constants';
import { useTableCompactMode } from '../common/useTableCompactMode';

export const useAdminTokensData = () => {
  const { t } = useTranslation();

  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState(1);
  const [tokenCount, setTokenCount] = useState(0);
  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);
  const [searching, setSearching] = useState(false);
  const [searchMode, setSearchMode] = useState(false);

  const [selectedRows, setSelectedRows] = useState([]);

  const [showEdit, setShowEdit] = useState(false);
  const [editingToken, setEditingToken] = useState({
    id: undefined,
  });

  const [compactMode, setCompactMode] = useTableCompactMode('adminTokens');

  const [formApi, setFormApi] = useState(null);
  const formInitValues = {
    searchKeyword: '',
    searchToken: '',
  };

  const getFormValues = () => {
    const formValues = formApi ? formApi.getValues() : {};
    return {
      searchKeyword: formValues.searchKeyword || '',
      searchToken: formValues.searchToken || '',
    };
  };

  const closeEdit = () => {
    setShowEdit(false);
    setTimeout(() => {
      setEditingToken({
        id: undefined,
      });
    }, 500);
  };

  const syncPageData = (payload, fallbackSize = pageSize) => {
    setTokens(payload?.items || []);
    setTokenCount(payload?.total || 0);
    setActivePage(payload?.page || 1);
    setPageSize(payload?.page_size || fallbackSize);
  };

  const loadTokens = async (page = 1, size = pageSize) => {
    setLoading(true);
    setSearchMode(false);
    try {
      const res = await API.get(`/api/admin/token/list?p=${page}&size=${size}`);
      const { success, message, data } = res.data || {};
      if (success) {
        syncPageData(data, size);
      } else {
        showError(message || t('加载令牌失败'));
      }
    } catch (error) {
      showError(error?.message || t('加载令牌失败'));
    } finally {
      setLoading(false);
    }
  };

  const searchTokens = async (page = 1, size = pageSize) => {
    const normalizedPage = Number.isInteger(page) && page > 0 ? page : 1;
    const normalizedSize =
      Number.isInteger(size) && size > 0 ? size : pageSize;
    const { searchKeyword, searchToken } = getFormValues();

    if (searchKeyword === '' && searchToken === '') {
      setSearchMode(false);
      await loadTokens(1, normalizedSize);
      return;
    }

    setSearching(true);
    try {
      const res = await API.get(
        `/api/admin/token/search?keyword=${encodeURIComponent(searchKeyword)}&token=${encodeURIComponent(searchToken)}&p=${normalizedPage}&size=${normalizedSize}`,
      );
      const { success, message, data } = res.data || {};
      if (success) {
        setSearchMode(true);
        syncPageData(data, normalizedSize);
      } else {
        showError(message || t('搜索令牌失败'));
      }
    } catch (error) {
      showError(error?.message || t('搜索令牌失败'));
    } finally {
      setSearching(false);
    }
  };

  const refresh = async (page = activePage) => {
    const { searchKeyword, searchToken } = getFormValues();
    if (searchMode && (searchKeyword !== '' || searchToken !== '')) {
      await searchTokens(page, pageSize);
    } else {
      await loadTokens(page, pageSize);
    }
    setSelectedRows([]);
  };

  const manageToken = async (id, action) => {
    setLoading(true);
    try {
      let res;
      if (action === 'delete') {
        res = await API.delete(`/api/admin/token/${id}`);
      } else {
        res = await API.put('/api/admin/token?status_only=true', {
          id,
          status: action === 'enable' ? 1 : 2,
        });
      }

      const { success, message, data } = res.data || {};
      if (!success) {
        showError(message || t('操作失败'));
        return false;
      }

      showSuccess(t('操作成功完成！'));

      if (action === 'delete') {
        setTokens((prev) => prev.filter((token) => token.id !== id));
        setTokenCount((prev) => Math.max(prev - 1, 0));
      } else if (data) {
        setTokens((prev) =>
          prev.map((token) =>
            token.id === id ? { ...token, status: data.status } : token,
          ),
        );
      }

      return true;
    } catch (error) {
      showError(error?.message || t('操作失败'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    if (searchMode) {
      searchTokens(page, pageSize).then();
    } else {
      loadTokens(page, pageSize).then();
    }
  };

  const handlePageSizeChange = async (size) => {
    setPageSize(size);
    if (searchMode) {
      await searchTokens(1, size);
    } else {
      await loadTokens(1, size);
    }
  };

  const rowSelection = {
    onSelect: () => {},
    onSelectAll: () => {},
    onChange: (selectedRowKeys, selectedRows) => {
      setSelectedRows(selectedRows);
    },
  };

  const handleRow = (record) => {
    if (record.status !== 1) {
      return {
        style: {
          background: 'var(--semi-color-disabled-border)',
        },
      };
    }
    return {};
  };

  const batchDeleteTokens = async () => {
    if (selectedRows.length === 0) {
      showError(t('请先选择要删除的令牌！'));
      return false;
    }

    setLoading(true);
    try {
      const ids = selectedRows.map((token) => token.id);
      const res = await API.post('/api/admin/token/batch', { ids });
      if (res?.data?.success) {
        const count = res.data.data || 0;
        showSuccess(t('已删除 {{count}} 个令牌！', { count }));
        const nextPage = tokens.length === selectedRows.length && activePage > 1
          ? activePage - 1
          : activePage;
        await refresh(nextPage);
        return true;
      }

      showError(res?.data?.message || t('删除失败'));
      return false;
    } catch (error) {
      showError(error?.message || t('删除失败'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTokens(1, pageSize).then();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    tokens,
    loading,
    activePage,
    tokenCount,
    pageSize,
    searching,

    selectedKeys: selectedRows,
    setSelectedKeys: setSelectedRows,

    showEdit,
    setShowEdit,
    editingToken,
    setEditingToken,
    closeEdit,

    compactMode,
    setCompactMode,

    formApi,
    setFormApi,
    formInitValues,
    getFormValues,

    loadTokens,
    refresh,
    manageToken,
    searchTokens,
    handlePageChange,
    handlePageSizeChange,
    rowSelection,
    handleRow,
    batchDeleteTokens,
    syncPageData,

    t,
  };
};
