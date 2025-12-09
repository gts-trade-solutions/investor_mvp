// app/api/auth/signup/route.js
import { NextResponse } from 'next/server';
import { createRouteSupabase } from '@/lib/supabase/server';
import supabaseAdmin from '@/lib/supabaseAdmin'; // 👈 adjust path if needed

export const dynamic = 'force-dynamic';

export async function POST(req) {
  const { supabase, res } = createRouteSupabase(req);

  let payload;
  try {
    payload = await req.json();
  } catch (e) {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
  }

  let { name, email, password, role } = payload || {};
  if (!email || !password || !role) {
    return NextResponse.json(
      { message: 'Missing email, password or role' },
      { status: 400 }
    );
  }

  const roleNormalized = String(role).toLowerCase(); // 'founder' | 'investor'
  const full_name = name || null;

  const onboarding =
    roleNormalized === 'investor'
      ? '/onboarding/investor'
      : '/onboarding/founder';

  // 1️⃣ Create user as already confirmed using admin client
  const { data: created, error: createError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // 👈 bypasses "email_not_confirmed"
      user_metadata: {
        role: roleNormalized,
        full_name,
      },
    });

  if (createError || !created || !created.user) {
    console.error('admin.createUser error', createError);
    return NextResponse.json(
      { message: createError?.message || 'Failed to create user' },
      { status: 400 }
    );
  }

  // 2️⃣ Sign them in on the server so the auth cookie is set
  const { data: signInData, error: signInError } =
    await supabase.auth.signInWithPassword({ email, password });

  if (signInError || !signInData || !signInData.user) {
    console.error('server signIn error', signInError);
    return NextResponse.json(
      { message: signInError?.message || 'Failed to sign in' },
      { status: 400 }
    );
  }

  // 3️⃣ Upsert profile row (optional – adjust to your schema)
  try {
    await supabase.from('profiles').upsert({
      id: signInData.user.id,
      role: roleNormalized,
      full_name,
    });
  } catch (e) {
    console.warn('profiles upsert warning', e?.message);
  }

  // 4️⃣ Send back where the client should go; cookie is attached via res.headers
  return new NextResponse(
    JSON.stringify({
      ok: true,
      next: onboarding,
    }),
    {
      status: 200,
      headers: res.headers,
    }
  );
}
