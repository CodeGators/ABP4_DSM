import type {
  AgendamentoMedicamento,
  TipoAgendamentoMedicamento
} from '../../entidades/AgendamentoMedicamento.js';

export type CriarAgendamentoEntrada = {
  medicamentoId?: unknown;
  tipo?: unknown;
  diasSemana?: unknown;
  horarios?: unknown;
  intervaloHoras?: unknown;
  horarioInicio?: unknown;
  inicioEm?: unknown;
  fimEm?: unknown;
  toleranciaMinutos?: unknown;
  cuidados?: unknown;
};

export type AtualizarAgendamentoEntrada = Partial<CriarAgendamentoEntrada> & {
  ativo?: unknown;
};

export type ListarAgendamentosFiltros = {
  medicamentoId?: string;
};

export type AgendamentoNormalizado = {
  medicamentoId: string;
  tipo: TipoAgendamentoMedicamento;
  diasSemana: number[];
  horarios: string[] | null;
  intervaloHoras: number | null;
  horarioInicio: string | null;
  inicioEm: string | null;
  fimEm: string | null;
  toleranciaMinutos: number;
  cuidados: string | null;
  ativo: boolean;
};

export interface AgendamentosServicoContrato {
  listar(filtros?: ListarAgendamentosFiltros): Promise<AgendamentoMedicamento[]>;
  buscarPorId(id: string): Promise<AgendamentoMedicamento>;
  criar(entrada: CriarAgendamentoEntrada): Promise<AgendamentoMedicamento>;
  atualizar(
    id: string,
    entrada: AtualizarAgendamentoEntrada
  ): Promise<AgendamentoMedicamento>;
  remover(id: string): Promise<void>;
}
