import {
  Button, Modal, Steps, Tooltip,
} from 'antd';
import {
  history, useIntl, useModel,
} from 'umi';
import {
  SmileOutlined, LoadingOutlined, HourglassOutlined,
} from '@ant-design/icons';
import type { ButtonProps } from 'antd/lib/button';
import {
  ClusterStatus,
} from '@/const';
import {
  next, pause, resume, listPipelineRuns, freeCluster, autoPromote, cancelAutoPromote, promoteFull,
  enforcePromote,
} from '@/services/clusters/clusters';
import RBAC from '@/rbac';
import { PageWithInitialState } from '@/components/Enhancement';
import { BoldText } from '@/components/Widget';

const { Step } = Steps;
const smile = <SmileOutlined />;
const loading = <LoadingOutlined />;
const waiting = <HourglassOutlined />;

const StrongTxt = ({ txt }: { txt: string }) => (
  <BoldText style={{ color: 'green' }}>
    {txt}
  </BoldText>
);

const Tips = () => {
  const intl = useIntl();
  return (
    <div style={{ color: 'grey', marginTop: '15px', textAlign: 'center' }}>
      <div style={{ display: 'inline-block', textAlign: 'left' }}>
        【
        {' '}
        <StrongTxt txt={intl.formatMessage({ id: 'pages.message.pods.tip1' })} />
        {' '}
        】
        {intl.formatMessage({ id: 'pages.message.pods.tip1.content0.1' })}
        【
        {' '}
        <StrongTxt txt={intl.formatMessage({ id: 'pages.message.pods.tip.notRunning' })} />
        {' '}
        】
        {intl.formatMessage({ id: 'pages.message.pods.tip1.content0.2' })}
        {intl.formatMessage({ id: 'pages.message.pods.tip1.content0.3' })}
        <br />
        &nbsp;
        {intl.formatMessage({ id: 'pages.message.pods.tip1.content0.4' })}
        {' '}
        <StrongTxt txt={intl.formatMessage({ id: 'pages.common.more' })} />
        {' '}
        {intl.formatMessage({ id: 'pages.message.pods.tip1.content0.5' })}
        {' '}
        <br />
        &nbsp;&nbsp;
        {intl.formatMessage({ id: 'pages.message.pods.tip1.content1.1' })}
        {' '}
        <br />
        &nbsp;&nbsp;
        {intl.formatMessage({ id: 'pages.message.pods.tip1.content1.2' })}
        {' '}
        <br />
        &nbsp;&nbsp;
        {intl.formatMessage({ id: 'pages.message.pods.tip1.content1.3' })}
        {' '}
        <br />
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        {intl.formatMessage({ id: 'pages.message.pods.tip1.content1.3.1' })}
        {' '}
        <br />
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        {intl.formatMessage({ id: 'pages.message.pods.tip1.content1.3.2' })}
        {' '}
        <br />
        &nbsp;
        {intl.formatMessage({ id: 'pages.message.pods.tip1.content2.1' })}
        {' '}
        <StrongTxt txt={intl.formatMessage({ id: 'pages.cluster.podsTable.monitor' })} />
        {' '}
        {intl.formatMessage({ id: 'pages.message.pods.tip1.content2.2' })}
        {' '}
        <br />
        &nbsp;
        {intl.formatMessage({ id: 'pages.message.pods.tip1.content3' })}
        {' '}
        <br />
        <br />
        <br />
        【
        {' '}
        <StrongTxt txt={intl.formatMessage({ id: 'pages.message.pods.tip2' })} />
        {' '}
        】
        {intl.formatMessage({ id: 'pages.message.pods.tip2.content1' })}
        【
        {' '}
        <StrongTxt txt={intl.formatMessage({ id: 'pages.pods.manualPause' })} />
        {' '}
        】
        {intl.formatMessage({ id: 'pages.message.pods.tip1.content0.2' })}
        {intl.formatMessage({ id: 'pages.message.pods.tip2.content2' })}
        【
        {' '}
        <StrongTxt txt={intl.formatMessage({ id: 'pages.pods.unpause' })} />
        {' '}
        】
        {intl.formatMessage({ id: 'pages.message.pods.tip2.content3' })}
        <br />
      </div>
    </div>
  );
};

function DeployStep({
  index, total, replicas, statusData, stepType,
}: { index: number, total: number, replicas: number[], statusData: CLUSTER.ClusterStatusV2, stepType: string }) {
  const intl = useIntl();
  const s = [];
  for (let i = 0; i < total; i += 1) {
    s.push({
      title: intl.formatMessage({ id: 'pages.pods.step' }, { index: i + 1 }),
    });
  }
  return (
    <Steps current={index}>
      {s.map((item, idx) => {
        let icon;
        if (idx < index) {
          icon = smile;
        } else if (idx === index) {
          if (statusData.status === ClusterStatus.SUSPENDED || statusData.status === ClusterStatus.MAINTAINING) {
            icon = waiting;
          } else {
            icon = loading;
          }
        } else {
          icon = waiting;
        }
        return (
          <Step
            key={item.title}
            title={(
              <span>
                {item.title}
                <br />
                {stepType === 'percent' ? `${replicas[idx]}%` : `${replicas[idx]}`}
                {' '}
                {stepType === 'percent' ? intl.formatMessage({ id: 'pages.pods.percent' }) : intl.formatMessage({ id: 'pages.pods.replica' })}
              </span>
            )}
            icon={icon}
          />
        );
      })}
    </Steps>
  );
}

