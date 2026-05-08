import type { Request, RequestHandler, Response } from 'express';

import { ErroHttp } from '../../erros/ErroHttp.js';
import type {
  AgendamentosServicoContrato,
  ListarAgendamentosFiltros
} from './agendamentosTipos.js';

export class AgendamentosControlador {
  constructor(private readonly servico: AgendamentosServicoContrato) {}

  public listar: RequestHandler = async (req: Request, res: Response) => {
    const agendamentos = await this.servico.listar(this.obterFiltros(req));

    res.status(200).json(agendamentos);
  };

  public buscarPorId: RequestHandler = async (req: Request, res: Response) => {
    const agendamento = await this.servico.buscarPorId(this.obterId(req));

    res.status(200).json(agendamento);
  };

  public criar: RequestHandler = async (req: Request, res: Response) => {
    const agendamento = await this.servico.criar(req.body);

    res.status(201).json(agendamento);
  };

  public atualizar: RequestHandler = async (req: Request, res: Response) => {
    const agendamento = await this.servico.atualizar(this.obterId(req), req.body);

    res.status(200).json(agendamento);
  };

  public remover: RequestHandler = async (req: Request, res: Response) => {
    await this.servico.remover(this.obterId(req));

    res.status(204).send();
  };

  private obterFiltros(req: Request): ListarAgendamentosFiltros {
    const { medicamentoId } = req.query;

    if (medicamentoId === undefined) {
      return {};
    }

    if (typeof medicamentoId !== 'string' || !medicamentoId.trim()) {
      throw new ErroHttp(400, 'Filtro medicamentoId deve ser texto');
    }

    return { medicamentoId };
  }

  private obterId(req: Request): string {
    const { id } = req.params;

    if (typeof id !== 'string' || !id.trim()) {
      throw new ErroHttp(400, 'Id do agendamento e obrigatorio');
    }

    return id;
  }
}
