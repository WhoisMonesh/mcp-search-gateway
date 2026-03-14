import { Client } from '@elastic/elasticsearch';
import type { McpTool } from './registry.js';

/**
 * Elasticsearch MCP tools
 * Uses @elastic/elasticsearch v9 API (no .body wrapper)
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
      handler: async (input: unknown) => {
        const { indices, query, from = 0, size = 10 } = input as {
          indices: string[];
          query: Record<string, unknown>;
          from?: number;
          size?: number;
        };
        const res = await client.search({
          index: indices.join(','),
          query: query as Record<string, unknown>,
          from,
          size
        });
        return res as unknown;
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
      handler: async (input: unknown) => {
        const { pattern = '*' } = (input as Record<string, unknown>) ?? {};
        const res = await client.cat.indices({
          index: (pattern as string) || '*',
          format: 'json',
          h: ['index', 'health', 'status', 'docs.count', 'store.size']
        });
        return res as unknown;
      }
    },
    {
      name: 'elasticsearch_cluster_health',
      description: 'Get Elasticsearch cluster health and status.',
      inputSchema: { type: 'object', properties: {} },
      outputSchema: { type: 'object' },
      handler: async (_input: unknown) => {
        const res = await client.cluster.health();
        return res as unknown;
      }
    }
  ];

  if (!readOnly) {
    tools.push(
      {
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
        handler: async (input: unknown) => {
          const { index, id, document } = input as {
            index: string;
            id?: string;
            document: Record<string, unknown>;
          };
          const res = await client.index({
            index,
            id,
            document,
            refresh: 'wait_for'
          });
          return res as unknown;
        }
      },
      {
        name: 'elasticsearch_delete_document',
        description: 'Delete a document by ID from Elasticsearch.',
        inputSchema: {
          type: 'object',
          properties: {
            index: { type: 'string' },
            id: { type: 'string' }
          },
          required: ['index', 'id']
        },
        outputSchema: { type: 'object' },
        handler: async (input: unknown) => {
          const { index, id } = input as { index: string; id: string };
          const res = await client.delete({
            index,
            id,
            refresh: 'wait_for'
          });
          return res as unknown;
        }
      }
    );
  }

  return tools;
}
