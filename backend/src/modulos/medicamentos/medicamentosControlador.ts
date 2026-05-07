import type { Request, RequestHandler, Response } from 'express';

import { ErroHttp } from '../../erros/ErroHttp.js';
import type { MedicamentosServicoContrato } from './medicamentosTipos.js';

export class MedicamentosControlador {
  constructor(private readonly servico: MedicamentosServicoContrato) {}

  public listar: RequestHandler = async (_req: Request, res: Response) => {
    const medicamentos = await this.servico.listar();

    res.status(200).json(medicamentos);
  };

  public buscarPorId: RequestHandler = async (req: Request, res: Response) => {
    const medicamento = await this.servico.buscarPorId(this.obterId(req));

    res.status(200).json(medicamento);
  };

  public criar: RequestHandler = async (req: Request, res: Response) => {
    const medicamento = await this.servico.criar(req.body);

    res.status(201).json(medicamento);
  };

  public atualizar: RequestHandler = async (req: Request, res: Response) => {
    const medicamento = await this.servico.atualizar(this.obterId(req), req.body);

    res.status(200).json(medicamento);
  };

  public remover: RequestHandler = async (req: Request, res: Response) => {
    await this.servico.remover(this.obterId(req));

    res.status(204).send();
  };

  private obterId(req: Request): string {
    const { id } = req.params;

    if (typeof id !== 'string' || !id.trim()) {
      throw new ErroHttp(400, 'Id do medicamento e obrigatorio');
    }

    return id;
  }
}
