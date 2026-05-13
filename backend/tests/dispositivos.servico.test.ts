import type { Repository } from 'typeorm';

import { Compartimento } from '../src/entidades/Compartimento.js';
import { Dispositivo } from '../src/entidades/Dispositivo.js';
import { Medicamento } from '../src/entidades/Medicamento.js';
import { Paciente } from '../src/entidades/Paciente.js';
import { ErroHttp } from '../src/erros/ErroHttp.js';
import { DispositivosServico } from '../src/modulos/dispositivos/dispositivosServico.js';

const dataFixa = new Date('2026-01-01T00:00:00.000Z');

class RepositorioDispositivosMemoria {
  public dispositivos: Dispositivo[] = [];

  public create(dados: Partial<Dispositivo>): Dispositivo {
    return Object.assign(new Dispositivo(), {
      id: `dispositivo-${this.dispositivos.length + 1}`,
      ativo: true,
      criadoEm: dataFixa,
      atualizadoEm: dataFixa,
      ...dados
    });
  }

  public async save(dispositivo: Dispositivo): Promise<Dispositivo> {
    const indice = this.dispositivos.findIndex(
      (item) => item.id === dispositivo.id
    );

    if (indice >= 0) {
      this.dispositivos[indice] = dispositivo;
    } else {
      this.dispositivos.push(dispositivo);
    }

    return dispositivo;
  }

  public async find(opcoes: { where: Partial<Dispositivo> }): Promise<Dispositivo[]> {
    return this.dispositivos.filter((dispositivo) => {
      if (opcoes.where.ativo !== undefined && dispositivo.ativo !== opcoes.where.ativo) {
        return false;
      }

      if (
        opcoes.where.pacienteId !== undefined &&
        dispositivo.pacienteId !== opcoes.where.pacienteId
      ) {
        return false;
      }

      return true;
    });
  }

  public async findOne(opcoes: {
    where: Partial<Dispositivo>;
  }): Promise<Dispositivo | null> {
    return (
      this.dispositivos.find((dispositivo) => {
        if (opcoes.where.id !== undefined && dispositivo.id !== opcoes.where.id) {
          return false;
        }

        if (
          opcoes.where.identificador !== undefined &&
          dispositivo.identificador !== opcoes.where.identificador
        ) {
          return false;
        }

        if (
          opcoes.where.ativo !== undefined &&
          dispositivo.ativo !== opcoes.where.ativo
        ) {
          return false;
        }

        return true;
      }) ?? null
    );
  }
}

class RepositorioCompartimentosMemoria {
  public compartimentos: Compartimento[] = [];

  public create(dados: Partial<Compartimento>): Compartimento {
    return Object.assign(new Compartimento(), {
      id: `compartimento-${this.compartimentos.length + 1}`,
      ativo: true,
      criadoEm: dataFixa,
      atualizadoEm: dataFixa,
      ...dados
    });
  }

  public async save(compartimento: Compartimento): Promise<Compartimento> {
    const indice = this.compartimentos.findIndex(
      (item) => item.id === compartimento.id
    );

    if (indice >= 0) {
      this.compartimentos[indice] = compartimento;
    } else {
      this.compartimentos.push(compartimento);
    }

    return compartimento;
  }

  public async find(opcoes: {
    where: Partial<Compartimento>;
  }): Promise<Compartimento[]> {
    return this.compartimentos.filter((compartimento) => {
      if (
        opcoes.where.dispositivoId !== undefined &&
        compartimento.dispositivoId !== opcoes.where.dispositivoId
      ) {
        return false;
      }

      if (opcoes.where.ativo !== undefined && compartimento.ativo !== opcoes.where.ativo) {
        return false;
      }

      return true;
    });
  }

  public async findOne(opcoes: {
    where: Partial<Compartimento>;
  }): Promise<Compartimento | null> {
    return (
      this.compartimentos.find((compartimento) => {
        if (opcoes.where.id !== undefined && compartimento.id !== opcoes.where.id) {
          return false;
        }

        if (
          opcoes.where.dispositivoId !== undefined &&
          compartimento.dispositivoId !== opcoes.where.dispositivoId
        ) {
          return false;
        }

        if (
          opcoes.where.numero !== undefined &&
          compartimento.numero !== opcoes.where.numero
        ) {
          return false;
        }

        if (
          opcoes.where.ativo !== undefined &&
          compartimento.ativo !== opcoes.where.ativo
        ) {
          return false;
        }

        return true;
      }) ?? null
    );
  }
}

class RepositorioPacientesMemoria {
  public pacientes: Paciente[] = [];

  public async findOne(opcoes: {
    where: { id: string; ativo: boolean };
  }): Promise<Paciente | null> {
    return (
      this.pacientes.find(
        (paciente) =>
          paciente.id === opcoes.where.id && paciente.ativo === opcoes.where.ativo
      ) ?? null
    );
  }
}

