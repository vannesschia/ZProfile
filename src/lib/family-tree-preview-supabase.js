import "server-only";
import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import path from "node:path";

let client;
let clientUrl;
let clientServiceRoleKey;

export async function getFamilyTreePreviewSupabase() {
  if (process.env.NODE_ENV !== "development") return null;
  let config;
  try {
    config = JSON.parse(
      await readFile(
        path.join(process.cwd(), ".local/family-tree-supabase/runtime.json"),
        "utf8",
      ),
    );
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }

  if (!config.url || !config.serviceRoleKey) return null;
  if (
    client &&
    clientUrl === config.url &&
    clientServiceRoleKey === config.serviceRoleKey
  )
    return client;

  client = createClient(config.url, config.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  clientUrl = config.url;
  clientServiceRoleKey = config.serviceRoleKey;
  return client;
}
