import type { FindOptionsWhere, Repository } from 'typeorm';

import { AppDataSource } from '../../config/data-source.js';
import { AgendamentoMedicamento } from '../../entidades/AgendamentoMedicamento.js';
import {
  EventoMedicamento,
  type OrigemEventoMedicamento,
  type TipoEventoMedicamento
} from '../../entidades/EventoMedicamento.js';
import { Medicamento } from '../../entidades/Medicamento.js';
import { ErroHttp } from '../../erros/ErroHttp.js';
import type {
  CriarEventoEntrada,
  EventoNormalizado,
  EventosServicoContrato,
  ListarEventosFiltros
} from './eventosTipos.js';

const tiposEvento: TipoEventoMedicamento[] = [
  'alerta_emitido',
  'compartimento_aberto',
  'medicamento_retirado',
  'atraso',
  'falha'
];

const origensEvento: OrigemEventoMedicamento[] = ['backend', 'mobile', 'iot'];
const tamanhoMaximoTexto = 120;
const tamanhoMaximoDescricao = 1000;

export class EventosServico implements EventosServicoContrato {
  constructor(
    private readonly eventosRepositorio: Repository<EventoMedicamento>,
    private readonly medicamentosRepositorio: Repository<Medicamento>,
    private readonly agendamentosRepositorio: Repository<AgendamentoMedicamento>
  ) {}

  public async listar(
    filtros: ListarEventosFiltros = {}
  ): Promise<EventoMedicamento[]> {
    const where: FindOptionsWhere<EventoMedicamento> = {};

    if (filtros.medicamentoId) {
      where.medicamentoId = filtros.medicamentoId;
    }

    if (filtros.agendamentoId) {
      where.agendamentoId = filtros.agendamentoId;
    }

    if (filtros.dispositivoId) {
      where.dispositivoId = filtros.dispositivoId;
    }

    if (filtros.tipo) {
      where.tipo = this.validarTipo(filtros.tipo);
    }

    if (filtros.origem) {
      where.origem = this.validarOrigem(filtros.origem);
    }

    return this.eventosRepositorio.find({
      where,
      order: {
        ocorridoEm: 'DESC',
        criadoEm: 'DESC'
      }
    });
  }

  public async buscarPorId(id: string): Promise<EventoMedicamento> {
    const evento = await this.eventosRepositorio.findOne({
      where: { id }
    });

    if (!evento) {
      throw new ErroHttp(404, 'Evento nao encontrado');
    }

    return evento;
  }

  public async criar(entrada: CriarEventoEntrada): Promise<EventoMedicamento> {
    const dados = await this.normalizarEvento(entrada);
    const evento = this.eventosRepositorio.create(dados);

    return this.eventosRepositorio.save(evento);
  }

  private async normalizarEvento(
    entrada: CriarEventoEntrada
  ): Promise<EventoNormalizado> {
    const agendamento = await this.obterAgendamentoAtivo(
      entrada.agendamentoId
    );
    const medicamentoId = await this.obterMedicamentoIdValidado(
      entrada.medicamentoId,
      agendamento
    );

    return {
      medicamentoId,
      agendamentoId: agendamento?.id ?? null,
      dispositivoId: this.validarTextoOpcional(
        'dispositivoId',
        entrada.dispositivoId,
        tamanhoMaximoTexto
      ),
      tipo: this.validarTipo(entrada.tipo),
      origem: this.validarOrigem(entrada.origem ?? 'backend'),
      ocorridoEm: this.validarDataHoraOpcional(
        'ocorridoEm',
        entrada.ocorridoEm
      ),
      descricao: this.validarTextoOpcional(
        'descricao',
        entrada.descricao,
        tamanhoMaximoDescricao
      ),
      dados: this.validarDados(entrada.dados)
    };
  }

