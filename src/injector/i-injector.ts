import { TraceId } from "zipkin";

export interface IInjector {
    inject(attachments: Object, traceId: TraceId): void;
}
