import debug from 'debug';
import { BatchRecorder, Context, jsonEncoder as Encoder, JsonEncoder, Logger, Recorder, TraceId, Tracer } from 'zipkin';
import CLSContext from 'zipkin-context-cls';
import { HttpLogger } from 'zipkin-transport-http';
import { IInjector, Injector } from './injector';

const log = debug('dubbo:sleuth:tracing');

// const MyConsole = new Proxy<Console>({} as any, { get(_, p) { return log.bind(log, p); } });

export interface IConstructorArgs {
    traceId?: TraceId;
    ctxName?: string;
    ctxImpl?: Context<TraceId>;
    localServiceName: string;
    endpointHost?: string;
    endpointPort?: string;
    endpoint?: string;
    httpTimeout?: number;
    jsonEncoder?: JsonEncoder;
    recorder?: Recorder;
    injector?: IInjector;
}
export class Tracing {
    private static _tracer: Tracer;
    private static _logger: Logger;
    private static _injector: IInjector;
    private static _hasRootTracer: boolean;

    static get tracer() {
        if (!Tracing._tracer) {
            throw Error('[uninitial] Tracing');
        }
        return Tracing._tracer;
    }

    static get logger() {
        if (!Tracing._tracer) {
            throw Error('[uninitial] Tracing');
        }
        return Tracing._logger;
    }

    static get injector() {
        if (!Tracing._injector) {
            throw Error('[uninitial] Tracing');
        }
        return Tracing._injector;
    }

    static get hasRootTracer() {
        return !!Tracing._hasRootTracer;
    }

    private constructor(args: IConstructorArgs) {
        log('[constructor] Tracing');
        const {
            ctxName = 'zipkin',
            ctxImpl,
            recorder: InputRecorder,
            localServiceName,
            jsonEncoder = Encoder.JSON_V2,
            endpointHost = 'localhost',
            endpointPort = '9411',
            endpoint,
            httpTimeout = 500,
        } = args;
        const context: Context<TraceId> = ctxImpl ? ctxImpl : new CLSContext(ctxName) as unknown as Context<TraceId>;
        Tracing._logger = InputRecorder ? (InputRecorder as any).logger : new HttpLogger({
            endpoint: endpoint ? endpoint : `http://${endpointHost}:${endpointPort}/api/v2/spans`,
            httpTimeout,
            jsonEncoder,
            // log: MyConsole,
        });
        const recorder = InputRecorder ? InputRecorder : new BatchRecorder({
            logger: Tracing._logger,
        });
        Tracing._tracer = new Tracer({
            ctxImpl: context as any,
            localServiceName,
            recorder,
            // log: MyConsole,
        });
        if (args.traceId) {
            Tracing._hasRootTracer = true;
            Tracing.tracer.setId(args.traceId);
        }
        if (args.injector) {
            Tracing._injector = args.injector;
        } else {
            Tracing._injector = new Injector();
        }
        return Tracing.tracer;
    }

    public static init(args: IConstructorArgs): Tracer {
        try {
            if (Tracing.tracer) {
                log('[hasInitialized] Tracing');
                return Tracing.tracer;
            }
        } catch (e) {
            new Tracing(args);
        } finally {
            return Tracing.tracer;
        }
    }
}