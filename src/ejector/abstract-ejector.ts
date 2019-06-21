import debug from 'debug';
import { option, TraceId } from 'zipkin';
import { IEjector } from './i-ejector';

const log = debug('dubbo:sleuth:tracing:ejector');

export abstract class AbstractEjector implements IEjector {
    constructor(
        public readonly traceIdKey: string,
        public readonly spanIdKey: string,
        public readonly parentSpanIdKey: string,
        public readonly sampledKey: string,
        public readonly debugKey: string,
    ) { }

    private readOption(obj: any, name: string): option.IOption<string> {
        return obj[name] ? new option.Some(obj[name]) : option.None;
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

    public eject(obj: Object) {
        const spanId = this.readOption(obj, this.spanIdKey);
        const traceId = this.readOption(obj, this.traceIdKey);
        const parentSpanId = this.readOption(obj, this.parentSpanIdKey);
        const sampled = this.readOption(obj, this.sampledKey);
        const debug = this.readOption(obj, this.debugKey).flatMap(this.stringToIntOption).getOrElse(0);
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