import type { Paciente } from '../../entidades/Paciente.js';
import type { PacienteResponsavel } from '../../entidades/PacienteResponsavel.js';

export type CriarPacienteEntrada = {
  usuarioId?: unknown;
  nome?: unknown;
  dataNascimento?: unknown;
  observacoes?: unknown;
};

export type AtualizarPacienteEntrada = Partial<CriarPacienteEntrada> & {
  ativo?: unknown;
};

export type VincularResponsavelEntrada = {
  responsavelId?: unknown;
  parentesco?: unknown;
  recebeNotificacoes?: unknown;
};

export type PacienteNormalizado = {
  usuarioId: string | null;
  nome: string;
  dataNascimento: string | null;
  observacoes: string | null;
  ativo: boolean;
};

export type VinculoResponsavelNormalizado = {
  pacienteId: string;
  responsavelId: string;
  parentesco: string | null;
  recebeNotificacoes: boolean;
  ativo: boolean;
};

export interface PacientesServicoContrato {
  listar(): Promise<Paciente[]>;
  buscarPorId(id: string): Promise<Paciente>;
  criar(entrada: CriarPacienteEntrada): Promise<Paciente>;
  atualizar(id: string, entrada: AtualizarPacienteEntrada): Promise<Paciente>;
  remover(id: string): Promise<void>;
  listarResponsaveis(pacienteId: string): Promise<PacienteResponsavel[]>;
  vincularResponsavel(
    pacienteId: string,
    entrada: VincularResponsavelEntrada
  ): Promise<PacienteResponsavel>;
  removerResponsavel(pacienteId: string, responsavelId: string): Promise<void>;
}
