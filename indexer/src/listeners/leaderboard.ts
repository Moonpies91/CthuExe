import { ethers } from 'ethers';
import { db, admin } from '../firebase';

// Leaderboard ABI (events only)
const LEADERBOARD_ABI = [
  'event BurnForRank(address indexed token, address indexed burner, uint256 amount, uint256 weekNumber)',
];

// Helper to get current week number (Monday 00:00 UTC based)
function getCurrentWeek(): number {
  const now = new Date();
  const startOfYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + startOfYear.getUTCDay() + 1) / 7);
}

function getWeekId(weekNumber: number): string {
  const year = new Date().getUTCFullYear();
  return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
}

export function setupLeaderboardListener(
  provider: ethers.Provider,
  leaderboardAddress: string
) {
  const leaderboard = new ethers.Contract(leaderboardAddress, LEADERBOARD_ABI, provider);

  // Burn for Rank
  leaderboard.on('BurnForRank', async (token, burner, amount, weekNumber, event) => {
    console.log(`Burn for Rank: ${ethers.formatEther(amount)} CTHU for ${token}`);

    const weekId = getWeekId(Number(weekNumber));

    try {
      // Update or create leaderboard week document
      const weekRef = db.collection('leaderboards').doc(weekId);
      const entryRef = weekRef.collection('entries').doc(token.toLowerCase());

      await db.runTransaction(async (transaction) => {
        // Ensure week document exists
        const weekDoc = await transaction.get(weekRef);
        if (!weekDoc.exists) {
          transaction.set(weekRef, {
            weekNumber: Number(weekNumber),
            weekId,
            startedAt: admin.firestore.FieldValue.serverTimestamp(),
            totalBurned: '0',
          });
        }

        // Update entry for this token
        const entryDoc = await transaction.get(entryRef);
        const currentAmount = entryDoc.exists ? BigInt(entryDoc.data()!.burnAmount) : 0n;
        const newAmount = currentAmount + BigInt(amount.toString());

        if (entryDoc.exists) {
          transaction.update(entryRef, {
            burnAmount: newAmount.toString(),
            lastBurnAt: admin.firestore.FieldValue.serverTimestamp(),
            burnCount: admin.firestore.FieldValue.increment(1),
          });
        } else {
          // Get token info
          const tokenDoc = await db.collection('tokens').doc(token.toLowerCase()).get();
          const tokenData = tokenDoc.data();

          transaction.set(entryRef, {
            token: token.toLowerCase(),
            name: tokenData?.name || 'Unknown',
            symbol: tokenData?.symbol || '???',
            burnAmount: newAmount.toString(),
            weekId,
            weekNumber: Number(weekNumber),
            firstBurnAt: admin.firestore.FieldValue.serverTimestamp(),
            lastBurnAt: admin.firestore.FieldValue.serverTimestamp(),
            burnCount: 1,
          });
        }

        // Update week total
        const weekData = weekDoc.exists ? weekDoc.data()! : { totalBurned: '0' };
        const weekTotal = BigInt(weekData.totalBurned) + BigInt(amount.toString());
        transaction.update(weekRef, {
          totalBurned: weekTotal.toString(),
        });
      });

      // Log individual burn
      await db.collection('burns').add({
        token: token.toLowerCase(),
        burner: burner.toLowerCase(),
        amount: amount.toString(),
        weekNumber: Number(weekNumber),
        weekId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        txHash: event.log.transactionHash,
        blockNumber: event.log.blockNumber,
      });
    } catch (error) {
      console.error('Error saving BurnForRank:', error);
    }
  });

  console.log('Leaderboard listener started');
}
