/*
 * SPDX-FileCopyrightText: 2021 The HedgeDoc developers (see AUTHORS file)
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable
@typescript-eslint/no-unsafe-call,
@typescript-eslint/no-unsafe-member-access,
@typescript-eslint/no-unsafe-return,
@typescript-eslint/require-await */

import { Test, TestingModule } from '@nestjs/testing';
import { LoggerModule } from '../logger/logger.module';
import { HistoryService } from './history.service';
import { UsersModule } from '../users/users.module';
import { NotesModule } from '../notes/notes.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Identity } from '../users/identity.entity';
import { User } from '../users/user.entity';
import { AuthorColor } from '../notes/author-color.entity';
import { Authorship } from '../revisions/authorship.entity';
import { HistoryEntry } from './history-entry.entity';
import { Note } from '../notes/note.entity';
import { Tag } from '../notes/tag.entity';
import { AuthToken } from '../auth/auth-token.entity';
import { Revision } from '../revisions/revision.entity';
import { Repository } from 'typeorm';
import { NotInDBError } from '../errors/errors';
import { NoteGroupPermission } from '../permissions/note-group-permission.entity';
import { NoteUserPermission } from '../permissions/note-user-permission.entity';
import { Group } from '../groups/group.entity';
import { ConfigModule } from '@nestjs/config';
import appConfigMock from '../config/mock/app.config.mock';

