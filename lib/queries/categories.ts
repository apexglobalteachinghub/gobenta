import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { CategoryRow } from "@/types/database";

async function fetchMainCategories(): Promise<CategoryRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .is("parent_id", null)
    .order("name");

  if (error) {
    console.error("getMainCategories", error);
    return [];
  }
  return data as CategoryRow[];
}

export const getMainCategories = cache(fetchMainCategories);

export async function getSubcategories(
  parentId: string
): Promise<CategoryRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("parent_id", parentId)
    .order("name");

  if (error) {
    console.error("getSubcategories", error);
    return [];
  }
  return data as CategoryRow[];
}

async function fetchAllCategoriesFlat(): Promise<CategoryRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  if (error) return [];
  return data as CategoryRow[];
}

export const getAllCategoriesFlat = cache(fetchAllCategoriesFlat);
