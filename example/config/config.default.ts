import { EggAppConfig, EggAppInfo, PowerPartial } from 'egg';

export interface BizConfig {
  dubbo: {
      enabled: boolean;
      application: { name: string };
      register: string;
      zkRoot: string;
      dubboInvokeTimeout: number;
  };
}

export default (appInfo: EggAppInfo) => {
  const config = {} as PowerPartial<EggAppConfig>;

  // override config from framework / plugin
  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1553144060616_8793';

  // add your egg config in here
  config.middleware = [];

  // add your special config in here
  const bizConfig: PowerPartial<EggAppConfig> = {
    // sourceUrl: `https://github.com/eggjs/examples/tree/master/${appInfo.name}`,
    dubbo: {
      enabled: true,
      register: 'localhost:2181',
      zkRoot: 'beta-a',
      dubboInvokeTimeout: 30,
    },
  };

  // the return config will combines to EggAppConfig
  return {
    ...config,
    ...bizConfig,
  };
};
