import request from 'supertest';

import { criarApp } from '../src/app.js';
import { ErroHttp } from '../src/erros/ErroHttp.js';
import type { Medicamento } from '../src/entidades/Medicamento.js';
import type { MedicamentosServicoContrato } from '../src/modulos/medicamentos/medicamentosTipos.js';

const dataFixa = new Date('2026-01-01T00:00:00.000Z');

function criarMedicamentoTeste(
  sobrescritas: Partial<Medicamento> = {}
): Medicamento {
  return {
    id: 'medicamento-1',
    nome: 'Dipirona',
    dosagem: '500mg',
    observacoes: null,
    ativo: true,
    criadoEm: dataFixa,
    atualizadoEm: dataFixa,
    ...sobrescritas
  };
}

function criarServicoMock(
  sobrescritas: Partial<MedicamentosServicoContrato> = {}
): {
  servico: MedicamentosServicoContrato;
  chamadas: {
    buscarPorId: string[];
    criar: unknown[];
    atualizar: Array<[string, unknown]>;
    remover: string[];
  };
} {
  const medicamento = criarMedicamentoTeste();
  const chamadas = {
    buscarPorId: [] as string[],
    criar: [] as unknown[],
    atualizar: [] as Array<[string, unknown]>,
    remover: [] as string[]
  };

  const servico: MedicamentosServicoContrato = {
    listar: async () => [medicamento],
    buscarPorId: async (id: string) => {
      chamadas.buscarPorId.push(id);

      if (sobrescritas.buscarPorId) {
        return sobrescritas.buscarPorId(id);
      }

      return medicamento;
    },
    criar: async (entrada) => {
      chamadas.criar.push(entrada);

      if (sobrescritas.criar) {
        return sobrescritas.criar(entrada);
      }

      return medicamento;
    },
    atualizar: async (id, entrada) => {
      chamadas.atualizar.push([id, entrada]);

      if (sobrescritas.atualizar) {
        return sobrescritas.atualizar(id, entrada);
      }

      return medicamento;
    },
    remover: async (id) => {
      chamadas.remover.push(id);

      if (sobrescritas.remover) {
        return sobrescritas.remover(id);
      }
    },
    ...sobrescritas
  };

  return { servico, chamadas };
}

describe('Rotas de medicamentos', () => {
  it('deve listar medicamentos', async () => {
    const { servico } = criarServicoMock();
    const app = criarApp({ medicamentosServico: servico });

    const response = await request(app).get('/medicamentos');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        id: 'medicamento-1',
        nome: 'Dipirona',
        dosagem: '500mg',
        observacoes: null,
        ativo: true,
        criadoEm: dataFixa.toISOString(),
        atualizadoEm: dataFixa.toISOString()
      }
    ]);
  });

  it('deve buscar medicamento por id', async () => {
    const { servico, chamadas } = criarServicoMock();
    const app = criarApp({ medicamentosServico: servico });

    const response = await request(app).get('/medicamentos/medicamento-1');

    expect(response.status).toBe(200);
    expect(chamadas.buscarPorId).toEqual(['medicamento-1']);
    expect(response.body.nome).toBe('Dipirona');
  });

  it('deve criar medicamento', async () => {
    const { servico, chamadas } = criarServicoMock();
    const app = criarApp({ medicamentosServico: servico });
    const entrada = {
      nome: 'Dipirona',
      dosagem: '500mg',
      observacoes: 'Tomar com agua'
    };

    const response = await request(app).post('/medicamentos').send(entrada);

    expect(response.status).toBe(201);
    expect(chamadas.criar).toEqual([entrada]);
    expect(response.body.id).toBe('medicamento-1');
  });

  it('deve atualizar medicamento', async () => {
    const { servico, chamadas } = criarServicoMock();
    const app = criarApp({ medicamentosServico: servico });
    const entrada = {
      nome: 'Dipirona gotas'
    };

    const response = await request(app)
      .put('/medicamentos/medicamento-1')
      .send(entrada);

    expect(response.status).toBe(200);
    expect(chamadas.atualizar).toEqual([['medicamento-1', entrada]]);
  });

  it('deve remover medicamento', async () => {
    const { servico, chamadas } = criarServicoMock();
    const app = criarApp({ medicamentosServico: servico });

    const response = await request(app).delete('/medicamentos/medicamento-1');

    expect(response.status).toBe(204);
    expect(chamadas.remover).toEqual(['medicamento-1']);
  });

  it('deve retornar erro tratado pelo middleware', async () => {
    const { servico } = criarServicoMock({
      buscarPorId: async () => {
        throw new ErroHttp(404, 'Medicamento nao encontrado');
      }
    });
    const app = criarApp({ medicamentosServico: servico });

    const response = await request(app).get('/medicamentos/inexistente');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ mensagem: 'Medicamento nao encontrado' });
  });
});
