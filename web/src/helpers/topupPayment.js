const DEFAULT_PAYMENT_COLOR = 'rgba(var(--semi-primary-5), 1)';

const PAYMENT_COLORS = {
  alipay: 'rgba(var(--semi-blue-5), 1)',
  wxpay: 'rgba(var(--semi-green-5), 1)',
  stripe: 'rgba(var(--semi-purple-5), 1)',
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export function normalizeTopupPayMethods(rawPayMethods, options = {}) {
  let payMethods = rawPayMethods || [];

  if (typeof payMethods === 'string') {
    try {
      payMethods = JSON.parse(payMethods);
    } catch {
      payMethods = [];
    }
  }

  if (!Array.isArray(payMethods)) {
    return [];
  }

  const stripeMinTopup = toNumber(options.stripeMinTopup, 0);

  return payMethods
    .filter((method) => method?.name && method?.type)
    .map((method) => {
      const normalizedMinTopup = toNumber(method.min_topup, 0);
      const shouldUseStripeMin =
        method.type === 'stripe' &&
        normalizedMinTopup <= 0 &&
        stripeMinTopup > 0;

      return {
        ...method,
        min_topup: shouldUseStripeMin ? stripeMinTopup : normalizedMinTopup,
        color:
          method.color || PAYMENT_COLORS[method.type] || DEFAULT_PAYMENT_COLOR,
      };
    });
}

export function parseCreemProducts(rawProducts) {
  if (Array.isArray(rawProducts)) {
    return rawProducts;
  }

  if (typeof rawProducts !== 'string' || rawProducts.length === 0) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawProducts);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function buildPresetAmounts(
  amountOptions,
  discountMap,
  minTopUpValue,
  options = {},
) {
  if (Array.isArray(amountOptions) && amountOptions.length > 0) {
    return amountOptions.map((amount) => ({
      value: amount,
      discount: discountMap?.[amount] || 1,
    }));
  }

  if (typeof options.generatePresetAmounts === 'function') {
    return options.generatePresetAmounts(minTopUpValue);
  }

  return [];
}

export function normalizeTopupPaymentConfig(data = {}, options = {}) {
  const enableOnlineTopUp = Boolean(data.enable_online_topup);
  const enableStripeTopUp = Boolean(data.enable_stripe_topup);
  const enableCreemTopUp = Boolean(data.enable_creem_topup);
  const minTopUpValue = enableOnlineTopUp
    ? toNumber(data.min_topup, 1)
    : enableStripeTopUp
      ? toNumber(data.stripe_min_topup, 1)
      : 1;

  return {
    topupInfo: {
      amount_options: data.amount_options || [],
      discount: data.discount || {},
    },
    payMethods: normalizeTopupPayMethods(data.pay_methods, {
      stripeMinTopup: data.stripe_min_topup,
    }),
    enableOnlineTopUp,
    enableStripeTopUp,
    enableCreemTopUp,
    minTopUpValue,
    creemProducts: parseCreemProducts(data.creem_products),
    presetAmounts: buildPresetAmounts(
      data.amount_options || [],
      data.discount || {},
      minTopUpValue,
      options,
    ),
  };
}
