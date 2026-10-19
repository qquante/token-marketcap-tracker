# Token Market Cap Tracker

A read-only token discovery agent that normalizes market-cap observations and persists deduplicated snapshots.

## Features

- Source adapters isolate the external CLI.
- Normalization retains market cap, liquidity and timestamp fields.
- Identity-based persistence distinguishes first discovery from later samples.

## Stack

JavaScript · Node.js 24 · gmgn-cli · SQLite · JSONL · node:test

SQLite stores token identities and snapshots; JSONL exports support downstream consumers.

## Getting started

Node.js >=24. Inspect package.json and src/config.js. The normalization/storage unit tests can run without a live source credential.

## How it works

```text
Configured market source → CLI adapter → normalized token sample → SQLite identity/snapshots → JSONL export
```

## Current limitations

Offline tests do not validate current source access, API quotas or real sampling reliability. No token purchase, signing or broadcast is part of the documented agent flow.

## Tests

```console
node --test test/normalize.test.js test/storage.test.js
```

These checks use offline fixtures or controlled backends.

## License

No open-source license has been granted. Redistribution terms remain to be defined.
