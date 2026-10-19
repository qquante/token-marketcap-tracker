const CATEGORY_ALIASES = {
  new_creation: "new_creation",
  pump: "near_completion",
  near_completion: "near_completion",
  completed: "completed",
};

export function normalizeTrenchesResponse(raw, chain, sampledAt = new Date()) {
  const root = raw?.data && typeof raw.data === "object" ? raw.data : raw;
  const samples = [];

  for (const [rawCategory, category] of Object.entries(CATEGORY_ALIASES)) {
    const items = root?.[rawCategory];
    if (!Array.isArray(items)) {
      continue;
    }
    for (const item of items) {
      const sample = normalizeTrenchesItem(item, chain, category, sampledAt);
      if (sample) {
        samples.push(sample);
      }
    }
  }

  return samples;
}

export function normalizeTrenchesItem(item, chain, category, sampledAt = new Date()) {
  const address = cleanString(item?.address);
  if (!address) {
    return null;
  }

  const createdAt = readUnixSeconds(item.created_timestamp ?? item.creation_timestamp);
  const openedAt = readUnixSeconds(item.open_timestamp);
  const completedAt = readUnixSeconds(item.complete_timestamp);

  return {
    chain,
    address,
    symbol: cleanString(item.symbol),
    name: cleanString(item.name),
    category,
    launchpadPlatform: cleanString(item.launchpad_platform),
    exchange: cleanString(item.exchange),
    createdAt,
    openedAt,
    completedAt,
    sampledAt: sampledAt.toISOString(),
    marketCapUsd: readNumber(item.usd_market_cap ?? item.market_cap),
    liquidityUsd: readNumber(item.liquidity),
    priceUsd: readNumber(item.price),
    holderCount: readInteger(item.holder_count),
    volume1hUsd: readNumber(item.volume_1h),
    volume24hUsd: readNumber(item.volume_24h),
    swaps1m: readInteger(item.swaps_1m),
    swaps1h: readInteger(item.swaps_1h),
    swaps24h: readInteger(item.swaps_24h),
    smartDegenCount: readInteger(item.smart_degen_count),
    renownedCount: readInteger(item.renowned_count),
    rugRatio: readNumber(item.rug_ratio),
    top10HolderRate: readNumber(item.top_10_holder_rate),
    bundlerRate: readNumber(item.bundler_trader_amount_rate ?? item.bundler_rate),
    insiderRate: readNumber(item.rat_trader_amount_rate ?? item.insider_ratio),
    raw: item,
  };
}

export function shortAddress(address) {
  if (!address || address.length <= 12) {
    return address ?? "";
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatUsd(value) {
  if (value == null || !Number.isFinite(value)) {
    return "n/a";
  }
  if (Math.abs(value) >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }
  return `$${value.toFixed(2)}`;
}

function cleanString(value) {
  if (value == null) {
    return null;
  }
  const text = String(value).trim();
  return text === "" ? null : text;
}

function readNumber(value) {
  if (value == null || value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function readInteger(value) {
  const parsed = readNumber(value);
  return parsed == null ? null : Math.trunc(parsed);
}

function readUnixSeconds(value) {
  const parsed = readInteger(value);
  if (parsed == null || parsed <= 0) {
    return null;
  }
  return new Date(parsed * 1000).toISOString();
}
