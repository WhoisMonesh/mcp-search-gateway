# Configuration Reference

All configuration is supplied via a **YAML file** whose path is set in the `MCP_CONFIG` environment variable.

```
MCP_CONFIG=/config/opensearch.local.yaml
```

## Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `backend` | `opensearch` \| `elasticsearch` | Yes | Which search engine client to use |
| `node` | string (URL) | Yes | Connection URL, e.g. `https://localhost:9200` |
| `auth` | object | No | Authentication block (see below) |
| `aws` | object | No | AWS SigV4 block for Amazon OpenSearch Service |
| `tls` | object | No | TLS options |
| `kibana` / `dashboards` | object | No | UI endpoint metadata |

## Authentication

### Basic Auth

```yaml
auth:
  type: basic
  username: admin
  password: changeme
```

### API Key (Elasticsearch)

```yaml
auth:
  type: apikey
  api_key: "VnVhQ2ZHY0JDZGJrUW0tZTVhT3g6dWkybkNibjN..."
```

### AWS SigV4 (Amazon OpenSearch Service)

```yaml
auth:
  type: aws_sigv4
aws:
  region: us-east-1
  # Credentials from environment / IAM role / IRSA — no keys needed
  # Optional overrides:
  # access_key_id: AKIA...
  # secret_access_key: ...
```

## TLS Options

```yaml
tls:
  verify: true            # Set false only for self-signed dev certs
  ca_cert: /certs/ca.crt  # Path to custom CA bundle
```

## Full Example — OpenSearch Local

```yaml
backend: opensearch
node: https://localhost:9200

auth:
  type: basic
  username: admin
  password: admin

tls:
  verify: false

dashboards:
  url: http://localhost:5601
```

## Full Example — Elasticsearch Local

```yaml
backend: elasticsearch
node: http://localhost:9200

auth:
  type: basic
  username: elastic
  password: changeme

kibana:
  url: http://localhost:5601
```

## Full Example — Amazon OpenSearch Service (IAM)

```yaml
backend: opensearch
node: https://search-my-domain.us-east-1.es.amazonaws.com

auth:
  type: aws_sigv4

aws:
  region: us-east-1

tls:
  verify: true
```

## Environment Variable Overrides

The following environment variables override config file values at runtime:

| Variable | Overrides |
|----------|-----------|
| `OPENSEARCH_URL` | `node` (when backend=opensearch) |
| `OPENSEARCH_USERNAME` | `auth.username` |
| `OPENSEARCH_PASSWORD` | `auth.password` |
| `ELASTICSEARCH_URL` | `node` (when backend=elasticsearch) |
| `ELASTICSEARCH_USERNAME` | `auth.username` |
| `ELASTICSEARCH_PASSWORD` | `auth.password` |
| `AWS_REGION` | `aws.region` |
| `MCP_PORT` | HTTP server port (default: 8080) |
| `MCP_TRANSPORT` | `stdio` (default) or `http` |

## Using Multiple Backends

Run two separate gateway containers, each with its own `MCP_CONFIG`, and register both as separate MCP servers in your LLM client config. The tool names are namespaced (`opensearch_*` vs `elasticsearch_*`) so they will not conflict.
