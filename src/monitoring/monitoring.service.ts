/*
 * SPDX-FileCopyrightText: 2021 The HedgeDoc developers (see AUTHORS file)
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join as joinPath } from 'path';
import { ServerStatusDto, ServerVersion } from './server-status.dto';

let versionCache: ServerVersion;

async function getServerVersionFromPackageJson(): Promise<ServerVersion> {
  if (versionCache === null) {
    const rawFileContent: string = await fs.readFile(
      joinPath(__dirname, '../../package.json'),
      { encoding: 'utf8' },
    );
    // TODO: Should this be validated in more detail?
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const packageInfo: { version: string } = JSON.parse(rawFileContent);
    const versionParts: number[] = packageInfo.version
      .split('.')
      .map((x) => parseInt(x, 10));
    versionCache = {
      major: versionParts[0],
      minor: versionParts[1],
      patch: versionParts[2],
      preRelease: 'dev', // TODO: Replace this?
    };
  }

  return versionCache;
}

@Injectable()
export class MonitoringService {
  async getServerStatus(): Promise<ServerStatusDto> {
    return {
      connectionSocketQueueLenght: 0,
      destictOnlineUsers: 0,
      disconnectSocketQueueLength: 0,
      distictOnlineRegisteredUsers: 0,
      isConnectionBusy: false,
      isDisconnectBusy: false,
      notesCount: 0,
      onlineNotes: 0,
      onlineRegisteredUsers: 0,
      onlineUsers: 0,
      registeredUsers: 0,
      serverVersion: await getServerVersionFromPackageJson(),
    };
  }
}
