import { EventPointer } from "nostr-tools/nip19";
import { HistoryContent, WALLET_HISTORY_KIND } from "../helpers/history.js";
import { EventBlueprint, EventFactory } from "applesauce-factory";
import { setHistoryContent, setHistoryRedeemed } from "../operations/event/history.js";

/** A blueprint that creates a wallet history event */
export function WalletHistoryBlueprint(content: HistoryContent, redeemed: (string | EventPointer)[]): EventBlueprint {
  return (ctx) =>
    EventFactory.runProcess(
      { kind: WALLET_HISTORY_KIND },
      ctx,
      // set the encrypted tags on the event
      setHistoryContent(content),
      // set the public redeemed tags
      setHistoryRedeemed(redeemed),
    );
}
