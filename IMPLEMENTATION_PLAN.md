# CthuCoin Implementation Plan

## Project Overview

CthuCoin is a Lovecraftian-themed DeFi ecosystem on the Monad blockchain featuring:
- **CthuCoin (CTHU)**: Native ERC-20 token (1B supply)
- **CthuSwap**: Uniswap V2-style DEX with custom fee distribution
- **Cultist Launchpad**: Token launch platform with bonding curves
- **Eldritch Farms**: Yield farming with fixed pool weights
- **Weekly Leaderboard**: Burn-to-promote ranking system
- **Terminal UI**: Retro-futuristic interface with progressive glitch effects

---

## Phase 1: Project Setup & Smart Contracts

### 1.1 Development Environment Setup
- [ ] Initialize Foundry project for smart contracts
- [ ] Set up Hardhat as alternative testing framework
- [ ] Configure Monad testnet (Chain ID: 10143)
- [ ] Create deployment scripts structure
- [ ] Set up environment variables template

### 1.2 Core Token Contract (CTHUCOIN.sol)
- [ ] Implement ERC-20 with 18 decimals
- [ ] Total supply: 1,000,000,000 CTHU
- [ ] Initial distribution in constructor:
  - 15,000,000 (1.5%) to deployer for initial liquidity
  - 100,000,000 (10%) to dev wallet (with vesting logic)
  - 885,000,000 (88.5%) to farm contract
- [ ] Implement 12-month linear vesting for dev allocation
- [ ] Add burn function (send to 0xdead)
- [ ] Emit Transfer and Burn events

### 1.3 DEX Contracts (CthuSwap)

#### CthuFactory.sol
- [ ] Fork UniswapV2Factory
- [ ] Modify fee recipient logic for 3-way split
- [ ] Remove admin setFeeTo function (immutable)
- [ ] Store CTHU address and burn address

#### CthuPair.sol
- [ ] Fork UniswapV2Pair
- [ ] Implement custom fee distribution:
  - 0.20% to LP providers (stays in pool)
  - 0.05% to CTHU stakers
  - 0.05% swap to CTHU and burn

#### CthuRouter.sol
- [ ] Fork UniswapV2Router02
- [ ] Standard implementation (no modifications needed)
- [ ] Use WMONAD instead of WETH

### 1.4 Farming Contract (CthuFarm.sol)
- [ ] Fork SushiSwap MasterChef
- [ ] Remove migrator pattern completely
- [ ] Hardcode pool weights (immutable):
  - Pool 0: CTHU/MONAD LP - 50%
  - Pool 1: CTHU/USDT LP - 25%
  - Pool 2: MONAD/USDT LP - 15%
  - Pool 3: Graduated token pools - 10%
- [ ] Implement 4-year emission schedule:
  - Year 1: 400M CTHU (12.68/second)
  - Year 2: 200M CTHU (6.34/second)
  - Year 3: 100M CTHU (3.17/second)
  - Year 4: 185M CTHU (5.86/second)
- [ ] Functions: deposit, withdraw, harvest, pendingReward
- [ ] Add ReentrancyGuard on all external functions

### 1.5 Launchpad Contracts (Cultist Launchpad)

#### CultistLaunchpad.sol
- [ ] Token summoning with 100 MONAD fee
- [ ] Fee handling: swap to CTHU and burn
- [ ] Bonding curve implementation (pump.fun style):
  ```
  price = virtualReserve / (totalSupply - tokensSold)
  ```
- [ ] Graduation threshold: 50,000 USDT equivalent
- [ ] Post-graduation fund distribution:
  - 80% to liquidity pool
  - 10% to token creator
  - 5% to protocol treasury
  - 3% to CTHU buyback/burn
  - 2% to CTHU/MONAD LP
- [ ] Automatic LP token burn on graduation

#### LaunchedToken.sol
- [ ] Template for summoned tokens
- [ ] Fixed 1B supply per token:
  - 800M (80%) for bonding curve sale
  - 150M (15%) for graduation liquidity
  - 50M (5%) for creator allocation

