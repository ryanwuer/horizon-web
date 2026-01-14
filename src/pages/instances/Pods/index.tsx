import { useModel } from '@@/plugin-model/useModel';
import { useRequest } from '@@/plugin-request/request';
import { getClusterV2 } from '@/services/clusters/clusters';
import { isVersion2 } from '@/services/version/version';
import PodsV1 from './v1';
import PodsV2 from './v2';
import VM from './v2/vm';
import { queryTemplate } from '@/services/templates/templates';
import { CatalogType } from '@/services/core';
import { CenterSpin } from '@/components/Widget';

export default () => {
  const { initialState } = useModel('@@initialState');
  const { id } = initialState!.resource;
  const { data: clusterDataV2 } = useRequest(() => getClusterV2(id));
  const { data: template } = useRequest(() => queryTemplate(clusterDataV2?.templateInfo?.name), {
    ready: !!clusterDataV2,
  });

  const isVirtualMachine = template && template.type === CatalogType.VirtualMachine;

  if (clusterDataV2) {
    if (isVirtualMachine) {
      return <VM />;
    }
    return (
      isVersion2(clusterDataV2) ? <PodsV2 /> : <PodsV1 />
    );
  }
  return <CenterSpin />;
};
