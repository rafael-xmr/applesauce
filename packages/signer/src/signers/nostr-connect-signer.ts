import { EventTemplate, kinds, NostrEvent, verifyEvent } from "nostr-tools";
import { nanoid } from "nanoid";
import { Nip07Interface, SimpleSigner } from "applesauce-signer";
import { IConnectionPool } from "applesauce-net/connection";
import { Deferred, createDefer } from "applesauce-core/promise";
import { isHexKey, unixNow } from "applesauce-core/helpers";
import { MultiSubscription } from "applesauce-net/subscription";
import { logger } from "applesauce-core";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import { getPublicKey } from "nostr-tools";

export function isErrorResponse(response: any): response is NostrConnectErrorResponse {
  return !!response.error;
}

export enum Permission {
  GetPublicKey = "get_pubic_key",
  SignEvent = "sign_event",
  Nip04Encrypt = "nip04_encrypt",
  Nip04Decrypt = "nip04_decrypt",
  Nip44Encrypt = "nip44_encrypt",
  Nip44Decrypt = "nip44_decrypt",
}

export enum NostrConnectMethod {
  Connect = "connect",
  CreateAccount = "create_account",
  GetPublicKey = "get_pubic_key",
  SignEvent = "sign_event",
  Nip04Encrypt = "nip04_encrypt",
  Nip04Decrypt = "nip04_decrypt",
  Nip44Encrypt = "nip44_encrypt",
  Nip44Decrypt = "nip44_decrypt",
}
type RequestParams = {
  [NostrConnectMethod.Connect]: [string] | [string, string] | [string, string, string];
  [NostrConnectMethod.CreateAccount]: [string, string] | [string, string, string] | [string, string, string, string];
  [NostrConnectMethod.GetPublicKey]: [];
  [NostrConnectMethod.SignEvent]: [string];
  [NostrConnectMethod.Nip04Encrypt]: [string, string];
  [NostrConnectMethod.Nip04Decrypt]: [string, string];
  [NostrConnectMethod.Nip44Encrypt]: [string, string];
  [NostrConnectMethod.Nip44Decrypt]: [string, string];
};
type ResponseResults = {
  [NostrConnectMethod.Connect]: "ack";
  [NostrConnectMethod.CreateAccount]: string;
  [NostrConnectMethod.GetPublicKey]: string;
  [NostrConnectMethod.SignEvent]: string;
  [NostrConnectMethod.Nip04Encrypt]: string;
  [NostrConnectMethod.Nip04Decrypt]: string;
  [NostrConnectMethod.Nip44Encrypt]: string;
  [NostrConnectMethod.Nip44Decrypt]: string;
};

export type NostrConnectRequest<N extends NostrConnectMethod> = { id: string; method: N; params: RequestParams[N] };
export type NostrConnectResponse<N extends NostrConnectMethod> = {
  id: string;
  result: ResponseResults[N];
  error?: string;
};
export type NostrConnectErrorResponse = {
  id: string;
  result: string;
  error: string;
};

async function defaultHandleAuth(url: string) {
  window.open(url, "auth", "width=400,height=600,resizable=no,status=no,location=no,toolbar=no,menubar=no");
}

export type NostrConnectSignerOptions = {
  /** The connection pool to use for relay connections */
  pool: IConnectionPool;
  /** The relays to communicate over */
  relays: string[];
  /** A {@link SimpleSigner} for this client */
  signer?: SimpleSigner;
  /** pubkey of the remote signer application */
  remote?: string;
  /** Users pubkey */
  pubkey?: string;
};

export class NostrConnectSigner implements Nip07Interface {
  protected pool: IConnectionPool;
  protected sub: MultiSubscription;
  protected log = logger.extend("NostrConnectSigner");
  /** The local client signer */
  protected signer: SimpleSigner;

  /** Whether the signer is connected to the remote signer */
  isConnected = false;

  /** The users pubkey */
  pubkey?: string;
  /** Relays to communicate over */
  relays: string[];
  /** The remote signer pubkey */
  remote?: string;

  /** Client pubkey */
  get clientPubkey() {
    return getPublicKey(this.signer.key);
  }

  handleAuth: (url: string) => Promise<void> = defaultHandleAuth;

  verifyEvent: typeof verifyEvent = verifyEvent;

