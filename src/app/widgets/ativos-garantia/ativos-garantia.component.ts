import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';

export interface AtivosGarantiaConfig {
  title?: string;
}

interface AtivoRow {
  ticker: string;
  categoria: string;
  isin: string;
  limite: number;
}

const MOCK_DATA: AtivoRow[] = [
  { ticker: 'A1MD34',    categoria: 'BDR',      isin: 'BRA1MDBDR002',   limite: 2050000   },
  { ticker: 'ABEV3 BZ',  categoria: 'ADR',      isin: 'US02319V1035',   limite: 1100000   },
  { ticker: 'AGRO3',     categoria: 'Ação',      isin: 'BRAGROACNOR7',   limite: 110000000 },
  { ticker: 'AGRO3 BZ',  categoria: 'ADR',      isin: 'US10554B1044',   limite: 3000      },
  { ticker: 'ALLD3',     categoria: 'Ação',      isin: 'BRALLDACNOR3',   limite: 10000000  },
  { ticker: 'ALOS3',     categoria: 'Ação',      isin: 'BRALOSACNOR5',   limite: 999999    },
  { ticker: 'ALUP11',    categoria: 'Ação',      isin: 'BRALUPCDAM15',   limite: 100000    },
  { ticker: 'AMZO34',    categoria: 'BDR',       isin: 'BRAMZO34D009',   limite: 500000    },
  { ticker: 'BBAS3',     categoria: 'Ação',      isin: 'BRBBASACNOR2',   limite: 45000000  },
  { ticker: 'BBDC4',     categoria: 'Ação',      isin: 'BRBBDCACNPR8',   limite: 30000000  },
  { ticker: 'BBSE3',     categoria: 'Ação',      isin: 'BRBBSEACNOR6',   limite: 5000000   },
  { ticker: 'BMGB4',     categoria: 'Ação',      isin: 'BRBMGBACNPR4',   limite: 8000000   },
  { ticker: 'BPAN4',     categoria: 'Ação',      isin: 'BRBPANACNPR7',   limite: 12000000  },
  { ticker: 'BRFS3',     categoria: 'Ação',      isin: 'BRBRFSACNOR6',   limite: 25000000  },
  { ticker: 'CMIG4',     categoria: 'Ação',      isin: 'BRCMIGACNPR8',   limite: 40000000  },
  { ticker: 'DEFI11',    categoria: 'Fundos',    isin: 'BRDEFI11FND2',   limite: 2500000   },
  { ticker: 'FIIM11',    categoria: 'Fundos',    isin: 'BRFIIM11FND4',   limite: 1800000   },
  { ticker: 'GOGL34',    categoria: 'ADR',       isin: 'BRGOGL34D002',   limite: 750000    },
  { ticker: 'HASH11',    categoria: 'Fundos',    isin: 'BRHASH11FND1',   limite: 900000    },
  { ticker: 'IVVB11',    categoria: 'Fundos',    isin: 'BRIVVB11FND3',   limite: 3200000   },
  { ticker: 'KORE3',     categoria: 'Debênture', isin: 'BRKORE3DEB001',  limite: 150000    },
  { ticker: 'MRVE3',     categoria: 'Ação',      isin: 'BRMRVE3ACNOR6',  limite: 15000000  },
  { ticker: 'MXRF11',    categoria: 'Unit',      isin: 'BRMXRF11UNT1',   limite: 4500000   },
  { ticker: 'PETR4',     categoria: 'Ação',      isin: 'BRPETR4ACNPR8',  limite: 120000000 },
  { ticker: 'USIM5',     categoria: 'Ação',      isin: 'BRUSIM5ACNPR3',  limite: 7000000   },
  { ticker: 'VALE3',     categoria: 'Ação',      isin: 'BRVALE3ACNOR8',  limite: 90000000  },
];

@Component({
  selector: 'app-ativos-garantia',
  standalone: true,
  imports: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ativos-garantia.component.html',
  styleUrl: './ativos-garantia.component.scss',
})
export class AtivosGarantiaComponent {
  readonly config     = input<AtivosGarantiaConfig>({});
  readonly instanceId = input<string>('');

  protected readonly searchTerm     = signal('');
  protected readonly activeCategory = signal('');

  protected readonly categoryFilters = computed(() => {
    const counts: Record<string, number> = {};
    MOCK_DATA.forEach(r => { counts[r.categoria] = (counts[r.categoria] ?? 0) + 1; });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  });

  protected readonly filteredRows = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const cat  = this.activeCategory();
    return MOCK_DATA.filter(r => {
      const matchTerm = !term || r.ticker.toLowerCase().includes(term) || r.isin.toLowerCase().includes(term);
      const matchCat  = !cat  || r.categoria === cat;
      return matchTerm && matchCat;
    });
  });

  protected onSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  protected selectCategory(name: string): void {
    this.activeCategory.update(c => (c === name ? '' : name));
  }

  protected clearFilters(): void {
    this.searchTerm.set('');
    this.activeCategory.set('');
  }
}
