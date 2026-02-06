/**
 * Tip App Integration Tests - Base Sepolia
 *
 * Tests the /api/tip endpoint against the live facilitator on Base Sepolia.
 *
 * Prerequisites:
 *   - x402-escrow facilitator running at http://localhost:3000
 *   - Tip app running at http://localhost:3001
 *   - .env.test configured with TEST_PAYER_PRIVATE_KEY, FACILITATOR_API_KEY
 *   - Test payer has Base Sepolia USDC
 *
 * Run:
 *   pnpm test
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createWalletClient, http, formatUnits, type Address } from 'viem';
import { baseSepolia } from 'viem/chains';
import {
  testConfig,
  payerAccount,
  publicClient,
  facilitatorReachable,
  tipAppReachable,
  getUsdcBalance,
  getWethBalance,
  formatUsdc,
  formatWeth,
  WETH_ADDRESS,
} from './setup';
import { EscrowScheme } from '@agentokratia/x402-escrow/client';

// Constants
const USDC: Address = '0x036cbd53842c5426634e7929541ec2318f3dcf7e';
const NETWORK_ID = 'eip155:84532';

// Test recipient (facilitator address as a simple recipient)
let testRecipient: Address;

interface PaymentRequirements {
  scheme: string;
  network: string;
  asset: string;
  amount: string;
  payTo: string;
  maxTimeoutSeconds: number;
  extra: Record<string, unknown>;
}

describe('Tip App Integration - Base Sepolia', () => {
  let walletClient: ReturnType<typeof createWalletClient>;

  beforeAll(async () => {
    if (!process.env.FACILITATOR_API_KEY || !facilitatorReachable) {
      console.log('Skipping tests - missing FACILITATOR_API_KEY or facilitator not reachable');
      return;
    }

    testRecipient = testConfig.facilitatorAddress;

    walletClient = createWalletClient({
      account: payerAccount,
      chain: baseSepolia,
      transport: http(),
    });

    console.log(`\n=== Tip Integration Test Setup ===`);
    console.log(`Test Recipient: ${testRecipient}`);
    console.log(`Payer: ${payerAccount.address}`);
    console.log(`=================================\n`);
  });

  describe('402 Payment Requirements', () => {
    it('returns 402 with payment requirements when no payment header', async () => {
      if (!process.env.FACILITATOR_API_KEY || !tipAppReachable) {
        console.log('Skipping - tip app not reachable or missing API key');
        return;
      }

      // Request tip without payment header
      const res = await fetch(
        `${testConfig.tipAppUrl}/api/tip?to=${testRecipient}&amount=0.01&network=${NETWORK_ID}`
      );

      expect(res.status).toBe(402);

      // Check PAYMENT-REQUIRED header
      const paymentRequired = res.headers.get('PAYMENT-REQUIRED');
      expect(paymentRequired).toBeDefined();
      expect(paymentRequired).not.toBeNull();

      // Decode and validate requirements
      const requirements: PaymentRequirements[] = JSON.parse(
        Buffer.from(paymentRequired!, 'base64').toString()
      );

      expect(requirements.length).toBeGreaterThan(0);

      const req = requirements[0];
      console.log('\nPayment Requirements:');
      console.log(`  Scheme: ${req.scheme}`);
      console.log(`  Network: ${req.network}`);
      console.log(`  Asset: ${req.asset}`);
      console.log(`  Amount: ${req.amount}`);
      console.log(`  PayTo: ${req.payTo}`);

      expect(req.scheme).toBe('escrow');
      expect(req.network).toBe(NETWORK_ID);
      expect(req.payTo.toLowerCase()).toBe(testRecipient.toLowerCase());
      expect(req.extra).toBeDefined();
      expect(req.extra.escrowContract).toBeDefined();
      expect(req.extra.facilitator).toBeDefined();
      expect(req.extra.tokenCollector).toBeDefined();
    }, 30_000);

    it('returns 400 for missing parameters', async () => {
      if (!process.env.FACILITATOR_API_KEY || !tipAppReachable) {
        console.log('Skipping - tip app not reachable or missing API key');
        return;
      }

      // Missing 'to' parameter
      const res1 = await fetch(`${testConfig.tipAppUrl}/api/tip?amount=1.00`);
      expect(res1.status).toBe(400);
      const data1 = await res1.json();
      expect(data1.error).toContain('Missing');

      // Missing 'amount' parameter
      const res2 = await fetch(`${testConfig.tipAppUrl}/api/tip?to=${testRecipient}`);
      expect(res2.status).toBe(400);
      const data2 = await res2.json();
      expect(data2.error).toContain('Missing');
    });

    it('returns 400 for invalid amount', async () => {
      if (!process.env.FACILITATOR_API_KEY || !tipAppReachable) {
        console.log('Skipping - tip app not reachable or missing API key');
        return;
      }

      const res = await fetch(
        `${testConfig.tipAppUrl}/api/tip?to=${testRecipient}&amount=-5`
      );
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Invalid amount');
    });

    it('returns 400 for unsupported network', async () => {
      if (!process.env.FACILITATOR_API_KEY || !tipAppReachable) {
        console.log('Skipping - tip app not reachable or missing API key');
        return;
      }

      const res = await fetch(
        `${testConfig.tipAppUrl}/api/tip?to=${testRecipient}&amount=1.00&network=eip155:999999`
      );
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('not supported');
    });
  });

  describe('Full Payment Flow', () => {
    it('completes tip payment: 402 -> sign -> submit -> settle', async () => {
      if (!process.env.FACILITATOR_API_KEY || !tipAppReachable || !facilitatorReachable) {
        console.log('Skipping - servers not reachable or missing API key');
        return;
      }

      const tipAmount = '0.001'; // $0.001 USDC (1000 wei)

      // Record balances before
      const recipientUsdcBefore = await getUsdcBalance(testRecipient);
      const payerUsdcBefore = await getUsdcBalance(payerAccount.address);
      console.log(`\nBefore:`);
      console.log(`  Recipient USDC: ${formatUsdc(recipientUsdcBefore)}`);
      console.log(`  Payer USDC: ${formatUsdc(payerUsdcBefore)}`);

      // Step 1: Get payment requirements (402)
      console.log(`\nStep 1: Getting payment requirements...`);
      const res402 = await fetch(
        `${testConfig.tipAppUrl}/api/tip?to=${testRecipient}&amount=${tipAmount}&network=${NETWORK_ID}`
      );

      expect(res402.status).toBe(402);

      const paymentRequired = res402.headers.get('PAYMENT-REQUIRED');
      expect(paymentRequired).toBeDefined();

      const requirements: PaymentRequirements[] = JSON.parse(
        Buffer.from(paymentRequired!, 'base64').toString()
      );
      expect(requirements.length).toBeGreaterThan(0);

      const paymentRequirements = requirements[0];
      console.log(`  Got requirements for ${paymentRequirements.amount} (${paymentRequirements.scheme})`);

      // Step 2: Sign payment with EscrowScheme
      console.log(`\nStep 2: Signing payment...`);
      const escrowScheme = new EscrowScheme(walletClient);

      const payloadResult = await escrowScheme.createPaymentPayload(2, paymentRequirements as any);

      expect(payloadResult.x402Version).toBe(2);
      expect(payloadResult.payload).toBeDefined();
      expect(payloadResult.accepted).toBeDefined();

      console.log(`  Signed payload created`);
      console.log(`  Request ID: ${payloadResult.payload.requestId}`);

      // Step 3: Submit payment with PAYMENT-SIGNATURE header
      console.log(`\nStep 3: Submitting payment...`);
      const paymentPayload = {
        x402Version: payloadResult.x402Version,
        accepted: payloadResult.accepted,
        payload: payloadResult.payload,
      };
      const signature = Buffer.from(JSON.stringify(paymentPayload)).toString('base64');

      const resSubmit = await fetch(
        `${testConfig.tipAppUrl}/api/tip?to=${testRecipient}&amount=${tipAmount}&network=${NETWORK_ID}`,
        {
          method: 'GET',
          headers: {
            'PAYMENT-SIGNATURE': signature,
          },
        }
      );

      // Check response
      const paymentResponse = resSubmit.headers.get('PAYMENT-RESPONSE');
      expect(paymentResponse).toBeDefined();

      const result = JSON.parse(Buffer.from(paymentResponse!, 'base64').toString());
      console.log(`\nPayment Response:`, JSON.stringify(result, null, 2));

      if (!result.success) {
        console.error(`Payment failed: ${result.errorReason}`);
      }

      expect(resSubmit.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.transaction).toBeDefined();

      const txHash = result.transaction;
      console.log(`\n  Transaction: ${txHash}`);
      console.log(`  Explorer: https://sepolia.basescan.org/tx/${txHash}`);

      // Step 4: Verify on-chain
      console.log(`\nStep 4: Verifying on-chain...`);
      const receipt = await publicClient.getTransactionReceipt({ hash: txHash as `0x${string}` });
      expect(receipt.status).toBe('success');
      console.log(`  On-chain status: ${receipt.status}`);
      console.log(`  Gas used: ${receipt.gasUsed}`);

      // Step 5: Verify balance changes
      console.log(`\nStep 5: Verifying balance changes...`);
      // Poll for balance update (free RPCs can lag)
      let recipientUsdcAfter = recipientUsdcBefore;
      for (let i = 0; i < 10; i++) {
        recipientUsdcAfter = await getUsdcBalance(testRecipient);
        if (recipientUsdcAfter > recipientUsdcBefore) break;
        await new Promise((r) => setTimeout(r, 1000));
      }

      const usdcReceived = recipientUsdcAfter - recipientUsdcBefore;
      console.log(`  Recipient USDC after: ${formatUsdc(recipientUsdcAfter)}`);
      console.log(`  USDC received: ${formatUsdc(usdcReceived)}`);

      // Recipient should have received at least some USDC
      expect(usdcReceived).toBeGreaterThan(0n);

      console.log(`\n=== Tip Payment Test PASSED ===\n`);
    }, 120_000); // 2 minute timeout for on-chain settlement
  });

  describe('Swap Payment Flow (WETH -> USDC)', () => {
    it('completes swap tip: pay with WETH, recipient gets USDC', async () => {
      if (!process.env.FACILITATOR_API_KEY || !tipAppReachable || !facilitatorReachable) {
        console.log('Skipping - servers not reachable or missing API key');
        return;
      }

      const tipAmount = '0.001'; // $0.001 USDC output

      // Check WETH balance
      const payerWethBefore = await getWethBalance(payerAccount.address);
      console.log(`\n=== Swap Test: WETH -> USDC ===`);
      console.log(`Payer WETH balance: ${formatWeth(payerWethBefore)} WETH`);

      if (payerWethBefore === 0n) {
        console.log('Skipping swap test - payer has no WETH');
        return;
      }

      // Record USDC balances before
      const recipientUsdcBefore = await getUsdcBalance(testRecipient);
      console.log(`Recipient USDC before: ${formatUsdc(recipientUsdcBefore)}`);

      // Step 1: Get payment requirements (402)
      console.log(`\nStep 1: Getting payment requirements...`);
      const res402 = await fetch(
        `${testConfig.tipAppUrl}/api/tip?to=${testRecipient}&amount=${tipAmount}&network=${NETWORK_ID}`
      );

      expect(res402.status).toBe(402);

      const paymentRequired = res402.headers.get('PAYMENT-REQUIRED');
      expect(paymentRequired).toBeDefined();

      const requirements: PaymentRequirements[] = JSON.parse(
        Buffer.from(paymentRequired!, 'base64').toString()
      );

      // Find the swap option (has swapData in extra)
      const swapOption = requirements.find(
        (r) => r.extra && 'swapData' in r.extra
      );

      if (!swapOption) {
        console.log('No swap option available, skipping test');
        return;
      }

      console.log(`  Found swap option:`);
      console.log(`    Collector: ${swapOption.extra.collectorType}`);
      const swapData = swapOption.extra.swapData as {
        inputToken: string;
        outputToken: string;
        maxInputAmount: string;
      };
      console.log(`    Input token: ${swapData.inputToken}`);
      console.log(`    Max input: ${formatWeth(BigInt(swapData.maxInputAmount))} WETH`);

      // Verify we have enough WETH
      if (payerWethBefore < BigInt(swapData.maxInputAmount)) {
        console.log(`Insufficient WETH. Need ${formatWeth(BigInt(swapData.maxInputAmount))}, have ${formatWeth(payerWethBefore)}`);
        return;
      }

      // Step 2: Sign swap payment with EscrowScheme
      console.log(`\nStep 2: Signing swap payment...`);
      const escrowScheme = new EscrowScheme(walletClient);

      const payloadResult = await escrowScheme.createPaymentPayload(2, swapOption as any);

      expect(payloadResult.x402Version).toBe(2);
      expect(payloadResult.payload).toBeDefined();
      expect(payloadResult.payload.permit2Signature).toBeDefined();
      expect(payloadResult.payload.swapData).toBeDefined();

      console.log(`  Signed swap payload created`);
      console.log(`  Request ID: ${payloadResult.payload.requestId}`);

      // Step 3: Submit payment with PAYMENT-SIGNATURE header
      console.log(`\nStep 3: Submitting swap payment...`);
      const paymentPayload = {
        x402Version: payloadResult.x402Version,
        accepted: payloadResult.accepted,
        payload: payloadResult.payload,
      };
      const signature = Buffer.from(JSON.stringify(paymentPayload)).toString('base64');

      const resSubmit = await fetch(
        `${testConfig.tipAppUrl}/api/tip?to=${testRecipient}&amount=${tipAmount}&network=${NETWORK_ID}`,
        {
          method: 'GET',
          headers: {
            'PAYMENT-SIGNATURE': signature,
          },
        }
      );

      // Check response
      const paymentResponse = resSubmit.headers.get('PAYMENT-RESPONSE');
      expect(paymentResponse).toBeDefined();

      const result = JSON.parse(Buffer.from(paymentResponse!, 'base64').toString());
      console.log(`\nSwap Payment Response:`, JSON.stringify(result, null, 2));

      if (!result.success) {
        console.error(`Swap payment failed: ${result.errorReason}`);
      }

      expect(resSubmit.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.transaction).toBeDefined();

      const txHash = result.transaction;
      console.log(`\n  Transaction: ${txHash}`);
      console.log(`  Explorer: https://sepolia.basescan.org/tx/${txHash}`);

      // Step 4: Verify on-chain
      console.log(`\nStep 4: Verifying on-chain...`);
      const receipt = await publicClient.getTransactionReceipt({ hash: txHash as `0x${string}` });
      expect(receipt.status).toBe('success');
      console.log(`  On-chain status: ${receipt.status}`);
      console.log(`  Gas used: ${receipt.gasUsed}`);

      // Step 5: Verify balance changes
      console.log(`\nStep 5: Verifying balance changes...`);

      // Check WETH decreased
      const payerWethAfter = await getWethBalance(payerAccount.address);
      const wethSpent = payerWethBefore - payerWethAfter;
      console.log(`  Payer WETH after: ${formatWeth(payerWethAfter)}`);
      console.log(`  WETH spent: ${formatWeth(wethSpent)}`);
      expect(wethSpent).toBeGreaterThan(0n);

      // Check USDC increased for recipient
      let recipientUsdcAfter = recipientUsdcBefore;
      for (let i = 0; i < 10; i++) {
        recipientUsdcAfter = await getUsdcBalance(testRecipient);
        if (recipientUsdcAfter > recipientUsdcBefore) break;
        await new Promise((r) => setTimeout(r, 1000));
      }

      const usdcReceived = recipientUsdcAfter - recipientUsdcBefore;
      console.log(`  Recipient USDC after: ${formatUsdc(recipientUsdcAfter)}`);
      console.log(`  USDC received: ${formatUsdc(usdcReceived)}`);
      expect(usdcReceived).toBeGreaterThan(0n);

      console.log(`\n=== Swap Payment Test PASSED ===\n`);
    }, 120_000); // 2 minute timeout for on-chain settlement
  });

  describe('Supported Networks Proxy', () => {
    it('returns supported networks from facilitator', async () => {
      if (!process.env.FACILITATOR_API_KEY || !tipAppReachable) {
        console.log('Skipping - tip app not reachable or missing API key');
        return;
      }

      const res = await fetch(`${testConfig.tipAppUrl}/api/supported`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.networks).toBeDefined();
      expect(Array.isArray(data.networks)).toBe(true);
      expect(data.networks.length).toBeGreaterThan(0);

      console.log('\nSupported Networks:');
      for (const network of data.networks) {
        console.log(`  ${network.name} (${network.network})`);
        console.log(`    Input tokens: ${network.supportedInputTokens?.map((t: any) => t.symbol).join(', ') || 'N/A'}`);
        console.log(`    Settlement tokens: ${network.settlementTokens?.map((t: any) => t.symbol).join(', ') || 'N/A'}`);
      }
    });
  });
});

describe('Direct Facilitator Integration', () => {
  it('facilitator /supported endpoint returns escrow scheme for Base Sepolia', async () => {
    if (!process.env.FACILITATOR_API_KEY || !facilitatorReachable) {
      console.log('Skipping - facilitator not reachable or missing API key');
      return;
    }

    const res = await fetch(`${testConfig.facilitatorUrl}/supported`);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.kinds).toBeDefined();

    // Find escrow scheme for Base Sepolia
    const escrowKind = data.kinds.find(
      (k: any) => k.scheme === 'escrow' && k.network === NETWORK_ID
    );

    expect(escrowKind).toBeDefined();
    console.log('\nEscrow scheme config:');
    console.log(`  Network: ${escrowKind.network}`);
    console.log(`  Asset: ${escrowKind.asset || 'N/A'}`);
    console.log(`  Extra: ${JSON.stringify(escrowKind.extra || {}, null, 2)}`);
  });
});
