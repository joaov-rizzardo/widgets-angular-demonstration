import { WidgetDefinition } from '../../core/dashboard/models/widget-definition.model';

export const ativosGarantiaDefinition: WidgetDefinition = {
  id: 'ativos-garantia',
  name: 'Ativos Aceitos em Garantia',
  icon: 'shield',
  defaultSize: { cols: 7, rows: 5 },
  minSize:     { cols: 4, rows: 4 },
  component: () =>
    import('./ativos-garantia.component').then(m => m.AtivosGarantiaComponent),
  configSchema: [],
};
