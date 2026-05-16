// src/lib/provisionTenant.ts
import { prisma } from "./prisma";

export async function provisionTenant(tenantName: string) {
  const schemaName =
    "tenant_" + tenantName.toLowerCase().replace(/[^a-z0-9]/g, "_");

  // Register in global registry
  const tenant = await prisma.tenant.create({
    data: { name: tenantName, schemaName },
  });

  // Create schema and all tables in a transaction
  await prisma.$transaction([
    prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`),

    prisma.$executeRawUnsafe(`
      CREATE TABLE "${schemaName}".users (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email         TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at    TIMESTAMPTZ DEFAULT now()
      )
    `),

    prisma.$executeRawUnsafe(`
      CREATE TABLE "${schemaName}".roles (
        id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE
      )
    `),

    prisma.$executeRawUnsafe(`
      CREATE TABLE "${schemaName}".user_roles (
        user_id UUID REFERENCES "${schemaName}".users(id),
        role_id UUID REFERENCES "${schemaName}".roles(id),
        PRIMARY KEY (user_id, role_id)
      )
    `),

    prisma.$executeRawUnsafe(`
      CREATE TABLE "${schemaName}".sales (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cashier_id UUID REFERENCES "${schemaName}".users(id),
        amount     NUMERIC(10,2),
        status     TEXT DEFAULT 'completed',
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `),

    prisma.$executeRawUnsafe(`
      CREATE TABLE "${schemaName}".inventory (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title       TEXT NOT NULL,
        category    TEXT,
        qty         INTEGER DEFAULT 0,
        price       NUMERIC(10,2),
        updated_at  TIMESTAMPTZ DEFAULT now()
      )
    `),

    prisma.$executeRawUnsafe(`
      CREATE TABLE "${schemaName}".audit_logs (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        actor_id    UUID,
        actor_role  TEXT,
        action      TEXT,
        resource_id UUID,
        metadata    JSONB,
        created_at  TIMESTAMPTZ DEFAULT now()
      )
    `),

    // Copy role names from global templates
    prisma.$executeRawUnsafe(`
      INSERT INTO "${schemaName}".roles (name)
      SELECT name FROM global.role_templates
    `),
  ]);

  return { tenant, schemaName };
}
