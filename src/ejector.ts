import debug from 'debug';
import { HttpHeaders, option, RequestZipkinHeaders, TraceId } from 'zipkin';

const log = debug('dubbo:sleuth:tracing');

export interface IEjector {
    eject(ctx: RequestZipkinHeaders): option.IOption<TraceId>;
}

export abstract class AbstractEjector implements IEjector {
    constructor(public readonly traceIdKey: string,
        public readonly spanIdKey: string,
        public readonly parentSpanIdKey: string,
        public readonly sampledKey: string,
        public readonly debugKey: string) { }

    private readHeader(headers: any, name: string): option.IOption<string> {
        return headers[name] ? new option.Some(headers[name]) : option.None;
    }

    private stringToBoolean(str: string): boolean {
        return str === '1' || str === 'true';
    }

    private stringToIntOption(str: string): option.IOption<number> {
        try {
            return new option.Some(Number.parseInt(str));
        } catch (err) {
            return option.None;
        }
    }

    public eject(headers: Object) {
        const spanId = this.readHeader(headers, this.spanIdKey);
        const traceId = this.readHeader(headers, this.traceIdKey);
        const parentSpanId = this.readHeader(headers, this.parentSpanIdKey);
        const sampled = this.readHeader(headers, this.sampledKey);
        const debug = this.readHeader(headers, this.debugKey).flatMap(this.stringToIntOption).getOrElse(0);
        const parentId = spanId.map(sid => new TraceId({
            spanId: sid,
            traceId: traceId,
            parentId: parentSpanId,
            sampled: sampled.map(this.stringToBoolean),
            flags: debug,
        }));
        parentId.ifPresent(pid => log(`[eject] ${pid.toString()}`));
        return parentId;
    }
}

export class Ejector extends AbstractEjector {
    public static readonly TRACE_ID_NAME = HttpHeaders.TraceId; // traceIdKey -> 'X-B3-TraceId'
    public static readonly SPAN_ID_NAME = HttpHeaders.SpanId; // spanIdKey -> 'X-B3-SpanId'
    public static readonly PARENT_SPAN_ID_NAME = HttpHeaders.ParentSpanId; // parentSpanIdKey -> 'X-B3-ParentSpanId'
    public static readonly SAMPLED_NAME = HttpHeaders.Sampled; // sampledKey -> 'X-B3-Sampled'
    public static readonly FLAGS_NAME = HttpHeaders.Flags; // debugKey -> 'X-B3-Flags'

    constructor() {
        super(
            Ejector.TRACE_ID_NAME,
            Ejector.SPAN_ID_NAME,
            Ejector.PARENT_SPAN_ID_NAME,
            Ejector.SAMPLED_NAME,
            Ejector.FLAGS_NAME,
        );
    }
}