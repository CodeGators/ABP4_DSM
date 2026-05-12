import 'reflect-metadata';
import { DataSource } from 'typeorm';

import { AgendamentoMedicamento } from '../entidades/AgendamentoMedicamento.js';
import { EventoMedicamento } from '../entidades/EventoMedicamento.js';
import { Medicamento } from '../entidades/Medicamento.js';
import { Paciente } from '../entidades/Paciente.js';
import { PacienteResponsavel } from '../entidades/PacienteResponsavel.js';
import { Usuario } from '../entidades/Usuario.js';
import { CriarTabelasUsuariosPacientes1740000000000 } from '../database/migrations/1740000000000-CriarTabelasUsuariosPacientes.js';
import { CriarTabelaEventosMedicamentos1730000000000 } from '../database/migrations/1730000000000-CriarTabelaEventosMedicamentos.js';
import { CriarTabelaAgendamentosMedicamentos1720000000000 } from '../database/migrations/1720000000000-CriarTabelaAgendamentosMedicamentos.js';
import { CriarTabelaMedicamentos1710000000000 } from '../database/migrations/1710000000000-CriarTabelaMedicamentos.js';
import { env } from './env.js';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: env.bancoUrl,
  synchronize: false,
  logging: false,
  entities: [
    Medicamento,
    AgendamentoMedicamento,
    EventoMedicamento,
    Usuario,
    Paciente,
    PacienteResponsavel
  ],
  migrations: [
    CriarTabelaMedicamentos1710000000000,
    CriarTabelaAgendamentosMedicamentos1720000000000,
    CriarTabelaEventosMedicamentos1730000000000,
    CriarTabelasUsuariosPacientes1740000000000
  ]
});
