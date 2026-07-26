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

import React, { useContext, useEffect, useState } from 'react';
import { Spin } from '@douyinfe/semi-ui';
import { API } from '../../helpers';
import { filterHomepageSubscriptionPlans } from '../../helpers/subscriptionFormat';
import { useTranslation } from 'react-i18next';
import { PublicSubscriptionPlanCard } from '../subscriptions/PublicSubscriptionPlanCard';
import { UserContext } from '../../context/User';

const HomeSubscriptionPlansSection = () => {
  const { t } = useTranslation();
  const [userState] = useContext(UserContext);
  const isAuthenticated = !!userState?.user;
  const [plans, setPlans] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    API.get('/api/subscription/home/plans')
      .then((res) => {
        if (!mounted) return;
        if (res.data?.success) {
          setPlans(filterHomepageSubscriptionPlans(res.data?.data || []));
        } else {
          setPlans([]);
        }
      })
      .catch(() => {
        if (mounted) {
          setPlans([]);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoaded(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (!loaded) {
    return (
      <div className='w-full py-16 md:py-20 lg:py-24 px-4 md:px-8'>
        <div className='max-w-7xl mx-auto flex justify-center'>
          <Spin size='large' />
        </div>
      </div>
    );
  }

  if (plans.length === 0) {
    return null;
  }

  return (
    <div className='w-full py-16 md:py-20 lg:py-24 px-4 md:px-8'>
      <div className='max-w-7xl mx-auto'>
        <div className='text-center mb-12 md:mb-16'>
          <div className='inline-block px-4 py-2 rounded-full bg-semi-color-fill-1 border border-semi-color-border text-sm text-semi-color-text-2 mb-4'>
            {t('订阅推荐')}
          </div>
          <h2 className='text-3xl md:text-4xl lg:text-5xl font-bold text-semi-color-text-0 mb-4'>
            {t('订阅套餐')}
          </h2>
          <p className='text-base md:text-lg text-semi-color-text-2 max-w-2xl mx-auto'>
            {t('按你的使用场景选择套餐，权益与价格一目了然')}
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8'>
          {plans.map((record, index) => (
            <PublicSubscriptionPlanCard
              key={record?.plan?.id}
              record={record}
              isAuthenticated={isAuthenticated}
              featured={index === 0 && plans.length > 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeSubscriptionPlansSection;
