import { DashboardsConfig } from '../../config/types.js';
import { buildDashboardsUrl } from '../connectors/dashboardsClient.js';
import type { McpTool } from './registry.js';

/**
 * Dashboards MCP tools for Kibana and OpenSearch Dashboards
 */
export function dashboardsTools(cfg: DashboardsConfig | undefined): McpTool[] {
  if (!cfg?.url) return [];

  return [
    {
      name: 'dashboards_generate_url',
      description:
        'Generate a clickable URL to a saved dashboard, visualization, or search in Kibana or OpenSearch Dashboards.',
      inputSchema: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['dashboard', 'visualization', 'search'],
            description: 'Type of saved object'
          },
          id: { type: 'string', description: 'Saved object ID' },
          query: { type: 'string', description: 'Optional KQL query string to filter' }
        },
        required: ['type', 'id']
      },
      outputSchema: {
        type: 'object',
        properties: { url: { type: 'string' } },
        required: ['url']
      },
      handler: async (input: unknown) => {
        const { type, id, query } = input as { type: string; id: string; query?: string };
        const url = buildDashboardsUrl(cfg, { type, id, query });
        if (!url) throw new Error('Dashboards URL not configured');
        return { url } as unknown;
      }
    }
  ];
}
