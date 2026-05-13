import type { Compartimento, StatusCompartimento } from '../../entidades/Compartimento.js';
import type { Dispositivo } from '../../entidades/Dispositivo.js';

export type CriarDispositivoEntrada = {
  pacienteId?: unknown;
  nome?: unknown;
  identificador?: unknown;
  modelo?: unknown;
  ultimoSinalEm?: unknown;
};

export type AtualizarDispositivoEntrada = Partial<CriarDispositivoEntrada> & {
  ativo?: unknown;
};

export type CriarCompartimentoEntrada = {
  numero?: unknown;
  medicamentoId?: unknown;
  status?: unknown;
  observacoes?: unknown;
};

export type AtualizarCompartimentoEntrada = Partial<CriarCompartimentoEntrada> & {
  ativo?: unknown;
};

export type ListarDispositivosFiltros = {
  pacienteId?: string;
};

export type DispositivoNormalizado = {
  pacienteId: string;
  nome: string;
  identificador: string;
  modelo: string | null;
  ultimoSinalEm: Date | null;
  ativo: boolean;
};

export type CompartimentoNormalizado = {
  dispositivoId: string;
  numero: number;
  medicamentoId: string | null;
  status: StatusCompartimento;
  observacoes: string | null;
  ativo: boolean;
};

export interface DispositivosServicoContrato {
  listar(filtros?: ListarDispositivosFiltros): Promise<Dispositivo[]>;
  buscarPorId(id: string): Promise<Dispositivo>;
  criar(entrada: CriarDispositivoEntrada): Promise<Dispositivo>;
  atualizar(id: string, entrada: AtualizarDispositivoEntrada): Promise<Dispositivo>;
  remover(id: string): Promise<void>;
  listarCompartimentos(dispositivoId: string): Promise<Compartimento[]>;
  criarCompartimento(
    dispositivoId: string,
    entrada: CriarCompartimentoEntrada
  ): Promise<Compartimento>;
  atualizarCompartimento(
    dispositivoId: string,
    compartimentoId: string,
    entrada: AtualizarCompartimentoEntrada
  ): Promise<Compartimento>;
  removerCompartimento(
    dispositivoId: string,
    compartimentoId: string
  ): Promise<void>;
}
