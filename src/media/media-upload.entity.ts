/*
 * SPDX-FileCopyrightText: 2021 The HedgeDoc developers (see AUTHORS file)
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as crypto from 'crypto';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Note } from '../notes/note.entity';
import { User } from '../users/user.entity';
import { BackendType } from './backends/backend-type.enum';

export type BackendData = string | null;

@Entity()
export class MediaUpload {
  @PrimaryColumn()
  id: string;

  @ManyToOne((_) => Note, (note) => note.mediaUploads, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  note: Note;

  @ManyToOne((_) => User, (user) => user.mediaUploads, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  user: User;

  @Column({
    nullable: false,
  })
  backendType: string;

  @Column()
  fileUrl: string;

  @Column({
    nullable: true,
  })
  backendData: BackendData;

  @CreateDateColumn()
  createdAt: Date;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  public static create(
    note: Note,
    user: User,
    extension: string,
    backendType: BackendType,
    backendData?: string,
  ): MediaUpload {
    const upload = new MediaUpload();
    const randomBytes = crypto.randomBytes(16);
    upload.id = randomBytes.toString('hex') + '.' + extension;
    upload.note = note;
    upload.user = user;
    upload.backendType = backendType;
    if (backendData) {
      upload.backendData = backendData;
    } else {
      upload.backendData = null;
    }
    return upload;
  }
}
