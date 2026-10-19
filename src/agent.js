import { setTimeout as sleep } from "node:timers/promises";

import { loadConfig, printHelp } from "./config.js";
import { runGmgnCli } from "./gmgn-cli.js";
import { formatUsd, normalizeTrenchesResponse, shortAddress } from "./normalize.js";
import { Storage } from "./storage.js";

async function main() {
  const config = loadConfig();
  if (config.help) {
    printHelp();
    return;
  }

  const storage = new Storage(config.dbPath, config.jsonlPath);
  let cycle = 0;
  let backoffUntil = 0;

  printStartup(config);

  process.on("SIGINT", () => {
    console.log("\nStopping agent...");
    storage.close();
    process.exit(0);
  });

  while (config.maxCycles === 0 || cycle < config.maxCycles) {
    cycle += 1;
    const now = Date.now();
    if (backoffUntil > now) {
      await sleep(backoffUntil - now);
    }

    const sampledAt = new Date();
    try {
      const raw = await fetchTrenches(config);
      const samples = normalizeTrenchesResponse(raw, config.chain, sampledAt);
      const saved = storage.saveSamples(samples);
      printCycle(cycle, sampledAt, saved, storage.getCounts());
      backoffUntil = 0;
    } catch (error) {
      const retryAt = parseRetryAt(error);
      if (retryAt != null) {
        backoffUntil = retryAt;
        console.error(`[${new Date().toISOString()}] rate limited; retrying after ${new Date(retryAt).toISOString()}`);
      } else {
        console.error(`[${new Date().toISOString()}] cycle failed: ${error.message}`);
      }
    }

    if (config.maxCycles === 0 || cycle < config.maxCycles) {
      await sleep(config.pollMs);
    }
  }

  storage.close();
}

async function fetchTrenches(config) {
  const args = [
    "market",
    "trenches",
    "--chain",
    config.chain,
    "--limit",
    String(config.limit),
    "--raw",
  ];

  for (const type of config.types) {
    args.push("--type", type);
  }
  for (const platform of config.platforms) {
    args.push("--launchpad-platform", platform);
  }
  if (config.filterPreset) {
    args.push("--filter-preset", config.filterPreset);
  }

  return runGmgnCli(args);
}

function printStartup(config) {
  console.log("GMGN Market Cap Agent");
  console.log(`chain=${config.chain} poll_ms=${config.pollMs} limit=${config.limit} types=${config.types.join(",")}`);
  console.log(`platforms=${config.platforms.length ? config.platforms.join(",") : "all"}`);
  console.log(`db=${config.dbPath}`);
  console.log(`jsonl=${config.jsonlPath}`);
}

function printCycle(cycle, sampledAt, samples, counts) {
  const newTokens = samples.filter((sample) => sample.isNewToken);
  const byCategory = countBy(samples, "category");
  const summary = Object.entries(byCategory).map(([key, value]) => `${key}:${value}`).join(" ");
  console.log(`[${sampledAt.toISOString()}] cycle=${cycle} samples=${samples.length} new=${newTokens.length} total_tokens=${counts.tokens} total_samples=${counts.samples} ${summary}`);

  for (const sample of newTokens.slice(0, 12)) {
    const label = [sample.symbol, shortAddress(sample.address)].filter(Boolean).join(" ");
    console.log(`  NEW ${label} category=${sample.category} mcap=${formatUsd(sample.marketCapUsd)} liq=${formatUsd(sample.liquidityUsd)} platform=${sample.launchpadPlatform ?? "n/a"}`);
  }
  if (newTokens.length > 12) {
    console.log(`  ... ${newTokens.length - 12} more new tokens`);
  }
}

function countBy(items, key) {
  const counts = {};
  for (const item of items) {
    const value = item[key] ?? "unknown";
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return counts;
}

function parseRetryAt(error) {
  const text = `${error.message ?? ""}\n${error.stderr ?? ""}`;
  const unixMatch = text.match(/reset(?:s)? at .*?\((?:~)?(\d+)s remaining\)/i);
  if (unixMatch) {
    return Date.now() + Number.parseInt(unixMatch[1], 10) * 1000 + 1000;
  }
  const isoLike = text.match(/(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} GMT[+-]\d{2}:\d{2})/);
  if (isoLike) {
    const parsed = Date.parse(isoLike[1]);
    if (Number.isFinite(parsed)) {
      return parsed + 1000;
    }
  }
  return null;
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
