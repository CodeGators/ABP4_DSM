import type { Medicamento } from '../../entidades/Medicamento.js';

export type CriarMedicamentoEntrada = {
  nome?: unknown;
  dosagem?: unknown;
  observacoes?: unknown;
};

export type AtualizarMedicamentoEntrada = {
  nome?: unknown;
  dosagem?: unknown;
  observacoes?: unknown;
  ativo?: unknown;
};

export interface MedicamentosServicoContrato {
  listar(): Promise<Medicamento[]>;
  buscarPorId(id: string): Promise<Medicamento>;
  criar(entrada: CriarMedicamentoEntrada): Promise<Medicamento>;
  atualizar(id: string, entrada: AtualizarMedicamentoEntrada): Promise<Medicamento>;
  remover(id: string): Promise<void>;
}
