/**
 * fixSequences.ts — ressincroniza sequências serial após deleções manuais.
 * Uso: npx tsx --env-file=.env scripts/fixSequences.ts
 */
import { db } from '../db/index';
import { sql } from 'drizzle-orm';

async function fixSequences() {
  console.log('🔧 A ressincronizar sequências…\n');

  const result = await db.execute(sql`
    SELECT setval('audit_logs_id_seq', (SELECT COALESCE(MAX(id), 1) FROM audit_logs))
  `);
  const newVal = (result.rows[0] as any)?.setval;
  console.log(`   ✓ audit_logs_id_seq → ${newVal}`);

  console.log('\n✅ Sequências corrigidas!');
  process.exit(0);
}

fixSequences().catch(err => { console.error('❌', err); process.exit(1); });
