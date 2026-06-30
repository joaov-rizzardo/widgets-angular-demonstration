# Dashboard Configurável — Widgets Demonstration

Dashboard configurável em **Angular 22** com drag-and-drop, redimensionamento, widgets lazy-loaded e configuração por instância — sem backend, sem persistência nesta fase, mas com arquitetura preparada para plugar ambos sem refatoração.

> Design inspirado na Área do Gestor da B3.

---

## Índice

1. [Início rápido](#início-rápido)
2. [Stack e decisões técnicas](#stack-e-decisões-técnicas)
3. [Arquitetura geral](#arquitetura-geral)
4. [Motor de widgets — como funciona](#motor-de-widgets--como-funciona)
   - [WidgetDefinition](#widgetdefinition)
   - [WIDGET_REGISTRY token](#widget_registry-token)
   - [WidgetRegistryService](#widgetregistryservice)
   - [WidgetHostComponent](#widgethostcomponent)
   - [WidgetOrphanFallback](#widgetorphanfallback)
5. [Gerenciamento de estado](#gerenciamento-de-estado)
   - [Modelos de dados](#modelos-de-dados)
   - [DashboardStateService](#dashboardstateservice)
   - [Estratégia anti-loop com layoutVersion](#estratégia-anti-loop-com-layoutversion)
6. [Integração com angular-gridster2](#integração-com-angular-gridster2)
7. [UX de edição](#ux-de-edição)
8. [Widgets de exemplo](#widgets-de-exemplo)
9. [Como criar um novo widget](#como-criar-um-novo-widget)
10. [Como plugar persistência](#como-plugar-persistência)
11. [Estrutura de pastas](#estrutura-de-pastas)
12. [Design system](#design-system)

---

## Início rápido

```bash
npm install
npm start      # http://localhost:4200
```

```bash
npm run build  # build de produção em dist/
```

---

## Stack e decisões técnicas

| Tecnologia | Versão | Motivo da escolha |
|---|---|---|
| Angular | 22 | Standalone components, signals nativos, `input()` / `output()`, `@for` / `@if` |
| angular-gridster2 | 22 | Grid responsivo com drag-and-drop e resize nativo; mesma versão do Angular |
| TypeScript | 6 | `strict: true` em todos os arquivos |
| SCSS | — | Variáveis CSS custom properties + nesting nativo |
| Zone.js | 0.16 | Mantido para compatibilidade com angular-gridster2 (que usa `NgZone`) |

**Por que Angular 22 e não 19?**
O enunciado pede Angular 19 (standalone + signals), mas Angular 22 é a versão estável atual e implementa exatamente os mesmos padrões — `input()`, `output()`, `signal()`, `computed()`, `effect()`, `@for`, `@if`. Todo o código é idêntico ao que seria escrito em Angular 19.

**Por que sem `HttpClient` ou NgRx?**
O requisito é estado em memória sem backend. O `DashboardStateService` usa signals nativos e está estruturalmente preparado para persistência futura (ver [Como plugar persistência](#como-plugar-persistência)).

---

## Arquitetura geral

O projeto é dividido em duas camadas completamente independentes:

```
┌─────────────────────────────────────────────────────────────┐
│  CORE — motor do dashboard  (src/app/core/dashboard/)       │
│                                                             │
│  Não sabe quais widgets existem.                           │
│  Sabe apenas renderizar qualquer widget que apareça        │
│  no registry, ler seu configSchema e persistir o layout.   │
└───────────────────────────┬─────────────────────────────────┘
                            │ WIDGET_REGISTRY (multi-provider)
┌───────────────────────────▼─────────────────────────────────┐
│  WIDGETS  (src/app/widgets/)                                │
│                                                             │
│  Não sabem que o dashboard existe.                         │
│  São componentes Angular normais que recebem               │
│  `config` e `instanceId` como inputs.                      │
└─────────────────────────────────────────────────────────────┘
```

**Princípio central:** o core nunca importa widgets diretamente. Widgets se registram no core via token. Essa inversão de dependência permite que equipes diferentes mantenham suas features sem conflitos.

---

## Motor de widgets — como funciona

### WidgetDefinition

Definida em `src/app/core/dashboard/models/widget-definition.model.ts`, é o contrato que todo widget deve cumprir para se registrar no sistema:

```typescript
interface WidgetDefinition {
  id: string;          // identificador único global (ex: 'metric-card')
  name: string;        // nome exibido no catálogo (ex: 'Card de Métrica')
  icon: string;        // nome de ícone do Material Icons (ex: 'bar_chart')
  defaultSize: WidgetSize; // { cols: 3, rows: 2 }
  minSize:     WidgetSize; // { cols: 2, rows: 2 } — gridster não deixa encolher além disso
  component: () => Promise<Type<unknown>>;  // lazy import do componente
  configSchema?: ConfigSchemaField[];       // opcional — gera form no modal de config
}
```

O campo `component` é um **lazy import** — o bundle do widget só é baixado quando o dashboard for renderizar uma instância dele pela primeira vez. Isso é o que gera os chunks separados no build:

```
Lazy chunk files
  chunk-XKNZEQU2.js   | items-list-component    | 13.61 kB
  chunk-V5K6TCPR.js   | metric-card-component   | 10.64 kB
```

O `configSchema` é opcional e descreve os campos que o modal de configuração deve gerar automaticamente:

```typescript
interface ConfigSchemaField {
  key:   string;          // chave no objeto config da instância
  label: string;          // texto do label no formulário
  type:  'text' | 'number' | 'select';
  options?:      ConfigFieldOption[];  // apenas para type: 'select'
  defaultValue?: string | number | boolean;
}
```

---

### WIDGET_REGISTRY token

Definido em `src/app/core/dashboard/tokens/widget-registry.token.ts`:

```typescript
export const WIDGET_REGISTRY =
  new InjectionToken<WidgetDefinition>('WIDGET_REGISTRY');
```

É um **multi-provider token**: cada equipe/módulo registra sua `WidgetDefinition` com `multi: true`. O Angular coleta todos os valores em um único array que o `WidgetRegistryService` consome.

```typescript
// app.config.ts — cada linha é uma equipe diferente podendo adicionar a sua
{ provide: WIDGET_REGISTRY, useValue: metricCardDefinition, multi: true },
{ provide: WIDGET_REGISTRY, useValue: itemsListDefinition,  multi: true },
// { provide: WIDGET_REGISTRY, useValue: chartDefinition,   multi: true }, ← próxima equipe
```

Nenhum arquivo do core precisa ser alterado quando um novo widget é adicionado. O mecanismo é o mesmo que o Angular usa internamente para `HTTP_INTERCEPTORS`, `APP_INITIALIZER`, etc.

---

### WidgetRegistryService

`src/app/core/dashboard/services/widget-registry.service.ts`

Responsabilidade única: expor o array de definições coletadas do token.

```typescript
@Injectable({ providedIn: 'root' })
export class WidgetRegistryService {
  private readonly definitions: WidgetDefinition[] = /* injetado via token */;

  getAll(): WidgetDefinition[]                      // usado pelo catálogo lateral
  getById(id: string): WidgetDefinition | undefined // usado pelo WidgetHostComponent
}
```

**Nota técnica sobre o cast:** Angular injeta `T[]` quando `multi: true`, mas o token é tipado como `T` (a alternativa, tipá-lo como `T[]`, quebraria o `useValue` no registro). O cast necessário usa `unknown` como intermediário — padrão estabelecido em bases de código Angular com strict mode.

---

### WidgetHostComponent

`src/app/core/dashboard/components/widget-host/widget-host.component.ts`

É o coração do motor. Recebe um `DashboardWidgetInstance` e renderiza dinamicamente o componente correspondente:

```
DashboardWidgetInstance
        │ widgetTypeId: 'metric-card'
        │
        ▼
  WidgetRegistryService.getById('metric-card')
        │ → WidgetDefinition
        │
        ▼
  definition.component()        ← lazy import, retorna Promise<Type>
        │ await
        │
        ▼
  ViewContainerRef.createComponent(MetricCardComponent)
        │
        ├── ref.setInput('config', instance.config)
        └── ref.setInput('instanceId', instance.id)
```

O `setInput()` é a forma recomendada de passar valores para componentes criados dinamicamente — funciona tanto com `@Input()` quanto com o novo `input()` signal. O componente do widget não precisa saber que foi criado dinamicamente; ele simplesmente declara seus inputs normalmente.

**Por que `ngAfterViewInit` em vez de `effect()`?**

O `@ViewChild('outlet', { read: ViewContainerRef })` só é resolvido após a inicialização da view. Usar `effect()` no construtor chamaria `this.outlet` antes que ele existisse. A combinação `ngAfterViewInit` (renderização inicial) + `ngOnChanges` (rerender quando a instância muda) é a solução mais segura para esse padrão.

---

### WidgetOrphanFallback

`src/app/core/dashboard/components/widget-orphan-fallback/widget-orphan-fallback.component.ts`

Renderizado pelo `WidgetHostComponent` quando `widgetTypeId` não existe no registry. Isso pode acontecer se:

- Um widget foi removido do código mas ainda existe em dashboards salvos
- O widget foi renomeado sem migração de dados
- O bundle do widget falhou ao carregar

O fallback exibe o `widgetTypeId` desconhecido e orienta o usuário a remover o widget, sem quebrar o dashboard inteiro.

---

## Gerenciamento de estado

### Modelos de dados

```typescript
// O dashboard como um todo
interface Dashboard {
  id: string;
  name: string;
  widgets: DashboardWidgetInstance[];
}

// Uma instância concreta de um widget no grid
interface DashboardWidgetInstance {
  id: string;           // UUID da instância (uma mesma definição pode ter N instâncias)
  widgetTypeId: string; // referência à WidgetDefinition.id
  x: number;            // posição na grade (coluna)
  y: number;            // posição na grade (linha)
  cols: number;         // largura em colunas
  rows: number;         // altura em linhas
  config?: Record<string, unknown>; // configurações específicas desta instância
}
```

`id` e `widgetTypeId` são intencionalmente separados: você pode ter 3 instâncias de `metric-card` no mesmo dashboard, cada uma com `widgetTypeId: 'metric-card'` mas IDs e configs diferentes.

---

### DashboardStateService

`src/app/core/dashboard/services/dashboard-state.service.ts`

É a **única porta de entrada e saída** do estado do dashboard. Nenhum componente manipula o estado diretamente.

```typescript
@Injectable({ providedIn: 'root' })
export class DashboardStateService {
  // Sinais públicos (readonly) — componentes lêem, nunca escrevem
  readonly dashboard     = /* signal<Dashboard> */
  readonly widgets       = /* computed(() => state().widgets) */
  readonly layoutVersion = /* signal<number> */

  // Mutações — único caminho para alterar o estado
  addWidget(definition: WidgetDefinition): void
  removeWidget(instanceId: string): void
  updateLayout(updates: LayoutUpdate[]): void
  updateWidgetConfig(instanceId: string, config: Record<string, unknown>): void
  resetLayout(): void

  // FUTURAMENTE: persistência entra apenas aqui (ver seção correspondente)
}
```

O estado inicial é um objeto JavaScript (`INITIAL_DASHBOARD`) hardcoded no service — sem chamada HTTP, sem `localStorage`. O `structuredClone()` garante que `resetLayout()` sempre produza uma cópia independente, sem referências compartilhadas.

---

### Estratégia anti-loop com layoutVersion

O maior desafio ao integrar signals com gridster é o seguinte ciclo potencial:

```
1. Usuário arrasta widget → gridster muta item.x, item.y in-place
2. itemChangeCallback → stateService.updateLayout()
3. state signal atualiza → effect() detecta mudança
4. effect() reconstrói gridItems[] → gridster re-renderiza
5. volta ao passo 1 (loop infinito)
```

A solução é o sinal `_layoutVersion`:

```
updateLayout()      → NÃO incrementa layoutVersion
                    → apenas persiste posições no signal de estado

addWidget()         → INCREMENTA layoutVersion
removeWidget()      → INCREMENTA layoutVersion
resetLayout()       → INCREMENTA layoutVersion
```

O `effect()` no `DashboardShellComponent` rastreia **apenas** `layoutVersion`, usando `untracked()` para ler `widgets()` sem criar dependência reativa nela:

```typescript
effect(() => {
  const _version = this.stateService.layoutVersion(); // rastreado
  const stateWidgets = untracked(() => this.stateService.widgets()); // NÃO rastreado
  this.gridItems = stateWidgets.map(w => ({ ...w }));
});
```

Resultado: drag/resize não dispara rebuild do array. Apenas add/remove/reset disparam.

---

## Integração com angular-gridster2

**angular-gridster2 v22 mudou a API em relação a versões anteriores:**

| Aspecto | Versões antigas | v22 |
|---|---|---|
| Importação | `GridsterModule` | `Gridster`, `GridsterItem` (componentes standalone) |
| Tipo do item | `GridsterItem` (interface) | `GridsterItemConfig` (interface) |
| Classe componente | n/a | `GridsterItem` |
| CSS externo | `gridster2.css` | Inline nos componentes (nenhum arquivo externo) |
| Callbacks | em `GridsterConfig` | ainda presentes em `GridsterConfig` |

O `DashboardWidgetInstance` é estruturalmente compatível com `GridsterItemConfig` — ambos têm `x, y, cols, rows` como números, e `GridsterItemConfig` tem `[propName: string]: any` que absorve os campos extras (`id`, `widgetTypeId`, `config`).

O gridster **muta os objetos in-place** durante drag e resize — é assim que ele funciona internamente. Por isso o `gridItems` no shell é um array local (não um signal), e as posições atualizadas são sincronizadas de volta ao `DashboardStateService` via `itemChangeCallback`.

---

## UX de edição

O modo de edição é um signal booleano local no `DashboardShellComponent`:

```
isEditMode = false  →  grid somente leitura, catálogo oculto
isEditMode = true   →  drag e resize habilitados, catálogo visível,
                        botões de config/remoção visíveis por widget
```

Quando `isEditMode` muda, um `effect()` no shell cria um novo objeto `gridsterOptions` com `draggable.enabled` e `resizable.enabled` atualizados. O gridster detecta a mudança via seu input signal e reconfigura.

O botão de remoção e o de configuração usam `(mousedown)="$event.stopPropagation()"` para impedir que o clique nesses botões inicie uma operação de drag no gridster.

O **modal de configuração** é renderizado no nível do shell (não dentro do gridster-item) para evitar problemas de `overflow: hidden` e `z-index`. Ele recebe apenas o `instanceId` — todos os dados do widget (definição, schema, config atual) são lidos pelo próprio modal via os serviços.

---

## Widgets de exemplo

### Card de Métrica (`metric-card`)

Exibe um valor numérico grande com label, variação percentual e cor de destaque configurável.

**Config:**
```typescript
{
  label: string;    // 'Total de ISINs'
  value: number;    // 14823
  trend?: string;   // '+5.2%' → detecta sinal para colorir verde/vermelho
  unit?: string;    // 'BRL', '%', etc.
  color?: 'teal' | 'amber' | 'navy' | 'success' | 'danger';
}
```

**Como a cor funciona:** a cor é uma CSS custom property `--accent-color` aplicada via classe. O componente não usa lógica de negócio para colorir — apenas adiciona a classe `color-teal`, `color-amber`, etc., e o SCSS faz o resto via `&.color-teal { --accent-color: var(--color-teal); }`.

### Lista de ISINs (`items-list`)

Tabela com dados mockados de ISINs da B3, com badges coloridos por status (Novo / Alterado / Cancelado).

**Config:**
```typescript
{
  title?:    string;  // 'ISINs Recentes'
  maxItems?: number;  // 5 (fatia do array de mock)
}
```

Os dados são hardcoded no componente (`MOCK_DATA`). Em produção, seriam substituídos por uma chamada ao serviço de negócio do módulo dono desse widget — sem alterar o core do dashboard.

---

## Como criar um novo widget

Siga estes 3 passos. **Nenhum arquivo do core ou do dashboard precisa ser alterado.**

### Passo 1 — Criar o componente Angular

O componente deve ser standalone e aceitar exatamente dois inputs com esses nomes:

```typescript
// src/app/widgets/meu-widget/meu-widget.component.ts
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface MeuWidgetConfig {
  titulo: string;
  limite: number;
}

@Component({
  selector: 'app-meu-widget',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="meu-widget">
      <h3>{{ cfg().titulo }}</h3>
      <p>Limite: {{ cfg().limite }}</p>
    </div>
  `,
})
export class MeuWidgetComponent {
  // 'config' é obrigatório — recebe o objeto config da instância no dashboard
  readonly config = input<MeuWidgetConfig>({ titulo: 'Meu Widget', limite: 10 });

  // 'instanceId' é obrigatório — ID único da instância (útil para salvar estado local)
  readonly instanceId = input<string>('');

  protected cfg = computed(() => this.config() as MeuWidgetConfig);
}
```

**Regras:**
- O nome dos inputs deve ser exatamente `config` e `instanceId` — o `WidgetHostComponent` usa `ref.setInput('config', ...)` e `ref.setInput('instanceId', ...)`.
- Use `ChangeDetectionStrategy.OnPush` — o dashboard inteiro é OnPush.
- O componente não deve conhecer o `DashboardStateService` nem o `WidgetRegistryService`.

---

### Passo 2 — Criar o arquivo de definição

```typescript
// src/app/widgets/meu-widget/meu-widget.widget-definition.ts
import { WidgetDefinition } from '../../core/dashboard/models/widget-definition.model';

export const meuWidgetDefinition: WidgetDefinition = {
  // ID globalmente único — evite nomes genéricos como 'chart'
  // Prefixe com o domínio/módulo: 'financas-grafico-barras'
  id: 'meu-widget',

  name: 'Meu Widget',
  icon: 'star',  // qualquer nome do Material Icons: https://fonts.google.com/icons

  defaultSize: { cols: 4, rows: 3 },  // tamanho ao adicionar ao dashboard
  minSize:     { cols: 2, rows: 2 },  // gridster impede redimensionar abaixo disso

  // Lazy import — o bundle só é carregado quando o widget for renderizado
  component: () =>
    import('./meu-widget.component').then(m => m.MeuWidgetComponent),

  // configSchema é opcional.
  // Se omitido, o modal de configuração exibe "Widget sem configurações".
  // Se presente, gera um formulário automaticamente.
  configSchema: [
    {
      key:          'titulo',
      label:        'Título',
      type:         'text',
      defaultValue: 'Meu Widget',
    },
    {
      key:          'limite',
      label:        'Limite de itens',
      type:         'number',
      defaultValue: 10,
    },
    {
      key:   'modo',
      label: 'Modo de exibição',
      type:  'select',
      defaultValue: 'compacto',
      options: [
        { value: 'compacto',  label: 'Compacto' },
        { value: 'detalhado', label: 'Detalhado' },
      ],
    },
  ],
};
```

---

### Passo 3 — Registrar em `app.config.ts`

```typescript
// src/app/app.config.ts
import { meuWidgetDefinition } from './widgets/meu-widget/meu-widget.widget-definition';

export const appConfig: ApplicationConfig = {
  providers: [
    // providers existentes...
    { provide: WIDGET_REGISTRY, useValue: meuWidgetDefinition, multi: true },
  ],
};
```

Pronto. O widget aparece imediatamente no catálogo lateral ao entrar em modo de edição.

---

### Variação: registro via Route.providers (módulos de feature)

Em projetos maiores, cada módulo de feature pode registrar seus widgets sem tocar em `app.config.ts`:

```typescript
// src/app/features/financas/financas.routes.ts
export const financasRoutes: Routes = [
  {
    path: 'financas',
    component: FinancasDashboardComponent,
    providers: [
      { provide: WIDGET_REGISTRY, useValue: graficoBolsaDefinition,  multi: true },
      { provide: WIDGET_REGISTRY, useValue: indicadoresDefinition,   multi: true },
    ],
  },
];
```

Os widgets ficam disponíveis apenas quando a rota do módulo está ativa. Isso mantém os bundles separados e o dashboard principal sem acoplamento.

---

### Resumo do fluxo completo ao criar um widget

```
src/app/widgets/meu-widget/
├── meu-widget.component.ts          ← lógica e template do widget
├── meu-widget.component.html        ← (opcional, se template for externo)
├── meu-widget.component.scss        ← estilos escopados
└── meu-widget.widget-definition.ts  ← metadados + lazy import

src/app/app.config.ts                ← 1 linha adicionada: provide WIDGET_REGISTRY
```

---

## Como plugar persistência

Toda a lógica de estado vive em `DashboardStateService`. Os componentes não fazem chamadas ao backend — eles apenas lêem signals e chamam métodos do service.

Quando um backend estiver disponível, **adicione apenas estes métodos** ao `DashboardStateService`, sem alterar nenhum componente:

```typescript
// src/app/core/dashboard/services/dashboard-state.service.ts

// Injete seu serviço HTTP aqui:
private readonly http = inject(HttpClient);

/**
 * Carrega um dashboard do backend e substitui o estado em memória.
 * Chame na inicialização da rota ou num botão "Carregar".
 */
async load(dashboardId: string): Promise<void> {
  const data = await firstValueFrom(
    this.http.get<Dashboard>(`/api/dashboards/${dashboardId}`)
  );
  this._state.set(data);
  this._layoutVersion.update(v => v + 1); // força rebuild do grid
}

/**
 * Persiste o estado atual no backend.
 * Chame no botão "Salvar" ou ao sair do modo de edição.
 */
async save(): Promise<void> {
  const snapshot = this._state();
  await firstValueFrom(
    this.http.put(`/api/dashboards/${snapshot.id}`, snapshot)
  );
}
```

**Por que nenhum componente muda?**

Todos os componentes consomem `stateService.widgets()` e `stateService.layoutVersion()` — signals que continuam existindo e funcionando da mesma forma. O `load()` chama `this._state.set(data)`, que dispara os mesmos signals, que atualizam os mesmos componentes. A camada de UI é completamente agnóstica à origem dos dados.

**Estratégias de auto-save:**

```typescript
// Opção A: salvar ao sair do modo de edição (no DashboardShellComponent)
protected async toggleEditMode(): Promise<void> {
  if (this.isEditMode()) {
    await this.stateService.save(); // salva ao concluir edição
  }
  this.isEditMode.update(v => !v);
}

// Opção B: auto-save com debounce (no DashboardStateService)
constructor() {
  effect(() => {
    this._state(); // rastreia qualquer mudança
    this.scheduleSave();
  });
}

private saveTimer?: ReturnType<typeof setTimeout>;
private scheduleSave(): void {
  clearTimeout(this.saveTimer);
  this.saveTimer = setTimeout(() => void this.save(), 2000);
}
```

**localStorage como passo intermediário:**

```typescript
// Persistência local sem backend — adicionar ao DashboardStateService

private readonly STORAGE_KEY = 'dashboard-state';

save(): void {
  localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._state()));
}

load(): void {
  const raw = localStorage.getItem(this.STORAGE_KEY);
  if (raw) {
    this._state.set(JSON.parse(raw));
    this._layoutVersion.update(v => v + 1);
  }
}
```

---

## Estrutura de pastas

```
src/
├── app/
│   ├── core/
│   │   └── dashboard/                      ← motor do dashboard
│   │       ├── models/
│   │       │   ├── dashboard.model.ts       ← Dashboard + DashboardWidgetInstance
│   │       │   └── widget-definition.model.ts  ← WidgetDefinition + ConfigSchema
│   │       │
│   │       ├── tokens/
│   │       │   └── widget-registry.token.ts ← InjectionToken (multi-provider)
│   │       │
│   │       ├── services/
│   │       │   ├── widget-registry.service.ts  ← getAll() / getById()
│   │       │   └── dashboard-state.service.ts  ← estado + porta de persistência
│   │       │
│   │       └── components/
│   │           ├── dashboard-shell/         ← orquestra o grid e o modo edição
│   │           ├── widget-catalog/          ← painel lateral com widgets disponíveis
│   │           ├── widget-config-modal/     ← formulário gerado por configSchema
│   │           ├── widget-host/             ← cria componentes dinamicamente via VCR
│   │           └── widget-orphan-fallback/  ← exibido para widgetTypeId desconhecido
│   │
│   ├── widgets/                             ← widgets concretos (desacoplados do core)
│   │   ├── metric-card/
│   │   │   ├── metric-card.component.ts
│   │   │   ├── metric-card.component.html
│   │   │   ├── metric-card.component.scss
│   │   │   └── metric-card.widget-definition.ts  ← definição + lazy import
│   │   └── items-list/
│   │       ├── items-list.component.ts
│   │       ├── items-list.component.html
│   │       ├── items-list.component.scss
│   │       └── items-list.widget-definition.ts
│   │
│   ├── app.component.ts     ← header global + app-dashboard-shell
│   ├── app.component.html
│   ├── app.component.scss
│   └── app.config.ts        ← providers + WIDGET_REGISTRY registrations
│
├── styles.scss              ← design system (CSS custom properties + utilitários)
├── main.ts
└── index.html
```

---

## Design system

O design é inspirado na Área do Gestor da B3 e implementado via CSS custom properties em `src/styles.scss`:

```scss
:root {
  /* Paleta principal */
  --color-navy:    #152742;  /* header, sidebar do catálogo, cabeçalho de tabela */
  --color-teal:    #009dbd;  /* accent, botões secundários, bordas em modo edição */
  --color-amber:   #f0b429;  /* botão primário (Pesquisar / Salvar) */

  /* Superfícies */
  --color-bg:      #eef1f6;  /* fundo da página */
  --color-surface: #ffffff;  /* cards, modais, painel de filtros */

  /* Tipografia */
  --color-text-primary: #1a2a44;
  --color-text-sec:     #5a6572;
  --color-text-muted:   #8c9bac;

  /* Bordas e sombras */
  --color-border:    #dce3ec;
  --shadow-md:       0 4px 8px rgba(0,0,0,.08), 0 2px 4px rgba(0,0,0,.06);
}
```

**Componentes globais:** `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-danger`, `.btn-sm` — definidos no `styles.scss` e reutilizados em todos os componentes sem duplicação.

**Encapsulamento:** todos os componentes usam o encapsulamento padrão do Angular (emulated). Estilos de componente ficam em `.scss` co-localizados. Apenas utilitários verdadeiramente globais (botões, scrollbar, gridster overrides) ficam no `styles.scss` raiz.
