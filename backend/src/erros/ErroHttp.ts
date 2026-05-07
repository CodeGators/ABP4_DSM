export class ErroHttp extends Error {
  public readonly statusCode: number;

  constructor(statusCode: number, mensagem: string) {
    super(mensagem);
    this.statusCode = statusCode;
    this.name = 'ErroHttp';
  }
}
