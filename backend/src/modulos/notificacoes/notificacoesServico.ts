import type { FindOptionsWhere, Repository } from 'typeorm';

import { AppDataSource } from '../../config/data-source.js';
import { AgendamentoMedicamento } from '../../entidades/AgendamentoMedicamento.js';
import { Compartimento } from '../../entidades/Compartimento.js';
import { EventoMedicamento } from '../../entidades/EventoMedicamento.js';
import { Medicamento } from '../../entidades/Medicamento.js';
import {
  Notificacao,
  type StatusNotificacao
} from '../../entidades/Notificacao.js';
import { PacienteResponsavel } from '../../entidades/PacienteResponsavel.js';
import { ErroHttp } from '../../erros/ErroHttp.js';
import type {
  ListarNotificacoesFiltros,
  NotificacoesServicoContrato,
  ResultadoVerificacaoAtrasos,
  VerificarAtrasosEntrada
} from './notificacoesTipos.js';

type OcorrenciaAtraso = {
  agendamento: AgendamentoMedicamento;
  horarioPrevisto: Date;
  limiteEm: Date;
  chaveAtraso: string;
};

const statusNotificacao: StatusNotificacao[] = ['pendente', 'enviada', 'erro'];
const milissegundosPorMinuto = 60 * 1000;
const milissegundosPorHora = 60 * milissegundosPorMinuto;

export class NotificacoesServico implements NotificacoesServicoContrato {
  constructor(
    private readonly notificacoesRepositorio: Repository<Notificacao>,
    private readonly agendamentosRepositorio: Repository<AgendamentoMedicamento>,
    private readonly eventosRepositorio: Repository<EventoMedicamento>,
    private readonly compartimentosRepositorio: Repository<Compartimento>,
    private readonly responsaveisRepositorio: Repository<PacienteResponsavel>,
    private readonly medicamentosRepositorio: Repository<Medicamento>
  ) {}

  public async listar(
    filtros: ListarNotificacoesFiltros = {}
  ): Promise<Notificacao[]> {
    const where: FindOptionsWhere<Notificacao> = {};

    if (filtros.pacienteId) {
      where.pacienteId = filtros.pacienteId;
    }

    if (filtros.responsavelId) {
      where.responsavelId = filtros.responsavelId;
    }

    if (filtros.status) {
      where.status = this.validarStatus(filtros.status);
    }

    return this.notificacoesRepositorio.find({
      where,
      order: { criadoEm: 'DESC' }
    });
  }

  public async verificarAtrasos(
    entrada: VerificarAtrasosEntrada = {}
  ): Promise<ResultadoVerificacaoAtrasos> {
    const referenciaEm = this.validarReferencia(entrada.referenciaEm);
    const agendamentos = await this.agendamentosRepositorio.find({
      where: { ativo: true },
      order: { criadoEm: 'ASC' }
    });

    let atrasosDetectados = 0;
    let eventosCriados = 0;
    let notificacoesCriadas = 0;

    for (const agendamento of agendamentos) {
      const ocorrencias = this.obterOcorrenciasAtrasadas(
        agendamento,
        referenciaEm
      );

      for (const ocorrencia of ocorrencias) {
        if (await this.foiRetirado(ocorrencia, referenciaEm)) {
          continue;
        }

        if (await this.atrasoJaRegistrado(ocorrencia)) {
          continue;
        }

        atrasosDetectados += 1;

        const evento = await this.registrarEventoAtraso(ocorrencia);
        eventosCriados += 1;
        notificacoesCriadas += await this.notificarResponsaveis(
          ocorrencia,
          evento
        );
      }
    }

    return {
      referenciaEm: referenciaEm.toISOString(),
      atrasosDetectados,
      eventosCriados,
      notificacoesCriadas
    };
  }