  private async obterAgendamentoAtivo(
    valor: unknown
  ): Promise<AgendamentoMedicamento | null> {
    const agendamentoId = this.validarTextoOpcional(
      'agendamentoId',
      valor,
      tamanhoMaximoTexto
    );

    if (!agendamentoId) {
      return null;
    }

    const agendamento = await this.agendamentosRepositorio.findOne({
      where: { id: agendamentoId, ativo: true }
    });

    if (!agendamento) {
      throw new ErroHttp(404, 'Agendamento nao encontrado para evento');
    }

    return agendamento;
  }

  private async obterMedicamentoIdValidado(
    valor: unknown,
    agendamento: AgendamentoMedicamento | null
  ): Promise<string | null> {
    const medicamentoId = this.validarTextoOpcional(
      'medicamentoId',
      valor,
      tamanhoMaximoTexto
    );

    if (agendamento && medicamentoId && agendamento.medicamentoId !== medicamentoId) {
      throw new ErroHttp(
        400,
        'Campo medicamentoId deve pertencer ao agendamento informado'
      );
    }

    const idFinal = medicamentoId ?? agendamento?.medicamentoId ?? null;

    if (!idFinal) {
      return null;
    }

    const medicamento = await this.medicamentosRepositorio.findOne({
      where: { id: idFinal, ativo: true }
    });

    if (!medicamento) {
      throw new ErroHttp(404, 'Medicamento nao encontrado para evento');
    }

    return idFinal;
  }

  private validarTipo(valor: unknown): TipoEventoMedicamento {
    if (typeof valor === 'string' && this.eTipoEvento(valor)) {
      return valor;
    }

    throw new ErroHttp(
      400,
      `Campo tipo deve ser um destes valores: ${tiposEvento.join(', ')}`
    );
  }

  private validarOrigem(valor: unknown): OrigemEventoMedicamento {
    if (typeof valor === 'string' && this.eOrigemEvento(valor)) {
      return valor;
    }

    throw new ErroHttp(
      400,
      `Campo origem deve ser um destes valores: ${origensEvento.join(', ')}`
    );
  }

  private validarDataHoraOpcional(campo: string, valor: unknown): Date {
    if (valor === undefined || valor === null || valor === '') {
      return new Date();
    }

    if (typeof valor !== 'string') {
      throw new ErroHttp(400, `Campo ${campo} deve ser texto em ISO 8601`);
    }

    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) {
      throw new ErroHttp(400, `Campo ${campo} deve ser uma data/hora valida`);
    }

    return data;
  }

  private validarTextoOpcional(
    campo: string,
    valor: unknown,
    tamanhoMaximo: number
  ): string | null {
    if (valor === undefined || valor === null || valor === '') {
      return null;
    }

    if (typeof valor !== 'string') {
      throw new ErroHttp(400, `Campo ${campo} deve ser texto`);
    }

    const valorNormalizado = valor.trim();

    if (!valorNormalizado) {
      return null;
    }

    if (valorNormalizado.length > tamanhoMaximo) {
      throw new ErroHttp(
        400,
        `Campo ${campo} deve ter no maximo ${tamanhoMaximo} caracteres`
      );
    }

    return valorNormalizado;
  }

  private validarDados(valor: unknown): Record<string, unknown> | null {
    if (valor === undefined || valor === null) {
      return null;
    }

    if (
      typeof valor !== 'object' ||
      Array.isArray(valor) ||
      valor instanceof Date
    ) {
      throw new ErroHttp(400, 'Campo dados deve ser um objeto JSON');
    }

    return valor as Record<string, unknown>;
  }

  private eTipoEvento(valor: string): valor is TipoEventoMedicamento {
    return tiposEvento.includes(valor as TipoEventoMedicamento);
  }

  private eOrigemEvento(valor: string): valor is OrigemEventoMedicamento {
    return origensEvento.includes(valor as OrigemEventoMedicamento);
  }
}

export function criarEventosServico(): EventosServico {
  return new EventosServico(
    AppDataSource.getRepository(EventoMedicamento),
    AppDataSource.getRepository(Medicamento),
    AppDataSource.getRepository(AgendamentoMedicamento)
  );
}
