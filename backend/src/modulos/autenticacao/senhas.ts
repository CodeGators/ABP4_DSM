import bcrypt from 'bcryptjs';

import { ErroHttp } from '../../erros/ErroHttp.js';

const tamanhoMinimoSenha = 8;
const saltRounds = 10;

export function validarSenha(valor: unknown): string {
  if (typeof valor !== 'string') {
    throw new ErroHttp(400, 'Campo senha e obrigatorio');
  }

  if (valor.length < tamanhoMinimoSenha) {
    throw new ErroHttp(
      400,
      `Campo senha deve ter pelo menos ${tamanhoMinimoSenha} caracteres`
    );
  }

  return valor;
}

export async function gerarHashSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, saltRounds);
}

export async function compararSenha(
  senha: string,
  senhaHash: string
): Promise<boolean> {
  return bcrypt.compare(senha, senhaHash);
}
