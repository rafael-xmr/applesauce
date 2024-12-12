import { unixNow } from "applesauce-core/helpers";
import { AddressPointer } from "nostr-tools/nip19";
import { EventTemplate, NostrEvent, VerifiedEvent } from "nostr-tools";

import { includeClientTag } from "./operations/client.js";
import { CommentBlueprint } from "./blueprints/comment.js";
import { NoteBlueprint } from "./blueprints/note.js";
import { ReactionBlueprint } from "./blueprints/reaction.js";

export type EventFactoryTemplate = { kind: number; content?: string; pubkey?: string };

/** A single operation in the factory process */
export type EventFactoryOperation = (
  draft: EventTemplate,
  context: EventFactoryContext,
) => EventTemplate | Promise<EventTemplate>;

/** A prebuilt event template */
export type EventFactoryBlueprint = (context: EventFactoryContext) => EventTemplate | Promise<EventTemplate>;

export type EventFactorySigner = {
  getPublicKey: () => Promise<string> | string;
  signEvent: (template: EventTemplate) => Promise<VerifiedEvent> | VerifiedEvent;
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
  address?: Omit<AddressPointer, "kind" | "relays"> & { kind: 31990 };
};

export type EventFactoryContext = {
  client?: EventFactoryClient;
  getRelayHint?: (event: NostrEvent) => string | undefined | Promise<string> | Promise<undefined>;
  getPubkeyRelayHint?: (pubkey: string) => string | undefined | Promise<string> | Promise<undefined>;
  signer?: EventFactorySigner;
};

export class EventFactory {
  constructor(protected context: EventFactoryContext = {}) {}

  static async runProcess(
    template: EventFactoryTemplate,
    context: EventFactoryContext,
    ...operations: (EventFactoryOperation | undefined)[]
  ): Promise<EventTemplate> {
    let draft: EventTemplate = { ...template, content: "", created_at: unixNow(), tags: [] };

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

  /** Creates a reaction event */
  reaction(...args: Parameters<typeof ReactionBlueprint>) {
    return this.create(ReactionBlueprint, ...args);
  }
}
