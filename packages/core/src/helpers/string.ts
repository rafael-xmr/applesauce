export function isHex(str?: string) {
  if (str?.match(/^[0-9a-f]+$/i)) return true;
  return false;
}
export function isHexKey(key?: string) {
  if (key?.toLowerCase()?.match(/^[0-9a-f]{64}$/)) return true;
  return false;
}

// read more https://www.regular-expressions.info/unicode.html#category
export function stripInvisibleChar(str: string): string;
export function stripInvisibleChar(str?: string | undefined): string | undefined;
export function stripInvisibleChar(str?: string) {
  return str && str.replaceAll(/[\p{Cf}\p{Zs}]/gu, "");
}