### 1.6 Sell Lock Mechanism
- [ ] Lock cost formula: `dailyCost = 10000 * (1.25 ^ (day - 1))`
- [ ] Lock fee distribution: 95% burn, 5% dev treasury
- [ ] Force unlock: 5x creator's burned amount (100% burned)
- [ ] Functions: lockSells, forceUnlock, getLockInfo, calculateLockCost

### 1.7 Leaderboard Contract (Leaderboard.sol)
- [ ] Weekly reset (Monday 00:00 UTC)
- [ ] Track CTHU burned per token per week
- [ ] Historical data preservation
- [ ] Functions: burnForRank, getCurrentWeekBurns, getTopTokens, getHistoricalLeaderboard

### 1.8 Smart Contract Testing
- [ ] Unit tests for all contracts (>90% coverage)
- [ ] Integration tests for multi-contract interactions
- [ ] Invariant tests (token supply, LP math, bonding curve)
- [ ] Fuzz tests for all user-input functions
- [ ] Gas optimization pass

---

## Phase 2: Frontend Development

### 2.1 Project Setup
- [ ] Initialize Next.js 14+ with App Router
- [ ] Configure TypeScript
- [ ] Set up TailwindCSS
- [ ] Install dependencies:
  - wagmi v2
  - viem
  - @tanstack/react-query
  - framer-motion
  - RainbowKit or ConnectKit
- [ ] Configure custom fonts (IBM Plex Mono, JetBrains Mono)

### 2.2 Terminal Visual System
- [ ] Create base terminal styling:
  - Background: #000000 or #0a0a0a
  - Text: #FFFFFF
  - Monospace fonts
- [ ] Implement scanline overlay (2px spacing, 5% opacity)
- [ ] Build GlitchOverlay component:
  - Chromatic aberration (RGB channel offset)
  - VHS tracking distortion
  - Screen shake on interactions

### 2.3 Madness Level System
- [ ] Create useGlitchLevel hook based on CTHU holdings:
  - Level 0-1 (0-999K): 1-2px aberration, micro-glitch every 30-60s
  - Level 2 (1M-5M): 2-3px, flicker every 15-30s
  - Level 3 (5M-20M): 3-5px, glitch every 5-10s, text corruption
  - Level 4 (20M-50M): 5-8px, constant noise, screen warping
  - Level 5 (50M+): 8-12px, maximum chaos
- [ ] Implement Sanity Mode toggle (reduce effects 50-75%)
- [ ] Store preference in localStorage

### 2.4 Boot Sequence
- [ ] Create BootSequence component
- [ ] Duration: 5-10 seconds (skippable)
- [ ] Only show on first visit per session (localStorage check)
- [ ] Sequential message display:
  ```
  INITIALIZING CTHU-OS v0.6.6.6...
  LOADING ELDRITCH PROTOCOLS...
  CONNECTING TO THE VOID...
  ... (full sequence from spec)
  Ph'nglui mglw'nafh Cthulhu R'lyeh wgah'nagl fhtagn
  SYSTEM READY. WELCOME, CULTIST.
  ```

### 2.5 Core Pages

#### Home/Main Menu (page.tsx)
- [ ] Boot sequence on first load
- [ ] Terminal-style main menu
- [ ] Navigation to all sections

#### DEX - Swap (/swap)
- [ ] Token selector with search
- [ ] Amount input with balance display
- [ ] Price impact calculation
- [ ] Slippage settings
- [ ] Swap execution with transaction modal

#### DEX - Liquidity (/liquidity)
- [ ] Add liquidity interface
- [ ] Remove liquidity interface
- [ ] LP token balance display
- [ ] Pool share calculation

#### Farming (/farm)
- [ ] Pool list with APR display
- [ ] Deposit/withdraw interface
- [ ] Pending rewards display
- [ ] Harvest function
- [ ] Total value locked stats

#### Launchpad Home (/launchpad)
- [ ] Active token listings
- [ ] Graduated tokens section
- [ ] Weekly leaderboard display
- [ ] Search and filter

