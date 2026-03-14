# Architecture

## Overview

`mcp-search-gateway` is a **Model Context Protocol (MCP) server** that exposes OpenSearch and Elasticsearch clusters as MCP tools, enabling LLMs to search, index, and manage search infrastructure through a standardised JSON-RPC 2.0 interface.

```
┌─────────────────────────────────────────────────────────────┐
│                        LLM Clients                          │
│  (Claude Desktop · Ollama · Vertex AI · Amazon Bedrock)     │
└──────────────────────┬──────────────────────────────────────┘
                       │  MCP / JSON-RPC 2.0 (stdio or HTTP)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│               mcp-search-gateway (Node.js)                  │
│                                                             │
│  ┌────────────┐  ┌───────────────┐  ┌──────────────────┐   │
│  │ MCP Router │  │  Tool Handler │  │  Config Loader   │   │
│  └─────┬──────┘  └───────┬───────┘  └────────┬─────────┘   │
│        │                 │                   │             │
│  ┌─────▼─────────────────▼───────────────────▼──────────┐  │
│  │               Search Client Adapter                   │  │
│  │  ┌────────────────────┐  ┌────────────────────────┐  │  │
│  │  │  OpenSearch Client │  │ Elasticsearch Client   │  │  │
│  │  └────────────────────┘  └────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │  HTTPS / REST
          ┌────────────┴────────────┐
          ▼                         ▼
┌──────────────────┐     ┌──────────────────────┐
│  OpenSearch       │     │  Elasticsearch        │
│  + Dashboards     │     │  + Kibana             │
└──────────────────┘     └──────────────────────┘
```

## Components

### MCP Server (`src/server.js`)

Implements the MCP specification over **stdio** (default) or a plain HTTP POST endpoint. Handles:
- `initialize` / `initialized` handshake
- `tools/list` – advertises all registered tools with JSON Schema
- `tools/call` – dispatches to the correct tool handler
- Structured error responses (`-32600` invalid request, `-32601` method not found, `-32603` internal error)

### Tool Handlers (`src/tools/`)

| File | Tools exposed |
|------|---------------|
| `search.js` | `opensearch_search`, `elasticsearch_search` |
| `index.js` | `opensearch_index_document`, `elasticsearch_index_document` |
| `indices.js` | `opensearch_list_indices`, `elasticsearch_list_indices` |
| `cluster.js` | `opensearch_cluster_health`, `elasticsearch_cluster_health` |
| `delete.js` | `opensearch_delete_document`, `elasticsearch_delete_document` |

### Config Loader (`src/config.js`)

Loads a YAML config file from the path specified in `MCP_CONFIG` environment variable (default `config/opensearch.local.yaml`). Validates required fields and merges environment variable overrides.

### Search Client Adapter (`src/client.js`)

Instantiates `@opensearch-project/opensearch` or `@elastic/elasticsearch` based on the `backend` field in config. Handles:
- Basic auth
- API key auth
- AWS SigV4 signing via `aws4` for Amazon OpenSearch Service
- TLS certificate verification toggle

## Request Lifecycle

```
LLM → MCP tools/call { name: "opensearch_search", arguments: {...} }
  → server.js dispatches to tools/search.js#opensearchSearch()
  → client.js executes client.search({ index, body })
  → Response mapped to MCP content array
  → Returned to LLM as JSON-RPC result
```

## Multi-Architecture Docker Build

Images are built for `linux/amd64` and `linux/arm64` using `docker buildx` in GitHub Actions. The workflow:
1. Sets up QEMU for cross-compilation
2. Creates a multi-platform builder
3. Builds and pushes to **GHCR** (`ghcr.io/whoismonesh/mcp-search-gateway`)
4. Tags: `latest`, `vX.Y.Z`, `sha-<commit>`

For **Bitbucket Pipelines + JFrog Artifactory**, see `bitbucket-pipelines.yml` — the same buildx approach is used, pushing to `<JFROG_REGISTRY>/mcp-search-gateway`.

## Security Considerations

- Docker image runs as non-root user (`node`, UID 1000)
- Read-only filesystem with tmpfs mounts for writable paths
- No shell in production image (`node:22-alpine` distroless-style)
- Trivy vulnerability scanning in CI before push
- Secrets passed as environment variables, never baked into image
- AWS credentials consumed via IAM role / IRSA — no static keys needed
