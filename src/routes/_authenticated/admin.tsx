import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { adminStatusQuery } from "@/lib/admin-data";
import { claimFirstAdmin } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

const NAV = [
  { to: "/admin/products", label: "Products" },
  { to: "/admin/collections", label: "Collections" },
  { to: "/admin/stock", label: "Stock" },
  { to: "/admin/settings", label: "Settings" },
] as const;

function AdminLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const status = useQuery(adminStatusQuery);
  const [claiming, setClaiming] = useState(false);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  async function claim() {
    setClaiming(true);
    try {
      await claimFirstAdmin();
      toast.success("You are now the store administrator.");
      await queryClient.invalidateQueries();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not grant admin access");
    } finally {
      setClaiming(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/70 bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div>
            <p className="font-display text-2xl text-foreground">Store admin</p>
            <p className="text-[10px] tracking-luxe text-muted-foreground">
              Products · Collections · Stock · Settings
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs tracking-luxe">
            <Link to="/" className="text-muted-foreground hover:text-primary">
              View store
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="rounded-sm border border-input px-4 py-2 text-muted-foreground hover:text-destructive"
            >
              Log out
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-3 text-xs tracking-luxe sm:px-6">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="whitespace-nowrap rounded-sm px-4 py-2 text-muted-foreground hover:bg-accent"
              activeProps={{ className: "bg-primary text-primary-foreground" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {status.data && !status.data.isAdmin ? (
          <div className="mb-8 rounded-sm border border-primary/40 bg-card p-5">
            <p className="font-display text-xl text-foreground">Admin access required</p>
            <p className="mt-2 text-sm text-muted-foreground">
              This account is signed in but is not yet an administrator. If you are the store
              owner and no administrator exists yet, claim access below.
            </p>
            <button
              type="button"
              onClick={claim}
              disabled={claiming}
              className="mt-4 rounded-sm bg-primary px-5 py-3 text-xs tracking-luxe text-primary-foreground disabled:opacity-60"
            >
              {claiming ? "Please wait…" : "Make me the administrator"}
            </button>
          </div>
        ) : null}
        <Outlet />
      </main>
    </div>
  );
}
