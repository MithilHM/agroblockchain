import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ProduceBatch } from './ProduceBatch';

export enum UserRole {
  FARMER = 'farmer',
  DISTRIBUTOR = 'distributor',
  RETAILER = 'retailer',
  REGULATOR = 'regulator',
  ADMIN = 'admin'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended'
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column()
  name!: string;

  @Column({ type: 'enum', enum: UserRole })
  role!: UserRole;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status!: UserStatus;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ nullable: true })
  walletAddress?: string;

  @Column({ type: 'json', nullable: true })
  kycDocuments?: any;

  @Column({ default: false })
  isVerified!: boolean;

  @OneToMany(() => ProduceBatch, batch => batch.currentOwner)
  batches!: ProduceBatch[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}