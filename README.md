# Token Market Cap Tracker

![Language: JavaScript](https://img.shields.io/badge/Language-JavaScript-F7DF1E?style=flat-square&logo=javascript) ![Store: SQLite](https://img.shields.io/badge/Store-SQLite-555555?style=flat-square) [![License: MIT](https://img.shields.io/badge/License-MIT-555555?style=flat-square)](LICENSE)

Discover launchpad tokens through `gmgn-cli` and retain repeated market-cap observations in SQLite and JSONL.

The store distinguishes a token's identity from its later samples. Token metadata is upserted by chain/address, while observation rows retain sampling time, category, market data and original normalized input.

## Run the local checks

Requires Node.js 24+ for the built-in SQLite API:

```console
npm ci --ignore-scripts
npm test
node src/agent.js --help
```

[normalize.js](src/normalize.js) handles input normalization; [storage.js](src/storage.js) writes token/sample rows in a database transaction. JSONL append happens after that transaction, so the two output formats should not be described as one atomic database transaction.

## Bound an operational collection

With your own GMGN credentials configured locally:

```console
node src/agent.js --chain sol --types new_creation --poll-ms 5000 --limit 20 --max-cycles 3
```

This command contacts the source. Supported chains are `sol`, `bsc` and `base`; default categories include `new_creation`, `near_completion` and `completed`. The [config loader](src/config.js) rejects polling intervals below 1000 ms and limits outside 1–80.

`--db` and `--jsonl` select output paths. Optional platform/preset filters narrow collection. Defaults write under `data/`; provider credentials and collected datasets remain local.

A first discovery and a later market-cap sample are different events. Neither a snapshot nor a category transition is a forecast, a completed trade or proof that an upstream field is accurate.

**Technology:** JavaScript · Node.js 24 · gmgn-cli · SQLite · JSONL · node:test

Project-authored source: [MIT](LICENSE). Third-party components retain their own notices and terms.
