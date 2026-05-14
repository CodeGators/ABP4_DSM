import request from 'supertest';
import type { Repository } from 'typeorm';

import { criarApp } from '../src/app.js';
import type { Paciente } from '../src/entidades/Paciente.js';
import type { PacienteResponsavel } from '../src/entidades/PacienteResponsavel.js';
import { Usuario } from '../src/entidades/Usuario.js';
import { ErroHttp } from '../src/erros/ErroHttp.js';
import { AutenticacaoServico } from '../src/modulos/autenticacao/autenticacaoServico.js';
import type { PacientesServicoContrato } from '../src/modulos/pacientes/pacientesTipos.js';

const dataFixa = new Date('2026-01-01T00:00:00.000Z');

function criarPacienteTeste(sobrescritas: Partial<Paciente> = {}): Paciente {
  return {
    id: 'paciente-1',
    usuarioId: 'usuario-paciente-1',
    usuario: null,
    nome: 'Joao Paciente',
    dataNascimento: '1950-01-01',
    observacoes: null,
    ativo: true,
    criadoEm: dataFixa,
    atualizadoEm: dataFixa,
    ...sobrescritas
  };
}

function criarVinculoTeste(
  sobrescritas: Partial<PacienteResponsavel> = {}
): PacienteResponsavel {
  return {
    id: 'vinculo-1',
    pacienteId: 'paciente-1',
    paciente: null as never,
    responsavelId: 'responsavel-1',
    responsavel: null as never,
    parentesco: 'Filha',
    recebeNotificacoes: true,
    ativo: true,
    criadoEm: dataFixa,
    atualizadoEm: dataFixa,
    ...sobrescritas
  };
}

function criarUsuarioAutenticado(tipo: Usuario['tipo']): Usuario {
  return Object.assign(new Usuario(), {
    id: `usuario-${tipo}`,
    nome: `Usuario ${tipo}`,
    email: `${tipo}@example.com`,
    telefone: null,
    senhaHash: 'hash',
    tipo,
    recebeNotificacoes: true,
    ativo: true,
    criadoEm: dataFixa,
    atualizadoEm: dataFixa
  });
}

function gerarToken(usuario: Usuario): string {
  return new AutenticacaoServico({} as Repository<Usuario>).gerarToken(usuario)
    .token;
}

function criarServicoMock(sobrescritas: Partial<PacientesServicoContrato> = {}) {
  const paciente = criarPacienteTeste();
  const vinculo = criarVinculoTeste();
  const chamadas = {
    listar: [] as unknown[],
    listarMeus: [] as unknown[],
    buscarPorId: [] as Array<[string, unknown]>,
    criar: [] as Array<[unknown, unknown]>,
    atualizar: [] as Array<[string, unknown, unknown]>,
    remover: [] as Array<[string, unknown]>,
    listarResponsaveis: [] as Array<[string, unknown]>,
    vincularResponsavel: [] as Array<[string, unknown, unknown]>,
    removerResponsavel: [] as Array<[string, string, unknown]>
  };

  const servico: PacientesServicoContrato = {
    listar: async (contexto) => {
      chamadas.listar.push(contexto);

      if (sobrescritas.listar) {
        return sobrescritas.listar(contexto);
      }

      return [paciente];
    },
    listarMeus: async (contexto) => {
      chamadas.listarMeus.push(contexto);

      if (sobrescritas.listarMeus) {
        return sobrescritas.listarMeus(contexto);
      }

      return [paciente];
    },
    buscarPorId: async (id, contexto) => {
      chamadas.buscarPorId.push([id, contexto]);

      if (sobrescritas.buscarPorId) {
        return sobrescritas.buscarPorId(id, contexto);
      }

      return paciente;
    },
    criar: async (entrada, contexto) => {
      chamadas.criar.push([entrada, contexto]);

      if (sobrescritas.criar) {
        return sobrescritas.criar(entrada, contexto);
      }

      return paciente;
    },
    atualizar: async (id, entrada, contexto) => {
      chamadas.atualizar.push([id, entrada, contexto]);

      if (sobrescritas.atualizar) {
        return sobrescritas.atualizar(id, entrada, contexto);
      }

      return paciente;
    },
    remover: async (id, contexto) => {
      chamadas.remover.push([id, contexto]);

      if (sobrescritas.remover) {
        return sobrescritas.remover(id, contexto);
      }
    },
    listarResponsaveis: async (pacienteId, contexto) => {
      chamadas.listarResponsaveis.push([pacienteId, contexto]);

      if (sobrescritas.listarResponsaveis) {
        return sobrescritas.listarResponsaveis(pacienteId, contexto);
      }

      return [vinculo];
    },
    vincularResponsavel: async (pacienteId, entrada, contexto) => {
      chamadas.vincularResponsavel.push([pacienteId, entrada, contexto]);

      if (sobrescritas.vincularResponsavel) {
        return sobrescritas.vincularResponsavel(pacienteId, entrada, contexto);
      }

      return vinculo;
    },
    removerResponsavel: async (pacienteId, responsavelId, contexto) => {
      chamadas.removerResponsavel.push([pacienteId, responsavelId, contexto]);

      if (sobrescritas.removerResponsavel) {
        return sobrescritas.removerResponsavel(
          pacienteId,
          responsavelId,
          contexto
        );
      }
    }
  };

  return { servico, chamadas };
}

