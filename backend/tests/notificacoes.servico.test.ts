import type { Repository } from 'typeorm';

import { AgendamentoMedicamento } from '../src/entidades/AgendamentoMedicamento.js';
import { Compartimento } from '../src/entidades/Compartimento.js';
import { Dispositivo } from '../src/entidades/Dispositivo.js';
import { EventoMedicamento } from '../src/entidades/EventoMedicamento.js';
import { Medicamento } from '../src/entidades/Medicamento.js';
import { Notificacao } from '../src/entidades/Notificacao.js';
import { PacienteResponsavel } from '../src/entidades/PacienteResponsavel.js';
import { NotificacoesServico } from '../src/modulos/notificacoes/notificacoesServico.js';

const dataFixa = new Date('2026-01-01T00:00:00.000Z');

class RepositorioNotificacoesMemoria {
  public notificacoes: Notificacao[] = [];

  public create(dados: Partial<Notificacao>): Notificacao {
    return Object.assign(new Notificacao(), {
      id: `notificacao-${this.notificacoes.length + 1}`,
      criadoEm: dataFixa,
      atualizadoEm: dataFixa,
      ...dados
    });
  }

  public async save(notificacao: Notificacao): Promise<Notificacao> {
    this.notificacoes.push(notificacao);

    return notificacao;
  }

  public async find(opcoes: { where: Partial<Notificacao> }): Promise<Notificacao[]> {
    return this.notificacoes.filter((notificacao) => {
      if (
        opcoes.where.pacienteId !== undefined &&
        notificacao.pacienteId !== opcoes.where.pacienteId
      ) {
        return false;
      }

      if (
        opcoes.where.responsavelId !== undefined &&
        notificacao.responsavelId !== opcoes.where.responsavelId
      ) {
        return false;
      }

      if (
        opcoes.where.status !== undefined &&
        notificacao.status !== opcoes.where.status
      ) {
        return false;
      }

      return true;
    });
  }

  public async findOne(opcoes: {
    where: Partial<Notificacao>;
  }): Promise<Notificacao | null> {
    return (
      this.notificacoes.find((notificacao) => {
        if (
          opcoes.where.eventoId !== undefined &&
          notificacao.eventoId !== opcoes.where.eventoId
        ) {
          return false;
        }

        if (
          opcoes.where.responsavelId !== undefined &&
          notificacao.responsavelId !== opcoes.where.responsavelId
        ) {
          return false;
        }

        return true;
      }) ?? null
    );
  }
}

class RepositorioAgendamentosMemoria {
  public agendamentos: AgendamentoMedicamento[] = [];

  public async find(opcoes: {
    where: Partial<AgendamentoMedicamento>;
  }): Promise<AgendamentoMedicamento[]> {
    return this.agendamentos.filter((agendamento) => {
      if (opcoes.where.ativo !== undefined && agendamento.ativo !== opcoes.where.ativo) {
        return false;
      }

      return true;
    });
  }
}

class RepositorioEventosMemoria {
  public eventos: EventoMedicamento[] = [];

  public create(dados: Partial<EventoMedicamento>): EventoMedicamento {
    return Object.assign(new EventoMedicamento(), {
      id: `evento-${this.eventos.length + 1}`,
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
        opcoes.where.agendamentoId !== undefined &&
        evento.agendamentoId !== opcoes.where.agendamentoId
      ) {
        return false;
      }

      return true;
    });
  }
}

class RepositorioCompartimentosMemoria {
  public compartimentos: Compartimento[] = [];

  public async find(opcoes: {
    where: Partial<Compartimento>;
  }): Promise<Compartimento[]> {
    return this.compartimentos.filter((compartimento) => {
      if (
        opcoes.where.medicamentoId !== undefined &&
        compartimento.medicamentoId !== opcoes.where.medicamentoId
      ) {
        return false;
      }

      if (opcoes.where.ativo !== undefined && compartimento.ativo !== opcoes.where.ativo) {
        return false;
      }

      return true;
    });
  }
}

class RepositorioResponsaveisMemoria {
  public responsaveis: PacienteResponsavel[] = [];

