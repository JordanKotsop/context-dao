import { NextRequest, NextResponse } from "next/server";
import { searchSkills } from "@/lib/skills";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? undefined;
  const sortBy = (searchParams.get("sort") as "newest" | "price_low" | "price_high" | "accuracy") ?? undefined;

  const skills = searchSkills(query, category, sortBy);

  return NextResponse.json({ skills, total: skills.length });
}
