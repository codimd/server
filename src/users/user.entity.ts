/*
 * SPDX-FileCopyrightText: 2021 The HedgeDoc developers (see AUTHORS file)
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
  CreateDateColumn,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Column, OneToMany } from 'typeorm';
import { Note } from '../notes/note.entity';
import { AuthToken } from '../auth/auth-token.entity';
import { Identity } from './identity.entity';
import { Group } from '../groups/group.entity';
import { HistoryEntry } from '../history/history-entry.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    unique: true,
  })
  userName: string;

  @Column()
  displayName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({
    nullable: true,
  })
  photo?: string;

  @Column({
    nullable: true,
  })
  email?: string;

  @OneToMany((_) => Note, (note) => note.owner)
  ownedNotes: Note[];

  @OneToMany((_) => AuthToken, (authToken) => authToken.user)
  authTokens: AuthToken[];

  @OneToMany((_) => Identity, (identity) => identity.user)
  identities: Identity[];

  @ManyToMany((_) => Group, (group) => group.members)
  groups: Group[];

  @OneToMany((_) => HistoryEntry, (historyEntry) => historyEntry.user)
  historyEntries: HistoryEntry[];

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  public static create(
    userName: string,
    displayName: string,
  ): Pick<
    User,
    'userName' | 'displayName' | 'ownedNotes' | 'authTokens' | 'identities'
  > {
    const newUser = new User();
    newUser.userName = userName;
    newUser.displayName = displayName;
    return newUser;
  }
}
