import { Router } from 'express';

import { MedicamentosControlador } from './medicamentosControlador.js';
import { criarMedicamentosServico } from './medicamentosServico.js';
import type { MedicamentosServicoContrato } from './medicamentosTipos.js';

export function criarMedicamentosRotas(
  servico: MedicamentosServicoContrato = criarMedicamentosServico()
): Router {
  const rotas = Router();
  const controlador = new MedicamentosControlador(servico);

  rotas.get('/', controlador.listar);
  rotas.post('/', controlador.criar);
  rotas.get('/:id', controlador.buscarPorId);
  rotas.put('/:id', controlador.atualizar);
  rotas.delete('/:id', controlador.remover);

  return rotas;
}
