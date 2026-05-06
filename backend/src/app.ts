import cors from 'cors';
import express from 'express';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/saude', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/medicamentos', (_req, res) => {
  res.status(200).json([
    { id: 1, nome: 'Losartana', dosagem: '50mg', horario: '08:00' },
    { id: 2, nome: 'Metformina', dosagem: '850mg', horario: '12:00' }
  ]);
});

export default app;
