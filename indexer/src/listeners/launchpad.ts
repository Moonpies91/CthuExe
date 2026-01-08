import { ethers } from 'ethers';
import { db, admin } from '../firebase';

// CultistLaunchpad ABI (events only)
const LAUNCHPAD_ABI = [
  'event TokenSummoned(address indexed token, address indexed creator, string name, string symbol)',
  'event TokenBought(address indexed token, address indexed buyer, uint256 monadIn, uint256 tokensOut, uint256 newPrice)',
  'event TokenSold(address indexed token, address indexed seller, uint256 tokensIn, uint256 monadOut, uint256 newPrice)',
  'event TokenGraduated(address indexed token, address pair, uint256 liquidityMoand, uint256 liquidityTokens)',
  'event SellLockPurchased(address indexed token, address indexed buyer, uint256 day, uint256 cost)',
  'event SellLockUnlocked(address indexed token, address indexed holder, uint256 cost)',
];

export function setupLaunchpadListener(
  provider: ethers.Provider,
  launchpadAddress: string
) {
  const launchpad = new ethers.Contract(launchpadAddress, LAUNCHPAD_ABI, provider);

  // Token Summoned
  launchpad.on('TokenSummoned', async (token, creator, name, symbol, event) => {
    console.log(`Token Summoned: ${name} (${symbol}) at ${token}`);

    try {
      await db.collection('tokens').doc(token.toLowerCase()).set({
        address: token.toLowerCase(),
        creator: creator.toLowerCase(),
        name,
        symbol,
        graduated: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        totalBought: '0',
        totalSold: '0',
        lastPrice: '0',
        holders: 0,
        txHash: event.log.transactionHash,
        blockNumber: event.log.blockNumber,
      });
    } catch (error) {
      console.error('Error saving TokenSummoned:', error);
    }
  });

  // Token Bought
  launchpad.on('TokenBought', async (token, buyer, monadIn, tokensOut, newPrice, event) => {
    console.log(`Token Bought: ${ethers.formatEther(tokensOut)} of ${token}`);

    try {
      const tokenRef = db.collection('tokens').doc(token.toLowerCase());

      await db.runTransaction(async (transaction) => {
        const tokenDoc = await transaction.get(tokenRef);
        if (!tokenDoc.exists) return;

        const data = tokenDoc.data()!;
        const totalBought = BigInt(data.totalBought) + BigInt(monadIn.toString());

        transaction.update(tokenRef, {
          totalBought: totalBought.toString(),
          lastPrice: newPrice.toString(),
          lastActivity: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      // Add trade to subcollection
      await tokenRef.collection('trades').add({
        type: 'buy',
        trader: buyer.toLowerCase(),
        monadAmount: monadIn.toString(),
        tokenAmount: tokensOut.toString(),
        price: newPrice.toString(),
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        txHash: event.log.transactionHash,
        blockNumber: event.log.blockNumber,
      });
    } catch (error) {
      console.error('Error saving TokenBought:', error);
    }
  });

  // Token Sold
  launchpad.on('TokenSold', async (token, seller, tokensIn, monadOut, newPrice, event) => {
    console.log(`Token Sold: ${ethers.formatEther(tokensIn)} of ${token}`);

    try {
      const tokenRef = db.collection('tokens').doc(token.toLowerCase());

      await db.runTransaction(async (transaction) => {
        const tokenDoc = await transaction.get(tokenRef);
        if (!tokenDoc.exists) return;

        const data = tokenDoc.data()!;
        const totalSold = BigInt(data.totalSold) + BigInt(monadOut.toString());

        transaction.update(tokenRef, {
          totalSold: totalSold.toString(),
          lastPrice: newPrice.toString(),
          lastActivity: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      // Add trade to subcollection
      await tokenRef.collection('trades').add({
        type: 'sell',
        trader: seller.toLowerCase(),
        monadAmount: monadOut.toString(),
        tokenAmount: tokensIn.toString(),
        price: newPrice.toString(),
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        txHash: event.log.transactionHash,
        blockNumber: event.log.blockNumber,
      });
    } catch (error) {
      console.error('Error saving TokenSold:', error);
    }
  });

  // Token Graduated
  launchpad.on('TokenGraduated', async (token, pair, liquidityMonad, liquidityTokens, event) => {
    console.log(`Token Graduated: ${token} -> Pair: ${pair}`);

    try {
      await db.collection('tokens').doc(token.toLowerCase()).update({
        graduated: true,
        graduatedAt: admin.firestore.FieldValue.serverTimestamp(),
        pairAddress: pair.toLowerCase(),
        graduationLiquidityMonad: liquidityMonad.toString(),
        graduationLiquidityTokens: liquidityTokens.toString(),
        txHash: event.log.transactionHash,
      });
    } catch (error) {
      console.error('Error saving TokenGraduated:', error);
    }
  });

  // Sell Lock Purchased
  launchpad.on('SellLockPurchased', async (token, buyer, day, cost, event) => {
    console.log(`Sell Lock Purchased: Day ${day} for ${token}`);

    try {
      await db.collection('tokens').doc(token.toLowerCase())
        .collection('sellLocks').add({
          buyer: buyer.toLowerCase(),
          day: Number(day),
          cost: cost.toString(),
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          txHash: event.log.transactionHash,
        });
    } catch (error) {
      console.error('Error saving SellLockPurchased:', error);
    }
  });

  console.log('Launchpad listener started');
}