interface DeployPageProps {
  step: CLUSTER.Step,
  onNext: () => void,
  onEnforcePromote: () => void,
  onPause: () => void,
  onPromoteFull: () => void,
  onResume: () => void,
  onAutoPromote: () => void,
  onAutoPromoteCancel: () => void,
  onCancelDeploy: () => void,
  statusData: CLUSTER.ClusterStatusV2,
  nextStepString: string,
  cluster: CLUSTER.ClusterV2,
}

const OperationButton = (props: ButtonProps & { clusterStatus: CLUSTER.ClusterStatusV2 }) => {
  const { disabled, clusterStatus } = props;
  const { status } = clusterStatus;
  return <Button {...props} disabled={status === ClusterStatus.MAINTAINING || disabled} />;
};

function DeployButtons({
  step, cluster, onNext, onEnforcePromote, onPause, onResume, onPromoteFull, onAutoPromote,
  onAutoPromoteCancel, onCancelDeploy, statusData, nextStepString,
}: DeployPageProps) {
  const intl = useIntl();
  const {
    index, total, replicas, manualPaused, autoPromote: ifAutoPromote, stepType,
  } = step;
  const suspension = cluster.templateConfig.app?.spec?.karmada?.suspension;
  // suspension struct: {xxx: false, xx: true}
  const zoneSuspended = suspension ? Object.values(suspension).some((value) => value) : false;
  return (
    <div title={intl.formatMessage({ id: 'pages.pods.deployStep' })}>
      <DeployStep index={index} total={total} replicas={replicas} statusData={statusData} stepType={stepType} />
      <div style={{ textAlign: 'center' }}>
        {
          stepType !== 'percent' && (
            manualPaused ? (
              <OperationButton
                type="primary"
                disabled={!manualPaused || !RBAC.Permissions.resumeCluster.allowed}
                style={{ margin: '0 8px' }}
                onClick={onResume}
                clusterStatus={statusData}
              >
                {intl.formatMessage({ id: 'pages.pods.unpause' })}
              </OperationButton>
            ) : (
              <OperationButton
                type="primary"
                disabled={manualPaused
                  || statusData.status === ClusterStatus.SUSPENDED
                  || !RBAC.Permissions.pauseCluster.allowed}
                style={{ margin: '0 8px' }}
                onClick={onPause}
                clusterStatus={statusData}
              >
                {intl.formatMessage({ id: 'pages.pods.manualPause' })}
              </OperationButton>
            )
          )
        }

        {
          zoneSuspended ? (
            <OperationButton
              type="primary"
              disabled={
                !RBAC.Permissions.deployClusterNext.allowed
                || manualPaused
              }
              style={{ margin: '0 8px' }}
              onClick={onEnforcePromote}
              clusterStatus={statusData}
            >
              {nextStepString}
            </OperationButton>
          ) : (
            <OperationButton
              type="primary"
              disabled={
                !RBAC.Permissions.deployClusterNext.allowed
                || statusData.status !== ClusterStatus.SUSPENDED
                || manualPaused
              }
              style={{ margin: '0 8px' }}
              onClick={onNext}
              clusterStatus={statusData}
            >
              {nextStepString}
            </OperationButton>
          )
        }

        {
          stepType !== 'percent' && (
            <OperationButton
              type="primary"
              disabled={
                !RBAC.Permissions.deployClusterAll.allowed
                || manualPaused
              }
              style={{ margin: '0 8px' }}
              onClick={onPromoteFull}
              clusterStatus={statusData}
            >
              {intl.formatMessage({ id: 'pages.pods.deployAll' })}
            </OperationButton>
          )
        }

        {
          stepType !== 'percent' && (
            ifAutoPromote ? (
              <OperationButton
                danger
                disabled={
                  !RBAC.Permissions.executeAction.allowed
                  || manualPaused
                }
                onClick={onAutoPromoteCancel}
                clusterStatus={statusData}
              >
                {intl.formatMessage({ id: 'pages.pods.cancelAutoDeploy' })}
              </OperationButton>
            ) : (
              <Tooltip title={intl.formatMessage({ id: 'pages.message.cluster.autoDeploy.description' })}>
                <OperationButton
                  type="primary"
                  disabled={
                    !RBAC.Permissions.executeAction.allowed
                    || manualPaused
                  }
                  style={{ margin: '0 8px' }}
                  onClick={onAutoPromote}
                  clusterStatus={statusData}
                >
                  {intl.formatMessage({ id: 'pages.pods.autoDeploy' })}
                </OperationButton>
              </Tooltip>
            )
          )
        }

        {
          stepType !== 'percent' && (
            <OperationButton
              danger
              disabled={
                !RBAC.Permissions.rollbackCluster.allowed
                || !RBAC.Permissions.freeCluster.allowed
              }
              style={{ margin: '0 8px' }}
              onClick={onCancelDeploy}
              clusterStatus={statusData}
            >
              {intl.formatMessage({ id: 'pages.pods.deployCancel' })}
            </OperationButton>
          )
        }
      </div>
    </div>
  );
}

