import { DashboardsConfig } from '../../config/types.js';

export interface DashboardUrlParams {
  type: 'dashboard' | 'visualization' | 'search';
  id: string;
  query?: string;
}

/**
 * Builds a URL to a saved object in OpenSearch Dashboards or Kibana.
 * Returns null if dashboards URL is not configured.
 */
export function buildDashboardsUrl(
  cfg: DashboardsConfig | undefined,
  params: DashboardUrlParams
): string | null {
  if (!cfg?.url) return null;

  const base = cfg.url.replace(/\/+$/, '');

  const appPaths: Record<DashboardUrlParams['type'], string> = {
    dashboard: 'app/dashboards#/view',
    search: 'app/discover#/view',
    visualization: 'app/visualize#/view'
  };

  let url = `${base}/${appPaths[params.type]}/${encodeURIComponent(params.id)}`;

  if (params.query) {
    url += `?q=${encodeURIComponent(params.query)}`;
  }

  return url;
}
