import type { TipoUsuario, Usuario } from '../../entidades/Usuario.js';

export type CriarUsuarioEntrada = {
  nome?: unknown;
  email?: unknown;
  telefone?: unknown;
  tipo?: unknown;
  recebeNotificacoes?: unknown;
};

export type AtualizarUsuarioEntrada = Partial<CriarUsuarioEntrada> & {
  ativo?: unknown;
};

export type ListarUsuariosFiltros = {
  tipo?: TipoUsuario;
};

export type UsuarioNormalizado = {
  nome: string;
  email: string;
  telefone: string | null;
  tipo: TipoUsuario;
  recebeNotificacoes: boolean;
  ativo: boolean;
};

export interface UsuariosServicoContrato {
  listar(filtros?: ListarUsuariosFiltros): Promise<Usuario[]>;
  buscarPorId(id: string): Promise<Usuario>;
  criar(entrada: CriarUsuarioEntrada): Promise<Usuario>;
  atualizar(id: string, entrada: AtualizarUsuarioEntrada): Promise<Usuario>;
  remover(id: string): Promise<void>;
}
