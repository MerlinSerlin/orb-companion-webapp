import { v4 as uuidv4 } from 'uuid';
import type { OrbEvent, PropertyTemplate } from './types';
import type { OrbInstance } from '@/lib/orb-config';
import { EVENT_TEMPLATES } from './event-templates';

// Generate a random value based on property template
function generateRandomValue(template: PropertyTemplate): string | number {
  switch (template.type) {
    case 'enum':
      if (!template.options || template.options.length === 0) {
        throw new Error('Enum template must have options');
      }
      const randomIndex = Math.floor(Math.random() * template.options.length);
      return template.options[randomIndex];
    
    case 'range':
      if (template.min === undefined || template.max === undefined) {
        throw new Error('Range template must have min and max values');
      }
      return Math.floor(Math.random() * (template.max - template.min + 1)) + template.min;
    
    case 'string':
      return template.default as string || 'default_value';
    
    default:
      throw new Error(`Unknown template type: ${(template as PropertyTemplate).type}`);
  }
}

// Generate idempotency key with UUID + timestamp suffix
function generateIdempotencyKey(): string {
  const uuid = uuidv4();
  const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14); // YYYYMMDDHHMMSS
  return `${uuid}_${timestamp}`;
}

// Generate current UTC timestamp in ISO format
function generateTimestamp(): string {
  return new Date().toISOString();
}

// Build event payload with randomized property values
export function buildRandomizedEventPayload(
  instance: OrbInstance,
  customerId: string,
  externalCustomerId?: string
): OrbEvent {
  // For now, only support AI agents instance
  if (instance !== 'ai-agents') {
    throw new Error(`Event templates only available for ai-agents instance currently`);
  }

  const template = EVENT_TEMPLATES[instance];
  if (!template) {
    throw new Error(`No event template found for instance: ${instance}`);
  }

  // Generate randomized properties
  const properties: Record<string, string | number | boolean> = {};
  for (const [key, propertyTemplate] of Object.entries(template.properties)) {
    properties[key] = generateRandomValue(propertyTemplate);
  }

  // Build the event object
  const event: OrbEvent = {
    idempotency_key: generateIdempotencyKey(),
    event_name: template.eventName,
    timestamp: generateTimestamp(),
    properties,
    ...(externalCustomerId 
      ? { external_customer_id: externalCustomerId }
      : { customer_id: customerId }
    )
  };

  return event;
}

// Build event payload with manual property values
export function buildManualEventPayload(
  instance: OrbInstance,
  customerId: string,
  manualProperties: Record<string, string | number | boolean>,
  externalCustomerId?: string
): OrbEvent {
  // For now, only support AI agents instance
  if (instance !== 'ai-agents') {
    throw new Error(`Event templates only available for ai-agents instance currently`);
  }

  const template = EVENT_TEMPLATES[instance];
  if (!template) {
    throw new Error(`No event template found for instance: ${instance}`);
  }

  // Use manual properties, falling back to defaults for missing values
  const properties: Record<string, string | number | boolean> = {};
  for (const [key, propertyTemplate] of Object.entries(template.properties)) {
    if (key in manualProperties) {
      properties[key] = manualProperties[key];
    } else if (propertyTemplate.default !== undefined) {
      properties[key] = propertyTemplate.default;
    } else {
      // Generate random value as fallback
      properties[key] = generateRandomValue(propertyTemplate);
    }
  }

  // Build the event object
  const event: OrbEvent = {
    idempotency_key: generateIdempotencyKey(),
    event_name: template.eventName,
    timestamp: generateTimestamp(),
    properties,
    ...(externalCustomerId 
      ? { external_customer_id: externalCustomerId }
      : { customer_id: customerId }
    )
  };

  return event;
}