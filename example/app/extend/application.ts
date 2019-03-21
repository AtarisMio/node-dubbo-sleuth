import { Application } from 'egg';
import { DubboService, dubbo } from '../dubbo';

const DUBBO_SYMBOL = Symbol('Application.Dubbo');

export default {
    get dubbo(this: Application): DubboService {
        if (!(this as any)[DUBBO_SYMBOL]) {
            (this as any)[DUBBO_SYMBOL] = dubbo(this);
        }
        return (this as any)[DUBBO_SYMBOL];
    },
};
