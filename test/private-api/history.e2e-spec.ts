/*
 * SPDX-FileCopyrightText: 2021 The HedgeDoc developers (see AUTHORS file)
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable
@typescript-eslint/no-unsafe-assignment,
@typescript-eslint/no-unsafe-member-access
*/

import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import mediaConfigMock from '../../src/config/media.config.mock';
import appConfigMock from '../../src/config/app.config.mock';
import { GroupsModule } from '../../src/groups/groups.module';
import { LoggerModule } from '../../src/logger/logger.module';
import { NotesModule } from '../../src/notes/notes.module';
import { NotesService } from '../../src/notes/notes.service';
import { PermissionsModule } from '../../src/permissions/permissions.module';
import { AuthModule } from '../../src/auth/auth.module';
import { UsersService } from '../../src/users/users.service';
import { User } from '../../src/users/user.entity';
import { UsersModule } from '../../src/users/users.module';
import { PrivateApiModule } from '../../src/api/private/private-api.module';
import { HistoryService } from '../../src/history/history.service';
import { Note } from '../../src/notes/note.entity';
import { HistoryEntryCreationDto } from '../../src/history/history-entry-creation.dto';

describe('History', () => {
  let app: INestApplication;
  let historyService: HistoryService;
  let user: User;
  let note: Note;
  let note2: Note;
  let content: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [appConfigMock, mediaConfigMock],
        }),
        PrivateApiModule,
        NotesModule,
        PermissionsModule,
        GroupsModule,
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: './hedgedoc-e2e-private-history.sqlite',
          autoLoadEntities: true,
          synchronize: true,
          dropSchema: true,
        }),
        LoggerModule,
        AuthModule,
        UsersModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    content = 'This is a test note.';
    historyService = moduleRef.get(HistoryService);
    const userService = moduleRef.get(UsersService);
    user = await userService.createUser('hardcoded', 'Testy');
    const notesService = moduleRef.get(NotesService);
    note = await notesService.createNote(content, null, user);
    note2 = await notesService.createNote(content, 'note2', user);
  });

  it('GET /history', async () => {
    const emptyResponse = await request(app.getHttpServer())
      .get('/history')
      .expect('Content-Type', /json/)
      .expect(200);
    expect(emptyResponse.body.length).toEqual(0);
    const entry = await historyService.createOrUpdateHistoryEntry(note, user);
    const entryDto = historyService.toHistoryEntryDto(entry);
    const response = await request(app.getHttpServer())
      .get('/history')
      .expect('Content-Type', /json/)
      .expect(200);
    expect(response.body.length).toEqual(1);
    expect(response.body[0].identifier).toEqual(entryDto.identifier);
    expect(response.body[0].title).toEqual(entryDto.title);
    expect(response.body[0].tags).toEqual(entryDto.tags);
    expect(response.body[0].pinStatus).toEqual(entryDto.pinStatus);
    expect(response.body[0].lastVisited).toEqual(
      entryDto.lastVisited.toISOString(),
    );
  });

  it('POST /history', async () => {
    const postEntryDto = new HistoryEntryCreationDto();
    postEntryDto.note = note2.alias;
    await request(app.getHttpServer())
      .post('/history')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ history: [postEntryDto] }))
      .expect(201);
    const userEntries = await historyService.getEntriesByUser(user);
    expect(userEntries.length).toEqual(1);
    expect(userEntries[0].note.alias).toEqual(note2.alias);
  });

  it('DELETE /history', async () => {
    expect((await historyService.getEntriesByUser(user)).length).toEqual(1);
    await request(app.getHttpServer()).delete('/history').expect(200);
    expect((await historyService.getEntriesByUser(user)).length).toEqual(0);
  });

  it('PUT /history/:note', async () => {
    const entry = await historyService.createOrUpdateHistoryEntry(note2, user);
    expect(entry.pinStatus).toBeFalsy();
    await request(app.getHttpServer())
      .put(`/history/${entry.note.alias}`)
      .send({ pinStatus: true })
      .expect(200);
    const userEntries = await historyService.getEntriesByUser(user);
    expect(userEntries.length).toEqual(1);
    expect(userEntries[0].pinStatus).toBeTruthy();
    await historyService.deleteHistoryEntry(note2.alias, user);
  });

  it('DELETE /history/:note', async () => {
    const entry = await historyService.createOrUpdateHistoryEntry(note2, user);
    const entry2 = await historyService.createOrUpdateHistoryEntry(note, user);
    const entryDto = historyService.toHistoryEntryDto(entry2);
    await request(app.getHttpServer())
      .delete(`/history/${entry.note.alias}`)
      .expect(200);
    const userEntries = await historyService.getEntriesByUser(user);
    expect(userEntries.length).toEqual(1);
    const userEntryDto = historyService.toHistoryEntryDto(userEntries[0]);
    expect(userEntryDto.identifier).toEqual(entryDto.identifier);
    expect(userEntryDto.title).toEqual(entryDto.title);
    expect(userEntryDto.tags).toEqual(entryDto.tags);
    expect(userEntryDto.pinStatus).toEqual(entryDto.pinStatus);
    expect(userEntryDto.lastVisited).toEqual(entryDto.lastVisited);
  });

  afterAll(async () => {
    await app.close();
  });
});
