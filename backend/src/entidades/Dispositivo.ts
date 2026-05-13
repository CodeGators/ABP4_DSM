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

@Entity('dispositivos')
export class Dispositivo {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'paciente_id', type: 'uuid' })
  pacienteId!: string;

  @ManyToOne(() => Paciente, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'paciente_id' })
  paciente!: Paciente;

  @Column({ type: 'varchar', length: 120 })
  nome!: string;

  @Column({ type: 'varchar', length: 120, unique: true })
  identificador!: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  modelo!: string | null;

  @Column({ name: 'ultimo_sinal_em', type: 'timestamp with time zone', nullable: true })
  ultimoSinalEm!: Date | null;

  @Column({ type: 'boolean', default: true })
  ativo!: boolean;

  @CreateDateColumn({ name: 'criado_em', type: 'timestamp with time zone' })
  criadoEm!: Date;

  @UpdateDateColumn({ name: 'atualizado_em', type: 'timestamp with time zone' })
  atualizadoEm!: Date;
}
