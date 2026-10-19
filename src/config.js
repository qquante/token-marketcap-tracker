import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const DEFAULT_TYPES = ["new_creation", "near_completion", "completed"];

export function loadConfig(argv = process.argv.slice(2), env = process.env) {
  loadDotEnvFile(".env", env);

  const args = parseArgs(argv);

  if (args.help) {
    return { help: true };
  }

  const chain = String(args.chain ?? env.GMGN_AGENT_CHAIN ?? "sol").trim();
  const pollMs = readInteger(args.pollMs ?? env.GMGN_AGENT_POLL_MS, 1000);
  const limit = readInteger(args.limit ?? env.GMGN_AGENT_LIMIT, 80);
  const maxCycles = readInteger(args.maxCycles ?? env.GMGN_AGENT_MAX_CYCLES, 0);
  const types = readCsv(args.types ?? env.GMGN_AGENT_TYPES, DEFAULT_TYPES);
  const platforms = readCsv(args.platforms ?? env.GMGN_AGENT_PLATFORMS, []);
  const filterPreset = emptyToUndefined(args.filterPreset ?? env.GMGN_AGENT_FILTER_PRESET);
  const dbPath = resolve(String(args.db ?? env.GMGN_AGENT_DB ?? "data/gmgn-agent.sqlite"));
  const jsonlPath = resolve(String(args.jsonl ?? env.GMGN_AGENT_JSONL ?? "data/marketcap_samples.jsonl"));

  validateConfig({ chain, pollMs, limit, maxCycles, types, filterPreset });

  return {
    help: false,
    chain,
    pollMs,
    limit,
    maxCycles,
    types,
    platforms,
    filterPreset,
    dbPath,
    jsonlPath,
  };
}

export function printHelp() {
  console.log(`GMGN Market Cap Agent

Usage:
  npm start -- [options]
  node src/agent.js [options]

Options:
  --chain <chain>              Chain: sol, bsc, base. Default: sol
  --poll-ms <ms>               Poll interval. Default: 1000
  --limit <n>                  GMGN trenches limit per category. Default: 80
  --types <csv>                new_creation,near_completion,completed
  --platforms <csv>            Optional launchpad filter, e.g. Pump.fun,letsbonk
  --filter-preset <preset>     Optional: safe, smart-money, strict
  --db <path>                  SQLite path. Default: data/gmgn-agent.sqlite
  --jsonl <path>               JSONL path. Default: data/marketcap_samples.jsonl
  --max-cycles <n>             0 = run forever. Default: 0
  --help                       Show this help

Required:
  GMGN_API_KEY in .env or in the gmgn-cli global config.
`);
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      out.help = true;
      continue;
    }
    if (!arg.startsWith("--")) {
      throw new Error(`Unexpected argument: ${arg}`);
    }
    const key = arg.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const next = argv[i + 1];
    if (next == null || next.startsWith("--")) {
      throw new Error(`Missing value for ${arg}`);
    }
    out[key] = next;
    i += 1;
  }
  return out;
}

function readCsv(value, fallback) {
  if (value == null || String(value).trim() === "") {
    return [...fallback];
  }
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function readInteger(value, fallback) {
  if (value == null || String(value).trim() === "") {
    return fallback;
  }
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Expected integer, got: ${value}`);
  }
  return parsed;
}

function emptyToUndefined(value) {
  if (value == null || String(value).trim() === "") {
    return undefined;
  }
  return String(value).trim();
}

function validateConfig(config) {
  const supportedChains = new Set(["sol", "bsc", "base"]);
  if (!supportedChains.has(config.chain)) {
    throw new Error(`Unsupported chain for trenches: ${config.chain}`);
  }
  if (config.pollMs < 1000) {
    throw new Error("GMGN_AGENT_POLL_MS must be >= 1000 to avoid abusive polling.");
  }
  if (config.limit < 1 || config.limit > 80) {
    throw new Error("GMGN_AGENT_LIMIT must be between 1 and 80.");
  }
  if (config.maxCycles < 0) {
    throw new Error("GMGN_AGENT_MAX_CYCLES must be >= 0.");
  }
  const allowedTypes = new Set(DEFAULT_TYPES);
  for (const type of config.types) {
    if (!allowedTypes.has(type)) {
      throw new Error(`Unsupported trenches type: ${type}`);
    }
  }
  if (config.filterPreset != null && !["safe", "smart-money", "strict"].includes(config.filterPreset)) {
    throw new Error(`Unsupported filter preset: ${config.filterPreset}`);
  }
}

function loadDotEnvFile(path, env) {
  if (!existsSync(path)) {
    return;
  }
  const text = readFileSync(path, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }
    const eq = line.indexOf("=");
    if (eq <= 0) {
      continue;
    }
    const key = line.slice(0, eq).trim();
    const value = stripQuotes(line.slice(eq + 1).trim());
    if (env[key] == null) {
      env[key] = value;
    }
  }
}

function stripQuotes(value) {
  if (
    (value.startsWith("\"") && value.endsWith("\"")) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}
