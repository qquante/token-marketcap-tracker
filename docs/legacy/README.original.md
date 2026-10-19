> Historical project notes. Paths, operational status, badges and test claims below are retained as archival reference and have not all been revalidated. Use the root README and docs/REVIEW.md for this review snapshot.

# GMGN Market Cap Agent

Agente read-only para descobrir tokens novos via GMGN Trenches e gravar snapshots de market cap em SQLite + JSONL.

Ele nao compra, nao vende, nao usa private key e nao faz broadcast. A fonte de dados e o `gmgn-cli`, conforme a documentacao oficial da GMGN Agent API.

## Setup

```powershell
npm install
Copy-Item .env.example .env
```

Edite `.env` e preencha:

```text
GMGN_API_KEY=...
```

Tambem e possivel usar o arquivo global que o `gmgn-cli` reconhece:

```text
C:\Users\PC\.config\gmgn\.env
```

## Rodar

```powershell
npm start
```

Exemplo com um ciclo apenas:

```powershell
$env:GMGN_AGENT_MAX_CYCLES='1'; npm start
```

Exemplo filtrando Pump.fun:

```powershell
$env:GMGN_AGENT_PLATFORMS='Pump.fun'; npm start
```

## Dados gerados

- `data/gmgn-agent.sqlite`: banco local com tokens e snapshots.
- `data/marketcap_samples.jsonl`: linha JSON por sample, facil de consumir em dashboard/alerta.

Tabelas:

- `tokens`: cadastro/dedupe por `chain + address`.
- `marketcap_samples`: market cap, liquidez, holders, volume e metadados por timestamp.

## Campos principais

Para `market trenches`, o agente usa:

- `address`
- `symbol`
- `name`
- `launchpad_platform`
- `created_timestamp`
- `usd_market_cap`
- `liquidity`
- `holder_count`
- `volume_1h`
- `volume_24h`
- `rug_ratio`
- `smart_degen_count`

## Limites

- A GMGN Agent API documentada e HTTP/CLI, nao WebSocket oficial. Atualizacao por segundo aqui significa polling.
- Se a API devolver rate limit, o agente respeita backoff antes de tentar de novo.
- GMGN informa suporte IPv4; erro `401/403` com chave correta pode ser rede saindo por IPv6.
