export * from './injector';
export * from './ejector';
export * from './tracing';
import { TraceId as OriginTraceId, Tracer as OriginTracer } from 'zipkin';

export type TraceId = OriginTraceId;
export type Tracer = OriginTracer;
export { HttpHeaders } from 'zipkin';
