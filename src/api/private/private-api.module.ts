/*
 * SPDX-FileCopyrightText: 2021 The HedgeDoc developers (see AUTHORS file)
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Module } from '@nestjs/common';
import { TokensController } from './tokens/tokens.controller';
import { LoggerModule } from '../../logger/logger.module';
import { UsersModule } from '../../users/users.module';
import { AuthModule } from '../../auth/auth.module';
import { HistoryController } from './history/history.controller';
import { HistoryModule } from '../../history/history.module';
import { NotesModule } from '../../notes/notes.module';

@Module({
  imports: [LoggerModule, UsersModule, AuthModule, HistoryModule, NotesModule],
  controllers: [TokensController, HistoryController],
})
export class PrivateApiModule {}