  public async find(opcoes: {
    where: Partial<PacienteResponsavel>;
  }): Promise<PacienteResponsavel[]> {
    return this.responsaveis.filter((responsavel) => {
      if (
        opcoes.where.pacienteId !== undefined &&
        responsavel.pacienteId !== opcoes.where.pacienteId
      ) {
        return false;
      }

      if (opcoes.where.ativo !== undefined && responsavel.ativo !== opcoes.where.ativo) {
        return false;
      }

      if (
        opcoes.where.recebeNotificacoes !== undefined &&
        responsavel.recebeNotificacoes !== opcoes.where.recebeNotificacoes
      ) {
        return false;
      }

      return true;
    });
  }
}

class RepositorioMedicamentosMemoria {
  public medicamentos: Medicamento[] = [];

  public async findOne(opcoes: {
    where: Partial<Medicamento>;
  }): Promise<Medicamento | null> {
    return (
      this.medicamentos.find((medicamento) => {
        if (opcoes.where.id !== undefined && medicamento.id !== opcoes.where.id) {
          return false;
        }

        if (
          opcoes.where.ativo !== undefined &&
          medicamento.ativo !== opcoes.where.ativo
        ) {
          return false;
        }

        return true;
      }) ?? null
    );
  }
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
    inicioEm: '2026-05-11',
    fimEm: null,
    toleranciaMinutos: 30,
    cuidados: null,
    ativo: true,
    criadoEm: dataFixa,
    atualizadoEm: dataFixa,
    ...sobrescritas
  });
}

function criarMedicamento(): Medicamento {
  return Object.assign(new Medicamento(), {
    id: 'medicamento-1',
    nome: 'Dipirona',
    dosagem: '500mg',
    observacoes: null,
    ativo: true,
    criadoEm: dataFixa,
    atualizadoEm: dataFixa
  });
}

function criarCompartimento(): Compartimento {
  return Object.assign(new Compartimento(), {
    id: 'compartimento-1',
    dispositivoId: 'dispositivo-1',
    dispositivo: Object.assign(new Dispositivo(), {
      id: 'dispositivo-1',
      pacienteId: 'paciente-1',
      nome: 'PillGator',
      identificador: 'pillgator-1',
      modelo: null,
      ultimoSinalEm: null,
      ativo: true,
      criadoEm: dataFixa,
      atualizadoEm: dataFixa
    }),
    numero: 1,
    medicamentoId: 'medicamento-1',
    medicamento: null,
    status: 'bloqueado',
    observacoes: null,
    ativo: true,
    criadoEm: dataFixa,
    atualizadoEm: dataFixa
  });
}

function criarResponsavel(
  sobrescritas: Partial<PacienteResponsavel> = {}
): PacienteResponsavel {
  return Object.assign(new PacienteResponsavel(), {
    id: 'vinculo-1',
    pacienteId: 'paciente-1',
    responsavelId: 'responsavel-1',
    parentesco: 'Filha',
    recebeNotificacoes: true,
    ativo: true,
    criadoEm: dataFixa,
    atualizadoEm: dataFixa,
    ...sobrescritas
  });
}

function criarServico() {
  const notificacoesRepositorio = new RepositorioNotificacoesMemoria();
  const agendamentosRepositorio = new RepositorioAgendamentosMemoria();
  const eventosRepositorio = new RepositorioEventosMemoria();
  const compartimentosRepositorio = new RepositorioCompartimentosMemoria();
  const responsaveisRepositorio = new RepositorioResponsaveisMemoria();
  const medicamentosRepositorio = new RepositorioMedicamentosMemoria();

  agendamentosRepositorio.agendamentos.push(criarAgendamento());
  compartimentosRepositorio.compartimentos.push(criarCompartimento());
  responsaveisRepositorio.responsaveis.push(criarResponsavel());
  medicamentosRepositorio.medicamentos.push(criarMedicamento());

  const servico = new NotificacoesServico(
    notificacoesRepositorio as unknown as Repository<Notificacao>,
    agendamentosRepositorio as unknown as Repository<AgendamentoMedicamento>,
    eventosRepositorio as unknown as Repository<EventoMedicamento>,
    compartimentosRepositorio as unknown as Repository<Compartimento>,
    responsaveisRepositorio as unknown as Repository<PacienteResponsavel>,
    medicamentosRepositorio as unknown as Repository<Medicamento>
  );

  return {
    agendamentosRepositorio,
    eventosRepositorio,
    notificacoesRepositorio,
    responsaveisRepositorio,
    servico
  };
}

