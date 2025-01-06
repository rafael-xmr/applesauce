import { Emoji, unixNow } from "applesauce-core/helpers";
import { AddressPointer } from "nostr-tools/nip19";
import { EventTemplate, NostrEvent } from "nostr-tools";

import { includeClientTag } from "./operations/client.js";
import { CommentBlueprint } from "./blueprints/comment.js";
import { NoteBlueprint } from "./blueprints/note.js";
import { ReactionBlueprint } from "./blueprints/reaction.js";
import { DeleteBlueprint } from "./blueprints/delete.js";
import { NoteReplyBlueprint } from "./blueprints/reply.js";
import { ShareBlueprint } from "./blueprints/share.js";

export type EventFactoryTemplate = {
  kind: number;
  content?: string;
  pubkey?: string;
  tags?: string[][];
  created_at?: number;
};

/** A single operation in the factory process */
export type EventFactoryOperation = (
  draft: EventTemplate,
  context: EventFactoryContext,
) => EventTemplate | Promise<EventTemplate>;

/** A prebuilt event template */
export type EventFactoryBlueprint = (context: EventFactoryContext) => EventTemplate | Promise<EventTemplate>;

export type EventFactorySigner = {
  getPublicKey: () => Promise<string> | string;
  signEvent: (template: EventTemplate) => Promise<NostrEvent> | NostrEvent;
  nip04?: {
    encrypt: (pubkey: string, plaintext: string) => Promise<string> | string;
    decrypt: (pubkey: string, ciphertext: string) => Promise<string> | string;
  };
  nip44?: {
    encrypt: (pubkey: string, plaintext: string) => Promise<string> | string;
    decrypt: (pubkey: string, ciphertext: string) => Promise<string> | string;
  };
};

export type EventFactoryClient = {
  name: string;
  address?: Omit<AddressPointer, "kind" | "relays">;
};

export type EventFactoryContext = {
  /** NIP-89 client tag */
  client?: EventFactoryClient;
  getRelayHint?: (event: NostrEvent) => string | undefined | Promise<string> | Promise<undefined>;
  getPubkeyRelayHint?: (pubkey: string) => string | undefined | Promise<string> | Promise<undefined>;
  /** A signer used to encrypt the content of some notes */
  signer?: EventFactorySigner;
  /** An array of custom emojis that will be used in text note content */
  emojis?: Emoji[];
};

export class EventFactory {
  constructor(public context: EventFactoryContext = {}) {}

  static async runProcess(
    template: EventFactoryTemplate,
    context: EventFactoryContext,
    ...operations: (EventFactoryOperation | undefined)[]
  ): Promise<EventTemplate> {
    let draft: EventTemplate = { content: "", created_at: unixNow(), tags: [], ...template };

    // run operations
    for (const operation of operations) {
      if (operation) draft = await operation(draft, context);
    }

    // add client tag
    if (context.client) {
      draft = await includeClientTag(context.client.name, context.client.address)(draft, context);
    }

    return draft;
  }

  /** Process an event template with operations */
  async process(
    template: EventFactoryTemplate,
    ...operations: (EventFactoryOperation | undefined)[]
  ): Promise<EventTemplate> {
    return await EventFactory.runProcess(template, this.context, ...operations);
  }

  /** Create an event from a blueprint */
  async create<Args extends Array<any>>(
    blueprint: (...args: Args) => EventFactoryBlueprint,
    ...args: Args
  ): Promise<EventTemplate> {
    return await blueprint(...args)(this.context);
  }

  // Helpers

  /** Create a NIP-22 comment */
  comment(...args: Parameters<typeof CommentBlueprint>) {
    return this.create(CommentBlueprint, ...args);
  }

  /** Creates a short text note */
  note(...args: Parameters<typeof NoteBlueprint>) {
    return this.create(NoteBlueprint, ...args);
  }

  /** Creates a short text note reply */
  noteReply(...args: Parameters<typeof NoteReplyBlueprint>) {
    return this.create(NoteReplyBlueprint, ...args);
  }

  /** Creates a reaction event */
  reaction(...args: Parameters<typeof ReactionBlueprint>) {
    return this.create(ReactionBlueprint, ...args);
  }

  /** Creates a delete event */
  delete(...args: Parameters<typeof DeleteBlueprint>) {
    return this.create(DeleteBlueprint, ...args);
  }

  /** Creates a share event */
  share(...args: Parameters<typeof ShareBlueprint>) {
    return this.create(ShareBlueprint, ...args);
  }
}
