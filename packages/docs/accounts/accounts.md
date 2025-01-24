# Accounts

The [account classes](https://hzrd149.github.io/applesauce/typedoc/modules/applesauce_accounts.Accounts.html) are simple wrappers around various [Signers](../signers/signers.md) and expose a `toJSON` and `fromJSON` method to let you save them to localStorage or indexeddb databases

## Built-in account types

- [ExtensionAccount](https://hzrd149.github.io/applesauce/typedoc/classes/applesauce_accounts.Accounts.ExtensionAccount.html) is a wrapper around [ExtensionSigner](https://hzrd149.github.io/applesauce/typedoc/classes/applesauce_signer.ExtensionSigner.html)
- [PasswordAccount](https://hzrd149.github.io/applesauce/typedoc/classes/applesauce_accounts.Accounts.PasswordAccount.html) is a wrapper around [PasswordSigner](https://hzrd149.github.io/applesauce/typedoc/classes/applesauce_signer.PasswordSigner.html)
- [NostrConnectAccount](https://hzrd149.github.io/applesauce/typedoc/classes/applesauce_accounts.Accounts.NostrConnectAccount.html) is a wrapper around [NostrConnectSigner](https://hzrd149.github.io/applesauce/typedoc/classes/applesauce_signer.NostrConnectSigner.html)
- [SimpleAccount](https://hzrd149.github.io/applesauce/typedoc/classes/applesauce_accounts.Accounts.SimpleAccount.html) is a wrapper around [SimpleSigner](https://hzrd149.github.io/applesauce/typedoc/classes/applesauce_signer.SimpleSigner.html)
- [SerialPortAccount](https://hzrd149.github.io/applesauce/typedoc/classes/applesauce_accounts.Accounts.SerialPortAccount.html) is a wrapper around [SerialPortSigner](https://hzrd149.github.io/applesauce/typedoc/classes/applesauce_signer.SerialPortSigner.html)
- [ReadonlyAccount](https://hzrd149.github.io/applesauce/typedoc/classes/applesauce_accounts.Accounts.ReadonlyAccount.html) is a wrapper around [ReadonlySigner](https://hzrd149.github.io/applesauce/typedoc/classes/applesauce_signer.ReadonlySigner.html)
- [AmberClipboardAccount](https://hzrd149.github.io/applesauce/typedoc/classes/applesauce_accounts.Accounts.AmberClipboardAccount.html) is a wrapper around [AmberClipboardSigner](https://hzrd149.github.io/applesauce/typedoc/classes/applesauce_signer.AmberClipboardSigner.html)

## Creating a custom account type

To create your own account type first your going to need to create a new signer class that implements [Nip07Interface](https://hzrd149.github.io/applesauce/typedoc/types/applesauce_signer.Nip07Interface.html)

### Create a new signer class

```ts
class ApiSigner implements Nip07Interface {
  nip04: {
    encrypt: (pubkey: string, plaintext: string) => Promise<string> | string;
    decrypt: (pubkey: string, ciphertext: string) => Promise<string> | string;
  };
  nip44: {
    encrypt: (pubkey: string, plaintext: string) => Promise<string> | string;
    decrypt: (pubkey: string, ciphertext: string) => Promise<string> | string;
  };

  constructor(public api: string) {
    // extra boilerplate to make sure encryption methods are nested under .nip04 and .nip44
    this.nip04 = {
      encrypt: this.nip04Encrypt.bind(this),
      decrypt: this.nip04Decrypt.bind(this),
    };
    this.nip44 = {
      encrypt: this.nip44Encrypt.bind(this),
      decrypt: this.nip44Decrypt.bind(this),
    };
  }

  async getPublicKey(): Promise<string> {
    const res = await fetch(this.api + "/get-public-key");
    const json = await res.json();
    return json.pubkey;
  }

  async signEvent(template: EventTemplate): Promise<NostrEvent> {
    const res = await fetch(this.api + "/sign", { body: template, method: "POST" });
    const json = await res.json();
    return json.event;
  }

  nip04Encrypt(): string {
    throw new Error("Not implemented yet");
  }
  nip04Decrypt(): string {
    throw new Error("Not implemented yet");
  }
  nip44Encrypt(): string {
    throw new Error("Not implemented yet");
  }
  nip44Decrypt(): string {
    throw new Error("Not implemented yet");
  }
}
```

### Create a new account class

Next create a new account class that extends `BaseAccount` to wrap the signer

```ts
import { SerializedAccount, BaseAccount } from "applesauce-accounts";

type ApiAccountSignerData = {
  api: string;
};

// Its good practice to make the class have a generic type for metadata
export default class ApiAccount<Metadata extends unknown> extends BaseAccount<
  ApiSigner,
  ApiAccountSignerData,
  Metadata
> {
  // NOTE: you must set the static type, otherwise it cant be used in the AccountManager
  static type = "api-account";

  // add a toJSON method that saves all relevant information for the account
  toJSON() {
    return {
      // save basic account information
      type: ApiAccount.type,
      id: this.id,
      pubkey: this.pubkey,
      metadata: this.metadata,

      // save important signer data
      signer: {
        api: this.signer.api,
      },
    };
  }

  // add a static fromJSON method so it can be re-created when the app loads again
  static fromJSON<Metadata extends unknown>(
    json: SerializedAccount<ApiAccountSignerData, Metadata>,
  ): ApiAccount<Metadata> {
    // create signer with saved data
    const signer = new ApiSigner(json.signer.api);

    // create new account class
    return new ApiAccount(json.pubkey, signer);
  }
}
```

### Add account type to account manager

Next you need to register the account type

Now you can create a new `ApiSigner` and add it to the account manager

```ts
const signer = new ApiSigner("https://api.example.com");
const pubkey = await signer.getPublicKey();
const account = new ApiAccount(pubkey, signer);

accountManager.addAccount(account);
accountManager.setActive(account);
```
