/*
 * SPDX-FileCopyrightText: 2021 The HedgeDoc developers (see AUTHORS file)
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigController } from './config.controller';
import { LoggerModule } from '../../../logger/logger.module';
import { FrontendConfigModule } from '../../../frontend-config/frontend-config.module';
import { ConfigModule } from '@nestjs/config';
import appConfigMock from '../../../config/mock/app.config.mock';
import authConfigMock from '../../../config/mock/auth.config.mock';
import customizationConfigMock from '../../../config/mock/customization.config.mock';
import externalConfigMock from '../../../config/mock/external.config.mock';

describe('ConfigController', () => {
  let controller: ConfigController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            appConfigMock,
            authConfigMock,
            customizationConfigMock,
            externalConfigMock,
          ],
        }),
        LoggerModule,
        FrontendConfigModule,
      ],
      controllers: [ConfigController],
    }).compile();

    controller = module.get<ConfigController>(ConfigController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
