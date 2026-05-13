import { Router } from 'express';

import { AutenticacaoControlador } from './autenticacaoControlador.js';
import { criarAutenticacaoServico } from './autenticacaoServico.js';
import type { AutenticacaoServicoContrato } from './autenticacaoTipos.js';

export function criarAutenticacaoRotas(
  servico: AutenticacaoServicoContrato = criarAutenticacaoServico()
): Router {
  const rotas = Router();
  const controlador = new AutenticacaoControlador(servico);

  rotas.post('/login', controlador.login);

  return rotas;
}
