export type OrbInstance = 'cloud-infra' | 'ai-agents';

export const ORB_INSTANCES = {
  'cloud-infra': {
    name: 'Nimbus Scale',
    description: 'Cloud Infrastructure Platform',
    companyKey: 'Cloud_Infra',
    apiKey: process.env.ORB_API_KEY_NIMBUS_SCALE_TEST,
    logo: '/cloud.svg',
    primaryColor: 'blue',
    features: [
      'Global CDN & Edge Computing',
      'Serverless Functions',
      'Real-time Analytics',
      'Auto-scaling Infrastructure'
    ]
  },
  'ai-agents': {
    name: 'Neural Prime', 
    description: 'AI Agent Platform',
    companyKey: 'AI_Agents',
    apiKey: process.env.ORB_API_KEY_AI_AGENT_TEST,
    logo: '/brain.svg',
    primaryColor: 'purple',
    features: [
      'Intelligent Automation',
      'Natural Language Processing',
      'Machine Learning Models',
      'API Integrations'
    ]
  },
} as const;

export function isValidInstance(instance: string): instance is OrbInstance {
  return instance in ORB_INSTANCES;
} 