export const GROUP_MESSAGE_KIND = 9;

/** NIP-29 group pointer */
export type GroupPointer = {
  id: string;
  relay: string;
  name?: string;
};

/**
 * decodes a group identifier into a group pointer object
 * @throws
 */
export function decodeGroupPointer(str: string): GroupPointer {
  const [relay, id] = str.split("'");
  if (!relay) throw new Error("Group pointer missing relay");

  return { relay, id: id || "_" };
}

/** Converts a group pointer into a group identifier */
export function encodeGroupPointer(pointer: GroupPointer) {
  const hostname = URL.canParse(pointer.relay) ? new URL(pointer.relay).hostname : pointer.relay;

  return `${hostname}'${pointer.id}`;
}
