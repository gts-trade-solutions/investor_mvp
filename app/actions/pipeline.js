'use server';

import { revalidatePath } from 'next/cache';
import getSupabaseServerClient from '@/lib/supabaseServer';

const STAGES = new Set(['to_contact', 'discussion', 'closed']);

function mustString(v, name) {
  const s = (v ?? '').toString().trim();
  if (!s) throw new Error(`Missing ${name}`);
  return s;
}

async function requireUser(sb) {
  const { data: { user }, error } = await sb.auth.getUser();
  if (error || !user) throw new Error('Not authenticated');
  return user;
}

export async function createPipelineEntryAction(formData) {
  const startupId = mustString(formData.get('startup_id'), 'startup_id');

  const sb = getSupabaseServerClient();
  const user = await requireUser(sb);

  const { error } = await sb
    .from('investor_pipeline')
    .upsert(
      { investor_id: user.id, startup_id: startupId, stage: 'to_contact' },
      { onConflict: 'investor_id,startup_id' }
    );

  if (error) throw new Error(error.message);

  revalidatePath('/(dashboard)/investor/pipeline', 'page');
  revalidatePath('/(dashboard)/investor/startups', 'page');
}

export async function updatePipelineStageAction(formData) {
  const id = mustString(formData.get('pipeline_id'), 'pipeline_id');
  const stage = mustString(formData.get('stage'), 'stage');
  if (!STAGES.has(stage)) throw new Error('Invalid stage');

  const sb = getSupabaseServerClient();
  await requireUser(sb); // RLS enforces ownership; auth ensures clean errors

  const { error } = await sb
    .from('investor_pipeline')
    .update({ stage })
    .eq('id', id);

  if (error) throw new Error(error.message);

  revalidatePath('/(dashboard)/investor/pipeline', 'page');
}

export async function deletePipelineEntryAction(formData) {
  const id = mustString(formData.get('pipeline_id'), 'pipeline_id');

  const sb = getSupabaseServerClient();
  await requireUser(sb); // RLS still protects; this gives nicer errors

  const { error } = await sb
    .from('investor_pipeline')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);

  revalidatePath('/(dashboard)/investor/pipeline', 'page');
}
