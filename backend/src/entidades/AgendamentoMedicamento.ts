import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';

import { Medicamento } from './Medicamento.js';

export type TipoAgendamentoMedicamento = 'horarios_fixos' | 'intervalo';

@Entity('agendamentos_medicamentos')
export class AgendamentoMedicamento {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'medicamento_id', type: 'uuid' })
  medicamentoId!: string;

  @ManyToOne(() => Medicamento, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'medicamento_id' })
  medicamento!: Medicamento;

  @Column({ type: 'varchar', length: 30 })
  tipo!: TipoAgendamentoMedicamento;

  @Column({ name: 'dias_semana', type: 'jsonb' })
  diasSemana!: number[];

  @Column({ type: 'jsonb', nullable: true })
  horarios!: string[] | null;

  @Column({ name: 'intervalo_horas', type: 'int', nullable: true })
  intervaloHoras!: number | null;

  @Column({ name: 'horario_inicio', type: 'varchar', length: 5, nullable: true })
  horarioInicio!: string | null;

  @Column({ name: 'inicio_em', type: 'date', nullable: true })
  inicioEm!: string | null;

  @Column({ name: 'fim_em', type: 'date', nullable: true })
  fimEm!: string | null;

  @Column({ name: 'tolerancia_minutos', type: 'int', default: 30 })
  toleranciaMinutos!: number;

  @Column({ type: 'text', nullable: true })
  cuidados!: string | null;

  @Column({ type: 'boolean', default: true })
  ativo!: boolean;

  @CreateDateColumn({ name: 'criado_em', type: 'timestamp with time zone' })
  criadoEm!: Date;

  @UpdateDateColumn({ name: 'atualizado_em', type: 'timestamp with time zone' })
  atualizadoEm!: Date;
}
