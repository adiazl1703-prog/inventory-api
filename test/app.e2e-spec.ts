import 'dotenv/config';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { API_PREFIX, configureApp } from '../src/app.setup.js';

// Runs against the real database; a unique suffix keeps repeated runs independent.
const suffix = Date.now().toString(36);
const serialNumber = `E2E-${suffix}`;

describe('Inventory API (e2e)', () => {
  let app: INestApplication;
  let equipmentId: string;
  let employeeId: string;
  let assignmentId: string;

  const http = () => request(app.getHttpServer());
  const url = (path: string) => `/${API_PREFIX}${path}`;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers equipment', async () => {
    const { body } = await http()
      .post(url('/equipments'))
      .send({
        serialNumber,
        type: 'Laptop',
        brand: 'Lenovo',
        model: 'T14',
        location: 'Bogota',
      })
      .expect(201);
    equipmentId = body.id;
    expect(body.status).toBe('available');
  });

  it('rejects a duplicate serial number', async () => {
    await http()
      .post(url('/equipments'))
      .send({
        serialNumber,
        type: 'Laptop',
        brand: 'Dell',
        model: 'X',
        location: 'Bogota',
      })
      .expect(409);
  });

  it('rejects a location outside Bogota and Cartagena', async () => {
    await http()
      .post(url('/equipments'))
      .send({
        serialNumber: `${serialNumber}-2`,
        type: 'L',
        brand: 'B',
        model: 'M',
        location: 'Cali',
      })
      .expect(400);
  });

  it('rejects setting a workflow status manually', async () => {
    await http()
      .patch(url(`/equipments/${equipmentId}`))
      .send({ status: 'decommissioned' })
      .expect(400);
  });

  it('registers an employee', async () => {
    const { body } = await http()
      .post(url('/employees'))
      .send({
        name: 'Ana Gómez',
        idDocument: `DOC-${suffix}`,
        position: 'Analyst',
        location: 'Cartagena',
        email: `ANA.${suffix}@Example.com`,
      })
      .expect(201);
    employeeId = body.id;
    expect(body.email).toBe(`ana.${suffix}@example.com`);
  });

  it('assigns the equipment once', async () => {
    const { body } = await http()
      .post(url('/assignments'))
      .send({ equipmentId, employeeId, notes: 'With charger' })
      .expect(201);
    assignmentId = body.id;
    expect(body.equipment.status).toBe('assigned');
    expect(body.returnedAt).toBeNull();

    await http()
      .post(url('/assignments'))
      .send({ equipmentId, employeeId })
      .expect(409);
  });

  it('blocks decommissioning while assigned', async () => {
    await http()
      .patch(url(`/equipments/${equipmentId}/decommission`))
      .expect(409);
  });

  it('lists the current equipment of the employee', async () => {
    const { body } = await http()
      .get(url(`/employees/${employeeId}/equipments`))
      .expect(200);
    expect(body).toHaveLength(1);
    expect(body[0].equipment.serialNumber).toBe(serialNumber);
  });

  it('filters equipment by location and status', async () => {
    const { body } = await http()
      .get(url('/equipments'))
      .query({ location: 'Bogota', status: 'assigned', limit: 100 })
      .expect(200);
    expect(body.data.map((item: { id: string }) => item.id)).toContain(
      equipmentId,
    );
  });

  it('registers the return only once', async () => {
    const { body } = await http()
      .patch(url(`/assignments/${assignmentId}/return`))
      .send({ notes: 'Good condition' })
      .expect(200);
    expect(body.equipment.status).toBe('available');
    expect(new Date(body.returnedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(body.assignedAt).getTime(),
    );

    await http()
      .patch(url(`/assignments/${assignmentId}/return`))
      .send({})
      .expect(409);
    const current = await http()
      .get(url(`/employees/${employeeId}/equipments`))
      .expect(200);
    expect(current.body).toHaveLength(0);
  });

  it('keeps one winner when the same unit is assigned concurrently', async () => {
    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        http().post(url('/assignments')).send({ equipmentId, employeeId }),
      ),
    );
    const statuses = results
      .map((result) => result.status)
      .sort((a, b) => a - b);
    expect(statuses).toEqual([201, 409, 409, 409, 409]);

    const winner = results.find((result) => result.status === 201);
    await http()
      .patch(url(`/assignments/${winner?.body.id}/return`))
      .send({})
      .expect(200);
  });

  it('returns the complete history by serial number', async () => {
    const { body } = await http()
      .get(url(`/equipments/serial/${serialNumber}/assignments`))
      .expect(200);
    expect(body.assignments).toHaveLength(2);
    expect(body.assignments[1].id).toBe(assignmentId);
    expect(body.assignments[1].employee.id).toBe(employeeId);
  });

  it('decommissions the equipment and keeps its history', async () => {
    const { body } = await http()
      .patch(url(`/equipments/${equipmentId}/decommission`))
      .expect(200);
    expect(body.status).toBe('decommissioned');
    expect(body.decommissionedAt).not.toBeNull();

    await http()
      .post(url('/assignments'))
      .send({ equipmentId, employeeId })
      .expect(409);
    const history = await http()
      .get(url(`/equipments/serial/${serialNumber}/assignments`))
      .expect(200);
    expect(history.body.assignments).toHaveLength(2);
  });

  it('returns 404 for unknown records and 400 for malformed IDs', async () => {
    await http()
      .get(url('/equipments/00000000-0000-4000-8000-000000000000'))
      .expect(404);
    await http().get(url('/equipments/not-a-uuid')).expect(400);
    await http().get(url('/equipments/serial/UNKNOWN/assignments')).expect(404);
  });
});
