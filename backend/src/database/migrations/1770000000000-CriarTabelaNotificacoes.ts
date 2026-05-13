import { Table, TableForeignKey, TableIndex } from 'typeorm';
import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CriarTabelaNotificacoes1770000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'notificacoes',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()'
          },
          {
            name: 'paciente_id',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'responsavel_id',
            type: 'uuid',
            isNullable: false
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
            name: 'evento_id',
            type: 'uuid',
            isNullable: true
          },
          {
            name: 'tipo',
            type: 'varchar',
            length: '40',
            isNullable: false
          },
          {
            name: 'canal',
            type: 'varchar',
            length: '20',
            isNullable: false
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            isNullable: false
          },
          {
            name: 'titulo',
            type: 'varchar',
            length: '160',
            isNullable: false
          },
          {
            name: 'mensagem',
            type: 'text',
            isNullable: false
          },
          {
            name: 'enviada_em',
            type: 'timestamp with time zone',
            isNullable: true
          },
          {
            name: 'lida_em',
            type: 'timestamp with time zone',
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
      'notificacoes',
      new TableForeignKey({
        columnNames: ['paciente_id'],
        referencedTableName: 'pacientes',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE'
      })
    );

    await queryRunner.createForeignKey(
      'notificacoes',
      new TableForeignKey({
        columnNames: ['responsavel_id'],
        referencedTableName: 'usuarios',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE'
      })
    );

    await queryRunner.createForeignKey(
      'notificacoes',
      new TableForeignKey({
        columnNames: ['medicamento_id'],
        referencedTableName: 'medicamentos',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL'
      })
    );

    await queryRunner.createForeignKey(
      'notificacoes',
      new TableForeignKey({
        columnNames: ['agendamento_id'],
        referencedTableName: 'agendamentos_medicamentos',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL'
      })
    );

    await queryRunner.createForeignKey(
      'notificacoes',
      new TableForeignKey({
        columnNames: ['evento_id'],
        referencedTableName: 'eventos_medicamentos',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL'
      })
    );

    await queryRunner.createIndices('notificacoes', [
      new TableIndex({
        name: 'idx_notificacoes_paciente_id',
        columnNames: ['paciente_id']
      }),
      new TableIndex({
        name: 'idx_notificacoes_responsavel_id',
        columnNames: ['responsavel_id']
      }),
      new TableIndex({
        name: 'idx_notificacoes_status',
        columnNames: ['status']
      }),
      new TableIndex({
        name: 'idx_notificacoes_evento_responsavel',
        columnNames: ['evento_id', 'responsavel_id'],
        isUnique: true
      })
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('notificacoes');
  }
}
