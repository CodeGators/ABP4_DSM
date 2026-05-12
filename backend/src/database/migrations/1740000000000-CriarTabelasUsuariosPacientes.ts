import { Table, TableForeignKey, TableIndex } from 'typeorm';
import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CriarTabelasUsuariosPacientes1740000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'usuarios',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()'
          },
          {
            name: 'nome',
            type: 'varchar',
            length: '120',
            isNullable: false
          },
          {
            name: 'email',
            type: 'varchar',
            length: '160',
            isNullable: false,
            isUnique: true
          },
          {
            name: 'telefone',
            type: 'varchar',
            length: '30',
            isNullable: true
          },
          {
            name: 'tipo',
            type: 'varchar',
            length: '30',
            isNullable: false
          },
          {
            name: 'recebe_notificacoes',
            type: 'boolean',
            default: false,
            isNullable: false
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
        name: 'pacientes',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()'
          },
          {
            name: 'usuario_id',
            type: 'uuid',
            isNullable: true,
            isUnique: true
          },
          {
            name: 'nome',
            type: 'varchar',
            length: '120',
            isNullable: false
          },
          {
            name: 'data_nascimento',
            type: 'date',
            isNullable: true
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

    await queryRunner.createTable(
      new Table({
        name: 'pacientes_responsaveis',
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
            name: 'parentesco',
            type: 'varchar',
            length: '80',
            isNullable: true
          },
          {
            name: 'recebe_notificacoes',
            type: 'boolean',
            default: true,
            isNullable: false
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
      'pacientes',
      new TableForeignKey({
        columnNames: ['usuario_id'],
        referencedTableName: 'usuarios',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL'
      })
    );

    await queryRunner.createForeignKey(
      'pacientes_responsaveis',
      new TableForeignKey({
        columnNames: ['paciente_id'],
        referencedTableName: 'pacientes',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE'
      })
    );

    await queryRunner.createForeignKey(
      'pacientes_responsaveis',
      new TableForeignKey({
        columnNames: ['responsavel_id'],
        referencedTableName: 'usuarios',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE'
      })
    );

    await queryRunner.createIndices('pacientes_responsaveis', [
      new TableIndex({
        name: 'idx_pacientes_responsaveis_paciente_id',
        columnNames: ['paciente_id']
      }),
      new TableIndex({
        name: 'idx_pacientes_responsaveis_responsavel_id',
        columnNames: ['responsavel_id']
      }),
      new TableIndex({
        name: 'idx_pacientes_responsaveis_unico',
        columnNames: ['paciente_id', 'responsavel_id'],
        isUnique: true
      })
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('pacientes_responsaveis');
    await queryRunner.dropTable('pacientes');
    await queryRunner.dropTable('usuarios');
  }
}