class RepositorioMedicamentosMemoria {
  public medicamentos: Medicamento[] = [];

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

function criarPaciente(sobrescritas: Partial<Paciente> = {}): Paciente {
  return Object.assign(new Paciente(), {
    id: 'paciente-1',
    usuarioId: null,
    nome: 'Joao Paciente',
    dataNascimento: null,
    observacoes: null,
    ativo: true,
    criadoEm: dataFixa,
    atualizadoEm: dataFixa,
    ...sobrescritas
  });
}

function criarMedicamento(
  sobrescritas: Partial<Medicamento> = {}
): Medicamento {
  return Object.assign(new Medicamento(), {
    id: 'medicamento-1',
    nome: 'Dipirona',
    dosagem: '500mg',
    observacoes: null,
    ativo: true,
    criadoEm: dataFixa,
    atualizadoEm: dataFixa,
    ...sobrescritas
  });
}

function criarServico() {
  const dispositivosRepositorio = new RepositorioDispositivosMemoria();
  const compartimentosRepositorio = new RepositorioCompartimentosMemoria();
  const pacientesRepositorio = new RepositorioPacientesMemoria();
  const medicamentosRepositorio = new RepositorioMedicamentosMemoria();

  pacientesRepositorio.pacientes.push(criarPaciente());
  medicamentosRepositorio.medicamentos.push(criarMedicamento());

  const servico = new DispositivosServico(
    dispositivosRepositorio as unknown as Repository<Dispositivo>,
    compartimentosRepositorio as unknown as Repository<Compartimento>,
    pacientesRepositorio as unknown as Repository<Paciente>,
    medicamentosRepositorio as unknown as Repository<Medicamento>
  );

  return {
    compartimentosRepositorio,
    dispositivosRepositorio,
    medicamentosRepositorio,
    pacientesRepositorio,
    servico
  };
}

describe('DispositivosServico', () => {
  it('deve criar dispositivo vinculado a paciente ativo', async () => {
    const { servico } = criarServico();

    const dispositivo = await servico.criar({
      pacienteId: 'paciente-1',
      nome: ' PillGator Quarto ',
      identificador: ' pillgator-01 ',
      modelo: 'Prototipo DSM'
    });

    expect(dispositivo).toMatchObject({
      pacienteId: 'paciente-1',
      nome: 'PillGator Quarto',
      identificador: 'pillgator-01',
      modelo: 'Prototipo DSM',
      ultimoSinalEm: null,
      ativo: true
    });
  });

  it('deve rejeitar paciente inexistente ou inativo', async () => {
    const { pacientesRepositorio, servico } = criarServico();
    pacientesRepositorio.pacientes[0]!.ativo = false;

    await expect(
      servico.criar({
        pacienteId: 'paciente-1',
        nome: 'PillGator',
        identificador: 'pillgator-01'
      })
    ).rejects.toMatchObject<Partial<ErroHttp>>({
      statusCode: 404,
      message: 'Paciente nao encontrado para dispositivo'
    });
  });

  it('deve rejeitar identificador duplicado', async () => {
    const { servico } = criarServico();

    await servico.criar({
      pacienteId: 'paciente-1',
      nome: 'PillGator 1',
      identificador: 'pillgator-01'
    });

    await expect(
      servico.criar({
        pacienteId: 'paciente-1',
        nome: 'PillGator 2',
        identificador: 'pillgator-01'
      })
    ).rejects.toMatchObject<Partial<ErroHttp>>({
      statusCode: 409,
      message: 'Identificador de dispositivo ja cadastrado'
    });
  });

  it('deve criar compartimento associado a medicamento ativo', async () => {
    const { servico } = criarServico();
    const dispositivo = await servico.criar({
      pacienteId: 'paciente-1',
      nome: 'PillGator',
      identificador: 'pillgator-01'
    });

    const compartimento = await servico.criarCompartimento(dispositivo.id, {
      numero: 1,
      medicamentoId: 'medicamento-1',
      status: 'bloqueado',
      observacoes: 'Compartimento principal'
    });

    expect(compartimento).toMatchObject({
      dispositivoId: dispositivo.id,
      numero: 1,
      medicamentoId: 'medicamento-1',
      status: 'bloqueado',
      observacoes: 'Compartimento principal',
      ativo: true
    });
  });

  it('deve rejeitar numero duplicado de compartimento ativo', async () => {
    const { servico } = criarServico();
    const dispositivo = await servico.criar({
      pacienteId: 'paciente-1',
      nome: 'PillGator',
      identificador: 'pillgator-01'
    });
    await servico.criarCompartimento(dispositivo.id, { numero: 1 });

    await expect(
      servico.criarCompartimento(dispositivo.id, { numero: 1 })
    ).rejects.toMatchObject<Partial<ErroHttp>>({
      statusCode: 409,
      message: 'Numero de compartimento ja cadastrado no dispositivo'
    });
  });

  it('deve atualizar status do compartimento', async () => {
    const { servico } = criarServico();
    const dispositivo = await servico.criar({
      pacienteId: 'paciente-1',
      nome: 'PillGator',
      identificador: 'pillgator-01'
    });
    const compartimento = await servico.criarCompartimento(dispositivo.id, {
      numero: 1
    });

    const atualizado = await servico.atualizarCompartimento(
      dispositivo.id,
      compartimento.id,
      { status: 'liberado', medicamentoId: 'medicamento-1' }
    );

    expect(atualizado).toMatchObject({
      status: 'liberado',
      medicamentoId: 'medicamento-1'
    });
  });

  it('deve desativar compartimento ao remover', async () => {
    const { compartimentosRepositorio, servico } = criarServico();
    const dispositivo = await servico.criar({
      pacienteId: 'paciente-1',
      nome: 'PillGator',
      identificador: 'pillgator-01'
    });
    const compartimento = await servico.criarCompartimento(dispositivo.id, {
      numero: 1
    });

    await servico.removerCompartimento(dispositivo.id, compartimento.id);

    expect(compartimentosRepositorio.compartimentos[0]?.ativo).toBe(false);
  });
});
