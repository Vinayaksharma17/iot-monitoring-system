const rawBaseUrl =
  import.meta.env.VITE_GRAFANA_URL || 'http://localhost:3001'

export const GRAFANA_BASE_URL = rawBaseUrl.replace(/\/+$/, '')

// &kiosk hides Grafana's top navigation bar (including the search bar and its
// toggle), so viewers of the embedded dashboards cannot navigate to the
// Grafana admin area. Dashboards are served read-only via anonymous Viewer
// access configured on the Grafana service.
export const GRAFANA_DASHBOARDS = {
  allBedrooms: `${GRAFANA_BASE_URL}/d/f2499d5f-f11b-447e-b9b1-385f2f79b302/all-bedrooms-real-time-overview?orgId=1&refresh=5s&kiosk`,
  singleBedroom: `${GRAFANA_BASE_URL}/d/dd58271e-9e62-43f7-92f2-e9dfe36634d5/single-bedroom-dashboard?orgId=1&refresh=30s&kiosk=tv`,
} as const

export type GrafanaDashboardKey = keyof typeof GRAFANA_DASHBOARDS
