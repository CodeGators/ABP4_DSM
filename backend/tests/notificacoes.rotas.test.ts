import request from 'supertest';

import { criarApp } from '../src/app.js';
import type { Notificacao } from '../src/entidades/Notificacao.js';
import type { NotificacoesServicoContrato } from '../src/modulos/notificacoes/notificacoesTipos.js';

const dataFixa = new Date('2026-01-01T00:00:00.000Z');

function criarNotificacaoTeste(
  sobrescritas: Partial<Notificacao> = {}
): Notificacao {
  return {
    id: 'notificacao-1',
    pacienteId: 'paciente-1',
    paciente: null as never,
    responsavelId: 'responsavel-1',
    responsavel: null as never,
    medicamentoId: 'medicamento-1',
    medicamento: null,
    agendamentoId: 'agendamento-1',
    agendamento: null,
    eventoId: 'evento-1',
    evento: null,
    tipo: 'atraso_medicamento',
    canal: 'interno',
    status: 'enviada',
    titulo: 'Medicamento em atraso',
    mensagem: 'Medicamento em atraso.',
    enviadaEm: dataFixa,
    lidaEm: null,
    dados: null,
    criadoEm: dataFixa,
    atualizadoEm: dataFixa,
    ...sobrescritas
  };
}

function criarServicoMock(
  sobrescritas: Partial<NotificacoesServicoContrato> = {}
) {
  const notificacao = criarNotificacaoTeste();
  const chamadas = {
    listar: [] as unknown[],
    verificarAtrasos: [] as unknown[]
  };

  const servico: NotificacoesServicoContrato = {
    listar: async (filtros) => {
      chamadas.listar.push(filtros);

      if (sobrescritas.listar) {
        return sobrescritas.listar(filtros);
      }

      return [notificacao];
    },
    verificarAtrasos: async (entrada) => {
      chamadas.verificarAtrasos.push(entrada);

      if (sobrescritas.verificarAtrasos) {
        return sobrescritas.verificarAtrasos(entrada);
      }

      return {
        referenciaEm: '2026-05-11T09:00:00.000Z',
        atrasosDetectados: 1,
        eventosCriados: 1,
        notificacoesCriadas: 1
      };
    }
  };

  return { servico, chamadas };
}

describe('Rotas de notificacoes', () => {
  it('deve listar notificacoes com filtros opcionais', async () => {
    const { servico, chamadas } = criarServicoMock();
    const app = criarApp({
      notificacoesServico: servico,
      autenticacaoAtiva: false
    });

    const response = await request(app).get(
      '/notificacoes?pacienteId=paciente-1&status=enviada'
    );

    expect(response.status).toBe(200);
    expect(chamadas.listar).toEqual([
      { pacienteId: 'paciente-1', status: 'enviada' }
    ]);
    expect(response.body[0]).toMatchObject({
      id: 'notificacao-1',
      tipo: 'atraso_medicamento'
    });
  });

  it('deve verificar atrasos', async () => {
    const { servico, chamadas } = criarServicoMock();
    const app = criarApp({
      notificacoesServico: servico,
      autenticacaoAtiva: false
    });
    const entrada = {
      referenciaEm: '2026-05-11T09:00:00.000Z'
    };

    const response = await request(app)
      .post('/notificacoes/verificar-atrasos')
      .send(entrada);

    expect(response.status).toBe(200);
    expect(chamadas.verificarAtrasos).toEqual([entrada]);
    expect(response.body).toMatchObject({
      atrasosDetectados: 1,
      eventosCriados: 1,
      notificacoesCriadas: 1
    });
  });
});
