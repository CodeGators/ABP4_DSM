import cors from 'cors';
import express from 'express';

import { tratarErros } from './middlewares/tratarErros.js';
import { criarMedicamentosRotas } from './modulos/medicamentos/medicamentosRotas.js';
import type { MedicamentosServicoContrato } from './modulos/medicamentos/medicamentosTipos.js';

type CriarAppOpcoes = {
  medicamentosServico?: MedicamentosServicoContrato;
};

export function criarApp(opcoes: CriarAppOpcoes = {}) {
  const app = express();

  app.use(cors());
  app.use(express.json());

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

  app.use(tratarErros);

  return app;
}

const app = criarApp();

export default app;
