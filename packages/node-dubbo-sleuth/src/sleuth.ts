import { Context, java } from 'dubbo2.js';
import debug from 'debug';
import { Endpoint, Span, TraceId, Tracer, Tracing } from 'node-sleuth';

const log = debug('dubbo:sleuth');

interface IWhatYouWantToDo {
    createTraceId?(tracer: Tracer): TraceId;
    createSpan?(traceId: TraceId): Span;
    beforeSend?(ctx: Context, span: Span): Promise<void>;
    sendSpan?(span: Span): void;
}

export function sleuth({
    createTraceId = (tracer: Tracer) => Tracing.hasRootTracer ? tracer.createChildId() : tracer.createRootId(),
    createSpan = (traceId: TraceId) => new Span(traceId),
    beforeSend = async () => { return; },
    sendSpan = (span: Span) => Tracing.logger.logSpan(span),
}: IWhatYouWantToDo = {}) {
    return async function dubboMiddlewareSleuth(ctx: Context, next: Function) {
        const traceId = createTraceId(Tracing.tracer);
        log('[info] traceId %s', traceId.traceId);
        const span = createSpan(traceId);

        span.setKind('CLIENT');
        span.setName(`${(ctx.dubboInterface || '').replace(/.*?([^\.]+)$/, '$1')}/${ctx.methodName}`);
        span.setLocalEndpoint(new Endpoint({ serviceName: ctx.application.name, ipv4: Tracing.ip }));

        span.putTag('args', JSON.stringify(java.revert(ctx.methodArgs)));
        Tracing.injector.inject(ctx.attachments, traceId);

        const startTime = Date.now();
        span.setTimestamp(startTime * 1000);
        await beforeSend(ctx, span);
        await next();
        span.setDuration((Date.now() - startTime) * 1000);
        if (ctx.body.err) {
            span.putTag('error', ctx.body.err.toString());
            span.putTag('dubbo.error_msg', ctx.body.err.message);
        } else {
            const result = JSON.stringify(ctx.body.res);
            span.putTag('result', result);
        }
        span.setRemoteEndpoint(new Endpoint({ ipv4: ctx.invokeHost, port: ctx.invokePort }));
        sendSpan(span);
    }
}
