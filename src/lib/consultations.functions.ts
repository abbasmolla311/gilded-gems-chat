import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Consultation = {
  id: string;
  appointment_type: string;
  preferred_date: string;
  preferred_time: string;
  full_name: string;
  phone: string;
  email: string;
  notes: string;
  status: string;
  created_at: string;
};

export type BookingInput = {
  appointment_type: string;
  preferred_date: string;
  preferred_time: string;
  full_name: string;
  phone: string;
  email: string;
  notes: string;
};

function anonClient() {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

/** Records a consultation request from a shopper. */
export const bookConsultation = createServerFn({ method: "POST" })
  .inputValidator((input: BookingInput) => {
    const required: (keyof BookingInput)[] = [
      "appointment_type",
      "preferred_date",
      "preferred_time",
      "full_name",
      "phone",
    ];
    for (const field of required) {
      if (!String(input[field] ?? "").trim()) throw new Error("Please complete every required field.");
    }
    return {
      appointment_type: input.appointment_type.slice(0, 80),
      preferred_date: input.preferred_date.slice(0, 20),
      preferred_time: input.preferred_time.slice(0, 40),
      full_name: input.full_name.slice(0, 120),
      phone: input.phone.slice(0, 40),
      email: (input.email ?? "").slice(0, 160),
      notes: (input.notes ?? "").slice(0, 1000),
    };
  })
  .handler(async ({ data }) => {
    const { error } = await anonClient().from("consultations").insert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

type Ctx = { supabase: any; userId: string };

export const listConsultations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as unknown as Ctx;
    const { data, error } = await ctx.supabase
      .from("consultations")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Consultation[];
  });

export const setConsultationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; status: string }) => input)
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    const { error } = await ctx.supabase
      .from("consultations")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const consultationsQuery = queryOptions({
  queryKey: ["consultations"],
  queryFn: () => listConsultations(),
  retry: false,
});
