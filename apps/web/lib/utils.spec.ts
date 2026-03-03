import { describe, it, expect } from "vitest";
import { getAvatarInitial } from "./utils";

describe("getAvatarInitial", () => {
  it("returns first char of displayName when available", () => {
    expect(getAvatarInitial("Asia", "cseed123")).toBe("A");
  });

  it("returns uppercase", () => {
    expect(getAvatarInitial("bob", "cseed")).toBe("B");
  });

  it("falls back to avatarSeed for Anonymous", () => {
    expect(getAvatarInitial("Anonymous", "xseed")).toBe("X");
  });

  it("falls back to avatarSeed for ผู้ใช้", () => {
    expect(getAvatarInitial("ผู้ใช้", "mseed")).toBe("M");
  });

  it("falls back to avatarSeed when displayName is undefined", () => {
    expect(getAvatarInitial(undefined, "zseed")).toBe("Z");
  });

  it("returns ? when both are undefined", () => {
    expect(getAvatarInitial(undefined, undefined)).toBe("?");
  });

  it("returns ? when both are empty", () => {
    expect(getAvatarInitial("", "")).toBe("?");
  });

  it("handles Thai display names", () => {
    expect(getAvatarInitial("สมชาย", "cseed")).toBe("ส");
  });
});
