import { Card } from 'antd';
import { Ref, forwardRef } from 'react';
import { RolloutDeployPanel } from '@/components/rollout';

interface StepCardProps {
  // eslint-disable-next-line react/require-default-props
  step?: CLUSTER.Step,
  refresh: () => void
  clusterStatus: CLUSTER.ClusterStatusV2,
  cluster: CLUSTER.ClusterV2,
}

const StepCard = forwardRef((props: StepCardProps, ref: Ref<HTMLDivElement>) => {
  const {
    step, refresh, clusterStatus, cluster,
  } = props;

  if (!step || step.total === 0) {
    return <div />;
  }

  return (
    <div ref={ref}>
      <Card>
        <RolloutDeployPanel step={step} refresh={refresh} clusterStatus={clusterStatus} cluster={cluster} />
      </Card>
    </div>
  );
});

export default StepCard;
