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

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Banner,
  Button,
  Col,
  Form,
  Row,
  Select,
  Space,
  Spin,
  Typography,
} from '@douyinfe/semi-ui';
import {
  API,
  removeTrailingSlash,
  showError,
  showSuccess,
} from '../../../helpers';
import { useTranslation } from 'react-i18next';
import { BookOpen, Plus } from 'lucide-react';

const { Text } = Typography;

const PANCAKE_DASHBOARD_URL = 'https://pancake.waffo.ai/merchant/dashboard';
const DEFAULT_NEW_STORE_NAME = 'new-api-store';
const DEFAULT_NEW_PRODUCT_NAME = 'new-api-charge-product';
const DEFAULT_NEW_PAIR_NAME = `${DEFAULT_NEW_STORE_NAME} + ${DEFAULT_NEW_PRODUCT_NAME}`;

const defaultInputs = {
  WaffoPancakeMerchantID: '',
  WaffoPancakePrivateKey: '',
  WaffoPancakeReturnURL: '',
  WaffoPancakeUnitPrice: 1,
  WaffoPancakeMinTopUp: 1,
};

const parseNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const isSuccessBody = (body) => body?.message === 'success' || body?.success;

export default function SettingsPaymentGatewayWaffoPancake(props) {
  const { t } = useTranslation();
  const sectionTitle = props.hideSectionTitle
    ? undefined
    : t('Waffo Pancake 设置');
  const [loading, setLoading] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [creatingPair, setCreatingPair] = useState(false);
  const [catalog, setCatalog] = useState([]);
  const [inputs, setInputs] = useState(defaultInputs);
  const [selectedBinding, setSelectedBinding] = useState({
    storeID: '',
    productID: '',
  });
  const [savedBinding, setSavedBinding] = useState({
    storeID: '',
    productID: '',
  });
  const formApiRef = useRef(null);
  const initialMerchantIDRef = useRef('');
  const autoCatalogMerchantRef = useRef('');

  useEffect(() => {
    if (!props.options || !formApiRef.current) return;

    const currentInputs = {
      WaffoPancakeMerchantID: props.options.WaffoPancakeMerchantID || '',
      WaffoPancakePrivateKey: props.options.WaffoPancakePrivateKey || '',
      WaffoPancakeReturnURL: props.options.WaffoPancakeReturnURL || '',
      WaffoPancakeUnitPrice: parseNumber(
        props.options.WaffoPancakeUnitPrice,
        1,
      ),
      WaffoPancakeMinTopUp:
        parseInt(props.options.WaffoPancakeMinTopUp, 10) || 1,
    };
    const binding = {
      storeID: props.options.WaffoPancakeStoreID || '',
      productID: props.options.WaffoPancakeProductID || '',
    };

    initialMerchantIDRef.current = currentInputs.WaffoPancakeMerchantID;
    setInputs(currentInputs);
    setSelectedBinding(binding);
    setSavedBinding(binding);
    formApiRef.current.setValues(currentInputs);
  }, [props.options]);

  const readValues = useCallback(
    () => ({
      ...inputs,
      ...(formApiRef.current?.getValues?.() || {}),
    }),
    [inputs],
  );

  const readCreds = useCallback(() => {
    const values = readValues();
    const merchantID = (values.WaffoPancakeMerchantID || '').trim();
    const privateKey = (values.WaffoPancakePrivateKey || '').trim();
    const merchantEdited = merchantID !== initialMerchantIDRef.current.trim();
    const keyEdited = privateKey.length > 0;

    if (!merchantEdited && !keyEdited) {
      return { merchantID: '', privateKey: '' };
    }

    return { merchantID, privateKey };
  }, [readValues]);

  const fetchCatalog = useCallback(
    async (options = {}) => {
      const { preselect, quiet = false } = options;
      const { merchantID, privateKey } = readCreds();

      setCatalogLoading(true);
      try {
        const res = await API.post('/api/option/waffo-pancake/catalog', {
          merchant_id: merchantID,
          private_key: privateKey,
        });
        const body = res.data;
        if (!isSuccessBody(body)) {
          const reason =
            typeof body?.data === 'string'
              ? body.data
              : body?.data?.error || body?.message;
          showError(reason || t('凭证校验失败'));
          return false;
        }

        const stores = body?.data?.stores || [];
        setCatalog(stores);
        if (preselect) {
          setSelectedBinding({
            storeID: preselect.storeID || '',
            productID: preselect.productID || '',
          });
        } else if (stores.length > 0) {
          setSelectedBinding((prev) => {
            if (prev.storeID) return prev;
            const storeWithProduct =
              stores.find((store) => store.onetimeProducts?.length > 0) ||
              stores[0];
            return {
              storeID: storeWithProduct.id || '',
              productID: storeWithProduct.onetimeProducts?.[0]?.id || '',
            };
          });
        }

        if (!quiet) {
          showSuccess(t('凭证校验成功，已拉取 Pancake 目录'));
        }
        return true;
      } catch (error) {
        showError(t('凭证校验失败'));
        return false;
      } finally {
        setCatalogLoading(false);
      }
    },
    [readCreds, t],
  );

  useEffect(() => {
    const merchantID = props.options?.WaffoPancakeMerchantID || '';
    if (!merchantID || autoCatalogMerchantRef.current === merchantID) return;
    autoCatalogMerchantRef.current = merchantID;
    fetchCatalog({ quiet: true });
  }, [fetchCatalog, props.options?.WaffoPancakeMerchantID]);

  const handleFormChange = (values) => {
    setInputs(values);
  };

  const productsForSelectedStore = useMemo(() => {
    const store = catalog.find((item) => item.id === selectedBinding.storeID);
    return store?.onetimeProducts || [];
  }, [catalog, selectedBinding.storeID]);

  const storeOptions = useMemo(() => {
    const options = catalog.map((store) => ({
      value: store.id,
      label: `${store.name || store.id} (${store.id})`,
    }));
    if (
      selectedBinding.storeID &&
      !options.some((option) => option.value === selectedBinding.storeID)
    ) {
      options.push({
        value: selectedBinding.storeID,
        label: selectedBinding.storeID,
      });
    }
    return options;
  }, [catalog, selectedBinding.storeID]);

  const productOptions = useMemo(() => {
    const options = productsForSelectedStore.map((product) => ({
      value: product.id,
      label: `${product.name || product.id} (${product.id})`,
    }));
    if (
      selectedBinding.productID &&
      !options.some((option) => option.value === selectedBinding.productID)
    ) {
      options.push({
        value: selectedBinding.productID,
        label: selectedBinding.productID,
      });
    }
    return options;
  }, [productsForSelectedStore, selectedBinding.productID]);

  const createPair = async () => {
    const values = readValues();
    const formMerchant = (values.WaffoPancakeMerchantID || '').trim();
    const formPrivateKey = (values.WaffoPancakePrivateKey || '').trim();
    const savedMerchant = initialMerchantIDRef.current.trim();
    const credsEdited = formMerchant !== savedMerchant || formPrivateKey !== '';
    if (credsEdited && (!formMerchant || !formPrivateKey)) {
      showError(t('创建前请填写商户 ID 和 API 私钥'));
      return;
    }
    if (!credsEdited && !savedMerchant) {
      showError(t('创建前请填写商户 ID 和 API 私钥'));
      return;
    }

    const { merchantID, privateKey } = readCreds();
    const returnURL = removeTrailingSlash(values.WaffoPancakeReturnURL || '');
    setCreatingPair(true);
    try {
      const res = await API.post('/api/option/waffo-pancake/pair', {
        merchant_id: merchantID,
        private_key: privateKey,
        return_url: returnURL,
      });
      const body = res.data;
      if (isSuccessBody(body) && body.data) {
        const created = body.data;
        await fetchCatalog({
          preselect: {
            storeID: created.store_id,
            productID: created.product_id,
          },
          quiet: true,
        });
        showSuccess(
          `${t('Store + Product 已创建')}: ${created.store_id} / ${created.product_id}`,
        );
        return;
      }

      const errData =
        body && typeof body.data === 'object' && body.data !== null
          ? body.data
          : null;
      if (errData?.orphan_store && errData.store_id) {
        await fetchCatalog({
          preselect: { storeID: errData.store_id, productID: '' },
          quiet: true,
        });
      }
      showError(errData?.error || body?.data || body?.message || t('创建失败'));
    } catch (error) {
      showError(t('创建失败'));
    } finally {
      setCreatingPair(false);
    }
  };

  const updateBasicOptions = async (values) => {
    const options = [
      {
        key: 'WaffoPancakeUnitPrice',
        value: String(values.WaffoPancakeUnitPrice || 1),
      },
      {
        key: 'WaffoPancakeMinTopUp',
        value: String(values.WaffoPancakeMinTopUp || 1),
      },
    ];

    const results = await Promise.all(
      options.map((opt) =>
        API.put('/api/option/', {
          key: opt.key,
          value: opt.value,
        }),
      ),
    );

    const errorResults = results.filter((res) => !res.data.success);
    if (errorResults.length > 0) {
      errorResults.forEach((res) => showError(res.data.message));
      return false;
    }
    return true;
  };

  const submitWaffoPancakeSetting = async () => {
    const values = readValues();
    const merchantID = (values.WaffoPancakeMerchantID || '').trim();
    const privateKey = (values.WaffoPancakePrivateKey || '').trim();
    const returnURL = removeTrailingSlash(values.WaffoPancakeReturnURL || '');

    if (!merchantID) {
      showError(t('商户 ID 不能为空'));
      return;
    }
    if (merchantID !== initialMerchantIDRef.current.trim() && !privateKey) {
      showError(t('创建前请填写商户 ID 和 API 私钥'));
      return;
    }
    if (!selectedBinding.storeID || !selectedBinding.productID) {
      showError(t('请先选择或创建 Store 和 Product'));
      return;
    }

    setLoading(true);
    try {
      const basicSaved = await updateBasicOptions(values);
      if (!basicSaved) return;

      const res = await API.post('/api/option/waffo-pancake/save', {
        merchant_id: merchantID,
        private_key: privateKey,
        return_url: returnURL,
        store_id: selectedBinding.storeID,
        product_id: selectedBinding.productID,
      });
      const body = res.data;
      if (!isSuccessBody(body)) {
        showError(body?.data || body?.message || t('保存配置失败'));
        return;
      }

      const saved = {
        storeID: body.data?.store_id || selectedBinding.storeID,
        productID: body.data?.product_id || selectedBinding.productID,
      };
      setSavedBinding(saved);
      setSelectedBinding(saved);
      showSuccess(t('更新成功'));
      props.refresh?.();
    } catch (error) {
      showError(t('更新失败'));
    } finally {
      setLoading(false);
    }
  };

  const webhookBase = props.options.ServerAddress
    ? removeTrailingSlash(props.options.ServerAddress)
    : t('网站地址');

  return (
    <Spin spinning={loading}>
      <Form
        initValues={inputs}
        onValueChange={handleFormChange}
        getFormApi={(api) => (formApiRef.current = api)}
      >
        <Form.Section text={sectionTitle}>
          <Banner
            type='info'
            icon={<BookOpen size={16} />}
            description={
              <>
                {t(
                  'Waffo Pancake 是 Merchant of Record 支付服务。商户 ID、API 私钥请在',
                )}
                <a
                  href={PANCAKE_DASHBOARD_URL}
                  target='_blank'
                  rel='noreferrer'
                >
                  {t('Waffo Pancake 控制台')}
                </a>
                {t(
                  '获取。环境由你粘贴的 API 私钥决定，集成阶段使用 Test Key，上线时更换为 Production Key。',
                )}
                <br />
                {t('Test 回调地址')}：{webhookBase}
                /api/waffo-pancake/webhook/test
                <br />
                {t('Production 回调地址')}：{webhookBase}
                /api/waffo-pancake/webhook/prod
              </>
            }
            style={{ marginBottom: 12 }}
          />

          <Row
            gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}
            style={{ marginTop: 16 }}
          >
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.Input
                field='WaffoPancakeMerchantID'
                label={t('商户 ID')}
                placeholder={t('例如：MER_xxx')}
              />
            </Col>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.Input
                field='WaffoPancakeReturnURL'
                label={t('支付返回地址')}
                placeholder={t('例如：https://example.com/console/topup')}
                extraText={t('用于新创建 Product 的 SuccessURL，可留空')}
              />
            </Col>
          </Row>

          <Row
            gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}
            style={{ marginTop: 16 }}
          >
            <Col xs={24}>
              <Form.TextArea
                field='WaffoPancakePrivateKey'
                label={t('API 私钥')}
                placeholder={t('填写后覆盖当前私钥，留空表示保持当前不变')}
                extraText={t(
                  '保存后不会回显。若商户 ID 未变且此处留空，将使用已保存私钥校验目录。',
                )}
                type='password'
                autosize={{ minRows: 4, maxRows: 8 }}
              />
            </Col>
          </Row>

          <Row
            gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}
            style={{ marginTop: 16 }}
          >
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.InputNumber
                field='WaffoPancakeUnitPrice'
                precision={2}
                label={t('充值价格倍率')}
                placeholder='1.01'
                extraText={t(
                  '先按此倍率计算站内展示支付金额，再按汇率换算为 USD 提交 Pancake。填写 1.01 表示加收 1% 手续费。',
                )}
                min={0}
              />
            </Col>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.InputNumber
                field='WaffoPancakeMinTopUp'
                label={t('最低充值数量')}
                placeholder='1'
                extraText={t('用户单次最少可充值的站内数量')}
                min={1}
              />
            </Col>
          </Row>
        </Form.Section>

        <Form.Section text={t('Pancake Store / Product 绑定')}>
          <Banner
            type='info'
            description={t(
              '绑定的 Store 是所有 Pancake 商品的容器；绑定的 Product 用于钱包任意金额充值。订阅套餐会使用各自单独的 Pancake Product。',
            )}
            style={{ marginBottom: 16 }}
          />
          <Space wrap style={{ marginBottom: 16 }}>
            <Button loading={catalogLoading} onClick={() => fetchCatalog()}>
              {t('校验凭证并拉取目录')}
            </Button>
            <Button
              icon={<Plus size={14} />}
              loading={creatingPair}
              onClick={createPair}
            >
              {`+ ${t('创建')} ${DEFAULT_NEW_PAIR_NAME}`}
            </Button>
          </Space>

          <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Text strong>{t('Store')}</Text>
              <Select
                value={selectedBinding.storeID || undefined}
                placeholder={t('请选择 Store')}
                style={{ width: '100%', marginTop: 8 }}
                optionList={storeOptions}
                onChange={(value) =>
                  setSelectedBinding({ storeID: value || '', productID: '' })
                }
              />
            </Col>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Text strong>{t('Product')}</Text>
              <Select
                value={selectedBinding.productID || undefined}
                placeholder={t('请选择 Product')}
                style={{ width: '100%', marginTop: 8 }}
                optionList={productOptions}
                disabled={!selectedBinding.storeID}
                onChange={(value) =>
                  setSelectedBinding((prev) => ({
                    ...prev,
                    productID: value || '',
                  }))
                }
              />
            </Col>
          </Row>

          <div style={{ marginTop: 16 }}>
            <Text type='secondary'>
              {t('当前绑定 Store')}：{savedBinding.storeID || '-'}
            </Text>
            <br />
            <Text type='secondary'>
              {t('当前绑定 Product')}：{savedBinding.productID || '-'}
            </Text>
          </div>

          <Button onClick={submitWaffoPancakeSetting} style={{ marginTop: 16 }}>
            {t('更新 Waffo Pancake 设置')}
          </Button>
        </Form.Section>
      </Form>
    </Spin>
  );
}
