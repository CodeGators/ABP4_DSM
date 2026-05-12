import request from 'supertest';

import { criarApp } from '../src/app.js';
import type { Paciente } from '../src/entidades/Paciente.js';
import type { PacienteResponsavel } from '../src/entidades/PacienteResponsavel.js';
import { ErroHttp } from '../src/erros/ErroHttp.js';
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

function criarServicoMock(sobrescritas: Partial<PacientesServicoContrato> = {}) {
  const paciente = criarPacienteTeste();
  const vinculo = criarVinculoTeste();
  const chamadas = {
    listar: 0,
    buscarPorId: [] as string[],
    criar: [] as unknown[],
    atualizar: [] as Array<[string, unknown]>,
    remover: [] as string[],
    listarResponsaveis: [] as string[],
    vincularResponsavel: [] as Array<[string, unknown]>,
    removerResponsavel: [] as Array<[string, string]>
  };

  const servico: PacientesServicoContrato = {
    listar: async () => {
      chamadas.listar += 1;

      if (sobrescritas.listar) {
        return sobrescritas.listar();
      }

      return [paciente];
    },
    buscarPorId: async (id) => {
      chamadas.buscarPorId.push(id);

      if (sobrescritas.buscarPorId) {
        return sobrescritas.buscarPorId(id);
      }

      return paciente;
    },
    criar: async (entrada) => {
      chamadas.criar.push(entrada);

      if (sobrescritas.criar) {
        return sobrescritas.criar(entrada);
      }

      return paciente;
    },
    atualizar: async (id, entrada) => {
      chamadas.atualizar.push([id, entrada]);

      if (sobrescritas.atualizar) {
        return sobrescritas.atualizar(id, entrada);
      }

      return paciente;
    },
    remover: async (id) => {
      chamadas.remover.push(id);

      if (sobrescritas.remover) {
        return sobrescritas.remover(id);
      }
    },
    listarResponsaveis: async (pacienteId) => {
      chamadas.listarResponsaveis.push(pacienteId);

      if (sobrescritas.listarResponsaveis) {
        return sobrescritas.listarResponsaveis(pacienteId);
      }

      return [vinculo];
    },
    vincularResponsavel: async (pacienteId, entrada) => {
      chamadas.vincularResponsavel.push([pacienteId, entrada]);

      if (sobrescritas.vincularResponsavel) {
        return sobrescritas.vincularResponsavel(pacienteId, entrada);
      }

      return vinculo;
    },
    removerResponsavel: async (pacienteId, responsavelId) => {
      chamadas.removerResponsavel.push([pacienteId, responsavelId]);

      if (sobrescritas.removerResponsavel) {
        return sobrescritas.removerResponsavel(pacienteId, responsavelId);
      }
    }
  };

  return { servico, chamadas };
}

describe('Rotas de pacientes', () => {
  it('deve listar pacientes', async () => {
    const { servico, chamadas } = criarServicoMock();
    const app = criarApp({ pacientesServico: servico });

    const response = await request(app).get('/pacientes');

    expect(response.status).toBe(200);
    expect(chamadas.listar).toBe(1);
    expect(response.body[0]).toMatchObject({
      id: 'paciente-1',
      nome: 'Joao Paciente'
    });
  });

  it('deve criar paciente', async () => {
    const { servico, chamadas } = criarServicoMock();
    const app = criarApp({ pacientesServico: servico });
    const entrada = {
      nome: 'Joao Paciente',
      dataNascimento: '1950-01-01'
    };

    const response = await request(app).post('/pacientes').send(entrada);

    expect(response.status).toBe(201);
    expect(chamadas.criar).toEqual([entrada]);
  });

  it('deve vincular responsavel ao paciente', async () => {
    const { servico, chamadas } = criarServicoMock();
    const app = criarApp({ pacientesServico: servico });
    const entrada = {
      responsavelId: 'responsavel-1',
      parentesco: 'Filha',
      recebeNotificacoes: true
    };

    const response = await request(app)
      .post('/pacientes/paciente-1/responsaveis')
      .send(entrada);

    expect(response.status).toBe(201);
    expect(chamadas.vincularResponsavel).toEqual([['paciente-1', entrada]]);
  });

  it('deve listar responsaveis do paciente', async () => {
    const { servico, chamadas } = criarServicoMock();
    const app = criarApp({ pacientesServico: servico });

    const response = await request(app).get('/pacientes/paciente-1/responsaveis');

    expect(response.status).toBe(200);
    expect(chamadas.listarResponsaveis).toEqual(['paciente-1']);
    expect(response.body[0]).toMatchObject({
      pacienteId: 'paciente-1',
      responsavelId: 'responsavel-1'
    });
  });

  it('deve remover vinculo do responsavel', async () => {
    const { servico, chamadas } = criarServicoMock();
    const app = criarApp({ pacientesServico: servico });

    const response = await request(app).delete(
      '/pacientes/paciente-1/responsaveis/responsavel-1'
    );

    expect(response.status).toBe(204);
    expect(chamadas.removerResponsavel).toEqual([
      ['paciente-1', 'responsavel-1']
    ]);
  });

  it('deve tratar erro do servico', async () => {
    const { servico } = criarServicoMock({
      buscarPorId: async () => {
        throw new ErroHttp(404, 'Paciente nao encontrado');
      }
    });
    const app = criarApp({ pacientesServico: servico });

    const response = await request(app).get('/pacientes/inexistente');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ mensagem: 'Paciente nao encontrado' });
  });
});
