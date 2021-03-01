/*
 * SPDX-FileCopyrightText: 2021 The HedgeDoc developers (see AUTHORS file)
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import appConfigMock from '../../../config/mock/app.config.mock';
import mediaConfigMock from '../../../config/mock/media.config.mock';
import { LoggerModule } from '../../../logger/logger.module';
import { MediaUpload } from '../../../media/media-upload.entity';
import { MediaModule } from '../../../media/media.module';
import { AuthorColor } from '../../../notes/author-color.entity';
import { Note } from '../../../notes/note.entity';
import { NotesModule } from '../../../notes/notes.module';
import { Tag } from '../../../notes/tag.entity';
import { Authorship } from '../../../revisions/authorship.entity';
import { Revision } from '../../../revisions/revision.entity';
import { AuthToken } from '../../../auth/auth-token.entity';
import { Identity } from '../../../users/identity.entity';
import { User } from '../../../users/user.entity';
import { MediaController } from './media.controller';
import { NoteGroupPermission } from '../../../permissions/note-group-permission.entity';
import { NoteUserPermission } from '../../../permissions/note-user-permission.entity';
import { Group } from '../../../groups/group.entity';

describe('Media Controller', () => {
  let controller: MediaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MediaController],
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [appConfigMock, mediaConfigMock],
        }),
        LoggerModule,
        MediaModule,
        NotesModule,
      ],
    })
      .overrideProvider(getRepositoryToken(AuthorColor))
      .useValue({})
      .overrideProvider(getRepositoryToken(Authorship))
      .useValue({})
      .overrideProvider(getRepositoryToken(AuthToken))
      .useValue({})
      .overrideProvider(getRepositoryToken(Identity))
      .useValue({})
      .overrideProvider(getRepositoryToken(MediaUpload))
      .useValue({})
      .overrideProvider(getRepositoryToken(Note))
      .useValue({})
      .overrideProvider(getRepositoryToken(Revision))
      .useValue({})
      .overrideProvider(getRepositoryToken(User))
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

    controller = module.get<MediaController>(MediaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
