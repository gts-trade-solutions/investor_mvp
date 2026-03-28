import { NextResponse } from "next/server";
import supabase from "@/lib/supabaseClient";

export async function POST(req) {
  try {
    const { investor_id, connector_id, message } = await req.json();

    if (!investor_id || !connector_id || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 1) Get logged-in user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // 2) Insert into founder_introductions table
    const { data, error } = await supabase
      .from("founder_introductions")
      .insert({
        founder_id: user.id,
        investor_id,
        connector_id,
        message,
        status: "REQUESTED",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, intro: data },
      { status: 201 }
    );
  } catch (e) {
    return NextResponse.json(
      { error: e.message },
      { status: 500 }
    );
  }
}
