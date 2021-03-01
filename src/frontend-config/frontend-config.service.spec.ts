/*
 * SPDX-FileCopyrightText: 2021 The HedgeDoc developers (see AUTHORS file)
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Test, TestingModule } from '@nestjs/testing';
import { FrontendConfigService } from './frontend-config.service';
import { ConfigModule, registerAs } from '@nestjs/config';
import { LoggerModule } from '../logger/logger.module';
import { AuthConfig } from '../config/auth.config';
import { GitlabScope, GitlabVersion } from '../config/gitlab.enum';
import { getServerVersionFromPackageJson } from '../utils/serverVersion';
import { CustomizationConfig } from '../config/customization.config';
import { AppConfig } from '../config/app.config';
import { ExternalServicesConfig } from '../config/external-services.config';
import { Loglevel } from '../config/loglevel.enum';

describe('FrontendConfigService', () => {
  const emptyAuthConfig: AuthConfig = {
    email: {
      enableLogin: false,
      enableRegister: false,
    },
    facebook: {
      clientID: undefined,
      clientSecret: undefined,
    },
    twitter: {
      consumerKey: undefined,
      consumerSecret: undefined,
    },
    github: {
      clientID: undefined,
      clientSecret: undefined,
    },
    dropbox: {
      clientID: undefined,
      clientSecret: undefined,
      appKey: undefined,
    },
    google: {
      clientID: undefined,
      clientSecret: undefined,
      apiKey: undefined,
    },
    gitlab: [],
    ldap: [],
    saml: [],
    oauth2: [],
  };
  const facebook: AuthConfig['facebook'] = {
    clientID: 'facebookTestId',
    clientSecret: 'facebookTestSecret',
  };
  const twitter: AuthConfig['twitter'] = {
    consumerKey: 'twitterTestId',
    consumerSecret: 'twitterTestSecret',
  };
  const github: AuthConfig['github'] = {
    clientID: 'githubTestId',
    clientSecret: 'githubTestSecret',
  };
  const dropbox: AuthConfig['dropbox'] = {
    clientID: 'dropboxTestId',
    clientSecret: 'dropboxTestSecret',
    appKey: 'dropboxTestKey',
  };
  const google: AuthConfig['google'] = {
    clientID: 'googleTestId',
    clientSecret: 'googleTestSecret',
    apiKey: 'googleTestKey',
  };
  const gitlab: AuthConfig['gitlab'] = [
    {
      identifier: 'gitlabTestIdentifier',
      providerName: 'gitlabTestName',
      baseURL: 'gitlabTestUrl',
      clientID: 'gitlabTestId',
      clientSecret: 'gitlabTestSecret',
      scope: GitlabScope.API,
      version: GitlabVersion.V4,
    },
  ];
  const ldap: AuthConfig['ldap'] = [
    {
      identifier: 'ldapTestIdentifier',
      providerName: 'ldapTestName',
      url: 'ldapTestUrl',
      bindDn: 'ldapTestBindDn',
      bindCredentials: 'ldapTestBindCredentials',
      searchBase: 'ldapTestSearchBase',
      searchFilter: 'ldapTestSearchFilter',
      searchAttributes: ['ldapTestSearchAttribute'],
      usernameField: 'ldapTestUsername',
      useridField: 'ldapTestUserId',
      tlsCa: ['ldapTestTlsCa'],
    },
  ];
  const saml: AuthConfig['saml'] = [
    {
      identifier: 'samlTestIdentifier',
      providerName: 'samlTestName',
      idpSsoUrl: 'samlTestUrl',
      idpCert: 'samlTestCert',
      clientCert: 'samlTestClientCert',
      issuer: 'samlTestIssuer',
      identifierFormat: 'samlTestUrl',
      disableRequestedAuthnContext: 'samlTestUrl',
      groupAttribute: 'samlTestUrl',
      requiredGroups: ['samlTestUrl'],
      externalGroups: 'samlTestUrl',
      attribute: {
        id: 'samlTestUrl',
        username: 'samlTestUrl',
        email: 'samlTestUrl',
      },
    },
  ];
  const oauth2: AuthConfig['oauth2'] = [
    {
      identifier: 'oauth2Testidentifier',
      providerName: 'oauth2TestName',
      baseURL: 'oauth2TestUrl',
      userProfileURL: 'oauth2TestProfileUrl',
      userProfileIdAttr: 'oauth2TestProfileId',
      userProfileUsernameAttr: 'oauth2TestProfileUsername',
      userProfileDisplayNameAttr: 'oauth2TestProfileDisplay',
      userProfileEmailAttr: 'oauth2TestProfileEmail',
      tokenURL: 'oauth2TestTokenUrl',
      authorizationURL: 'oauth2TestAuthUrl',
      clientID: 'oauth2TestId',
      clientSecret: 'oauth2TestSecret',
      scope: 'oauth2TestScope',
      rolesClaim: 'oauth2TestRoles',
      accessRole: 'oauth2TestAccess',
    },
  ];
  let index = 1;
  for (const renderOrigin of [undefined, 'http://md-renderer.example.com']) {
    for (const maxDocumentLength of [100000, 900]) {
      for (const enableLogin of [true, false]) {
        for (const enableRegister of [true, false]) {
          for (const authConfigConfigured of [
            facebook,
            twitter,
            github,
            dropbox,
            google,
            gitlab,
            ldap,
            saml,
            oauth2,
          ]) {
            for (const customName of [undefined, 'Test Branding Name']) {
              for (const customLogo of [
                undefined,
                'https://example.com/logo.png',
              ]) {
                for (const privacyLink of [
                  undefined,
                  'https://example.com/privacy',
                ]) {
                  for (const termsOfUseLink of [
                    undefined,
                    'https://example.com/terms',
                  ]) {
                    for (const imprintLink of [
                      undefined,
                      'https://example.com/imprint',
                    ]) {
                      for (const plantUmlServer of [
                        undefined,
                        'https://plantuml.example.com',
                      ]) {
                        for (const imageProxy of [
                          undefined,
                          'https://imageProxy.example.com',
                        ]) {
                          it(`combination #${index} works`, async () => {
                            const appConfig: AppConfig = {
                              domain: 'http://md.example.com',
                              rendererOrigin: renderOrigin,
                              port: 3000,
                              loglevel: Loglevel.ERROR,
                              forbiddenNoteIds: [],
                              maxDocumentLength: maxDocumentLength,
                            };
                            const authConfig: AuthConfig = {
                              ...emptyAuthConfig,
                              email: {
                                enableLogin,
                                enableRegister,
                              },
                              ...authConfigConfigured,
                            };
                            const customizationConfig: CustomizationConfig = {
                              branding: {
                                customName: customName,
                                customLogo: customLogo,
                              },
                              specialUrls: {
                                privacy: privacyLink,
                                termsOfUse: termsOfUseLink,
                                imprint: imprintLink,
                              },
                            };
                            const externalServicesConfig: ExternalServicesConfig = {
                              plantUmlServer: plantUmlServer,
                              imageProxy: imageProxy,
                            };
                            const module: TestingModule = await Test.createTestingModule(
                              {
                                imports: [
                                  ConfigModule.forRoot({
                                    isGlobal: true,
                                    load: [
                                      registerAs('appConfig', () => appConfig),
                                      registerAs(
                                        'authConfig',
                                        () => authConfig,
                                      ),
                                      registerAs(
                                        'customizationConfig',
                                        () => customizationConfig,
                                      ),
                                      registerAs(
                                        'externalServicesConfig',
                                        () => externalServicesConfig,
                                      ),
                                    ],
                                  }),
                                  LoggerModule,
                                ],
                                providers: [FrontendConfigService],
                              },
                            ).compile();

                            const service = module.get(FrontendConfigService);
                            const config = await service.getFrontendConfig();
                            expect(config.allowRegister).toEqual(
                              enableRegister,
                            );
                            expect(config.authProviders.dropbox).toEqual(
                              !!authConfig.dropbox.clientID,
                            );
                            expect(config.authProviders.facebook).toEqual(
                              !!authConfig.facebook.clientID,
                            );
                            expect(config.authProviders.github).toEqual(
                              !!authConfig.github.clientID,
                            );
                            expect(config.authProviders.google).toEqual(
                              !!authConfig.google.clientID,
                            );
                            expect(config.authProviders.internal).toEqual(
                              enableLogin,
                            );
                            expect(config.authProviders.twitter).toEqual(
                              !!authConfig.twitter.consumerKey,
                            );
                            expect(config.authProviders.gitlab).toEqual(
                              authConfig.gitlab.length !== 0,
                            );
                            expect(config.authProviders.ldap).toEqual(
                              authConfig.ldap.length !== 0,
                            );
                            expect(config.authProviders.saml).toEqual(
                              authConfig.saml.length !== 0,
                            );
                            expect(config.authProviders.oauth2).toEqual(
                              authConfig.oauth2.length !== 0,
                            );
                            expect(config.allowAnonymous).toEqual(false);
                            expect(config.banner.text).toEqual('');
                            expect(config.banner.updateTime).toEqual(
                              new Date(0),
                            );
                            expect(config.branding.name).toEqual(customName);
                            expect(config.branding.logo).toEqual(
                              customLogo ? new URL(customLogo) : undefined,
                            );
                            expect(
                              config.customAuthNames.gitlab.length,
                            ).toEqual(authConfig.gitlab.length);
                            if (config.customAuthNames.gitlab.length === 1) {
                              expect(
                                config.customAuthNames.gitlab[0].identifier,
                              ).toEqual(authConfig.gitlab[0].identifier);
                              expect(
                                config.customAuthNames.gitlab[0].providerName,
                              ).toEqual(authConfig.gitlab[0].providerName);
                            }
                            expect(config.customAuthNames.ldap.length).toEqual(
                              authConfig.ldap.length,
                            );
                            if (config.customAuthNames.ldap.length === 1) {
                              expect(
                                config.customAuthNames.ldap[0].identifier,
                              ).toEqual(authConfig.ldap[0].identifier);
                              expect(
                                config.customAuthNames.ldap[0].providerName,
                              ).toEqual(authConfig.ldap[0].providerName);
                            }
                            expect(config.customAuthNames.saml.length).toEqual(
                              authConfig.saml.length,
                            );
                            if (config.customAuthNames.saml.length === 1) {
                              expect(
                                config.customAuthNames.saml[0].identifier,
                              ).toEqual(authConfig.saml[0].identifier);
                              expect(
                                config.customAuthNames.saml[0].providerName,
                              ).toEqual(authConfig.saml[0].providerName);
                            }
                            expect(
                              config.customAuthNames.oauth2.length,
                            ).toEqual(authConfig.oauth2.length);
                            if (config.customAuthNames.oauth2.length === 1) {
                              expect(
                                config.customAuthNames.oauth2[0].identifier,
                              ).toEqual(authConfig.oauth2[0].identifier);
                              expect(
                                config.customAuthNames.oauth2[0].providerName,
                              ).toEqual(authConfig.oauth2[0].providerName);
                            }
                            expect(
                              config.iframeCommunication.editorOrigin,
                            ).toEqual(new URL(appConfig.domain));
                            expect(
                              config.iframeCommunication.rendererOrigin,
                            ).toEqual(
                              appConfig.rendererOrigin
                                ? new URL(appConfig.rendererOrigin)
                                : new URL(appConfig.domain),
                            );
                            expect(config.maxDocumentLength).toEqual(
                              maxDocumentLength,
                            );
                            expect(config.plantUmlServer).toEqual(
                              plantUmlServer
                                ? new URL(plantUmlServer)
                                : undefined,
                            );
                            expect(config.specialUrls.imprint).toEqual(
                              imprintLink ? new URL(imprintLink) : undefined,
                            );
                            expect(config.specialUrls.privacy).toEqual(
                              privacyLink ? new URL(privacyLink) : undefined,
                            );
                            expect(config.specialUrls.termsOfUse).toEqual(
                              termsOfUseLink
                                ? new URL(termsOfUseLink)
                                : undefined,
                            );
                            expect(config.useImageProxy).toEqual(!!imageProxy);
                            expect(config.version).toEqual(
                              await getServerVersionFromPackageJson(),
                            );
                          });
                          index += 1;
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
});
