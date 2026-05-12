import type { Repository } from 'typeorm';

import { Usuario } from '../src/entidades/Usuario.js';
import { ErroHttp } from '../src/erros/ErroHttp.js';
import { UsuariosServico } from '../src/modulos/usuarios/usuariosServico.js';

const dataFixa = new Date('2026-01-01T00:00:00.000Z');

class RepositorioUsuariosMemoria {
  public usuarios: Usuario[] = [];

  public create(dados: Partial<Usuario>): Usuario {
    return Object.assign(new Usuario(), {
      id: `usuario-${this.usuarios.length + 1}`,
      ativo: true,
      criadoEm: dataFixa,
      atualizadoEm: dataFixa,
      ...dados
    });
  }

  public async save(usuario: Usuario): Promise<Usuario> {
    const indice = this.usuarios.findIndex((item) => item.id === usuario.id);

    if (indice >= 0) {
      this.usuarios[indice] = usuario;
    } else {
      this.usuarios.push(usuario);
    }

    return usuario;
  }

  public async find(opcoes: { where: Partial<Usuario> }): Promise<Usuario[]> {
    return this.usuarios.filter((usuario) => {
      if (opcoes.where.ativo !== undefined && usuario.ativo !== opcoes.where.ativo) {
        return false;
      }

      if (opcoes.where.tipo !== undefined && usuario.tipo !== opcoes.where.tipo) {
        return false;
      }

      return true;
    });
  }

  public async findOne(opcoes: {
    where: Partial<Usuario>;
  }): Promise<Usuario | null> {
    return (
      this.usuarios.find((usuario) => {
        if (opcoes.where.id !== undefined && usuario.id !== opcoes.where.id) {
          return false;
        }

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

function criarServico() {
  const usuariosRepositorio = new RepositorioUsuariosMemoria();
  const servico = new UsuariosServico(
    usuariosRepositorio as unknown as Repository<Usuario>
  );

  return { servico, usuariosRepositorio };
}

describe('UsuariosServico', () => {
  it('deve criar usuario normalizando email e telefone', async () => {
    const { servico } = criarServico();

    const usuario = await servico.criar({
      nome: ' Maria Responsavel ',
      email: ' MARIA@EXAMPLE.COM ',
      telefone: ' 11999999999 ',
      tipo: 'responsavel',
      recebeNotificacoes: true
    });

    expect(usuario).toMatchObject({
      nome: 'Maria Responsavel',
      email: 'maria@example.com',
      telefone: '11999999999',
      tipo: 'responsavel',
      recebeNotificacoes: true,
      ativo: true
    });
  });

  it('deve rejeitar email duplicado', async () => {
    const { servico } = criarServico();

    await servico.criar({
      nome: 'Maria',
      email: 'maria@example.com',
      tipo: 'responsavel'
    });

    await expect(
      servico.criar({
        nome: 'Outra Maria',
        email: 'maria@example.com',
        tipo: 'responsavel'
      })
    ).rejects.toMatchObject<Partial<ErroHttp>>({
      statusCode: 409,
      message: 'Email ja cadastrado'
    });
  });

  it('deve listar apenas usuarios ativos e filtrar por tipo', async () => {
    const { servico } = criarServico();

    await servico.criar({
      nome: 'Maria',
      email: 'maria@example.com',
      tipo: 'responsavel'
    });
    const paciente = await servico.criar({
      nome: 'Joao',
      email: 'joao@example.com',
      tipo: 'paciente'
    });
    await servico.remover(paciente.id);

    const usuarios = await servico.listar({ tipo: 'responsavel' });

    expect(usuarios).toHaveLength(1);
    expect(usuarios[0]?.tipo).toBe('responsavel');
  });

  it('deve atualizar usuario existente', async () => {
    const { servico } = criarServico();
    const usuario = await servico.criar({
      nome: 'Maria',
      email: 'maria@example.com',
      tipo: 'responsavel'
    });

    const atualizado = await servico.atualizar(usuario.id, {
      nome: 'Maria Silva',
      telefone: ''
    });

    expect(atualizado).toMatchObject({
      nome: 'Maria Silva',
      telefone: null
    });
  });

  it('deve rejeitar tipo invalido', async () => {
    const { servico } = criarServico();

    await expect(
      servico.criar({
        nome: 'Maria',
        email: 'maria@example.com',
        tipo: 'cuidador'
      })
    ).rejects.toMatchObject<Partial<ErroHttp>>({
      statusCode: 400
    });
  });
});
