import type { FindOptionsWhere, Repository } from 'typeorm';

import { AppDataSource } from '../../config/data-source.js';
import { AgendamentoMedicamento } from '../../entidades/AgendamentoMedicamento.js';
import { Medicamento } from '../../entidades/Medicamento.js';
import { ErroHttp } from '../../erros/ErroHttp.js';
import type {
  AgendamentoNormalizado,
  AgendamentosServicoContrato,
  AtualizarAgendamentoEntrada,
  CriarAgendamentoEntrada,
  ListarAgendamentosFiltros
} from './agendamentosTipos.js';

const diasSemanaPadrao = [0, 1, 2, 3, 4, 5, 6];
const regexHorario = /^([01]\d|2[0-3]):[0-5]\d$/;
const regexData = /^\d{4}-\d{2}-\d{2}$/;
const tamanhoMaximoCuidados = 1000;

export class AgendamentosServico implements AgendamentosServicoContrato {
  constructor(
    private readonly agendamentosRepositorio: Repository<AgendamentoMedicamento>,
    private readonly medicamentosRepositorio: Repository<Medicamento>
  ) {}

  public async listar(
    filtros: ListarAgendamentosFiltros = {}
  ): Promise<AgendamentoMedicamento[]> {
    const where: FindOptionsWhere<AgendamentoMedicamento> = { ativo: true };

    if (filtros.medicamentoId) {
      where.medicamentoId = filtros.medicamentoId;
    }

    return this.agendamentosRepositorio.find({
      where,
      order: {
        medicamentoId: 'ASC',
        criadoEm: 'ASC'
      }
    });
  }

  public async buscarPorId(id: string): Promise<AgendamentoMedicamento> {
    const agendamento = await this.agendamentosRepositorio.findOne({
      where: { id, ativo: true }
    });

    if (!agendamento) {
      throw new ErroHttp(404, 'Agendamento nao encontrado');
    }

    return agendamento;
  }

  public async criar(
    entrada: CriarAgendamentoEntrada
  ): Promise<AgendamentoMedicamento> {
    const dados = await this.normalizarAgendamento(entrada);
    const agendamento = this.agendamentosRepositorio.create(dados);

    return this.agendamentosRepositorio.save(agendamento);
  }

  public async atualizar(
    id: string,
    entrada: AtualizarAgendamentoEntrada
  ): Promise<AgendamentoMedicamento> {
    const agendamento = await this.buscarPorId(id);
    const dados = await this.normalizarAgendamento(entrada, agendamento);

    Object.assign(agendamento, dados);

    return this.agendamentosRepositorio.save(agendamento);
  }

  public async remover(id: string): Promise<void> {
    const agendamento = await this.buscarPorId(id);
    agendamento.ativo = false;

    await this.agendamentosRepositorio.save(agendamento);
  }

  private async normalizarAgendamento(
    entrada: CriarAgendamentoEntrada | AtualizarAgendamentoEntrada,
    agendamentoAtual?: AgendamentoMedicamento
  ): Promise<AgendamentoNormalizado> {
    const medicamentoId = this.validarTextoObrigatorio(
      'medicamentoId',
      entrada.medicamentoId ?? agendamentoAtual?.medicamentoId,
      80
    );

    await this.garantirMedicamentoAtivo(medicamentoId);

    const tipo = this.validarTipo(entrada.tipo ?? agendamentoAtual?.tipo);
    const diasSemana = this.validarDiasSemana(
      entrada.diasSemana ?? agendamentoAtual?.diasSemana ?? diasSemanaPadrao
    );
    const inicioEm = this.validarDataOpcional(
      'inicioEm',
      entrada.inicioEm ?? agendamentoAtual?.inicioEm ?? null
    );
    const fimEm = this.validarDataOpcional(
      'fimEm',
      entrada.fimEm ?? agendamentoAtual?.fimEm ?? null
    );

    this.validarPeriodo(inicioEm, fimEm);

    const toleranciaMinutos = this.validarInteiro(
      'toleranciaMinutos',
      entrada.toleranciaMinutos ??
        agendamentoAtual?.toleranciaMinutos ??
        30,
      0,
      240
    );

    return {
      medicamentoId,
      tipo,
      diasSemana,
      ...this.validarRegraFrequencia(tipo, entrada, agendamentoAtual),
      inicioEm,
      fimEm,
      toleranciaMinutos,
      cuidados: this.validarTextoOpcional(
        'cuidados',
        entrada.cuidados ?? agendamentoAtual?.cuidados ?? null,
        tamanhoMaximoCuidados
      ),
      ativo: this.validarBooleano(
        'ativo',
        (entrada as AtualizarAgendamentoEntrada).ativo ??
          agendamentoAtual?.ativo ??
          true
      )
    };
  }

