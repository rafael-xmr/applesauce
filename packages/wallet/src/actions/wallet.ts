import { generateSecretKey } from "nostr-tools";
import { Action } from "applesauce-actions";
import { WALLET_KIND } from "../helpers/wallet.js";
import { WalletBackupBlueprint, WalletBlueprint } from "../blueprints/wallet.js";

/** An action that creates a new 17375 wallet event and 375 wallet backup */
export function CreateWallet(mints: string[], privateKey = generateSecretKey()): Action {
  return async ({ events, factory, self, publish }) => {
    const existing = events.getReplaceable(WALLET_KIND, self);
    if (existing) throw new Error("Wallet already exists");

    const backup = await factory.create(WalletBackupBlueprint, privateKey, mints);
    const wallet = await factory.create(WalletBlueprint, privateKey, mints);

    await publish("Wallet backup", await factory.sign(backup));
    await publish("New wallet", await factory.sign(wallet));
  };
}
