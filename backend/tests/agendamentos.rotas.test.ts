import request from 'supertest';

import { criarApp } from '../src/app.js';
import type { AgendamentoMedicamento } from '../src/entidades/AgendamentoMedicamento.js';
import { ErroHttp } from '../src/erros/ErroHttp.js';
import type { AgendamentosServicoContrato } from '../src/modulos/agendamentos/agendamentosTipos.js';

const dataFixa = new Date('2026-01-01T00:00:00.000Z');

function criarAgendamentoTeste(
  sobrescritas: Partial<AgendamentoMedicamento> = {}
): AgendamentoMedicamento {
  return {
    id: 'agendamento-1',
    medicamentoId: 'medicamento-1',
    tipo: 'horarios_fixos',
    diasSemana: [1, 2, 3, 4, 5],
    horarios: ['08:00'],
    intervaloHoras: null,
    horarioInicio: null,
    inicioEm: '2026-05-01',
    fimEm: null,
    toleranciaMinutos: 30,
    cuidados: null,
    ativo: true,
    criadoEm: dataFixa,
    atualizadoEm: dataFixa,
    medicamento: null as never,
    ...sobrescritas
  };
}

function criarServicoMock(sobrescritas: Partial<AgendamentosServicoContrato> = {}) {
  const agendamento = criarAgendamentoTeste();
  const chamadas = {
    listar: [] as unknown[],
    buscarPorId: [] as string[],
    criar: [] as unknown[],
    atualizar: [] as Array<[string, unknown]>,
    remover: [] as string[]
  };

  const servico: AgendamentosServicoContrato = {
    listar: async (filtros) => {
      chamadas.listar.push(filtros);

      if (sobrescritas.listar) {
        return sobrescritas.listar(filtros);
      }

      return [agendamento];
    },
    buscarPorId: async (id) => {
      chamadas.buscarPorId.push(id);

      if (sobrescritas.buscarPorId) {
        return sobrescritas.buscarPorId(id);
      }

      return agendamento;
    },
    criar: async (entrada) => {
      chamadas.criar.push(entrada);

      if (sobrescritas.criar) {
        return sobrescritas.criar(entrada);
      }

      return agendamento;
    },
    atualizar: async (id, entrada) => {
      chamadas.atualizar.push([id, entrada]);

      if (sobrescritas.atualizar) {
        return sobrescritas.atualizar(id, entrada);
      }

      return agendamento;
    },
    remover: async (id) => {
      chamadas.remover.push(id);

      if (sobrescritas.remover) {
        return sobrescritas.remover(id);
      }
    }
  };

  return { servico, chamadas };
}

describe('Rotas de agendamentos', () => {
  it('deve listar agendamentos com filtro opcional de medicamento', async () => {
    const { servico, chamadas } = criarServicoMock();
    const app = criarApp({ agendamentosServico: servico, autenticacaoAtiva: false });

    const response = await request(app).get(
      '/agendamentos?medicamentoId=medicamento-1'
    );

    expect(response.status).toBe(200);
    expect(chamadas.listar).toEqual([{ medicamentoId: 'medicamento-1' }]);
    expect(response.body[0]).toMatchObject({
      id: 'agendamento-1',
      medicamentoId: 'medicamento-1',
      tipo: 'horarios_fixos'
    });
  });

  it('deve criar agendamento', async () => {
    const { servico, chamadas } = criarServicoMock();
    const app = criarApp({ agendamentosServico: servico, autenticacaoAtiva: false });
    const entrada = {
      medicamentoId: 'medicamento-1',
      tipo: 'intervalo',
      diasSemana: [0, 1, 2, 3, 4, 5, 6],
      intervaloHoras: 8,
      horarioInicio: '06:00'
    };

    const response = await request(app).post('/agendamentos').send(entrada);

    expect(response.status).toBe(201);
    expect(chamadas.criar).toEqual([entrada]);
  });

  it('deve atualizar agendamento', async () => {
    const { servico, chamadas } = criarServicoMock();
    const app = criarApp({ agendamentosServico: servico, autenticacaoAtiva: false });
    const entrada = { horarios: ['08:00', '20:00'] };

    const response = await request(app)
      .put('/agendamentos/agendamento-1')
      .send(entrada);

    expect(response.status).toBe(200);
    expect(chamadas.atualizar).toEqual([['agendamento-1', entrada]]);
  });

  it('deve remover agendamento', async () => {
    const { servico, chamadas } = criarServicoMock();
    const app = criarApp({ agendamentosServico: servico, autenticacaoAtiva: false });

    const response = await request(app).delete('/agendamentos/agendamento-1');

    expect(response.status).toBe(204);
    expect(chamadas.remover).toEqual(['agendamento-1']);
  });

  it('deve tratar erro do servico', async () => {
    const { servico } = criarServicoMock({
      buscarPorId: async () => {
        throw new ErroHttp(404, 'Agendamento nao encontrado');
      }
    });
    const app = criarApp({ agendamentosServico: servico, autenticacaoAtiva: false });

    const response = await request(app).get('/agendamentos/inexistente');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ mensagem: 'Agendamento nao encontrado' });
  });
});
