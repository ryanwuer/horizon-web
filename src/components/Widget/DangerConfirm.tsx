import { ExclamationCircleOutlined, UnlockOutlined } from '@ant-design/icons';
import {
  Button, Input, Modal, Typography,
} from 'antd';
import { useEffect, useState } from 'react';
import { useIntl } from 'umi';

const { Title, Text } = Typography;

interface DangerConfirmProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  requiredString?: string;
  title?: string;
  confirmBtnText?: string;
  content?: React.ReactNode;
}

/**
 * 高危操作确认组件
 * 用于需要用户输入特定字符串才能执行的危险操作
 * 可在任何页面导入并使用
 */
function DangerConfirm({
  open,
  onCancel,
  onConfirm,
  requiredString = 'INPUT_STRING',
  title = 'DANGER OPERATION',
  confirmBtnText = 'CONFIRM',
  content = null,
}: DangerConfirmProps) {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const [showLockIcon, setShowLockIcon] = useState(false);

  // 检查输入是否与要求的字符串匹配
  const isInputValid = () => inputValue.trim() === requiredString;
  const intl = useIntl();

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setInputValue(value);

    // 清除错误提示
    if (error) setError('');

    // 输入匹配时显示锁图标动画
    if (value === requiredString && !showLockIcon) {
      setShowLockIcon(true);
    } else if (value !== requiredString && showLockIcon) {
      setShowLockIcon(false);
    }
  };

  // 重置组件状态
  const resetState = () => {
    setInputValue('');
    setError('');
    setShowLockIcon(false);
  };

  // 处理确认操作
  const handleConfirm = () => {
    if (!isInputValid()) {
      setError(intl.formatMessage({ id: 'pages.danger.confirm.error' }, { requiredString }));
      return;
    }

    onConfirm();
    resetState();
  };

  // 当弹窗关闭时重置状态
  useEffect(() => {
    if (!open) resetState();
  }, [open]);

  return (
    <Modal
      open={open}
      title={(
        <Title level={4}>
          <ExclamationCircleOutlined style={{ color: 'orange' }} />
          &nbsp;
          {title}
        </Title>
      )}
      onCancel={() => {
        resetState();
        onCancel();
      }}
      maskClosable={false}
      footer={[
        <Button
          key="cancel"
          onClick={() => {
            resetState();
            onCancel();
          }}
        >
          {intl.formatMessage({ id: 'pages.danger.confirm.cancel' })}
        </Button>,
        <Button
          key="confirm"
          type="primary"
          danger
          onClick={handleConfirm}
          disabled={!isInputValid()}
          icon={showLockIcon ? <UnlockOutlined /> : null}
        >
          {confirmBtnText}
        </Button>,
      ]}
      destroyOnClose
    >

      <div style={{ marginBottom: 16 }}>
        {content}
      </div>

      <div>
        <Text style={{ fontSize: 12, color: 'grey' }}>
          {intl.formatMessage({ id: 'pages.danger.confirm.confirm' })}
          <Text code>{requiredString}</Text>
        </Text>

        <Input
          value={inputValue}
          onChange={handleInputChange}
          placeholder={requiredString}
          status={error ? 'error' : undefined}
          style={{ marginTop: 8 }}
          autoFocus
        />

        {error && (
          <Text type="danger" style={{ marginTop: 4, display: 'inline-block' }}>
            {error}
          </Text>
        )}
      </div>
    </Modal>
  );
}

export default DangerConfirm;
