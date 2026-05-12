import type { Request, RequestHandler, Response } from 'express';

import { ErroHttp } from '../../erros/ErroHttp.js';
import type {
  EventosServicoContrato,
  ListarEventosFiltros
} from './eventosTipos.js';

export class EventosControlador {
  constructor(private readonly servico: EventosServicoContrato) {}

  public listar: RequestHandler = async (req: Request, res: Response) => {
    const eventos = await this.servico.listar(this.obterFiltros(req));

    res.status(200).json(eventos);
  };

  public buscarPorId: RequestHandler = async (req: Request, res: Response) => {
    const evento = await this.servico.buscarPorId(this.obterId(req));

    res.status(200).json(evento);
  };

  public criar: RequestHandler = async (req: Request, res: Response) => {
    const evento = await this.servico.criar(req.body);

    res.status(201).json(evento);
  };

  private obterFiltros(req: Request): ListarEventosFiltros {
    const filtros: ListarEventosFiltros = {};
    const campos: Array<keyof ListarEventosFiltros> = [
      'medicamentoId',
      'agendamentoId',
      'dispositivoId',
      'tipo',
      'origem'
    ];

    for (const campo of campos) {
      const valor = this.obterFiltroTexto(req, campo);

      if (valor !== undefined) {
        filtros[campo] = valor;
      }
    }

    return filtros;
  }

  private obterFiltroTexto(
    req: Request,
    campo: keyof ListarEventosFiltros
  ): string | undefined {
    const valor = req.query[campo];

    if (valor === undefined) {
      return undefined;
    }

    if (typeof valor !== 'string' || !valor.trim()) {
      throw new ErroHttp(400, `Filtro ${campo} deve ser texto`);
    }

    return valor.trim();
  }

  private obterId(req: Request): string {
    const { id } = req.params;

    if (typeof id !== 'string' || !id.trim()) {
      throw new ErroHttp(400, 'Id do evento e obrigatorio');
    }

    return id;
  }
}
