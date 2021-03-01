/*
 * SPDX-FileCopyrightText: 2021 The HedgeDoc developers (see AUTHORS file)
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ServerVersion } from '../monitoring/server-status.dto';
import { promises as fs } from 'fs';
import { join as joinPath } from 'path';

let versionCache: ServerVersion;

export async function getServerVersionFromPackageJson(): Promise<ServerVersion> {
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
