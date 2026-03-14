import Ajv from 'ajv';
import { createOpenSearchClient } from '../connectors/opensearchClient.js';
import { createElasticsearchClient } from '../connectors/elasticsearchClient.js';
import { opensearchTools } from './opensearch.js';
import { elasticsearchTools } from './elasticsearch.js';
import { dashboardsTools } from './dashboards.js';
import { AppConfig } from '../../config/types.js';

const ajv = new Ajv();

export interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  handler: (input: unknown) => Promise<unknown>;
  validateInput?: (input: unknown) => boolean;
}

/**
 * Build the full tool registry from app config.
 * Respects readOnly flag - omits write tools in read-only mode.
 */
export function buildToolRegistry(cfg: AppConfig): McpTool[] {
  const osClient = createOpenSearchClient(cfg.opensearch);
  const esClient = createElasticsearchClient(cfg.elasticsearch);
  const ro = cfg.readOnly ?? false;

  const tools: McpTool[] = [
    ...opensearchTools(osClient, ro),
    ...elasticsearchTools(esClient, ro),
    ...dashboardsTools(cfg.dashboards)
  ];

  // Compile input validators for runtime validation
  for (const tool of tools) {
    tool.validateInput = ajv.compile(tool.inputSchema);
  }

  return tools;
}
