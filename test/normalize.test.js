import test from "node:test";
import assert from "node:assert/strict";

import { normalizeTrenchesResponse } from "../src/normalize.js";

test("normalizes trenches categories and market cap fields", () => {
  const samples = normalizeTrenchesResponse({
    new_creation: [
      {
        address: "So11111111111111111111111111111111111111112",
        symbol: "AAA",
        name: "Token AAA",
        usd_market_cap: "12345.67",
        liquidity: "1000",
        created_timestamp: 1760000000,
        smart_degen_count: 2,
      },
    ],
    pump: [
      {
        address: "So22222222222222222222222222222222222222222",
        symbol: "BBB",
        market_cap: 555,
      },
    ],
  }, "sol", new Date("2026-06-17T00:00:00.000Z"));

  assert.equal(samples.length, 2);
  assert.equal(samples[0].category, "new_creation");
  assert.equal(samples[0].marketCapUsd, 12345.67);
  assert.equal(samples[0].liquidityUsd, 1000);
  assert.equal(samples[0].createdAt, "2025-10-09T08:53:20.000Z");
  assert.equal(samples[1].category, "near_completion");
  assert.equal(samples[1].marketCapUsd, 555);
});
