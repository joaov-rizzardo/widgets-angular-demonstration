import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';

export interface EventosCorporativosConfig {
  title?: string;
}

interface EventoRow {
  ticker: string;
  isin: string;
  empresa: string;
  tipoEvento: string;
  razaoSocial: string;
  segmento: string;
  deliberadoEm: string;
  dataCom: string;
  valorPercentual: string;
  inicioPagamento: string;
  lotePadrao: number;
}

interface DateTab {
  dateKey: string;
  label: string;
  dayName: string;
}

type EventsByDate = Record<string, EventoRow[]>;

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toBR(key: string): string {
  const [y, m, d] = key.split('-');
  return `${d}/${m}/${y}`;
}

function buildMockEvents(): EventsByDate {
  const today = new Date();

  const off = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - n);
    return toDateKey(d);
  };

  return {
    [off(0)]: [
      { ticker: 'PETR4', isin: 'BRPETR4ACNPR8', empresa: 'PETR4', tipoEvento: 'DIVIDENDO',    razaoSocial: 'Petróleo Brasileiro SA', segmento: 'Petróleo',  deliberadoEm: toBR(off(3)),  dataCom: toBR(off(0)), valorPercentual: 'R$ 1,25',      inicioPagamento: '28/07/2026', lotePadrao: 100 },
      { ticker: 'VALE3', isin: 'BRVALE3ACNOR8', empresa: 'VALE3', tipoEvento: 'JSCP',         razaoSocial: 'Vale SA',                segmento: 'Mineração', deliberadoEm: toBR(off(5)),  dataCom: toBR(off(0)), valorPercentual: 'R$ 0,89',      inicioPagamento: '15/07/2026', lotePadrao: 100 },
      { ticker: 'ITUB4', isin: 'BRITUB4ACNPR7', empresa: 'ITUB4', tipoEvento: 'DIVIDENDO',    razaoSocial: 'Itaú Unibanco SA',       segmento: 'Bancário',  deliberadoEm: toBR(off(4)),  dataCom: toBR(off(0)), valorPercentual: 'R$ 0,45',      inicioPagamento: '10/07/2026', lotePadrao: 100 },
    ],
    [off(1)]: [
      { ticker: 'BBAS3', isin: 'BRBBASACNOR2',  empresa: 'BBAS3', tipoEvento: 'JSCP',         razaoSocial: 'Banco do Brasil SA',     segmento: 'Bancário',  deliberadoEm: toBR(off(6)),  dataCom: toBR(off(1)), valorPercentual: 'R$ 0,62',      inicioPagamento: '20/07/2026', lotePadrao: 100 },
      { ticker: 'WEGE3', isin: 'BRWEGE3ACNOR2', empresa: 'WEGE3', tipoEvento: 'DIVIDENDO',    razaoSocial: 'WEG SA',                 segmento: 'Indústria', deliberadoEm: toBR(off(8)),  dataCom: toBR(off(1)), valorPercentual: 'R$ 0,11',      inicioPagamento: '21/07/2026', lotePadrao: 100 },
    ],
    [off(2)]: [
      { ticker: 'CMIG4', isin: 'BRCMIGACNPR8',  empresa: 'CMIG4', tipoEvento: 'BONIFICAÇÃO',  razaoSocial: 'Cemig SA',               segmento: 'Energia',   deliberadoEm: toBR(off(10)), dataCom: toBR(off(2)), valorPercentual: '(%) 10,0000',  inicioPagamento: 'Não se aplica', lotePadrao: 100 },
    ],
    [off(4)]: [
      { ticker: 'ARML3',  isin: 'BRARMLACNOR1', empresa: 'ARML',   tipoEvento: 'ATUALIZ. COD. NEG.', razaoSocial: '', segmento: '', deliberadoEm: toBR(off(9)), dataCom: '31/12/9999', valorPercentual: '(%) 100,0000', inicioPagamento: 'Não se aplica', lotePadrao: 100 },
      { ticker: 'ARML3',  isin: 'BRARMLACNOR1', empresa: 'ARML',   tipoEvento: 'ATUALIZ. COD. NEG.', razaoSocial: '', segmento: '', deliberadoEm: toBR(off(9)), dataCom: '09/01/2026', valorPercentual: '(%) 100,0000', inicioPagamento: 'Não se aplica', lotePadrao: 100 },
      { ticker: 'INBR32', isin: 'BRINBRBDR007', empresa: 'INBR',   tipoEvento: 'ATUALIZ. COD. NEG.', razaoSocial: '', segmento: '', deliberadoEm: toBR(off(9)), dataCom: '31/12/9999', valorPercentual: '(%) 100,0000', inicioPagamento: 'Não se aplica', lotePadrao: 100 },
      { ticker: 'LELO3',  isin: 'BRLELOACNOR2', empresa: 'LELO3',  tipoEvento: 'ATUALIZ. COD. NEG.', razaoSocial: '', segmento: '', deliberadoEm: toBR(off(9)), dataCom: '31/12/9999', valorPercentual: '(%) 100,0000', inicioPagamento: 'Não se aplica', lotePadrao: 100 },
      { ticker: 'NVDC34', isin: 'BRNVDCBDR008', empresa: 'NVDC34', tipoEvento: 'ATUALIZ. COD. NEG.', razaoSocial: '', segmento: '', deliberadoEm: toBR(off(9)), dataCom: '31/12/9999', valorPercentual: '(%) 100,0000', inicioPagamento: 'Não se aplica', lotePadrao: 1   },
    ],
    [off(5)]: [
      { ticker: 'BRFS3', isin: 'BRBRFSACNOR6',  empresa: 'BRFS3', tipoEvento: 'DIVIDENDO',    razaoSocial: 'BRF SA',                 segmento: 'Alimentos', deliberadoEm: toBR(off(10)), dataCom: toBR(off(5)), valorPercentual: 'R$ 0,31',      inicioPagamento: '01/08/2026', lotePadrao: 100 },
      { ticker: 'BBDC4', isin: 'BRBBDCACNPR8',  empresa: 'BBDC4', tipoEvento: 'JSCP',         razaoSocial: 'Bradesco SA',            segmento: 'Bancário',  deliberadoEm: toBR(off(12)), dataCom: toBR(off(5)), valorPercentual: 'R$ 0,19',      inicioPagamento: '05/08/2026', lotePadrao: 100 },
      { ticker: 'ELET3', isin: 'BRELET3ACNOR1', empresa: 'ELET3', tipoEvento: 'SUBSCRIÇÃO',   razaoSocial: 'Eletrobras SA',          segmento: 'Energia',   deliberadoEm: toBR(off(11)), dataCom: toBR(off(5)), valorPercentual: 'R$ 12,50',     inicioPagamento: '15/08/2026', lotePadrao: 100 },
    ],
    [off(6)]: [
      { ticker: 'MGLU3', isin: 'BRMGLU3ACNOR2', empresa: 'MGLU3', tipoEvento: 'GRUPAMENTO',   razaoSocial: 'Magazine Luiza SA',      segmento: 'Varejo',    deliberadoEm: toBR(off(15)), dataCom: toBR(off(6)), valorPercentual: '(%) 50,0000',  inicioPagamento: 'Não se aplica', lotePadrao: 100 },
    ],
  };
}

@Component({
  selector: 'app-eventos-corporativos',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './eventos-corporativos.component.html',
  styleUrl: './eventos-corporativos.component.scss',
})
export class EventosCorporativosComponent {
  readonly config     = input<EventosCorporativosConfig>({});
  readonly instanceId = input<string>('');

  private readonly mockEvents: EventsByDate = buildMockEvents();

  protected readonly dateTabs: DateTab[] = this.buildDateTabs();
  protected readonly selectedDate = signal(this.dateTabs[0]?.dateKey ?? '');

  protected readonly currentEvents = computed<EventoRow[]>(() =>
    this.mockEvents[this.selectedDate()] ?? [],
  );

  protected readonly totalCount = computed(() =>
    Object.values(this.mockEvents).reduce((acc, arr) => acc + arr.length, 0),
  );

  private buildDateTabs(): DateTab[] {
    const dayNames = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = toDateKey(d);
      return {
        dateKey: key,
        label: `${key.slice(8)}/${key.slice(5, 7)}`,
        dayName: dayNames[d.getDay()],
      };
    });
  }
}
