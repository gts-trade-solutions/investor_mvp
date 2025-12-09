'use server';

import { revalidatePath } from 'next/cache';
import getSupabaseServerClient from '@/lib/supabaseServer';

export async function expressInterestAction(formData) {
  const startupId = formData.get('startup_id');
  const supabase = getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('investor_pipeline')
    .upsert(
      {
        investor_id: user.id,
        startup_id: startupId,
        stage: 'to_contact',
      },
      { onConflict: 'investor_id,startup_id' }
    );

  if (error) throw error;

  // Investor views
  revalidatePath('/(dashboard)/investor/startups');
  revalidatePath('/(dashboard)/investor/pipeline');

  // Founder view – new row should appear in founder pipeline too
  revalidatePath('/(dashboard)/founder/pipeline');
}

export async function updatePipelineStageAction(formData) {
  const id = formData.get('pipeline_id');
  const stage = formData.get('stage');
  const supabase = getSupabaseServerClient();

  const { error } = await supabase
    .from('investor_pipeline')
    .update({ stage })
    .eq('id', id);

  if (error) throw error;

  // Revalidate both investor + founder pipeline dashboards
  revalidatePath('/(dashboard)/investor/pipeline');
  revalidatePath('/(dashboard)/founder/pipeline');
}

export async function toggleSaveAction(formData) {
  const startupId = formData.get('startup_id');
  const supabase = getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data: existing } = await supabase
    .from('investor_saves')
    .select('id')
    .eq('investor_id', user.id)
    .eq('startup_id', startupId)
    .maybeSingle();

  if (existing?.id) {
    await supabase.from('investor_saves').delete().eq('id', existing.id);
  } else {
    await supabase
      .from('investor_saves')
      .insert({ investor_id: user.id, startup_id: startupId });
  }

  revalidatePath('/(dashboard)/investor/startups');
}

/**
 * New: save discussion notes between founder and investor
 * Called from the founder pipeline "Discussion" column.
 */
export async function updateDiscussionNotesAction(formData) {
  const pipelineId = formData.get('pipeline_id');
  const notes = formData.get('discussion_notes') || '';
  if (!pipelineId) return;

  const supabase = getSupabaseServerClient();

  const { error } = await supabase
    .from('investor_pipeline')
    .update({ discussion_notes: notes })
    .eq('id', pipelineId);

  if (error) throw error;

  // Make sure both dashboards see the updated notes
  revalidatePath('/(dashboard)/founder/pipeline');
  revalidatePath('/(dashboard)/investor/pipeline');
}
