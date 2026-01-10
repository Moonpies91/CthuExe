# FCA Compliance Guidelines for CthuCoin

**Document Created:** January 2026
**Purpose:** Outline changes required for UK Financial Conduct Authority (FCA) compliance
**Status:** Recommendations for implementation

---

## Executive Summary

As of January 2024, the UK introduced strict regulations for cryptoasset promotions under the Financial Services and Markets Act 2000 (Financial Promotion) Order 2005. This document outlines the changes CthuCoin needs to implement for FCA compliance.

---

## 1. REQUIRED RISK WARNINGS

### 1.1 Prominent Risk Warning (Mandatory)

The FCA requires a specific risk warning to be displayed prominently. Replace or augment the current `DisclaimerBanner.tsx` with:

**Required Text (FCA PS22/10):**
```
Don't invest unless you're prepared to lose all the money you invest. This is a
high-risk investment and you should not expect to be protected if something goes
wrong. Take 2 mins to learn more.
```

**Additional Required Warnings:**
```
- The value of cryptoassets can go down as well as up
- You may lose all the money you invest
- You should not invest money you cannot afford to lose
- Cryptoassets are not protected by the Financial Services Compensation Scheme (FSCS)
- Cryptoassets are not covered by the Financial Ombudsman Service (FOS)
```

### 1.2 Implementation in DisclaimerBanner.tsx

```tsx
// Suggested replacement for DisclaimerBanner.tsx
'use client'

import { useState } from 'react'

export function DisclaimerBanner() {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-red-950/95 border-b border-red-800">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-start gap-3">
          <span className="text-red-500 font-mono animate-pulse mt-0.5">
            [!]
          </span>
          <div className="text-red-300/90 font-mono text-xs space-y-2">
            {/* FCA Required Risk Warning */}
            <div className="font-bold text-red-400">
              RISK WARNING: Don't invest unless you're prepared to lose all
              the money you invest. This is a high-risk investment and you
              should not expect to be protected if something goes wrong.
            </div>

            <button
              onClick={() => setExpanded(!expanded)}
              className="text-red-500 underline hover:text-red-400"
            >
              {expanded ? 'Show less' : 'Take 2 mins to learn more'}
            </button>

            {expanded && (
              <div className="space-y-2 border-t border-red-800 pt-2 mt-2">
                <ul className="list-disc list-inside space-y-1 text-red-400/80">
                  <li>The value of cryptoassets can go down as well as up</li>
                  <li>You may lose all the money you invest</li>
                  <li>You should not invest money you cannot afford to lose</li>
                  <li>Cryptoassets are not protected by the Financial Services
                      Compensation Scheme (FSCS)</li>
                  <li>Cryptoassets are not covered by the Financial Ombudsman
                      Service (FOS)</li>
                </ul>

                <div className="text-gray-500 text-xs">
                  This website is operated by an individual developer as an
                  experimental project. It is not authorised or regulated by
                  the Financial Conduct Authority (FCA). No financial advice
                  is provided.
                </div>
              </div>
            )}

            {/* Existing hobby project disclaimer */}
            <div className="text-red-400/70 border-t border-red-800/50 pt-2">
              <strong>EXPERIMENTAL PROJECT:</strong> This is a hobby project
              by a solo developer learning about blockchain and web3. Expect
              bugs and breaking changes. DYOR.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

## 2. REQUIRED LEGAL PAGES

### 2.1 Terms of Service (/terms)

Create `frontend/src/app/terms/page.tsx` with the following content structure:

**Required Sections:**
1. **Introduction and Acceptance**
   - By using this website, users accept these terms
   - Minimum age requirement (18+)

2. **Service Description**
   - What CthuCoin offers (DEX, farming, launchpad)
   - Experimental/hobby nature of the project

3. **Risk Acknowledgment**
   - Cryptoasset risks (volatility, loss, smart contract risks)
   - No guarantee of returns
   - Not financial advice

4. **User Responsibilities**
   - Compliance with local laws
   - Wallet security
   - Tax obligations

5. **Intellectual Property**
   - Open source licensing where applicable
   - Branding rights

6. **Limitation of Liability**
   - No liability for losses from trading
   - No liability for smart contract bugs
   - Maximum liability caps

7. **Governing Law**
   - Specify jurisdiction (England and Wales recommended)
   - Dispute resolution mechanism

8. **Changes to Terms**
   - Right to modify terms
   - Notice of changes

**Example Opening:**
```
TERMS OF SERVICE

Last Updated: [DATE]

IMPORTANT: Please read these terms carefully before using CthuCoin. By
accessing or using this website, you agree to be bound by these Terms of
Service.

RISK WARNING: Cryptoassets are high-risk investments. You may lose all
the money you invest. This website is not authorised or regulated by the
Financial Conduct Authority.

1. ABOUT THIS WEBSITE

