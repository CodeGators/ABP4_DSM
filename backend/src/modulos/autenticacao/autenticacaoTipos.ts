import type { TipoUsuario, Usuario } from '../../entidades/Usuario.js';

export type LoginEntrada = {
  email?: unknown;
  senha?: unknown;
};

export type UsuarioToken = {
  id: string;
  nome: string;
  email: string;
  tipo: TipoUsuario;
};

export type TokenPayload = {
  sub: string;
  nome: string;
  email: string;
  tipo: TipoUsuario;
};

export type LoginResposta = {
  token: string;
  tipoToken: 'Bearer';
  expiraEm: string;
  usuario: UsuarioToken;
};

export interface AutenticacaoServicoContrato {
  login(entrada: LoginEntrada): Promise<LoginResposta>;
  gerarToken(usuario: Usuario): LoginResposta;
}
