# Security Specification for Firestore Rules

## 1. Data Invariants
1. A user can only read and write their own document in the `/users/{userId}` collection. No one else can read or write to it.
2. Under subcollections `/users/{userId}/transactions/{transactionId}` and `/users/{userId}/completedCycles/{cycleId}`, only the authenticated user matching `{userId}` has access to read, list, create, update, or delete records.
3. Users cannot create transactions or completedCycles with a `userId` property that does not match their own authenticated `uid`.
4. Any document update must validate type constraints: money amounts must be numeric, IDs must match formatting bounds, type enums must match known values.

## 2. The "Dirty Dozen" Payloads (Vulnerability Test Scenarios)

1. **Identity Spoofing - Profile Access**: User A attempts to read or write `/users/userB` configuration.
2. **Identity Spoofing - Transaction Inject**: User A attempts to write a transaction to `/users/userB/transactions/tx_123`.
3. **Identity Spoofing - Completed Cycle Hijack**: User A attempts to write to `/users/userB/completedCycles/cycle_123`.
4. **Field Poisoning - Infinite Money**: User A attempts to record a transaction where `amount` is a string `"100000000"` instead of a number.
5. **State Splendor - Shadow Profile Change**: User attempts to update their `/users/{userId}` document with a ghost field `isAdmin: true` that is not declared in the whitelist/schema.
6. **Integrity Shattering - Invalid Transaction Type**: Writing a transaction with `type` equal to `"jackpot"` (violating the enum `deposit | withdraw | win | loss`).
7. **Integrity Shattering - Invalid Cycle Status**: Writing a completed cycle with `status` equal to `"pending"` or `"draft"` (violating the enum `completed_win | completed_loss`).
8. **Denial of Wallet - Exhaustion Attack ID**: Writing a transaction with document ID that is over 500 characters of noise.
9. **No-Authentication bypass**: Unauthenticated client attempts to read `/users/userA` profile details.
10. **Immutability Breach**: Attempting to alter `id` or `userId` in an existing transaction or completedCycle via an update operation.
11. **Negative Money Inject**: Writing a transaction with negative `amount` when `amount` must be non-negative.
12. **Malformed JSON/Object Injection**: Trying to overwrite `/users/{userId}` presets with an plain string instead of the structured preset map.

## 3. Test Runner Definition (`firestore.rules.test.ts`)

A test runner would emulate these scenarios using `@firebase/rules-unit-testing`. Each test runs the payloads against the local emulator to verify `PERMISSION_DENIED` is raised for all of them.

```typescript
import {
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'charming-respect-m8gvj',
    firestore: {
      rules: require('fs').readFileSync('firestore.rules', 'utf8'),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe('Firestore Security Rules', () => {
  it('denies reads and writes from User A to User B data', async () => {
    const aliceDb = testEnv.authenticatedContext('alice').firestore();
    const bobDoc = doc(aliceDb, 'users/bob');
    await expect(getDoc(bobDoc)).rejects.toThrow();
    await expect(setDoc(bobDoc, { initialBalance: 1000 })).rejects.toThrow();
  });

  it('denies writing dirty transaction types', async () => {
    const aliceDb = testEnv.authenticatedContext('alice').firestore();
    const txDoc = doc(aliceDb, 'users/alice/transactions/tx_1');
    await expect(setDoc(txDoc, { 
      id: 'tx_1', 
      type: 'invalid_type', 
      amount: 45, 
      balanceAfter: 1045, 
      date: '2026-05-24', 
      description: 'Green', 
      userId: 'alice' 
    })).rejects.toThrow();
  });
});
```
