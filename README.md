# mcp-search-gateway

> **Production-ready MCP server** that exposes OpenSearch and Elasticsearch clusters as Model Context Protocol tools, enabling local and remote LLMs to search, index, and manage your search infrastructure.

[![Docker Build](https://github.com/WhoisMonesh/mcp-search-gateway/actions/workflows/docker-multiarch-build.yml/badge.svg)](https://github.com/WhoisMonesh/mcp-search-gateway/actions/workflows/docker-multiarch-build.yml)
[![CI](https://github.com/WhoisMonesh/mcp-search-gateway/actions/workflows/lint-test.yml/badge.svg)](https://github.com/WhoisMonesh/mcp-search-gateway/actions/workflows/lint-test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![ghcr.io](https://img.shields.io/badge/ghcr.io-whoismonesh%2Fmcp--search--gateway-blue)](https://ghcr.io/whoismonesh/mcp-search-gateway)

## Features

- **Dual backend** — supports both OpenSearch and Elasticsearch from a single image
- **10 MCP tools** — search, index, delete, list indices, cluster health (5 per backend)
- **Multi-arch Docker images** — `linux/amd64` + `linux/arm64` via `docker buildx`
- **Flexible auth** — basic, API key, AWS SigV4 (IAM / IRSA)
- **LLM integrations** — Claude Desktop, Ollama, Vertex AI, Amazon Bedrock
- **Hardened image** — non-root user, read-only FS, Trivy-scanned
- **CI/CD** — GitHub Actions (GHCR) + Bitbucket Pipelines (JFrog Artifactory)

## Quick Start

### Docker (recommended)

```bash
# 1. Clone the repo
git clone https://github.com/WhoisMonesh/mcp-search-gateway.git
cd mcp-search-gateway

# 2. Start OpenSearch + Dashboards + MCP Gateway
docker compose -f examples/docker-compose/opensearch-mcp.yml up -d

# 3. Verify health
curl http://localhost:8080/health
# {"status":"ok","backend":"opensearch"}
```

### From source

```bash
npm install
MCP_CONFIG=config/opensearch.local.yaml npm start
```

### Pull the image

```bash
docker pull ghcr.io/whoismonesh/mcp-search-gateway:latest
```

## Repository Structure

```
mcp-search-gateway/
├── .github/
│   └── workflows/
│       ├── docker-multiarch-build.yml  # Build & push multi-arch image to GHCR
│       └── lint-test.yml               # ESLint + Jest CI
├── config/
│   ├── opensearch.local.yaml         # Local OpenSearch config
│   ├── opensearch.aws.yaml           # Amazon OpenSearch Service (IAM)
│   └── elasticsearch.local.yaml      # Local Elasticsearch config
├── docker/
│   └── Dockerfile                    # Hardened multi-stage build
├── docs/
│   ├── architecture.md               # System design & component overview
│   ├── configuration.md              # Full config reference
│   └── llm-integration.md            # LLM integration guides
├── examples/
│   └── docker-compose/
│       ├── opensearch-mcp.yml           # OpenSearch + Dashboards + MCP
│       └── elasticsearch-mcp.yml        # Elasticsearch + Kibana + MCP
├── src/
│   ├── server.js                     # MCP JSON-RPC 2.0 server
│   ├── config.js                     # YAML config loader & validator
│   ├── client.js                     # Search client adapter
│   └── tools/
│       ├── search.js                   # Search tools
│       ├── index.js                    # Index document tools
│       ├── indices.js                  # List indices tools
│       ├── cluster.js                  # Cluster health tools
│       └── delete.js                   # Delete document tools
├── bitbucket-pipelines.yml           # Bitbucket + JFrog Artifactory CI
├── package.json
└── README.md
```

## MCP Tools

| Tool | Description |
|------|-------------|
| `opensearch_search` | Execute a search query against an OpenSearch index |
| `opensearch_index_document` | Index a document into OpenSearch |
| `opensearch_delete_document` | Delete a document by ID from OpenSearch |
| `opensearch_list_indices` | List all OpenSearch indices |
| `opensearch_cluster_health` | Get OpenSearch cluster health status |
| `elasticsearch_search` | Execute a search query against an Elasticsearch index |
| `elasticsearch_index_document` | Index a document into Elasticsearch |
| `elasticsearch_delete_document` | Delete a document by ID from Elasticsearch |
| `elasticsearch_list_indices` | List all Elasticsearch indices |
| `elasticsearch_cluster_health` | Get Elasticsearch cluster health status |

## Configuration

Create a YAML config file and point `MCP_CONFIG` to it:

```yaml
# config/opensearch.local.yaml
backend: opensearch
node: https://localhost:9200

auth:
  type: basic
  username: admin
  password: admin

tls:
  verify: false
```

See [docs/configuration.md](docs/configuration.md) for the full reference including AWS IAM / API key auth.

## LLM Integration

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "opensearch": {
      "command": "docker",
      "args": ["run", "--rm", "-i",
        "-v", "/path/to/config:/config:ro",
        "-e", "MCP_CONFIG=/config/opensearch.local.yaml",
        "ghcr.io/whoismonesh/mcp-search-gateway:latest"]
    }
  }
}
```

### Ollama

```bash
docker run -d -p 8080:8080 \
  -e MCP_CONFIG=/config/opensearch.local.yaml \
  -e MCP_TRANSPORT=http \
  -v ./config:/config:ro \
  ghcr.io/whoismonesh/mcp-search-gateway:latest
```

See [docs/llm-integration.md](docs/llm-integration.md) for Vertex AI and Amazon Bedrock guides.

## Docker Build

The multi-arch image is built automatically on every tag push:

```bash
# Manual multi-arch build
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t ghcr.io/whoismonesh/mcp-search-gateway:latest \
  -f docker/Dockerfile \
  --push .
```

## CI/CD

| Pipeline | Trigger | Output |
|----------|---------|--------|
| GitHub Actions (`docker-multiarch-build.yml`) | Push to `main`, tags `v*` | Multi-arch image on GHCR |
| GitHub Actions (`lint-test.yml`) | Every PR & push | ESLint + Jest results |
| Bitbucket Pipelines (`bitbucket-pipelines.yml`) | Push to `main`, tags `v*` | Multi-arch image on JFrog Artifactory |

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Run tests: `npm test`
4. Submit a pull request

## License

[MIT](LICENSE) © WhoisMonesh
