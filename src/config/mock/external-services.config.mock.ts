/*
 * SPDX-FileCopyrightText: 2021 The HedgeDoc developers (see AUTHORS file)
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { registerAs } from '@nestjs/config';

export default registerAs('externalServicesConfig', () => ({
  plantUmlServer: 'plantuml.example.com',
  imageProxy: 'imageProxy.example.com',
}));
