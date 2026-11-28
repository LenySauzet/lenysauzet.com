interface AskEnvironment {
  ASK_ENABLED?: string;
  VERCEL_ENV?: string;
}

const deployed = (): AskEnvironment => ({ ASK_ENABLED: process.env.ASK_ENABLED, VERCEL_ENV: process.env.VERCEL_ENV });

export const askEnabled = ({ ASK_ENABLED, VERCEL_ENV } = deployed()) =>
  ASK_ENABLED ? ASK_ENABLED === 'true' : VERCEL_ENV !== 'production';
