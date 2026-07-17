import { describe, expect, test } from "bun:test";
import { type AltchaChallenge, solveAltcha } from "./altcha";

describe("solveAltcha", () => {
  test("returns the base64 solution for the matching number", async () => {
    const salt = "test-salt-";
    const number = 7;
    const bytes = new TextEncoder().encode(`${salt}${number}`);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    const challenge = Array.from(new Uint8Array(digest), (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");
    const input: AltchaChallenge = {
      algorithm: "SHA-256",
      challenge,
      maxnumber: number,
      salt,
      signature: "signature",
    };

    const encoded = await solveAltcha(input);
    expect(JSON.parse(atob(encoded))).toEqual({
      algorithm: "SHA-256",
      challenge,
      number,
      salt,
      signature: "signature",
    });
  });
});
