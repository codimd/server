/*
 * SPDX-FileCopyrightText: 2021 The HedgeDoc developers (see AUTHORS file)
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable
@typescript-eslint/no-unsafe-assignment,
@typescript-eslint/no-unsafe-member-access
*/

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LoggerModule } from '../logger/logger.module';
import { Authorship } from '../revisions/authorship.entity';
import { Revision } from '../revisions/revision.entity';
import { RevisionsModule } from '../revisions/revisions.module';
import { AuthToken } from '../auth/auth-token.entity';
import { Identity } from '../users/identity.entity';
import { User } from '../users/user.entity';
import { UsersModule } from '../users/users.module';
import { AuthorColor } from './author-color.entity';
import { Note } from './note.entity';
import { NotesService } from './notes.service';
import { Repository } from 'typeorm';
import { Tag } from './tag.entity';
import {
  AlreadyInDBError,
  ForbiddenIdError,
  NotInDBError,
  PermissionsUpdateInconsistentError,
} from '../errors/errors';
import {
  NoteGroupPermissionUpdateDto,
  NoteUserPermissionUpdateDto,
} from './note-permissions.dto';
import { NoteGroupPermission } from '../permissions/note-group-permission.entity';
import { NoteUserPermission } from '../permissions/note-user-permission.entity';
import { GroupsModule } from '../groups/groups.module';
import { Group } from '../groups/group.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import appConfigMock from '../config/mock/app.config.mock';

