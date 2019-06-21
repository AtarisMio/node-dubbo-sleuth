import { Context } from 'koa';
import { HttpHeaders, TraceId } from 'zipkin';
import { AbstractInjector } from './abstract-injector';

export class HttpInjector extends AbstractInjector {
    public static readonly TRACE_ID_NAME = HttpHeaders.TraceId; // traceIdKey -> 'X-B3-TraceId'
    public static readonly SPAN_ID_NAME = HttpHeaders.SpanId; // spanIdKey -> 'X-B3-SpanId'
    public static readonly PARENT_SPAN_ID_NAME = HttpHeaders.ParentSpanId; // parentSpanIdKey -> 'X-B3-ParentSpanId'
    public static readonly SAMPLED_NAME = HttpHeaders.Sampled; // sampledKey -> 'X-B3-Sampled'
    public static readonly FLAGS_NAME = HttpHeaders.Flags; // debugKey -> 'X-B3-Flags'

    constructor() {
        super(
            HttpInjector.TRACE_ID_NAME,
            HttpInjector.SPAN_ID_NAME,
            HttpInjector.PARENT_SPAN_ID_NAME,
            HttpInjector.SAMPLED_NAME,
            HttpInjector.FLAGS_NAME,
        );
    }

    public inject(ctx: Context, traceId: TraceId) {
        super.inject(new Proxy(ctx, {
            set(ctx, p, value) {
                ctx.set(p as string, value);
                return true;
            },
        }), traceId);
    }
}