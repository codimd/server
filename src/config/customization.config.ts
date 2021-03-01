/*
 * SPDX-FileCopyrightText: 2021 The HedgeDoc developers (see AUTHORS file)
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';
import { buildErrorMessage } from './utils';

export interface CustomizationConfig {
  branding: {
    customName: string;
    customLogo: string;
  };
  specialUrls: {
    privacy: string;
    termsOfUse: string;
    imprint: string;
  };
}

const schema = Joi.object({
  branding: Joi.object({
    customName: Joi.string().optional().label('HD_CUSTOM_NAME'),
    customLogo: Joi.string()
      .uri({
        scheme: [/https?/],
      })
      .optional()
      .label('HD_CUSTOM_LOGO'),
  }),
  specialUrls: Joi.object({
    privacy: Joi.string()
      .uri({
        scheme: /https?/,
      })
      .optional()
      .label('HD_PRIVACY_URL'),
    termsOfUse: Joi.string()
      .uri({
        scheme: /https?/,
      })
      .optional()
      .label('HD_TERMS_OF_USE_URL'),
    imprint: Joi.string()
      .uri({
        scheme: /https?/,
      })
      .optional()
      .label('HD_IMPRINT_URL'),
  }),
});

export default registerAs('customizationConfig', () => {
  const customizationConfig = schema.validate(
    {
      branding: {
        customName: process.env.HD_CUSTOM_NAME,
        customLogo: process.env.HD_CUSTOM_LOGO,
      },
      specialUrls: {
        privacy: process.env.HD_PRIVACY_URL,
        termsOfUse: process.env.HD_TERMS_OF_USE_URL,
        imprint: process.env.HD_IMPRINT_URL,
      },
    },
    {
      abortEarly: false,
      presence: 'required',
    },
  );
  if (customizationConfig.error) {
    const errorMessages = customizationConfig.error.details.map(
      (detail) => detail.message,
    );
    throw new Error(buildErrorMessage(errorMessages));
  }
  return customizationConfig.value as CustomizationConfig;
});
