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
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dropdown, Button, Tag, Space } from '@douyinfe/semi-ui';
import { API } from '../../helpers';

const PackagesMenu = () => {
  const { t } = useTranslation();
  const [subscriptions, setSubscriptions] = useState([]);

  useEffect(() => {
    const load = async () => {
      const res = await API.get('/api/user/packages/subscriptions');
      if (res?.data?.success) {
        setSubscriptions(res.data.data || []);
      }
    };
    load();
  }, []);

  const menuItems = subscriptions.length
    ? subscriptions.map((sub) => ({
        name: sub.package_plan?.type || sub.plan_type,
        onClick: () => {
          window.location.href = '/console/subscriptions';
        },
      }))
    : [
        {
          name: t('packages.menu.noPlan'),
          disabled: true,
        },
      ];

  return (
    <Dropdown
      trigger='click'
      position='bottomLeft'
      menu={menuItems}
      render={
        <Button type='tertiary'>
          <Space>
            {t('packages.menu.title')}
            {subscriptions.length > 0 && <Tag color='green'>{subscriptions.length}</Tag>}
          </Space>
        </Button>
      }
    />
  );
};

export default PackagesMenu;
