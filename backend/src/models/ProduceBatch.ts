import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from './User';
import { AuditLog } from './AuditLog';

export enum BatchStatus {
  HARVESTED = 'harvested',
  IN_TRANSIT = 'in_transit',
  WITH_DISTRIBUTOR = 'with_distributor',
  WITH_RETAILER = 'with_retailer',
  SOLD = 'sold',
  EXPIRED = 'expired'
}

@Entity('produce_batches')
export class ProduceBatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  batchId: string;

  @Column()
  produceType: string;

  @Column()
  origin: string;

  @Column({ type: 'enum', enum: BatchStatus, default: BatchStatus.HARVESTED })
  status: BatchStatus;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  currentPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity: number;

  @Column()
  unit: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'json', nullable: true })
  certifications?: any;

  @Column({ nullable: true })
  qrCodeUrl?: string;

  @Column({ type: 'json', nullable: true })
  images?: string[];

  @Column({ type: 'json', nullable: true })
  geolocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };

  @Column({ nullable: true })
  harvestDate?: Date;

  @Column({ nullable: true })
  expiryDate?: Date;

  @ManyToOne(() => User, user => user.batches)
  @JoinColumn({ name: 'currentOwnerId' })
  currentOwner: User;

  @Column()
  currentOwnerId: string;

  @Column()
  originalFarmerId: string;

  @Column({ type: 'text', array: true, default: [] })
  transferHistory: string[];

  @OneToMany(() => AuditLog, log => log.batch)
  auditLogs: AuditLog[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}