  private obterOcorrenciasAtrasadas(
    agendamento: AgendamentoMedicamento,
    referenciaEm: Date
  ): OcorrenciaAtraso[] {
    if (!this.agendamentoValeNaData(agendamento, referenciaEm)) {
      return [];
    }

    return this.obterHorariosDoDia(agendamento, referenciaEm)
      .map((horarioPrevisto) => {
        const limiteEm = new Date(
          horarioPrevisto.getTime() +
            agendamento.toleranciaMinutos * milissegundosPorMinuto
        );

        return {
          agendamento,
          horarioPrevisto,
          limiteEm,
          chaveAtraso: `${agendamento.id}:${horarioPrevisto.toISOString()}`
        };
      })
      .filter((ocorrencia) => ocorrencia.limiteEm <= referenciaEm);
  }

  private agendamentoValeNaData(
    agendamento: AgendamentoMedicamento,
    referenciaEm: Date
  ): boolean {
    const dataReferencia = referenciaEm.toISOString().slice(0, 10);
    const diaSemana = referenciaEm.getUTCDay();

    if (!agendamento.diasSemana.includes(diaSemana)) {
      return false;
    }

    if (agendamento.inicioEm && dataReferencia < agendamento.inicioEm) {
      return false;
    }

    if (agendamento.fimEm && dataReferencia > agendamento.fimEm) {
      return false;
    }

    return true;
  }

  private obterHorariosDoDia(
    agendamento: AgendamentoMedicamento,
    referenciaEm: Date
  ): Date[] {
    const dataReferencia = referenciaEm.toISOString().slice(0, 10);

    if (agendamento.tipo === 'horarios_fixos') {
      return (agendamento.horarios ?? []).map((horario) =>
        this.criarDataHorario(dataReferencia, horario)
      );
    }

    if (!agendamento.horarioInicio || !agendamento.intervaloHoras) {
      return [];
    }

    const horarios: Date[] = [];
    const horarioInicial = this.criarDataHorario(
      dataReferencia,
      agendamento.horarioInicio
    );
    const fimDoDia = new Date(`${dataReferencia}T23:59:59.999Z`);

    for (
      let horario = horarioInicial;
      horario <= fimDoDia;
      horario = new Date(
        horario.getTime() + agendamento.intervaloHoras * milissegundosPorHora
      )
    ) {
      horarios.push(horario);
    }

    return horarios;
  }

  private async foiRetirado(
    ocorrencia: OcorrenciaAtraso,
    referenciaEm: Date
  ): Promise<boolean> {
    const eventos = await this.eventosRepositorio.find({
      where: { agendamentoId: ocorrencia.agendamento.id }
    });

    return eventos.some(
      (evento) =>
        evento.tipo === 'medicamento_retirado' &&
        evento.ocorridoEm >= ocorrencia.horarioPrevisto &&
        evento.ocorridoEm <= referenciaEm
    );
  }

  private async atrasoJaRegistrado(
    ocorrencia: OcorrenciaAtraso
  ): Promise<boolean> {
    const eventos = await this.eventosRepositorio.find({
      where: { agendamentoId: ocorrencia.agendamento.id }
    });

    return eventos.some(
      (evento) =>
        evento.tipo === 'atraso' &&
        evento.dados?.chaveAtraso === ocorrencia.chaveAtraso
    );
  }

  private async registrarEventoAtraso(
    ocorrencia: OcorrenciaAtraso
  ): Promise<EventoMedicamento> {
    const evento = this.eventosRepositorio.create({
      medicamentoId: ocorrencia.agendamento.medicamentoId,
      agendamentoId: ocorrencia.agendamento.id,
      dispositivoId: null,
      tipo: 'atraso',
      origem: 'backend',
      ocorridoEm: ocorrencia.limiteEm,
      descricao: 'Medicamento nao retirado dentro da tolerancia.',
      dados: {
        chaveAtraso: ocorrencia.chaveAtraso,
        horarioPrevisto: ocorrencia.horarioPrevisto.toISOString(),
        limiteEm: ocorrencia.limiteEm.toISOString(),
        toleranciaMinutos: ocorrencia.agendamento.toleranciaMinutos
      }
    });

    return this.eventosRepositorio.save(evento);
  }

