import type { Request, RequestHandler, Response } from 'express';

import type { AutenticacaoServicoContrato } from './autenticacaoTipos.js';

export class AutenticacaoControlador {
  constructor(private readonly servico: AutenticacaoServicoContrato) {}

  public login: RequestHandler = async (req: Request, res: Response) => {
    const resposta = await this.servico.login(req.body);

    res.status(200).json(resposta);
  };
}
