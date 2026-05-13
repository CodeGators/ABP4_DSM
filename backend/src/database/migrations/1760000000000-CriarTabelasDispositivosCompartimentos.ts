import { Table, TableForeignKey, TableIndex } from 'typeorm';
import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CriarTabelasDispositivosCompartimentos1760000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'dispositivos',
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
            name: 'nome',
            type: 'varchar',
            length: '120',
            isNullable: false
          },
          {
            name: 'identificador',
            type: 'varchar',
            length: '120',
            isNullable: false,
            isUnique: true
          },
          {
            name: 'modelo',
            type: 'varchar',
            length: '120',
            isNullable: true
          },
          {
            name: 'ultimo_sinal_em',
            type: 'timestamp with time zone',
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

    await queryRunner.createTable(
      new Table({
        name: 'compartimentos',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()'
          },
          {
            name: 'dispositivo_id',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'numero',
            type: 'int',
            isNullable: false
          },
          {
            name: 'medicamento_id',
            type: 'uuid',
            isNullable: true
          },
          {
            name: 'status',
            type: 'varchar',
            length: '30',
            isNullable: false
          },
          {
            name: 'observacoes',
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
      'dispositivos',
      new TableForeignKey({
        columnNames: ['paciente_id'],
        referencedTableName: 'pacientes',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE'
      })
    );

    await queryRunner.createForeignKey(
      'compartimentos',
      new TableForeignKey({
        columnNames: ['dispositivo_id'],
        referencedTableName: 'dispositivos',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE'
      })
    );

    await queryRunner.createForeignKey(
      'compartimentos',
      new TableForeignKey({
        columnNames: ['medicamento_id'],
        referencedTableName: 'medicamentos',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL'
      })
    );

    await queryRunner.createIndices('dispositivos', [
      new TableIndex({
        name: 'idx_dispositivos_paciente_id',
        columnNames: ['paciente_id']
      })
    ]);

    await queryRunner.createIndices('compartimentos', [
      new TableIndex({
        name: 'idx_compartimentos_dispositivo_id',
        columnNames: ['dispositivo_id']
      }),
      new TableIndex({
        name: 'idx_compartimentos_medicamento_id',
        columnNames: ['medicamento_id']
      }),
      new TableIndex({
        name: 'idx_compartimentos_numero_ativo',
        columnNames: ['dispositivo_id', 'numero'],
        isUnique: true,
        where: 'ativo = true'
      })
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('compartimentos');
    await queryRunner.dropTable('dispositivos');
  }
}
