import { Context } from 'dubbo2.js';
import debug from 'debug';
import { model } from 'zipkin';
import { Tracing, IConstructorArgs } from './tracing';

const log = debug('dubbo:sleuth');

export function sleuth(args: IConstructorArgs): Function {
    log('[initialize] Sleuth');
    const tracer = Tracing.init(args);
    return async function dubboMiddlewareSleuth(ctx: Context, next: Function) {
        const traceId = Tracing.hasRootTracer ? tracer.createChildId() : tracer.createRootId();
        const span = new model.Span(traceId);
        span.setKind('CLIENT');
        span.setName(`${(ctx.dubboInterface || '').replace(/.*?([^\.]+)$/, '$1')}/${ctx.methodName}`);
        span.setLocalEndpoint(new model.Endpoint({ serviceName: ctx.application.name }))
        span.putTag('args', JSON.stringify(ctx.methodArgs));
        Tracing.injector.inject(ctx.attachments, traceId);
        const startTime = Date.now();
        span.setTimestamp(startTime * 1000);
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
        Tracing.logger.logSpan(span);
    }
}
