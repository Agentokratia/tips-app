/**
 * Tip App Integration Test Setup
 *
 * Configures test environment for Base Sepolia integration tests.
 * Uses the same test wallet as x402-escrow tests.
 */

import { config } from 'dotenv';
import { beforeAll } from 'vitest';
import { createPublicClient, createWalletClient, http, formatUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';

// Load test environment variables
config({ path: '.env.test' });

// Validate required environment variables
const requiredEnvVars = ['TEST_PAYER_PRIVATE_KEY', 'FACILITATOR_API_KEY'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(
      `Missing required environment variable: ${envVar}\nPlease ensure .env.test is configured.`
    );
  }
}

// Create test accounts
export const payerAccount = privateKeyToAccount(
  process.env.TEST_PAYER_PRIVATE_KEY as `0x${string}`
);

// Create viem clients
export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

export const payerWallet = createWalletClient({
  account: payerAccount,
  chain: baseSepolia,
  transport: http(),
});

// Test configuration
export const testConfig = {
  networkId: process.env.TEST_NETWORK_ID || 'eip155:84532',
  chainId: parseInt(process.env.TEST_CHAIN_ID || '84532'),
  usdcAddress: (process.env.TEST_USDC_ADDRESS ||
    '0x036cbd53842c5426634e7929541ec2318f3dcf7e') as `0x${string}`,
  escrowContract: (process.env.TEST_ESCROW_CONTRACT ||
    '0xc486dca5a739672363c32e0b651b4954e1b97c9f') as `0x${string}`,
  tokenCollector: (process.env.TEST_TOKEN_COLLECTOR ||
    '0x5270069e41a73d3d3e70373f4367eb9b2acec26e') as `0x${string}`,
  facilitatorUrl: process.env.FACILITATOR_URL || 'http://localhost:3000/api',
  facilitatorApiKey: process.env.FACILITATOR_API_KEY || '',
  tipAppUrl: process.env.TIP_APP_URL || 'http://localhost:3001',
  facilitatorAddress: '' as `0x${string}`, // Will be fetched from API
  payerAddress: payerAccount.address,
};

// USDC contract ABI (minimal for testing)
export const USDC_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

// Helper to check USDC balance
export async function getUsdcBalance(address: `0x${string}`): Promise<bigint> {
  return publicClient.readContract({
    address: testConfig.usdcAddress,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: [address],
  });
}

// WETH address on Base Sepolia
export const WETH_ADDRESS = '0x4200000000000000000000000000000000000006' as `0x${string}`;

// Helper to check WETH balance
export async function getWethBalance(address: `0x${string}`): Promise<bigint> {
  return publicClient.readContract({
    address: WETH_ADDRESS,
    abi: USDC_ABI, // Same ERC20 interface
    functionName: 'balanceOf',
    args: [address],
  });
}

// Helper to format WETH amounts
export function formatWeth(amount: bigint): string {
  return formatUnits(amount, 18);
}

// Helper to format USDC amounts
export function formatUsdc(amount: bigint): string {
  return formatUnits(amount, 6);
}

/** Whether the facilitator server is reachable */
export let facilitatorReachable = false;

/** Whether the tip app server is reachable */
export let tipAppReachable = false;

// Fetch facilitator address from API
async function fetchFacilitatorAddress(): Promise<`0x${string}`> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(`${testConfig.facilitatorUrl}/supported`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) {
      throw new Error(`Failed to fetch facilitator address: ${response.statusText}`);
    }
    const data = await response.json();
    const signers = data.signers[testConfig.networkId];
    if (!signers || signers.length === 0) {
      throw new Error('No signers found for network');
    }
    return signers[0] as `0x${string}`;
  } catch (e) {
    clearTimeout(timeout);
    throw new Error(
      `Facilitator not reachable at ${testConfig.facilitatorUrl}. (${e instanceof Error ? e.message : e})`
    );
  }
}

// Check if tip app is running
async function checkTipAppReachable(): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(`${testConfig.tipAppUrl}/api/supported`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response.ok;
  } catch {
    clearTimeout(timeout);
    return false;
  }
}

// Log test account info and fetch facilitator address
beforeAll(async () => {
  // Check facilitator
  try {
    testConfig.facilitatorAddress = await fetchFacilitatorAddress();
    facilitatorReachable = true;
  } catch (e) {
    console.warn(
      `\n  Facilitator not reachable. Some tests will be skipped.\n  ${e instanceof Error ? e.message : e}`
    );
  }

  // Check tip app
  tipAppReachable = await checkTipAppReachable();
  if (!tipAppReachable) {
    console.warn(
      `\n  Tip app not reachable at ${testConfig.tipAppUrl}. Some tests will be skipped.`
    );
  }

  console.log('\n=== Tip App Integration Test Setup ===');
  console.log(`Network: Base Sepolia (${testConfig.chainId})`);
  console.log(`Facilitator URL: ${testConfig.facilitatorUrl}`);
  console.log(`Facilitator Address: ${testConfig.facilitatorAddress || 'N/A'}`);
  console.log(`Tip App URL: ${testConfig.tipAppUrl}`);
  console.log(`Test Payer: ${payerAccount.address}`);
  console.log(`Facilitator reachable: ${facilitatorReachable}`);
  console.log(`Tip App reachable: ${tipAppReachable}`);

  if (facilitatorReachable) {
    // Check balances
    const payerEth = await publicClient.getBalance({ address: payerAccount.address });
    const payerUsdc = await getUsdcBalance(payerAccount.address);

    console.log(`\nBalances:`);
    console.log(`  Payer ETH: ${formatUnits(payerEth, 18)} ETH`);
    console.log(`  Payer USDC: ${formatUsdc(payerUsdc)} USDC`);
  }

  console.log('======================================\n');
});
