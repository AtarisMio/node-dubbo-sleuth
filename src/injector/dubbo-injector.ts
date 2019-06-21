import { HttpHeaders } from 'zipkin';
import { AbstractInjector } from './abstract-injector';

export class DubboInjector extends AbstractInjector {
    public static readonly TRACE_ID_NAME = HttpHeaders.TraceId; // traceIdKey -> 'X-B3-TraceId'
    public static readonly SPAN_ID_NAME = HttpHeaders.SpanId; // spanIdKey -> 'X-B3-SpanId'
    public static readonly PARENT_SPAN_ID_NAME = HttpHeaders.ParentSpanId; // parentSpanIdKey -> 'X-B3-ParentSpanId'
    public static readonly SAMPLED_NAME = HttpHeaders.Sampled; // sampledKey -> 'X-B3-Sampled'
    public static readonly FLAGS_NAME = HttpHeaders.Flags; // debugKey -> 'X-B3-Flags'

    constructor() {
        super(
            DubboInjector.TRACE_ID_NAME,
            DubboInjector.SPAN_ID_NAME,
            DubboInjector.PARENT_SPAN_ID_NAME,
            DubboInjector.SAMPLED_NAME,
            DubboInjector.FLAGS_NAME,
        );
    }
}