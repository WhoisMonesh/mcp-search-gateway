import { FastifyInstance } from 'fastify';
import { McpTool } from '../tools/registry.js';

/**
 * Register MCP JSON-RPC 2.0 compatible routes:
 * GET  /mcp/tools  - list all available tools with schemas
 * POST /mcp/call   - call a tool by name
 */
export function registerMcpRoutes(app: FastifyInstance, tools: McpTool[]) {
  // Tool discovery endpoint
  app.get('/mcp/tools', async () => {
    return tools.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
      outputSchema: t.outputSchema
    }));
  });

  // Tool execution endpoint - JSON-RPC 2.0 style
  app.post<{ Body: { id?: string; jsonrpc?: string; method?: string; tool?: string; params?: unknown; input?: unknown } }>(
    '/mcp/call',
    async (request, reply) => {
      const { body } = request;
      const method = body.method || body.tool;
      const params = body.params || body.input || {};

      if (!method) {
        reply.code(400);
        return { error: 'Missing method or tool field', code: -32600 };
      }

      const tool = tools.find((t) => t.name === method);
      if (!tool) {
        reply.code(404);
        return {
          jsonrpc: '2.0',
          id: body.id || null,
          error: { code: -32601, message: `Method not found: ${method}` }
        };
      }

      // Validate input schema
      if (tool.validateInput && !tool.validateInput(params)) {
        reply.code(400);
        return {
          jsonrpc: '2.0',
          id: body.id || null,
          error: { code: -32602, message: 'Invalid params', data: (tool.validateInput as any).errors }
        };
      }

      try {
        const result = await tool.handler(params);
        return {
          jsonrpc: '2.0',
          id: body.id || null,
          result
        };
      } catch (err: unknown) {
        // Log tool name and error message only - never log input which may contain secrets
        request.log.error({ tool: tool.name, msg: (err as Error).message || 'Tool execution failed' });
        reply.code(500);
        return {
          jsonrpc: '2.0',
          id: body.id || null,
          error: { code: -32000, message: 'Internal tool error', tool: tool.name }
        };
      }
    }
  );
}
