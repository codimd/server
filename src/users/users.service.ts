/*
 * SPDX-FileCopyrightText: 2021 The HedgeDoc developers (see AUTHORS file)
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlreadyInDBError, NotInDBError } from '../errors/errors';
import { ConsoleLoggerService } from '../logger/console-logger.service';
import { UserInfoDto } from './user-info.dto';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    private readonly logger: ConsoleLoggerService,
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {
    this.logger.setContext(UsersService.name);
  }

  /**
   * @async
   * Create a new user with a given userName and displayName
   * @param userName - the userName the new user shall have
   * @param displayName - the display the new user shall have
   * @return {User} the user
   * @throws {AlreadyInDBError} the userName is already taken.
   */
  async createUser(userName: string, displayName: string): Promise<User> {
    const user = User.create(userName, displayName);
    return this.userRepository.save(user);
  }

  /**
   * @async
   * Delete the user with the specified userName
   * @param userName - the username of the user to be delete
   * @throws {NotInDBError} the userName has not user associated with it.
   */
  async deleteUser(userName: string): Promise<void> {
    // TODO: Handle owned notes and edits
    const user = await this.userRepository.findOne({
      where: { userName: userName },
    });
    await this.userRepository.delete(user);
  }

  /**
   * @async
   * Get the user specified by the username
   * @param {string} userName the username by which the user is specified
   * @param {boolean} [withTokens=false] if the user should contain authTokens
   * @return {User} the specified user
   */
  async getUserByUsername(userName: string, withTokens = false): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { userName: userName },
      relations: withTokens ? ['authTokens'] : null,
    });
    if (user === undefined) {
      throw new NotInDBError(`User with username '${userName}' not found`);
    }
    return user;
  }

  /**
   * Extract the photoUrl of the user or in case no photo url is present generate a deterministic user photo
   * @param {User} user - the specified User
   * @return the url of the photo
   */
  getPhotoUrl(user: User): string {
    if (user.photo) {
      return user.photo;
    } else {
      // TODO: Create new photo, see old code
      return '';
    }
  }

  /**
   * Build UserInfoDto from a user.
   * @param {User=} user - the user to use
   * @return {(UserInfoDto|null)} the built UserInfoDto
   */
  toUserDto(user: User | null | undefined): UserInfoDto | null {
    if (!user) {
      this.logger.warn(`Recieved ${String(user)} argument!`, 'toUserDto');
      return null;
    }
    return {
      userName: user.userName,
      displayName: user.displayName,
      photo: this.getPhotoUrl(user),
      email: user.email ?? '',
    };
  }
}
