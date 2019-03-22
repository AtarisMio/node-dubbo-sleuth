# dubbo-sleuth

---

[![NPM](https://nodei.co/npm/dubbo-sleuth.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/dubbo-sleuth)

dubbo-sleuth = dubbo2.js + zipkin-js

## Thanks a lots of [Dubbo2.js](https://github.com/dubbo/dubbo2.js)

# Features

---

1. Keep it Simple. (follow dubbo2.js)
2. More details which you can handle.
3. Senseless integration for brave.
4. Typescript type definitions.


# Getting Started

## How to Usage?

### basic useage

```ts
//===================== app/dubbo/index.ts =====================
import { sleuth } from 'dubbo-sleuth';
    // same as dubbo2.js config
    dubbo.use(
        sleuth({
            localServiceName: app.config.name || 'egg',
            endpointHost: 'localhost',
            endpointPort: '9411'
        })(), // the brackets is very important.
    );
    // then you will tracing by zipkin. 
```

### advanced useage

tracing from http request

```ts
//===================== app/middleware/tracing.ts =====================
import { Endpoint, Span, Tracing } from 'dubbo-sleuth';
import { Application, Context } from 'egg';
import zone from 'zone-context';

// you can config it match only /api/*
export default (_config: any, app: Application) =>
    async (ctx: Context, next: Function) => {
        const traceIdEjected = Tracing.ejector.eject(ctx.headers);
        const rootTraceId = traceIdEjected.getOrElse(() => Tracing.tracer.createRootId()); // get TraceId from Http Headers
        zone.setRootContext('traceId', rootTraceId);
        const span = new Span(rootTraceId);
 
        span.setKind('SERVER');
        span.setName(`${app.config.name}/${ctx.path}`);
        span.putTag('method', ctx.method);
        span.putTag('protocol', ctx.protocol);
        span.putTag('query', JSON.stringify(ctx.queries));
        span.putTag('body', JSON.stringify(ctx.request.body));
 
        span.setTimestamp(ctx.starttime * 1000);
        span.setRemoteEndpoint(new Endpoint({ ipv4: ctx.ip }));
        span.setLocalEndpoint(new Endpoint({ serviceName: app.config.name, ipv4: Tracing.ip, port: ctx.protocol === 'http' ? 80 : 443 })); // maybe is arbitrary
 
        await next();
 
        span.setDuration((Date.now() - ctx.starttime) * 1000);
        if (ctx.body.success === false || ctx.body.err || ctx.body.error || ctx.body.code !== 0) {
            span.putTag('error', '1');
        }
        span.putTag('result', JSON.stringify(ctx.body));
        Tracing.logger.logSpan(span);
        if (!traceIdEjected.present) {
            const willHeaders = {};
            Tracing.injector.inject(willHeaders, rootTraceId);
            Object.keys(willHeaders).map(name => ctx.set(name, willHeaders[name]));
        }
    };


//===================== app/dubbo/index.ts =====================
import { sleuth, Span } from 'dubbo-sleuth';
import zone from 'zone-context';
    // same as dubbo2.js config
    dubbo.use(
        sleuth({
            localServiceName: app.config.name || 'egg',
            endpointHost: 'localhost',
            endpointPort: '9411'
        })({
            createTraceId(tracer) {
                const traceId = zone.get('traceId');
                tracer.setId(traceId);
                return tracer.createChildId();
            },
        }),
    );
    // then you will tracing by zipkin. 
```
