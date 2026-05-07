# Tarefas Iniciais - PillGator

Esta lista organiza os primeiros passos de desenvolvimento do mobile e backend. A parte de IoT nao entra neste fluxo inicial.

## 0. Preparacao do Git

- [x] Verificar branch principal remota.
- [x] Criar branch local `develop` a partir de `main`.
- [x] Criar branch local `docs/contexto-roadmap-inicial`.
- [ ] Publicar `develop` no GitHub.
- [ ] Publicar `docs/contexto-roadmap-inicial` no GitHub.
- [ ] Abrir PR de `docs/contexto-roadmap-inicial` para `develop`.

Comandos sugeridos:

```bash
git push origin develop
git push -u origin docs/contexto-roadmap-inicial
```

Depois de publicar as branches, abrir PR no GitHub:

```text
base: develop
compare: docs/contexto-roadmap-inicial
titulo: docs: adiciona contexto e roadmap inicial
```

## 1. Fundacao do Backend

Branch sugerida:

```bash
git switch develop
git pull origin develop
git switch -c feature/backend-fundacao-typeorm
```

Tarefas:

- [ ] Separar `backend/src/app.ts` e `backend/src/server.ts`.
- [ ] Criar rota `GET /saude`.
- [ ] Manter rota `GET /health` para compatibilidade.
- [ ] Ajustar teste de saude para importar a app real.
- [ ] Instalar TypeORM e `reflect-metadata`.
- [ ] Configurar `DataSource` do TypeORM.
- [ ] Configurar variaveis de ambiente do banco.
- [ ] Criar entidade `Medicamento`.
- [ ] Criar migration inicial.
- [ ] Validar `npm run lint`, `npm test` e `npm run build`.
- [ ] Abrir PR para `develop`.

## 2. CRUD de Medicamentos

Branch sugerida:

```bash
git switch develop
git pull origin develop
git switch -c feature/crud-medicamentos
```

Tarefas:

- [ ] Criar modulo `medicamentos`.
- [ ] Criar controller de medicamentos.
- [ ] Criar service de medicamentos.
- [ ] Criar rotas:
  - `POST /medicamentos`
  - `GET /medicamentos`
  - `GET /medicamentos/:id`
  - `PUT /medicamentos/:id`
  - `DELETE /medicamentos/:id`
- [ ] Trocar dados mockados por dados do PostgreSQL.
- [ ] Criar validacoes de entrada.
- [ ] Criar testes integrados.
- [ ] Abrir PR para `develop`.

## 3. Agendamentos

Branch sugerida:

```bash
git switch develop
git pull origin develop
git switch -c feature/agendamentos-medicamentos
```

Tarefas:

- [ ] Criar entidade `AgendamentoMedicamento`.
- [ ] Criar modulo `agendamentos`.
- [ ] Criar CRUD de agendamentos.
- [ ] Vincular agendamentos a medicamentos.
- [ ] Validar horarios e dias da semana.
- [ ] Suportar agendamentos por horarios fixos.
- [ ] Suportar agendamentos por intervalo, como de 8 em 8 horas.
- [ ] Permitir inicio/fim do tratamento e tolerancia de retirada.
- [ ] Criar testes.
- [ ] Abrir PR para `develop`.

## 4. Configurar e Validar Banco Local

Branch sugerida:

```bash
git switch develop
git pull origin develop
git switch -c feature/configuracao-banco-local
```

Tarefas:

- [ ] Criar `backend/.env.example` com `PORT` e `DATABASE_URL`.
- [ ] Revisar `docker-compose.yml` para Postgres e backend.
- [ ] Subir Postgres local com `docker compose up -d postgres`.
- [ ] Rodar migrations do TypeORM no banco local.
- [ ] Validar tabelas `medicamentos` e `agendamentos_medicamentos`.
- [ ] Subir backend conectado ao banco real.
- [ ] Testar manualmente rotas principais usando banco local.
- [ ] Documentar comandos no README.
- [ ] Garantir que dados sensiveis continuem fora do Git.

## 5. Eventos e Historico

Branch sugerida:

```bash
git switch develop
git pull origin develop
git switch -c feature/historico-eventos
```

Tarefas:

