import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

export interface ItemsListConfig {
  title?: string;
  maxItems?: number;
}

interface IsinRow {
  isin: string;
  emissor: string;
  cnpj: string;
  acao: string;
  codigo: string;
  data: string;
}

const MOCK_DATA: IsinRow[] = [
  { isin: 'BR0BRACTF007', emissor: 'SANTANDER PREV PB...', cnpj: '43.165.358/0001-87', acao: 'Novo',      codigo: 'CIOGBY', data: '10/06/2026' },
  { isin: 'BRA0M2CTF001', emissor: 'ARM CAPITAL PRECA...', cnpj: '55.241.106/0001-79', acao: 'Novo',      codigo: 'CMXXXY', data: '09/06/2026' },
  { isin: 'BRA100CTF004', emissor: 'ACORDO 100 FUNDO...', cnpj: '07.315.524/0001-10', acao: 'Alterado',  codigo: 'CMXXXS', data: '08/06/2026' },
  { isin: 'BRCBBACTF001', emissor: 'CAIXA PREV FUNDO...', cnpj: '21.304.951/0001-45', acao: 'Novo',      codigo: 'CIOGBY', data: '07/06/2026' },
  { isin: 'BRFINTCTF002', emissor: 'FINTECH CAPITAL...',  cnpj: '38.720.451/0001-22', acao: 'Alterado',  codigo: 'EMXXXX', data: '06/06/2026' },
  { isin: 'BRINOVCTF009', emissor: 'INOVA GESTORA...',    cnpj: '11.549.803/0001-67', acao: 'Novo',      codigo: 'CMXXXY', data: '05/06/2026' },
  { isin: 'BRTECHCTF012', emissor: 'TECH INVEST FDO...',  cnpj: '62.318.902/0001-44', acao: 'Cancelado', codigo: 'CIOGBY', data: '04/06/2026' },
  { isin: 'BRVERDCTF003', emissor: 'VERDE ASSET MGT...',  cnpj: '17.804.220/0001-99', acao: 'Novo',      codigo: 'EMXXXX', data: '03/06/2026' },
];

@Component({
  selector: 'app-items-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './items-list.component.html',
  styleUrl: './items-list.component.scss',
})
export class ItemsListComponent {
  readonly config     = input<ItemsListConfig>({});
  readonly instanceId = input<string>('');

  protected readonly title = computed(
    () => (this.config() as ItemsListConfig).title ?? 'Lista de ISINs',
  );

  protected readonly rows = computed(() => {
    const max = (this.config() as ItemsListConfig).maxItems ?? 5;
    return MOCK_DATA.slice(0, max);
  });
}
