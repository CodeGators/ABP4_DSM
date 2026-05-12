import cors from 'cors';
import express from 'express';

import { configurarSwagger } from './docs/swagger.js';
import { tratarErros } from './middlewares/tratarErros.js';
import { criarAgendamentosRotas } from './modulos/agendamentos/agendamentosRotas.js';
import type { AgendamentosServicoContrato } from './modulos/agendamentos/agendamentosTipos.js';
import { criarEventosRotas } from './modulos/eventos/eventosRotas.js';
import type { EventosServicoContrato } from './modulos/eventos/eventosTipos.js';
import { criarMedicamentosRotas } from './modulos/medicamentos/medicamentosRotas.js';
import type { MedicamentosServicoContrato } from './modulos/medicamentos/medicamentosTipos.js';
import { criarPacientesRotas } from './modulos/pacientes/pacientesRotas.js';
import type { PacientesServicoContrato } from './modulos/pacientes/pacientesTipos.js';
import { criarUsuariosRotas } from './modulos/usuarios/usuariosRotas.js';
import type { UsuariosServicoContrato } from './modulos/usuarios/usuariosTipos.js';

type CriarAppOpcoes = {
  agendamentosServico?: AgendamentosServicoContrato;
  eventosServico?: EventosServicoContrato;
  medicamentosServico?: MedicamentosServicoContrato;
  pacientesServico?: PacientesServicoContrato;
  usuariosServico?: UsuariosServicoContrato;
};

export function criarApp(opcoes: CriarAppOpcoes = {}) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  configurarSwagger(app);

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.get('/saude', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use(
    '/medicamentos',
    criarMedicamentosRotas(opcoes.medicamentosServico)
  );
  app.use(
    '/agendamentos',
    criarAgendamentosRotas(opcoes.agendamentosServico)
  );
  app.use('/eventos', criarEventosRotas(opcoes.eventosServico));
  app.use('/usuarios', criarUsuariosRotas(opcoes.usuariosServico));
  app.use('/pacientes', criarPacientesRotas(opcoes.pacientesServico));

  app.use(tratarErros);

  return app;
}

const app = criarApp();

export default app;