- [ ] Criar entidade `EventoMedicamento`.
- [ ] Criar modulo `eventos`.
- [ ] Criar endpoint para registrar evento.
- [ ] Criar endpoint para listar historico.
- [ ] Preparar tipos de evento para futura integracao IoT.
- [ ] Criar testes.
- [ ] Abrir PR para `develop`.

## 6. Restricoes e Interacoes entre Medicamentos

Branch sugerida:

```bash
git switch develop
git pull origin develop
git switch -c feature/restricoes-medicamentos
```

Tarefas:

- [ ] Modelar restricoes entre medicamentos do mesmo paciente.
- [ ] Permitir registrar que dois medicamentos nao devem ser tomados juntos.
- [ ] Permitir configurar intervalo minimo entre medicamentos conflitantes.
- [ ] Alertar ao criar ou alterar agendamento com conflito.
- [ ] Criar testes para conflitos simples.
- [ ] Avaliar integracao futura com base publica de medicamentos/bulas.

Observacao: esta tarefa nao substitui orientacao medica. O sistema deve alertar sobre restricoes cadastradas e, futuramente, restricoes vindas de fonte confiavel.

## 7. Base do Mobile

Branch sugerida:

```bash
git switch develop
git pull origin develop
git switch -c feature/mobile-base
```

Tarefas:

- [ ] Criar `mobile/src/servicos/api.ts` com Axios.
- [ ] Criar tipos TypeScript para medicamento, agendamento e evento.
- [ ] Substituir telas de template por telas reais.
- [ ] Criar tela inicial com proximos medicamentos.
- [ ] Criar tela de medicamentos.
- [ ] Consumir `GET /medicamentos`.
- [ ] Criar estados de carregamento, erro e vazio.
- [ ] Ajustar navegacao por abas.
- [ ] Abrir PR para `develop`.

## 8. Base Publica de Medicamentos e Bulas

Branch sugerida:

```bash
git switch develop
git pull origin develop
git switch -c feature/base-medicamentos-anvisa
```

Tarefas:

- [ ] Pesquisar fonte oficial de CSV/dados abertos da Anvisa para medicamentos.
- [ ] Criar rotina de importacao periodica do CSV da Anvisa.
- [ ] Salvar medicamentos de referencia no banco.
- [ ] Modelar campos como registro, principio ativo, nome comercial, empresa e apresentacao.
- [ ] Criar endpoint `GET /base-medicamentos?busca=dipirona`.
- [ ] Criar endpoint `GET /base-medicamentos/:registro`.
- [ ] Criar endpoint `GET /base-medicamentos/:registro/bula`.
- [ ] No mobile, permitir buscar medicamento na base antes de adicionar ao tratamento.
- [ ] Criar testes de importacao e consulta.

Observacao: esta base deve ajudar o cadastro, mas nao substitui o medicamento do paciente. O medicamento cadastrado no tratamento continua sendo uma entidade propria do PillGator.

## 9. Documentacao Interativa da API com Swagger

Branch sugerida:

```bash
git switch develop
git pull origin develop
git switch -c feature/swagger-api
```

Tarefas:

- [ ] Instalar e configurar Swagger/OpenAPI no backend.
- [ ] Expor a documentacao em `GET /docs`.
- [ ] Expor o JSON OpenAPI em `GET /docs.json`.
- [ ] Documentar rotas de saude, medicamentos e agendamentos.
- [ ] Documentar exemplos de payload e respostas de erro.
- [ ] Garantir que seja possivel testar as rotas pelo Swagger UI.
- [ ] Criar teste simples garantindo que `/docs.json` responde.

## 10. Qualidade e CI/CD

Tarefas:

- [ ] Garantir que o backend rode `lint`, `test` e `build` no CI.
- [ ] Adicionar scripts reais de `lint` e `test` no mobile.
- [ ] Confirmar que PR para `develop` executa CI.
- [ ] Confirmar que CD backend executa apenas em merge/push para `main`.
- [ ] Documentar comandos de execucao local no README.

## Ordem Recomendada

1. Fundacao do backend.
2. TypeORM/PostgreSQL.
3. CRUD de medicamentos.
4. Agendamentos.
5. Configurar e validar banco local.
6. Eventos/historico.
7. Restricoes e interacoes entre medicamentos.
8. Mobile consumindo a API.
9. Swagger/OpenAPI para testar rotas.
10. Base publica de medicamentos e bulas.
11. Autenticacao.
12. Ajustes finais de CI/CD e documentacao.
