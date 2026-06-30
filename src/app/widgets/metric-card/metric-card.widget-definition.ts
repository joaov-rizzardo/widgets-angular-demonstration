import { WidgetDefinition } from '../../core/dashboard/models/widget-definition.model';

/**
 * Metric Card widget definition.
 * Registered as a multi-provider in app.config.ts.
 *
 * The component() function is a lazy import — the widget bundle is only loaded
 * when the dashboard first renders an instance of this widget type.
 */
export const metricCardDefinition: WidgetDefinition = {
  id: 'metric-card',
  name: 'Card de Métrica',
  icon: 'bar_chart',
  defaultSize: { cols: 3, rows: 2 },
  minSize:     { cols: 2, rows: 2 },
  component: () =>
    import('./metric-card.component').then(m => m.MetricCardComponent),
  configSchema: [
    { key: 'label', label: 'Título',  type: 'text',   defaultValue: 'Métrica' },
    { key: 'value', label: 'Valor',   type: 'number', defaultValue: 0 },
    { key: 'trend', label: 'Variação (ex: +5.2%)', type: 'text', defaultValue: '' },
    { key: 'unit',  label: 'Unidade', type: 'text',   defaultValue: '' },
    {
      key: 'color',
      label: 'Cor do destaque',
      type: 'select',
      defaultValue: 'teal',
      options: [
        { value: 'teal',    label: 'Azul-petróleo' },
        { value: 'amber',   label: 'Âmbar' },
        { value: 'navy',    label: 'Marinho' },
        { value: 'success', label: 'Verde' },
        { value: 'danger',  label: 'Vermelho' },
      ],
    },
  ],
};
