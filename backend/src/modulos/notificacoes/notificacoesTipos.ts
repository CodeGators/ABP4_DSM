import type { StatusNotificacao, Notificacao } from '../../entidades/Notificacao.js';

export type ListarNotificacoesFiltros = {
  pacienteId?: string;
  responsavelId?: string;
  status?: StatusNotificacao;
};

export type VerificarAtrasosEntrada = {
  referenciaEm?: unknown;
};

export type ResultadoVerificacaoAtrasos = {
  referenciaEm: string;
  atrasosDetectados: number;
  eventosCriados: number;
  notificacoesCriadas: number;
};

export interface NotificacoesServicoContrato {
  listar(filtros?: ListarNotificacoesFiltros): Promise<Notificacao[]>;
  verificarAtrasos(
    entrada?: VerificarAtrasosEntrada
  ): Promise<ResultadoVerificacaoAtrasos>;
}
