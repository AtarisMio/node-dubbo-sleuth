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
//===================== app.ts =====================
import { Application, IBoot } from 'egg';
import { Tracing, DubboInjector } from 'node-dubbo-sleuth';

export default class AppBootHook implements IBoot {
    private readonly app: Application;

    constructor(app) {
        this.app = app;
    }

    async didReady() {
        Tracing.init({
            localServiceName: 'systemname',
            endpointHost: 'localhost',
            endpointPort: 9441,
            injector: new DubboInjector(),
        });
    }
}
//===================== app/dubbo/index.ts =====================
import { sleuth } from 'dubbo-sleuth';
    // same as dubbo2.js config
    dubbo.use(sleuth());
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

        zone.setRootContext('traceId', rootTraceId); // set rootTraceId into dubbo.js zone
        const span = new Span(rootTraceId);
        // same as `node-sleuth` config
    };


//===================== app/dubbo/index.ts =====================
import { sleuth, Span } from 'dubbo-sleuth';
import zone from 'zone-context';
    // same as dubbo2.js config
    dubbo.use(
        sleuth({
            createTraceId(tracer) {
                // get rootTraceId from dubbo.js zone
                const traceId = zone.get('traceId');
                tracer.setId(traceId);
                return tracer.createChildId();
            },
        }),
    );
    // then you will tracing by zipkin. 
```
