/*
 * SPDX-FileCopyrightText: 2021 The HedgeDoc developers (see AUTHORS file)
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { ServerStatusDto } from './server-status.dto';
import { getServerVersionFromPackageJson } from '../utils/serverVersion';

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
