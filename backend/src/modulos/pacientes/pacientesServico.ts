import type { Repository } from 'typeorm';

import { AppDataSource } from '../../config/data-source.js';
import { Paciente } from '../../entidades/Paciente.js';
import { PacienteResponsavel } from '../../entidades/PacienteResponsavel.js';
import { Usuario } from '../../entidades/Usuario.js';
import { ErroHttp } from '../../erros/ErroHttp.js';
import type {
  AtualizarPacienteEntrada,
  CriarPacienteEntrada,
  PacienteNormalizado,
  PacientesServicoContrato,
  VincularResponsavelEntrada,
  VinculoResponsavelNormalizado
} from './pacientesTipos.js';

const regexData = /^\d{4}-\d{2}-\d{2}$/;
const tamanhoMaximoTexto = 120;
const tamanhoMaximoParentesco = 80;
const tamanhoMaximoObservacoes = 1000;

export class PacientesServico implements PacientesServicoContrato {
  constructor(
    private readonly pacientesRepositorio: Repository<Paciente>,
    private readonly usuariosRepositorio: Repository<Usuario>,
    private readonly pacientesResponsaveisRepositorio: Repository<PacienteResponsavel>
  ) {}

  public async listar(): Promise<Paciente[]> {
    return this.pacientesRepositorio.find({
      where: { ativo: true },
      order: { nome: 'ASC' }
    });
  }

  public async buscarPorId(id: string): Promise<Paciente> {
    const paciente = await this.pacientesRepositorio.findOne({
      where: { id, ativo: true }
    });

    if (!paciente) {
      throw new ErroHttp(404, 'Paciente nao encontrado');
    }

    return paciente;
  }

  public async criar(entrada: CriarPacienteEntrada): Promise<Paciente> {
    const dados = await this.normalizarPaciente(entrada);
    await this.validarUsuarioPaciente(dados.usuarioId);

    const paciente = this.pacientesRepositorio.create(dados);

    return this.pacientesRepositorio.save(paciente);
  }

  public async atualizar(
    id: string,
    entrada: AtualizarPacienteEntrada
  ): Promise<Paciente> {
    const paciente = await this.buscarPorId(id);
    const dados = await this.normalizarPaciente(entrada, paciente);

    await this.validarUsuarioPaciente(dados.usuarioId, paciente.id);
    Object.assign(paciente, dados);

    return this.pacientesRepositorio.save(paciente);
  }

  public async remover(id: string): Promise<void> {
    const paciente = await this.buscarPorId(id);
    paciente.ativo = false;

    await this.pacientesRepositorio.save(paciente);
  }

  public async listarResponsaveis(
    pacienteId: string
  ): Promise<PacienteResponsavel[]> {
    await this.buscarPorId(pacienteId);

    return this.pacientesResponsaveisRepositorio.find({
      where: { pacienteId, ativo: true },
      relations: { responsavel: true },
      order: { criadoEm: 'ASC' }
    });
  }

  public async vincularResponsavel(
    pacienteId: string,
    entrada: VincularResponsavelEntrada
  ): Promise<PacienteResponsavel> {
    await this.buscarPorId(pacienteId);
    const dados = await this.normalizarVinculoResponsavel(pacienteId, entrada);
    const vinculoExistente = await this.pacientesResponsaveisRepositorio.findOne({
      where: {
        pacienteId: dados.pacienteId,
        responsavelId: dados.responsavelId
      }
    });

    if (vinculoExistente) {
      Object.assign(vinculoExistente, dados);
      return this.pacientesResponsaveisRepositorio.save(vinculoExistente);
    }

    const vinculo = this.pacientesResponsaveisRepositorio.create(dados);

    return this.pacientesResponsaveisRepositorio.save(vinculo);
  }

