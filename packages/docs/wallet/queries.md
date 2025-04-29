# Queries

The `applesauce-wallet` package provides a few pre-built queries for subscribing to the state of the wallet.

## WalletQuery

The `WalletQuery` subscribes to the state of a NIP-60 wallet, providing information about whether it's locked and its associated mints.

```typescript
import { WalletQuery } from "applesauce-wallet/queries";

const wallet = queryStore.createQuery(WalletQuery, pubkey).subscribe((info) => {
  if (!info) return console.log("No wallet found");

  if (info.locked) {
    console.log("Wallet is locked");
  } else {
    console.log("Wallet mints:", info.mints);
    console.log("Has private key:", !!info.privateKey);
  }
});
```

## WalletTokensQuery

The `WalletTokensQuery` subscribes to all token events for a wallet, with optional filtering by locked status.

```typescript
import { WalletTokensQuery } from "applesauce-wallet/queries";

// Get all tokens
const allTokens = queryStore.createQuery(WalletTokensQuery, pubkey);

// Get only unlocked tokens
const unlockedTokens = queryStore.createQuery(WalletTokensQuery, pubkey, false);
```

## WalletBalanceQuery

The `WalletBalanceQuery` returns the visible balance of a wallet for each mint.

```typescript
import { WalletBalanceQuery } from "applesauce-wallet/queries";

queryStore.createQuery(WalletBalanceQuery, pubkey).subscribe((balances) => {
  for (const [mint, amount] of Object.entries(balances)) {
    console.log(`Balance for ${mint}: ${amount}`);
  }
});
```
