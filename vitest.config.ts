import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 120_000, // 2 minutes for on-chain settlements
    hookTimeout: 30_000,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts'],
    env: {
      // Load from .env.test
      FACILITATOR_URL: 'http://localhost:3000/api',
      FACILITATOR_API_KEY: 'x402_691bd743b64656df9adf9cf77ca6b1a042b60afe82b69fdbf0d0107ddf9c82e4',
      TEST_PAYER_PRIVATE_KEY: '0x99519f8bf2ee249598b1e8c90fb8b0caf0a09604ebfa3f202d29712b274c17bd',
      TEST_NETWORK_ID: 'eip155:84532',
      TEST_CHAIN_ID: '84532',
      TEST_USDC_ADDRESS: '0x036cbd53842c5426634e7929541ec2318f3dcf7e',
      TEST_ESCROW_CONTRACT: '0xc486dca5a739672363c32e0b651b4954e1b97c9f',
      TEST_TOKEN_COLLECTOR: '0x5270069e41a73d3d3e70373f4367eb9b2acec26e',
      TIP_APP_URL: 'http://localhost:3001',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
