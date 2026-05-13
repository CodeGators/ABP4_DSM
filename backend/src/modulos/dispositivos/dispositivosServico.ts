import type { FindOptionsWhere, Repository } from 'typeorm';

import { AppDataSource } from '../../config/data-source.js';
import {
  Compartimento,
  type StatusCompartimento
} from '../../entidades/Compartimento.js';
import { Dispositivo } from '../../entidades/Dispositivo.js';
import { Medicamento } from '../../entidades/Medicamento.js';
import { Paciente } from '../../entidades/Paciente.js';
import { ErroHttp } from '../../erros/ErroHttp.js';
import type {
  AtualizarCompartimentoEntrada,
  AtualizarDispositivoEntrada,
  CompartimentoNormalizado,
  CriarCompartimentoEntrada,
  CriarDispositivoEntrada,
  DispositivoNormalizado,
  DispositivosServicoContrato,
  ListarDispositivosFiltros
} from './dispositivosTipos.js';

const statusCompartimento: StatusCompartimento[] = [
  'bloqueado',
  'liberado',
  'aberto',
  'erro'
];
const tamanhoMaximoTexto = 120;
const tamanhoMaximoObservacoes = 1000;

export class DispositivosServico implements DispositivosServicoContrato {
  constructor(
    private readonly dispositivosRepositorio: Repository<Dispositivo>,
    private readonly compartimentosRepositorio: Repository<Compartimento>,
    private readonly pacientesRepositorio: Repository<Paciente>,
    private readonly medicamentosRepositorio: Repository<Medicamento>
  ) {}

  public async listar(
    filtros: ListarDispositivosFiltros = {}
  ): Promise<Dispositivo[]> {
    const where: FindOptionsWhere<Dispositivo> = { ativo: true };

    if (filtros.pacienteId) {
      where.pacienteId = filtros.pacienteId;
    }

    return this.dispositivosRepositorio.find({
      where,
      order: { nome: 'ASC' }
    });
  }

  public async buscarPorId(id: string): Promise<Dispositivo> {
    const dispositivo = await this.dispositivosRepositorio.findOne({
      where: { id, ativo: true }
    });

    if (!dispositivo) {
      throw new ErroHttp(404, 'Dispositivo nao encontrado');
    }

    return dispositivo;
  }

  public async criar(
    entrada: CriarDispositivoEntrada
  ): Promise<Dispositivo> {
    const dados = await this.normalizarDispositivo(entrada);
    await this.garantirPacienteAtivo(dados.pacienteId);
    await this.garantirIdentificadorDisponivel(dados.identificador);

    const dispositivo = this.dispositivosRepositorio.create(dados);

    return this.dispositivosRepositorio.save(dispositivo);
  }

  public async atualizar(
    id: string,
    entrada: AtualizarDispositivoEntrada
  ): Promise<Dispositivo> {
    const dispositivo = await this.buscarPorId(id);
    const dados = await this.normalizarDispositivo(entrada, dispositivo);

    await this.garantirPacienteAtivo(dados.pacienteId);

    if (dados.identificador !== dispositivo.identificador) {
      await this.garantirIdentificadorDisponivel(
        dados.identificador,
        dispositivo.id
      );
    }

    Object.assign(dispositivo, dados);

    return this.dispositivosRepositorio.save(dispositivo);
  }

  public async remover(id: string): Promise<void> {
    const dispositivo = await this.buscarPorId(id);
    dispositivo.ativo = false;

    await this.dispositivosRepositorio.save(dispositivo);
  }

  public async listarCompartimentos(
    dispositivoId: string
  ): Promise<Compartimento[]> {
    await this.buscarPorId(dispositivoId);

    return this.compartimentosRepositorio.find({
      where: { dispositivoId, ativo: true },
      order: { numero: 'ASC' }
    });
  }

  public async criarCompartimento(
    dispositivoId: string,
    entrada: CriarCompartimentoEntrada
  ): Promise<Compartimento> {
    await this.buscarPorId(dispositivoId);
    const dados = await this.normalizarCompartimento(dispositivoId, entrada);
    await this.garantirNumeroDisponivel(dispositivoId, dados.numero);

    const compartimento = this.compartimentosRepositorio.create(dados);

    return this.compartimentosRepositorio.save(compartimento);
  }

  public async atualizarCompartimento(
    dispositivoId: string,
    compartimentoId: string,
    entrada: AtualizarCompartimentoEntrada
  ): Promise<Compartimento> {
    await this.buscarPorId(dispositivoId);
    const compartimento = await this.buscarCompartimento(
      dispositivoId,
      compartimentoId
    );
    const dados = await this.normalizarCompartimento(
      dispositivoId,
      entrada,
      compartimento
    );

    if (dados.numero !== compartimento.numero) {
      await this.garantirNumeroDisponivel(
        dispositivoId,
        dados.numero,
        compartimento.id
      );
    }

    Object.assign(compartimento, dados);

    return this.compartimentosRepositorio.save(compartimento);
  }

  public async removerCompartimento(
    dispositivoId: string,
    compartimentoId: string
  ): Promise<void> {
    await this.buscarPorId(dispositivoId);
    const compartimento = await this.buscarCompartimento(
      dispositivoId,
      compartimentoId
    );
    compartimento.ativo = false;

    await this.compartimentosRepositorio.save(compartimento);
  }

