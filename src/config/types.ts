// Configuration type definitions for MCP Search Gateway
// All sensitive values are loaded from env vars - never hard-coded

export interface OpenSearchConfig {
  url: string;
  username?: string;
  password?: string;
  awsIamRoleArn?: string;
  awsRegion?: string;
  tlsInsecure?: boolean;
  caCertPath?: string;
}

export interface ElasticsearchConfig {
  url: string;
  username?: string;
  password?: string;
  apiKey?: string;
  tlsInsecure?: boolean;
  caCertPath?: string;
}

export interface DashboardsConfig {
  url?: string;
}

export interface AppConfig {
  opensearch?: OpenSearchConfig;
  elasticsearch?: ElasticsearchConfig;
  dashboards?: DashboardsConfig;
  serverPort: number;
  serverBind: string;
  readOnly?: boolean;
}
