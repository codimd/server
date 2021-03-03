/*
 * SPDX-FileCopyrightText: 2021 The HedgeDoc developers (see AUTHORS file)
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { IsString } from 'class-validator';

export class HistoryEntryCreationDto {
  /**
   * ID or Alias of the note
   */
  @IsString()
  note: string;
}
