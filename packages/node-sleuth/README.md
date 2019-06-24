# `node-sleuth`

> A zipkin sleuth impelement for general node.

## Usage

### init node-sleuth at startup

```ts
import { Tracing, ProxyInjector } from 'node-sleuth';

Tracing.init({
    localServiceName: 'systemname',
    endpointHost: 'localhost',
    endpointPort: 9441,
    injector: new ProxyInjector(),
});
```

### create a koa middleware for eject traceId from http headers

```ts
import { Tracing } from 'node-sleuth';

app.use(async (ctx: Context, next: () => Promise<any>) => {
    const traceIdEjected = Tracing.ejector.eject(ctx);
    /**
     * if there isnot a traceId then generate a new TraceId
     */
    const rootTraceId = traceIdEjected.getOrElse(() => Tracing.tracer.createRootId());

    // set traceId into tracer for inject create children traceId
    Tracing.tracer.setId(rootTraceId);

    const span = new Span(rootTraceId);

    // put some thing into trace span
    span.setKind('SERVER');
    span.setName(`${app.config.name}${ctx.path}`);
    span.putTag('method', ctx.method);
    span.putTag('protocol', ctx.protocol);
    span.putTag('query', JSON.stringify(removeTFromQuery(ctx.queries)));
    span.putTag('body', JSON.stringify(ctx.request.body));

    span.setTimestamp(ctx.starttime * 1000);
    span.setRemoteEndpoint(new Endpoint({ ipv4: ctx.ip }));
    span.setLocalEndpoint(new Endpoint({ serviceName: app.config.name, ipv4: Tracing.ip, port: ctx.protocol === 'http' ? 80 : 443 })); // maybe is arbitrary

    try {
        await next();
        span.setDuration((Date.now() - ctx.starttime) * 1000);
        if (!ctx.body) {
            span.putTag('error', '1');
            span.putTag('NotFound', '1');
        } else {
            if (ctx.body.success === false || ctx.body.err || ctx.body.error || ctx.body.code !== 0) {
                span.putTag('error', '1');
            }
            span.putTag('result', JSON.stringify(ctx.body));
        }
        Tracing.logger.logSpan(span);
    } catch (error) {
        span.putTag('error', '1');
        if (error.code) {
            span.putTag('error_code', error.code);
        }
        if (error.message) {
            span.putTag('error_msg', error.message);
        }
        if (error.stack) {
            span.putTag('error_stack', error.stack);
        }
        Tracing.logger.logSpan(span);
        throw error;
    }
})
```

### inject traceId into proxy headers

```ts
import { Tracing } from 'node-sleuth';

export default class ProxyController extends Controller {
    index() {
        const proxyHeaders = {
            ...request.headers,
            host,
            'bff-proxy': true,
        };
        const traceId = Tracing.tracer.createChildId();
        Tracing.injector.inject(proxyHeaders, traceId);
        span.setKind('CLIENT');
        span.putTag('PROXY', '1');
        span.setTimestamp(ctx.starttime * 1000);
        try {
            // @ts-ignore
            res = await this.ctx.curl(`http://${backendHost(this.ctx, request.path)}${request.originalUrl}`, {
                method: method as RequestOptions['method'],
                stream: this.ctx.request.req,
                headers: proxyHeaders,
                streaming: true,
                gzip: !!this.ctx.request.acceptsEncodings('gzip'),
                beforeRequest: writeTracingHeaders(this.ctx),
            });
            span.setDuration((Date.now() - ctx.starttime) * 1000);
            Tracing.logger.logSpan(span);
        } catch (error) {
            span.putTag('error', '1');
            if (error.code) {
                span.putTag('error_code', error.code);
            }
            if (error.message) {
                span.putTag('error_msg', error.message);
            }
            if (error.stack) {
                span.putTag('error_stack', error.stack);
            }
            Tracing.logger.logSpan(span);
            this.app.emit('error', error);
            throw new BackendError(500, '连接失败');
        }
    }
}
```