  public async removerResponsavel(
    pacienteId: string,
    responsavelId: string
  ): Promise<void> {
    await this.buscarPorId(pacienteId);

    const vinculo = await this.pacientesResponsaveisRepositorio.findOne({
      where: { pacienteId, responsavelId, ativo: true }
    });

    if (!vinculo) {
      throw new ErroHttp(404, 'Responsavel nao vinculado ao paciente');
    }

    vinculo.ativo = false;
    await this.pacientesResponsaveisRepositorio.save(vinculo);
  }

  private async normalizarPaciente(
    entrada: CriarPacienteEntrada | AtualizarPacienteEntrada,
    pacienteAtual?: Paciente
  ): Promise<PacienteNormalizado> {
    return {
      usuarioId: this.validarTextoOpcional(
        'usuarioId',
        entrada.usuarioId === undefined
          ? pacienteAtual?.usuarioId ?? null
          : entrada.usuarioId,
        tamanhoMaximoTexto
      ),
      nome: this.validarTextoObrigatorio(
        'nome',
        entrada.nome ?? pacienteAtual?.nome,
        tamanhoMaximoTexto
      ),
      dataNascimento: this.validarDataOpcional(
        'dataNascimento',
        entrada.dataNascimento === undefined
          ? pacienteAtual?.dataNascimento ?? null
          : entrada.dataNascimento
      ),
      observacoes: this.validarTextoOpcional(
        'observacoes',
        entrada.observacoes === undefined
          ? pacienteAtual?.observacoes ?? null
          : entrada.observacoes,
        tamanhoMaximoObservacoes
      ),
      ativo: this.validarBooleano(
        'ativo',
        (entrada as AtualizarPacienteEntrada).ativo ?? pacienteAtual?.ativo ?? true
      )
    };
  }

  private async normalizarVinculoResponsavel(
    pacienteId: string,
    entrada: VincularResponsavelEntrada
  ): Promise<VinculoResponsavelNormalizado> {
    const responsavelId = this.validarTextoObrigatorio(
      'responsavelId',
      entrada.responsavelId,
      tamanhoMaximoTexto
    );

    await this.validarUsuarioResponsavel(responsavelId);

    return {
      pacienteId,
      responsavelId,
      parentesco: this.validarTextoOpcional(
        'parentesco',
        entrada.parentesco,
        tamanhoMaximoParentesco
      ),
      recebeNotificacoes: this.validarBooleano(
        'recebeNotificacoes',
        entrada.recebeNotificacoes ?? true
      ),
      ativo: true
    };
  }

  private async validarUsuarioPaciente(
    usuarioId: string | null,
    pacienteIdAtual?: string
  ): Promise<void> {
    if (!usuarioId) {
      return;
    }

    const usuario = await this.usuariosRepositorio.findOne({
      where: { id: usuarioId, ativo: true }
    });

    if (!usuario || usuario.tipo !== 'paciente') {
      throw new ErroHttp(404, 'Usuario paciente nao encontrado');
    }

    const pacienteComUsuario = await this.pacientesRepositorio.findOne({
      where: { usuarioId }
    });

    if (pacienteComUsuario && pacienteComUsuario.id !== pacienteIdAtual) {
      throw new ErroHttp(409, 'Usuario ja esta vinculado a outro paciente');
    }
  }

  private async validarUsuarioResponsavel(responsavelId: string): Promise<void> {
    const responsavel = await this.usuariosRepositorio.findOne({
      where: { id: responsavelId, ativo: true }
    });

    if (!responsavel || responsavel.tipo !== 'responsavel') {
      throw new ErroHttp(404, 'Usuario responsavel nao encontrado');
    }
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

  private validarBooleano(campo: string, valor: unknown): boolean {
    if (typeof valor !== 'boolean') {
      throw new ErroHttp(400, `Campo ${campo} deve ser booleano`);
    }

    return valor;
  }
}

export function criarPacientesServico(): PacientesServico {
  return new PacientesServico(
    AppDataSource.getRepository(Paciente),
    AppDataSource.getRepository(Usuario),
    AppDataSource.getRepository(PacienteResponsavel)
  );
}
