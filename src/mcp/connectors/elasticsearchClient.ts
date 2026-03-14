import { Client, ClientOptions } from '@elastic/elasticsearch';
import fs from 'fs';
import { ElasticsearchConfig } from '../../config/types.js';

/**
 * Creates an Elasticsearch client.
 * Supports API key auth, basic auth, and custom TLS.
 * Credentials are never logged.
 */
export function createElasticsearchClient(cfg: ElasticsearchConfig | undefined): Client | undefined {
  if (!cfg || !cfg.url) return undefined;

  const clientOptions: ClientOptions = { node: cfg.url };

  // TLS configuration
  if (cfg.caCertPath) {
    clientOptions.tls = {
      ca: fs.readFileSync(cfg.caCertPath),
      rejectUnauthorized: !cfg.tlsInsecure
    };
  } else if (cfg.tlsInsecure) {
    clientOptions.tls = { rejectUnauthorized: false };
  }

  // API key auth takes precedence
  if (cfg.apiKey) {
    clientOptions.auth = { apiKey: cfg.apiKey };
  } else if (cfg.username && cfg.password) {
    clientOptions.auth = { username: cfg.username, password: cfg.password };
  }

  return new Client(clientOptions);
}
