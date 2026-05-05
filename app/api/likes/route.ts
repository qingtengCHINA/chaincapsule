import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const capsuleId = searchParams.get("capsuleId");
  const wallet = searchParams.get("wallet");

  if (!capsuleId) {
    return NextResponse.json({ error: "capsuleId is required" }, { status: 400 });
  }

  // Get like count
  const { count, error: countError } = await supabase
    .from("capsule_likes")
    .select("*", { count: "exact", head: true })
    .eq("capsule_id", Number(capsuleId));

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  // Check if user liked
  let userLiked = false;
  if (wallet) {
    const { data: existing, error: likeError } = await supabase
      .from("capsule_likes")
      .select("id")
      .eq("capsule_id", Number(capsuleId))
      .eq("wallet_address", wallet)
      .maybeSingle();

    if (!likeError && existing) {
      userLiked = true;
    }
  }

  return NextResponse.json({ likes: count ?? 0, userLiked });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { capsuleId, walletAddress } = body;

  if (!capsuleId || !walletAddress) {
    return NextResponse.json(
      { error: "capsuleId and walletAddress are required" },
      { status: 400 }
    );
  }

  // Check if already liked
  const { data: existing } = await supabase
    .from("capsule_likes")
    .select("id")
    .eq("capsule_id", capsuleId)
    .eq("wallet_address", walletAddress)
    .maybeSingle();

  if (existing) {
    // Unlike
    const { error: deleteError } = await supabase
      .from("capsule_likes")
      .delete()
      .eq("id", existing.id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }
  } else {
    // Like
    const { error: insertError } = await supabase
      .from("capsule_likes")
      .insert({ capsule_id: capsuleId, wallet_address: walletAddress });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  // Get updated count
  const { count } = await supabase
    .from("capsule_likes")
    .select("*", { count: "exact", head: true })
    .eq("capsule_id", capsuleId);

  return NextResponse.json({ likes: count ?? 0, userLiked: !existing });
}
