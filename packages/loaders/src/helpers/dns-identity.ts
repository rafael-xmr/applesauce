import { unixNow } from "applesauce-core/helpers";

export type DomainIdentityJson = {
  names?: Record<string, string | undefined>;
  relays?: Record<string, string[]>;
  nip46?: Record<string, string[]>;
};

export enum IdentityStatus {
  /** Got error when fetching identity document */
  Error = "error",
  /** Identity missing from document */
  Missing = "missing",
  /** pubkey mismatch */
  Invalid = "invalid",
  /** pubkey matches */
  Valid = "valid",
}

export type BaseIdentity = {
  name: string;
  domain: string;
  /** The unix timestamp of when the identity was checked */
  checked: number;
};

export type ErrorIdentity = BaseIdentity & {
  status: IdentityStatus.Error;
  error: string;
};

export type MissingIdentity = BaseIdentity & {
  status: IdentityStatus.Missing;
};

export type InvalidIdentity = BaseIdentity & {
  status: IdentityStatus.Invalid;
  pubkey: string;
};

export type ValidIdentity = BaseIdentity & {
  status: IdentityStatus.Valid;
  pubkey: string;
  relays?: string[];
  hasNip46?: boolean;
  nip46Relays?: string[];
};

export type Identity = InvalidIdentity | ValidIdentity | ErrorIdentity | MissingIdentity;

/** Gets an Identity from the .well-known/nostr.json document */
export function getIdentityFromJson(
  name: string,
  domain: string,
  json: DomainIdentityJson,
  checked = unixNow(),
): MissingIdentity | InvalidIdentity | ValidIdentity {
  const common = { name, domain, checked };
  if (!json.names) return { ...common, status: IdentityStatus.Missing };

  const pubkey = json.names[name];
  if (!pubkey) return { ...common, status: IdentityStatus.Missing };

  const relays = json.relays?.[pubkey];
  const hasNip46 = !!json.nip46;
  const nip46Relays = json.nip46?.[pubkey];

  return { ...common, pubkey, relays, nip46Relays, hasNip46, status: IdentityStatus.Valid };
}

/** Returns all Identifies in a json document */
export function getIdentitiesFromJson(
  domain: string,
  json: DomainIdentityJson,
  checked = unixNow(),
): Record<string, Identity> {
  if (!json.names) return {};

  return Object.keys(json.names).reduce(
    (dir, name) => {
      const address = `${name}@${domain}`;
      const identity = getIdentityFromJson(name, domain, json, checked);
      dir[address] = identity;
      return dir;
    },
    {} as Record<string, Identity>,
  );
}

/** convert all keys in names, and relays to lower case */
export function normalizeIdentityJson(json: DomainIdentityJson) {
  if (json.names) {
    for (const [name, pubkey] of Object.entries(json.names)) {
      delete json.names[name];
      json.names[name.toLowerCase()] = pubkey;
    }
  }
  if (json.relays) {
    for (const [name, pubkey] of Object.entries(json.relays)) {
      delete json.relays[name];
      json.relays[name.toLowerCase()] = pubkey;
    }
  }

  return json;
}
