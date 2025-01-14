export function groupByRelay<T extends { relays?: string[] }>(pointers: T[], defaultKey?: string): Map<string, T[]> {
  let byRelay = new Map<string, T[]>();
  for (const pointer of pointers) {
    let relays = pointer.relays?.length ? pointer.relays : defaultKey ? [defaultKey] : [];
    for (const relay of relays) {
      if (!byRelay.has(relay)) byRelay.set(relay, [pointer]);
      else byRelay.get(relay)?.push(pointer);
    }
  }

  return byRelay;
}
