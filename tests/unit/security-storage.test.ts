import { describe, it, expect } from 'vitest';

describe('Storage Zero-Trust Verification', () => {
  it('verifies service-role client module enforces server-only restriction', async () => {
    // Check that service-role.ts imports 'server-only'
    const serviceRoleFileContent = await import('fs').then((fs) =>
      fs.readFileSync('lib/supabase/service-role.ts', 'utf-8')
    );
    expect(serviceRoleFileContent).toContain("import 'server-only'");
  });

  it('verifies storage bucket migration ensures challenge-files bucket is private', async () => {
    const storageMigration = await import('fs').then((fs) =>
      fs.readFileSync('supabase/migrations/00003_storage_policies.sql', 'utf-8')
    );
    // Must specify public = false
    expect(storageMigration).toContain('public = false');
    // Must restrict storage.objects select/insert/delete to authenticated admins or service_role
    expect(storageMigration).toContain('public.is_admin()');
  });

  it('verifies RLS trigger migration enforces column-level privilege revocation', async () => {
    const rlsMigration = await import('fs').then((fs) =>
      fs.readFileSync('supabase/migrations/00002_rls_and_triggers.sql', 'utf-8')
    );
    expect(rlsMigration).toContain('REVOKE UPDATE ON public.profiles FROM authenticated;');
    expect(rlsMigration).toContain('GRANT UPDATE (display_name) ON public.profiles TO authenticated;');
    expect(rlsMigration).toContain('SECURITY INVOKER');
    expect(rlsMigration).toContain('pg_catalog.now()');
  });
});
