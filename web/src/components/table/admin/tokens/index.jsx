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

import React, { useState } from 'react';
import { Button } from '@douyinfe/semi-ui';
import { showError } from '../../../../helpers';
import CardPro from '../../../common/ui/CardPro';
import TokensTable from '../../tokens/TokensTable';
import TokensFilters from '../../tokens/TokensFilters';
import TokensDescription from '../../tokens/TokensDescription';
import DeleteTokensModal from '../../tokens/modals/DeleteTokensModal';
import AdminEditTokenModal from './AdminEditTokenModal';
import { useAdminTokensData } from '../../../../hooks/tokens/useAdminTokensData';
import { useIsMobile } from '../../../../hooks/common/useIsMobile';
import { createCardProPagination } from '../../../../helpers/utils';

const AdminTokensPage = () => {
  const tokensData = useAdminTokensData();
  const isMobile = useIsMobile();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDeleteSelectedTokens = () => {
    if (tokensData.selectedKeys.length === 0) {
      showError(tokensData.t('请至少选择一个令牌！'));
      return;
    }
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    const success = await tokensData.batchDeleteTokens();
    if (success) {
      setShowDeleteModal(false);
    }
  };

  return (
    <>
      <AdminEditTokenModal
        refresh={tokensData.refresh}
        editingToken={tokensData.editingToken}
        visiable={tokensData.showEdit}
        handleClose={tokensData.closeEdit}
      />

      <DeleteTokensModal
        visible={showDeleteModal}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        selectedKeys={tokensData.selectedKeys}
        t={tokensData.t}
      />

      <CardPro
        type='type1'
        descriptionArea={
          <TokensDescription
            compactMode={tokensData.compactMode}
            setCompactMode={tokensData.setCompactMode}
            t={tokensData.t}
            title={tokensData.t('令牌管理')}
          />
        }
        actionsArea={
          <div className='flex flex-col md:flex-row justify-between items-center gap-2 w-full'>
            <div className='flex flex-wrap gap-2 w-full md:w-auto order-2 md:order-1'>
              <Button
                type='primary'
                className='flex-1 md:flex-initial'
                size='small'
                onClick={() => {
                  tokensData.setEditingToken({
                    id: undefined,
                    user_id: undefined,
                    user_name: '',
                  });
                  tokensData.setShowEdit(true);
                }}
              >
                {tokensData.t('添加令牌')}
              </Button>

              <Button
                type='danger'
                className='w-full md:w-auto'
                size='small'
                onClick={handleDeleteSelectedTokens}
              >
                {tokensData.t('删除所选令牌')}
              </Button>
            </div>

            <div className='w-full md:w-full lg:w-auto order-1 md:order-2'>
              <TokensFilters
                formInitValues={tokensData.formInitValues}
                setFormApi={tokensData.setFormApi}
                searchTokens={tokensData.searchTokens}
                loading={tokensData.loading}
                searching={tokensData.searching}
                t={tokensData.t}
              />
            </div>
          </div>
        }
        paginationArea={createCardProPagination({
          currentPage: tokensData.activePage,
          pageSize: tokensData.pageSize,
          total: tokensData.tokenCount,
          onPageChange: tokensData.handlePageChange,
          onPageSizeChange: tokensData.handlePageSizeChange,
          isMobile,
          t: tokensData.t,
        })}
        t={tokensData.t}
      >
        <TokensTable
          {...tokensData}
          // Admin list intentionally renders raw backend group values instead of
          // resolving labels from the current admin user's self-group context.
          groupInfoMap={undefined}
          userGroup=''
          showOwnerColumns={true}
          allowTokenKeyActions={false}
          allowChatActions={false}
        />
      </CardPro>
    </>
  );
};

export default AdminTokensPage;
