import { EVENT_TEMPLATES } from '../event-templates';
import { buildRandomizedEventPayload, buildManualEventPayload } from '../payload-builder';

describe('Event Templates', () => {
  describe('AI Agents template', () => {
    it('should have correct structure', () => {
      const template = EVENT_TEMPLATES['ai-agents'];
      
      expect(template.eventName).toBe('agent_request');
      expect(template.properties.model).toMatchObject({
        type: 'enum',
        options: expect.arrayContaining(['claude-sonnet-4']),
        default: 'claude-sonnet-4'
      });
      expect(template.properties.num_steps).toMatchObject({
        type: 'range',
        min: 1,
        max: 100,
        default: 50
      });
      expect(template.properties.num_tokens).toMatchObject({
        type: 'range',
        min: 100,
        max: 10000,
        default: 1000
      });
      expect(template.properties.user_id).toMatchObject({
        type: 'enum',
        options: expect.arrayContaining(['Sarah', 'Hari', 'Taylor', 'Marshall']),
        default: 'Sarah'
      });
    });
  });

  describe('AI Agents template payload generation', () => {
    it('should generate valid AI agents events with randomized properties', () => {
      const event = buildRandomizedEventPayload('ai-agents', 'customer-123', 'external-123');
      
      expect(event.event_name).toBe('agent_request');
      expect(event.external_customer_id).toBe('external-123');
      expect(event.customer_id).toBeUndefined();
      expect(['claude-opus-4', 'claude-sonnet-4', 'claude-sonnet-3.7', 'o3', 'o4-mini', 'gemini-2.5-flash', 'gemini-2.5-pro']).toContain(event.properties.model);
      expect(event.properties.num_steps).toBeGreaterThanOrEqual(1);
      expect(event.properties.num_steps).toBeLessThanOrEqual(100);
      expect(event.properties.num_tokens).toBeGreaterThanOrEqual(100);
      expect(event.properties.num_tokens).toBeLessThanOrEqual(10000);
      expect(['Sarah', 'Hari', 'Taylor', 'Marshall']).toContain(event.properties.user_id);
      expect(event.idempotency_key).toMatch(/^[0-9a-f-]{36}_\d{14}$/);
      expect(event.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should generate AI agents events with manual properties', () => {
      const manualProperties = {
        model: 'claude-opus-4',
        num_steps: 25,
        num_tokens: 2500,
        user_id: 'Taylor'
      };
      
      const event = buildManualEventPayload('ai-agents', 'customer-123', manualProperties, 'external-123');
      
      expect(event.event_name).toBe('agent_request');
      expect(event.external_customer_id).toBe('external-123');
      expect(event.customer_id).toBeUndefined();
      expect(event.properties.model).toBe('claude-opus-4');
      expect(event.properties.num_steps).toBe(25);
      expect(event.properties.num_tokens).toBe(2500);
      expect(event.properties.user_id).toBe('Taylor');
      expect(event.idempotency_key).toMatch(/^[0-9a-f-]{36}_\d{14}$/);
      expect(event.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should use customer_id when external_customer_id is not provided for AI agents', () => {
      const manualProperties = {
        model: 'gemini-2.5-flash',
        num_steps: 75,
        num_tokens: 5000,
        user_id: 'Marshall'
      };
      
      const event = buildManualEventPayload('ai-agents', 'customer-456', manualProperties);
      
      expect(event.customer_id).toBe('customer-456');
      expect(event.external_customer_id).toBeUndefined();
      expect(event.event_name).toBe('agent_request');
      expect(event.properties.model).toBe('gemini-2.5-flash');
      expect(event.properties.num_steps).toBe(75);
      expect(event.properties.num_tokens).toBe(5000);
      expect(event.properties.user_id).toBe('Marshall');
    });

    it('should use defaults for missing manual properties and randomize others', () => {
      const manualProperties = {
        model: 'o3'
      };
      
      const event = buildManualEventPayload('ai-agents', 'customer-789', manualProperties);
      
      expect(event.properties.model).toBe('o3');
      expect(event.properties.num_steps).toBeGreaterThanOrEqual(1);
      expect(event.properties.num_steps).toBeLessThanOrEqual(100);
      expect(event.properties.num_tokens).toBeGreaterThanOrEqual(100);
      expect(event.properties.num_tokens).toBeLessThanOrEqual(10000);
      expect(['Sarah', 'Hari', 'Taylor', 'Marshall']).toContain(event.properties.user_id);
    });

    it('should validate all AI agent model options are available', () => {
      const expectedModels = ['claude-opus-4', 'claude-sonnet-4', 'claude-sonnet-3.7', 'o3', 'o4-mini', 'gemini-2.5-flash', 'gemini-2.5-pro'];
      const template = EVENT_TEMPLATES['ai-agents'];
      
      expect(template.properties.model.options).toEqual(expectedModels);
    });

    it('should generate different randomized values across multiple calls', () => {
      const events = Array.from({ length: 50 }, () => 
        buildRandomizedEventPayload('ai-agents', 'test-customer')
      );
      
      // Check that we get different models (with 50 calls, we should see variety)
      const uniqueModels = new Set(events.map(e => e.properties.model));
      expect(uniqueModels.size).toBeGreaterThan(1);
      
      // Check that we get different step counts
      const uniqueSteps = new Set(events.map(e => e.properties.num_steps));
      expect(uniqueSteps.size).toBeGreaterThan(1);
      
      // Check that we get different token counts
      const uniqueTokens = new Set(events.map(e => e.properties.num_tokens));
      expect(uniqueTokens.size).toBeGreaterThan(1);
    });
  });

  describe('Cloud Infrastructure template', () => {
    it('should have correct structure for Nimbus_Scale_Network_Request event', () => {
      const template = EVENT_TEMPLATES['cloud-infra'];
      
      expect(template.eventName).toBe('Nimbus_Scale_Network_Request');
      expect(template.properties.bandwidth_MB).toMatchObject({
        type: 'range',
        min: 100,
        max: 10000
      });
      expect(template.properties.runtime).toMatchObject({
        type: 'enum',
        options: ['node', 'edge']
      });
    });

    it('should generate valid cloud infra events with randomized properties', () => {
      const event = buildRandomizedEventPayload('cloud-infra', 'NM56KxKNn855iUhe', 'acme');
      
      expect(event.event_name).toBe('Nimbus_Scale_Network_Request');
      expect(event.external_customer_id).toBe('acme');
      expect(event.customer_id).toBeUndefined();
      expect(event.properties.bandwidth_MB).toBeGreaterThanOrEqual(100);
      expect(event.properties.bandwidth_MB).toBeLessThanOrEqual(10000);
      expect(['node', 'edge']).toContain(event.properties.runtime);
      expect(event.idempotency_key).toMatch(/^[0-9a-f-]{36}_\d{14}$/);
      expect(event.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should generate valid cloud infra events with manual properties', () => {
      const manualProperties = {
        bandwidth_MB: 5027,
        runtime: 'node'
      };
      
      const event = buildManualEventPayload('cloud-infra', 'NM56KxKNn855iUhe', manualProperties, 'acme');
      
      expect(event.event_name).toBe('Nimbus_Scale_Network_Request');
      expect(event.external_customer_id).toBe('acme');
      expect(event.customer_id).toBeUndefined();
      expect(event.properties.bandwidth_MB).toBe(5027);
      expect(event.properties.runtime).toBe('node');
      expect(event.idempotency_key).toMatch(/^[0-9a-f-]{36}_\d{14}$/);
      expect(event.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should validate bandwidth_MB is within acceptable range', () => {
      const template = EVENT_TEMPLATES['cloud-infra'];
      
      expect(template.properties.bandwidth_MB.min).toBe(100);
      expect(template.properties.bandwidth_MB.max).toBe(10000);
    });

    it('should validate runtime options are node or edge', () => {
      const template = EVENT_TEMPLATES['cloud-infra'];
      
      expect(template.properties.runtime.options).toEqual(['node', 'edge']);
    });

    it('should generate randomized bandwidth_MB values within valid range over multiple calls', () => {
      const events = Array.from({ length: 20 }, () => 
        buildRandomizedEventPayload('cloud-infra', 'test-customer')
      );
      
      events.forEach(event => {
        expect(event.properties.bandwidth_MB).toBeGreaterThanOrEqual(100);
        expect(event.properties.bandwidth_MB).toBeLessThanOrEqual(10000);
        expect(typeof event.properties.bandwidth_MB).toBe('number');
      });
    });

    it('should generate randomized runtime values that are valid options over multiple calls', () => {
      const events = Array.from({ length: 20 }, () => 
        buildRandomizedEventPayload('cloud-infra', 'test-customer')
      );
      
      events.forEach(event => {
        expect(['node', 'edge']).toContain(event.properties.runtime);
        expect(typeof event.properties.runtime).toBe('string');
      });
    });

    it('should match the example payload structure from user requirements', () => {
      const manualProperties = {
        bandwidth_MB: 5027,
        runtime: 'node'
      };
      
      const event = buildManualEventPayload('cloud-infra', 'NM56KxKNn855iUhe', manualProperties, 'acme');
      
      // Should match the structure from the example
      expect(event).toMatchObject({
        idempotency_key: expect.stringMatching(/^[0-9a-f-]{36}_\d{14}$/),
        event_name: 'Nimbus_Scale_Network_Request',
        external_customer_id: 'acme',
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
        properties: {
          bandwidth_MB: 5027,
          runtime: 'node'
        }
      });
      
      // Verify customer_id is not present when external_customer_id is used (Orb API requirement)
      expect(event.customer_id).toBeUndefined();
    });

    it('should use customer_id when external_customer_id is not provided', () => {
      const manualProperties = {
        bandwidth_MB: 2500,
        runtime: 'edge'
      };
      
      // Don't provide external_customer_id - should use customer_id instead
      const event = buildManualEventPayload('cloud-infra', 'NM56KxKNn855iUhe', manualProperties);
      
      expect(event.customer_id).toBe('NM56KxKNn855iUhe');
      expect(event.external_customer_id).toBeUndefined();
      expect(event.event_name).toBe('Nimbus_Scale_Network_Request');
      expect(event.properties.bandwidth_MB).toBe(2500);
      expect(event.properties.runtime).toBe('edge');
    });
  });
});