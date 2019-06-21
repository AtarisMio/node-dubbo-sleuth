import { option, TraceId } from 'zipkin';

export interface IEjector {
    eject(obj: Object): option.IOption<TraceId>;
}