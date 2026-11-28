import { defineConfig } from 'evalite/config';
import { createInMemoryStorage } from 'evalite/in-memory-storage';

export default defineConfig({
  storage: () => createInMemoryStorage(),
  testTimeout: 90_000,
  maxConcurrency: 4,
});
