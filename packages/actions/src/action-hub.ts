import { EventStore } from "applesauce-core";
import { EventFactory } from "applesauce-factory";
import { NostrEvent } from "nostr-tools";

import { FollowUser } from "./actions/contacts.js";

/**
 * A callback used to tell the upstream app to publish an event
 * @param label a label describing what
 */
export type PublishMethod = (label: string, event: NostrEvent, explicitRelays?: string[]) => Promise<void>;

/** The context that is passed to actions for them to use to preform actions */
export type ActionContext = {
  /** The event store to load events from */
  events: EventStore;
  /** The pubkey of the signer in the event factory */
  self: string;
  /** The event factory used to build and modify events */
  factory: EventFactory;
  /** A method used to publish final events to relays */
  publish: PublishMethod;
};

/** An action that can be run in a context to preform an action */
export type Action<T extends unknown = unknown> = (ctx: ActionContext) => Promise<T>;

export type ActionConstructor<Args extends Array<any>, T extends unknown = unknown> = (...args: Args) => Action<T>;

/** The main class that runs actions */
export class ActionHub {
  constructor(
    public events: EventStore,
    public factory: EventFactory,
    public publish: PublishMethod,
  ) {
    /** The the context observable to get the pubkey */
    // this.context = defer(() => {
    //   if (!this.factory.context.signer) throw new Error("Missing signer");
    //   return from(this.factory.context.signer.getPublicKey());
    // }).pipe(map((self) => ({ self, events: this.events, factory: this.factory, publish: this.publish })));
  }

  // log = new Subject<{ label: string; args: Array<any>; result: any }>();

  protected context: ActionContext | undefined = undefined;
  async getContext() {
    if (this.context) return this.context;
    else {
      if (!this.factory.context.signer) throw new Error("Missing signer");
      const self = await this.factory.context.signer.getPublicKey();
      this.context = { self, events: this.events, factory: this.factory, publish: this.publish };
      return this.context;
    }
  }

  async run<Args extends Array<any>, T extends unknown = unknown>(
    // label: string,
    Action: ActionConstructor<Args, T>,
    ...args: Args
  ): Promise<T> {
    const action = Action(...args);

    const ctx = await this.getContext();
    return await action(ctx);

    // const log = { label, args, result };
    // this.log.next(log);

    // return await result;
  }

  // helper methods
  follow(pubkey: string) {
    return this.run(FollowUser, pubkey);
  }
  unfollow(pubkey: string) {
    return this.run(FollowUser, pubkey);
  }
}