1.1 CthuCoin is an experimental decentralised exchange (DEX) operated as
    a hobby project by an individual developer.

1.2 This website is NOT authorised or regulated by the Financial Conduct
    Authority (FCA) or any other financial regulatory body.

1.3 Nothing on this website constitutes financial, investment, legal, or
    tax advice.

2. ELIGIBILITY

2.1 You must be at least 18 years old to use this website.

2.2 You must not be a resident of any jurisdiction where the use of
    cryptoasset services is prohibited.

2.3 You are responsible for ensuring your use of this website complies
    with all applicable laws in your jurisdiction.

[Continue with remaining sections...]
```

### 2.2 Privacy Policy (/privacy)

Create `frontend/src/app/privacy/page.tsx` addressing GDPR/UK-GDPR requirements:

**Required Sections:**

1. **Data Controller Information**
   - Who operates the site
   - Contact information

2. **Data Collected**
   - Wallet addresses (public blockchain data)
   - Authentication data (Firebase Auth)
   - Usage data (analytics if used)
   - Cookies

3. **Legal Basis for Processing**
   - Legitimate interests
   - Consent
   - Contract performance

4. **Data Retention**
   - How long data is kept
   - Deletion policies

5. **Third-Party Services**
   - Firebase (Google)
   - WalletConnect
   - RainbowKit
   - Blockchain networks (Monad)

6. **User Rights (GDPR)**
   - Right to access
   - Right to rectification
   - Right to erasure
   - Right to portability
   - Right to object
   - Right to withdraw consent

7. **International Transfers**
   - Firebase servers location
   - Safeguards in place

8. **Cookies**
   - Types used
   - How to manage

**Example Opening:**
```
PRIVACY POLICY

Last Updated: [DATE]

1. INTRODUCTION

This Privacy Policy explains how CthuCoin ("we", "us", "our") collects,
uses, and protects your personal data when you use our website.

2. DATA CONTROLLER

This website is operated by an individual developer as a hobby project.
For data protection enquiries, contact: [EMAIL ADDRESS]

3. DATA WE COLLECT

3.1 Blockchain Data
    - Wallet addresses (publicly visible on blockchain)
    - Transaction history (publicly visible on blockchain)

    Note: Blockchain data is inherently public and immutable. We cannot
    delete data recorded on the blockchain.

3.2 Authentication Data
    - Wallet signatures for authentication
    - Session tokens

3.3 Technical Data
    - IP address (for security purposes)
    - Browser type and version
    - Device information

4. HOW WE USE YOUR DATA

We use your data to:
- Provide access to the DEX functionality
- Process transactions you initiate
- Maintain security of the platform
- Improve user experience

[Continue with remaining sections...]
```

---

## 3. COOKIE CONSENT

### 3.1 PECR Requirements

The Privacy and Electronic Communications Regulations (PECR) require consent for non-essential cookies.

**Implementation:**

Create a cookie consent banner component:

```tsx
// frontend/src/components/common/CookieConsent.tsx
'use client'

