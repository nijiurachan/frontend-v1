export interface AltchaChallenge {
  algorithm: "SHA-1" | "SHA-256" | "SHA-512";
  challenge: string;
  maxnumber: number;
  salt: string;
  signature: string;
}

/** backend-v1 の altcha-lib/v1 と同じ SHA(salt + number) PoW を解く */
export async function solveAltcha(challenge: AltchaChallenge): Promise<string> {
  for (let number = 0; number <= challenge.maxnumber; number += 1) {
    const digest = await hashHex(
      challenge.algorithm,
      `${challenge.salt}${number}`,
    );
    if (digest === challenge.challenge) {
      return btoa(
        JSON.stringify({
          algorithm: challenge.algorithm,
          challenge: challenge.challenge,
          number,
          salt: challenge.salt,
          signature: challenge.signature,
        }),
      );
    }
    if (number % 128 === 0) await Promise.resolve();
  }
  throw new Error("Altchaチャレンジを解けませんでした");
}

async function hashHex(
  algorithm: AltchaChallenge["algorithm"],
  value: string,
): Promise<string> {
  const digest = await crypto.subtle.digest(
    algorithm,
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}
