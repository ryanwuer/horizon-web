import {
  Affix, Button, Col, Form, Modal, Row,
} from 'antd';
import {
  useCallback, useMemo, useRef, useState,
} from 'react';
import { useRequest } from 'umi';
import { useIntl } from '@@/plugin-locale/localeExports';
import { useModel } from '@@/plugin-model/useModel';
import type { FieldData } from 'rc-field-form/lib/interface';
import Basic from './Basic';
import Config from './Config';
import Audit from './Audit';
import Template from '@/components/neworedit/components/TemplateV1';
import { parseGitRef } from '@/services/code/code';
import { createCluster, getCluster, updateCluster } from '@/services/clusters/clusters';
import PageWithBreadcrumb from '@/components/PageWithBreadcrumb';
import { getApplication, getApplicationEnvTemplate } from '@/services/applications/applications';
import HSteps from '@/components/HSteps';
import { PublishType } from '@/const';
import {
  Step, StepContent, StepAction, ModalTitle, ModalContent,
} from '../Widget';
import { difference } from '@/utils';
import { RebuilddeployModal } from '@/components/rollout';

export default (props: any) => {
  const intl = useIntl();

  const name = 'name';
  const url = 'url';
  const branch = 'branch';
  const description = 'description';
  const subfolder = 'subfolder';
  const environment = 'environment';
  const region = 'region';
  const expireTimeStr = 'expireTime';
  const release = 'release';
  const basicNeedValidFields = [
    name, branch, environment, region,
  ];

  const { initialState } = useModel('@@initialState');
  const { id } = initialState!.resource;

  const { location } = props;
  const { query, pathname } = location;
  const { environment: envFromQuery, sourceClusterID } = query;
  const editing = pathname.endsWith('edit');
  const creating = pathname.endsWith('newinstance/git');
  const copying = !!sourceClusterID;

  const { successAlert } = useModel('alert');
  const [form] = Form.useForm();
  const [current, setCurrent] = useState(0);
  const [template, setTemplate] = useState<{ name: string, release: string }>({ release: '', name: '' });
  const [basic, setBasic] = useState<FieldData[]>([{
    name: environment, value: envFromQuery,
  }]);
  const [config, setConfig] = useState({});
  const [originConfig, setOriginConfig] = useState({});
  const [configErrors, setConfigErrors] = useState({});
  const [applicationName, setApplicationName] = useState('');
  const [cluster, setCluster] = useState<CLUSTER.Cluster>();
  const [showBuildDeployModal, setShowBuildDeployModal] = useState(false);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [enableRebuilddeployModal, setEnableRebuilddeployModal] = useState(false);
  const pageOrders = useMemo(() => (editing ? [1, 2, 3] : [0, 1, 2, 3]), [editing]);

  const { run: refreshAppEnvTemplate } = useRequest((env) => getApplicationEnvTemplate(id, env), {
    onSuccess: (data) => {
      setConfig(data);
    },
    ready: creating,
    manual: true,
  });

  // query application if creating
  if (creating) {
    const { data } = useRequest(() => getApplication(id), {
      onSuccess: () => {
        const {
          template: t, git, name: n, tags: appTags,
        } = data!;
        setApplicationName(n);
        if (!copying) {
          setTemplate(t);
          const { release: r } = t;
          const { gitRefType, gitRef } = parseGitRef(git);
          setBasic((prevBasic) => [
            ...prevBasic,
            { name: url, value: git.url },
            { name: subfolder, value: git.subfolder },
            { name: 'tags', value: appTags },
            { name: 'refType', value: gitRefType },
            { name: 'refValue', value: gitRef },
            { name: release, value: r },
          ]);
          refreshAppEnvTemplate(envFromQuery);
        } else {
          // query source cluster if copying
          getCluster(sourceClusterID).then(
            ({ data: clusterData }) => {
              const {
                description: d,
                git: gitInfo,
                template: tpl,
                templateInput,
                scope,
                expireTime,
                tags,
              } = clusterData!;
              const { url: u, branch: b, subfolder: s } = gitInfo;
              const { environment: e, region: r } = scope;
              const { release: rel } = tpl;
              const { gitRefType, gitRef } = parseGitRef(gitInfo);
              setBasic([
                { name: description, value: d },
                { name: 'refType', value: gitRefType },
                { name: 'refValue', value: gitRef },
                { name: environment, value: e },
                { name: region, value: r },
                { name: expireTimeStr, value: expireTime },
                { name: url, value: u },
                { name: 'tags', value: tags },
                { name: branch, value: b },
                { name: subfolder, value: s },
                { name: release, value: rel },
              ]);
              setOriginConfig({
                git: gitInfo,
                templateInput,
              });
              setConfig(templateInput);
              setTemplate(tpl);
              setCluster(clusterData);
            },
          );
        }
      },
    });
  }

  // query cluster if editing
  if (editing) {
    const { data: clusterData } = useRequest(() => getCluster(id), {
      onSuccess: () => {
        const {
          name: n,
          description: d,
          git,
          template: t,
          templateInput,
          scope,
          expireTime,
          tags,
        } = clusterData!;
        const { url: u, branch: b, subfolder: s } = git;
        const { environment: e, region: r } = scope;
        const { release: rel } = t;
        const { gitRefType, gitRef } = parseGitRef(git);
        setBasic([
          { name, value: n },
          { name: description, value: d },
          { name: 'tags', value: tags },
          { name: 'refType', value: gitRefType },
          { name: 'refValue', value: gitRef },
          { name: environment, value: e },
          { name: region, value: r },
          { name: expireTimeStr, value: expireTime },
          { name: url, value: u },
          { name: branch, value: b },
          { name: subfolder, value: s },
          { name: release, value: rel },
        ]);
        setOriginConfig({
          git,
          templateInput,
        });
        setConfig(templateInput);
        setTemplate(t);
        setCluster(clusterData);
      },
    });
  }

  const basicHasError = () => {
    let hasError = false;

    for (let i = 0; i < basic!.length; i += 1) {
      const val = basic![i];
      if (val.errors && val.errors.length > 0) {
        hasError = true;
      }
    }

    return hasError;
  };

  const configHasError = () => {
    let hasError = false;
    Object.keys(configErrors).forEach((item) => {
      if (configErrors[item].length > 0) {
        hasError = true;
      }
    });

    return hasError;
  };

  const steps = [
    {
      title: intl.formatMessage({ id: 'pages.clusterNew.tpl.select' }),
      disabled: false,
    },
    {
      title: intl.formatMessage({ id: 'pages.clusterNew.basic' }),
      disabled: !template.name,
    },
    {
      title: intl.formatMessage({ id: 'pages.clusterNew.tpl.config' }),
      disabled: !template.name || basicHasError(),
    },
    {
      title: intl.formatMessage({ id: 'pages.clusterNew.review' }),
      disabled: !template.name || basicHasError() || configHasError(),
    },
  ].filter((_, index) => pageOrders.includes(index));

  const currentIsValid = async () => {
    let valid: boolean;
    switch (current) {
      case 0:
        valid = !!template.name;
        break;
      case 1:
        try {
          await form.validateFields(basicNeedValidFields);
          valid = true;
        } catch (e: any) {
          const { errorFields } = e;
          valid = !errorFields.length;
        }
        break;
      case 2:
        valid = !configHasError();
        break;
      default:
        valid = true;
    }

    return valid;
  };

  const configRef = useRef();

  const next = async () => {
    if (await currentIsValid()) {
      setCurrent(current + 1);
    }
  };

  const prev = () => {
    setCurrent(current - 1);
  };

  const nextBtnDisabled = () => {
    switch (current) {
      case 0:
        return basicHasError();
      case 1:
        return configHasError();
      default:
        return false;
    }
  };

  const onCurrentChange = async (cur: number) => {
    if (cur < current || await currentIsValid()) {
      setCurrent(cur);
    }
  };

  const resetTemplate = useCallback((t: API.Template) => {
    setTemplate({ name: t.name, release: '' });
    // reset selected release version
    if (basic) {
      setBasic(basic!.map((item) => {
        if (item.name === release) {
          return { ...item, value: '' };
        }
        return item;
      }));
    }
  }, [basic]);

  const setBasicFormData = (changingField: FieldData[], allFields: FieldData[]) => {
    // query regions when environment selected
    if (changingField && changingField.length > 0
      && (changingField[0].name[0] === 'environment') && !copying) {
      refreshAppEnvTemplate(changingField[0].value);
    }
    setBasic(allFields);
  };

  const onBuildAndDeployButtonOK = () => {
    setShowBuildDeployModal(false);
    if (creating) {
      window.location.href = `/instances${cluster!.fullPath}/-/pipelines/new?type=${PublishType.BUILD_DEPLOY}`;
    } else {
      setEnableRebuilddeployModal(true);
    }
  };

  const onDeployButtonOK = () => {
    window.location.href = `/instances${cluster!.fullPath}/-/pipelines/new?type=${PublishType.DEPLOY}`;
  };

  const onButtonCancel = () => {
    // jump to cluster's home page
    window.location.href = cluster!.fullPath;
  };

  const { loading, run: submitCluster } = useRequest((cfg?: any) => {
    const info = {
      name: form.getFieldValue(name),
      description: form.getFieldValue(description),
      template: {
        name: template.name,
        release: form.getFieldValue(release),
      },
      tags: form.getFieldValue('tags') ?? [],
      git: {
        url: form.getFieldValue(url),
        subfolder: form.getFieldValue(subfolder) || '',
        [form.getFieldValue('refType')]: form.getFieldValue('refValue'),
      },
      environment: form.getFieldValue(environment),
      region: form.getFieldValue(region),
      expireTime: form.getFieldValue(expireTimeStr),
      templateInput: cfg || config,
    };
    if (creating) {
      return createCluster(id, `${form.getFieldValue(environment)}/${form.getFieldValue(region)}`, info);
    }
    return updateCluster(id, info);
  }, {
    manual: true,
    onSuccess: (res: CLUSTER.Cluster) => {
      successAlert(creating ? intl.formatMessage({ id: 'pages.clusterNew.success' }) : intl.formatMessage({ id: 'pages.clusterEdit.success' }));
      setCluster(res);

      const appPart = 'application';
      const pipelinePart = 'pipeline';
      const gitPart = 'git';
      const tplInput = 'templateInput';
      const configDiff = difference({
        git: res.git,
        templateInput: config,
      }, originConfig);
      if (creating) {
        if (Object.keys(config[pipelinePart]).length > 0) {
          setShowBuildDeployModal(true);
        } else {
          setShowDeployModal(true);
        }
      } else if (editing) {
        if ((tplInput in configDiff && pipelinePart in configDiff.templateInput)
          || Object.keys(configDiff).includes(gitPart)) {
          setShowBuildDeployModal(true);
        } else if (tplInput in configDiff && appPart in configDiff.templateInput) {
          setShowDeployModal(true);
        } else {
          onButtonCancel();
        }
      }
    },
  });

  const onSubmit = (formData: any) => {
    submitCluster(formData);
  };

  return (
    <PageWithBreadcrumb>
      <Row>
        <Col span={4}>
          <Step>
            <Affix offsetTop={50}>
              <HSteps current={current} onChange={onCurrentChange} steps={steps} />
            </Affix>
          </Step>
        </Col>
        <Col span={20}>
          <StepContent>
            {
              pageOrders[current] === 0 && <Template template={template} resetTemplate={resetTemplate} />
            }
            {
              pageOrders[current] === 1
              && (
                <Basic
                  form={form}
                  applicationName={applicationName}
                  formData={basic}
                  setFormData={setBasicFormData}
                  editing={editing}
                  template={template}
                  status={cluster?.status}
                />
              )
            }
            {
              pageOrders[current] === 2 && (
                <Config
                  template={template}
                  release={form.getFieldValue(release)}
                  config={config}
                  setConfig={setConfig}
                  setConfigErrors={setConfigErrors}
                  clusterID={cluster?.id}
                />
              )
            }
            {
              pageOrders[current] === 3
              && (
                <Audit
                  template={template}
                  editing={editing}
                  form={form}
                  applicationName={applicationName}
                  release={form.getFieldValue(release)}
                  config={config}
                  clusterID={cluster?.id}
                  formRef={configRef}
                  onSubmit={onSubmit}
                />
              )
            }
          </StepContent>
          <Affix offsetBottom={100}>
            <StepAction>
              {current > 0 && (
                <Button style={{ margin: '0 8px' }} onClick={() => prev()}>
                  {intl.formatMessage({ id: 'pages.common.back' })}
                </Button>
              )}
              {current === steps.length - 1 && (
                <Button type="primary" onClick={() => { configRef.current.submit(); }} loading={loading}>
                  {intl.formatMessage({ id: 'pages.common.submit' })}
                </Button>
              )}
              {current < steps.length - 1 && (
                <Button type="primary" disabled={nextBtnDisabled()} onClick={() => next()}>
                  {intl.formatMessage({ id: 'pages.common.next' })}
                </Button>
              )}
              <Modal
                title={(
                  <ModalTitle>
                    {intl.formatMessage({ id: 'pages.clusterEdit.prompt.buildDeploy.title' })}
                  </ModalTitle>
                )}
                open={showBuildDeployModal}
                footer={[
                  <Button
                    onClick={onBuildAndDeployButtonOK}
                    type="primary"
                  >
                    {intl.formatMessage({ id: 'pages.cluster.action.buildDeploy' })}
                  </Button>,
                ]}
                onCancel={onButtonCancel}
              >
                <ModalContent>
                  {creating
                    ? intl.formatMessage({ id: 'pages.clusterEdit.prompt.buildDeploy.create.content' })
                    : intl.formatMessage({ id: 'pages.clusterEdit.prompt.buildDeploy.edit.content' })}
                </ModalContent>
              </Modal>
              <Modal
                title={(
                  <ModalTitle>
                    {intl.formatMessage({ id: 'pages.clusterEdit.prompt.deploy.title' })}
                  </ModalTitle>
                )}
                open={showDeployModal}
                footer={[
                  <Button
                    onClick={onDeployButtonOK}
                    type="primary"
                  >
                    {intl.formatMessage({ id: 'pages.cluster.action.deploy' })}
                  </Button>,
                ]}
                onCancel={onButtonCancel}
              >
                <ModalContent>
                  {creating
                    ? intl.formatMessage({ id: 'pages.clusterEdit.prompt.deploy.create.content' })
                    : intl.formatMessage({ id: 'pages.clusterEdit.prompt.deploy.edit.content' })}
                </ModalContent>
              </Modal>
              <RebuilddeployModal
                open={enableRebuilddeployModal}
                setOpen={setEnableRebuilddeployModal}
                onCancel={() => {
                  setEnableRebuilddeployModal(false);
                  onButtonCancel();
                }}
                clusterID={id}
                clusterFullPath={cluster?.fullPath ?? ''}
              />
            </StepAction>
          </Affix>
        </Col>
      </Row>
    </PageWithBreadcrumb>
  );
};
