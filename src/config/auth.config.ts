/*
 * SPDX-FileCopyrightText: 2021 The HedgeDoc developers (see AUTHORS file)
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Joi from 'joi';
import { GitlabScope, GitlabVersion } from './gitlab.enum';
import {
  buildErrorMessage,
  replaceAuthErrorsWithEnvironmentVariables,
  toArrayConfig,
} from './utils';
import { registerAs } from '@nestjs/config';

export interface AuthConfig {
  email: {
    enableLogin: boolean;
    enableRegister: boolean;
  };
  facebook: {
    clientID: string;
    clientSecret: string;
  };
  twitter: {
    consumerKey: string;
    consumerSecret: string;
  };
  github: {
    clientID: string;
    clientSecret: string;
  };
  dropbox: {
    clientID: string;
    clientSecret: string;
    appKey: string;
  };
  google: {
    clientID: string;
    clientSecret: string;
    apiKey: string;
  };
  gitlab: {
    identifier: string;
    providerName: string;
    baseURL: string;
    clientID: string;
    clientSecret: string;
    scope: GitlabScope;
    version: GitlabVersion;
  }[];
  // ToDo: tlsOptions exist in config.json.example. See https://nodejs.org/api/tls.html#tls_tls_connect_options_callback
  ldap: {
    identifier: string;
    providerName: string;
    url: string;
    bindDn: string;
    bindCredentials: string;
    searchBase: string;
    searchFilter: string;
    searchAttributes: string[];
    usernameField: string;
    useridField: string;
    tlsCa: string[];
  }[];
  saml: {
    identifier: string;
    providerName: string;
    idpSsoUrl: string;
    idpCert: string;
    clientCert: string;
    issuer: string;
    identifierFormat: string;
    disableRequestedAuthnContext: string;
    groupAttribute: string;
    requiredGroups: string[];
    externalGroups: string;
    attribute: {
      id: string;
      username: string;
      email: string;
    };
  }[];
  oauth2: {
    identifier: string;
    providerName: string;
    baseURL: string;
    userProfileURL: string;
    userProfileIdAttr: string;
    userProfileUsernameAttr: string;
    userProfileDisplayNameAttr: string;
    userProfileEmailAttr: string;
    tokenURL: string;
    authorizationURL: string;
    clientID: string;
    clientSecret: string;
    scope: string;
    rolesClaim: string;
    accessRole: string;
  }[];
}

const authSchema = Joi.object({
  email: {
    enableLogin: Joi.boolean()
      .default(false)
      .optional()
      .label('HD_AUTH_EMAIL_ENABLE_LOGIN'),
    enableRegister: Joi.boolean()
      .default(false)
      .optional()
      .label('HD_AUTH_EMAIL_ENABLE_REGISTER'),
  },
  facebook: {
    clientID: Joi.string().optional().label('HD_AUTH_FACEBOOK_CLIENT_ID'),
    clientSecret: Joi.string()
      .optional()
      .label('HD_AUTH_FACEBOOK_CLIENT_SECRET'),
  },
  twitter: {
    consumerKey: Joi.string().optional().label('HD_AUTH_TWITTER_CONSUMER_KEY'),
    consumerSecret: Joi.string()
      .optional()
      .label('HD_AUTH_TWITTER_CONSUMER_SECRET'),
  },
  github: {
    clientID: Joi.string().optional().label('HD_AUTH_GITHUB_CLIENT_ID'),
    clientSecret: Joi.string().optional().label('HD_AUTH_GITHUB_CLIENT_SECRET'),
  },
  dropbox: {
    clientID: Joi.string().optional().label('HD_AUTH_DROPBOX_CLIENT_ID'),
    clientSecret: Joi.string()
      .optional()
      .label('HD_AUTH_DROPBOX_CLIENT_SECRET'),
    appKey: Joi.string().optional().label('HD_AUTH_DROPBOX_APP_KEY'),
  },
  google: {
    clientID: Joi.string().optional().label('HD_AUTH_GOOGLE_CLIENT_ID'),
    clientSecret: Joi.string().optional().label('HD_AUTH_GOOGLE_CLIENT_SECRET'),
    apiKey: Joi.string().optional().label('HD_AUTH_GOOGLE_APP_KEY'),
  },
  gitlab: Joi.array()
    .items(
      Joi.object({
        identifier: Joi.string(),
        providerName: Joi.string().default('Gitlab').optional(),
        baseURL: Joi.string(),
        clientID: Joi.string(),
        clientSecret: Joi.string(),
        scope: Joi.string()
          .valid(...Object.values(GitlabScope))
          .default(GitlabScope.READ_USER)
          .optional(),
        version: Joi.string()
          .valid(...Object.values(GitlabVersion))
          .default(GitlabVersion.V4)
          .optional(),
      }).optional(),
    )
    .optional(),
  // ToDo: should searchfilter have a default?
  ldap: Joi.array()
    .items(
      Joi.object({
        identifier: Joi.string(),
        providerName: Joi.string().default('LDAP').optional(),
        url: Joi.string(),
        bindDn: Joi.string().optional(),
        bindCredentials: Joi.string().optional(),
        searchBase: Joi.string(),
        searchFilter: Joi.string().default('(uid={{username}})').optional(),
        searchAttributes: Joi.array()
          .items(Joi.string())
          .default(['displayName', 'mail'])
          .optional(),
        usernameField: Joi.string().optional(),
        useridField: Joi.string(),
        tlsCa: Joi.array().items(Joi.string()).optional(),
      }).optional(),
    )
    .optional(),
  saml: Joi.array()
    .items(
      Joi.object({
        identifier: Joi.string(),
        providerName: Joi.string().default('SAML').optional(),
        idpSsoUrl: Joi.string(),
        idpCert: Joi.string(),
        clientCert: Joi.string().optional(),
        // ToDo: (default: config.serverURL) will be build on-the-fly in the config/index.js from domain, urlAddPort and urlPath.
        issuer: Joi.string().optional(),
        identifierFormat: Joi.string()
          .default('urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress')
          .optional(),
        disableRequestedAuthnContext: Joi.boolean().default(false).optional(),
        groupAttribute: Joi.string().optional(),
        requiredGroups: Joi.array().items(Joi.string()).optional(),
        externalGroups: Joi.array().items(Joi.string()).optional(),
        attribute: {
          id: Joi.string().default('NameId').optional(),
          username: Joi.string().default('NameId').optional(),
          email: Joi.string().default('NameId').optional(),
        },
      }).optional(),
    )
    .optional(),
  oauth2: Joi.array()
    .items(
      Joi.object({
        identifier: Joi.string(),
        providerName: Joi.string().default('OAuth2').optional(),
        baseURL: Joi.string(),
        userProfileURL: Joi.string(),
        userProfileIdAttr: Joi.string().optional(),
        userProfileUsernameAttr: Joi.string(),
        userProfileDisplayNameAttr: Joi.string(),
        userProfileEmailAttr: Joi.string(),
        tokenURL: Joi.string(),
        authorizationURL: Joi.string(),
        clientID: Joi.string(),
        clientSecret: Joi.string(),
        scope: Joi.string().optional(),
        rolesClaim: Joi.string().optional(),
        accessRole: Joi.string().optional(),
      }).optional(),
    )
    .optional(),
});

export default registerAs('authConfig', () => {
  // ToDo: Validate these with Joi to prevent duplicate entries?
  const gitlabNames = toArrayConfig(
    process.env.HD_AUTH_GITLABS,
    ',',
  ).map((name) => name.toUpperCase());
  const ldapNames = toArrayConfig(process.env.HD_AUTH_LDAPS, ',').map((name) =>
    name.toUpperCase(),
  );
  const samlNames = toArrayConfig(process.env.HD_AUTH_SAMLS, ',').map((name) =>
    name.toUpperCase(),
  );
  const oauth2Names = toArrayConfig(
    process.env.HD_AUTH_OAUTH2S,
    ',',
  ).map((name) => name.toUpperCase());

  const gitlabs = gitlabNames.map((gitlabName) => {
    return {
      identifier: gitlabName,
      providerName: process.env[`HD_AUTH_GITLAB_${gitlabName}_PROVIDER_NAME`],
      baseURL: process.env[`HD_AUTH_GITLAB_${gitlabName}_BASE_URL`],
      clientID: process.env[`HD_AUTH_GITLAB_${gitlabName}_CLIENT_ID`],
      clientSecret: process.env[`HD_AUTH_GITLAB_${gitlabName}_CLIENT_SECRET`],
      scope: process.env[`HD_AUTH_GITLAB_${gitlabName}_SCOPE`],
      version: process.env[`HD_AUTH_GITLAB_${gitlabName}_GITLAB_VERSION`],
    };
  });

  const ldaps = ldapNames.map((ldapName) => {
    return {
      identifier: ldapName,
      providerName: process.env[`HD_AUTH_LDAP_${ldapName}_PROVIDER_NAME`],
      url: process.env[`HD_AUTH_LDAP_${ldapName}_URL`],
      bindDn: process.env[`HD_AUTH_LDAP_${ldapName}_BIND_DN`],
      bindCredentials: process.env[`HD_AUTH_LDAP_${ldapName}_BIND_CREDENTIALS`],
      searchBase: process.env[`HD_AUTH_LDAP_${ldapName}_SEARCH_BASE`],
      searchFilter: process.env[`HD_AUTH_LDAP_${ldapName}_SEARCH_FILTER`],
      searchAttributes: toArrayConfig(
        process.env[`HD_AUTH_LDAP_${ldapName}_SEARCH_ATTRIBUTES`],
        ',',
      ),
      usernameField: process.env[`HD_AUTH_LDAP_${ldapName}_USERNAME_FIELD`],
      useridField: process.env[`HD_AUTH_LDAP_${ldapName}_USERID_FIELD`],
      tlsCa: toArrayConfig(process.env[`HD_AUTH_LDAP_${ldapName}_TLS_CA`], ','),
    };
  });

  const samls = samlNames.map((samlName) => {
    return {
      identifier: samlName,
      providerName: process.env[`HD_AUTH_SAML_${samlName}_PROVIDER_NAME`],
      idpSsoUrl: process.env[`HD_AUTH_SAML_${samlName}_IDP_SSO_URL`],
      idpCert: process.env[`HD_AUTH_SAML_${samlName}_IDP_CERT`],
      clientCert: process.env[`HD_AUTH_SAML_${samlName}_CLIENT_CERT`],
      issuer: process.env[`HD_AUTH_SAML_${samlName}_ISSUER`],
      identifierFormat:
        process.env[`HD_AUTH_SAML_${samlName}_IDENTIFIER_FORMAT`],
      disableRequestedAuthnContext:
        process.env[`HD_AUTH_SAML_${samlName}_DISABLE_REQUESTED_AUTHN_CONTEXT`],
      groupAttribute: process.env[`HD_AUTH_SAML_${samlName}_GROUP_ATTRIBUTE`],
      requiredGroups: toArrayConfig(
        process.env[`HD_AUTH_SAML_${samlName}_REQUIRED_GROUPS`],
        '|',
      ),
      externalGroups: toArrayConfig(
        process.env[`HD_AUTH_SAML_${samlName}_EXTERNAL_GROUPS`],
        '|',
      ),
      attribute: {
        id: process.env[`HD_AUTH_SAML_${samlName}_ATTRIBUTE_ID`],
        username: process.env[`HD_AUTH_SAML_${samlName}_ATTRIBUTE_USERNAME`],
        email: process.env[`HD_AUTH_SAML_${samlName}_ATTRIBUTE_USERNAME`],
      },
    };
  });

  const oauth2s = oauth2Names.map((oauth2Name) => {
    return {
      identifier: oauth2Name,
      providerName: process.env[`HD_AUTH_OAUTH2_${oauth2Name}_PROVIDER_NAME`],
      baseURL: process.env[`HD_AUTH_OAUTH2_${oauth2Name}_BASE_URL`],
      userProfileURL:
        process.env[`HD_AUTH_OAUTH2_${oauth2Name}_USER_PROFILE_URL`],
      userProfileIdAttr:
        process.env[`HD_AUTH_OAUTH2_${oauth2Name}_USER_PROFILE_ID_ATTR`],
      userProfileUsernameAttr:
        process.env[`HD_AUTH_OAUTH2_${oauth2Name}_USER_PROFILE_USERNAME_ATTR`],
      userProfileDisplayNameAttr:
        process.env[
          `HD_AUTH_OAUTH2_${oauth2Name}_USER_PROFILE_DISPLAY_NAME_ATTR`
        ],
      userProfileEmailAttr:
        process.env[`HD_AUTH_OAUTH2_${oauth2Name}_USER_PROFILE_EMAIL_ATTR`],
      tokenURL: process.env[`HD_AUTH_OAUTH2_${oauth2Name}_TOKEN_URL`],
      authorizationURL:
        process.env[`HD_AUTH_OAUTH2_${oauth2Name}_AUTHORIZATION_URL`],
      clientID: process.env[`HD_AUTH_OAUTH2_${oauth2Name}_CLIENT_ID`],
      clientSecret: process.env[`HD_AUTH_OAUTH2_${oauth2Name}_CLIENT_SECRET`],
      scope: process.env[`HD_AUTH_OAUTH2_${oauth2Name}_SCOPE`],
      rolesClaim: process.env[`HD_AUTH_OAUTH2_${oauth2Name}`],
      accessRole: process.env[`HD_AUTH_OAUTH2_${oauth2Name}_ACCESS_ROLE`],
    };
  });

  const authConfig = authSchema.validate(
    {
      email: {
        enableLogin: process.env.HD_AUTH_EMAIL_ENABLE_LOGIN,
        enableRegister: process.env.HD_AUTH_EMAIL_ENABLE_REGISTER,
      },
      facebook: {
        clientID: process.env.HD_AUTH_FACEBOOK_CLIENT_ID,
        clientSecret: process.env.HD_AUTH_FACEBOOK_CLIENT_SECRET,
      },
      twitter: {
        consumerKey: process.env.HD_AUTH_TWITTER_CONSUMER_KEY,
        consumerSecret: process.env.HD_AUTH_TWITTER_CONSUMER_SECRET,
      },
      github: {
        clientID: process.env.HD_AUTH_GITHUB_CLIENT_ID,
        clientSecret: process.env.HD_AUTH_GITHUB_CLIENT_SECRET,
      },
      dropbox: {
        clientID: process.env.HD_AUTH_DROPBOX_CLIENT_ID,
        clientSecret: process.env.HD_AUTH_DROPBOX_CLIENT_SECRET,
        appKey: process.env.HD_AUTH_DROPBOX_APP_KEY,
      },
      google: {
        clientID: process.env.HD_AUTH_GOOGLE_CLIENT_ID,
        clientSecret: process.env.HD_AUTH_GOOGLE_CLIENT_SECRET,
        apiKey: process.env.HD_AUTH_GOOGLE_APP_KEY,
      },
      gitlab: gitlabs,
      ldap: ldaps,
      saml: samls,
      oauth2: oauth2s,
    },
    {
      abortEarly: false,
      presence: 'required',
    },
  );
  if (authConfig.error) {
    const errorMessages = authConfig.error.details
      .map((detail) => detail.message)
      .map((error) => {
        error = replaceAuthErrorsWithEnvironmentVariables(
          error,
          'gitlab',
          'HD_AUTH_GITLAB_',
          gitlabNames,
        );
        error = replaceAuthErrorsWithEnvironmentVariables(
          error,
          'ldap',
          'HD_AUTH_LDAP_',
          ldapNames,
        );
        error = replaceAuthErrorsWithEnvironmentVariables(
          error,
          'saml',
          'HD_AUTH_SAML_',
          samlNames,
        );
        error = replaceAuthErrorsWithEnvironmentVariables(
          error,
          'oauth2',
          'HD_AUTH_OAUTH2_',
          oauth2Names,
        );
        return error;
      });
    throw new Error(buildErrorMessage(errorMessages));
  }
  return authConfig.value as AuthConfig;
});
