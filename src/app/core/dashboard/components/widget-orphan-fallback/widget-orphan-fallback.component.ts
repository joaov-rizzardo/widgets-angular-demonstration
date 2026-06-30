import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-widget-orphan-fallback',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="orphan">
      <span class="material-icons">broken_image</span>
      <p class="orphan__title">Widget não encontrado</p>
      <p class="orphan__id">Tipo: <code>{{ widgetTypeId() }}</code></p>
      <p class="orphan__hint">O widget foi removido do registro. Remova-o do dashboard.</p>
    </div>
  `,
  styles: [`
    .orphan {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 24px;
      text-align: center;
      color: var(--color-text-muted);
      gap: 8px;

      .material-icons {
        font-size: 40px;
        color: var(--color-border-dark);
      }

      &__title { font-weight: 600; color: var(--color-text-sec); }

      &__id code {
        background: var(--color-border);
        padding: 1px 6px;
        border-radius: var(--radius-sm);
        font-size: 12px;
      }

      &__hint { font-size: 12px; max-width: 220px; }
    }
  `],
})
export class WidgetOrphanFallbackComponent {
  readonly widgetTypeId = input<string>('unknown');
}
