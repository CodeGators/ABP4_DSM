import type { Repository } from 'typeorm';

import { AgendamentoMedicamento } from '../src/entidades/AgendamentoMedicamento.js';
import { EventoMedicamento } from '../src/entidades/EventoMedicamento.js';
import { Medicamento } from '../src/entidades/Medicamento.js';
import { ErroHttp } from '../src/erros/ErroHttp.js';
import { EventosServico } from '../src/modulos/eventos/eventosServico.js';

const dataFixa = new Date('2026-01-01T00:00:00.000Z');

class RepositorioEventosMemoria {
  public eventos: EventoMedicamento[] = [];

  public create(dados: Partial<EventoMedicamento>): EventoMedicamento {
    return Object.assign(new EventoMedicamento(), {
      id: 'novo-evento',
      criadoEm: dataFixa,
      ...dados
    });
  }

  public async save(evento: EventoMedicamento): Promise<EventoMedicamento> {
    this.eventos.push(evento);

    return evento;
  }

  public async find(opcoes: {
    where: Partial<EventoMedicamento>;
  }): Promise<EventoMedicamento[]> {
    return this.eventos.filter((evento) => {
      if (
        opcoes.where.medicamentoId !== undefined &&
        evento.medicamentoId !== opcoes.where.medicamentoId
      ) {
        return false;
      }

      if (
        opcoes.where.agendamentoId !== undefined &&
        evento.agendamentoId !== opcoes.where.agendamentoId
      ) {
        return false;
      }

      if (
        opcoes.where.dispositivoId !== undefined &&
        evento.dispositivoId !== opcoes.where.dispositivoId
      ) {
        return false;
      }

      if (opcoes.where.tipo !== undefined && evento.tipo !== opcoes.where.tipo) {
        return false;
      }

      if (
        opcoes.where.origem !== undefined &&
        evento.origem !== opcoes.where.origem
      ) {
        return false;
      }

      return true;
    });
  }

  public async findOne(opcoes: {
    where: { id: string };
  }): Promise<EventoMedicamento | null> {
    return this.eventos.find((evento) => evento.id === opcoes.where.id) ?? null;
  }
}

class RepositorioMedicamentosMemoria {
  public medicamentos: Medicamento[] = [];

  public async findOne(opcoes: {
    where: { id: string; ativo: boolean };
  }): Promise<Medicamento | null> {
    return (
      this.medicamentos.find(
        (medicamento) =>
          medicamento.id === opcoes.where.id &&
          medicamento.ativo === opcoes.where.ativo
      ) ?? null
    );
  }
}

class RepositorioAgendamentosMemoria {
  public agendamentos: AgendamentoMedicamento[] = [];

  public async findOne(opcoes: {
    where: { id: string; ativo: boolean };
  }): Promise<AgendamentoMedicamento | null> {
    return (
      this.agendamentos.find(
        (agendamento) =>
          agendamento.id === opcoes.where.id &&
          agendamento.ativo === opcoes.where.ativo
      ) ?? null
    );
  }
}

function criarMedicamento(
  sobrescritas: Partial<Medicamento> = {}
): Medicamento {
  return Object.assign(new Medicamento(), {
    id: 'medicamento-1',
    nome: 'Losartana',
    dosagem: '50mg',
    observacoes: null,
    ativo: true,
    criadoEm: dataFixa,
    atualizadoEm: dataFixa,
    ...sobrescritas
  });
}

function criarAgendamento(
  sobrescritas: Partial<AgendamentoMedicamento> = {}
): AgendamentoMedicamento {
  return Object.assign(new AgendamentoMedicamento(), {
    id: 'agendamento-1',
    medicamentoId: 'medicamento-1',
    tipo: 'horarios_fixos',
    diasSemana: [1],
    horarios: ['08:00'],
    intervaloHoras: null,
    horarioInicio: null,
    inicioEm: null,
    fimEm: null,
    toleranciaMinutos: 30,
    cuidados: null,
    ativo: true,
    criadoEm: dataFixa,
    atualizadoEm: dataFixa,
    ...sobrescritas
  });
}

function criarEvento(
  sobrescritas: Partial<EventoMedicamento> = {}
): EventoMedicamento {
  return Object.assign(new EventoMedicamento(), {
    id: 'evento-1',
    medicamentoId: 'medicamento-1',
    medicamento: null,
    agendamentoId: 'agendamento-1',
    agendamento: null,
    dispositivoId: 'pillgator-01',
    tipo: 'alerta_emitido',
    origem: 'backend',
    ocorridoEm: dataFixa,
    descricao: null,
    dados: null,
    criadoEm: dataFixa,
    ...sobrescritas
  });
}

