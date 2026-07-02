import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { WIDGET_REGISTRY } from './core/dashboard/tokens/widget-registry.token';
import { itemsListDefinition } from './widgets/items-list/items-list.widget-definition';
import { ativosGarantiaDefinition } from './widgets/ativos-garantia/ativos-garantia.widget-definition';
import { eventosCorporativosDefinition } from './widgets/eventos-corporativos/eventos-corporativos.widget-definition';
import { limitePosicoesDefinition } from './widgets/limite-posicoes/limite-posicoes.widget-definition';

/**
 * EXTENSION POINT — Registering a new widget:
 *   1. Create the widget component + widget-definition file (see widgets/ folder).
 *   2. Add a new entry below:
 *      { provide: WIDGET_REGISTRY, useValue: yourWidgetDefinition, multi: true }
 *   That is the ONLY change required in existing code.
 *   New widget teams can even provide this from a lazy-loaded route config.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideAnimationsAsync(),

    // Widget registry — each feature module provides its definitions here
    { provide: WIDGET_REGISTRY, useValue: itemsListDefinition,          multi: true },
    { provide: WIDGET_REGISTRY, useValue: ativosGarantiaDefinition,     multi: true },
    { provide: WIDGET_REGISTRY, useValue: eventosCorporativosDefinition, multi: true },
    { provide: WIDGET_REGISTRY, useValue: limitePosicoesDefinition,     multi: true },
  ],
};
