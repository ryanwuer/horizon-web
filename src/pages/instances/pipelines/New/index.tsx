import {
  AutoComplete, Button, Card, Form, Input, Select,
} from 'antd';
import { useIntl } from '@@/plugin-locale/localeExports';
import TextArea from 'antd/es/input/TextArea';
import { useModel } from '@@/plugin-model/useModel';
import { history } from 'umi';
import { useRequest } from '@@/plugin-request/request';
import type { FieldData, Rule } from 'rc-field-form/lib/interface';
import { useState, useEffect } from 'react';
import CodeDiff from '@/components/CodeDiff';
import PageWithBreadcrumb from '@/components/PageWithBreadcrumb';
import NotFound from '@/pages/404';
import { PublishType } from '@/const';
import {
  createPipelineRun, diffsOfCode, getClusterV2,
} from '@/services/clusters/clusters';
import {
  gitRefTypeList, listGitRef, parseGitRef, GitRefType,
} from '@/services/code/code';
import styles from '@/pages/instances/NewOrEdit/index.less';
import HForm from '@/components/HForm';
import ButtonWithoutPadding from '@/components/Widget/ButtonWithoutPadding';

const { Option } = Select;

export default (props: any) => {
  const intl = useIntl();
  const [form] = Form.useForm();
  const { initialState } = useModel('@@initialState');
  const { id, fullPath } = initialState?.resource || {};
  const { location } = props;
  const { query } = location;
  const { type } = query;
  const [refType, setRefType] = useState('');
  const [showImageTag, setShowImageTag] = useState(false);
  if (!type) {
    return <NotFound />;
  }
  useEffect(() => {
    const { title } = query;
    if (title) {
      form.setFieldsValue({
        title,
      });
    }
  }, [form, query]);

  const formatMessage = (suffix: string, defaultMsg?: string) => intl.formatMessage({ id: `pages.pipeline.${suffix}`, defaultMessage: defaultMsg });

  const { data, run: refreshDiff } = useRequest((gitRef) => diffsOfCode(id!, form.getFieldValue('refType'), gitRef), {
    debounceInterval: 200,
    manual: true,
  });

  const parseImageTag = (image: string) => {
    const items = image.split(':');
    return items.length > 1 ? items[items.length - 1] : '';
  };

  const { data: cluster } = useRequest(() => getClusterV2(id!), {
    onSuccess: () => {
      if (cluster?.image) {
        setShowImageTag(true);
      }
      const { gitRefType, gitRef } = parseGitRef(cluster?.git ?? {});
      const imageTag = parseImageTag(cluster?.image || '');
      setRefType(gitRefType);
      form.setFieldsValue({
        refType: gitRefType,
        refValue: gitRef,
        imageTag,
      });
      refreshDiff(gitRef);
    },
    ready: !!id,
  });

  const { data: gitRefList = [], run: refreshGitRefList } = useRequest((filter?: string) => listGitRef({
    refType: form.getFieldValue('refType'),
    giturl: cluster!.git.url,
    filter: filter ?? '',
    pageNumber: 1,
    pageSize: 50,
  }), {
    debounceInterval: 100,
    ready: !!cluster,
  });

  const requiredRule: Rule[] = [
    {
      required: true,
    },
  ];

  const titleRule: Rule[] = [
    {
      required: true,
      pattern: /^(?!\d+$)(?=.{5,})(?!^\s+|\s+$).*$/,
      message: formatMessage('titleRule'),
    },
  ];

  const imageTagRule: Rule[] = [
    {
      pattern: /^[a-zA-Z0-9_.-]+$/,
      message: formatMessage('imageTagRule'),
    },
  ];

  const {
    run: pipelineRunCreate,
    loading,
  } = useRequest(createPipelineRun, {
    onSuccess: (pr: PIPELINES.Pipeline) => {
      // jump to pods' url
      history.push(`/instances${fullPath}/-/pipelines/${pr.id}`);
    },
    manual: true,
  });

  const onSubmit = () => {
    const info = {
      title: form.getFieldValue('title'),
      description: form.getFieldValue('description') || '',
    };
    if (type === PublishType.BUILD_DEPLOY) {
      form.validateFields(['title', 'refType', 'refValue']).then(() => {
        pipelineRunCreate(id!, {
          ...info,
          action: 'builddeploy',
          git: {
            [form.getFieldValue('refType')]: form.getFieldValue('refValue'),
          },
        });
      });
    } else {
      form.validateFields(['title']).then(() => {
        pipelineRunCreate(id!, {
          ...info,
          action: 'deploy',
          imageTag: form.getFieldValue('imageTag'),
        });
      });
    }
  };

  const onCancel = () => {
    history.goBack();
  };

  const buttons = () => (
    <div>
      <Button type="primary" onClick={onSubmit} loading={loading}>
        {intl.formatMessage({ id: 'pages.common.create' })}
      </Button>
      <Button style={{ float: 'right' }} onClick={onCancel}>
        {intl.formatMessage({ id: 'pages.common.cancel' })}
      </Button>
    </div>
  );

  return (
    <PageWithBreadcrumb>
      <Card title={formatMessage('title')} className={styles.gapBetweenCards}>
        <HForm
          layout="vertical"
          form={form}
          onFieldsChange={(a: FieldData[]) => {
            if (a[0].name[0] === 'branch') {
              refreshDiff(a[0].value);
            }
          }}
        >
          <Form.Item label={formatMessage('title')} name="title" rules={titleRule}>
            <Input />
          </Form.Item>
          <Form.Item label={formatMessage('description')} name="description">
            <TextArea maxLength={255} autoSize={{ minRows: 3 }} />
          </Form.Item>
          {
            type === PublishType.BUILD_DEPLOY && (
              <Form.Item
                label={formatMessage('revision')}
                name="ref"
                rules={requiredRule}
              >
                <Form.Item
                  name="refType"
                  style={{ display: 'inline-block', width: '100px' }}
                >
                  <Select
                    onSelect={(key: any) => {
                      setRefType(key);
                      form.setFieldsValue({ refValue: '' });
                      if (key !== GitRefType.Commit) {
                        refreshGitRefList();
                      }
                    }}
                  >
                    {
                      gitRefTypeList.map((item) => <Option key={item.key} value={item.key}>{item.displayName}</Option>)
                    }
                  </Select>
                </Form.Item>
                <Form.Item
                  name="refValue"
                  style={{ display: 'inline-block', width: 'calc(100% - 100px)' }}
                >
                  {
                    refType === GitRefType.Commit ? (
                      <Input
                        onPressEnter={() => {
                          refreshDiff(form.getFieldValue('refValue'));
                        }}
                      />
                    ) : (
                      <AutoComplete
                        allowClear
                        onChange={(key: any) => {
                          refreshDiff(key);
                        }}
                        showSearch
                        onSearch={(item) => {
                          refreshGitRefList(item);
                        }}
                      >
                        {
                          gitRefList.map((item: string) => <AutoComplete.Option key={item} value={item}>{item}</AutoComplete.Option>)
                        }
                      </AutoComplete>
                    )
                  }
                </Form.Item>
              </Form.Item>
            )
          }
          {
            type === PublishType.DEPLOY && showImageTag && (
              <Form.Item
                label={formatMessage('imageTag')}
                name="imageTag"
                rules={imageTagRule}
              >
                <Input />
              </Form.Item>
            )
          }
        </HForm>
      </Card>

      <Card title={formatMessage('changes')} className={styles.gapBetweenCards}>
        {
          type === PublishType.BUILD_DEPLOY
          && (
          <Card title={formatMessage('codeChange')} className={styles.gapBetweenCards}>
            <b>Commit ID</b>
            <br />
            {data?.codeInfo.commitID}
            <br />
            <br />
            <b>Commit Log</b>
            <br />
            {data?.codeInfo.commitMsg}
            <br />
            <br />
            <b>Commit History</b>
            <br />
            <ButtonWithoutPadding
              type="link"
              onClick={() => window.open(data?.codeInfo.link)}
            >
              Link
            </ButtonWithoutPadding>
          </Card>
          )
        }
        <Card title={formatMessage('configChange')} className={styles.gapBetweenCards}>
          <CodeDiff diff={data?.configDiff || ''} />
        </Card>
      </Card>
      {buttons()}
    </PageWithBreadcrumb>
  );
};
