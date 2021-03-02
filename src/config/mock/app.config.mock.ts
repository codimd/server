/*
 * SPDX-FileCopyrightText: 2021 The HedgeDoc developers (see AUTHORS file)
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { registerAs } from '@nestjs/config';
import { LogLevel } from 'ts-loader/dist/logger';

export default registerAs('appConfig', () => ({
  domain: 'md.example.com',
  rendererOrigin: 'md-renderer.example.com',
  port: 3000,
  loglevel: LogLevel.ERROR,
  maxDocumentLength: 100000,
  forbiddenNoteIds: ['forbiddenNoteId'],
}));
