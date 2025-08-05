// Event schema types based on Orb API documentation
// https://docs.withorb.com/api-reference/event/ingest-events

export type OrbEvent = {
  idempotency_key: string;
  event_name: string;
  timestamp: string; // ISO 8601 format with UTC timezone (YYYY-MM-DDTHH:MM:SSZ)
  properties: Record<string, string | number | boolean>; // Required by Orb SDK
} & (
  | { customer_id: string; external_customer_id?: never }
  | { external_customer_id: string; customer_id?: never }
);

export type IngestEventsRequest = {
  events: OrbEvent[];
};

export type IngestEventsResponse = {
  // Orb API response structure - using flexible type to match SDK
  [key: string]: unknown;
} | unknown;

// AI Agents specific event properties
export type AIAgentEventProperties = {
  model: string;
  num_steps: number;
  num_tokens: number;
  user_id: string;
};

// Cloud Infrastructure specific event properties
export type CloudInfraEventProperties = {
  bandwidth_MB: number;
  runtime: string;
};

// Template configuration types
export type PropertyTemplate = {
  type: 'enum' | 'range' | 'string';
  options?: string[];
  min?: number;
  max?: number;
  default?: string | number;
};

export type EventTemplate = {
  eventName: string;
  properties: Record<string, PropertyTemplate>;
};

// Server action result types
export type SendEventResult = {
  success: boolean;
  event?: OrbEvent;
  error?: string;
  debug?: {
    payload: IngestEventsRequest;
    response?: unknown;
  };
};