describe('NotesService', () => {
  let service: NotesService;
  let noteRepo: Repository<Note>;
  let revisionRepo: Repository<Revision>;
  let userRepo: Repository<User>;
  let groupRepo: Repository<Group>;
  let forbiddenNoteId: string;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotesService,
        {
          provide: getRepositoryToken(Note),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Tag),
          useClass: Repository,
        },
      ],
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [appConfigMock],
        }),
        LoggerModule,
        UsersModule,
        GroupsModule,
        RevisionsModule,
      ],
    })
      .overrideProvider(getRepositoryToken(Note))
      .useClass(Repository)
      .overrideProvider(getRepositoryToken(Tag))
      .useClass(Repository)
      .overrideProvider(getRepositoryToken(User))
      .useClass(Repository)
      .overrideProvider(getRepositoryToken(AuthToken))
      .useValue({})
      .overrideProvider(getRepositoryToken(Identity))
      .useValue({})
      .overrideProvider(getRepositoryToken(Authorship))
      .useValue({})
      .overrideProvider(getRepositoryToken(AuthorColor))
      .useValue({})
      .overrideProvider(getRepositoryToken(Revision))
      .useClass(Repository)
      .overrideProvider(getRepositoryToken(NoteGroupPermission))
      .useValue({})
      .overrideProvider(getRepositoryToken(NoteUserPermission))
      .useValue({})
      .overrideProvider(getRepositoryToken(Group))
      .useClass(Repository)
      .compile();

    const config = module.get<ConfigService>(ConfigService);
    forbiddenNoteId = config.get('appConfig').forbiddenNoteIds[0];
    service = module.get<NotesService>(NotesService);
    noteRepo = module.get<Repository<Note>>(getRepositoryToken(Note));
    revisionRepo = module.get<Repository<Revision>>(
      getRepositoryToken(Revision),
    );
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
    groupRepo = module.get<Repository<Group>>(getRepositoryToken(Group));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserNotes', () => {
    describe('works', () => {
      const user = User.create('hardcoded', 'Testy') as User;
      const alias = 'alias';
      const note = Note.create(user, alias);

      it('with no note', async () => {
        jest.spyOn(noteRepo, 'find').mockResolvedValueOnce(undefined);
        const notes = await service.getUserNotes(user);
        expect(notes).toEqual([]);
      });

      it('with one note', async () => {
        jest.spyOn(noteRepo, 'find').mockResolvedValueOnce([note]);
        const notes = await service.getUserNotes(user);
        expect(notes).toEqual([note]);
      });

      it('with multiple note', async () => {
        jest.spyOn(noteRepo, 'find').mockResolvedValueOnce([note, note]);
        const notes = await service.getUserNotes(user);
        expect(notes).toEqual([note, note]);
      });
    });
  });

  describe('createNote', () => {
    const user = User.create('hardcoded', 'Testy') as User;
    const alias = 'alias';
    const content = 'testContent';
    describe('works', () => {
      beforeEach(() => {
        jest
          .spyOn(noteRepo, 'save')
          .mockImplementation(async (note: Note): Promise<Note> => note);
      });
      it('without alias, without owner', async () => {
        const newNote = await service.createNote(content);
        const revisions = await newNote.revisions;
        expect(revisions).toHaveLength(1);
        expect(revisions[0].content).toEqual(content);
        expect(newNote.historyEntries).toBeUndefined();
        expect(newNote.userPermissions).toHaveLength(0);
        expect(newNote.groupPermissions).toHaveLength(0);
        expect(newNote.tags).toHaveLength(0);
        expect(newNote.owner).toBeUndefined();
        expect(newNote.alias).toBeUndefined();
      });
      it('without alias, with owner', async () => {
        const newNote = await service.createNote(content, undefined, user);
        const revisions = await newNote.revisions;
        expect(revisions).toHaveLength(1);
        expect(revisions[0].content).toEqual(content);
        expect(newNote.historyEntries).toHaveLength(1);
        expect(newNote.historyEntries[0].user).toEqual(user);
        expect(newNote.userPermissions).toHaveLength(0);
        expect(newNote.groupPermissions).toHaveLength(0);
        expect(newNote.tags).toHaveLength(0);
        expect(newNote.owner).toEqual(user);
        expect(newNote.alias).toBeUndefined();
      });
      it('with alias, without owner', async () => {
        const newNote = await service.createNote(content, alias);
        const revisions = await newNote.revisions;
        expect(revisions).toHaveLength(1);
        expect(revisions[0].content).toEqual(content);
        expect(newNote.historyEntries).toBeUndefined();
        expect(newNote.userPermissions).toHaveLength(0);
        expect(newNote.groupPermissions).toHaveLength(0);
        expect(newNote.tags).toHaveLength(0);
        expect(newNote.owner).toBeUndefined();
        expect(newNote.alias).toEqual(alias);
      });
      it('with alias, with owner', async () => {
        const newNote = await service.createNote(content, alias, user);
        const revisions = await newNote.revisions;
        expect(revisions).toHaveLength(1);
        expect(revisions[0].content).toEqual(content);
        expect(newNote.historyEntries).toHaveLength(1);
        expect(newNote.historyEntries[0].user).toEqual(user);
        expect(newNote.userPermissions).toHaveLength(0);
        expect(newNote.groupPermissions).toHaveLength(0);
        expect(newNote.tags).toHaveLength(0);
        expect(newNote.owner).toEqual(user);
        expect(newNote.alias).toEqual(alias);
      });
    });
    describe('fails:', () => {
      it('alias is forbidden', async () => {
        try {
          await service.createNote(content, forbiddenNoteId);
        } catch (e) {
          expect(e).toBeInstanceOf(ForbiddenIdError);
        }
      });

      it('alias is already used', async () => {
        jest.spyOn(noteRepo, 'save').mockImplementationOnce(async () => {
          throw new Error();
        });
        try {
          await service.createNote(content, alias);
        } catch (e) {
          expect(e).toBeInstanceOf(AlreadyInDBError);
        }
      });
    });
  });

  describe('getNoteContent', () => {
    it('works', async () => {
      const content = 'testContent';
      jest
        .spyOn(noteRepo, 'save')
        .mockImplementation(async (note: Note): Promise<Note> => note);
      const newNote = await service.createNote(content);
      const revisions = await newNote.revisions;
      jest.spyOn(revisionRepo, 'findOne').mockResolvedValueOnce(revisions[0]);
      void service.getNoteContent(newNote).then((result) => {
        expect(result).toEqual(content);
      });
    });
  });

  describe('getLatestRevision', () => {
    it('works', async () => {
      const content = 'testContent';
      jest
        .spyOn(noteRepo, 'save')
        .mockImplementation(async (note: Note): Promise<Note> => note);
      const newNote = await service.createNote(content);
      const revisions = await newNote.revisions;
      jest.spyOn(revisionRepo, 'findOne').mockResolvedValueOnce(revisions[0]);
      void service.getLatestRevision(newNote).then((result) => {
        expect(result).toEqual(revisions[0]);
      });
    });
  });

  describe('getFirstRevision', () => {
    it('works', async () => {
      const user = {} as User;
      user.userName = 'hardcoded';
      const content = 'testContent';
      jest
        .spyOn(noteRepo, 'save')
        .mockImplementation(async (note: Note): Promise<Note> => note);
      const newNote = await service.createNote(content);
      const revisions = await newNote.revisions;
      jest.spyOn(revisionRepo, 'findOne').mockResolvedValueOnce(revisions[0]);
      void service.getLatestRevision(newNote).then((result) => {
        expect(result).toEqual(revisions[0]);
      });
    });
  });

  describe('getNoteByIdOrAlias', () => {
    it('works', async () => {
      const user = User.create('hardcoded', 'Testy') as User;
      const note = Note.create(user);
      jest.spyOn(noteRepo, 'findOne').mockResolvedValueOnce(note);
      const foundNote = await service.getNoteByIdOrAlias('noteThatExists');
      expect(foundNote).toEqual(note);
    });
    describe('fails:', () => {
      it('no note found', async () => {
        jest.spyOn(noteRepo, 'findOne').mockResolvedValueOnce(undefined);
        try {
          await service.getNoteByIdOrAlias('noteThatDoesNoteExist');
        } catch (e) {
          expect(e).toBeInstanceOf(NotInDBError);
        }
      });
      it('id is forbidden', async () => {
        jest.spyOn(noteRepo, 'findOne').mockResolvedValueOnce(undefined);
        try {
          await service.getNoteByIdOrAlias(forbiddenNoteId);
        } catch (e) {
          expect(e).toBeInstanceOf(ForbiddenIdError);
        }
      });
    });
  });

  describe('deleteNote', () => {
    it('works', async () => {
      const user = User.create('hardcoded', 'Testy') as User;
      const note = Note.create(user);
      jest
        .spyOn(noteRepo, 'remove')
        .mockImplementationOnce(async (entry, _) => {
          expect(entry).toEqual(note);
          return entry;
        });
      await service.deleteNote(note);
    });
  });

  describe('updateNote', () => {
    it('works', async () => {
      const user = User.create('hardcoded', 'Testy') as User;
      const note = Note.create(user);
      const revisionLength = (await note.revisions).length;
      jest
        .spyOn(noteRepo, 'save')
        .mockImplementationOnce(async (entry: Note) => {
          return entry;
        });
      const updatedNote = await service.updateNote(note, 'newContent');
      expect(await updatedNote.revisions).toHaveLength(revisionLength + 1);
    });
  });

  describe('updateNotePermissions', () => {
    const userPermissionUpdate = new NoteUserPermissionUpdateDto();
    userPermissionUpdate.username = 'hardcoded';
    userPermissionUpdate.canEdit = true;
    const groupPermissionUpate = new NoteGroupPermissionUpdateDto();
    groupPermissionUpate.groupname = 'testGroup';
    groupPermissionUpate.canEdit = false;
    const user = User.create(userPermissionUpdate.username, 'Testy') as User;
    const group = Group.create(
      groupPermissionUpate.groupname,
      groupPermissionUpate.groupname,
    );
    const note = Note.create(user);
    describe('works', () => {
      it('with empty GroupPermissions and with empty UserPermissions', async () => {
        jest
          .spyOn(noteRepo, 'save')
          .mockImplementationOnce(async (entry: Note) => {
            return entry;
          });
        const savedNote = await service.updateNotePermissions(note, {
          sharedToUsers: [],
          sharedToGroups: [],
        });
        expect(savedNote.userPermissions).toHaveLength(0);
        expect(savedNote.groupPermissions).toHaveLength(0);
      });
      it('with empty GroupPermissions and with new UserPermissions', async () => {
        jest
          .spyOn(noteRepo, 'save')
          .mockImplementationOnce(async (entry: Note) => {
            return entry;
          });
        jest.spyOn(userRepo, 'findOne').mockResolvedValueOnce(user);
        const savedNote = await service.updateNotePermissions(note, {
          sharedToUsers: [userPermissionUpdate],
          sharedToGroups: [],
        });
        expect(savedNote.userPermissions).toHaveLength(1);
        expect(savedNote.userPermissions[0].user.userName).toEqual(
          userPermissionUpdate.username,
        );
        expect(savedNote.userPermissions[0].canEdit).toEqual(
          userPermissionUpdate.canEdit,
        );
        expect(savedNote.groupPermissions).toHaveLength(0);
      });
      it('with empty GroupPermissions and with existing UserPermissions', async () => {
        const noteWithPreexistingPermissions: Note = { ...note };
        noteWithPreexistingPermissions.userPermissions = [
          {
            note: noteWithPreexistingPermissions,
            user: user,
            canEdit: !userPermissionUpdate.canEdit,
          },
        ];
        jest
          .spyOn(noteRepo, 'save')
          .mockImplementationOnce(async (entry: Note) => {
            return entry;
          });
        jest.spyOn(userRepo, 'findOne').mockResolvedValueOnce(user);
        const savedNote = await service.updateNotePermissions(note, {
          sharedToUsers: [userPermissionUpdate],
          sharedToGroups: [],
        });
        expect(savedNote.userPermissions).toHaveLength(1);
        expect(savedNote.userPermissions[0].user.userName).toEqual(
          userPermissionUpdate.username,
        );
        expect(savedNote.userPermissions[0].canEdit).toEqual(
          userPermissionUpdate.canEdit,
        );
        expect(savedNote.groupPermissions).toHaveLength(0);
      });
      it('with new GroupPermissions and with empty UserPermissions', async () => {
        jest
          .spyOn(noteRepo, 'save')
          .mockImplementationOnce(async (entry: Note) => {
            return entry;
          });
        jest.spyOn(groupRepo, 'findOne').mockResolvedValueOnce(group);
        const savedNote = await service.updateNotePermissions(note, {
          sharedToUsers: [],
          sharedToGroups: [groupPermissionUpate],
        });
        expect(savedNote.userPermissions).toHaveLength(0);
        expect(savedNote.groupPermissions[0].group.name).toEqual(
          groupPermissionUpate.groupname,
        );
        expect(savedNote.groupPermissions[0].canEdit).toEqual(
          groupPermissionUpate.canEdit,
        );
      });
      it('with new GroupPermissions and with new UserPermissions', async () => {
        jest
          .spyOn(noteRepo, 'save')
          .mockImplementationOnce(async (entry: Note) => {
            return entry;
          });
        jest.spyOn(userRepo, 'findOne').mockResolvedValueOnce(user);
        jest.spyOn(groupRepo, 'findOne').mockResolvedValueOnce(group);
        const savedNote = await service.updateNotePermissions(note, {
          sharedToUsers: [userPermissionUpdate],
          sharedToGroups: [groupPermissionUpate],
        });
        expect(savedNote.userPermissions[0].user.userName).toEqual(
          userPermissionUpdate.username,
        );
        expect(savedNote.userPermissions[0].canEdit).toEqual(
          userPermissionUpdate.canEdit,
        );
        expect(savedNote.groupPermissions[0].group.name).toEqual(
          groupPermissionUpate.groupname,
        );
        expect(savedNote.groupPermissions[0].canEdit).toEqual(
          groupPermissionUpate.canEdit,
        );
      });
      it('with new GroupPermissions and with existing UserPermissions', async () => {
        const noteWithUserPermission: Note = { ...note };
        noteWithUserPermission.userPermissions = [
          {
            note: noteWithUserPermission,
            user: user,
            canEdit: !userPermissionUpdate.canEdit,
          },
        ];
        jest
          .spyOn(noteRepo, 'save')
          .mockImplementationOnce(async (entry: Note) => {
            return entry;
          });
        jest.spyOn(userRepo, 'findOne').mockResolvedValueOnce(user);
        jest.spyOn(groupRepo, 'findOne').mockResolvedValueOnce(group);
        const savedNote = await service.updateNotePermissions(
          noteWithUserPermission,
          {
            sharedToUsers: [userPermissionUpdate],
            sharedToGroups: [groupPermissionUpate],
          },
        );
        expect(savedNote.userPermissions[0].user.userName).toEqual(
          userPermissionUpdate.username,
        );
        expect(savedNote.userPermissions[0].canEdit).toEqual(
          userPermissionUpdate.canEdit,
        );
        expect(savedNote.groupPermissions[0].group.name).toEqual(
          groupPermissionUpate.groupname,
        );
        expect(savedNote.groupPermissions[0].canEdit).toEqual(
          groupPermissionUpate.canEdit,
        );
      });
      it('with existing GroupPermissions and with empty UserPermissions', async () => {
        const noteWithPreexistingPermissions: Note = { ...note };
        noteWithPreexistingPermissions.groupPermissions = [
          {
            note: noteWithPreexistingPermissions,
            group: group,
            canEdit: !groupPermissionUpate.canEdit,
          },
        ];
        jest.spyOn(groupRepo, 'findOne').mockResolvedValueOnce(group);
        jest
          .spyOn(noteRepo, 'save')
          .mockImplementationOnce(async (entry: Note) => {
            return entry;
          });
        const savedNote = await service.updateNotePermissions(
          noteWithPreexistingPermissions,
          {
            sharedToUsers: [],
            sharedToGroups: [groupPermissionUpate],
          },
        );
        expect(savedNote.userPermissions).toHaveLength(0);
        expect(savedNote.groupPermissions[0].group.name).toEqual(
          groupPermissionUpate.groupname,
        );
        expect(savedNote.groupPermissions[0].canEdit).toEqual(
          groupPermissionUpate.canEdit,
        );
      });
      it('with existing GroupPermissions and with new UserPermissions', async () => {
        const noteWithPreexistingPermissions: Note = { ...note };
        noteWithPreexistingPermissions.groupPermissions = [
          {
            note: noteWithPreexistingPermissions,
            group: group,
            canEdit: !groupPermissionUpate.canEdit,
          },
        ];
        jest
          .spyOn(noteRepo, 'save')
          .mockImplementationOnce(async (entry: Note) => {
            return entry;
          });
        jest.spyOn(userRepo, 'findOne').mockResolvedValueOnce(user);
        jest.spyOn(groupRepo, 'findOne').mockResolvedValueOnce(group);
        const savedNote = await service.updateNotePermissions(
          noteWithPreexistingPermissions,
          {
            sharedToUsers: [userPermissionUpdate],
            sharedToGroups: [groupPermissionUpate],
          },
        );
        expect(savedNote.userPermissions[0].user.userName).toEqual(
          userPermissionUpdate.username,
        );
        expect(savedNote.userPermissions[0].canEdit).toEqual(
          userPermissionUpdate.canEdit,
        );
        expect(savedNote.groupPermissions[0].group.name).toEqual(
          groupPermissionUpate.groupname,
        );
        expect(savedNote.groupPermissions[0].canEdit).toEqual(
          groupPermissionUpate.canEdit,
        );
      });
      it('with existing GroupPermissions and with existing UserPermissions', async () => {
        const noteWithPreexistingPermissions: Note = { ...note };
        noteWithPreexistingPermissions.groupPermissions = [
          {
            note: noteWithPreexistingPermissions,
            group: group,
            canEdit: !groupPermissionUpate.canEdit,
          },
        ];
        noteWithPreexistingPermissions.userPermissions = [
          {
            note: noteWithPreexistingPermissions,
            user: user,
            canEdit: !userPermissionUpdate.canEdit,
          },
        ];
        jest
          .spyOn(noteRepo, 'save')
          .mockImplementationOnce(async (entry: Note) => {
            return entry;
          });
        jest.spyOn(userRepo, 'findOne').mockResolvedValueOnce(user);
        jest.spyOn(groupRepo, 'findOne').mockResolvedValueOnce(group);
        const savedNote = await service.updateNotePermissions(
          noteWithPreexistingPermissions,
          {
            sharedToUsers: [userPermissionUpdate],
            sharedToGroups: [groupPermissionUpate],
          },
        );
        expect(savedNote.userPermissions[0].user.userName).toEqual(
          userPermissionUpdate.username,
        );
        expect(savedNote.userPermissions[0].canEdit).toEqual(
          userPermissionUpdate.canEdit,
        );
        expect(savedNote.groupPermissions[0].group.name).toEqual(
          groupPermissionUpate.groupname,
        );
        expect(savedNote.groupPermissions[0].canEdit).toEqual(
          groupPermissionUpate.canEdit,
        );
      });
    });
    describe('fails:', () => {
      it('userPermissions has duplicate entries', async () => {
        try {
          await service.updateNotePermissions(note, {
            sharedToUsers: [userPermissionUpdate, userPermissionUpdate],
            sharedToGroups: [],
          });
        } catch (e) {
          expect(e).toBeInstanceOf(PermissionsUpdateInconsistentError);
        }
      });

      it('groupPermissions has duplicate entries', async () => {
        try {
          await service.updateNotePermissions(note, {
            sharedToUsers: [],
            sharedToGroups: [groupPermissionUpate, groupPermissionUpate],
          });
        } catch (e) {
          expect(e).toBeInstanceOf(PermissionsUpdateInconsistentError);
        }
      });

      it('userPermissions and groupPermissions have duplicate entries', async () => {
        try {
          await service.updateNotePermissions(note, {
            sharedToUsers: [userPermissionUpdate, userPermissionUpdate],
            sharedToGroups: [groupPermissionUpate, groupPermissionUpate],
          });
        } catch (e) {
          expect(e).toBeInstanceOf(PermissionsUpdateInconsistentError);
        }
      });
    });
  });

  describe('toTagList', () => {
    it('works', async () => {
      const note = {} as Note;
      note.tags = [
        {
          id: 1,
          name: 'testTag',
          notes: [note],
        },
      ];
      const tagList = service.toTagList(note);
      expect(tagList).toHaveLength(1);
      expect(tagList[0]).toEqual(note.tags[0].name);
    });
  });

  describe('toNotePermissionsDto', () => {
    it('works', async () => {
      const user = User.create('hardcoded', 'Testy') as User;
      const group = Group.create('testGroup', 'testGroup');
      const note = Note.create(user);
      note.userPermissions = [
        {
          note: note,
          user: user,
          canEdit: true,
        },
      ];
      note.groupPermissions = [
        {
          note: note,
          group: group,
          canEdit: true,
        },
      ];
      const permissions = service.toNotePermissionsDto(note);
      expect(permissions.owner.userName).toEqual(user.userName);
      expect(permissions.sharedToUsers).toHaveLength(1);
      expect(permissions.sharedToUsers[0].user.userName).toEqual(user.userName);
      expect(permissions.sharedToUsers[0].canEdit).toEqual(true);
      expect(permissions.sharedToGroups).toHaveLength(1);
      expect(permissions.sharedToGroups[0].group.displayName).toEqual(
        group.displayName,
      );
      expect(permissions.sharedToGroups[0].canEdit).toEqual(true);
    });
  });

  describe('toNoteMetadataDto', () => {
    it('works', async () => {
      const user = User.create('hardcoded', 'Testy') as User;
      const otherUser = User.create('other hardcoded', 'Testy2') as User;
      const group = Group.create('testGroup', 'testGroup');
      const content = 'testContent';
      jest
        .spyOn(noteRepo, 'save')
        .mockImplementation(async (note: Note): Promise<Note> => note);
      const note = await service.createNote(content);
      const revisions = await note.revisions;
      revisions[0].authorships = [
        {
          user: otherUser,
          revisions: revisions,
          startPos: 0,
          endPos: 1,
          updatedAt: new Date(1549312452000),
        } as Authorship,
        {
          user: user,
          revisions: revisions,
          startPos: 0,
          endPos: 1,
          updatedAt: new Date(1549312452001),
        } as Authorship,
      ];
      revisions[0].createdAt = new Date(1549312452000);
      jest.spyOn(revisionRepo, 'findOne').mockResolvedValue(revisions[0]);
      note.id = 'testId';
      note.alias = 'testAlias';
      note.title = 'testTitle';
      note.description = 'testDescription';
      note.authorColors = [
        {
          note: note,
          user: user,
          color: 'red',
        } as AuthorColor,
      ];
      note.owner = user;
      note.userPermissions = [
        {
          note: note,
          user: user,
          canEdit: true,
        },
      ];
      note.groupPermissions = [
        {
          note: note,
          group: group,
          canEdit: true,
        },
      ];
      note.tags = [
        {
          id: 1,
          name: 'testTag',
          notes: [note],
        },
      ];
      note.viewCount = 1337;
      const metadataDto = await service.toNoteMetadataDto(note);
      expect(metadataDto.id).toEqual(note.id);
      expect(metadataDto.alias).toEqual(note.alias);
      expect(metadataDto.title).toEqual(note.title);
      expect(metadataDto.createTime).toEqual(revisions[0].createdAt);
      expect(metadataDto.description).toEqual(note.description);
      expect(metadataDto.editedBy).toHaveLength(1);
      expect(metadataDto.editedBy[0]).toEqual(user.userName);
      expect(metadataDto.permissions.owner.userName).toEqual(user.userName);
      expect(metadataDto.permissions.sharedToUsers).toHaveLength(1);
      expect(metadataDto.permissions.sharedToUsers[0].user.userName).toEqual(
        user.userName,
      );
      expect(metadataDto.permissions.sharedToUsers[0].canEdit).toEqual(true);
      expect(metadataDto.permissions.sharedToGroups).toHaveLength(1);
      expect(
        metadataDto.permissions.sharedToGroups[0].group.displayName,
      ).toEqual(group.displayName);
      expect(metadataDto.permissions.sharedToGroups[0].canEdit).toEqual(true);
      expect(metadataDto.tags).toHaveLength(1);
      expect(metadataDto.tags[0]).toEqual(note.tags[0].name);
      expect(metadataDto.updateTime).toEqual(revisions[0].createdAt);
      expect(metadataDto.updateUser.userName).toEqual(user.userName);
      expect(metadataDto.viewCount).toEqual(note.viewCount);
    });
  });

  describe('toNoteDto', () => {
    it('works', async () => {
      const user = User.create('hardcoded', 'Testy') as User;
      const otherUser = User.create('other hardcoded', 'Testy2') as User;
      otherUser.userName = 'other hardcoded user';
      const group = Group.create('testGroup', 'testGroup');
      const content = 'testContent';
      jest
        .spyOn(noteRepo, 'save')
        .mockImplementation(async (note: Note): Promise<Note> => note);
      const note = await service.createNote(content);
      const revisions = await note.revisions;
      revisions[0].authorships = [
        {
          user: otherUser,
          revisions: revisions,
          startPos: 0,
          endPos: 1,
          updatedAt: new Date(1549312452000),
        } as Authorship,
        {
          user: user,
          revisions: revisions,
          startPos: 0,
          endPos: 1,
          updatedAt: new Date(1549312452001),
        } as Authorship,
      ];
      revisions[0].createdAt = new Date(1549312452000);
      jest
        .spyOn(revisionRepo, 'findOne')
        .mockResolvedValue(revisions[0])
        .mockResolvedValue(revisions[0]);
      note.id = 'testId';
      note.alias = 'testAlias';
      note.title = 'testTitle';
      note.description = 'testDescription';
      note.authorColors = [
        {
          note: note,
          user: user,
          color: 'red',
        } as AuthorColor,
      ];
      note.owner = user;
      note.userPermissions = [
        {
          note: note,
          user: user,
          canEdit: true,
        },
      ];
      note.groupPermissions = [
        {
          note: note,
          group: group,
          canEdit: true,
        },
      ];
      note.tags = [
        {
          id: 1,
          name: 'testTag',
          notes: [note],
        },
      ];
      note.viewCount = 1337;
      const noteDto = await service.toNoteDto(note);
      expect(noteDto.metadata.id).toEqual(note.id);
      expect(noteDto.metadata.alias).toEqual(note.alias);
      expect(noteDto.metadata.title).toEqual(note.title);
      expect(noteDto.metadata.createTime).toEqual(revisions[0].createdAt);
      expect(noteDto.metadata.description).toEqual(note.description);
      expect(noteDto.metadata.editedBy).toHaveLength(1);
      expect(noteDto.metadata.editedBy[0]).toEqual(user.userName);
      expect(noteDto.metadata.permissions.owner.userName).toEqual(
        user.userName,
      );
      expect(noteDto.metadata.permissions.sharedToUsers).toHaveLength(1);
      expect(
        noteDto.metadata.permissions.sharedToUsers[0].user.userName,
      ).toEqual(user.userName);
      expect(noteDto.metadata.permissions.sharedToUsers[0].canEdit).toEqual(
        true,
      );
      expect(noteDto.metadata.permissions.sharedToGroups).toHaveLength(1);
      expect(
        noteDto.metadata.permissions.sharedToGroups[0].group.displayName,
      ).toEqual(group.displayName);
      expect(noteDto.metadata.permissions.sharedToGroups[0].canEdit).toEqual(
        true,
      );
      expect(noteDto.metadata.tags).toHaveLength(1);
      expect(noteDto.metadata.tags[0]).toEqual(note.tags[0].name);
      expect(noteDto.metadata.updateTime).toEqual(revisions[0].createdAt);
      expect(noteDto.metadata.updateUser.userName).toEqual(user.userName);
      expect(noteDto.metadata.viewCount).toEqual(note.viewCount);
      expect(noteDto.content).toEqual(content);
    });
  });
});
