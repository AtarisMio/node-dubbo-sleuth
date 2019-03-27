import debug from 'debug';
import { Context, java } from '@58qf/dubbo2.js';
import { InetAddress, model, TraceId, Tracer } from 'zipkin';
import { IConstructorArgs, Tracing } from './tracing';

const log = debug('dubbo:sleuth');

export const Span = model.Span;
export const Endpoint = model.Endpoint;

interface IWhatYouWantToDo {
    createTraceId?(tracer: Tracer): TraceId;
    createSpan?(traceId: TraceId): model.Span;
    beforeSend?(ctx: Context, span: model.Span): Promise<void>;
    sendSpan?(span: model.Span): void;
}

export function sleuth(args: IConstructorArgs): (args?: IWhatYouWantToDo) => Function {
    log('[initialize] Sleuth');
    const tracer = Tracing.init(args);
    return ({
        createTraceId = (tracer: Tracer) => Tracing.hasRootTracer ? tracer.createChildId() : tracer.createRootId(),
        createSpan = (traceId: TraceId) => new model.Span(traceId),
        beforeSend = async () => { return; },
        sendSpan = (span: model.Span) => Tracing.logger.logSpan(span),
    }: IWhatYouWantToDo = {}) => async function dubboMiddlewareSleuth(ctx: Context, next: Function) {
        const traceId = createTraceId(tracer);
        const span = createSpan(traceId);

        span.setKind('CLIENT');
        span.setName(`${(ctx.dubboInterface || '').replace(/.*?([^\.]+)$/, '$1')}/${ctx.methodName}`);
        span.setLocalEndpoint(new model.Endpoint({ serviceName: ctx.application.name, ipv4: InetAddress.getLocalAddress().ipv4() }));

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
        span.setRemoteEndpoint(new model.Endpoint({ ipv4: ctx.invokeHost, port: ctx.invokePort }));
        sendSpan(span);
    }
}