  nip04?:
    | {
        encrypt: (pubkey: string, plaintext: string) => Promise<string> | string;
        decrypt: (pubkey: string, ciphertext: string) => Promise<string> | string;
      }
    | undefined;
  nip44?:
    | {
        encrypt: (pubkey: string, plaintext: string) => Promise<string> | string;
        decrypt: (pubkey: string, ciphertext: string) => Promise<string> | string;
      }
    | undefined;

  constructor(opts: NostrConnectSignerOptions) {
    this.pool = opts.pool;
    this.sub = new MultiSubscription(this.pool);
    this.relays = opts.relays;
    this.pubkey = opts.pubkey;

    this.signer = opts?.signer || new SimpleSigner();
    this.sub.onEvent.subscribe((e) => this.handleEvent(e));

    this.nip04 = {
      encrypt: this.nip04Encrypt.bind(this),
      decrypt: this.nip04Decrypt.bind(this),
    };
    this.nip44 = {
      encrypt: this.nip44Encrypt.bind(this),
      decrypt: this.nip44Decrypt.bind(this),
    };
  }

  /** Open the connection */
  async open() {
    const pubkey = await this.signer.getPublicKey();

    // Setup subscription
    this.sub.setRelays(this.relays);
    this.sub.setFilters([
      {
        kinds: [kinds.NostrConnect],
        "#p": [pubkey],
      },
    ]);

    this.sub.open();
    await this.sub.waitForAllConnection();
    this.log("Opened subscription", this.relays);
  }

  /** Close the connection */
  close() {
    this.log("Closed");
    this.sub.close();
    this.isConnected = false;
  }

  protected requests = new Map<string, Deferred<any>>();
  protected auths = new Set<string>();
  protected async handleEvent(event: NostrEvent) {
    if (!this.verifyEvent(event)) return;

    // ignore the event if its not from the remote signer
    if (this.remote && event.pubkey !== this.remote) return;

    try {
      const responseStr = await this.signer.nip04.decrypt(event.pubkey, event.content);
      const response = JSON.parse(responseStr);

      // Handle client connections
      if (!this.pubkey && response.result === "ack") {
        this.log("Got ack response from", event.pubkey);
        this.pubkey = event.pubkey;
        this.remote = event.pubkey;
        this.isConnected = true;
        this.waitingPromise?.resolve(response.result);
        this.waitingPromise = null;
        return;
      }

      if (response.id) {
        const p = this.requests.get(response.id);
        if (!p) return;
        if (response.error) {
          this.log("Got Error", response.id, response.result, response.error);
          if (response.result === "auth_url") {
            if (!this.auths.has(response.id)) {
              this.auths.add(response.id);
              if (this.handleAuth) {
                try {
                  await this.handleAuth(response.error);
                } catch (e) {
                  p.reject(e);
                }
              }
            }
          } else p.reject(response);
        } else if (response.result) {
          this.log("Got Response", response.id, response.result);
          p.resolve(response.result);
        }
      }
    } catch (e) {}
  }

  protected async createRequestEvent(content: string, target = this.remote, kind = kinds.NostrConnect) {
    if (!target) throw new Error("Missing target pubkey");

    return await this.signer.signEvent({
      kind,
      created_at: unixNow(),
      tags: [["p", target]],
      content,
    });
  }

  private async makeRequest<T extends NostrConnectMethod>(
    method: T,
    params: RequestParams[T],
    kind = kinds.NostrConnect,
  ): Promise<ResponseResults[T]> {
    // Talk to the remote signer or the users pubkey
    const remote = this.remote || this.pubkey;
    if (!remote) throw new Error("Missing remote signer pubkey");

    const id = nanoid(8);
    const request: NostrConnectRequest<T> = { id, method, params };
    const encrypted = await this.signer.nip04.encrypt(remote, JSON.stringify(request));
    const event = await this.createRequestEvent(encrypted, remote, kind);
    this.log(`Sending request ${id} (${method}) ${JSON.stringify(params)}`, event);
    this.sub.publish(event);

    const p = createDefer<ResponseResults[T]>();
    this.requests.set(id, p);
    return p;
  }

  /** Connect to remote signer */
  async connect(token?: string | undefined, permissions?: string[]) {
    if (!this.pubkey) throw new Error("Missing user pubkey");

    await this.open();
    try {
      const result = await this.makeRequest(NostrConnectMethod.Connect, [
        this.pubkey,
        token || "",
        permissions?.join(",") ?? "",
      ]);
      this.isConnected = true;
      return result;
    } catch (e) {
      this.isConnected = false;
      this.close();
      throw e;
    }
  }

