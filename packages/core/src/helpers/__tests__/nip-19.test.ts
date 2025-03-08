import { describe, expect, it } from "vitest";
import { bytesToHex } from "@noble/hashes/utils";
import { normalizeToPubkey, normalizeToSecretKey } from "../nip-19.js";

describe("normalizeToPubkey", () => {
  it("should get pubkey from npub", () => {
    expect(normalizeToPubkey("npub1ye5ptcxfyyxl5vjvdjar2ua3f0hynkjzpx552mu5snj3qmx5pzjscpknpr")).toEqual(
      "266815e0c9210dfa324c6cba3573b14bee49da4209a9456f9484e5106cd408a5",
    );
  });

  it("should get pubkey from nprofile", () => {
    expect(
      normalizeToPubkey(
        "nprofile1qyw8wumn8ghj7umpw3jkcmrfw3jju6r6wfjrzdpe9e3k7mf0qyf8wumn8ghj7mn0wd68yat99e3k7mf0qqszv6q4uryjzr06xfxxew34wwc5hmjfmfpqn229d72gfegsdn2q3fg5g7lja",
      ),
    ).toEqual("266815e0c9210dfa324c6cba3573b14bee49da4209a9456f9484e5106cd408a5");
  });

  it("should return hex pubkey", () => {
    expect(normalizeToPubkey("266815e0c9210dfa324c6cba3573b14bee49da4209a9456f9484e5106cd408a5")).toEqual(
      "266815e0c9210dfa324c6cba3573b14bee49da4209a9456f9484e5106cd408a5",
    );
  });

  it("should throw on invalid hex pubkey", () => {
    expect(() => {
      normalizeToPubkey("5028372");
    }).toThrow();
  });

  it("should throw on invalid string", () => {
    expect(() => {
      normalizeToPubkey("testing");
    }).toThrow();
  });
});

describe("normalizeToSecretKey", () => {
  it("should get secret key from nsec", () => {
    expect(bytesToHex(normalizeToSecretKey("nsec1xe7znq745x5n68566l32ru72aajz3pk2cys9lnf3tuexvkw0dldsj8v2lm"))).toEqual(
      "367c2983d5a1a93d1e9ad7e2a1f3caef642886cac1205fcd315f326659cf6fdb",
    );
  });

  it("should get secret key from raw hex", () => {
    expect(
      bytesToHex(normalizeToSecretKey("367c2983d5a1a93d1e9ad7e2a1f3caef642886cac1205fcd315f326659cf6fdb")),
    ).toEqual("367c2983d5a1a93d1e9ad7e2a1f3caef642886cac1205fcd315f326659cf6fdb");
  });

  it("should throw on invalid hex key", () => {
    expect(() => {
      normalizeToSecretKey("209573290");
    }).toThrow();
  });

  it("should throw on npub", () => {
    expect(() => {
      normalizeToSecretKey("npub1ye5ptcxfyyxl5vjvdjar2ua3f0hynkjzpx552mu5snj3qmx5pzjscpknpr");
    }).toThrow();
  });
});
