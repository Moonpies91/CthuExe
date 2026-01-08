import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import { setupLaunchpadListener } from './listeners/launchpad';
import { setupLeaderboardListener } from './listeners/leaderboard';
import { setupFarmListener } from './listeners/farm';

dotenv.config();

// Configuration
const RPC_URL = process.env.RPC_URL || 'https://testnet-rpc.monad.xyz';
const LAUNCHPAD_ADDRESS = process.env.LAUNCHPAD_ADDRESS;
const LEADERBOARD_ADDRESS = process.env.LEADERBOARD_ADDRESS;
const FARM_ADDRESS = process.env.FARM_ADDRESS;

async function main() {
  console.log('Starting CthuCoin Indexer...');
  console.log(`RPC URL: ${RPC_URL}`);

  // Connect to provider
  const provider = new ethers.JsonRpcProvider(RPC_URL);

  // Verify connection
  try {
    const network = await provider.getNetwork();
    console.log(`Connected to network: ${network.name} (chainId: ${network.chainId})`);
  } catch (error) {
    console.error('Failed to connect to RPC:', error);
    process.exit(1);
  }

  // Setup listeners
  if (LAUNCHPAD_ADDRESS) {
    console.log(`Launchpad: ${LAUNCHPAD_ADDRESS}`);
    setupLaunchpadListener(provider, LAUNCHPAD_ADDRESS);
  } else {
    console.warn('LAUNCHPAD_ADDRESS not set, skipping launchpad listener');
  }

  if (LEADERBOARD_ADDRESS) {
    console.log(`Leaderboard: ${LEADERBOARD_ADDRESS}`);
    setupLeaderboardListener(provider, LEADERBOARD_ADDRESS);
  } else {
    console.warn('LEADERBOARD_ADDRESS not set, skipping leaderboard listener');
  }

  if (FARM_ADDRESS) {
    console.log(`Farm: ${FARM_ADDRESS}`);
    setupFarmListener(provider, FARM_ADDRESS);
  } else {
    console.warn('FARM_ADDRESS not set, skipping farm listener');
  }

  console.log('Indexer is running. Press Ctrl+C to stop.');

  // Keep process alive
  process.on('SIGINT', () => {
    console.log('Shutting down indexer...');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('Shutting down indexer...');
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
