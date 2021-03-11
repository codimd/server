/*
 * SPDX-FileCopyrightText: 2021 The HedgeDoc developers (see AUTHORS file)
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Column, Entity, ManyToOne } from 'typeorm';
import { Note } from '../notes/note.entity';
import { User } from '../users/user.entity';

@Entity()
export class NoteUserPermission {
  @ManyToOne((_) => User, {
    primary: true,
    cascade: true,
    onDelete: 'CASCADE',
  })
  user: User;

  @ManyToOne((_) => Note, (note) => note.userPermissions, {
    primary: true,
    cascade: true,
    onDelete: 'CASCADE',
  })
  note: Note;

  @Column()
  canEdit: boolean;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  public static create(user: User, canEdit: boolean): NoteUserPermission {
    const userPermission = new NoteUserPermission();
    userPermission.user = user;
    userPermission.canEdit = canEdit;
    return userPermission;
  }
}
