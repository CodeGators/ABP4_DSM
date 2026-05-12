export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'PillGator API',
    version: '1.0.0',
    description:
      'Documentacao da API do PillGator. Use esta pagina para testar as rotas do backend. Primeiro suba o PostgreSQL, rode as migrations e inicie a API. Campos com asterisco nos exemplos sao obrigatorios no cadastro.'
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Ambiente local de desenvolvimento'
    }
  ],
  tags: [
    {
      name: 'Saude',
      description:
        'Rotas simples para verificar se a API esta ligada e respondendo.'
    },
    {
      name: 'Medicamentos',
      description:
        'Cadastro dos medicamentos do paciente. Aqui ficam dados como nome, dosagem e observacoes. O horario de uso fica em Agendamentos.'
    },
    {
      name: 'Agendamentos',
      description:
        'Programacao de quando um medicamento deve ser tomado. Pode ser por horarios fixos ou por intervalo, como de 8 em 8 horas.'
    }
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Saude'],
        summary: 'Verifica se a API esta online',
        description:
          'Use esta rota para confirmar rapidamente se o backend subiu. Se retornar status 200 com `{ "status": "ok" }`, a API esta respondendo.',
        responses: {
          '200': {
            description: 'API online',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SaudeResposta' },
                example: { status: 'ok' }
              }
            }
          }
        }
      }
    },
    '/saude': {
      get: {
        tags: ['Saude'],
        summary: 'Verifica se a API esta online em rota em portugues',
        description:
          'Tem o mesmo objetivo de `/health`, mas usando nome em portugues. Pode ser usada pelo app e pelo time durante testes.',
        responses: {
          '200': {
            description: 'API online',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SaudeResposta' },
                example: { status: 'ok' }
              }
            }
          }
        }
      }
    },
    '/medicamentos': {
      get: {
        tags: ['Medicamentos'],
        summary: 'Lista medicamentos ativos',
        description:
          'Retorna todos os medicamentos ativos cadastrados. Medicamentos removidos por DELETE ficam inativos e nao aparecem nesta listagem.',
        responses: {
          '200': {
            description: 'Lista de medicamentos',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Medicamento' }
                },
                example: [
                  {
                    id: '7b8d7b2a-0d8d-4f87-8a3f-9e5a3f2c1111',
                    nome: 'Losartana',
                    dosagem: '50mg',
                    observacoes: 'Tomar pela manha com agua.',
                    ativo: true,
                    criadoEm: '2026-05-12T12:00:00.000Z',
                    atualizadoEm: '2026-05-12T12:00:00.000Z'
                  }
                ]
              }
            }
          }
        }
      },
      post: {
        tags: ['Medicamentos'],
        summary: 'Cadastra um medicamento',
        description:
          'Cria um medicamento para depois ser usado em agendamentos. Envie `nome` e `dosagem`. `observacoes` e opcional e serve para instrucoes simples, por exemplo "tomar com agua".',
        requestBody: {
          required: true,
          description:
            'Dados do medicamento. `nome` e `dosagem` sao obrigatorios. Nao envie `id`, `ativo`, `criadoEm` ou `atualizadoEm`; o backend cria isso automaticamente.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CriarMedicamento' },
              examples: {
                losartana: {
                  summary: 'Exemplo simples',
                  value: {
                    nome: 'Losartana',
                    dosagem: '50mg',
                    observacoes: 'Tomar pela manha com agua.'
                  }
                },
                dipirona: {
                  summary: 'Medicamento sem observacao',
                  value: {
                    nome: 'Dipirona',
                    dosagem: '500mg'
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Medicamento criado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Medicamento' }
              }
            }
          },
          '400': { $ref: '#/components/responses/ErroValidacao' }
        }
      }
    },
    '/medicamentos/{id}': {
      get: {
        tags: ['Medicamentos'],
        summary: 'Busca um medicamento pelo id',
        description:
          'Use esta rota quando precisar carregar os detalhes de um medicamento especifico. O `id` deve ser o UUID retornado ao criar ou listar medicamentos.',
        parameters: [{ $ref: '#/components/parameters/MedicamentoId' }],
        responses: {
          '200': {
            description: 'Medicamento encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Medicamento' }
              }
            }
          },
          '404': { $ref: '#/components/responses/ErroNaoEncontrado' }
        }
      },
      put: {
        tags: ['Medicamentos'],
        summary: 'Atualiza um medicamento',
        description:
          'Atualiza os dados de um medicamento. Voce pode enviar todos os campos editaveis ou apenas o campo que quer alterar. Para reativar ou desativar, use `ativo` com true ou false.',
        parameters: [{ $ref: '#/components/parameters/MedicamentoId' }],
        requestBody: {
          required: true,
          description:
            'Campos que podem ser alterados. Todos sao opcionais, mas envie pelo menos um campo.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AtualizarMedicamento' },
              example: {
                nome: 'Losartana Potassica',
                dosagem: '50mg',
                observacoes: 'Tomar sempre no mesmo horario.',
                ativo: true
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Medicamento atualizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Medicamento' }
              }
            }
          },
          '400': { $ref: '#/components/responses/ErroValidacao' },
          '404': { $ref: '#/components/responses/ErroNaoEncontrado' }
        }
      },
      delete: {
        tags: ['Medicamentos'],
        summary: 'Remove um medicamento',
        description:
          'Faz remocao logica do medicamento, alterando `ativo` para false. O registro continua no banco, mas nao aparece mais na listagem padrao.',
        parameters: [{ $ref: '#/components/parameters/MedicamentoId' }],
        responses: {
          '204': { description: 'Medicamento removido sem corpo de resposta' },
          '404': { $ref: '#/components/responses/ErroNaoEncontrado' }
        }
      }
    },
    '/agendamentos': {
      get: {
        tags: ['Agendamentos'],
        summary: 'Lista agendamentos ativos',
        description:
          'Lista os agendamentos cadastrados. Se quiser listar apenas os agendamentos de um medicamento, envie `medicamentoId` como filtro na query.',
        parameters: [
          {
            name: 'medicamentoId',
            in: 'query',
            required: false,
            description:
              'Opcional. UUID do medicamento para filtrar apenas os agendamentos dele.',
            schema: { type: 'string', format: 'uuid' },
            example: '7b8d7b2a-0d8d-4f87-8a3f-9e5a3f2c1111'
          }
        ],
        responses: {
          '200': {
            description: 'Lista de agendamentos',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Agendamento' }
                }
              }
            }
          },
          '400': { $ref: '#/components/responses/ErroValidacao' }
        }
      },
      post: {
        tags: ['Agendamentos'],
        summary: 'Cria um agendamento para um medicamento',
        description:
          'Cria a regra de horario de um medicamento. Primeiro cadastre um medicamento em `POST /medicamentos`, copie o `id` retornado e use esse valor em `medicamentoId` aqui.',
        requestBody: {
          required: true,
          description:
            'Existem dois tipos: `horarios_fixos` para horarios exatos, e `intervalo` para frequencia como de 8 em 8 horas. Veja os exemplos antes de testar.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CriarAgendamento' },
              examples: {
                horariosFixos: {
                  summary: 'Tomar em horarios fixos',
                  description:
                    'Use quando o paciente toma em horarios especificos, por exemplo 08:00 e 20:00.',
                  value: {
                    medicamentoId: '7b8d7b2a-0d8d-4f87-8a3f-9e5a3f2c1111',
                    tipo: 'horarios_fixos',
                    diasSemana: [1, 2, 3, 4, 5],
                    horarios: ['08:00', '20:00'],
                    inicioEm: '2026-05-12',
                    fimEm: null,
                    toleranciaMinutos: 30,
                    cuidados: 'Nao tomar junto com leite.'
                  }
                },
                intervalo: {
                  summary: 'Tomar de 8 em 8 horas',
                  description:
                    'Use quando a frequencia e por intervalo. Neste exemplo, o primeiro horario e 06:00 e depois repete a cada 8 horas.',
                  value: {
                    medicamentoId: '7b8d7b2a-0d8d-4f87-8a3f-9e5a3f2c1111',
                    tipo: 'intervalo',
                    diasSemana: [0, 1, 2, 3, 4, 5, 6],
                    intervaloHoras: 8,
                    horarioInicio: '06:00',
                    inicioEm: '2026-05-12',
                    fimEm: '2026-05-20',
                    toleranciaMinutos: 30,
                    cuidados: 'Manter intervalo regular.'
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Agendamento criado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Agendamento' }
              }
            }
          },
          '400': { $ref: '#/components/responses/ErroValidacao' },
          '404': { $ref: '#/components/responses/ErroNaoEncontrado' }
        }
      }
    },
    '/agendamentos/{id}': {
      get: {
        tags: ['Agendamentos'],
        summary: 'Busca um agendamento pelo id',
        description:
          'Carrega um agendamento especifico. Use o `id` retornado na criacao ou listagem de agendamentos.',
        parameters: [{ $ref: '#/components/parameters/AgendamentoId' }],
        responses: {
          '200': {
            description: 'Agendamento encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Agendamento' }
              }
            }
          },
          '404': { $ref: '#/components/responses/ErroNaoEncontrado' }
        }
      },
      put: {
        tags: ['Agendamentos'],
        summary: 'Atualiza um agendamento',
        description:
          'Atualiza a regra de horario. Pode trocar de `horarios_fixos` para `intervalo` ou atualizar apenas dias, horarios, tolerancia ou cuidados.',
        parameters: [{ $ref: '#/components/parameters/AgendamentoId' }],
        requestBody: {
          required: true,
          description:
            'Envie os campos que deseja alterar. Se `tipo` for `horarios_fixos`, envie `horarios`. Se `tipo` for `intervalo`, envie `intervaloHoras` e `horarioInicio`.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AtualizarAgendamento' },
              example: {
                tipo: 'horarios_fixos',
                diasSemana: [1, 3, 5],
                horarios: ['09:00'],
                toleranciaMinutos: 20,
                cuidados: 'Tomar apos o cafe da manha.',
                ativo: true
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Agendamento atualizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Agendamento' }
              }
            }
          },
          '400': { $ref: '#/components/responses/ErroValidacao' },
          '404': { $ref: '#/components/responses/ErroNaoEncontrado' }
        }
      },
      delete: {
        tags: ['Agendamentos'],
        summary: 'Remove um agendamento',
        description:
          'Faz remocao logica do agendamento, alterando `ativo` para false. O registro fica no banco para historico e auditoria futura.',
        parameters: [{ $ref: '#/components/parameters/AgendamentoId' }],
        responses: {
          '204': { description: 'Agendamento removido sem corpo de resposta' },
          '404': { $ref: '#/components/responses/ErroNaoEncontrado' }
        }
      }
    }
  },
  components: {
    parameters: {
      MedicamentoId: {
        name: 'id',
        in: 'path',
        required: true,
        description: 'UUID do medicamento.',
        schema: { type: 'string', format: 'uuid' },
        example: '7b8d7b2a-0d8d-4f87-8a3f-9e5a3f2c1111'
      },
      AgendamentoId: {
        name: 'id',
        in: 'path',
        required: true,
        description: 'UUID do agendamento.',
        schema: { type: 'string', format: 'uuid' },
        example: '1c70e1d4-73c0-4d9b-9d3a-2a7df0932222'
      }
    },
    responses: {
      ErroValidacao: {
        description: 'Erro de validacao. Algum campo foi enviado vazio, errado ou fora do formato esperado.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Erro' },
            example: { mensagem: 'Campo nome e obrigatorio' }
          }
        }
      },
      ErroNaoEncontrado: {
        description: 'Registro nao encontrado ou inativo.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Erro' },
            example: { mensagem: 'Medicamento nao encontrado' }
          }
        }
      }
    },
    schemas: {
      SaudeResposta: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            description: 'Indica que a API esta respondendo.',
            example: 'ok'
          }
        }
      },
      Erro: {
        type: 'object',
        properties: {
          mensagem: {
            type: 'string',
            description: 'Texto explicando o erro em portugues.',
            example: 'Campo nome e obrigatorio'
          }
        }
      },
      Medicamento: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Identificador unico criado pelo backend.'
          },
          nome: {
            type: 'string',
            description: 'Nome do medicamento.',
            example: 'Losartana'
          },
          dosagem: {
            type: 'string',
            description: 'Dosagem prescrita ou cadastrada.',
            example: '50mg'
          },
          observacoes: {
            type: 'string',
            nullable: true,
            description: 'Instrucoes adicionais simples.',
            example: 'Tomar pela manha com agua.'
          },
          ativo: {
            type: 'boolean',
            description: 'Indica se o medicamento aparece nas listagens.'
          },
          criadoEm: {
            type: 'string',
            format: 'date-time',
            description: 'Data de criacao.'
          },
          atualizadoEm: {
            type: 'string',
            format: 'date-time',
            description: 'Data da ultima atualizacao.'
          }
        }
      },
      CriarMedicamento: {
        type: 'object',
        required: ['nome', 'dosagem'],
        properties: {
          nome: {
            type: 'string',
            maxLength: 120,
            description: 'Obrigatorio. Nome do medicamento.',
            example: 'Losartana'
          },
          dosagem: {
            type: 'string',
            maxLength: 60,
            description: 'Obrigatorio. Dosagem do medicamento.',
            example: '50mg'
          },
          observacoes: {
            type: 'string',
            nullable: true,
            maxLength: 1000,
            description: 'Opcional. Instrucoes adicionais.',
            example: 'Tomar pela manha com agua.'
          }
        }
      },
      AtualizarMedicamento: {
        type: 'object',
        properties: {
          nome: {
            type: 'string',
            maxLength: 120,
            description: 'Opcional. Novo nome do medicamento.',
            example: 'Losartana Potassica'
          },
          dosagem: {
            type: 'string',
            maxLength: 60,
            description: 'Opcional. Nova dosagem do medicamento.',
            example: '50mg'
          },
          observacoes: {
            type: 'string',
            nullable: true,
            maxLength: 1000,
            description: 'Opcional. Novas instrucoes adicionais.',
            example: 'Tomar sempre no mesmo horario.'
          },
          ativo: {
            type: 'boolean',
            description: 'Use false para desativar ou true para reativar.'
          }
        }
      },
      Agendamento: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          medicamentoId: { type: 'string', format: 'uuid' },
          tipo: {
            type: 'string',
            enum: ['horarios_fixos', 'intervalo'],
            description: 'Forma de programacao do medicamento.'
          },
          diasSemana: {
            type: 'array',
            items: { type: 'integer', minimum: 0, maximum: 6 },
            description:
              'Dias da semana. 0=domingo, 1=segunda, 2=terca, 3=quarta, 4=quinta, 5=sexta, 6=sabado.',
            example: [1, 2, 3, 4, 5]
          },
          horarios: {
            type: 'array',
            nullable: true,
            items: { type: 'string', example: '08:00' },
            description:
              'Obrigatorio quando tipo for horarios_fixos. Use HH:mm.'
          },
          intervaloHoras: {
            type: 'integer',
            nullable: true,
            minimum: 1,
            maximum: 24,
            description:
              'Obrigatorio quando tipo for intervalo. Exemplo: 8 para tomar de 8 em 8 horas.'
          },
          horarioInicio: {
            type: 'string',
            nullable: true,
            description:
              'Obrigatorio quando tipo for intervalo. Primeiro horario do dia no formato HH:mm.',
            example: '06:00'
          },
          inicioEm: {
            type: 'string',
            nullable: true,
            format: 'date',
            description: 'Data de inicio do tratamento no formato YYYY-MM-DD.'
          },
          fimEm: {
            type: 'string',
            nullable: true,
            format: 'date',
            description:
              'Data final do tratamento no formato YYYY-MM-DD. Pode ser null para tratamento sem fim definido.'
          },
          toleranciaMinutos: {
            type: 'integer',
            minimum: 0,
            maximum: 240,
            description:
              'Tempo em minutos que o paciente tem para retirar o medicamento depois do alerta.'
          },
          cuidados: {
            type: 'string',
            nullable: true,
            description:
              'Orientacoes simples, como nao tomar com leite ou tomar apos refeicao.'
          },
          ativo: { type: 'boolean' },
          criadoEm: { type: 'string', format: 'date-time' },
          atualizadoEm: { type: 'string', format: 'date-time' }
        }
      },
      CriarAgendamento: {
        type: 'object',
        required: ['medicamentoId', 'tipo', 'diasSemana'],
        properties: {
          medicamentoId: {
            type: 'string',
            format: 'uuid',
            description:
              'Obrigatorio. Id do medicamento que sera agendado.'
          },
          tipo: {
            type: 'string',
            enum: ['horarios_fixos', 'intervalo'],
            description:
              'Obrigatorio. Use horarios_fixos para horarios exatos ou intervalo para repeticao de X em X horas.'
          },
          diasSemana: {
            type: 'array',
            items: { type: 'integer', minimum: 0, maximum: 6 },
            description:
              'Obrigatorio. 0=domingo, 1=segunda, 2=terca, 3=quarta, 4=quinta, 5=sexta, 6=sabado.'
          },
          horarios: {
            type: 'array',
            items: { type: 'string', example: '08:00' },
            description:
              'Obrigatorio para tipo horarios_fixos. Nao use este campo para tipo intervalo.'
          },
          intervaloHoras: {
            type: 'integer',
            minimum: 1,
            maximum: 24,
            description:
              'Obrigatorio para tipo intervalo. Nao use este campo para tipo horarios_fixos.'
          },
          horarioInicio: {
            type: 'string',
            description:
              'Obrigatorio para tipo intervalo. Primeiro horario do dia no formato HH:mm.'
          },
          inicioEm: {
            type: 'string',
            nullable: true,
            format: 'date',
            description: 'Opcional. Data de inicio no formato YYYY-MM-DD.'
          },
          fimEm: {
            type: 'string',
            nullable: true,
            format: 'date',
            description: 'Opcional. Data final no formato YYYY-MM-DD.'
          },
          toleranciaMinutos: {
            type: 'integer',
            minimum: 0,
            maximum: 240,
            default: 30,
            description:
              'Opcional. Tempo para considerar atraso depois do alerta.'
          },
          cuidados: {
            type: 'string',
            nullable: true,
            maxLength: 1000,
            description: 'Opcional. Orientacoes de cuidado.'
          }
        }
      },
      AtualizarAgendamento: {
        type: 'object',
        properties: {
          medicamentoId: {
            type: 'string',
            format: 'uuid',
            description:
              'Opcional. Use apenas se precisar trocar o medicamento do agendamento.'
          },
          tipo: {
            type: 'string',
            enum: ['horarios_fixos', 'intervalo'],
            description:
              'Opcional. Se trocar o tipo, ajuste tambem os campos de horario correspondentes.'
          },
          diasSemana: {
            type: 'array',
            items: { type: 'integer', minimum: 0, maximum: 6 },
            description:
              'Opcional. Dias da semana. 0=domingo, 1=segunda, 2=terca, 3=quarta, 4=quinta, 5=sexta, 6=sabado.'
          },
          horarios: {
            type: 'array',
            items: { type: 'string', example: '08:00' },
            description:
              'Opcional. Use quando tipo for horarios_fixos. Formato HH:mm.'
          },
          intervaloHoras: {
            type: 'integer',
            minimum: 1,
            maximum: 24,
            description:
              'Opcional. Use quando tipo for intervalo. Exemplo: 8 para de 8 em 8 horas.'
          },
          horarioInicio: {
            type: 'string',
            description:
              'Opcional. Use quando tipo for intervalo. Primeiro horario do dia no formato HH:mm.'
          },
          inicioEm: {
            type: 'string',
            nullable: true,
            format: 'date',
            description: 'Opcional. Nova data de inicio no formato YYYY-MM-DD.'
          },
          fimEm: {
            type: 'string',
            nullable: true,
            format: 'date',
            description: 'Opcional. Nova data final no formato YYYY-MM-DD.'
          },
          toleranciaMinutos: {
            type: 'integer',
            minimum: 0,
            maximum: 240,
            description:
              'Opcional. Novo tempo de tolerancia em minutos.'
          },
          cuidados: {
            type: 'string',
            nullable: true,
            maxLength: 1000,
            description: 'Opcional. Novas orientacoes de cuidado.'
          },
          ativo: {
            type: 'boolean',
            description: 'Use false para desativar ou true para reativar.'
          }
        }
      }
    }
  }
} as const;
