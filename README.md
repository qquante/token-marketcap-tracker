# Token Market Cap Tracker

A read-only token discovery agent that normalizes market-cap observations and persists deduplicated snapshots.

![review](https://img.shields.io/badge/review-private-374151) ![primary](https://img.shields.io/badge/primary-JavaScript-2563EB) [![LinkedIn](https://img.shields.io/badge/LinkedIn-Douglas%20Silva-0A66C2?logo=linkedin&logoColor=white)](https://www.linkedin.com/in/douglas-silva-data-analyst/)

[Overview](#overview) · [Architecture](#architecture) · [Setup](#setup) · [Validation](#validation) · [Roadmap](#roadmap) · [Review notes](docs/REVIEW.md)

## Overview

- Source adapters isolate the external CLI.
- Normalization retains market cap, liquidity and timestamp fields.
- Identity-based persistence distinguishes first discovery from later samples.

**Technology:** JavaScript · Node.js 24 · gmgn-cli · SQLite · JSONL · node:test

**Persistence and data:** SQLite stores token identities and snapshots; JSONL exports support downstream consumers.

## Architecture

```text
Configured market source → CLI adapter → normalized token sample → SQLite identity/snapshots → JSONL export
```

| Location | Review focus |
| --- | --- |
| [`src/agent.js`](src/agent.js) | Source/configuration inspected for scope and structure |
| [`src/gmgn-cli.js`](src/gmgn-cli.js) | Source/configuration inspected for scope and structure |
| [`src/normalize.js`](src/normalize.js) | Source/configuration inspected for scope and structure |
| [`src/storage.js`](src/storage.js) | Source/configuration inspected for scope and structure |
| [`test/storage.test.js`](test/storage.test.js) | Source/configuration inspected for scope and structure |

Internal package and module names are retained where changing them would affect imports or compatibility. This descriptive repository name does not imply a completed package/API migration.

## Setup

Node.js >=24. Inspect package.json and src/config.js. The normalization/storage unit tests can run without a live source credential.

Start from an isolated environment. Use `.env.example` when present and inspect the configuration loader: an example file is not necessarily loaded automatically. Runtime databases, real account sessions and private credentials are not bundled. Live integration prerequisites are separate from local tests.

## Validation

Static parsing checked 0 Python files and 2 strict JSON files. Python syntax errors: 0; JSON errors: 0. The selected offline suite passed.

```console
node --test test/normalize.test.js test/storage.test.js
```

These results apply to the selected checks on the preparation copy. They do not establish deployment readiness, full coverage, live provider availability or measured performance. CI definitions, when present under `docs/ci-templates/`, are inactive review templates; no remote CI badge is claimed.

## Limits and current status

Offline tests do not validate current source access, API quotas or real sampling reliability. No token purchase, signing or broadcast is part of the documented agent flow.

This private snapshot is for code and portfolio review. Generated runtime material and unreviewed binary assets may be excluded. [Review notes](docs/REVIEW.md) record preparation scope, findings and outstanding validation.

## Roadmap

- [ ] Add provider-response fixtures and CLI failure tests.
- [ ] Document retention and market-cap field provenance.
- [ ] Validate a bounded read-only sampling session separately.

## History and attribution

No recoverable original Git history was verified for this snapshot. Import and preparation commits use their actual current dates; filesystem timestamps are not treated as development dates.

No open-source license is granted by this preparation. A license and attribution review is required before public redistribution.

## Maintainer and feedback

Douglas de Oliveira Silva · [GitHub](https://github.com/qquante) · [LinkedIn](https://www.linkedin.com/in/douglas-silva-data-analyst/)

For this private review, report reproducible issues with a minimal fixture and the exact check output. Keep account data, credentials and generated sensitive reports out of issues and commits. Existing contribution guidelines apply where present.

**Topics:** `javascript`, `nodejs`, `sqlite`, `market-data`, `data-collection`, `blockchain-analytics`
