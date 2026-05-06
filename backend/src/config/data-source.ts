import 'reflect-metadata';
import { DataSource } from 'typeorm';

import { Medicamento } from '../entidades/Medicamento.js';
import { CriarTabelaMedicamentos1710000000000 } from '../database/migrations/1710000000000-CriarTabelaMedicamentos.js';
import { env } from './env.js';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: env.bancoUrl,
  synchronize: false,
  logging: false,
  entities: [Medicamento],
  migrations: [CriarTabelaMedicamentos1710000000000]
});
