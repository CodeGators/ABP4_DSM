import type { Repository } from 'typeorm';

import { AppDataSource } from '../../config/data-source.js';
import { Medicamento } from '../../entidades/Medicamento.js';
import { ErroHttp } from '../../erros/ErroHttp.js';
import type {
  AtualizarMedicamentoEntrada,
  CriarMedicamentoEntrada,
  MedicamentosServicoContrato
} from './medicamentosTipos.js';

const tamanhoMaximoObservacoes = 1000;

export class MedicamentosServico implements MedicamentosServicoContrato {
  constructor(private readonly repositorio: Repository<Medicamento>) {}

  public async listar(): Promise<Medicamento[]> {
    return this.repositorio.find({
      where: { ativo: true },
      order: { nome: 'ASC' }
    });
  }

  public async buscarPorId(id: string): Promise<Medicamento> {
    const medicamento = await this.repositorio.findOne({
      where: { id, ativo: true }
    });

    if (!medicamento) {
      throw new ErroHttp(404, 'Medicamento nao encontrado');
    }

    return medicamento;
  }

  public async criar(entrada: CriarMedicamentoEntrada): Promise<Medicamento> {
    const medicamento = this.repositorio.create({
      nome: this.validarTextoObrigatorio('nome', entrada.nome, 120),
      dosagem: this.validarTextoObrigatorio('dosagem', entrada.dosagem, 60),
      observacoes: this.validarObservacoes(entrada.observacoes),
      ativo: true
    });

    return this.repositorio.save(medicamento);
  }

  public async atualizar(
    id: string,
    entrada: AtualizarMedicamentoEntrada
  ): Promise<Medicamento> {
    const medicamento = await this.buscarPorId(id);

    if (entrada.nome !== undefined) {
      medicamento.nome = this.validarTextoObrigatorio('nome', entrada.nome, 120);
    }

    if (entrada.dosagem !== undefined) {
      medicamento.dosagem = this.validarTextoObrigatorio(
        'dosagem',
        entrada.dosagem,
        60
      );
    }

    if (entrada.observacoes !== undefined) {
      medicamento.observacoes = this.validarObservacoes(entrada.observacoes);
    }

    if (entrada.ativo !== undefined) {
      medicamento.ativo = this.validarBooleano('ativo', entrada.ativo);
    }

    return this.repositorio.save(medicamento);
  }

  public async remover(id: string): Promise<void> {
    const medicamento = await this.buscarPorId(id);
    medicamento.ativo = false;

    await this.repositorio.save(medicamento);
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

  private validarObservacoes(valor: unknown): string | null {
    if (valor === undefined || valor === null) {
      return null;
    }

    if (typeof valor !== 'string') {
      throw new ErroHttp(400, 'Campo observacoes deve ser texto');
    }

    const valorNormalizado = valor.trim();

    if (!valorNormalizado) {
      return null;
    }

    if (valorNormalizado.length > tamanhoMaximoObservacoes) {
      throw new ErroHttp(
        400,
        `Campo observacoes deve ter no maximo ${tamanhoMaximoObservacoes} caracteres`
      );
    }

    return valorNormalizado;
  }

  private validarBooleano(campo: string, valor: unknown): boolean {
    if (typeof valor !== 'boolean') {
      throw new ErroHttp(400, `Campo ${campo} deve ser booleano`);
    }

    return valor;
  }
}

export function criarMedicamentosServico(): MedicamentosServico {
  return new MedicamentosServico(AppDataSource.getRepository(Medicamento));
}
