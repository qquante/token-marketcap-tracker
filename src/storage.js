import { mkdirSync, appendFileSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

export class Storage {
  constructor(dbPath, jsonlPath) {
    this.dbPath = dbPath;
    this.jsonlPath = jsonlPath;
    mkdirSync(dirname(dbPath), { recursive: true });
    mkdirSync(dirname(jsonlPath), { recursive: true });
    this.db = new DatabaseSync(dbPath);
    this.db.exec("PRAGMA journal_mode = WAL;");
    this.db.exec("PRAGMA synchronous = NORMAL;");
    this.#migrate();
    this.statements = this.#prepareStatements();
  }

  close() {
    this.db.close();
  }

  saveSamples(samples) {
    const inserted = [];
    const tx = this.db.prepare("BEGIN");
    const commit = this.db.prepare("COMMIT");
    const rollback = this.db.prepare("ROLLBACK");

    tx.run();
    try {
      for (const sample of samples) {
        const existed = this.statements.selectToken.get({
          chain: sample.chain,
          address: sample.address,
        }) != null;

        this.statements.upsertToken.run({
          chain: sample.chain,
          address: sample.address,
          symbol: sample.symbol,
          name: sample.name,
          launchpad_platform: sample.launchpadPlatform,
          exchange: sample.exchange,
          created_at: sample.createdAt,
          opened_at: sample.openedAt,
          completed_at: sample.completedAt,
          first_seen_at: sample.sampledAt,
          last_seen_at: sample.sampledAt,
          last_category: sample.category,
        });

        this.statements.insertSample.run({
          chain: sample.chain,
          address: sample.address,
          sampled_at: sample.sampledAt,
          category: sample.category,
          market_cap_usd: sample.marketCapUsd,
          liquidity_usd: sample.liquidityUsd,
          price_usd: sample.priceUsd,
          holder_count: sample.holderCount,
          volume_1h_usd: sample.volume1hUsd,
          volume_24h_usd: sample.volume24hUsd,
          swaps_1m: sample.swaps1m,
          swaps_1h: sample.swaps1h,
          swaps_24h: sample.swaps24h,
          smart_degen_count: sample.smartDegenCount,
          renowned_count: sample.renownedCount,
          rug_ratio: sample.rugRatio,
          top10_holder_rate: sample.top10HolderRate,
          bundler_rate: sample.bundlerRate,
          insider_rate: sample.insiderRate,
          raw_json: JSON.stringify(sample.raw),
        });

        inserted.push({
          ...sample,
          isNewToken: !existed,
        });
      }
      commit.run();
    } catch (error) {
      rollback.run();
      throw error;
    }

    for (const sample of inserted) {
      appendFileSync(this.jsonlPath, `${JSON.stringify(sample)}\n`, "utf8");
    }

    return inserted;
  }

  getCounts() {
    return {
      tokens: this.db.prepare("SELECT COUNT(*) AS count FROM tokens").get().count,
      samples: this.db.prepare("SELECT COUNT(*) AS count FROM marketcap_samples").get().count,
    };
  }

  #migrate() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tokens (
        chain TEXT NOT NULL,
        address TEXT NOT NULL,
        symbol TEXT,
        name TEXT,
        launchpad_platform TEXT,
        exchange TEXT,
        created_at TEXT,
        opened_at TEXT,
        completed_at TEXT,
        first_seen_at TEXT NOT NULL,
        last_seen_at TEXT NOT NULL,
        last_category TEXT,
        PRIMARY KEY (chain, address)
      );

      CREATE TABLE IF NOT EXISTS marketcap_samples (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chain TEXT NOT NULL,
        address TEXT NOT NULL,
        sampled_at TEXT NOT NULL,
        category TEXT,
        market_cap_usd REAL,
        liquidity_usd REAL,
        price_usd REAL,
        holder_count INTEGER,
        volume_1h_usd REAL,
        volume_24h_usd REAL,
        swaps_1m INTEGER,
        swaps_1h INTEGER,
        swaps_24h INTEGER,
        smart_degen_count INTEGER,
        renowned_count INTEGER,
        rug_ratio REAL,
        top10_holder_rate REAL,
        bundler_rate REAL,
        insider_rate REAL,
        raw_json TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_samples_address_time
        ON marketcap_samples(chain, address, sampled_at);

      CREATE INDEX IF NOT EXISTS idx_samples_time
        ON marketcap_samples(sampled_at);
    `);
  }

  #prepareStatements() {
    return {
      selectToken: this.db.prepare(`
        SELECT 1 FROM tokens WHERE chain = $chain AND address = $address LIMIT 1
      `),
      upsertToken: this.db.prepare(`
        INSERT INTO tokens (
          chain, address, symbol, name, launchpad_platform, exchange,
          created_at, opened_at, completed_at, first_seen_at, last_seen_at, last_category
        ) VALUES (
          $chain, $address, $symbol, $name, $launchpad_platform, $exchange,
          $created_at, $opened_at, $completed_at, $first_seen_at, $last_seen_at, $last_category
        )
        ON CONFLICT(chain, address) DO UPDATE SET
          symbol = COALESCE(excluded.symbol, tokens.symbol),
          name = COALESCE(excluded.name, tokens.name),
          launchpad_platform = COALESCE(excluded.launchpad_platform, tokens.launchpad_platform),
          exchange = COALESCE(excluded.exchange, tokens.exchange),
          opened_at = COALESCE(excluded.opened_at, tokens.opened_at),
          completed_at = COALESCE(excluded.completed_at, tokens.completed_at),
          last_seen_at = excluded.last_seen_at,
          last_category = excluded.last_category
      `),
      insertSample: this.db.prepare(`
        INSERT INTO marketcap_samples (
          chain, address, sampled_at, category, market_cap_usd, liquidity_usd, price_usd,
          holder_count, volume_1h_usd, volume_24h_usd, swaps_1m, swaps_1h, swaps_24h,
          smart_degen_count, renowned_count, rug_ratio, top10_holder_rate,
          bundler_rate, insider_rate, raw_json
        ) VALUES (
          $chain, $address, $sampled_at, $category, $market_cap_usd, $liquidity_usd, $price_usd,
          $holder_count, $volume_1h_usd, $volume_24h_usd, $swaps_1m, $swaps_1h, $swaps_24h,
          $smart_degen_count, $renowned_count, $rug_ratio, $top10_holder_rate,
          $bundler_rate, $insider_rate, $raw_json
        )
      `),
    };
  }
}
