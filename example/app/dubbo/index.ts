import { Context, Dubbo, setting } from 'dubbo2.js';

import { Application } from 'egg';
import services from './services';
import { sleuth } from '../../../src';

export type DubboService = Dubbo<typeof services>;

export const dubbo = (app: Application) => {
    const { dubbo: dubboConfig = {} } = app.config || {};
    const { enabled,
            register,
            zkRoot,
            dubboInvokeTimeout,
    } = dubboConfig;
    if (!enabled) {
        app.coreLogger.info('[Dubbo] dubbo was disabled');
        return;
    }

    const dubbo = new Dubbo<typeof services>({
        application: { name: app.config.name },
        register: register!,
        zkRoot,
        dubboInvokeTimeout,
        service: services,
        dubboSetting: setting.match([ 'com.example.testService' ]),
    });

    if (app.config.env !== 'prod') {
        dubbo.use(async (ctx: Context, next: any) => {
            const start = Date.now();
            await next();
            const end = Date.now();
            if (!ctx.body.err) {
                app.logger.debug(`
[Dubbo:RpcInvoke] SPEND : ${end - start} ms
================================= start =================================
[Invoke:Method] ${ctx.dubboInterface}::${ctx.methodName}
[Invoke:Response] ${JSON.stringify(ctx.body)}
[Invoke:args]${JSON.stringify(ctx.methodArgs)}
=================================  end  =================================`);
            }
        });
    }

    dubbo.use(sleuth({
        localServiceName: app.config.name || 'egg',
        // endpointHost: 'localhost',
        // endpointPort: '9411',
    }));

    const oldReady = dubbo.ready.bind(dubbo);
    dubbo.ready = async () => {
        const ret = await oldReady();
        app.coreLogger.info('[Dubbo] dubbo was ready');
        return ret;
    };

    return dubbo;
};
