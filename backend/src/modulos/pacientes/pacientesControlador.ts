import type { Request, RequestHandler, Response } from 'express';

import { ErroHttp } from '../../erros/ErroHttp.js';
import type { PacientesServicoContrato } from './pacientesTipos.js';

export class PacientesControlador {
  constructor(private readonly servico: PacientesServicoContrato) {}

  public listar: RequestHandler = async (_req: Request, res: Response) => {
    const pacientes = await this.servico.listar();

    res.status(200).json(pacientes);
  };

  public buscarPorId: RequestHandler = async (req: Request, res: Response) => {
    const paciente = await this.servico.buscarPorId(this.obterPacienteId(req));

    res.status(200).json(paciente);
  };

  public criar: RequestHandler = async (req: Request, res: Response) => {
    const paciente = await this.servico.criar(req.body);

    res.status(201).json(paciente);
  };

  public atualizar: RequestHandler = async (req: Request, res: Response) => {
    const paciente = await this.servico.atualizar(
      this.obterPacienteId(req),
      req.body
    );

    res.status(200).json(paciente);
  };

  public remover: RequestHandler = async (req: Request, res: Response) => {
    await this.servico.remover(this.obterPacienteId(req));

    res.status(204).send();
  };

  public listarResponsaveis: RequestHandler = async (
    req: Request,
    res: Response
  ) => {
    const responsaveis = await this.servico.listarResponsaveis(
      this.obterPacienteId(req)
    );

    res.status(200).json(responsaveis);
  };

  public vincularResponsavel: RequestHandler = async (
    req: Request,
    res: Response
  ) => {
    const vinculo = await this.servico.vincularResponsavel(
      this.obterPacienteId(req),
      req.body
    );

    res.status(201).json(vinculo);
  };

  public removerResponsavel: RequestHandler = async (
    req: Request,
    res: Response
  ) => {
    await this.servico.removerResponsavel(
      this.obterPacienteId(req),
      this.obterResponsavelId(req)
    );

    res.status(204).send();
  };

  private obterPacienteId(req: Request): string {
    const { id, pacienteId } = req.params;
    const valor = pacienteId ?? id;

    if (typeof valor !== 'string' || !valor.trim()) {
      throw new ErroHttp(400, 'Id do paciente e obrigatorio');
    }

    return valor;
  }

  private obterResponsavelId(req: Request): string {
    const { responsavelId } = req.params;

    if (typeof responsavelId !== 'string' || !responsavelId.trim()) {
      throw new ErroHttp(400, 'Id do responsavel e obrigatorio');
    }

    return responsavelId;
  }
}
