import { Client } from '@opensearch-project/opensearch';
import fs from 'fs';
import { OpenSearchConfig } from '../../config/types.js';

/**
 * Creates an OpenSearch client.
 * For AWS IAM auth, set awsIamRoleArn + awsRegion and use SigV4 signing.
 * Credentials are never logged.
 */
export function createOpenSearchClient(cfg: OpenSearchConfig | undefined): Client | undefined {
  if (!cfg || !cfg.url) return undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clientOptions: any = { node: cfg.url };

  // TLS configuration
  if (cfg.caCertPath) {
    clientOptions.ssl = {
      ca: fs.readFileSync(cfg.caCertPath),
      rejectUnauthorized: !cfg.tlsInsecure
    };
  } else if (cfg.tlsInsecure) {
    clientOptions.ssl = { rejectUnauthorized: false };
  }

  // Basic auth (username/password)
  if (cfg.username && cfg.password) {
    clientOptions.auth = { username: cfg.username, password: cfg.password };
  }

  // AWS SigV4 note: Install @opensearch-project/opensearch with aws-sigv4
  // and wrap with AwsSigv4Signer from '@opensearch-project/opensearch/aws'.
  // This is documented in config/opensearch.aws.yaml.
  return new Client(clientOptions);
}