  private waitingPromise: Deferred<"ack"> | null = null;

  /** Wait for a remote signer to connect */
  waitForSigner(): Promise<"ack"> {
    if (this.pubkey) throw new Error("There is already a pubkey");
    this.open();
    this.waitingPromise = createDefer();
    return this.waitingPromise;
  }

  /** Request to create an account on the remote signer */
  async createAccount(username: string, domain: string, email?: string, permissions?: string[]) {
    if (!this.remote) throw new Error("Remote pubkey must be set");
    await this.open();

    try {
      const newPubkey = await this.makeRequest(NostrConnectMethod.CreateAccount, [
        username,
        domain,
        email ?? "",
        permissions?.join(",") ?? "",
      ]);

      // set the users new pubkey
      this.pubkey = newPubkey;
      this.isConnected = true;
      return newPubkey;
    } catch (e) {
      this.isConnected = false;
      this.close();
      throw e;
    }
  }

  /** Ensure the signer is connected to the remote signer */
  async requireConnection() {
    if (!this.isConnected) await this.connect();
  }

  /** Get the users pubkey */
  async getPublicKey() {
    if (this.pubkey) return this.pubkey;

    await this.requireConnection();
    return this.makeRequest(NostrConnectMethod.GetPublicKey, []);
  }
  /** Request to sign an event */
  async signEvent(template: EventTemplate & { pubkey?: string }) {
    await this.requireConnection();
    const eventString = await this.makeRequest(NostrConnectMethod.SignEvent, [JSON.stringify(template)]);
    const event = JSON.parse(eventString) as NostrEvent;
    if (!this.verifyEvent(event)) throw new Error("Invalid event");
    return event;
  }

  // NIP-04
  async nip04Encrypt(pubkey: string, plaintext: string) {
    await this.requireConnection();
    return this.makeRequest(NostrConnectMethod.Nip04Encrypt, [pubkey, plaintext]);
  }
  async nip04Decrypt(pubkey: string, ciphertext: string) {
    await this.requireConnection();
    const plaintext = await this.makeRequest(NostrConnectMethod.Nip04Decrypt, [pubkey, ciphertext]);

    // NOTE: not sure why this is here, best guess is some signer used to return results as '["plaintext"]'
    if (plaintext.startsWith('["') && plaintext.endsWith('"]')) return JSON.parse(plaintext)[0] as string;

    return plaintext;
  }

  // NIP-44
  async nip44Encrypt(pubkey: string, plaintext: string) {
    await this.requireConnection();
    return this.makeRequest(NostrConnectMethod.Nip44Encrypt, [pubkey, plaintext]);
  }
  async nip44Decrypt(pubkey: string, ciphertext: string) {
    await this.requireConnection();
    const plaintext = await this.makeRequest(NostrConnectMethod.Nip44Decrypt, [pubkey, ciphertext]);

    // NOTE: not sure why this is here, best guess is some signer used to return results as '["plaintext"]'
    if (plaintext.startsWith('["') && plaintext.endsWith('"]')) return JSON.parse(plaintext)[0] as string;

    return plaintext;
  }

  static buildSigningPermissions(kinds: number[]) {
    return [Permission.GetPublicKey, ...kinds.map((k) => `${Permission.SignEvent}:${k}`)];
  }

  static async fromBunkerURI(uri: string, pool: IConnectionPool, permissions?: string[]) {
    const url = new URL(uri);

    // firefox puts pubkey part in host, chrome puts pubkey in pathname
    const pubkey = url.host || url.pathname.replace("//", "");
    if (!isHexKey(pubkey)) throw new Error("Invalid connection URI");

    const relays = url.searchParams.getAll("relay");
    if (relays.length === 0) throw new Error("Missing relays");

    const client = new NostrConnectSigner({ pool, relays, pubkey });

    const token = url.searchParams.get("secret");
    await client.connect(token ?? undefined, permissions);

    return client;
  }

  toJSON() {
    return {
      relays: this.relays,
      client: bytesToHex(this.signer.key),
      pubkey: this.pubkey,
      remote: this.remote,
    };
  }
  static fromJSON(pool: IConnectionPool, data: ReturnType<NostrConnectSigner["toJSON"]>) {
    const client = new SimpleSigner(hexToBytes(data.client));
    return new NostrConnectSigner({
      pool,
      signer: client,
      pubkey: data.pubkey,
      remote: data.remote,
      relays: data.relays,
    });
  }
}
