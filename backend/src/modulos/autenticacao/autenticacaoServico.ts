import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import type { Repository } from 'typeorm';

import { AppDataSource } from '../../config/data-source.js';
import { env } from '../../config/env.js';
import { Usuario } from '../../entidades/Usuario.js';
import { ErroHttp } from '../../erros/ErroHttp.js';
import { compararSenha } from './senhas.js';
import type {
  AutenticacaoServicoContrato,
  LoginEntrada,
  LoginResposta,
  TokenPayload,
  UsuarioToken
} from './autenticacaoTipos.js';

const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class AutenticacaoServico implements AutenticacaoServicoContrato {
  constructor(private readonly usuariosRepositorio: Repository<Usuario>) {}

  public async login(entrada: LoginEntrada): Promise<LoginResposta> {
    const email = this.validarEmail(entrada.email);
    const senha = this.validarSenhaLogin(entrada.senha);
    const usuario = await this.usuariosRepositorio.findOne({
      where: { email, ativo: true }
    });

    if (!usuario?.senhaHash) {
      throw new ErroHttp(401, 'Email ou senha invalidos');
    }

    const senhaCorreta = await compararSenha(senha, usuario.senhaHash);

    if (!senhaCorreta) {
      throw new ErroHttp(401, 'Email ou senha invalidos');
    }

    return this.gerarToken(usuario);
  }

  public gerarToken(usuario: Usuario): LoginResposta {
    const payload: TokenPayload = {
      sub: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      tipo: usuario.tipo
    };
    const expiracao = env.jwtExpiracao as NonNullable<SignOptions['expiresIn']>;
    const opcoesToken: SignOptions = { expiresIn: expiracao };
    const token = jwt.sign(payload, env.jwtSegredo, opcoesToken);

    return {
      token,
      tipoToken: 'Bearer',
      expiraEm: env.jwtExpiracao,
      usuario: this.mapearUsuario(usuario)
    };
  }

  private mapearUsuario(usuario: Usuario): UsuarioToken {
    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      tipo: usuario.tipo
    };
  }

  private validarEmail(valor: unknown): string {
    if (typeof valor !== 'string') {
      throw new ErroHttp(400, 'Campo email e obrigatorio');
    }

    const email = valor.trim().toLowerCase();

    if (!regexEmail.test(email)) {
      throw new ErroHttp(400, 'Campo email deve ser um email valido');
    }

    return email;
  }

  private validarSenhaLogin(valor: unknown): string {
    if (typeof valor !== 'string' || !valor) {
      throw new ErroHttp(400, 'Campo senha e obrigatorio');
    }

    return valor;
  }
}

export function criarAutenticacaoServico(): AutenticacaoServico {
  return new AutenticacaoServico(AppDataSource.getRepository(Usuario));
}