  private async notificarResponsaveis(
    ocorrencia: OcorrenciaAtraso,
    evento: EventoMedicamento
  ): Promise<number> {
    const pacienteIds = await this.obterPacienteIdsPorMedicamento(
      ocorrencia.agendamento.medicamentoId
    );
    const medicamento = await this.medicamentosRepositorio.findOne({
      where: { id: ocorrencia.agendamento.medicamentoId, ativo: true }
    });
    let notificacoesCriadas = 0;

    for (const pacienteId of pacienteIds) {
      const responsaveis = await this.responsaveisRepositorio.find({
        where: { pacienteId, ativo: true, recebeNotificacoes: true }
      });

      for (const responsavel of responsaveis) {
        const notificacaoExistente = await this.notificacoesRepositorio.findOne({
          where: {
            eventoId: evento.id,
            responsavelId: responsavel.responsavelId
          }
        });

        if (notificacaoExistente) {
          continue;
        }

        const notificacao = this.notificacoesRepositorio.create({
          pacienteId,
          responsavelId: responsavel.responsavelId,
          medicamentoId: ocorrencia.agendamento.medicamentoId,
          agendamentoId: ocorrencia.agendamento.id,
          eventoId: evento.id,
          tipo: 'atraso_medicamento',
          canal: 'interno',
          status: 'enviada',
          titulo: 'Medicamento em atraso',
          mensagem: this.montarMensagemAtraso(
            medicamento,
            ocorrencia.horarioPrevisto
          ),
          enviadaEm: new Date(),
          lidaEm: null,
          dados: {
            chaveAtraso: ocorrencia.chaveAtraso,
            horarioPrevisto: ocorrencia.horarioPrevisto.toISOString(),
            limiteEm: ocorrencia.limiteEm.toISOString()
          }
        });

        await this.notificacoesRepositorio.save(notificacao);
        notificacoesCriadas += 1;
      }
    }

    return notificacoesCriadas;
  }

  private async obterPacienteIdsPorMedicamento(
    medicamentoId: string
  ): Promise<string[]> {
    const compartimentos = await this.compartimentosRepositorio.find({
      where: { medicamentoId, ativo: true },
      relations: { dispositivo: true }
    });
    const pacienteIds = compartimentos
      .map((compartimento) => compartimento.dispositivo?.pacienteId)
      .filter((pacienteId): pacienteId is string => Boolean(pacienteId));

    return [...new Set(pacienteIds)];
  }

  private montarMensagemAtraso(
    medicamento: Medicamento | null,
    horarioPrevisto: Date
  ): string {
    const nomeMedicamento = medicamento
      ? `${medicamento.nome} ${medicamento.dosagem}`
      : 'Medicamento';
    const horario = horarioPrevisto.toISOString().slice(11, 16);

    return `${nomeMedicamento} estava previsto para ${horario} e nao foi registrado como retirado.`;
  }

  private criarDataHorario(data: string, horario: string): Date {
    return new Date(`${data}T${horario}:00.000Z`);
  }

  private validarReferencia(valor: unknown): Date {
    if (valor === undefined || valor === null || valor === '') {
      return new Date();
    }

    if (typeof valor !== 'string') {
      throw new ErroHttp(400, 'Campo referenciaEm deve ser texto em ISO 8601');
    }

    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) {
      throw new ErroHttp(400, 'Campo referenciaEm deve ser uma data/hora valida');
    }

    return data;
  }

  private validarStatus(valor: unknown): StatusNotificacao {
    if (typeof valor === 'string' && this.eStatusNotificacao(valor)) {
      return valor;
    }

    throw new ErroHttp(
      400,
      `Filtro status deve ser um destes valores: ${statusNotificacao.join(', ')}`
    );
  }

  private eStatusNotificacao(valor: string): valor is StatusNotificacao {
    return statusNotificacao.includes(valor as StatusNotificacao);
  }
}

export function criarNotificacoesServico(): NotificacoesServico {
  return new NotificacoesServico(
    AppDataSource.getRepository(Notificacao),
    AppDataSource.getRepository(AgendamentoMedicamento),
    AppDataSource.getRepository(EventoMedicamento),
    AppDataSource.getRepository(Compartimento),
    AppDataSource.getRepository(PacienteResponsavel),
    AppDataSource.getRepository(Medicamento)
  );
}
