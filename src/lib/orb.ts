import Orb from 'orb-billing';

export const orbClient = new Orb({
  apiKey: process.env.ORB_API_KEY,
});