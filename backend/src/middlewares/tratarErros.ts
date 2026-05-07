import type { ErrorRequestHandler } from 'express';

import { ErroHttp } from '../erros/ErroHttp.js';

export const tratarErros: ErrorRequestHandler = (erro, _req, res, _next) => {
  void _next;

  if (erro instanceof ErroHttp) {
    res.status(erro.statusCode).json({ mensagem: erro.message });
    return;
  }

  console.error(erro);
  res.status(500).json({ mensagem: 'Erro interno do servidor' });
};
