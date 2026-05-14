import type { FindOptionsWhere, Repository } from 'typeorm';

import { AppDataSource } from '../../config/data-source.js';
import { Usuario, type TipoUsuario } from '../../entidades/Usuario.js';
import { ErroHttp } from '../../erros/ErroHttp.js';
import { gerarHashSenha, validarSenha } from '../autenticacao/senhas.js';
import type {
  AtualizarUsuarioEntrada,
  CriarUsuarioEntrada,
  ListarUsuariosFiltros,
  UsuarioNormalizado,
  UsuariosServicoContrato
} from './usuariosTipos.js';

const tiposUsuario: TipoUsuario[] = ['paciente', 'responsavel', 'administrador'];
const tiposCadastroUsuario: TipoUsuario[] = ['responsavel', 'administrador'];
const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class UsuariosServico implements UsuariosServicoContrato {
  constructor(private readonly usuariosRepositorio: Repository<Usuario>) {}

  public async listar(
    filtros: ListarUsuariosFiltros = {}
  ): Promise<Usuario[]> {
    const where: FindOptionsWhere<Usuario> = { ativo: true };

    if (filtros.tipo) {
      where.tipo = filtros.tipo;
    }

    return this.usuariosRepositorio.find({
      where,
      order: { nome: 'ASC' }
    });
  }

  public async buscarPorId(id: string): Promise<Usuario> {
    const usuario = await this.usuariosRepositorio.findOne({
      where: { id, ativo: true }
    });

    if (!usuario) {
      throw new ErroHttp(404, 'Usuario nao encontrado');
    }

    return usuario;
  }

  public async criar(entrada: CriarUsuarioEntrada): Promise<Usuario> {
    const dados = await this.normalizarUsuario(entrada);
    await this.garantirEmailDisponivel(dados.email);

    const usuario = this.usuariosRepositorio.create(dados);

    return this.usuariosRepositorio.save(usuario);
  }

  public async atualizar(
    id: string,
    entrada: AtualizarUsuarioEntrada
  ): Promise<Usuario> {
    const usuario = await this.buscarPorId(id);
    const dados = await this.normalizarUsuario(entrada, usuario);

    if (dados.email !== usuario.email) {
      await this.garantirEmailDisponivel(dados.email, usuario.id);
    }

    Object.assign(usuario, dados);

    return this.usuariosRepositorio.save(usuario);
  }

  public async remover(id: string): Promise<void> {
    const usuario = await this.buscarPorId(id);
    usuario.ativo = false;

    await this.usuariosRepositorio.save(usuario);
  }

  private async normalizarUsuario(
    entrada: CriarUsuarioEntrada | AtualizarUsuarioEntrada,
    usuarioAtual?: Usuario
  ): Promise<UsuarioNormalizado> {
    return {
      nome: this.validarTextoObrigatorio(
        'nome',
        entrada.nome ?? usuarioAtual?.nome,
        120
      ),
      email: this.validarEmail(entrada.email ?? usuarioAtual?.email),
      telefone: this.validarTextoOpcional(
        'telefone',
        entrada.telefone ?? usuarioAtual?.telefone ?? null,
        30
      ),
      senhaHash: await this.normalizarSenha(entrada, usuarioAtual),
      tipo: this.validarTipo(entrada.tipo ?? usuarioAtual?.tipo),
      recebeNotificacoes: this.validarBooleano(
        'recebeNotificacoes',
        entrada.recebeNotificacoes ??
          usuarioAtual?.recebeNotificacoes ??
          false
      ),
      ativo: this.validarBooleano(
        'ativo',
        (entrada as AtualizarUsuarioEntrada).ativo ?? usuarioAtual?.ativo ?? true
      )
    };
  }

  private async normalizarSenha(
    entrada: CriarUsuarioEntrada | AtualizarUsuarioEntrada,
    usuarioAtual?: Usuario
  ): Promise<string | null> {
    if (entrada.senha === undefined || entrada.senha === null || entrada.senha === '') {
      return usuarioAtual?.senhaHash ?? null;
    }

    return gerarHashSenha(validarSenha(entrada.senha));
  }

  private async garantirEmailDisponivel(
    email: string,
    usuarioIdAtual?: string
  ): Promise<void> {
    const usuarioComEmail = await this.usuariosRepositorio.findOne({
      where: { email }
    });

    if (usuarioComEmail && usuarioComEmail.id !== usuarioIdAtual) {
      throw new ErroHttp(409, 'Email ja cadastrado');
    }
  }

  private validarEmail(valor: unknown): string {
    const email = this.validarTextoObrigatorio('email', valor, 160)
      .toLowerCase();

    if (!regexEmail.test(email)) {
      throw new ErroHttp(400, 'Campo email deve ser um email valido');
    }

    return email;
  }

  public validarTipo(valor: unknown): TipoUsuario {
    if (typeof valor === 'string' && this.eTipoCadastroUsuario(valor)) {
      return valor;
    }

    throw new ErroHttp(
      400,
      `Campo tipo deve ser um destes valores: ${tiposCadastroUsuario.join(', ')}`
    );
  }

  private validarTextoObrigatorio(
    campo: string,
    valor: unknown,
    tamanhoMaximo: number
  ): string {
    if (typeof valor !== 'string') {
      throw new ErroHttp(400, `Campo ${campo} e obrigatorio`);
    }

    const valorNormalizado = valor.trim();

    if (!valorNormalizado) {
      throw new ErroHttp(400, `Campo ${campo} e obrigatorio`);
    }

    if (valorNormalizado.length > tamanhoMaximo) {
      throw new ErroHttp(
        400,
        `Campo ${campo} deve ter no maximo ${tamanhoMaximo} caracteres`
      );
    }

    return valorNormalizado;
  }

  private validarTextoOpcional(
    campo: string,
    valor: unknown,
    tamanhoMaximo: number
  ): string | null {
    if (valor === undefined || valor === null || valor === '') {
      return null;
    }

    if (typeof valor !== 'string') {
      throw new ErroHttp(400, `Campo ${campo} deve ser texto`);
    }

    const valorNormalizado = valor.trim();

    if (!valorNormalizado) {
      return null;
    }

    if (valorNormalizado.length > tamanhoMaximo) {
      throw new ErroHttp(
        400,
        `Campo ${campo} deve ter no maximo ${tamanhoMaximo} caracteres`
      );
    }

    return valorNormalizado;
  }

  private validarBooleano(campo: string, valor: unknown): boolean {
    if (typeof valor !== 'boolean') {
      throw new ErroHttp(400, `Campo ${campo} deve ser booleano`);
    }

    return valor;
  }

  private eTipoUsuario(valor: string): valor is TipoUsuario {
    return tiposUsuario.includes(valor as TipoUsuario);
  }

  private eTipoCadastroUsuario(valor: string): valor is TipoUsuario {
    return this.eTipoUsuario(valor) && tiposCadastroUsuario.includes(valor);
  }
}

export function criarUsuariosServico(): UsuariosServico {
  return new UsuariosServico(AppDataSource.getRepository(Usuario));
}
