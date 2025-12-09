// app/(dashboard)/founder/startups/new/page.jsx
'use client';
import { useState } from 'react';
import supabase from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function NewStartup() {
  const [form, setForm] = useState({ name:'', company:'', short_description:'', stage:'seed', mrr:'', team_size:'', country:'', sectors:'AI,SaaS', website_url:'' });
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function onSubmit(e) {
    e.preventDefault(); setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return;

    const sectors = form.sectors.split(',').map(s=>s.trim()).filter(Boolean);
    const { error } = await supabase.from('startups').insert({
      owner: session.user.id,
      name: form.name,
      company: form.company || null,
      short_description: form.short_description || null,
      stage: form.stage || null,
      mrr: form.mrr ? Number(form.mrr) : null,
      team_size: form.team_size ? Number(form.team_size) : null,
      country: form.country || null,
      sectors,
      website_url: form.website_url || null
    });

    setSaving(false);
    if (!error) router.push('/(dashboard)/founder'); // or your founder list page
    else console.error(error);
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader><CardTitle>Create Startup</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-3">
          <Input placeholder="Name" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required />
          <Input placeholder="Company" value={form.company} onChange={e=>setForm(f=>({...f,company:e.target.value}))} />
          <Textarea placeholder="Short description" value={form.short_description} onChange={e=>setForm(f=>({...f,short_description:e.target.value}))} />
          <Input placeholder="Stage (pre_seed, seed, series_a…)" value={form.stage} onChange={e=>setForm(f=>({...f,stage:e.target.value}))} />
          <Input placeholder="MRR (number)" value={form.mrr} onChange={e=>setForm(f=>({...f,mrr:e.target.value}))} />
          <Input placeholder="Team size" value={form.team_size} onChange={e=>setForm(f=>({...f,team_size:e.target.value}))} />
          <Input placeholder="Country" value={form.country} onChange={e=>setForm(f=>({...f,country:e.target.value}))} />
          <Input placeholder="Sectors (comma separated)" value={form.sectors} onChange={e=>setForm(f=>({...f,sectors:e.target.value}))} />
          <Input placeholder="Website URL" value={form.website_url} onChange={e=>setForm(f=>({...f,website_url:e.target.value}))} />
          <Button type="submit" disabled={saving}>{saving?'Saving…':'Create'}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
