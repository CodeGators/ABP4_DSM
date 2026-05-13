import type { Repository } from 'typeorm';

import { Usuario } from '../src/entidades/Usuario.js';
import { ErroHttp } from '../src/erros/ErroHttp.js';
import { AutenticacaoServico } from '../src/modulos/autenticacao/autenticacaoServico.js';
import { gerarHashSenha } from '../src/modulos/autenticacao/senhas.js';

const dataFixa = new Date('2026-01-01T00:00:00.000Z');

class RepositorioUsuariosMemoria {
  public usuarios: Usuario[] = [];

  public async findOne(opcoes: {
    where: Partial<Usuario>;
  }): Promise<Usuario | null> {
    return (
      this.usuarios.find((usuario) => {
        if (
          opcoes.where.email !== undefined &&
          usuario.email !== opcoes.where.email
        ) {
          return false;
        }

        if (
          opcoes.where.ativo !== undefined &&
          usuario.ativo !== opcoes.where.ativo
        ) {
          return false;
        }

        return true;
      }) ?? null
    );
  }
}

function criarUsuario(sobrescritas: Partial<Usuario> = {}): Usuario {
  return Object.assign(new Usuario(), {
    id: 'usuario-1',
    nome: 'Maria Responsavel',
    email: 'maria@example.com',
    telefone: null,
    senhaHash: null,
    tipo: 'responsavel',
    recebeNotificacoes: true,
    ativo: true,
    criadoEm: dataFixa,
    atualizadoEm: dataFixa,
    ...sobrescritas
  });
}

function criarServico() {
  const usuariosRepositorio = new RepositorioUsuariosMemoria();
  const servico = new AutenticacaoServico(
    usuariosRepositorio as unknown as Repository<Usuario>
  );

  return { servico, usuariosRepositorio };
}

describe('AutenticacaoServico', () => {
  it('deve autenticar usuario ativo com senha correta', async () => {
    const { servico, usuariosRepositorio } = criarServico();
    usuariosRepositorio.usuarios.push(
      criarUsuario({
        senhaHash: await gerarHashSenha('senha-segura')
      })
    );

    const resposta = await servico.login({
      email: 'MARIA@EXAMPLE.COM',
      senha: 'senha-segura'
    });

    expect(resposta).toMatchObject({
      tipoToken: 'Bearer',
      expiraEm: '8h',
      usuario: {
        id: 'usuario-1',
        email: 'maria@example.com',
        tipo: 'responsavel'
      }
    });
    expect(resposta.token).toEqual(expect.any(String));
  });

  it('deve rejeitar senha incorreta sem revelar qual campo falhou', async () => {
    const { servico, usuariosRepositorio } = criarServico();
    usuariosRepositorio.usuarios.push(
      criarUsuario({
        senhaHash: await gerarHashSenha('senha-segura')
      })
    );

    await expect(
      servico.login({
        email: 'maria@example.com',
        senha: 'senha-errada'
      })
    ).rejects.toMatchObject<Partial<ErroHttp>>({
      statusCode: 401,
      message: 'Email ou senha invalidos'
    });
  });

  it('deve rejeitar usuario sem senha cadastrada', async () => {
    const { servico, usuariosRepositorio } = criarServico();
    usuariosRepositorio.usuarios.push(criarUsuario());

    await expect(
      servico.login({
        email: 'maria@example.com',
        senha: 'senha-segura'
      })
    ).rejects.toMatchObject<Partial<ErroHttp>>({
      statusCode: 401,
      message: 'Email ou senha invalidos'
    });
  });
});
