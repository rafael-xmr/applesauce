import { EventBlueprint, EventFactory } from "applesauce-factory";
import { WALLET_KIND } from "../helpers/wallet.js";
import { modifyHiddenTags } from "applesauce-factory/operations/event";
import { setMintTags, setPrivateKeyTag } from "../operations/index.js";

/** A blueprint to create a new 17375 wallet */
export function WalletBlueprint(privateKey: Uint8Array, mints: string[]): EventBlueprint {
  return (ctx) =>
    EventFactory.runProcess(
      { kind: WALLET_KIND },
      ctx,
      modifyHiddenTags(setPrivateKeyTag(privateKey), setMintTags(mints)),
    );
}