describe('Rotas de pacientes', () => {
  it('deve listar pacientes', async () => {
    const { servico, chamadas } = criarServicoMock();
    const app = criarApp({ pacientesServico: servico, autenticacaoAtiva: false });

    const response = await request(app).get('/pacientes');

    expect(response.status).toBe(200);
    expect(chamadas.listar).toEqual([undefined]);
    expect(response.body[0]).toMatchObject({
      id: 'paciente-1',
      nome: 'Joao Paciente'
    });
  });

  it('deve listar meus pacientes usando responsavel autenticado', async () => {
    const { servico, chamadas } = criarServicoMock();
    const usuario = criarUsuarioAutenticado('responsavel');
    const app = criarApp({ pacientesServico: servico });

    const response = await request(app)
      .get('/pacientes/meus')
      .set('Authorization', `Bearer ${gerarToken(usuario)}`);

    expect(response.status).toBe(200);
    expect(chamadas.listarMeus).toEqual([
      { id: 'usuario-responsavel', tipo: 'responsavel' }
    ]);
  });

  it('deve criar paciente', async () => {
    const { servico, chamadas } = criarServicoMock();
    const app = criarApp({ pacientesServico: servico, autenticacaoAtiva: false });
    const entrada = {
      nome: 'Joao Paciente',
      dataNascimento: '1950-01-01'
    };

    const response = await request(app).post('/pacientes').send(entrada);

    expect(response.status).toBe(201);
    expect(chamadas.criar).toEqual([[entrada, undefined]]);
  });

  it('deve criar paciente com contexto do responsavel logado', async () => {
    const { servico, chamadas } = criarServicoMock();
    const usuario = criarUsuarioAutenticado('responsavel');
    const app = criarApp({ pacientesServico: servico });
    const entrada = {
      nome: 'Joao Paciente',
      dataNascimento: '1950-01-01'
    };

    const response = await request(app)
      .post('/pacientes')
      .set('Authorization', `Bearer ${gerarToken(usuario)}`)
      .send(entrada);

    expect(response.status).toBe(201);
    expect(chamadas.criar).toEqual([
      [entrada, { id: 'usuario-responsavel', tipo: 'responsavel' }]
    ]);
  });

  it('deve vincular responsavel ao paciente', async () => {
    const { servico, chamadas } = criarServicoMock();
    const app = criarApp({ pacientesServico: servico, autenticacaoAtiva: false });
    const entrada = {
      responsavelId: 'responsavel-1',
      parentesco: 'Filha',
      recebeNotificacoes: true
    };

    const response = await request(app)
      .post('/pacientes/paciente-1/responsaveis')
      .send(entrada);

    expect(response.status).toBe(201);
    expect(chamadas.vincularResponsavel).toEqual([
      ['paciente-1', entrada, undefined]
    ]);
  });

  it('deve listar responsaveis do paciente', async () => {
    const { servico, chamadas } = criarServicoMock();
    const app = criarApp({ pacientesServico: servico, autenticacaoAtiva: false });

    const response = await request(app).get('/pacientes/paciente-1/responsaveis');

    expect(response.status).toBe(200);
    expect(chamadas.listarResponsaveis).toEqual([['paciente-1', undefined]]);
    expect(response.body[0]).toMatchObject({
      pacienteId: 'paciente-1',
      responsavelId: 'responsavel-1'
    });
  });

  it('deve remover vinculo do responsavel', async () => {
    const { servico, chamadas } = criarServicoMock();
    const app = criarApp({ pacientesServico: servico, autenticacaoAtiva: false });

    const response = await request(app).delete(
      '/pacientes/paciente-1/responsaveis/responsavel-1'
    );

    expect(response.status).toBe(204);
    expect(chamadas.removerResponsavel).toEqual([
      ['paciente-1', 'responsavel-1', undefined]
    ]);
  });

  it('deve tratar erro do servico', async () => {
    const { servico } = criarServicoMock({
      buscarPorId: async () => {
        throw new ErroHttp(404, 'Paciente nao encontrado');
      }
    });
    const app = criarApp({ pacientesServico: servico, autenticacaoAtiva: false });

    const response = await request(app).get('/pacientes/inexistente');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ mensagem: 'Paciente nao encontrado' });
  });
});
