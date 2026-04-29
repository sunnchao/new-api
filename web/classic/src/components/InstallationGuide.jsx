import React, { useState } from 'react';
import { Steps, Card, Typography } from '@douyinfe/semi-ui';

const { Title } = Typography;

const InstallationGuide = ({ steps }) => {
  const [current, setCurrent] = useState(0);

  return (
    <div className='flex flex-col md:flex-row gap-6 p-2'>
      <div className='w-full md:w-1/3 min-w-[200px]'>
        <Steps
          direction="vertical"
          current={current}
          onChange={setCurrent}
          style={{ height: '100%' }}
          className='cursor-pointer'
        >
          {steps.map((step, index) => (
            <Steps.Step
              key={index}
              title={step.title}
              onClick={() => setCurrent(index)}
              className='hover:opacity-80 transition-opacity'
            />
          ))}
        </Steps>
      </div>

      <div className='w-full md:w-2/3'>
        <Card
          bordered={false}
          style={{ 
            background: 'var(--semi-color-fill-0)', 
            borderRadius: '12px',
            minHeight: '400px',
            border: '1px solid var(--semi-color-border)'
          }}
          bodyStyle={{ padding: '24px' }}
        >
          <div className='mb-6 pb-4 border-b border-gray-100 dark:border-gray-700'>
            <Title heading={3} style={{ margin: 0 }}>{steps[current].title}</Title>
          </div>
          <div className='text-base animate-fadeIn'>
            {steps[current].content}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default InstallationGuide;
