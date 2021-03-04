/*
 * SPDX-FileCopyrightText: 2021 The HedgeDoc developers (see AUTHORS file)
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Test, TestingModule } from '@nestjs/testing';
import { MeController } from './me.controller';
import { UsersModule } from '../../../users/users.module';
import { LoggerModule } from '../../../logger/logger.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../../users/user.entity';
import { Identity } from '../../../users/identity.entity';
import { MediaModule } from '../../../media/media.module';
import { AuthorColor } from '../../../notes/author-color.entity';
import { NoteGroupPermission } from '../../../permissions/note-group-permission.entity';
import { NoteUserPermission } from '../../../permissions/note-user-permission.entity';
import { Authorship } from '../../../revisions/authorship.entity';
import { ConfigModule } from '@nestjs/config';
import mediaConfigMock from '../../../config/media.config.mock';
import { MediaUpload } from '../../../media/media-upload.entity';
import { Note } from '../../../notes/note.entity';
import { Tag } from '../../../notes/tag.entity';
import { Revision } from '../../../revisions/revision.entity';
import { Group } from '../../../groups/group.entity';

describe('MeController', () => {
  let controller: MeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MeController],
      imports: [
        UsersModule,
        LoggerModule,
        MediaModule,
        ConfigModule.forRoot({
          isGlobal: true,
          load: [mediaConfigMock],
        }),
      ],
    })
      .overrideProvider(getRepositoryToken(User))
      .useValue({})
      .overrideProvider(getRepositoryToken(Identity))
      .useValue({})
      .overrideProvider(getRepositoryToken(Note))
      .useValue({})
      .overrideProvider(getRepositoryToken(Tag))
      .useValue({})
      .overrideProvider(getRepositoryToken(Revision))
      .useValue({})
      .overrideProvider(getRepositoryToken(Group))
      .useValue({})
      .overrideProvider(getRepositoryToken(AuthorColor))
      .useValue({})
      .overrideProvider(getRepositoryToken(NoteGroupPermission))
      .useValue({})
      .overrideProvider(getRepositoryToken(NoteUserPermission))
      .useValue({})
      .overrideProvider(getRepositoryToken(Authorship))
      .useValue({})
      .overrideProvider(getRepositoryToken(MediaUpload))
      .useValue({})
      .compile();

    controller = module.get<MeController>(MeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
