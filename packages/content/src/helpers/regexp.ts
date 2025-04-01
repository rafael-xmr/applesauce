export const Expressions = {
  get link() {
    return /https?:\/\/([a-zA-Z0-9\.\-]+\.[a-zA-Z]+(?::\d+)?)([\/\?#][\p{L}\p{N}\p{M}&\.-\/\?=#\-@%\+_,:!~*]*)?/gu;
  },
  get nostrLink() {
    return /nostr:((npub|note|nprofile|nevent|naddr)1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{58,})/gi;
  },
  get emoji() {
    return /:([a-zA-Z0-9_-]+):/gi;
  },
  get hashtag() {
    return /(?<=^|[^\p{L}#])#([\p{L}\p{N}\p{M}]+)/gu;
  },
  get lightning() {
    return /(?:lightning:)?(LNBC[A-Za-z0-9]+)/gim;
  },
};

export default Expressions;
