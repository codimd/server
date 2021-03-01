/*
 * SPDX-FileCopyrightText: 2021 The HedgeDoc developers (see AUTHORS file)
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';
import { Loglevel } from './loglevel.enum';
import { buildErrorMessage, toArrayConfig } from './utils';

export interface AppConfig {
  domain: string;
  rendererOrigin: string;
  port: number;
  loglevel: Loglevel;
  forbiddenNoteIds: string[];
  maxDocumentLength: number;
}

const schema = Joi.object({
  domain: Joi.string().label('HD_DOMAIN'),
  rendererOrigin: Joi.string().optional().label('HD_RENDERER_ORIGIN'),
  port: Joi.number().default(3000).optional().label('PORT'),
  loglevel: Joi.string()
    .valid(...Object.values(Loglevel))
    .default(Loglevel.WARN)
    .optional()
    .label('HD_LOGLEVEL'),
  forbiddenNoteIds: Joi.array()
    .items(Joi.string())
    .optional()
    .default([])
    .label('HD_FORBIDDEN_NOTE_IDS'),
  maxDocumentLength: Joi.number()
    .default(100000)
    .optional()
    .label('HD_MAX_DOCUMENT_LENGTH'),
});

export default registerAs('appConfig', () => {
  const appConfig = schema.validate(
    {
      domain: process.env.HD_DOMAIN,
      rendererOrigin: process.env.HD_RENDERER_ORIGIN,
      port: parseInt(process.env.PORT) || undefined,
      loglevel: process.env.HD_LOGLEVEL,
      forbiddenNoteIds: toArrayConfig(process.env.HD_FORBIDDEN_NOTE_IDS, ','),
      maxDocumentLength:
        parseInt(process.env.HD_MAX_DOCUMENT_LENGTH) || undefined,
    },
    {
      abortEarly: false,
      presence: 'required',
    },
  );
  if (appConfig.error) {
    const errorMessages = appConfig.error.details.map(
      (detail) => detail.message,
    );
    throw new Error(buildErrorMessage(errorMessages));
  }
  return appConfig.value as AppConfig;
});
