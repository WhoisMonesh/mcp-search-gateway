import { Client } from '@elastic/elasticsearch';
import type { McpTool } from './registry.js';

/**
 * Elasticsearch MCP tools
 * readOnly flag disables write operations
 */
export function elasticsearchTools(client: Client | undefined, readOnly = false): McpTool[] {
  if (!client) return [];

  const tools: McpTool[] = [
    {
      name: 'elasticsearch_search',
      description: 'Run a search query on one or more Elasticsearch indices.',
      inputSchema: {
        type: 'object',
        properties: {
          indices: { type: 'array', items: { type: 'string' }, description: 'Index names or patterns' },
          query: { type: 'object', description: 'Elasticsearch query DSL' },
          from: { type: 'integer', minimum: 0, default: 0 },
          size: { type: 'integer', minimum: 1, maximum: 1000, default: 10 }
        },
        required: ['indices', 'query']
      },
      outputSchema: { type: 'object' },
      handler: async (input: any) => {
        const { indices, query, from = 0, size = 10 } = input;
        const res = await client.search({ index: indices.join(','), body: { query }, from, size });
        return res.body;
      }
    },
    {
      name: 'elasticsearch_list_indices',
      description: 'List Elasticsearch indices with metadata.',
      inputSchema: {
        type: 'object',
        properties: {
          pattern: { type: 'string', default: '*' }
        }
      },
      outputSchema: { type: 'array', items: { type: 'object' } },
      handler: async (input: any) => {
        const res = await client.cat.indices({ index: input.pattern || '*', format: 'json', h: 'index,health,status,docs.count,store.size' });
        return res.body;
      }
    },
    {
      name: 'elasticsearch_cluster_health',
      description: 'Get Elasticsearch cluster health and status.',
      inputSchema: { type: 'object', properties: {} },
      outputSchema: { type: 'object' },
      handler: async () => {
        const res = await client.cluster.health();
        return res.body;
      }
    }
  ];

  if (!readOnly) {
    tools.push({
      name: 'elasticsearch_index_document',
      description: 'Index or update a document in Elasticsearch.',
      inputSchema: {
        type: 'object',
        properties: {
          index: { type: 'string' },
          id: { type: 'string' },
          document: { type: 'object' }
        },
        required: ['index', 'document']
      },
      outputSchema: { type: 'object' },
      handler: async (input: any) => {
        const res = await client.index({
          index: input.index,
          id: input.id,
          body: input.document,
          refresh: 'wait_for'
        });
        return res.body;
      }
    });
  }

  return tools;
}
