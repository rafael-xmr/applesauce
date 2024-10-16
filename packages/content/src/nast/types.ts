import { EventTemplate, NostrEvent } from "nostr-tools";
import { DecodeResult } from "nostr-tools/nip19";
import { Node as UnistNode, Parent } from "unist";

import { type Token } from "@cashu/cashu-ts";

export interface CommonData {
  eol?: boolean;
}

export interface Node extends Omit<UnistNode, "data"> {
  data?: CommonData;
}

export interface Text extends Node {
  type: "text";
  value: string;
}

export interface Link extends Node {
  type: "link";
  value: string;
  href: string;
}

export interface Mention extends Node {
  type: "mention";
  decoded: DecodeResult;
  encoded: string;
}

export interface CashuToken extends Node {
  type: "cashu";
  token: Token;
  raw: string;
}

export interface LightningInvoice extends Node {
  type: "lightning";
  invoice: string;
}

export interface Hashtag extends Node {
  type: "hashtag";
  value: string;
  tag: ["t", ...string[]];
}

export interface Emoji extends Node {
  type: "emoji";
  code: string;
  raw: string;
  tag: ["emoji", ...string[]];
}

export interface ContentMap {
  text: Text;
  link: Link;
  mention: Mention;
  cashu: CashuToken;
  lightning: LightningInvoice;
  hashtag: Hashtag;
}

export type Content = ContentMap[keyof ContentMap];

export interface Root extends Parent {
  type: "root";
  children: Content[];
  event: NostrEvent | EventTemplate;
}
