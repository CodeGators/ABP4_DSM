import request from 'supertest';

import { criarApp } from '../src/app.js';
import { Usuario } from '../src/entidades/Usuario.js';
import { ErroHttp } from '../src/erros/ErroHttp.js';
import type { AutenticacaoServicoContrato } from '../src/modulos/autenticacao/autenticacaoTipos.js';

const dataFixa = new Date('2026-01-01T00:00:00.000Z');

function criarUsuario(): Usuario {
  return Object.assign(new Usuario(), {
    id: 'usuario-1',
    nome: 'Admin',
    email: 'admin@example.com',
    telefone: null,
    senhaHash: 'hash',
    tipo: 'administrador',
    recebeNotificacoes: false,
    ativo: true,
    criadoEm: dataFixa,
    atualizadoEm: dataFixa
  });
}

function criarServicoMock(
  sobrescritas: Partial<AutenticacaoServicoContrato> = {}
) {
  const usuario = criarUsuario();
  const chamadas = {
    login: [] as unknown[]
  };

  const servico: AutenticacaoServicoContrato = {
    login: async (entrada) => {
      chamadas.login.push(entrada);

      if (sobrescritas.login) {
        return sobrescritas.login(entrada);
      }

      return {
        token: 'token-jwt',
        tipoToken: 'Bearer',
        expiraEm: '8h',
        usuario
      };
    },
    gerarToken: (usuarioParaToken) => {
      if (sobrescritas.gerarToken) {
        return sobrescritas.gerarToken(usuarioParaToken);
      }

      return {
        token: 'token-jwt',
        tipoToken: 'Bearer',
        expiraEm: '8h',
        usuario: usuarioParaToken
      };
    }
  };

  return { servico, chamadas };
}

describe('Rotas de autenticacao', () => {
  it('deve realizar login', async () => {
    const { servico, chamadas } = criarServicoMock();
    const app = criarApp({ autenticacaoServico: servico });
    const entrada = {
      email: 'admin@example.com',
      senha: 'senha-segura'
    };

    const response = await request(app).post('/auth/login').send(entrada);

    expect(response.status).toBe(200);
    expect(chamadas.login).toEqual([entrada]);
    expect(response.body).toMatchObject({
      token: 'token-jwt',
      tipoToken: 'Bearer',
      usuario: {
        id: 'usuario-1',
        tipo: 'administrador'
      }
    });
    expect(response.body.usuario).not.toHaveProperty('senhaHash');
  });

  it('deve tratar erro de credenciais invalidas', async () => {
    const { servico } = criarServicoMock({
      login: async () => {
        throw new ErroHttp(401, 'Email ou senha invalidos');
      }
    });
    const app = criarApp({ autenticacaoServico: servico });

    const response = await request(app).post('/auth/login').send({
      email: 'admin@example.com',
      senha: 'senha-errada'
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ mensagem: 'Email ou senha invalidos' });
  });
});