#### Token Summoning (/launchpad/summon)
- [ ] Token name/symbol input
- [ ] Image upload (to IPFS or Firebase Storage)
- [ ] 100 MONAD fee display
- [ ] Transaction confirmation

#### Token Trading (/launchpad/[address])
- [ ] Bonding curve visualization
- [ ] Buy/sell interface
- [ ] Progress to graduation display
- [ ] Sell lock status and controls
- [ ] Burn for rank interface

#### Leaderboard (/leaderboard)
- [ ] Current week rankings (top 10)
- [ ] Historical weeks navigation
- [ ] Token burn statistics

#### User Profile (/profile/[address])
- [ ] Username display/edit
- [ ] Wallet address (truncated)
- [ ] CTHU holdings and madness level
- [ ] Tokens launched count
- [ ] Successful graduations
- [ ] Total CTHU burned
- [ ] Highest leaderboard rank
- [ ] Farming rewards earned

### 2.6 Common Components
- [ ] WalletConnect button with RainbowKit/ConnectKit
- [ ] TransactionModal (pending, success, error states)
- [ ] Trollbox chat ticker (bottom of all pages)
- [ ] Token logo display
- [ ] Number formatting utilities

### 2.7 Responsive Design
- [ ] Mobile-first approach
- [ ] Tablet breakpoints
- [ ] Desktop optimization
- [ ] Touch-friendly controls

---

## Phase 3: Backend & Infrastructure

### 3.1 Firebase Setup
- [ ] Create Firebase project
- [ ] Enable Firestore Database
- [ ] Enable Realtime Database
- [ ] Enable Authentication
- [ ] Set up Cloud Functions
- [ ] Configure hosting

### 3.2 Firestore Schema Implementation
- [ ] Users collection:
  ```
  users/{walletAddress}: {
    username, walletAddress, createdAt,
    tokensLaunched, totalBurned, highestLeaderboardRank
  }
  ```
- [ ] Tokens collection:
  ```
  tokens/{tokenAddress}: {
    name, symbol, imageUri, creator, createdAt,
    totalRaised, graduated, graduatedAt,
    sellLocked, lockExpiry, creatorBurned
  }
  ```
- [ ] Leaderboards collection:
  ```
  leaderboards/{weekNumber}: {
    startTime, endTime, rankings[]
  }
  ```

### 3.3 Realtime Database (Trollbox)
- [ ] Chat messages structure:
  ```
  chat/messages/{messageId}: {
    username, walletAddress, message, timestamp
  }
  ```
- [ ] Configure 24-hour TTL rules
- [ ] Rate limiting rules

### 3.4 Cloud Functions
- [ ] Username registration endpoint
- [ ] Username uniqueness check
- [ ] Chat message validation (280 chars, ASCII only, no links)
- [ ] Rate limiting (1 msg per 30 seconds)
- [ ] SIWE signature verification

### 3.5 Blockchain Indexer
- [ ] Initialize Node.js/TypeScript project
- [ ] Configure ethers.js v6 for Monad
- [ ] Set up firebase-admin SDK
- [ ] Implement event listeners:
  - CTHUCOIN: Transfer, Burn
  - CultistLaunchpad: TokenSummoned, TokenBought, TokenSold, TokenGraduated, SellsLocked, SellsUnlocked
  - Leaderboard: BurnedForRank
  - CthuFarm: Deposit, Withdraw, Harvest
- [ ] Real-time Firestore updates
- [ ] Block tracking for restart recovery
- [ ] Deploy to Railway or Render

---

## Phase 4: Testing & Deployment

### 4.1 Testnet Deployment (Monad Testnet - Chain ID: 10143)
- [ ] Deploy all contracts in order:
  1. CTHUCOIN.sol
  2. CthuFactory.sol
  3. CthuRouter.sol
  4. CthuFarm.sol
  5. Leaderboard.sol
  6. CultistLaunchpad.sol
- [ ] Create CTHU/MONAD pair
- [ ] Add initial liquidity (15M CTHU + 11k MONAD)
- [ ] Burn LP tokens
- [ ] Configure farm pools
- [ ] Verify all contracts on explorer

