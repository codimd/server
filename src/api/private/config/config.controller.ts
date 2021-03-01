/*
 * SPDX-FileCopyrightText: 2021 The HedgeDoc developers (see AUTHORS file)
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Controller, Get } from '@nestjs/common';
import { ConsoleLoggerService } from '../../../logger/console-logger.service';
import { FrontendConfigService } from '../../../frontend-config/frontend-config.service';
import { FrontendConfigDto } from '../../../frontend-config/frontend-config.dto';

@Controller('config')
export class ConfigController {
  constructor(
    private readonly logger: ConsoleLoggerService,
    private frontendConfigService: FrontendConfigService,
  ) {
    this.logger.setContext(ConfigController.name);
  }

  @Get()
  async getFrontendConfig(): Promise<FrontendConfigDto> {
    return await this.frontendConfigService.getFrontendConfig();
  }
}
