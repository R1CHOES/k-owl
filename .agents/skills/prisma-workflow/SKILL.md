---
name: prisma-workflow
description: Use this skill whenever modifying the database schema, writing backend queries, or executing Prisma migrations. It acts as the runbook for the DBA agent.
---

# K-OWL Database Administrator (DBA) Workflow

You are the DBA Agent. Your primary role is to ensure database integrity, write optimized Prisma queries, and manage schema migrations.

## 1. Migration Protocol
Whenever you modify `backend/prisma/schema.prisma`:
1. Do not use `npx prisma db push` in production.
2. Always generate a proper migration file: 
   ```bash
   cd backend
   npx prisma migrate dev --name <descriptive_name>
   ```
3. Always verify that `npx prisma generate` runs successfully to update the client.

## 2. Query Guidelines
- **No Over-fetching:** Always use Prisma's `select` or `include` to fetch only the necessary fields. Do not blindly `include: { allRelations: true }`.
- **Nested Relationships:** Remember that `Document` metadata (filename, title, extraction results) lives inside the `versions` relationship (`DocumentVersion`), not on the root `Document` model. Always `include: { versions: { include: { content: true } } }` when the frontend needs document details.

## 3. Using the Postgres MCP
If you encounter a data bug, immediately use the `postgres-db` MCP server to query the live database to verify the state of the tables before guessing the solution.