### 4.2 Frontend Testing
- [ ] Connect to testnet contracts
- [ ] Test all swap flows
- [ ] Test liquidity add/remove
- [ ] Test farming deposit/withdraw/harvest
- [ ] Test token summoning
- [ ] Test bonding curve buy/sell
- [ ] Test graduation flow
- [ ] Test sell lock mechanism
- [ ] Test leaderboard burns
- [ ] Test profile creation
- [ ] Test trollbox chat

### 4.3 Security Audit Preparation
- [ ] Generate comprehensive test report
- [ ] Document all external calls
- [ ] Prepare deployment scripts for audit
- [ ] Consider external audit (optional but recommended)

### 4.4 Mainnet Deployment (Chain ID: 10142)
- [ ] Final code freeze
- [ ] Deploy contracts (same order as testnet)
- [ ] Create CTHU/MONAD pair
- [ ] Add initial liquidity:
  - 15,000,000 CTHU
  - 11,000 MONAD
  - Initial price: ~0.000733 MONAD per CTHU
- [ ] Burn LP tokens to 0xdead
- [ ] Configure all farm pools
- [ ] Verify all contracts
- [ ] Update frontend environment variables
- [ ] Deploy frontend to Firebase Hosting

---

## File Structure

```
cthucoin/
├── contracts/                    # Smart contracts (Foundry)
│   ├── src/
│   │   ├── CTHUCOIN.sol
│   │   ├── dex/
│   │   │   ├── CthuFactory.sol
│   │   │   ├── CthuPair.sol
│   │   │   └── CthuRouter.sol
│   │   ├── farm/
│   │   │   └── CthuFarm.sol
│   │   ├── launchpad/
│   │   │   ├── CultistLaunchpad.sol
│   │   │   ├── LaunchedToken.sol
│   │   │   └── SellLock.sol
│   │   └── leaderboard/
│   │       └── Leaderboard.sol
│   ├── test/
│   ├── script/
│   └── foundry.toml
├── frontend/                     # Next.js frontend
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── config/
│   ├── public/
│   └── package.json
├── indexer/                      # Event indexer
│   ├── src/
│   │   ├── index.ts
│   │   ├── listeners/
│   │   └── firebase/
│   └── package.json
├── firebase/                     # Cloud functions
│   └── functions/
└── docs/
    └── CthuCoin_Dev_Specification.docx
```

---

## Key Technical Decisions

1. **Immutability**: No admin functions, no pause, no migrator - fully decentralized
2. **Fee Structure**: 0.30% total (0.20% LP, 0.05% stakers, 0.05% burn)
3. **Bonding Curve**: Exponential (pump.fun style) with 50k USDT graduation threshold
4. **Vesting**: 12-month linear for dev tokens
5. **Farming**: 4-year fixed emission, immutable pool weights
6. **Frontend**: Terminal aesthetic with progressive glitch based on holdings

---

## Estimated Resource Requirements

### Development
- Solidity Developer: Smart contracts
- Frontend Developer: Next.js/React
- Backend Developer: Firebase/Node.js

### Infrastructure (Monthly)
- Firebase (Blaze Plan): ~$20-50
- Indexer Hosting (Railway/Render): ~$5-10
- RPC Provider: Monad public endpoints (free)

### One-time Costs
- Mainnet Deployment Gas: ~0.02 MONAD total
- Initial Liquidity: 11,000 MONAD (~$207 at current prices)

---

## Next Steps

1. **Immediate**: Set up development environment and project structure
2. **Week 1-2**: Implement core token and DEX contracts
3. **Week 3-4**: Implement launchpad and farming contracts
4. **Week 5-6**: Complete frontend terminal UI and DEX interface
5. **Week 7-8**: Complete launchpad interface and social features
6. **Week 9**: Backend and indexer development
7. **Week 10-12**: Testing, bug fixes, and deployment

---

*Plan created December 24, 2025*
*Based on CthuCoin Development Specification v1.1*
