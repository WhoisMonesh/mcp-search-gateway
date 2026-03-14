import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import { AppConfig } from './types.js';

// Load optional YAML/JSON config file
function loadFileConfig(): Partial<AppConfig> {
  const cfgPath = process.env.MCP_CONFIG || '';
  if (!cfgPath) return {};
  const fullPath = path.resolve(cfgPath);
  if (!fs.existsSync(fullPath)) {
    console.warn(`[config] Config file not found: ${fullPath}`);
    return {};
  }
  const raw = fs.readFileSync(fullPath, 'utf8');
  if (fullPath.endsWith('.yaml') || fullPath.endsWith('.yml')) {
    return YAML.parse(raw) as Partial<AppConfig>;
  }
  return JSON.parse(raw) as Partial<AppConfig>;
}

// Environment variables override file config
export function loadConfig(): AppConfig {
  const base = loadFileConfig();

  return {
    serverPort: Number(process.env.MCP_PORT || base.serverPort || 8080),
    serverBind: process.env.MCP_BIND || base.serverBind || '0.0.0.0',
    readOnly: process.env.MCP_READ_ONLY === 'true' || base.readOnly || false,
    opensearch: {
      ...(base.opensearch || {}),
      url: process.env.OPENSEARCH_URL || base.opensearch?.url || '',
      username: process.env.OPENSEARCH_USERNAME || base.opensearch?.username,
      password: process.env.OPENSEARCH_PASSWORD || base.opensearch?.password,
      awsIamRoleArn: process.env.OPENSEARCH_AWS_IAM_ROLE_ARN || base.opensearch?.awsIamRoleArn,
      awsRegion: process.env.AWS_REGION || base.opensearch?.awsRegion,
      tlsInsecure: process.env.OPENSEARCH_TLS_INSECURE === 'true' || base.opensearch?.tlsInsecure,
      caCertPath: process.env.OPENSEARCH_CA_CERT || base.opensearch?.caCertPath
    },
    elasticsearch: {
      ...(base.elasticsearch || {}),
      url: process.env.ELASTICSEARCH_URL || base.elasticsearch?.url || '',
      username: process.env.ELASTICSEARCH_USERNAME || base.elasticsearch?.username,
      password: process.env.ELASTICSEARCH_PASSWORD || base.elasticsearch?.password,
      apiKey: process.env.ELASTICSEARCH_API_KEY || base.elasticsearch?.apiKey,
      tlsInsecure: process.env.ELASTICSEARCH_TLS_INSECURE === 'true' || base.elasticsearch?.tlsInsecure,
      caCertPath: process.env.ELASTICSEARCH_CA_CERT || base.elasticsearch?.caCertPath
    },
    dashboards: {
      ...(base.dashboards || {}),
      url: process.env.DASHBOARDS_URL || base.dashboards?.url
    }
  };
}
