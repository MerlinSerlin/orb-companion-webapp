import type { EventTemplate } from './types';

// AI Agents event template
export const AI_AGENTS_TEMPLATE: EventTemplate = {
  eventName: 'agent_request',
  properties: {
    model: {
      type: 'enum',
      options: [
        'claude-opus-4',
        'claude-sonnet-4', 
        'claude-sonnet-3.7',
        'o3',
        'o4-mini',
        'gemini-2.5-flash',
        'gemini-2.5-pro'
      ],
      default: 'claude-sonnet-4'
    },
    num_steps: {
      type: 'range',
      min: 1,
      max: 100,
      default: 50
    },
    num_tokens: {
      type: 'range',
      min: 100,
      max: 10000,
      default: 1000
    },
    user_id: {
      type: 'enum',
      options: ['Sarah', 'Hari', 'Taylor', 'Marshall'],
      default: 'Sarah'
    }
  }
};

// Cloud Infrastructure event template
export const CLOUD_INFRA_TEMPLATE: EventTemplate = {
  eventName: 'Nimbus_Scale_Network_Request',
  properties: {
    bandwidth_bytes: {
      type: 'range',
      min: 10000000,
      max: 100000000
    },
    runtime: {
      type: 'enum',
      options: ['node', 'edge'],
      default: 'edge'
    }
  }
};

// Template registry by instance
export const EVENT_TEMPLATES = {
  'ai-agents': AI_AGENTS_TEMPLATE,
  'cloud-infra': CLOUD_INFRA_TEMPLATE
} as const;