  private validarRegraFrequencia(
    tipo: string,
    entrada: CriarAgendamentoEntrada | AtualizarAgendamentoEntrada,
    agendamentoAtual?: AgendamentoMedicamento
  ): Pick<
    AgendamentoNormalizado,
    'horarios' | 'intervaloHoras' | 'horarioInicio'
  > {
    if (tipo === 'horarios_fixos') {
      return {
        horarios: this.validarHorarios(
          entrada.horarios ?? agendamentoAtual?.horarios
        ),
        intervaloHoras: null,
        horarioInicio: null
      };
    }

    return {
      horarios: null,
      intervaloHoras: this.validarInteiro(
        'intervaloHoras',
        entrada.intervaloHoras ?? agendamentoAtual?.intervaloHoras,
        1,
        24
      ),
      horarioInicio: this.validarHorario(
        'horarioInicio',
        entrada.horarioInicio ?? agendamentoAtual?.horarioInicio
      )
    };
  }

  private async garantirMedicamentoAtivo(medicamentoId: string): Promise<void> {
    const medicamento = await this.medicamentosRepositorio.findOne({
      where: { id: medicamentoId, ativo: true }
    });

    if (!medicamento) {
      throw new ErroHttp(404, 'Medicamento nao encontrado para agendamento');
    }
  }

  private validarTipo(valor: unknown): 'horarios_fixos' | 'intervalo' {
    if (valor === 'horarios_fixos' || valor === 'intervalo') {
      return valor;
    }

    throw new ErroHttp(
      400,
      'Campo tipo deve ser horarios_fixos ou intervalo'
    );
  }

  private validarDiasSemana(valor: unknown): number[] {
    if (!Array.isArray(valor) || valor.length === 0) {
      throw new ErroHttp(400, 'Campo diasSemana deve ter pelo menos um dia');
    }

    const dias = valor.map((dia) =>
      this.validarInteiro('diasSemana', dia, 0, 6)
    );

    return [...new Set(dias)].sort((a, b) => a - b);
  }

  private validarHorarios(valor: unknown): string[] {
    if (!Array.isArray(valor) || valor.length === 0) {
      throw new ErroHttp(400, 'Campo horarios deve ter pelo menos um horario');
    }

    const horarios = valor.map((horario) =>
      this.validarHorario('horarios', horario)
    );

    return [...new Set(horarios)].sort();
  }

  private validarHorario(campo: string, valor: unknown): string {
    if (typeof valor !== 'string' || !regexHorario.test(valor)) {
      throw new ErroHttp(400, `Campo ${campo} deve estar no formato HH:mm`);
    }

    return valor;
  }

  private validarDataOpcional(campo: string, valor: unknown): string | null {
    if (valor === undefined || valor === null || valor === '') {
      return null;
    }

    if (typeof valor !== 'string' || !regexData.test(valor)) {
      throw new ErroHttp(400, `Campo ${campo} deve estar no formato YYYY-MM-DD`);
    }

    const data = new Date(`${valor}T00:00:00.000Z`);

    if (Number.isNaN(data.getTime()) || valor !== data.toISOString().slice(0, 10)) {
      throw new ErroHttp(400, `Campo ${campo} deve ser uma data valida`);
    }

    return valor;
  }

  private validarPeriodo(inicioEm: string | null, fimEm: string | null): void {
    if (inicioEm && fimEm && fimEm < inicioEm) {
      throw new ErroHttp(400, 'Campo fimEm deve ser maior ou igual a inicioEm');
    }
  }

  private validarTextoObrigatorio(
    campo: string,
    valor: unknown,
    tamanhoMaximo: number
  ): string {
    if (typeof valor !== 'string') {
      throw new ErroHttp(400, `Campo ${campo} e obrigatorio`);
    }

    const valorNormalizado = valor.trim();

    if (!valorNormalizado) {
      throw new ErroHttp(400, `Campo ${campo} e obrigatorio`);
    }

    if (valorNormalizado.length > tamanhoMaximo) {
      throw new ErroHttp(
        400,
        `Campo ${campo} deve ter no maximo ${tamanhoMaximo} caracteres`
      );
    }

    return valorNormalizado;
  }

  private validarTextoOpcional(
    campo: string,
    valor: unknown,
    tamanhoMaximo: number
  ): string | null {
    if (valor === undefined || valor === null) {
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

  private validarInteiro(
    campo: string,
    valor: unknown,
    minimo: number,
    maximo: number
  ): number {
    if (typeof valor !== 'number' || !Number.isInteger(valor)) {
      throw new ErroHttp(400, `Campo ${campo} deve ser um numero inteiro`);
    }

    if (valor < minimo || valor > maximo) {
      throw new ErroHttp(
        400,
        `Campo ${campo} deve estar entre ${minimo} e ${maximo}`
      );
    }

    return valor;
  }

  private validarBooleano(campo: string, valor: unknown): boolean {
    if (typeof valor !== 'boolean') {
      throw new ErroHttp(400, `Campo ${campo} deve ser booleano`);
    }

    return valor;
  }
}

export function criarAgendamentosServico(): AgendamentosServico {
  return new AgendamentosServico(
    AppDataSource.getRepository(AgendamentoMedicamento),
    AppDataSource.getRepository(Medicamento)
  );
}
