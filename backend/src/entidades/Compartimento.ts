import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';

import { Dispositivo } from './Dispositivo.js';
import { Medicamento } from './Medicamento.js';

export type StatusCompartimento =
  | 'bloqueado'
  | 'liberado'
  | 'aberto'
  | 'erro';

@Entity('compartimentos')
export class Compartimento {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'dispositivo_id', type: 'uuid' })
  dispositivoId!: string;

  @ManyToOne(() => Dispositivo, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dispositivo_id' })
  dispositivo!: Dispositivo;

  @Column({ type: 'int' })
  numero!: number;

  @Column({ name: 'medicamento_id', type: 'uuid', nullable: true })
  medicamentoId!: string | null;

  @ManyToOne(() => Medicamento, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'medicamento_id' })
  medicamento!: Medicamento | null;

  @Column({ type: 'varchar', length: 30 })
  status!: StatusCompartimento;

  @Column({ type: 'text', nullable: true })
  observacoes!: string | null;

  @Column({ type: 'boolean', default: true })
  ativo!: boolean;

  @CreateDateColumn({ name: 'criado_em', type: 'timestamp with time zone' })
  criadoEm!: Date;

  @UpdateDateColumn({ name: 'atualizado_em', type: 'timestamp with time zone' })
  atualizadoEm!: Date;
}
