import { ethers } from 'ethers';
import { db, admin } from '../firebase';

// CthuFarm ABI (events only)
const FARM_ABI = [
  'event Deposit(address indexed user, uint256 indexed pid, uint256 amount)',
  'event Withdraw(address indexed user, uint256 indexed pid, uint256 amount)',
  'event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount)',
  'event Harvest(address indexed user, uint256 indexed pid, uint256 amount)',
];

const POOL_NAMES: { [key: number]: string } = {
  0: 'CTHU/MONAD LP',
  1: 'CTHU/USDT LP',
  2: 'MONAD/USDT LP',
  3: 'Graduated Tokens',
};

export function setupFarmListener(
  provider: ethers.Provider,
  farmAddress: string
) {
  const farm = new ethers.Contract(farmAddress, FARM_ABI, provider);

  // Deposit
  farm.on('Deposit', async (user, pid, amount, event) => {
    console.log(`Farm Deposit: ${ethers.formatEther(amount)} to pool ${pid}`);

    try {
      await db.collection('farmEvents').add({
        type: 'deposit',
        user: user.toLowerCase(),
        poolId: Number(pid),
        poolName: POOL_NAMES[Number(pid)] || `Pool ${pid}`,
        amount: amount.toString(),
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        txHash: event.log.transactionHash,
        blockNumber: event.log.blockNumber,
      });

      // Update stats
      await updateFarmStats(pid, amount, true);
    } catch (error) {
      console.error('Error saving Deposit:', error);
    }
  });

  // Withdraw
  farm.on('Withdraw', async (user, pid, amount, event) => {
    console.log(`Farm Withdraw: ${ethers.formatEther(amount)} from pool ${pid}`);

    try {
      await db.collection('farmEvents').add({
        type: 'withdraw',
        user: user.toLowerCase(),
        poolId: Number(pid),
        poolName: POOL_NAMES[Number(pid)] || `Pool ${pid}`,
        amount: amount.toString(),
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        txHash: event.log.transactionHash,
        blockNumber: event.log.blockNumber,
      });

      // Update stats
      await updateFarmStats(pid, amount, false);
    } catch (error) {
      console.error('Error saving Withdraw:', error);
    }
  });

  // Emergency Withdraw
  farm.on('EmergencyWithdraw', async (user, pid, amount, event) => {
    console.log(`Farm Emergency Withdraw: ${ethers.formatEther(amount)} from pool ${pid}`);

    try {
      await db.collection('farmEvents').add({
        type: 'emergency_withdraw',
        user: user.toLowerCase(),
        poolId: Number(pid),
        poolName: POOL_NAMES[Number(pid)] || `Pool ${pid}`,
        amount: amount.toString(),
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        txHash: event.log.transactionHash,
        blockNumber: event.log.blockNumber,
      });

      // Update stats
      await updateFarmStats(pid, amount, false);
    } catch (error) {
      console.error('Error saving EmergencyWithdraw:', error);
    }
  });

  // Harvest
  farm.on('Harvest', async (user, pid, amount, event) => {
    console.log(`Farm Harvest: ${ethers.formatEther(amount)} CTHU from pool ${pid}`);

    try {
      await db.collection('farmEvents').add({
        type: 'harvest',
        user: user.toLowerCase(),
        poolId: Number(pid),
        poolName: POOL_NAMES[Number(pid)] || `Pool ${pid}`,
        amount: amount.toString(),
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        txHash: event.log.transactionHash,
        blockNumber: event.log.blockNumber,
      });

      // Update harvest stats
      const statsRef = db.collection('stats').doc('farm');
      await statsRef.set({
        [`pool${pid}TotalHarvested`]: admin.firestore.FieldValue.increment(
          Number(ethers.formatEther(amount))
        ),
        totalHarvested: admin.firestore.FieldValue.increment(
          Number(ethers.formatEther(amount))
        ),
        lastUpdate: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    } catch (error) {
      console.error('Error saving Harvest:', error);
    }
  });

  console.log('Farm listener started');
}

async function updateFarmStats(pid: bigint, amount: bigint, isDeposit: boolean) {
  const statsRef = db.collection('stats').doc('farm');
  const change = Number(ethers.formatEther(amount)) * (isDeposit ? 1 : -1);

  await statsRef.set({
    [`pool${pid}TotalStaked`]: admin.firestore.FieldValue.increment(change),
    totalStaked: admin.firestore.FieldValue.increment(change),
    lastUpdate: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
}
