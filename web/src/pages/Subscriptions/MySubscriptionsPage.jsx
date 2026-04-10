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

import React from 'react';
import { Banner } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import SubscriptionPlansCard from '../../components/topup/SubscriptionPlansCard';
import useSubscriptionCenterData from '../../hooks/subscription/useSubscriptionCenterData';

const MySubscriptionsPage = () => {
  const { t } = useTranslation();
  const {
    loading,
    error,
    plans,
    payMethods,
    enableOnlineTopUp,
    enableStripeTopUp,
    enableCreemTopUp,
    billingPreference,
    activeSubscriptions,
    allSubscriptions,
    reloadSubscriptionSelf,
    reloadUserQuota,
    updateBillingPreference,
  } = useSubscriptionCenterData();

  return (
    <div className='w-full mx-auto relative min-h-screen lg:min-h-0 mt-[60px] px-2'>
      <div className='flex flex-col gap-4'>
        {error ? (
          <Banner type='warning' description={error} closeIcon={null} />
        ) : null}
        <SubscriptionPlansCard
          t={t}
          loading={loading}
          plans={plans}
          payMethods={payMethods}
          enableOnlineTopUp={enableOnlineTopUp}
          enableStripeTopUp={enableStripeTopUp}
          enableCreemTopUp={enableCreemTopUp}
          billingPreference={billingPreference}
          onChangeBillingPreference={updateBillingPreference}
          activeSubscriptions={activeSubscriptions}
          allSubscriptions={allSubscriptions}
          reloadSubscriptionSelf={reloadSubscriptionSelf}
          reloadUserQuota={reloadUserQuota}
        />
      </div>
    </div>
  );
};

export default MySubscriptionsPage;
