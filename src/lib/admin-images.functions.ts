import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Ctx = { supabase: any; userId: string };

async function assertAdmin(context: Ctx) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("You do not have admin access to this store.");
}

export type UploadInput = {
  fileName: string;
  contentType: string;
  dataBase64: string;
};

/** Stores an uploaded product photo and returns the URL to display it. */
export const uploadProductImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: UploadInput) => input)
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await assertAdmin(ctx);

    const safeName = data.fileName.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
    const path = `${Date.now()}-${safeName}`;
    const binary = Uint8Array.from(atob(data.dataBase64), (c) => c.charCodeAt(0));

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.storage
      .from("product-images")
      .upload(path, binary, { contentType: data.contentType, upsert: false });
    if (error) throw new Error(error.message);

    return { url: `/api/public/product-image/${path}` };
  });
