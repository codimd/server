/*
 * SPDX-FileCopyrightText: 2021 The HedgeDoc developers (see AUTHORS file)
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Column, Entity, ManyToOne } from 'typeorm';
import { Group } from '../groups/group.entity';
import { Note } from '../notes/note.entity';

@Entity()
export class NoteGroupPermission {
  @ManyToOne((_) => Group, {
    primary: true,
    cascade: true,
    onDelete: 'CASCADE',
  })
  group: Group;

  @ManyToOne((_) => Note, (note) => note.groupPermissions, {
    primary: true,
    cascade: true,
    onDelete: 'CASCADE',
  })
  note: Note;

  @Column()
  canEdit: boolean;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  public static create(group: Group, canEdit: boolean): NoteGroupPermission {
    const groupPermission = new NoteGroupPermission();
    groupPermission.group = group;
    groupPermission.canEdit = canEdit;
    return groupPermission;
  }
}
