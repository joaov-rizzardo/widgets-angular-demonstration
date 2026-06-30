import { WidgetDefinition } from '../../core/dashboard/models/widget-definition.model';

export const eventosCorporativosDefinition: WidgetDefinition = {
  id: 'eventos-corporativos',
  name: 'Eventos Corporativos',
  icon: 'event_note',
  defaultSize: { cols: 12, rows: 5 },
  minSize:     { cols: 6,  rows: 4 },
  component: () =>
    import('./eventos-corporativos.component').then(m => m.EventosCorporativosComponent),
  configSchema: [],
};