describe('NotificacoesServico', () => {
  it('deve registrar atraso e notificar responsavel', async () => {
    const { eventosRepositorio, notificacoesRepositorio, servico } = criarServico();

    const resultado = await servico.verificarAtrasos({
      referenciaEm: '2026-05-11T09:00:00.000Z'
    });

    expect(resultado).toMatchObject({
      atrasosDetectados: 1,
      eventosCriados: 1,
      notificacoesCriadas: 1
    });
    expect(eventosRepositorio.eventos[0]).toMatchObject({
      tipo: 'atraso',
      origem: 'backend',
      agendamentoId: 'agendamento-1'
    });
    expect(notificacoesRepositorio.notificacoes[0]).toMatchObject({
      pacienteId: 'paciente-1',
      responsavelId: 'responsavel-1',
      status: 'enviada',
      tipo: 'atraso_medicamento'
    });
  });

  it('nao deve registrar atraso quando medicamento ja foi retirado', async () => {
    const { eventosRepositorio, notificacoesRepositorio, servico } = criarServico();
    eventosRepositorio.eventos.push(
      Object.assign(new EventoMedicamento(), {
        id: 'evento-retirada',
        medicamentoId: 'medicamento-1',
        agendamentoId: 'agendamento-1',
        dispositivoId: null,
        tipo: 'medicamento_retirado',
        origem: 'backend',
        ocorridoEm: new Date('2026-05-11T08:10:00.000Z'),
        descricao: null,
        dados: null,
        criadoEm: dataFixa
      })
    );

    const resultado = await servico.verificarAtrasos({
      referenciaEm: '2026-05-11T09:00:00.000Z'
    });

    expect(resultado).toMatchObject({
      atrasosDetectados: 0,
      eventosCriados: 0,
      notificacoesCriadas: 0
    });
    expect(notificacoesRepositorio.notificacoes).toHaveLength(0);
  });

  it('nao deve duplicar atraso ja registrado', async () => {
    const { eventosRepositorio, notificacoesRepositorio, servico } = criarServico();
    eventosRepositorio.eventos.push(
      Object.assign(new EventoMedicamento(), {
        id: 'evento-atraso',
        medicamentoId: 'medicamento-1',
        agendamentoId: 'agendamento-1',
        dispositivoId: null,
        tipo: 'atraso',
        origem: 'backend',
        ocorridoEm: new Date('2026-05-11T08:30:00.000Z'),
        descricao: 'Medicamento nao retirado dentro da tolerancia.',
        dados: {
          chaveAtraso: 'agendamento-1:2026-05-11T08:00:00.000Z'
        },
        criadoEm: dataFixa
      })
    );

    const resultado = await servico.verificarAtrasos({
      referenciaEm: '2026-05-11T09:00:00.000Z'
    });

    expect(resultado).toMatchObject({
      atrasosDetectados: 0,
      eventosCriados: 0,
      notificacoesCriadas: 0
    });
    expect(notificacoesRepositorio.notificacoes).toHaveLength(0);
  });

  it('deve listar notificacoes com filtros', async () => {
    const { notificacoesRepositorio, servico } = criarServico();
    notificacoesRepositorio.notificacoes.push(
      Object.assign(new Notificacao(), {
        id: 'notificacao-1',
        pacienteId: 'paciente-1',
        responsavelId: 'responsavel-1',
        medicamentoId: 'medicamento-1',
        agendamentoId: 'agendamento-1',
        eventoId: 'evento-1',
        tipo: 'atraso_medicamento',
        canal: 'interno',
        status: 'enviada',
        titulo: 'Medicamento em atraso',
        mensagem: 'Mensagem',
        enviadaEm: dataFixa,
        lidaEm: null,
        dados: null,
        criadoEm: dataFixa,
        atualizadoEm: dataFixa
      })
    );

    const notificacoes = await servico.listar({
      pacienteId: 'paciente-1',
      status: 'enviada'
    });

    expect(notificacoes).toHaveLength(1);
    expect(notificacoes[0]?.responsavelId).toBe('responsavel-1');
  });
});
