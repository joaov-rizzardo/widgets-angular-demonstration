import { WidgetDefinition } from '../../core/dashboard/models/widget-definition.model';

/**
 * Items List widget definition.
 * Registered as a multi-provider in app.config.ts.
 */
export const itemsListDefinition: WidgetDefinition = {
  id: 'items-list',
  name: 'Lista de ISINs',
  icon: 'table_view',
  defaultSize: { cols: 9, rows: 4 },
  minSize:     { cols: 4, rows: 3 },
  component: () =>
    import('./items-list.component').then(m => m.ItemsListComponent),
  configSchema: [
    { key: 'title',    label: 'Título da lista', type: 'text',   defaultValue: 'Lista de ISINs' },
    { key: 'maxItems', label: 'Máx. de itens',   type: 'number', defaultValue: 5 },
  ],
};
