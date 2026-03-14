import Fastify from 'fastify';
import { loadConfig } from './config/index.js';
import { buildToolRegistry } from './mcp/tools/registry.js';
import { registerMcpRoutes } from './mcp/server/routes.js';

async function main() {
  const cfg = loadConfig();

  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      // Redact sensitive fields from logs - never log secrets
      redact: ['req.headers.authorization', 'req.headers["x-api-key"]']
    }
  });

  // Health check endpoint
  app.get('/health', async () => ({
    status: 'ok',
    version: '0.1.0',
    timestamp: new Date().toISOString()
  }));

  const tools = buildToolRegistry(cfg);
  registerMcpRoutes(app, tools);

  await app.listen({
    host: cfg.serverBind,
    port: cfg.serverPort
  });

  app.log.info(
    `MCP Search Gateway running on ${cfg.serverBind}:${cfg.serverPort} | Tools: ${tools.length}`
  );
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal error:', err.message);
  process.exit(1);
});
