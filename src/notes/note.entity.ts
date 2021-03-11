/*
 * SPDX-FileCopyrightText: 2021 The HedgeDoc developers (see AUTHORS file)
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { generate as shortIdGenerate } from 'shortid';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { NoteGroupPermission } from '../permissions/note-group-permission.entity';
import { NoteUserPermission } from '../permissions/note-user-permission.entity';
import { Revision } from '../revisions/revision.entity';
import { User } from '../users/user.entity';
import { AuthorColor } from './author-color.entity';
import { Tag } from './tag.entity';
import { HistoryEntry } from '../history/history-entry.entity';
import { MediaUpload } from '../media/media-upload.entity';

@Entity()
export class Note {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({
    nullable: false,
    unique: true,
  })
  shortid: string;
  @Column({
    unique: true,
    nullable: true,
  })
  alias?: string;
  @OneToMany(
    (_) => NoteGroupPermission,
    (groupPermission) => groupPermission.note,
  )
  groupPermissions: NoteGroupPermission[];
  @OneToMany((_) => NoteUserPermission, (userPermission) => userPermission.note)
  userPermissions: NoteUserPermission[];
  @Column({
    nullable: false,
    default: 0,
  })
  viewCount: number;
  @ManyToOne((_) => User, (user) => user.ownedNotes, {
    onDelete: 'CASCADE',
  })
  owner: User;
  @OneToMany((_) => Revision, (revision) => revision.note, { cascade: true })
  revisions: Promise<Revision[]>;
  @OneToMany((_) => AuthorColor, (authorColor) => authorColor.note)
  authorColors: AuthorColor[];
  @OneToMany((_) => HistoryEntry, (historyEntry) => historyEntry.user)
  historyEntries: HistoryEntry[];
  @OneToMany((_) => MediaUpload, (mediaUpload) => mediaUpload.note)
  mediaUploads: MediaUpload[];

  @Column({
    nullable: true,
  })
  description?: string;
  @Column({
    nullable: true,
  })
  title?: string;

  @ManyToMany((_) => Tag, (tag) => tag.notes, { eager: true, cascade: true })
  @JoinTable()
  tags: Tag[];

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  public static create(owner?: User, alias?: string, shortid?: string): Note {
    if (!shortid) {
      shortid = shortIdGenerate();
    }
    const newNote = new Note();
    newNote.shortid = shortid;
    newNote.alias = alias;
    newNote.viewCount = 0;
    newNote.owner = owner;
    newNote.authorColors = [];
    newNote.userPermissions = [];
    newNote.groupPermissions = [];
    newNote.revisions = Promise.resolve([]) as Promise<Revision[]>;
    newNote.description = null;
    newNote.title = null;
    newNote.tags = [];
    return newNote;
  }
}