function criarServico() {
  const eventosRepositorio = new RepositorioEventosMemoria();
  const medicamentosRepositorio = new RepositorioMedicamentosMemoria();
  const agendamentosRepositorio = new RepositorioAgendamentosMemoria();

  medicamentosRepositorio.medicamentos.push(criarMedicamento());
  agendamentosRepositorio.agendamentos.push(criarAgendamento());

  const servico = new EventosServico(
    eventosRepositorio as unknown as Repository<EventoMedicamento>,
    medicamentosRepositorio as unknown as Repository<Medicamento>,
    agendamentosRepositorio as unknown as Repository<AgendamentoMedicamento>
  );

  return {
    agendamentosRepositorio,
    eventosRepositorio,
    medicamentosRepositorio,
    servico
  };
}

describe('EventosServico', () => {
  it('deve registrar evento vinculado a medicamento e agendamento', async () => {
    const { servico } = criarServico();

    const evento = await servico.criar({
      medicamentoId: 'medicamento-1',
      agendamentoId: 'agendamento-1',
      dispositivoId: ' pillgator-01 ',
      tipo: 'medicamento_retirado',
      origem: 'iot',
      ocorridoEm: '2026-05-12T10:00:00.000Z',
      descricao: 'Paciente retirou o medicamento.',
      dados: { compartimento: 1 }
    });

    expect(evento).toMatchObject({
      medicamentoId: 'medicamento-1',
      agendamentoId: 'agendamento-1',
      dispositivoId: 'pillgator-01',
      tipo: 'medicamento_retirado',
      origem: 'iot',
      descricao: 'Paciente retirou o medicamento.',
      dados: { compartimento: 1 }
    });
    expect(evento.ocorridoEm.toISOString()).toBe('2026-05-12T10:00:00.000Z');
  });

  it('deve preencher medicamento pelo agendamento quando medicamentoId nao for enviado', async () => {
    const { servico } = criarServico();

    const evento = await servico.criar({
      agendamentoId: 'agendamento-1',
      tipo: 'alerta_emitido'
    });

    expect(evento).toMatchObject({
      medicamentoId: 'medicamento-1',
      agendamentoId: 'agendamento-1',
      tipo: 'alerta_emitido',
      origem: 'backend'
    });
  });

  it('deve listar eventos filtrando por tipo e origem', async () => {
    const { eventosRepositorio, servico } = criarServico();
    eventosRepositorio.eventos.push(
      criarEvento({ id: 'evento-1', tipo: 'alerta_emitido', origem: 'backend' }),
      criarEvento({
        id: 'evento-2',
        tipo: 'medicamento_retirado',
        origem: 'iot'
      })
    );

    const eventos = await servico.listar({
      tipo: 'medicamento_retirado',
      origem: 'iot'
    });

    expect(eventos).toHaveLength(1);
    expect(eventos[0]?.id).toBe('evento-2');
  });

  it('deve buscar evento pelo id', async () => {
    const { eventosRepositorio, servico } = criarServico();
    eventosRepositorio.eventos.push(criarEvento({ id: 'evento-1' }));

    const evento = await servico.buscarPorId('evento-1');

    expect(evento.id).toBe('evento-1');
  });

  it('deve rejeitar tipo invalido', async () => {
    const { servico } = criarServico();

    await expect(
      servico.criar({
        medicamentoId: 'medicamento-1',
        tipo: 'tipo_invalido'
      })
    ).rejects.toMatchObject<Partial<ErroHttp>>({
      statusCode: 400
    });
  });

  it('deve rejeitar medicamento que nao pertence ao agendamento', async () => {
    const { medicamentosRepositorio, servico } = criarServico();
    medicamentosRepositorio.medicamentos.push(
      criarMedicamento({ id: 'medicamento-2' })
    );

    await expect(
      servico.criar({
        medicamentoId: 'medicamento-2',
        agendamentoId: 'agendamento-1',
        tipo: 'alerta_emitido'
      })
    ).rejects.toMatchObject<Partial<ErroHttp>>({
      statusCode: 400,
      message: 'Campo medicamentoId deve pertencer ao agendamento informado'
    });
  });

  it('deve rejeitar dados que nao sejam objeto JSON', async () => {
    const { servico } = criarServico();

    await expect(
      servico.criar({
        medicamentoId: 'medicamento-1',
        tipo: 'falha',
        dados: ['valor-invalido']
      })
    ).rejects.toMatchObject<Partial<ErroHttp>>({
      statusCode: 400,
      message: 'Campo dados deve ser um objeto JSON'
    });
  });
});
