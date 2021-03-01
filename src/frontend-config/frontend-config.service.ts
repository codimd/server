/*
 * SPDX-FileCopyrightText: 2021 The HedgeDoc developers (see AUTHORS file)
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { ConsoleLoggerService } from '../logger/console-logger.service';
import {
  AuthProviders,
  BannerDto,
  BrandingDto,
  CustomAuthNamesDto,
  FrontendConfigDto,
  IframeCommunicationDto,
  SpecialUrlsDto,
} from './frontend-config.dto';
import authConfiguration, { AuthConfig } from '../config/auth.config';
import customizationConfiguration, {
  CustomizationConfig,
} from '../config/customization.config';
import appConfiguration, { AppConfig } from '../config/app.config';
import externalServicesConfiguration, {
  ExternalServicesConfig,
} from '../config/external-services.config';
import { getServerVersionFromPackageJson } from '../utils/serverVersion';
import { promises as fs, Stats } from 'fs';
import { join } from 'path';

@Injectable()
export class FrontendConfigService {
  constructor(
    private readonly logger: ConsoleLoggerService,
    @Inject(appConfiguration.KEY)
    private appConfig: AppConfig,
    @Inject(authConfiguration.KEY)
    private authConfig: AuthConfig,
    @Inject(customizationConfiguration.KEY)
    private customizationConfig: CustomizationConfig,
    @Inject(externalServicesConfiguration.KEY)
    private externalServicesConfig: ExternalServicesConfig,
  ) {
    this.logger.setContext(FrontendConfigService.name);
  }

  async getFrontendConfig(): Promise<FrontendConfigDto> {
    return {
      // ToDo: use actual value here
      allowAnonymous: false,
      allowRegister: this.authConfig.email.enableRegister,
      authProviders: this.getAuthProviders(),
      banner: await FrontendConfigService.getBanner(),
      branding: this.getBranding(),
      customAuthNames: this.getCustomAuthNames(),
      iframeCommunication: this.getIframeCommunication(),
      maxDocumentLength: this.appConfig.maxDocumentLength,
      plantUmlServer: this.externalServicesConfig.plantUmlServer
        ? new URL(this.externalServicesConfig.plantUmlServer)
        : undefined,
      specialUrls: this.getSpecialUrls(),
      useImageProxy: !!this.externalServicesConfig.imageProxy,
      version: await getServerVersionFromPackageJson(),
    };
  }

  private getAuthProviders(): AuthProviders {
    return {
      dropbox: !!this.authConfig.dropbox.clientID,
      facebook: !!this.authConfig.facebook.clientID,
      github: !!this.authConfig.github.clientID,
      gitlab: this.authConfig.gitlab.length !== 0,
      google: !!this.authConfig.google.clientID,
      internal: this.authConfig.email.enableLogin,
      ldap: this.authConfig.ldap.length !== 0,
      oauth2: this.authConfig.oauth2.length !== 0,
      saml: this.authConfig.saml.length !== 0,
      twitter: !!this.authConfig.twitter.consumerKey,
    };
  }

  private getCustomAuthNames(): CustomAuthNamesDto {
    return {
      gitlab: this.authConfig.gitlab.map((entry) => {
        return {
          identifier: entry.identifier,
          providerName: entry.providerName,
        };
      }),
      ldap: this.authConfig.ldap.map((entry) => {
        return {
          identifier: entry.identifier,
          providerName: entry.providerName,
        };
      }),
      oauth2: this.authConfig.oauth2.map((entry) => {
        return {
          identifier: entry.identifier,
          providerName: entry.providerName,
        };
      }),
      saml: this.authConfig.saml.map((entry) => {
        return {
          identifier: entry.identifier,
          providerName: entry.providerName,
        };
      }),
    };
  }

  private getBranding(): BrandingDto {
    return {
      logo: this.customizationConfig.branding.customLogo
        ? new URL(this.customizationConfig.branding.customLogo)
        : undefined,
      name: this.customizationConfig.branding.customName,
    };
  }

  private getSpecialUrls(): SpecialUrlsDto {
    return {
      imprint: this.customizationConfig.specialUrls.imprint
        ? new URL(this.customizationConfig.specialUrls.imprint)
        : undefined,
      privacy: this.customizationConfig.specialUrls.privacy
        ? new URL(this.customizationConfig.specialUrls.privacy)
        : undefined,
      termsOfUse: this.customizationConfig.specialUrls.termsOfUse
        ? new URL(this.customizationConfig.specialUrls.termsOfUse)
        : undefined,
    };
  }

  private getIframeCommunication(): IframeCommunicationDto {
    return {
      editorOrigin: new URL(this.appConfig.domain),
      rendererOrigin: this.appConfig.rendererOrigin
        ? new URL(this.appConfig.rendererOrigin)
        : new URL(this.appConfig.domain),
    };
  }

  private static async getBanner(): Promise<BannerDto> {
    const path = join(__dirname, '../../banner.md');
    try {
      const bannerContent: string = await fs.readFile(path, {
        encoding: 'utf8',
      });
      const fileStats: Stats = await fs.stat(path);
      return {
        text: bannerContent,
        updateTime: fileStats.mtime,
      };
    } catch (e) {
      return {
        text: '',
        updateTime: new Date(0),
      };
    }
  }
}
