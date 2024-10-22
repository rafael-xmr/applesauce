export const convertToUrl = (url: string | URL) => (url instanceof URL ? url : new URL(url));
export const getURLFilename = (url: URL) =>
  url.pathname.split("/").pop()?.toLocaleLowerCase() || url.searchParams.get("filename")?.toLocaleLowerCase();

export const IMAGE_EXT = [".svg", ".gif", ".png", ".jpg", ".jpeg", ".webp", ".avif"];
export const VIDEO_EXT = [".mp4", ".mkv", ".webm", ".mov"];
export const STREAM_EXT = [".m3u8"];
export const AUDIO_EXT = [".mp3", ".wav", ".ogg", ".aac"];

export function isVisualMediaURL(url: string | URL) {
  return isImageURL(url) || isVideoURL(url) || isStreamURL(url);
}
export function isImageURL(url: string | URL) {
  url = convertToUrl(url);
  const filename = getURLFilename(url);
  return !!filename && IMAGE_EXT.some((ext) => filename.endsWith(ext));
}
export function isVideoURL(url: string | URL) {
  url = convertToUrl(url);
  const filename = getURLFilename(url);
  return !!filename && VIDEO_EXT.some((ext) => filename.endsWith(ext));
}
export function isStreamURL(url: string | URL) {
  url = convertToUrl(url);
  const filename = getURLFilename(url);
  return !!filename && STREAM_EXT.some((ext) => filename.endsWith(ext));
}
export function isAudioURL(url: string | URL) {
  url = convertToUrl(url);
  const filename = getURLFilename(url);
  return !!filename && AUDIO_EXT.some((ext) => filename.endsWith(ext));
}
