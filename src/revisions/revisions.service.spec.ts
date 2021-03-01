/*
 * SPDX-FileCopyrightText: 2021 The HedgeDoc developers (see AUTHORS file)
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LoggerModule } from '../logger/logger.module';
import { AuthorColor } from '../notes/author-color.entity';
import { Note } from '../notes/note.entity';
import { NotesModule } from '../notes/notes.module';
import { AuthToken } from '../auth/auth-token.entity';
import { Identity } from '../users/identity.entity';
import { User } from '../users/user.entity';
import { Authorship } from './authorship.entity';
import { Revision } from './revision.entity';
import { RevisionsService } from './revisions.service';
import { Tag } from '../notes/tag.entity';
import { NoteGroupPermission } from '../permissions/note-group-permission.entity';
import { NoteUserPermission } from '../permissions/note-user-permission.entity';
import { Group } from '../groups/group.entity';
import { ConfigModule } from '@nestjs/config';
import appConfigMock from '../config/mock/app.config.mock';

describe('RevisionsService', () => {
  let service: RevisionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RevisionsService,
        {
          provide: getRepositoryToken(Revision),
          useValue: {},
        },
      ],
      imports: [
        NotesModule,
        LoggerModule,
        ConfigModule.forRoot({
          isGlobal: true,
          load: [appConfigMock],
        }),
      ],
    })
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
      .overrideProvider(getRepositoryToken(Revision))
      .useValue({})
      .overrideProvider(getRepositoryToken(Tag))
      .useValue({})
      .overrideProvider(getRepositoryToken(NoteGroupPermission))
      .useValue({})
      .overrideProvider(getRepositoryToken(NoteUserPermission))
      .useValue({})
      .overrideProvider(getRepositoryToken(Group))
      .useValue({})
      .compile();

    service = module.get<RevisionsService>(RevisionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
