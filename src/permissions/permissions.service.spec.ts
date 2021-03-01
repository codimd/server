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
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthToken } from '../auth/auth-token.entity';
import { Group } from '../groups/group.entity';
import { LoggerModule } from '../logger/logger.module';
import { AuthorColor } from '../notes/author-color.entity';
import { Note } from '../notes/note.entity';
import { NotesModule } from '../notes/notes.module';
import { Tag } from '../notes/tag.entity';
import { Authorship } from '../revisions/authorship.entity';
import { Revision } from '../revisions/revision.entity';
import { Identity } from '../users/identity.entity';
import { User } from '../users/user.entity';
import { UsersModule } from '../users/users.module';
import { NoteGroupPermission } from './note-group-permission.entity';
import { NoteUserPermission } from './note-user-permission.entity';
import { PermissionsModule } from './permissions.module';
import { GuestPermission, PermissionsService } from './permissions.service';
import { ConfigModule } from '@nestjs/config';
import appConfigMock from '../config/mock/app.config.mock';

describe('PermissionsService', () => {
  let permissionsService: PermissionsService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PermissionsService],
      imports: [
        PermissionsModule,
        UsersModule,
        LoggerModule,
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
    permissionsService = module.get<PermissionsService>(PermissionsService);
  });

  // The two users we test with:
  const user2 = {} as User;
  user2.id = '2';
  const user1 = {} as User;
  user1.id = '1';

  it('should be defined', () => {
    expect(permissionsService).toBeDefined();
  });

  function createNote(owner: User): Note {
    const note = {} as Note;
    note.userPermissions = [];
    note.groupPermissions = [];
    note.owner = owner;
    return note;
  }

  /*
   * Creates the permission objects for UserPermission for two users with write and with out write permission
   */
  function createNoteUserPermissionNotes(): Note[] {
    const note0 = createNote(user1);
    const note1 = createNote(user2);
    const note2 = createNote(user2);
    const note3 = createNote(user2);
    const note4 = createNote(user2);
    const note5 = createNote(user2);
    const note6 = createNote(user2);
    const note7 = createNote(user2);
    const noteUserPermission1 = {} as NoteUserPermission;
    noteUserPermission1.user = user1;
    const noteUserPermission2 = {} as NoteUserPermission;
    noteUserPermission2.user = user2;
    const noteUserPermission3 = {} as NoteUserPermission;
    noteUserPermission3.user = user1;
    noteUserPermission3.canEdit = true;
    const noteUserPermission4 = {} as NoteUserPermission;
    noteUserPermission4.user = user2;
    noteUserPermission4.canEdit = true;

    note1.userPermissions.push(noteUserPermission1);

    note2.userPermissions.push(noteUserPermission1);
    note2.userPermissions.push(noteUserPermission2);

    note3.userPermissions.push(noteUserPermission2);
    note3.userPermissions.push(noteUserPermission1);

    note4.userPermissions.push(noteUserPermission3);

    note5.userPermissions.push(noteUserPermission3);
    note5.userPermissions.push(noteUserPermission4);

    note6.userPermissions.push(noteUserPermission4);
    note6.userPermissions.push(noteUserPermission3);

    note7.userPermissions.push(noteUserPermission2);

    const everybody = {} as Group;
    everybody.name = 'everybody';
    everybody.special = true;
    const noteEverybodyRead = createNote(user1);

    const noteGroupPermissionRead = {} as NoteGroupPermission;
    noteGroupPermissionRead.group = everybody;
    noteGroupPermissionRead.canEdit = false;
    noteGroupPermissionRead.note = noteEverybodyRead;
    noteEverybodyRead.groupPermissions = [noteGroupPermissionRead];

    const noteEverybodyWrite = createNote(user1);

    const noteGroupPermissionWrite = {} as NoteGroupPermission;
    noteGroupPermissionWrite.group = everybody;
    noteGroupPermissionWrite.canEdit = true;
    noteGroupPermissionWrite.note = noteEverybodyWrite;
    noteEverybodyWrite.groupPermissions = [noteGroupPermissionWrite];

    return [
      note0,
      note1,
      note2,
      note3,
      note4,
      note5,
      note6,
      note7,
      noteEverybodyRead,
      noteEverybodyWrite,
    ];
  }

  const notes = createNoteUserPermissionNotes();

  describe('mayRead works with', () => {
    it('Owner', () => {
      permissionsService.guestPermission = GuestPermission.DENY;
      expect(permissionsService.mayRead(user1, notes[0])).toBeTruthy();
      expect(permissionsService.mayRead(user1, notes[7])).toBeFalsy();
    });
    it('userPermission read', () => {
      permissionsService.guestPermission = GuestPermission.DENY;
      expect(permissionsService.mayRead(user1, notes[1])).toBeTruthy();
      expect(permissionsService.mayRead(user1, notes[2])).toBeTruthy();
      expect(permissionsService.mayRead(user1, notes[3])).toBeTruthy();
    });
    it('userPermission write', () => {
      permissionsService.guestPermission = GuestPermission.DENY;
      expect(permissionsService.mayRead(user1, notes[4])).toBeTruthy();
      expect(permissionsService.mayRead(user1, notes[5])).toBeTruthy();
      expect(permissionsService.mayRead(user1, notes[6])).toBeTruthy();
      expect(permissionsService.mayRead(user1, notes[7])).toBeFalsy();
    });

    describe('guest permission', () => {
      it('CREATE_ALIAS', () => {
        permissionsService.guestPermission = GuestPermission.CREATE_ALIAS;
        expect(permissionsService.mayRead(null, notes[8])).toBeTruthy();
      });
      it('CREATE', () => {
        permissionsService.guestPermission = GuestPermission.CREATE;
        expect(permissionsService.mayRead(null, notes[8])).toBeTruthy();
      });
      it('WRITE', () => {
        permissionsService.guestPermission = GuestPermission.WRITE;
        expect(permissionsService.mayRead(null, notes[8])).toBeTruthy();
      });
      it('READ', () => {
        permissionsService.guestPermission = GuestPermission.READ;
        expect(permissionsService.mayRead(null, notes[8])).toBeTruthy();
      });
    });
  });
  describe('mayWrite works with', () => {
    it('Owner', () => {
      permissionsService.guestPermission = GuestPermission.DENY;
      expect(permissionsService.mayWrite(user1, notes[0])).toBeTruthy();
      expect(permissionsService.mayWrite(user1, notes[7])).toBeFalsy();
    });
    it('userPermission read', () => {
      permissionsService.guestPermission = GuestPermission.DENY;
      expect(permissionsService.mayWrite(user1, notes[1])).toBeFalsy();
      expect(permissionsService.mayWrite(user1, notes[2])).toBeFalsy();
      expect(permissionsService.mayWrite(user1, notes[3])).toBeFalsy();
    });
    it('userPermission write', () => {
      permissionsService.guestPermission = GuestPermission.DENY;
      expect(permissionsService.mayWrite(user1, notes[4])).toBeTruthy();
      expect(permissionsService.mayWrite(user1, notes[5])).toBeTruthy();
      expect(permissionsService.mayWrite(user1, notes[6])).toBeTruthy();
      expect(permissionsService.mayWrite(user1, notes[7])).toBeFalsy();
    });
    describe('guest permission', () => {
      it('CREATE_ALIAS', () => {
        permissionsService.guestPermission = GuestPermission.CREATE_ALIAS;
        expect(permissionsService.mayWrite(null, notes[9])).toBeTruthy();
      });
      it('CREATE', () => {
        permissionsService.guestPermission = GuestPermission.CREATE;
        expect(permissionsService.mayWrite(null, notes[9])).toBeTruthy();
      });
      it('WRITE', () => {
        permissionsService.guestPermission = GuestPermission.WRITE;
        expect(permissionsService.mayWrite(null, notes[9])).toBeTruthy();
      });
      it('READ', () => {
        permissionsService.guestPermission = GuestPermission.READ;
        expect(permissionsService.mayWrite(null, notes[9])).toBeFalsy();
      });
    });
  });

  /*
   * Helper Object that arranges a list of GroupPermissions and if they allow a user to read or write a particular note.
   */
  class NoteGroupPermissionWithResultForUser {
    permissions: NoteGroupPermission[];
    allowsRead: boolean;
    allowsWrite: boolean;
  }

  /*
   * Setup function to create all the groups we use in the tests.
   */
  function createGroups(): { [id: string]: Group } {
    const result: { [id: string]: Group } = {};

    const everybody: Group = Group.create('everybody', 'Everybody');
    everybody.special = true;
    result['everybody'] = everybody;

    const loggedIn = Group.create('loggedIn', 'loggedIn');
    loggedIn.special = true;
    result['loggedIn'] = loggedIn;

    const user1group = Group.create('user1group', 'user1group');
    user1group.members = [user1];
    result['user1group'] = user1group;

    const user2group = Group.create('user2group', 'user2group');
    user2group.members = [user2];
    result['user2group'] = user2group;

    const user1and2group = Group.create('user1and2group', 'user1and2group');
    user1and2group.members = [user1, user2];
    result['user1and2group'] = user1and2group;

    const user2and1group = Group.create('user2and1group', 'user2and1group');
    user2and1group.members = [user2, user1];
    result['user2and1group'] = user2and1group;

    return result;
  }

  /*
   * Create all GroupPermissions: For each group two GroupPermissions are created one with read permission and one with write permission.
   */
  function createAllNoteGroupPermissions(): NoteGroupPermission[][] {
    const groups = createGroups();

    /*
     * Helper function for creating GroupPermissions
     */
    function createNoteGroupPermission(
      group: Group,
      write: boolean,
    ): NoteGroupPermission {
      return NoteGroupPermission.create(group, write);
    }

    const everybodyRead = createNoteGroupPermission(groups['everybody'], false);
    const everybodyWrite = createNoteGroupPermission(groups['everybody'], true);

    const loggedInRead = createNoteGroupPermission(groups['loggedIn'], false);
    const loggedInWrite = createNoteGroupPermission(groups['loggedIn'], true);

    const user1groupRead = createNoteGroupPermission(
      groups['user1group'],
      false,
    );
    const user1groupWrite = createNoteGroupPermission(
      groups['user1group'],
      true,
    );

    const user2groupRead = createNoteGroupPermission(
      groups['user2group'],
      false,
    );
    const user2groupWrite = createNoteGroupPermission(
      groups['user2group'],
      true,
    );

    const user1and2groupRead = createNoteGroupPermission(
      groups['user1and2group'],
      false,
    );
    const user1and2groupWrite = createNoteGroupPermission(
      groups['user1and2group'],
      true,
    );

    const user2and1groupRead = createNoteGroupPermission(
      groups['user2and1group'],
      false,
    );
    const user2and1groupWrite = createNoteGroupPermission(
      groups['user2and1group'],
      true,
    );

    return [
      [user1groupRead, user1and2groupRead, user2and1groupRead, null], // group0: allow user1 to read via group
      [user2and1groupWrite, user1and2groupWrite, user1groupWrite, null], // group1: allow user1 to write via group
      [everybodyRead, everybodyWrite, null], // group2: permissions of the special group everybody
      [loggedInRead, loggedInWrite, null], // group3: permissions of the special group loggedIn
      [user2groupWrite, user2groupRead, null], // group4: don't allow user1 to read or write via group
    ];
  }

  /*
   * creates the matrix multiplication of group0 to group4 of createAllNoteGroupPermissions
   */
  function createNoteGroupPermissionsCombinations(
    guestPermission: GuestPermission,
  ): NoteGroupPermissionWithResultForUser[] {
    // for logged in users
    const noteGroupPermissions = createAllNoteGroupPermissions();
    const result: NoteGroupPermissionWithResultForUser[] = [];
    for (const group0 of noteGroupPermissions[0]) {
      for (const group1 of noteGroupPermissions[1]) {
        for (const group2 of noteGroupPermissions[2]) {
          for (const group3 of noteGroupPermissions[3]) {
            for (const group4 of noteGroupPermissions[4]) {
              const insert: NoteGroupPermission[] = [];
              let readPermission = false;
              let writePermission = false;
              if (group0 !== null) {
                // user1 in ReadGroups
                readPermission = true;
                insert.push(group0);
              }
              if (group1 !== null) {
                // user1 in WriteGroups
                readPermission = true;
                writePermission = true;
                insert.push(group1);
              }

              if (group2 !== null) {
                // everybody group TODO config options
                switch (guestPermission) {
                  case GuestPermission.CREATE_ALIAS:
                  case GuestPermission.CREATE:
                  case GuestPermission.WRITE:
                    writePermission = writePermission || group2.canEdit;
                    readPermission = true;
                    break;
                  case GuestPermission.READ:
                    readPermission = true;
                }
                insert.push(group2);
              }
              if (group3 !== null) {
                // loggedIn users
                readPermission = true;
                writePermission = writePermission || group3.canEdit;
                insert.push(group3);
              }
              if (group4 !== null) {
                // user not in group
                insert.push(group4);
              }
              result.push({
                permissions: insert,
                allowsRead: readPermission,
                allowsWrite: writePermission,
              });
            }
          }
        }
      }
    }
    return result;
  }

  // inspired by https://stackoverflow.com/questions/9960908/permutations-in-javascript
  function permutator(
    inputArr: NoteGroupPermission[],
  ): NoteGroupPermission[][] {
    const results = [];

    function permute(
      arr: NoteGroupPermission[],
      memo: NoteGroupPermission[],
    ): NoteGroupPermission[][] {
      let cur;

      for (let i = 0; i < arr.length; i++) {
        cur = arr.splice(i, 1);
        if (arr.length === 0) {
          results.push(memo.concat(cur));
        }
        permute(arr.slice(), memo.concat(cur));
        arr.splice(i, 0, cur[0]);
      }

      return results;
    }

    return permute(inputArr, []);
  }

  // takes each set of permissions from createNoteGroupPermissionsCombinations, permute them and add them to the list
  function permuteNoteGroupPermissions(
    noteGroupPermissions: NoteGroupPermissionWithResultForUser[],
  ): NoteGroupPermissionWithResultForUser[] {
    const result: NoteGroupPermissionWithResultForUser[] = [];
    for (const permission of noteGroupPermissions) {
      const permutations = permutator(permission.permissions);
      for (const permutation of permutations) {
        result.push({
          permissions: permutation,
          allowsRead: permission.allowsRead,
          allowsWrite: permission.allowsWrite,
        });
      }
    }
    return result;
  }

  describe('check if groups work with', () => {
    const guestPermission = GuestPermission.WRITE;
    const rawPermissions = createNoteGroupPermissionsCombinations(
      guestPermission,
    );
    const permissions = permuteNoteGroupPermissions(rawPermissions);
    let i = 0;
    for (const permission of permissions) {
      const note = createNote(user2);
      note.groupPermissions = permission.permissions;
      let permissionString = '';
      for (const perm of permission.permissions) {
        permissionString += ` ${perm.group.name}:${String(perm.canEdit)}`;
      }
      it(`mayWrite - test #${i}:${permissionString}`, () => {
        permissionsService.guestPermission = guestPermission;
        expect(permissionsService.mayWrite(user1, note)).toEqual(
          permission.allowsWrite,
        );
      });
      it(`mayRead - test #${i}:${permissionString}`, () => {
        permissionsService.guestPermission = guestPermission;
        expect(permissionsService.mayRead(user1, note)).toEqual(
          permission.allowsRead,
        );
      });
      i++;
    }
  });

  describe('mayCreate works for', () => {
    it('logged in', () => {
      permissionsService.guestPermission = GuestPermission.DENY;
      expect(permissionsService.mayCreate(user1)).toBeTruthy();
    });
    it('guest denied', () => {
      permissionsService.guestPermission = GuestPermission.DENY;
      expect(permissionsService.mayCreate(null)).toBeFalsy();
    });
    it('guest read', () => {
      permissionsService.guestPermission = GuestPermission.READ;
      expect(permissionsService.mayCreate(null)).toBeFalsy();
    });
    it('guest write', () => {
      permissionsService.guestPermission = GuestPermission.WRITE;
      expect(permissionsService.mayCreate(null)).toBeFalsy();
    });
    it('guest create', () => {
      permissionsService.guestPermission = GuestPermission.CREATE;
      expect(permissionsService.mayCreate(null)).toBeTruthy();
    });
    it('guest create alias', () => {
      permissionsService.guestPermission = GuestPermission.CREATE_ALIAS;
      expect(permissionsService.mayCreate(null)).toBeTruthy();
    });
  });

  describe('isOwner works', () => {
    it('for positive case', () => {
      permissionsService.guestPermission = GuestPermission.DENY;
      expect(permissionsService.isOwner(user1, notes[0])).toBeTruthy();
    });
    it('for negative case', () => {
      permissionsService.guestPermission = GuestPermission.DENY;
      expect(permissionsService.isOwner(user1, notes[1])).toBeFalsy();
    });
  });
});
