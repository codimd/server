/*
 * SPDX-FileCopyrightText: 2021 The HedgeDoc developers (see AUTHORS file)
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LoggerModule } from '../../../logger/logger.module';
import { AuthorColor } from '../../../notes/author-color.entity';
import { Note } from '../../../notes/note.entity';
import { NotesService } from '../../../notes/notes.service';
import { Tag } from '../../../notes/tag.entity';
import { Authorship } from '../../../revisions/authorship.entity';
import { Revision } from '../../../revisions/revision.entity';
import { RevisionsModule } from '../../../revisions/revisions.module';
import { AuthToken } from '../../../auth/auth-token.entity';
import { Identity } from '../../../users/identity.entity';
import { User } from '../../../users/user.entity';
import { UsersModule } from '../../../users/users.module';
import { NotesController } from './notes.controller';
import { PermissionsModule } from '../../../permissions/permissions.module';
import { HistoryModule } from '../../../history/history.module';
import { HistoryEntry } from '../../../history/history-entry.entity';
import { NoteGroupPermission } from '../../../permissions/note-group-permission.entity';
import { NoteUserPermission } from '../../../permissions/note-user-permission.entity';
import { Group } from '../../../groups/group.entity';
import { GroupsModule } from '../../../groups/groups.module';
import { ConfigModule } from '@nestjs/config';
import appConfigMock from '../../../config/mock/app.config.mock';

describe('Notes Controller', () => {
  let controller: NotesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotesController],
      providers: [
        NotesService,
        {
          provide: getRepositoryToken(Note),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Tag),
          useValue: {},
        },
      ],
      imports: [
        RevisionsModule,
        UsersModule,
        GroupsModule,
        LoggerModule,
        PermissionsModule,
        HistoryModule,
        ConfigModule.forRoot({
          isGlobal: true,
          load: [appConfigMock],
        }),
      ],
    })
      .overrideProvider(getRepositoryToken(Note))
      .useValue({})
      .overrideProvider(getRepositoryToken(Revision))
      .useValue({})
      .overrideProvider(getRepositoryToken(Authorship))
      .useValue({})
      .overrideProvider(getRepositoryToken(AuthorColor))
      .useValue({})
      .overrideProvider(getRepositoryToken(User))
      .useValue({})
      .overrideProvider(getRepositoryToken(AuthToken))
      .useValue({})
      .overrideProvider(getRepositoryToken(Identity))
      .useValue({})
      .overrideProvider(getRepositoryToken(Note))
      .useValue({})
      .overrideProvider(getRepositoryToken(Tag))
      .useValue({})
      .overrideProvider(getRepositoryToken(HistoryEntry))
      .useValue({})
      .overrideProvider(getRepositoryToken(NoteGroupPermission))
      .useValue({})
      .overrideProvider(getRepositoryToken(NoteUserPermission))
      .useValue({})
      .overrideProvider(getRepositoryToken(Group))
      .useValue({})
      .compile();

    controller = module.get<NotesController>(NotesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
