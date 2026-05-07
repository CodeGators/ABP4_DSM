import { Table, TableForeignKey } from 'typeorm';
import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CriarTabelaAgendamentosMedicamentos1720000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'agendamentos_medicamentos',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()'
          },
          {
            name: 'medicamento_id',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'tipo',
            type: 'varchar',
            length: '30',
            isNullable: false
          },
          {
            name: 'dias_semana',
            type: 'jsonb',
            isNullable: false
          },
          {
            name: 'horarios',
            type: 'jsonb',
            isNullable: true
          },
          {
            name: 'intervalo_horas',
            type: 'int',
            isNullable: true
          },
          {
            name: 'horario_inicio',
            type: 'varchar',
            length: '5',
            isNullable: true
          },
          {
            name: 'inicio_em',
            type: 'date',
            isNullable: true
          },
          {
            name: 'fim_em',
            type: 'date',
            isNullable: true
          },
          {
            name: 'tolerancia_minutos',
            type: 'int',
            default: 30,
            isNullable: false
          },
          {
            name: 'cuidados',
            type: 'text',
            isNullable: true
          },
          {
            name: 'ativo',
            type: 'boolean',
            default: true,
            isNullable: false
          },
          {
            name: 'criado_em',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false
          },
          {
            name: 'atualizado_em',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false
          }
        ]
      })
    );

    await queryRunner.createForeignKey(
      'agendamentos_medicamentos',
      new TableForeignKey({
        columnNames: ['medicamento_id'],
        referencedTableName: 'medicamentos',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE'
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('agendamentos_medicamentos');
  }
}
