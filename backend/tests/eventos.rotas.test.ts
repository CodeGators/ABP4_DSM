import request from 'supertest';

import { criarApp } from '../src/app.js';
import type { EventoMedicamento } from '../src/entidades/EventoMedicamento.js';
import { ErroHttp } from '../src/erros/ErroHttp.js';
import type { EventosServicoContrato } from '../src/modulos/eventos/eventosTipos.js';

const dataFixa = new Date('2026-01-01T00:00:00.000Z');

function criarEventoTeste(
  sobrescritas: Partial<EventoMedicamento> = {}
): EventoMedicamento {
  return {
    id: 'evento-1',
    medicamentoId: 'medicamento-1',
    medicamento: null,
    agendamentoId: 'agendamento-1',
    agendamento: null,
    dispositivoId: 'pillgator-01',
    tipo: 'medicamento_retirado',
    origem: 'iot',
    ocorridoEm: dataFixa,
    descricao: 'Paciente retirou o medicamento.',
    dados: { compartimento: 1 },
    criadoEm: dataFixa,
    ...sobrescritas
  };
}

function criarServicoMock(sobrescritas: Partial<EventosServicoContrato> = {}) {
  const evento = criarEventoTeste();
  const chamadas = {
    listar: [] as unknown[],
    buscarPorId: [] as string[],
    criar: [] as unknown[]
  };

  const servico: EventosServicoContrato = {
    listar: async (filtros) => {
      chamadas.listar.push(filtros);

      if (sobrescritas.listar) {
        return sobrescritas.listar(filtros);
      }

      return [evento];
    },
    buscarPorId: async (id) => {
      chamadas.buscarPorId.push(id);

      if (sobrescritas.buscarPorId) {
        return sobrescritas.buscarPorId(id);
      }

      return evento;
    },
    criar: async (entrada) => {
      chamadas.criar.push(entrada);

      if (sobrescritas.criar) {
        return sobrescritas.criar(entrada);
      }

      return evento;
    }
  };

  return { servico, chamadas };
}

describe('Rotas de eventos', () => {
  it('deve listar historico com filtros opcionais', async () => {
    const { servico, chamadas } = criarServicoMock();
    const app = criarApp({ eventosServico: servico });

    const response = await request(app).get(
      '/eventos?medicamentoId=medicamento-1&tipo=medicamento_retirado&origem=iot'
    );

    expect(response.status).toBe(200);
    expect(chamadas.listar).toEqual([
      {
        medicamentoId: 'medicamento-1',
        tipo: 'medicamento_retirado',
        origem: 'iot'
      }
    ]);
    expect(response.body[0]).toMatchObject({
      id: 'evento-1',
      tipo: 'medicamento_retirado',
      origem: 'iot'
    });
  });

  it('deve registrar evento', async () => {
    const { servico, chamadas } = criarServicoMock();
    const app = criarApp({ eventosServico: servico });
    const entrada = {
      medicamentoId: 'medicamento-1',
      agendamentoId: 'agendamento-1',
      dispositivoId: 'pillgator-01',
      tipo: 'alerta_emitido',
      origem: 'backend',
      descricao: 'Alerta enviado ao dispositivo.'
    };

    const response = await request(app).post('/eventos').send(entrada);

    expect(response.status).toBe(201);
    expect(chamadas.criar).toEqual([entrada]);
  });

  it('deve buscar evento pelo id', async () => {
    const { servico, chamadas } = criarServicoMock();
    const app = criarApp({ eventosServico: servico });

    const response = await request(app).get('/eventos/evento-1');

    expect(response.status).toBe(200);
    expect(chamadas.buscarPorId).toEqual(['evento-1']);
    expect(response.body.id).toBe('evento-1');
  });

  it('deve tratar erro do servico', async () => {
    const { servico } = criarServicoMock({
      buscarPorId: async () => {
        throw new ErroHttp(404, 'Evento nao encontrado');
      }
    });
    const app = criarApp({ eventosServico: servico });

    const response = await request(app).get('/eventos/inexistente');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ mensagem: 'Evento nao encontrado' });
  });
});