  private async normalizarDispositivo(
    entrada: CriarDispositivoEntrada | AtualizarDispositivoEntrada,
    dispositivoAtual?: Dispositivo
  ): Promise<DispositivoNormalizado> {
    return {
      pacienteId: this.validarTextoObrigatorio(
        'pacienteId',
        entrada.pacienteId ?? dispositivoAtual?.pacienteId,
        tamanhoMaximoTexto
      ),
      nome: this.validarTextoObrigatorio(
        'nome',
        entrada.nome ?? dispositivoAtual?.nome,
        tamanhoMaximoTexto
      ),
      identificador: this.validarTextoObrigatorio(
        'identificador',
        entrada.identificador ?? dispositivoAtual?.identificador,
        tamanhoMaximoTexto
      ),
      modelo: this.validarTextoOpcional(
        'modelo',
        entrada.modelo ?? dispositivoAtual?.modelo ?? null,
        tamanhoMaximoTexto
      ),
      ultimoSinalEm: this.validarDataHoraOpcional(
        'ultimoSinalEm',
        entrada.ultimoSinalEm ?? dispositivoAtual?.ultimoSinalEm ?? null
      ),
      ativo: this.validarBooleano(
        'ativo',
        (entrada as AtualizarDispositivoEntrada).ativo ??
          dispositivoAtual?.ativo ??
          true
      )
    };
  }

  private async normalizarCompartimento(
    dispositivoId: string,
    entrada: CriarCompartimentoEntrada | AtualizarCompartimentoEntrada,
    compartimentoAtual?: Compartimento
  ): Promise<CompartimentoNormalizado> {
    const medicamentoId = this.validarTextoOpcional(
      'medicamentoId',
      entrada.medicamentoId === undefined
        ? compartimentoAtual?.medicamentoId ?? null
        : entrada.medicamentoId,
      tamanhoMaximoTexto
    );

    await this.garantirMedicamentoAtivo(medicamentoId);

    return {
      dispositivoId,
      numero: this.validarInteiro(
        'numero',
        entrada.numero ?? compartimentoAtual?.numero,
        1,
        99
      ),
      medicamentoId,
      status: this.validarStatus(
        entrada.status ?? compartimentoAtual?.status ?? 'bloqueado'
      ),
      observacoes: this.validarTextoOpcional(
        'observacoes',
        entrada.observacoes === undefined
          ? compartimentoAtual?.observacoes ?? null
          : entrada.observacoes,
        tamanhoMaximoObservacoes
      ),
      ativo: this.validarBooleano(
        'ativo',
        (entrada as AtualizarCompartimentoEntrada).ativo ??
          compartimentoAtual?.ativo ??
          true
      )
    };
  }

  private async buscarCompartimento(
    dispositivoId: string,
    compartimentoId: string
  ): Promise<Compartimento> {
    const compartimento = await this.compartimentosRepositorio.findOne({
      where: { id: compartimentoId, dispositivoId, ativo: true }
    });

    if (!compartimento) {
      throw new ErroHttp(404, 'Compartimento nao encontrado');
    }

    return compartimento;
  }

  private async garantirPacienteAtivo(pacienteId: string): Promise<void> {
    const paciente = await this.pacientesRepositorio.findOne({
      where: { id: pacienteId, ativo: true }
    });

    if (!paciente) {
      throw new ErroHttp(404, 'Paciente nao encontrado para dispositivo');
    }
  }

  private async garantirMedicamentoAtivo(
    medicamentoId: string | null
  ): Promise<void> {
    if (!medicamentoId) {
      return;
    }

    const medicamento = await this.medicamentosRepositorio.findOne({
      where: { id: medicamentoId, ativo: true }
    });

    if (!medicamento) {
      throw new ErroHttp(404, 'Medicamento nao encontrado para compartimento');
    }
  }

  private async garantirIdentificadorDisponivel(
    identificador: string,
    dispositivoIdAtual?: string
  ): Promise<void> {
    const dispositivo = await this.dispositivosRepositorio.findOne({
      where: { identificador }
    });

    if (dispositivo && dispositivo.id !== dispositivoIdAtual) {
      throw new ErroHttp(409, 'Identificador de dispositivo ja cadastrado');
    }
  }

  private async garantirNumeroDisponivel(
    dispositivoId: string,
    numero: number,
    compartimentoIdAtual?: string
  ): Promise<void> {
    const compartimento = await this.compartimentosRepositorio.findOne({
      where: { dispositivoId, numero, ativo: true }
    });

    if (compartimento && compartimento.id !== compartimentoIdAtual) {
      throw new ErroHttp(409, 'Numero de compartimento ja cadastrado no dispositivo');
    }
  }

  private validarStatus(valor: unknown): StatusCompartimento {
    if (typeof valor === 'string' && this.eStatusCompartimento(valor)) {
      return valor;
    }

    throw new ErroHttp(
      400,
      `Campo status deve ser um destes valores: ${statusCompartimento.join(', ')}`
    );
  }

  private validarDataHoraOpcional(campo: string, valor: unknown): Date | null {
    if (valor === undefined || valor === null || valor === '') {
      return null;
    }

    if (valor instanceof Date) {
      return Number.isNaN(valor.getTime()) ? null : valor;
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

  private eStatusCompartimento(valor: string): valor is StatusCompartimento {
    return statusCompartimento.includes(valor as StatusCompartimento);
  }
}

export function criarDispositivosServico(): DispositivosServico {
  return new DispositivosServico(
    AppDataSource.getRepository(Dispositivo),
    AppDataSource.getRepository(Compartimento),
    AppDataSource.getRepository(Paciente),
    AppDataSource.getRepository(Medicamento)
  );
}
