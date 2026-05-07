import type { Repository } from 'typeorm';

import { Medicamento } from '../src/entidades/Medicamento.js';
import { ErroHttp } from '../src/erros/ErroHttp.js';
import { MedicamentosServico } from '../src/modulos/medicamentos/medicamentosServico.js';

const dataFixa = new Date('2026-01-01T00:00:00.000Z');

class RepositorioMedicamentosMemoria {
  public medicamentos: Medicamento[] = [];

  public create(dados: Partial<Medicamento>): Medicamento {
    return Object.assign(new Medicamento(), {
      id: 'novo-medicamento',
      ativo: true,
      criadoEm: dataFixa,
      atualizadoEm: dataFixa,
      ...dados
    });
  }

  public async save(medicamento: Medicamento): Promise<Medicamento> {
    const indice = this.medicamentos.findIndex((item) => item.id === medicamento.id);

    if (indice >= 0) {
      this.medicamentos[indice] = medicamento;
    } else {
      this.medicamentos.push(medicamento);
    }

    return medicamento;
  }

  public async find(): Promise<Medicamento[]> {
    return this.medicamentos
      .filter((medicamento) => medicamento.ativo)
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }

  public async findOne(opcoes: {
    where: { id: string; ativo: boolean };
  }): Promise<Medicamento | null> {
    return (
      this.medicamentos.find(
        (medicamento) =>
          medicamento.id === opcoes.where.id &&
          medicamento.ativo === opcoes.where.ativo
      ) ?? null
    );
  }
}

function criarServico() {
  const repositorio = new RepositorioMedicamentosMemoria();
  const servico = new MedicamentosServico(
    repositorio as unknown as Repository<Medicamento>
  );

  return { repositorio, servico };
}

describe('MedicamentosServico', () => {
  it('deve criar medicamento com dados normalizados', async () => {
    const { repositorio, servico } = criarServico();

    const medicamento = await servico.criar({
      nome: ' Dipirona ',
      dosagem: ' 500mg ',
      observacoes: ' Tomar com agua '
    });

    expect(medicamento).toMatchObject({
      nome: 'Dipirona',
      dosagem: '500mg',
      observacoes: 'Tomar com agua',
      ativo: true
    });
    expect(repositorio.medicamentos).toHaveLength(1);
  });

  it('deve rejeitar medicamento sem nome', async () => {
    const { servico } = criarServico();

    await expect(
      servico.criar({
        dosagem: '500mg'
      })
    ).rejects.toMatchObject<Partial<ErroHttp>>({
      statusCode: 400,
      message: 'Campo nome e obrigatorio'
    });
  });

  it('deve buscar medicamento ativo por id', async () => {
    const { repositorio, servico } = criarServico();
    const medicamento = repositorio.create({
      id: 'medicamento-1',
      nome: 'Dipirona',
      dosagem: '500mg'
    });
    await repositorio.save(medicamento);

    const resultado = await servico.buscarPorId('medicamento-1');

    expect(resultado.id).toBe('medicamento-1');
  });

  it('deve retornar erro quando medicamento nao existir', async () => {
    const { servico } = criarServico();

    await expect(servico.buscarPorId('inexistente')).rejects.toMatchObject<
      Partial<ErroHttp>
    >({
      statusCode: 404,
      message: 'Medicamento nao encontrado'
    });
  });

  it('deve atualizar medicamento existente', async () => {
    const { repositorio, servico } = criarServico();
    const medicamento = repositorio.create({
      id: 'medicamento-1',
      nome: 'Dipirona',
      dosagem: '500mg'
    });
    await repositorio.save(medicamento);

    const atualizado = await servico.atualizar('medicamento-1', {
      nome: 'Dipirona gotas',
      observacoes: ''
    });

    expect(atualizado.nome).toBe('Dipirona gotas');
    expect(atualizado.observacoes).toBeNull();
  });

  it('deve desativar medicamento ao remover', async () => {
    const { repositorio, servico } = criarServico();
    const medicamento = repositorio.create({
      id: 'medicamento-1',
      nome: 'Dipirona',
      dosagem: '500mg'
    });
    await repositorio.save(medicamento);

    await servico.remover('medicamento-1');

    expect(repositorio.medicamentos[0]?.ativo).toBe(false);
  });
});
