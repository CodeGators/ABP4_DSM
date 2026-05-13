import jwt from 'jsonwebtoken';
import type { NextFunction, Request, RequestHandler, Response } from 'express';

import { env } from '../config/env.js';
import type { TipoUsuario } from '../entidades/Usuario.js';
import { ErroHttp } from '../erros/ErroHttp.js';
import type { TokenPayload } from '../modulos/autenticacao/autenticacaoTipos.js';

export type RequestAutenticada = Request & {
  usuario?: TokenPayload;
};

export const autenticar: RequestHandler = (
  req: RequestAutenticada,
  _res: Response,
  next: NextFunction
) => {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    throw new ErroHttp(401, 'Token de autenticacao nao informado');
  }

  const token = authorization.replace('Bearer ', '').trim();

  if (!token) {
    throw new ErroHttp(401, 'Token de autenticacao nao informado');
  }

  try {
    const payload = jwt.verify(token, env.jwtSegredo) as TokenPayload;
    req.usuario = payload;
    next();
  } catch {
    throw new ErroHttp(401, 'Token de autenticacao invalido ou expirado');
  }
};

export function autorizar(...tiposPermitidos: TipoUsuario[]): RequestHandler {
  return (req: RequestAutenticada, _res: Response, next: NextFunction) => {
    const usuario = req.usuario;

    if (!usuario) {
      throw new ErroHttp(401, 'Usuario nao autenticado');
    }

    if (!tiposPermitidos.includes(usuario.tipo)) {
      throw new ErroHttp(403, 'Usuario sem permissao para acessar esta rota');
    }

    next();
  };
}
