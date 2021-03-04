/*
 * SPDX-FileCopyrightText: 2021 The HedgeDoc developers (see AUTHORS file)
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LoggerModule } from '../logger/logger.module';
import { User } from './user.entity';
import { UsersService } from './users.service';
import { Repository } from 'typeorm';
import { AlreadyInDBError, NotInDBError } from '../errors/errors';

describe('UsersService', () => {
  let service: UsersService;
  let userRepo: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
      ],
      imports: [LoggerModule],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    const username = 'hardcoded';
    const displayname = 'Testy';
    beforeEach(() => {
      jest
        .spyOn(userRepo, 'save')
        // eslint-disable-next-line @typescript-eslint/require-await
        .mockImplementationOnce(async (user: User): Promise<User> => user);
    });
    it('works', async () => {
      const user = await service.createUser(username, displayname);
      expect(user.userName).toEqual(username);
      expect(user.displayName).toEqual(displayname);
    });
    it('fails if username is already taken', async () => {
      jest.spyOn(userRepo, 'save').mockImplementationOnce(() => {
        throw new Error();
      });
      // create first user with username
      await service.createUser(username, displayname);
      // attempt to create second user with username
      try {
        await service.createUser(username, displayname);
        fail();
      } catch (e) {
        expect(e).toBeInstanceOf(AlreadyInDBError);
      }
    });
  });

  describe('deleteUser', () => {
    it('works', async () => {
      const username = 'hardcoded';
      const displayname = 'Testy';
      const user = User.create(username, displayname) as User;
      jest.spyOn(userRepo, 'remove').mockImplementationOnce(
        // eslint-disable-next-line @typescript-eslint/require-await
        async (user: User): Promise<User> => {
          expect(user).toEqual(user);
          return user;
        },
      );
      await service.deleteUser(user);
    });
  });

  describe('changedDisplayName', () => {
    it('works', async () => {
      const username = 'hardcoded';
      const displayname = 'Testy';
      const user = User.create(username, displayname) as User;
      const newDisplayName = 'Testy2';
      jest.spyOn(userRepo, 'save').mockImplementationOnce(
        // eslint-disable-next-line @typescript-eslint/require-await
        async (user: User): Promise<User> => {
          expect(user.displayName).toEqual(newDisplayName);
          return user;
        },
      );
      await service.changeDisplayName(user, newDisplayName);
    });
  });

  describe('getUserByUsername', () => {
    const username = 'hardcoded';
    const displayname = 'Testy';
    const user = User.create(username, displayname) as User;
    it('works', async () => {
      jest.spyOn(userRepo, 'findOne').mockResolvedValueOnce(user);
      const getUser = await service.getUserByUsername(username);
      expect(getUser.userName).toEqual(username);
      expect(getUser.displayName).toEqual(displayname);
    });
    it('fails when user does not exits', async () => {
      jest.spyOn(userRepo, 'findOne').mockResolvedValueOnce(undefined);
      try {
        await service.getUserByUsername(username);
        fail();
      } catch (e) {
        expect(e).toBeInstanceOf(NotInDBError);
      }
    });
  });

  describe('getPhotoUrl', () => {
    const username = 'hardcoded';
    const displayname = 'Testy';
    const user = User.create(username, displayname) as User;
    it('works if a user has a photoUrl', () => {
      const photo = 'testPhotoUrl';
      user.photo = photo;
      const photoUrl = service.getPhotoUrl(user);
      expect(photoUrl).toEqual(photo);
    });
    it('works if a user no photoUrl', () => {
      user.photo = undefined;
      const photoUrl = service.getPhotoUrl(user);
      expect(photoUrl).toEqual('');
    });
  });

  describe('toUserDto', () => {
    const username = 'hardcoded';
    const displayname = 'Testy';
    const user = User.create(username, displayname) as User;
    it('works if a user is provided', () => {
      const userDto = service.toUserDto(user);
      expect(userDto.userName).toEqual(username);
      expect(userDto.displayName).toEqual(displayname);
      expect(userDto.photo).toEqual('');
      expect(userDto.email).toEqual('');
    });
    it('fails if no user is provided', () => {
      expect(service.toUserDto(null)).toBeNull();
      expect(service.toUserDto(undefined)).toBeNull();
    });
  });
});
