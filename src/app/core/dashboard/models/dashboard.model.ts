export interface Dashboard {
  id: string;
  name: string;
  widgets: DashboardWidgetInstance[];
}

export interface DashboardWidgetInstance {
  id: string;
  widgetTypeId: string;
  x: number;
  y: number;
  cols: number;
  rows: number;
  config?: Record<string, unknown>;
}