interface RolloutDeployPanelProps {
  clusterStatus: CLUSTER.ClusterStatusV2,
  refresh: () => void,
  initialState: API.InitialState,
  step: CLUSTER.Step,
  cluster: CLUSTER.ClusterV2,
}

function RolloutDeployPanel(props: RolloutDeployPanelProps) {
  const {
    clusterStatus, initialState, refresh, step, cluster,
  } = props;
  const { id, fullPath } = initialState.resource;

  const intl = useIntl();
  const { successAlert } = useModel('alert');

  if (!clusterStatus) {
    return null;
  }

  return (
    <div>
      {
        step && (
          <div>
            <DeployButtons
              statusData={clusterStatus}
              step={step}
              cluster={cluster}
              onNext={
                () => {
                  next(id, step.stepType).then(() => {
                    successAlert(
                      intl.formatMessage(
                        { id: 'pages.message.pods.step.deploy' },
                        { index: step.index + 1 },
                      ),
                    );
                    refresh();
                  });
                }
              }
              onEnforcePromote={
                () => {
                  enforcePromote(id).then(() => {
                    successAlert(
                      intl.formatMessage(
                        { id: 'pages.message.pods.step.deploy' },
                        { index: step.index + 1 },
                      ),
                    );
                    refresh();
                  });
                }
              }
              onPromoteFull={
                () => promoteFull(id).then(() => {
                  successAlert(intl.formatMessage({ id: 'pages.message.cluster.promoteFull.success' }));
                  refresh();
                })
              }
              onPause={
                () => {
                  pause(id).then(() => {
                    successAlert(intl.formatMessage({ id: 'pages.message.cluster.manualPause.success' }));
                    refresh();
                  });
                }
              }
              onResume={
                () => {
                  resume(id).then(() => {
                    successAlert(intl.formatMessage({ id: 'pages.message.cluster.unpause.success' }));
                    refresh();
                  });
                }
              }
              onAutoPromote={
                () => {
                  autoPromote(id).then(() => {
                    successAlert(intl.formatMessage({ id: 'pages.message.cluster.autoDeploy.success' }));
                    refresh();
                  });
                }
              }
              onAutoPromoteCancel={
                () => {
                  cancelAutoPromote(id).then(() => {
                    successAlert(intl.formatMessage({ id: 'pages.message.cluster.autoDeployCancel.success' }));
                    refresh();
                  });
                }
              }
              onCancelDeploy={
                () => {
                  // query latest canRollback pipelinerun
                  listPipelineRuns(id, {
                    pageNumber: 1, pageSize: 1, canRollback: true,
                  }).then(({ data }) => {
                    const { total } = data;
                    // first deploy, just free cluster
                    if (total === 0) {
                      Modal.confirm(
                        {
                          title: (
                            <div style={{ fontWeight: 'bold' }}>
                              {intl.formatMessage({ id: 'pages.message.cluster.deployCancel.confirm' })}
                            </div>
                          ),
                          content: (
                            <div>
                              {intl.formatMessage({ id: 'pages.message.cluster.deployCancel.first.content1' })}
                              <strong style={{ color: 'red' }}>
                                {intl.formatMessage({ id: 'pages.message.cluster.deployCancel.first.content2' })}
                              </strong>
                            </div>
                          ),
                          onOk: () => {
                            freeCluster(id).then(() => {
                              successAlert(intl.formatMessage(
                                { id: 'pages.message.cluster.deployCancel.first.success' },
                              ));
                            });
                          },
                          width: '750px',
                        },
                      );
                    } else {
                      Modal.confirm(
                        {
                          title: (
                            <div style={{ fontWeight: 'bold' }}>
                              {intl.formatMessage({ id: 'pages.message.cluster.deployCancel.confirm' })}
                            </div>
                          ),
                          content: (
                            <div>
                              <strong style={{ color: 'red' }}>
                                {intl.formatMessage({ id: 'pages.message.cluster.deployCancel.content' })}
                              </strong>
                              <br />
                            </div>
                          ),
                          onOk: () => {
                            history.push(`/instances${fullPath}/-/pipelines?category=rollback`);
                          },
                          okText: intl.formatMessage({ id: 'pages.common.confirm' }),
                          width: '750px',
                        },
                      );
                    }
                  });
                }
              }
              nextStepString={intl.formatMessage({ id: 'pages.pods.nextStep' })}
            />
            <Tips />
          </div>
        )
      }
    </div>
  );
}

export default PageWithInitialState(RolloutDeployPanel);