describe('HistoryService', () => {
  let service: HistoryService;
  let historyRepo: Repository<HistoryEntry>;
  let noteRepo: Repository<Note>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HistoryService,
        {
          provide: getRepositoryToken(HistoryEntry),
          useClass: Repository,
        },
      ],
      imports: [
        LoggerModule,
        UsersModule,
        NotesModule,
        ConfigModule.forRoot({
          isGlobal: true,
          load: [appConfigMock],
        }),
      ],
    })
      .overrideProvider(getRepositoryToken(User))
      .useValue({})
      .overrideProvider(getRepositoryToken(AuthToken))
      .useValue({})
      .overrideProvider(getRepositoryToken(Identity))
      .useValue({})
      .overrideProvider(getRepositoryToken(Authorship))
      .useValue({})
      .overrideProvider(getRepositoryToken(AuthorColor))
      .useValue({})
      .overrideProvider(getRepositoryToken(Revision))
      .useValue({})
      .overrideProvider(getRepositoryToken(Note))
      .useClass(Repository)
      .overrideProvider(getRepositoryToken(Tag))
      .useValue({})
      .overrideProvider(getRepositoryToken(NoteGroupPermission))
      .useValue({})
      .overrideProvider(getRepositoryToken(NoteUserPermission))
      .useValue({})
      .overrideProvider(getRepositoryToken(Group))
      .useValue({})
      .compile();

    service = module.get<HistoryService>(HistoryService);
    historyRepo = module.get<Repository<HistoryEntry>>(
      getRepositoryToken(HistoryEntry),
    );
    noteRepo = module.get<Repository<Note>>(getRepositoryToken(Note));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getEntriesByUser', () => {
    describe('works', () => {
      it('with an empty list', async () => {
        jest.spyOn(historyRepo, 'find').mockResolvedValueOnce([]);
        expect(await service.getEntriesByUser({} as User)).toEqual([]);
      });

      it('with an one element list', async () => {
        const historyEntry = new HistoryEntry();
        jest.spyOn(historyRepo, 'find').mockResolvedValueOnce([historyEntry]);
        expect(await service.getEntriesByUser({} as User)).toEqual([
          historyEntry,
        ]);
      });

      it('with an multiple element list', async () => {
        const historyEntry = new HistoryEntry();
        const historyEntry2 = new HistoryEntry();
        jest
          .spyOn(historyRepo, 'find')
          .mockResolvedValueOnce([historyEntry, historyEntry2]);
        expect(await service.getEntriesByUser({} as User)).toEqual([
          historyEntry,
          historyEntry2,
        ]);
      });
    });
  });

  describe('getEntryByNoteIdOrAlias', () => {
    const user = {} as User;
    const alias = 'alias';
    describe('works', () => {
      it('with history entry', async () => {
        const note = Note.create(user, alias);
        const historyEntry = HistoryEntry.create(user, note);
        jest.spyOn(historyRepo, 'findOne').mockResolvedValueOnce(historyEntry);
        jest.spyOn(noteRepo, 'findOne').mockResolvedValueOnce(note);
        expect(await service.getEntryByNoteIdOrAlias(alias, user)).toEqual(
          historyEntry,
        );
      });
    });
    describe('fails', () => {
      it('with an non-existing note', async () => {
        jest.spyOn(noteRepo, 'findOne').mockResolvedValueOnce(undefined);
        try {
          await service.getEntryByNoteIdOrAlias(alias, {} as User);
        } catch (e) {
          expect(e).toBeInstanceOf(NotInDBError);
        }
      });
    });
  });

  describe('createOrUpdateHistoryEntry', () => {
    describe('works', () => {
      it('without an preexisting entry', async () => {
        const user = {} as User;
        const alias = 'alias';
        jest.spyOn(historyRepo, 'findOne').mockResolvedValueOnce(undefined);
        jest
          .spyOn(historyRepo, 'save')
          .mockImplementation(
            async (entry: HistoryEntry): Promise<HistoryEntry> => entry,
          );
        const createHistoryEntry = await service.createOrUpdateHistoryEntry(
          Note.create(user, alias),
          user,
        );
        expect(createHistoryEntry.note.alias).toEqual(alias);
        expect(createHistoryEntry.note.owner).toEqual(user);
        expect(createHistoryEntry.user).toEqual(user);
        expect(createHistoryEntry.pinStatus).toEqual(false);
      });

      it('with an preexisting entry', async () => {
        const user = {} as User;
        const alias = 'alias';
        const historyEntry = HistoryEntry.create(
          user,
          Note.create(user, alias),
        );
        jest.spyOn(historyRepo, 'findOne').mockResolvedValueOnce(historyEntry);
        jest
          .spyOn(historyRepo, 'save')
          .mockImplementation(
            async (entry: HistoryEntry): Promise<HistoryEntry> => entry,
          );
        const createHistoryEntry = await service.createOrUpdateHistoryEntry(
          Note.create(user, alias),
          user,
        );
        expect(createHistoryEntry.note.alias).toEqual(alias);
        expect(createHistoryEntry.note.owner).toEqual(user);
        expect(createHistoryEntry.user).toEqual(user);
        expect(createHistoryEntry.pinStatus).toEqual(false);
        expect(createHistoryEntry.updatedAt.getTime()).toBeGreaterThanOrEqual(
          historyEntry.updatedAt.getTime(),
        );
      });
    });
  });

  describe('updateHistoryEntry', () => {
    describe('works', () => {
      it('with an entry', async () => {
        const user = {} as User;
        const alias = 'alias';
        const note = Note.create(user, alias);
        const historyEntry = HistoryEntry.create(user, note);
        jest.spyOn(historyRepo, 'findOne').mockResolvedValueOnce(historyEntry);
        jest.spyOn(noteRepo, 'findOne').mockResolvedValueOnce(note);
        jest
          .spyOn(historyRepo, 'save')
          .mockImplementation(
            async (entry: HistoryEntry): Promise<HistoryEntry> => entry,
          );
        const updatedHistoryEntry = await service.updateHistoryEntry(
          alias,
          user,
          {
            pinStatus: true,
          },
        );
        expect(updatedHistoryEntry.note.alias).toEqual(alias);
        expect(updatedHistoryEntry.note.owner).toEqual(user);
        expect(updatedHistoryEntry.user).toEqual(user);
        expect(updatedHistoryEntry.pinStatus).toEqual(true);
      });

      it('without an entry', async () => {
        const user = {} as User;
        const alias = 'alias';
        const note = Note.create(user, alias);
        jest.spyOn(historyRepo, 'findOne').mockResolvedValueOnce(undefined);
        jest.spyOn(noteRepo, 'findOne').mockResolvedValueOnce(note);
        try {
          await service.updateHistoryEntry(alias, user, {
            pinStatus: true,
          });
        } catch (e) {
          expect(e).toBeInstanceOf(NotInDBError);
        }
      });
    });
  });

  describe('deleteHistoryEntry', () => {
    describe('works', () => {
      it('with an entry', async () => {
        const user = {} as User;
        const alias = 'alias';
        const note = Note.create(user, alias);
        const historyEntry = HistoryEntry.create(user, note);
        jest.spyOn(historyRepo, 'findOne').mockResolvedValueOnce(historyEntry);
        jest.spyOn(noteRepo, 'findOne').mockResolvedValueOnce(note);
        jest.spyOn(historyRepo, 'remove').mockImplementation(
          async (entry: HistoryEntry): Promise<HistoryEntry> => {
            expect(entry).toEqual(historyEntry);
            return entry;
          },
        );
        await service.deleteHistoryEntry(alias, user);
      });
    });
    describe('fails', () => {
      const user = {} as User;
      const alias = 'alias';
      it('without an entry', async () => {
        const note = Note.create(user, alias);
        jest.spyOn(historyRepo, 'findOne').mockResolvedValueOnce(undefined);
        jest.spyOn(noteRepo, 'findOne').mockResolvedValueOnce(note);
        try {
          await service.deleteHistoryEntry(alias, user);
        } catch (e) {
          expect(e).toBeInstanceOf(NotInDBError);
        }
      });
      it('without a note', async () => {
        jest.spyOn(noteRepo, 'findOne').mockResolvedValueOnce(undefined);
        try {
          await service.getEntryByNoteIdOrAlias(alias, {} as User);
        } catch (e) {
          expect(e).toBeInstanceOf(NotInDBError);
        }
      });
    });
  });

  describe('toHistoryEntryDto', () => {
    describe('works', () => {
      it('with aliased note', async () => {
        const user = {} as User;
        const alias = 'alias';
        const title = 'title';
        const tags = ['tag1', 'tag2'];
        const note = Note.create(user, alias);
        note.title = title;
        note.tags = tags.map((tag) => {
          const newTag = new Tag();
          newTag.name = tag;
          return newTag;
        });
        const historyEntry = HistoryEntry.create(user, note);
        historyEntry.pinStatus = true;
        jest.spyOn(noteRepo, 'findOne').mockResolvedValueOnce(note);
        const historyEntryDto = service.toHistoryEntryDto(historyEntry);
        expect(historyEntryDto.pinStatus).toEqual(true);
        expect(historyEntryDto.identifier).toEqual(alias);
        expect(historyEntryDto.tags).toEqual(tags);
        expect(historyEntryDto.title).toEqual(title);
      });

      it('with regular note', async () => {
        const user = {} as User;
        const title = 'title';
        const id = 'id';
        const tags = ['tag1', 'tag2'];
        const note = Note.create(user);
        note.title = title;
        note.id = id;
        note.tags = tags.map((tag) => {
          const newTag = new Tag();
          newTag.name = tag;
          return newTag;
        });
        const historyEntry = HistoryEntry.create(user, note);
        historyEntry.pinStatus = true;
        jest.spyOn(noteRepo, 'findOne').mockResolvedValueOnce(note);
        const historyEntryDto = service.toHistoryEntryDto(historyEntry);
        expect(historyEntryDto.pinStatus).toEqual(true);
        expect(historyEntryDto.identifier).toEqual(id);
        expect(historyEntryDto.tags).toEqual(tags);
        expect(historyEntryDto.title).toEqual(title);
      });
    });
  });
});
