/*
 * SPDX-FileCopyrightText: 2021 The HedgeDoc developers (see AUTHORS file)
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Identity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne((_) => User, (user) => user.identities, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  providerName: string;

  @Column()
  syncSource: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({
    nullable: true,
  })
  providerUserId?: string;

  @Column({
    nullable: true,
  })
  oAuthAccessToken?: string;

  @Column({
    nullable: true,
  })
  passwordHash?: string;
}
