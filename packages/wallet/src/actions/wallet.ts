import { generateSecretKey } from "nostr-tools";
import { Action } from "applesauce-actions";
import { WALLET_KIND } from "../helpers/wallet.js";
import { WalletBackupBlueprint, WalletBlueprint } from "../blueprints/wallet.js";

/** An action that creates a new 17375 wallet event and 375 wallet backup */
export function CreateWallet(mints: string[], privateKey: Uint8Array = generateSecretKey()): Action {
  return async ({ events, factory, self, publish }) => {
    const existing = events.getReplaceable(WALLET_KIND, self);
    if (existing) throw new Error("Wallet already exists");

    const wallet = await factory.sign(await factory.create(WalletBlueprint, privateKey, mints));
    const backup = await factory.sign(await factory.create(WalletBackupBlueprint, wallet));

    await publish("Wallet backup", backup);
    await publish("Create wallet", wallet);
  };
}
