import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';

import { Usuario } from './Usuario.js';

@Entity('pacientes')
export class Paciente {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'usuario_id', type: 'uuid', nullable: true, unique: true })
  usuarioId!: string | null;

  @OneToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'usuario_id' })
  usuario!: Usuario | null;

  @Column({ type: 'varchar', length: 120 })
  nome!: string;

  @Column({ name: 'data_nascimento', type: 'date', nullable: true })
  dataNascimento!: string | null;

  @Column({ type: 'text', nullable: true })
  observacoes!: string | null;

  @Column({ type: 'boolean', default: true })
  ativo!: boolean;

  @CreateDateColumn({ name: 'criado_em', type: 'timestamp with time zone' })
  criadoEm!: Date;

  @UpdateDateColumn({ name: 'atualizado_em', type: 'timestamp with time zone' })
  atualizadoEm!: Date;
}
