import { Router } from 'express';

import { PacientesControlador } from './pacientesControlador.js';
import { criarPacientesServico } from './pacientesServico.js';
import type { PacientesServicoContrato } from './pacientesTipos.js';

export function criarPacientesRotas(
  servico: PacientesServicoContrato = criarPacientesServico()
): Router {
  const rotas = Router();
  const controlador = new PacientesControlador(servico);

  rotas.get('/', controlador.listar);
  rotas.post('/', controlador.criar);
  rotas.get('/meus', controlador.listarMeus);
  rotas.get('/:id', controlador.buscarPorId);
  rotas.put('/:id', controlador.atualizar);
  rotas.delete('/:id', controlador.remover);
  rotas.get('/:pacienteId/responsaveis', controlador.listarResponsaveis);
  rotas.post('/:pacienteId/responsaveis', controlador.vincularResponsavel);
  rotas.delete(
    '/:pacienteId/responsaveis/:responsavelId',
    controlador.removerResponsavel
  );

  return rotas;
}
