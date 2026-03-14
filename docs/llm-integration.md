# LLM Integration Guide

This guide covers how to connect `mcp-search-gateway` to various LLM runtimes.

## Prerequisites

1. Gateway running (Docker or `npm start`)
2. A config YAML pointing at your cluster (see [configuration.md](./configuration.md))
3. The LLM runtime installed

---

## Claude Desktop (stdio transport)

Add the server to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "opensearch": {
      "command": "docker",
      "args": [
        "run", "--rm", "-i",
        "-v", "/path/to/config:/config:ro",
        "-e", "MCP_CONFIG=/config/opensearch.local.yaml",
        "ghcr.io/whoismonesh/mcp-search-gateway:latest"
      ]
    },
    "elasticsearch": {
      "command": "docker",
      "args": [
        "run", "--rm", "-i",
        "-v", "/path/to/config:/config:ro",
        "-e", "MCP_CONFIG=/config/elasticsearch.local.yaml",
        "ghcr.io/whoismonesh/mcp-search-gateway:latest"
      ]
    }
  }
}
```

Restart Claude Desktop. The `opensearch_*` and `elasticsearch_*` tools will appear in the tools panel.

---

## Ollama (HTTP transport)

Ollama communicates with MCP servers over HTTP. Start the gateway in HTTP mode:

```bash
docker run -d \
  -p 8080:8080 \
  -v ./config:/config:ro \
  -e MCP_CONFIG=/config/opensearch.local.yaml \
  -e MCP_TRANSPORT=http \
  --name mcp-gateway \
  ghcr.io/whoismonesh/mcp-search-gateway:latest
```

Configure Ollama to use the MCP endpoint:

```bash
ollama serve --mcp http://localhost:8080/mcp
```

Or in `~/.ollama/config.yaml`:

```yaml
mcp_servers:
  - name: opensearch
    url: http://localhost:8080/mcp
```

Test with:

```bash
ollama run llama3 "Search the 'products' index for laptop"
```

---

## Google Vertex AI (via LiteLLM proxy)

Vertex AI models support tool calling. Use [LiteLLM](https://github.com/BerriAI/litellm) as a bridge:

```bash
pip install litellm[proxy]
```

`litellm_config.yaml`:

```yaml
model_list:
  - model_name: gemini-pro
    litellm_params:
      model: vertex_ai/gemini-pro
      vertex_project: my-gcp-project
      vertex_location: us-central1

mcp_servers:
  opensearch:
    url: http://localhost:8080/mcp
```

```bash
litellm --config litellm_config.yaml --port 4000
```

Now call via OpenAI-compatible API:

```python
from openai import OpenAI

client = OpenAI(base_url="http://localhost:4000", api_key="sk-1234")

response = client.chat.completions.create(
    model="gemini-pro",
    messages=[{"role": "user", "content": "Search opensearch index 'logs' for errors in the last hour"}]
)
print(response.choices[0].message.content)
```

---

## Amazon Bedrock (Claude on Bedrock)

### IAM Setup

Create an IAM role with these policies:
- `AmazonBedrockFullAccess` (or scoped to your model ARN)
- Custom policy for OpenSearch: `es:ESHttpGet`, `es:ESHttpPost`, `es:ESHttpPut`

### Using with Bedrock Agents

1. Deploy the gateway as an ECS service or Lambda (HTTP transport)
2. Create an **Action Group** in Bedrock Agents pointing to the gateway endpoint
3. Provide the OpenAPI schema (generated from `GET /mcp/openapi`)

```bash
# Get OpenAPI schema from running gateway
curl http://localhost:8080/mcp/openapi > opensearch-mcp-schema.json
```

### Using with Bedrock + LiteLLM

```yaml
model_list:
  - model_name: claude-3-sonnet
    litellm_params:
      model: bedrock/anthropic.claude-3-sonnet-20240229-v1:0
      aws_region_name: us-east-1

mcp_servers:
  opensearch:
    url: http://your-gateway-endpoint:8080/mcp
```

---

## Tool Reference

Once connected, the following tools are available to the LLM:

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `opensearch_search` | Full-text / DSL search | `index`, `query`, `size` |
| `opensearch_index_document` | Index a new document | `index`, `id` (optional), `document` |
| `opensearch_delete_document` | Delete by ID | `index`, `id` |
| `opensearch_list_indices` | List all indices | - |
| `opensearch_cluster_health` | Get cluster health | - |
| `elasticsearch_search` | Full-text / DSL search | `index`, `query`, `size` |
| `elasticsearch_index_document` | Index a new document | `index`, `id` (optional), `document` |
| `elasticsearch_delete_document` | Delete by ID | `index`, `id` |
| `elasticsearch_list_indices` | List all indices | - |
| `elasticsearch_cluster_health` | Get cluster health | - |

### Example Tool Call (LLM-generated)

```json
{
  "name": "opensearch_search",
  "arguments": {
    "index": "products",
    "query": {
      "match": { "description": "wireless headphones" }
    },
    "size": 5
  }
}
```

### Example Response

```json
{
  "content": [
    {
      "type": "text",
      "text": "{\"hits\":{\"total\":{\"value\":42},\"hits\":[...]}}"
    }
  ]
}
```
