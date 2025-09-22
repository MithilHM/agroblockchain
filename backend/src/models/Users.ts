// src/models/User.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  walletAddress: string;

  @Column()
  name: string;

  @Column()
  role: 'farmer' | 'distributor' | 'retailer' | 'admin';

  @Column()
  passwordHash?: string; // if using password auth
}