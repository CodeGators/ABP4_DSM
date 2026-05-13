import type { Request, RequestHandler, Response } from 'express';

import { ErroHttp } from '../../erros/ErroHttp.js';
import type {
  DispositivosServicoContrato,
  ListarDispositivosFiltros
} from './dispositivosTipos.js';

export class DispositivosControlador {
  constructor(private readonly servico: DispositivosServicoContrato) {}

  public listar: RequestHandler = async (req: Request, res: Response) => {
    const dispositivos = await this.servico.listar(this.obterFiltros(req));

    res.status(200).json(dispositivos);
  };

  public buscarPorId: RequestHandler = async (req: Request, res: Response) => {
    const dispositivo = await this.servico.buscarPorId(this.obterId(req));

    res.status(200).json(dispositivo);
  };

  public criar: RequestHandler = async (req: Request, res: Response) => {
    const dispositivo = await this.servico.criar(req.body);

    res.status(201).json(dispositivo);
  };

  public atualizar: RequestHandler = async (req: Request, res: Response) => {
    const dispositivo = await this.servico.atualizar(this.obterId(req), req.body);

    res.status(200).json(dispositivo);
  };

  public remover: RequestHandler = async (req: Request, res: Response) => {
    await this.servico.remover(this.obterId(req));

    res.status(204).send();
  };

  public listarCompartimentos: RequestHandler = async (
    req: Request,
    res: Response
  ) => {
    const compartimentos = await this.servico.listarCompartimentos(
      this.obterDispositivoId(req)
    );

    res.status(200).json(compartimentos);
  };

  public criarCompartimento: RequestHandler = async (
    req: Request,
    res: Response
  ) => {
    const compartimento = await this.servico.criarCompartimento(
      this.obterDispositivoId(req),
      req.body
    );

    res.status(201).json(compartimento);
  };

  public atualizarCompartimento: RequestHandler = async (
    req: Request,
    res: Response
  ) => {
    const compartimento = await this.servico.atualizarCompartimento(
      this.obterDispositivoId(req),
      this.obterCompartimentoId(req),
      req.body
    );

    res.status(200).json(compartimento);
  };

  public removerCompartimento: RequestHandler = async (
    req: Request,
    res: Response
  ) => {
    await this.servico.removerCompartimento(
      this.obterDispositivoId(req),
      this.obterCompartimentoId(req)
    );

    res.status(204).send();
  };

  private obterFiltros(req: Request): ListarDispositivosFiltros {
    const { pacienteId } = req.query;

    if (pacienteId === undefined) {
      return {};
    }

    if (typeof pacienteId !== 'string' || !pacienteId.trim()) {
      throw new ErroHttp(400, 'Filtro pacienteId deve ser texto');
    }

    return { pacienteId: pacienteId.trim() };
  }

  private obterId(req: Request): string {
    const { id } = req.params;

    if (typeof id !== 'string' || !id.trim()) {
      throw new ErroHttp(400, 'Id do dispositivo e obrigatorio');
    }

    return id;
  }

  private obterDispositivoId(req: Request): string {
    const { dispositivoId } = req.params;

    if (typeof dispositivoId !== 'string' || !dispositivoId.trim()) {
      throw new ErroHttp(400, 'Id do dispositivo e obrigatorio');
    }

    return dispositivoId;
  }

  private obterCompartimentoId(req: Request): string {
    const { compartimentoId } = req.params;

    if (typeof compartimentoId !== 'string' || !compartimentoId.trim()) {
      throw new ErroHttp(400, 'Id do compartimento e obrigatorio');
    }

    return compartimentoId;
  }
}
