import { Table, TableForeignKey, TableIndex } from 'typeorm';
import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CriarTabelaEventosMedicamentos1730000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'eventos_medicamentos',
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
            isNullable: true
          },
          {
            name: 'agendamento_id',
            type: 'uuid',
            isNullable: true
          },
          {
            name: 'dispositivo_id',
            type: 'varchar',
            length: '120',
            isNullable: true
          },
          {
            name: 'tipo',
            type: 'varchar',
            length: '40',
            isNullable: false
          },
          {
            name: 'origem',
            type: 'varchar',
            length: '20',
            isNullable: false
          },
          {
            name: 'ocorrido_em',
            type: 'timestamp with time zone',
            isNullable: false
          },
          {
            name: 'descricao',
            type: 'text',
            isNullable: true
          },
          {
            name: 'dados',
            type: 'jsonb',
            isNullable: true
          },
          {
            name: 'criado_em',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false
          }
        ]
      })
    );

    await queryRunner.createForeignKey(
      'eventos_medicamentos',
      new TableForeignKey({
        columnNames: ['medicamento_id'],
        referencedTableName: 'medicamentos',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL'
      })
    );

    await queryRunner.createForeignKey(
      'eventos_medicamentos',
      new TableForeignKey({
        columnNames: ['agendamento_id'],
        referencedTableName: 'agendamentos_medicamentos',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL'
      })
    );

    await queryRunner.createIndices('eventos_medicamentos', [
      new TableIndex({
        name: 'idx_eventos_medicamentos_medicamento_id',
        columnNames: ['medicamento_id']
      }),
      new TableIndex({
        name: 'idx_eventos_medicamentos_agendamento_id',
        columnNames: ['agendamento_id']
      }),
      new TableIndex({
        name: 'idx_eventos_medicamentos_tipo',
        columnNames: ['tipo']
      }),
      new TableIndex({
        name: 'idx_eventos_medicamentos_ocorrido_em',
        columnNames: ['ocorrido_em']
      })
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('eventos_medicamentos');
  }
}
