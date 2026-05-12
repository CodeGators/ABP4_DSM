import { Router } from 'express';

import { UsuariosControlador } from './usuariosControlador.js';
import { criarUsuariosServico } from './usuariosServico.js';
import type { UsuariosServicoContrato } from './usuariosTipos.js';

export function criarUsuariosRotas(
  servico: UsuariosServicoContrato = criarUsuariosServico()
): Router {
  const rotas = Router();
  const controlador = new UsuariosControlador(servico);

  rotas.get('/', controlador.listar);
  rotas.post('/', controlador.criar);
  rotas.get('/:id', controlador.buscarPorId);
  rotas.put('/:id', controlador.atualizar);
  rotas.delete('/:id', controlador.remover);

  return rotas;
}
