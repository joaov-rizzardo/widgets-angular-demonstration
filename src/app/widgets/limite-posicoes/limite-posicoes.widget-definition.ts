import { WidgetDefinition } from '../../core/dashboard/models/widget-definition.model';

export const limitePosicoesDefinition: WidgetDefinition = {
  id: 'limite-posicoes',
  name: 'Limites de Posições',
  icon: 'rule',
  defaultSize: { cols: 8, rows: 6 },
  minSize:     { cols: 5, rows: 4 },
  component: () =>
    import('./limite-posicoes.component').then(m => m.LimitePosicoesComponent),
  configSchema: [],
};
