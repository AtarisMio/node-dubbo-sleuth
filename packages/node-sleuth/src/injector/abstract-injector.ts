import debug from 'debug';
import { TraceId } from 'zipkin';
import { IInjector } from './i-injector';
const log = debug('dubbo:sleuth:tracing:inject');

// (reference)[!https://github.com/openzipkin/brave/tree/f8c323b7e0cb6c0e6667f62a1ee88b536d060bab/brave/src/main/java/brave/propagation/B3Propagation.java#L82]
export abstract class AbstractInjector implements IInjector {
    constructor(
        public readonly traceIdKey: string,
        public readonly spanIdKey: string,
        public readonly parentSpanIdKey: string,
        public readonly sampledKey: string,
        public readonly debugKey: string,
    ) { }

    public inject(attachments: any, traceId: TraceId) {
        attachments[this.traceIdKey] = traceId.traceId;
        attachments[this.spanIdKey] = traceId.spanId;
        // traceId.parentId !== traceId.spanId 的条件从brave的传输的具体数据来看是这样的
        if (traceId.parentSpanId && traceId.parentSpanId.getOrElse('') === traceId.spanId) {
            attachments[this.parentSpanIdKey] = traceId.spanId;
        }
        if (traceId.isDebug()) {
            attachments[this.debugKey] = '1';
        } else if (traceId.sampled.present) {
            attachments[this.sampledKey] = traceId.sampled.getOrElse(false) ? '1' : '0';
        }
        log('[inject] %s', JSON.stringify(attachments));
    }
}
