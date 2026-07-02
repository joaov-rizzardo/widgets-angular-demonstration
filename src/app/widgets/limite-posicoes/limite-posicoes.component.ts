import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';

export interface LimitePosicoesConfig {
  title?: string;
}

type Natureza = 'COMPRADO' | 'VENDIDO';
type NivelAgregacao = 'AG1' | 'AG2' | 'AG3' | 'MERCADO';

interface LimiteRow {
  tipoLimite: string;
  ativoObjeto: string;
  vencimento: string;
  natureza: Natureza;
  nivelAgregacao: NivelAgregacao;
  limiteL1: number;
  limiteL2: number;
  freeFloat: number;
}

function buildListadoData(): LimiteRow[] {
  const tickers: { ticker: string; freeFloat: number }[] = [
    { ticker: 'ZCAS98', freeFloat: 0 },
    { ticker: 'ZAMP3',  freeFloat: 270582179 },
    { ticker: 'PETR4',  freeFloat: 8420150000 },
    { ticker: 'VALE3',  freeFloat: 4380920000 },
    { ticker: 'BBDC4',  freeFloat: 6120340000 },
  ];
  const naturezas: Natureza[] = ['COMPRADO', 'VENDIDO'];
  const niveis: NivelAgregacao[] = ['AG1', 'AG2', 'AG3', 'MERCADO'];

  const rows: LimiteRow[] = [];
  let seed = 1;
  for (const { ticker, freeFloat } of tickers) {
    for (const natureza of naturezas) {
      for (const nivel of niveis) {
        seed++;
        const base = nivel === 'MERCADO' ? 0 : (seed % 12 + 1) * 33000;
        rows.push({
          tipoLimite: seed % 5 === 0 ? 'OPÇÃO' : 'TERMO',
          ativoObjeto: ticker,
          vencimento: '-',
          natureza,
          nivelAgregacao: nivel,
          limiteL1: base,
          limiteL2: nivel === 'AG3' ? base * 27 : base,
          freeFloat,
        });
      }
    }
  }
  return rows;
}

function buildBalcaoData(): LimiteRow[] {
  const instrumentos: { ticker: string; tipo: string; freeFloat: number }[] = [
    { ticker: 'USD/BRL SWAP', tipo: 'SWAP',         freeFloat: 0 },
    { ticker: 'DI x PRE',     tipo: 'SWAP',         freeFloat: 0 },
    { ticker: 'PETR4 NDF',    tipo: 'TERMO BALCÃO', freeFloat: 8420150000 },
    { ticker: 'IBOV OPÇÃO',   tipo: 'OPÇÃO FLEX',   freeFloat: 0 },
    { ticker: 'VALE3 NDF',    tipo: 'TERMO BALCÃO', freeFloat: 4380920000 },
  ];
  const naturezas: Natureza[] = ['COMPRADO', 'VENDIDO'];
  const niveis: NivelAgregacao[] = ['AG1', 'AG2', 'MERCADO'];

  const rows: LimiteRow[] = [];
  let seed = 1;
  for (const { ticker, tipo, freeFloat } of instrumentos) {
    for (const natureza of naturezas) {
      for (const nivel of niveis) {
        seed++;
        const base = nivel === 'MERCADO' ? 0 : (seed % 9 + 1) * 150000;
        rows.push({
          tipoLimite: tipo,
          ativoObjeto: ticker,
          vencimento: nivel === 'MERCADO' ? '-' : '15/12/2026',
          natureza,
          nivelAgregacao: nivel,
          limiteL1: base,
          limiteL2: base,
          freeFloat,
        });
      }
    }
  }
  return rows;
}

const LISTADO_DATA = buildListadoData();
const BALCAO_DATA = buildBalcaoData();

type MarketTab = 'listado' | 'balcao';

@Component({
  selector: 'app-limite-posicoes',
  standalone: true,
  imports: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './limite-posicoes.component.html',
  styleUrl: './limite-posicoes.component.scss',
})
export class LimitePosicoesComponent {
  readonly config     = input<LimitePosicoesConfig>({});
  readonly instanceId = input<string>('');

  protected readonly activeMarket   = signal<MarketTab>('listado');
  protected readonly searchTerm     = signal('');
  protected readonly tipoFilter     = signal('');
  protected readonly naturezaFilter = signal('');
  protected readonly nivelFilter    = signal('');

  protected readonly listadoCount = LISTADO_DATA.length;
  protected readonly balcaoCount  = BALCAO_DATA.length;

  private readonly marketData = computed<LimiteRow[]>(() =>
    this.activeMarket() === 'listado' ? LISTADO_DATA : BALCAO_DATA,
  );

  protected readonly tipoOptions = computed(() =>
    Array.from(new Set(this.marketData().map(r => r.tipoLimite))).sort(),
  );

  protected readonly naturezaOptions = computed(() =>
    Array.from(new Set(this.marketData().map(r => r.natureza))).sort(),
  );

  protected readonly nivelOptions = computed(() =>
    Array.from(new Set(this.marketData().map(r => r.nivelAgregacao))).sort(),
  );

  protected readonly filteredRows = computed(() => {
    const term    = this.searchTerm().toLowerCase();
    const tipo    = this.tipoFilter();
    const natureza = this.naturezaFilter();
    const nivel   = this.nivelFilter();

    return this.marketData().filter(r => {
      const matchTerm     = !term || r.ativoObjeto.toLowerCase().includes(term);
      const matchTipo     = !tipo || r.tipoLimite === tipo;
      const matchNatureza = !natureza || r.natureza === natureza;
      const matchNivel    = !nivel || r.nivelAgregacao === nivel;
      return matchTerm && matchTipo && matchNatureza && matchNivel;
    });
  });

  protected readonly hasActiveFilters = computed(() =>
    !!(this.searchTerm() || this.tipoFilter() || this.naturezaFilter() || this.nivelFilter()),
  );

  protected selectMarket(tab: MarketTab): void {
    this.activeMarket.set(tab);
    this.clearFilters();
  }

  protected onSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  protected onTipoChange(event: Event): void {
    this.tipoFilter.set((event.target as HTMLSelectElement).value);
  }

  protected onNaturezaChange(event: Event): void {
    this.naturezaFilter.set((event.target as HTMLSelectElement).value);
  }

  protected onNivelChange(event: Event): void {
    this.nivelFilter.set((event.target as HTMLSelectElement).value);
  }

  protected clearFilters(): void {
    this.searchTerm.set('');
    this.tipoFilter.set('');
    this.naturezaFilter.set('');
    this.nivelFilter.set('');
  }
}
