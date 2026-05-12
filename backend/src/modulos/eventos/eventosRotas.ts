import { Router } from 'express';

import { EventosControlador } from './eventosControlador.js';
import { criarEventosServico } from './eventosServico.js';
import type { EventosServicoContrato } from './eventosTipos.js';

export function criarEventosRotas(
  servico: EventosServicoContrato = criarEventosServico()
): Router {
  const rotas = Router();
  const controlador = new EventosControlador(servico);

  rotas.get('/', controlador.listar);
  rotas.post('/', controlador.criar);
  rotas.get('/:id', controlador.buscarPorId);

  return rotas;
}
