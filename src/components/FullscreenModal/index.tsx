import {
  CloseOutlined, CopyOutlined, FullscreenExitOutlined, FullscreenOutlined,
} from '@ant-design/icons';
import {
  Button, Modal, Select, Switch,
} from 'antd';
import './index.less';
import React, { useState } from 'react';
import copy from 'copy-to-clipboard';
import { useIntl } from '@@/plugin-locale/localeExports';
import { useModel } from '@@/plugin-model/useModel';
import styles from './index.less';

const { Option } = Select;

interface Props {
  title: string
  visible: boolean
  fullscreen: boolean
  supportFullscreenToggle: boolean
  onClose: () => void
  listToSelect?: string[]
  onSelectChange?: (item: any) => void
  children?: any
  supportRefresh?: boolean
  onRefreshButtonToggle?: (checked: boolean, event: MouseEvent) => void
  defaultSelect?: string
}

export default (props: Props) => {
  const intl = useIntl();
  const {
    fullscreen: fullscreenProp,
    children,
    visible,
    title,
    supportRefresh,
    onRefreshButtonToggle,
    listToSelect,
    onSelectChange,
    defaultSelect,
    supportFullscreenToggle,
    onClose,
  } = props;
  const [fullscreen, setFullscreen] = useState(fullscreenProp);
  const { successAlert, errorAlert } = useModel('alert');
  const onToggleClick = () => {
    setFullscreen(!fullscreen);
  };
  const onCopyClick = () => {
    if (copy(children.props.content)) {
      successAlert(intl.formatMessage({ id: 'component.FullscreenModal.copySuccess' }));
    } else {
      errorAlert(intl.formatMessage({ id: 'component.FullscreenModal.copyFailed' }));
    }
  };

  return (
    <Modal
      keyboard
      footer={[]}
      closable={false}
      visible={visible}
      destroyOnClose
      wrapClassName={fullscreen ? 'full-screen' : 'common-modal'}
      title={(
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {title}
          <div style={{ flex: 1 }} />
          {supportRefresh && (
          <span
            style={{ fontSize: '13px', fontWeight: 'bold' }}
          >
            {intl.formatMessage({ id: 'component.FullscreenModal.autoRefresh' })}
          </span>
          )}
          {supportRefresh && (
          <Switch
            className={styles.buttonClass}
            size="small"
            defaultChecked
            onChange={onRefreshButtonToggle}
          />
          )}
          {
        (listToSelect && onSelectChange) && (
        <div>
          <Select
            defaultValue={defaultSelect ?? listToSelect[0]}
            onChange={(value) => {
              onSelectChange!(value);
            }}
          >
            {
              listToSelect?.map((item: string) => <Option key={item} value={item}>{item}</Option>)
            }
          </Select>
        </div>
        )
      }
          <Button className={styles.buttonClass} onClick={onCopyClick}>
            <CopyOutlined className={styles.iconCommonModal} />
          </Button>
          <Button hidden={!supportFullscreenToggle} className={styles.buttonClass}>
            {
          fullscreen
            ? (
              <FullscreenExitOutlined
                onClick={onToggleClick}
                className={styles.iconCommonModal}
              />
            )
            : (
              <FullscreenOutlined
                onClick={onToggleClick}
                className={styles.iconCommonModal}
              />
            )
        }
          </Button>
          <Button className={styles.buttonClass}>
            <CloseOutlined onClick={onClose} className={fullscreen ? styles.iconFullScreen : styles.iconCommonModal} />
          </Button>
        </div>
)}
    >
      {children}
    </Modal>
  );
};
