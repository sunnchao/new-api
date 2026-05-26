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

import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Button, Skeleton, Typography } from '@douyinfe/semi-ui';
import { CreditCard, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { API } from '../../helpers';
import { convertUSDToCurrency } from '../../helpers/render';
import { UserContext } from '../../context/User';
import { PublicSubscriptionPlanCard } from '../../components/subscriptions/PublicSubscriptionPlanCard';
import './i18n';
import './index.css';

const { Title, Text } = Typography;

function LoadingSkeleton() {
  return (
    <div className='classic-plans-grid'>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className='classic-plans-skeleton-card'>
          <Skeleton.Title active style={{ width: '60%', height: 24 }} />
          <Skeleton.Paragraph active rows={1} style={{ marginBottom: 8 }} />
          <Skeleton.Title active style={{ width: '40%', height: 32 }} />
          <Skeleton.Paragraph active rows={3} />
          <Skeleton.Button active block style={{ height: 32, marginTop: 8 }} />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon, title, description, children }) {
  return (
    <div className='classic-plans-empty'>
      <div className='classic-plans-empty-icon'>
        <Icon size={24} />
      </div>
      <Title heading={5} type='tertiary' style={{ margin: 0 }}>
        {title}
      </Title>
      {description && (
        <Text type='tertiary' size='small' className='classic-plans-empty-text'>
          {description}
        </Text>
      )}
      {children && <div className='classic-plans-empty-action'>{children}</div>}
    </div>
  );
}

const SubscriptionPlansPage = () => {
  const { t } = useTranslation();
  const [userState] = useContext(UserContext);
  const isAuthenticated = !!userState?.user;

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [fetching, setFetching] = useState(false);

  const planStats = useMemo(() => {
    const enabledPlans = plans.map((item) => item?.plan).filter(Boolean);
    const prices = enabledPlans
      .map((plan) => Number(plan?.price_amount || 0))
      .filter((price) => Number.isFinite(price))
      .sort((a, b) => a - b);
    const billingModes = [
      ...new Set(
        enabledPlans.map((plan) =>
          plan?.billing_mode === 'request' ? t('按次计费') : t('按量计费'),
        ),
      ),
    ];

    return [
      {
        label: t('可用套餐'),
        value: loading ? '--' : enabledPlans.length,
      },
      {
        label: t('起步价格'),
        value: prices.length > 0 ? convertUSDToCurrency(prices[0], 2) : '--',
      },
      {
        label: t('计费模式'),
        value: billingModes.length > 0 ? billingModes.join(' / ') : '--',
      },
    ];
  }, [loading, plans, t]);

  const fetchPlans = async () => {
    setFetching(true);
    setError(false);
    try {
      const res = await API.get('/api/subscription/public/plans');
      if (res?.data?.success) {
        const data = res.data.data || [];
        setPlans(data.filter((item) => item?.plan));
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setFetching(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  return (
    <div className='classic-plans-page'>
      <main className='classic-plans-shell'>
        <section className='classic-plans-board'>
          {loading ? (
            <LoadingSkeleton />
          ) : error ? (
            <EmptyState
              icon={RefreshCw}
              title={t('无法加载订阅套餐')}
              description={t('请刷新页面重试。')}
            >
              <Button
                theme='outline'
                type='primary'
                icon={<RefreshCw size={14} />}
                onClick={() => {
                  setLoading(true);
                  fetchPlans();
                }}
              >
                {t('重新加载')}
              </Button>
            </EmptyState>
          ) : plans.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title={t('暂无可用订阅套餐')}
              description={t('目前没有已启用的订阅套餐。')}
            />
          ) : (
            <>
              <div className='classic-plans-toolbar'>
                <div>
                  <Text strong>{t('可用套餐')}</Text>
                  <Text type='tertiary' className='classic-plans-count'>
                    {t('共 {{count}} 个套餐', { count: plans.length })}
                  </Text>
                </div>
                <Button
                  theme='borderless'
                  type='tertiary'
                  size='small'
                  icon={
                    <RefreshCw
                      size={13}
                      className={fetching ? 'classic-plans-spin' : ''}
                    />
                  }
                  disabled={fetching}
                  onClick={fetchPlans}
                >
                  {t('刷新')}
                </Button>
              </div>
              <div className='classic-plans-grid'>
                {plans.map((record, index) => (
                  <PublicSubscriptionPlanCard
                    key={record.plan.id}
                    record={record}
                    isAuthenticated={isAuthenticated}
                    featured={index === 0 && plans.length > 1}
                  />
                ))}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
};

export default SubscriptionPlansPage;
