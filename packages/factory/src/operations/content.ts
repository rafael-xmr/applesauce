import { EventFactoryOperation } from "../event-factory.js";

export function setContent(content: string): EventFactoryOperation {
  return async (draft) => {
    return { ...draft, content };
  };
}

export function setEncryptedContent(pubkey: string, content: string, method: "nip04" | "nip44"): EventFactoryOperation {
  return async (draft, { signer }) => {
    if (!signer) throw new Error("Signer required for encrypted content");
    if (!signer[method]) throw new Error(`Signer does not support ${method} encryption`);

    return { ...draft, content: await signer[method].encrypt(pubkey, content) };
  };
}
