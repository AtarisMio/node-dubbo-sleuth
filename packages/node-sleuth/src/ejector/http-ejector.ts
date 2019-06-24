import { HttpHeaders } from 'zipkin';
import { AbstractEjector } from './abstract-ejector';
import { Context } from 'koa';

export class HttpEjector extends AbstractEjector {
    public static readonly TRACE_ID_NAME = HttpHeaders.TraceId; // traceIdKey -> 'X-B3-TraceId'
    public static readonly SPAN_ID_NAME = HttpHeaders.SpanId; // spanIdKey -> 'X-B3-SpanId'
    public static readonly PARENT_SPAN_ID_NAME = HttpHeaders.ParentSpanId; // parentSpanIdKey -> 'X-B3-ParentSpanId'
    public static readonly SAMPLED_NAME = HttpHeaders.Sampled; // sampledKey -> 'X-B3-Sampled'
    public static readonly FLAGS_NAME = HttpHeaders.Flags; // debugKey -> 'X-B3-Flags'

    constructor() {
        super(
            HttpEjector.TRACE_ID_NAME,
            HttpEjector.SPAN_ID_NAME,
            HttpEjector.PARENT_SPAN_ID_NAME,
            HttpEjector.SAMPLED_NAME,
            HttpEjector.FLAGS_NAME,
        );
    }

    /**
     * eject trace id from http request header
     * @param ctx koa context
     */
    public eject(ctx: Context) {
        return super.eject(ctx.headers);
    }
}