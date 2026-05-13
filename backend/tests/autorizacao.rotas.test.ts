import request from 'supertest';
import type { Repository } from 'typeorm';

import { criarApp } from '../src/app.js';
import { Usuario } from '../src/entidades/Usuario.js';
import { AutenticacaoServico } from '../src/modulos/autenticacao/autenticacaoServico.js';
import type { UsuariosServicoContrato } from '../src/modulos/usuarios/usuariosTipos.js';

const dataFixa = new Date('2026-01-01T00:00:00.000Z');

function criarUsuario(tipo: Usuario['tipo']): Usuario {
  return Object.assign(new Usuario(), {
    id: `usuario-${tipo}`,
    nome: `Usuario ${tipo}`,
    email: `${tipo}@example.com`,
    telefone: null,
    senhaHash: 'hash',
    tipo,
    recebeNotificacoes: false,
    ativo: true,
    criadoEm: dataFixa,
    atualizadoEm: dataFixa
  });
}

function criarAutenticacaoServico(): AutenticacaoServico {
  return new AutenticacaoServico({} as Repository<Usuario>);
}

function criarUsuariosServicoMock(usuario: Usuario): UsuariosServicoContrato {
  return {
    listar: async () => [usuario],
    buscarPorId: async () => usuario,
    criar: async () => usuario,
    atualizar: async () => usuario,
    remover: async () => undefined
  };
}

describe('Autorizacao das rotas privadas', () => {
  it('deve bloquear rota privada sem token', async () => {
    const app = criarApp();

    const response = await request(app).get('/medicamentos');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      mensagem: 'Token de autenticacao nao informado'
    });
  });

  it('deve permitir administrador acessar rota de usuarios', async () => {
    const usuario = criarUsuario('administrador');
    const autenticacaoServico = criarAutenticacaoServico();
    const app = criarApp({
      autenticacaoServico,
      usuariosServico: criarUsuariosServicoMock(usuario)
    });
    const token = autenticacaoServico.gerarToken(usuario).token;

    const response = await request(app)
      .get('/usuarios')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).not.toBe(401);
    expect(response.status).not.toBe(403);
  });

  it('deve negar paciente em rota administrativa', async () => {
    const usuario = criarUsuario('paciente');
    const autenticacaoServico = criarAutenticacaoServico();
    const app = criarApp({ autenticacaoServico });
    const token = autenticacaoServico.gerarToken(usuario).token;

    const response = await request(app)
      .get('/usuarios')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      mensagem: 'Usuario sem permissao para acessar esta rota'
    });
  });
});
