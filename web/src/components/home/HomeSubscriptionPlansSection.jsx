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
import { Button, Card, Spin, Tag, Typography } from '@douyinfe/semi-ui';
import { Link } from 'react-router-dom';
import { API } from '../../helpers';
import { convertUSDToCurrency } from '../../helpers/render';
import {
  filterHomepageSubscriptionPlans,
  isRequestBasedSubscription,
} from '../../helpers/subscriptionFormat';
import { useTranslation } from 'react-i18next';
import HomeSubscriptionPlanMetrics from './HomeSubscriptionPlanMetrics';

const { Text } = Typography;

const HomeSubscriptionPlansSection = () => {
  const { t } = useTranslation();
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
{plans.map(({ plan }) => {
            const isRequestBilling = isRequestBasedSubscription(plan);
            const accentClass = isRequestBilling
              ? 'from-emerald-500/12 via-white to-teal-500/10 dark:from-emerald-900/20 dark:via-slate-900 dark:to-teal-900/20'
              : 'from-sky-500/12 via-white to-indigo-500/10 dark:from-sky-900/20 dark:via-slate-900 dark:to-indigo-900/20';

            return (
              <Card
                key={plan?.id}
                shadows='hover'
                className='!rounded-3xl h-full border border-semi-color-border overflow-hidden relative'
                bodyStyle={{
                  padding: 28,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
                style={{
                  background:
                    'var(--semi-color-bg-0)',
                }}
              >
                <div
                  className={`absolute inset-0 pointer-events-none bg-gradient-to-br ${accentClass}`}
                />
                <div className='relative z-10 flex flex-col h-full'>
                  <div className='flex items-start justify-between gap-3 mb-6'>
                    <div>
                      <Text strong className='!text-xl !text-semi-color-text-0'>
                        {plan?.title || t('订阅套餐')}
                      </Text>
                      {plan?.subtitle ? (
                        <Text
                          type='tertiary'
                          className='!block mt-2 !text-sm leading-6'
                        >
                          {plan.subtitle}
                        </Text>
                      ) : null}
                    </div>
                    <Tag
                      color={isRequestBilling ? 'teal' : 'blue'}
                      shape='circle'
                    >
                      {isRequestBilling ? t('按次计费') : t('按量计费')}
                    </Tag>
                  </div>

                  <div className='mb-6'>
                    <div className='text-sm text-semi-color-text-2 mb-2'>
                      {t('实付金额')}
                    </div>
                    <div className='text-3xl font-bold text-semi-color-text-0'>
                      {convertUSDToCurrency(Number(plan?.price_amount || 0), 2)}
                    </div>
                  </div>

                  <HomeSubscriptionPlanMetrics plan={plan} t={t} />

                  <div className='mt-auto'>
                    <Link to='/console/subscriptions' className='block'>
                      <Button
                        theme='solid'
                        type='primary'
                        className='w-full !rounded-2xl'
                      >
                        {t('查看详情')}
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HomeSubscriptionPlansSection;
