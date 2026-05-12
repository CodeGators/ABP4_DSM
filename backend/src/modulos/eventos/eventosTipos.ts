import type {
  EventoMedicamento,
  OrigemEventoMedicamento,
  TipoEventoMedicamento
} from '../../entidades/EventoMedicamento.js';

export type CriarEventoEntrada = {
  medicamentoId?: unknown;
  agendamentoId?: unknown;
  dispositivoId?: unknown;
  tipo?: unknown;
  origem?: unknown;
  ocorridoEm?: unknown;
  descricao?: unknown;
  dados?: unknown;
};

export type ListarEventosFiltros = {
  medicamentoId?: string;
  agendamentoId?: string;
  dispositivoId?: string;
  tipo?: string;
  origem?: string;
};

export type EventoNormalizado = {
  medicamentoId: string | null;
  agendamentoId: string | null;
  dispositivoId: string | null;
  tipo: TipoEventoMedicamento;
  origem: OrigemEventoMedicamento;
  ocorridoEm: Date;
  descricao: string | null;
  dados: Record<string, unknown> | null;
};

export interface EventosServicoContrato {
  listar(filtros?: ListarEventosFiltros): Promise<EventoMedicamento[]>;
  buscarPorId(id: string): Promise<EventoMedicamento>;
  criar(entrada: CriarEventoEntrada): Promise<EventoMedicamento>;
}
