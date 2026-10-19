import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { Storage } from "../src/storage.js";

test("marks a token as new only on first insert", () => {
  const dir = mkdtempSync(join(tmpdir(), "gmgn-agent-"));
  const storage = new Storage(join(dir, "agent.sqlite"), join(dir, "samples.jsonl"));

  try {
    const sample = {
      chain: "sol",
      address: "So11111111111111111111111111111111111111112",
      symbol: "AAA",
      name: "Token AAA",
      category: "new_creation",
      launchpadPlatform: "Pump.fun",
      exchange: "pump",
      createdAt: null,
      openedAt: null,
      completedAt: null,
      sampledAt: "2026-06-17T00:00:00.000Z",
      marketCapUsd: 1000,
      liquidityUsd: 100,
      priceUsd: null,
      holderCount: 1,
      volume1hUsd: null,
      volume24hUsd: null,
      swaps1m: null,
      swaps1h: null,
      swaps24h: null,
      smartDegenCount: null,
      renownedCount: null,
      rugRatio: null,
      top10HolderRate: null,
      bundlerRate: null,
      insiderRate: null,
      raw: { address: "So11111111111111111111111111111111111111112" },
    };

    assert.equal(storage.saveSamples([sample])[0].isNewToken, true);
    assert.equal(storage.saveSamples([{ ...sample, sampledAt: "2026-06-17T00:00:01.000Z" }])[0].isNewToken, false);
    assert.deepEqual(storage.getCounts(), { tokens: 1, samples: 2 });
  } finally {
    storage.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
