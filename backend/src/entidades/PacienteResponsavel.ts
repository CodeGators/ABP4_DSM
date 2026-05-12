import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';

import { Paciente } from './Paciente.js';
import { Usuario } from './Usuario.js';

@Entity('pacientes_responsaveis')
export class PacienteResponsavel {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'paciente_id', type: 'uuid' })
  pacienteId!: string;

  @ManyToOne(() => Paciente, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'paciente_id' })
  paciente!: Paciente;

  @Column({ name: 'responsavel_id', type: 'uuid' })
  responsavelId!: string;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'responsavel_id' })
  responsavel!: Usuario;

  @Column({ type: 'varchar', length: 80, nullable: true })
  parentesco!: string | null;

  @Column({ name: 'recebe_notificacoes', type: 'boolean', default: true })
  recebeNotificacoes!: boolean;

  @Column({ type: 'boolean', default: true })
  ativo!: boolean;

  @CreateDateColumn({ name: 'criado_em', type: 'timestamp with time zone' })
  criadoEm!: Date;

  @UpdateDateColumn({ name: 'atualizado_em', type: 'timestamp with time zone' })
  atualizadoEm!: Date;
}
