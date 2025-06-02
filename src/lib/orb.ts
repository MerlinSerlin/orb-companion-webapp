import 'orb-billing/shims/web';
import Orb from 'orb-billing';
import type { OrbInstance } from './orb-config';
import { ORB_INSTANCES } from './orb-config';

// Lazy initialization to avoid requiring API keys during module load (e.g., in tests)
let _orbClient: Orb | null = null;

function getOrbClient(): Orb {
  if (!_orbClient) {
    _orbClient = new Orb({
  apiKey: process.env.ORB_API_KEY,
    });
  }
  return _orbClient;
}

// Create a proxy that behaves like an Orb instance but initializes lazily
export const orbClient = new Proxy({} as Orb, {
  get(target, prop) {
    const client = getOrbClient();
    const value = client[prop as keyof Orb];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  }
});

export function createOrbClient(instance: OrbInstance): Orb {
  const instanceConfig = ORB_INSTANCES[instance];
  return new Orb({
    apiKey: instanceConfig.apiKey,
  });
}