import React from 'react';
import { Col, Form, Radio, Typography } from '@douyinfe/semi-ui';

const { Text } = Typography;

// Shared reset-mode selector so quota reset and limit windows stay aligned in UX.
const SubscriptionResetModeField = ({
  field,
  label,
  value,
  t,
  span = 24,
  anchorDescription,
  naturalDescription,
}) => {
  return (
    <Col span={span}>
      <Form.RadioGroup field={field} label={label} type='button'>
        <Radio value='anchor'>{t('订阅锚点周期')}</Radio>
        <Radio value='natural'>{t('自然周期')}</Radio>
      </Form.RadioGroup>
      <Text type='tertiary' size='small'>
        {value === 'natural' ? naturalDescription : anchorDescription}
      </Text>
    </Col>
  );
};

export default SubscriptionResetModeField;
