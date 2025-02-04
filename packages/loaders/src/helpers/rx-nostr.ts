import { RxNostr } from "rx-nostr";

export function getDefaultReadRelays(rxNostr: RxNostr) {
  return Object.entries(rxNostr.getDefaultRelays())
    .filter(([_, config]) => config.read)
    .map(([relay]) => relay);
}
