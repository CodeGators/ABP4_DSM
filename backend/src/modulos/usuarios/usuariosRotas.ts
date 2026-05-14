import { Router } from 'express';

import { UsuariosControlador } from './usuariosControlador.js';
import { criarUsuariosServico } from './usuariosServico.js';
import type { UsuariosServicoContrato } from './usuariosTipos.js';

type CriarUsuariosRotasOpcoes = {
  incluirCadastroPublico?: boolean;
  incluirGestao?: boolean;
};

export function criarUsuariosRotas(
  servico: UsuariosServicoContrato = criarUsuariosServico(),
  opcoes: CriarUsuariosRotasOpcoes = {}
): Router {
  const rotas = Router();
  const controlador = new UsuariosControlador(servico);
  const incluirCadastroPublico = opcoes.incluirCadastroPublico ?? true;
  const incluirGestao = opcoes.incluirGestao ?? true;

  if (incluirCadastroPublico) {
    rotas.post('/', controlador.criarCadastroPublico);
  }

  if (incluirGestao) {
    rotas.get('/', controlador.listar);
    rotas.post('/', controlador.criar);
    rotas.get('/:id', controlador.buscarPorId);
    rotas.put('/:id', controlador.atualizar);
    rotas.delete('/:id', controlador.remover);
  }

  return rotas;
}
