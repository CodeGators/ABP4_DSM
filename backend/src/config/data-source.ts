import 'reflect-metadata';
import { DataSource } from 'typeorm';

import { AgendamentoMedicamento } from '../entidades/AgendamentoMedicamento.js';
import { Medicamento } from '../entidades/Medicamento.js';
import { CriarTabelaAgendamentosMedicamentos1720000000000 } from '../database/migrations/1720000000000-CriarTabelaAgendamentosMedicamentos.js';
import { CriarTabelaMedicamentos1710000000000 } from '../database/migrations/1710000000000-CriarTabelaMedicamentos.js';
import { env } from './env.js';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: env.bancoUrl,
  synchronize: false,
  logging: false,
  entities: [Medicamento, AgendamentoMedicamento],
  migrations: [
    CriarTabelaMedicamentos1710000000000,
    CriarTabelaAgendamentosMedicamentos1720000000000
  ]
});
