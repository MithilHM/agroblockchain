import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { ProduceBatch } from './ProduceBatch';

export enum AuditAction {
  BATCH_CREATED = 'batch_created',
  BATCH_TRANSFERRED = 'batch_transferred',
  STATUS_UPDATED = 'status_updated',
  PRICE_UPDATED = 'price_updated',
  FILE_UPLOADED = 'file_uploaded',
  USER_LOGIN = 'user_login',
  USER_REGISTERED = 'user_registered'
}

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: AuditAction })
  action!: AuditAction;

  @Column({ type: 'json', nullable: true })
  details?: any;

  @Column({ nullable: true })
  ipAddress?: string;

  @Column({ nullable: true })
  userAgent?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({ nullable: true })
  userId?: string;

  @ManyToOne(() => ProduceBatch, batch => batch.auditLogs, { nullable: true })
  @JoinColumn({ name: 'batchId' })
  batch?: ProduceBatch;

  @Column({ nullable: true })
  batchId?: string;

  @CreateDateColumn()
  createdAt: Date;
}