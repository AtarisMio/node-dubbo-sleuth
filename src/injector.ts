import debug from 'debug';
import { HttpHeaders, TraceId } from 'zipkin';

const log = debug('dubbo:sleuth:tracing');

export interface IInjector {
    inject(attachments: Object, traceId: TraceId): void;
}

// (reference)[!https://github.com/openzipkin/brave/tree/f8c323b7e0cb6c0e6667f62a1ee88b536d060bab/brave/src/main/java/brave/propagation/B3Propagation.java#L82]
export abstract class AbstractInjector implements IInjector {
    constructor(public readonly traceIdKey: string,
    public readonly spanIdKey: string,
    public readonly parentSpanIdKey: string,
    public readonly sampledKey: string,
    public readonly debugKey: string) { }
    
    public inject(attachments: any, traceId: TraceId) {
        attachments[this.traceIdKey] = traceId.traceId;
        attachments[this.spanIdKey] = traceId.spanId;
        // traceId.parentId !== traceId.spanId 的条件从brave的传输的具体数据来看是这样的
        if (traceId.parentId && traceId.parentId !== traceId.spanId) {
            attachments[this.parentSpanIdKey] = traceId.parentId;
        }
        if (traceId.isDebug()) {
            attachments[this.debugKey] = '1';
        } else if (traceId.sampled.present) {
            attachments[this.sampledKey] = traceId.sampled.getOrElse(false) ? '1' : '0';
        }
        log('[inject] %s', JSON.stringify(attachments));
    }
}

export class Injector extends AbstractInjector {
    public static readonly TRACE_ID_NAME = HttpHeaders.TraceId; // traceIdKey -> 'X-B3-TraceId'
    public static readonly SPAN_ID_NAME = HttpHeaders.SpanId; // spanIdKey -> 'X-B3-SpanId'
    public static readonly PARENT_SPAN_ID_NAME = HttpHeaders.ParentSpanId; // parentSpanIdKey -> 'X-B3-ParentSpanId'
    public static readonly SAMPLED_NAME = HttpHeaders.Sampled; // sampledKey -> 'X-B3-Sampled'
    public static readonly FLAGS_NAME = HttpHeaders.Flags; // debugKey -> 'X-B3-Flags'

    constructor() {
        super(
            Injector.TRACE_ID_NAME,
            Injector.SPAN_ID_NAME,
            Injector.PARENT_SPAN_ID_NAME,
            Injector.SAMPLED_NAME,
            Injector.FLAGS_NAME,
        );
    }
}