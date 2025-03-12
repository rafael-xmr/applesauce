import { EventBlueprint, EventFactory } from "applesauce-factory";
import { modifyHiddenTags } from "applesauce-factory/operations/event";

import { WALLET_BACKUP_KIND, WALLET_KIND } from "../helpers/wallet.js";
import { NostrEvent } from "nostr-tools";
import { setWalletBackupContent } from "../operations/event/wallet.js";
import { setMintTags, setPrivateKeyTag } from "../operations/tag/wallet.js";

/** A blueprint to create a new 17375 wallet */
export function WalletBlueprint(privateKey: Uint8Array, mints: string[]): EventBlueprint {
  return (ctx) =>
    EventFactory.runProcess(
      { kind: WALLET_KIND },
      ctx,
      modifyHiddenTags(setPrivateKeyTag(privateKey), setMintTags(mints)),
    );
}

/** A blueprint that creates a new 375 wallet backup event */
export function WalletBackupBlueprint(wallet: NostrEvent): EventBlueprint {
  return (ctx) => EventFactory.runProcess({ kind: WALLET_BACKUP_KIND }, ctx, setWalletBackupContent(wallet));
}
