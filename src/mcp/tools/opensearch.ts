import { Client } from '@opensearch-project/opensearch';
import type { McpTool } from './registry.js';

/**
 * OpenSearch MCP tools
 * readOnly flag disables write operations (index_document)
 */
export function opensearchTools(client: Client | undefined, readOnly = false): McpTool[] {
  if (!client) return [];

  const tools: McpTool[] = [
    {
      name: 'opensearch_search',
      description: 'Run a search query on one or more OpenSearch indices.',
      inputSchema: {
        type: 'object',
        properties: {
          indices: { type: 'array', items: { type: 'string' }, description: 'List of index names or patterns' },
          query: { type: 'object', description: 'OpenSearch query DSL object' },
          from: { type: 'integer', minimum: 0, default: 0 },
          size: { type: 'integer', minimum: 1, maximum: 1000, default: 10 }
        },
        required: ['indices', 'query']
      },
      outputSchema: { type: 'object' },
      handler: async (input: unknown) => {
        const { indices, query, from = 0, size = 10 } = input as {
          indices: string[];
          query: Record<string, unknown>;
          from?: number;
          size?: number;
        };
        const res = await client.search({ index: indices.join(','), body: { query }, from, size });
        return res.body as unknown;
      }
    },
    {
      name: 'opensearch_list_indices',
      description: 'List OpenSearch indices with metadata.',
      inputSchema: {
        type: 'object',
        properties: {
          pattern: { type: 'string', default: '*', description: 'Index name pattern (glob)' }
        }
      },
      outputSchema: { type: 'array', items: { type: 'object' } },
      handler: async (input: unknown) => {
        const { pattern = '*' } = (input as Record<string, unknown>) ?? {};
        const res = await client.cat.indices({
          index: (pattern as string) || '*',
          format: 'json',
          h: 'index,health,status,docs.count,store.size'
        });
        return res.body as unknown;
      }
    },
    {
      name: 'opensearch_cluster_health',
      description: 'Get OpenSearch cluster health and status.',
      inputSchema: { type: 'object', properties: {} },
      outputSchema: { type: 'object' },
      handler: async (_input: unknown) => {
        const res = await client.cluster.health();
        return res.body as unknown;
      }
    }
  ];

  // Write tools: disabled in read-only mode
  if (!readOnly) {
    tools.push({
      name: 'opensearch_index_document',
      description: 'Index or update a document in OpenSearch.',
      inputSchema: {
        type: 'object',
        properties: {
          index: { type: 'string' },
          id: { type: 'string', description: 'Optional document ID' },
          document: { type: 'object', description: 'Document body to index' }
        },
        required: ['index', 'document']
      },
      outputSchema: { type: 'object' },
      handler: async (input: unknown) => {
        const { index, id, document } = input as {
          index: string;
          id?: string;
          document: Record<string, unknown>;
        };
        const res = await client.index({
          index,
          id,
          body: document,
          refresh: 'wait_for'
        });
        return res.body as unknown;
      }
    });
  }

  return tools;
}
