import debug from 'debug';
import { BatchRecorder, Context, InetAddress, jsonEncoder as Encoder, JsonEncoder, Logger, model, Recorder, TraceId, Tracer } from 'zipkin';
import CLSContext from 'zipkin-context-cls';
import { HttpLogger } from 'zipkin-transport-http';
import { HttpEjector, IEjector } from './ejector';
import { HttpInjector, IInjector } from './injector';

const log = debug('dubbo:sleuth:tracing');

export const Span = model.Span;
export type Span = model.Span;
export const Endpoint = model.Endpoint;
export type Endpoint = model.Endpoint;

export interface IConstructorArgs {
    /**
     * root trace id
     */
    traceId?: TraceId;
    /**
     * context name, if you have multiple sleuth it is useful, default `zipkin`
     */
    ctxName?: string;
    /**
     * context implement, default `zipkin-context-cls`
     */
    ctxImpl?: Context<TraceId>;
    /**
     * current system name, will report to zipkin server
     */
    localServiceName: string;
    /**
     * zipkin server host, `http://${endpointHost}:${endpointPort}/api/v2/spans`
     */
    endpointHost?: string;
    /**
     * zipkin server port, `http://${endpointHost}:${endpointPort}/api/v2/spans`
     */
    endpointPort?: string;
    /**
     * zipkin server endpoint, will ignore `endpointHost`, `endpointPort`
     */
    endpoint?: string;
    /**
     * timeout for send zipkin trace
     */
    httpTimeout?: number;
    /**
     * zipkin json encoder
     */
    jsonEncoder?: JsonEncoder;
    /**
     * zipkin recorder
     */
    recorder?: Recorder;
    /**
     * injector, inject `traceId` to next service
     */
    injector?: IInjector;
    /**
     * ejector, eject `traceId` from previous service
     */
    ejector?: IEjector;
}

export class Tracing {
    private static _tracer: Tracer;
    private static _logger: Logger;
    private static _injector: IInjector;
    private static _ejector: IEjector;
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

    static get ejector() {
        if (!Tracing._ejector) {
            throw Error('[uninitial] Tracing');
        }
        return Tracing._ejector;
    }

    static get hasRootTracer() {
        return !!Tracing._hasRootTracer;
    }

    static set hasRootTracer(value: boolean) {
        Tracing._hasRootTracer = !!value;
    }

    static get ip() {
        return InetAddress.getLocalAddress().ipv4();
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
            Tracing._injector = new HttpInjector();
        }
        if (args.ejector) {
            Tracing._ejector = args.ejector;
        } else {
            Tracing._ejector = new HttpEjector();
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