import { useState, useEffect } from 'react'

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      setShowBanner(true)
    }
  }, [])

  const acceptCookies = () => {
    localStorage.setItem('cookie-consent', 'accepted')
    setShowBanner(false)
  }

  const rejectCookies = () => {
    localStorage.setItem('cookie-consent', 'rejected')
    setShowBanner(false)
    // Disable non-essential tracking here
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t
                    border-gray-700 p-4 z-50">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row
                      items-center justify-between gap-4">
        <div className="text-gray-300 text-sm">
          We use essential cookies to make this site work. We'd also like
          to set analytics cookies to help us improve. You can accept or
          reject these.{' '}
          <a href="/privacy#cookies" className="text-teal-500 underline">
            Learn more
          </a>
        </div>
        <div className="flex gap-3">
          <button
            onClick={rejectCookies}
            className="px-4 py-2 border border-gray-600 text-gray-400
                       hover:bg-gray-800 text-sm"
          >
            Reject All
          </button>
          <button
            onClick={acceptCookies}
            className="px-4 py-2 bg-teal-600 text-white hover:bg-teal-500
                       text-sm"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

## 4. AGE VERIFICATION

### 4.1 Requirement

Users must confirm they are 18+ before accessing trading functionality.

**Implementation Options:**

**Option A: Simple Acknowledgment (Minimum)**
Add to the wallet connection flow:

```tsx
// Before allowing wallet connection
const [ageConfirmed, setAgeConfirmed] = useState(false)

// Show modal before first trade
<Modal>
  <h2>Age Verification</h2>
  <p>You must be 18 years or older to use this service.</p>
  <p>By continuing, you confirm that you are at least 18 years old.</p>
  <button onClick={() => setAgeConfirmed(true)}>
    I confirm I am 18 or older
  </button>
</Modal>
```

**Option B: Gate on First Visit**
Show age verification before any site access.

---

## 5. FINANCIAL PROMOTION RULES

### 5.1 FCA Requirements for Crypto Promotions

Since October 2023, cryptoasset promotions to UK consumers must be:
1. Approved by an FCA-authorised firm, OR
2. Made by an FCA-registered cryptoasset firm, OR
3. Exempt (e.g., high-net-worth individuals, self-certified sophisticated investors)

### 5.2 Options for CthuCoin

**Option A: UK Consumer Exclusion (Recommended for Hobby Project)**

Add geo-blocking or prominent exclusion:

```tsx
// Add to DisclaimerBanner or as separate component
<div className="bg-yellow-900/50 border border-yellow-700 p-3 text-sm">
  <strong>UK RESIDENTS:</strong> This website is not intended for, and
  should not be accessed by, residents of the United Kingdom. The
  promotions on this website have not been approved by an FCA-authorised
  person. If you are a UK resident, please leave this website.
</div>
```

**Option B: Self-Certified Investor Route**

Require users to self-certify as:
- High-net-worth investor (annual income 100k+ or net assets 250k+), OR
- Self-certified sophisticated investor

This requires a formal declaration form.

**Option C: No Promotional Content**

Remove all marketing language and only provide:
- Technical documentation
- Smart contract information
- No price predictions or profit suggestions

---

## 6. ADDITIONAL RECOMMENDATIONS

### 6.1 Footer Links

Add a footer to all pages with links to:
- Terms of Service
- Privacy Policy
- Risk Warnings
- Contact Information

```tsx
// frontend/src/components/common/Footer.tsx
export function Footer() {
  return (
    <footer className="border-t border-gray-800 mt-8 py-4">
      <div className="max-w-6xl mx-auto px-4 text-center text-gray-600
                      text-xs space-y-2">
        <div className="flex justify-center gap-4">
          <a href="/terms" className="hover:text-gray-400">Terms</a>
          <a href="/privacy" className="hover:text-gray-400">Privacy</a>
          <a href="/risks" className="hover:text-gray-400">Risk Warnings</a>
        </div>
        <div>
          This website is not authorised or regulated by the Financial
          Conduct Authority.
        </div>
        <div>
          Cryptoassets are not protected by the FSCS or covered by the FOS.
        </div>
      </div>
    </footer>
  )
}
```

### 6.2 Transaction Confirmations

Before each swap/trade, show a confirmation:

```tsx
<Modal>
  <h3>Confirm Transaction</h3>
  <p>You are about to swap {amount} {token}.</p>
  <div className="text-yellow-500 text-sm">
    Warning: The value of cryptoassets can go up or down. You may get
    back less than you invested.
  </div>
  <button>Confirm</button>
  <button>Cancel</button>
</Modal>
```

### 6.3 24-Hour Cooling Off Period

FCA recommends (but doesn't require) a cooling-off period for first-time users:

```tsx
// For new wallet connections
if (isFirstTimeUser) {
  showModal({
    title: 'New User Notice',
    content: `
      As a new user, we recommend taking time to understand the risks
      of cryptoasset trading before making any transactions.

      Trading will be available 24 hours after your first connection.
    `
  })
}
```

---

## 7. IMPLEMENTATION CHECKLIST

### Immediate Priority (Do First):

- [ ] Update DisclaimerBanner with FCA risk warning
- [ ] Create Terms of Service page (`/terms`)
- [ ] Create Privacy Policy page (`/privacy`)
- [ ] Add UK exclusion notice (if not seeking FCA approval)

### Secondary Priority:

- [ ] Add Cookie Consent banner
- [ ] Add Footer component with legal links
- [ ] Implement age verification gate

### Optional Enhancements:

- [ ] Transaction confirmation modals
- [ ] Cooling-off period for new users
- [ ] Geo-blocking for UK IP addresses

---

## 8. RESOURCES

### FCA Guidance Documents:

1. **PS22/10** - Strengthening our financial promotion rules for
   cryptoassets
   https://www.fca.org.uk/publications/policy-statements/ps22-10

2. **FG23/3** - Financial promotions on social media
   https://www.fca.org.uk/publications/finalised-guidance/fg23-3

3. **Cryptoasset promotions regime**
   https://www.fca.org.uk/cryptoassets

### ICO (Data Protection):

1. **Guide to the UK GDPR**
   https://ico.org.uk/for-organisations/guide-to-data-protection/

2. **Cookies guidance**
   https://ico.org.uk/for-organisations/guide-to-pecr/cookies/

---

## 9. DISCLAIMER

This document provides general guidance only and does not constitute legal
advice. For specific legal requirements, consult with a qualified legal
professional familiar with UK financial services regulation and data
protection law.

The FCA regulatory landscape for cryptoassets is evolving. Requirements
may change. Regularly review FCA publications for updates.

---

*Document prepared for CthuCoin project - January 2026*
