import { HttpHeaders, TraceId } from 'zipkin';
import { AbstractInjector } from './abstract-injector';

export class ProxyInjector extends AbstractInjector {
    public static readonly TRACE_ID_NAME = HttpHeaders.TraceId; // traceIdKey -> 'X-B3-TraceId'
    public static readonly SPAN_ID_NAME = HttpHeaders.SpanId; // spanIdKey -> 'X-B3-SpanId'
    public static readonly PARENT_SPAN_ID_NAME = HttpHeaders.ParentSpanId; // parentSpanIdKey -> 'X-B3-ParentSpanId'
    public static readonly SAMPLED_NAME = HttpHeaders.Sampled; // sampledKey -> 'X-B3-Sampled'
    public static readonly FLAGS_NAME = HttpHeaders.Flags; // debugKey -> 'X-B3-Flags'

    constructor() {
        super(
            ProxyInjector.TRACE_ID_NAME,
            ProxyInjector.SPAN_ID_NAME,
            ProxyInjector.PARENT_SPAN_ID_NAME,
            ProxyInjector.SAMPLED_NAME,
            ProxyInjector.FLAGS_NAME,
        );
    }

    /**
     * inject traceId into proxy request header
     * @param headers proxy request header
     * @param traceId trace id
     */
    public inject(headers: Object, traceId: TraceId) {
        super.inject(headers, traceId);
    }
}