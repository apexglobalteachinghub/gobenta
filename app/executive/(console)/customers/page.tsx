"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";

type ExecUser = {
  id: string;
  email: string | undefined;
  name: string;
  role: string;
  banned_at: string | null;
  is_executive: boolean;
  last_sign_in_at: string | undefined;
  created_at: string;
};

export default function ExecutiveCustomersPage() {
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [users, setUsers] = useState<ExecUser[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const perPage = 30;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/executive/users?page=${page}&perPage=${perPage}`,
        { credentials: "same-origin" }
      );
      const body = (await res.json()) as {
        users?: ExecUser[];
        total?: number;
        error?: string;
      };
      if (!res.ok) {
        toast.error(body.error ?? "Could not load users");
        setUsers([]);
        return;
      }
      setUsers(body.users ?? []);
      setTotal(body.total ?? 0);
    } catch {
      toast.error("Network error loading users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  async function setBanned(id: string, banned: boolean) {
    const res = await fetch(`/api/executive/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ banned }),
    });
    const body = (await res.json()) as { error?: string };
    if (!res.ok) {
      toast.error(body.error ?? "Update failed");
      return;
    }
    toast.success(banned ? "User suspended" : "Suspension cleared");
    void load();
  }

  async function removeUser(id: string) {
    if (
      !confirm(
        "Permanently delete this account and related data? This cannot be undone."
      )
    ) {
      return;
    }
    const res = await fetch(`/api/executive/users/${id}`, {
      method: "DELETE",
      credentials: "same-origin",
    });
    const body = (await res.json()) as { error?: string };
    if (!res.ok) {
      toast.error(body.error ?? "Delete failed");
      return;
    }
    toast.success("User deleted");
    void load();
  }

  const pages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
            Accounts
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Customers
          </h2>
          <p className="mt-1 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
            Create accounts, suspend access, or remove non-executive members.
            Requires{" "}
            <code className="rounded bg-zinc-200 px-1 text-xs dark:bg-zinc-800">
              SUPABASE_SERVICE_ROLE_KEY
            </code>{" "}
            on the server.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
        >
          Add customer
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-sm dark:border-zinc-800/90 dark:bg-zinc-900/80">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50/90 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-zinc-500">
                    Loading…
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-zinc-500">
                    No users on this page.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="text-zinc-800 dark:text-zinc-200">
                    <td className="px-4 py-3">
                      <div className="font-medium">{u.name || "—"}</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        {u.email ?? u.id}
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize">{u.role}</td>
                    <td className="px-4 py-3">
                      {u.is_executive ? (
                        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-800 dark:bg-violet-950/60 dark:text-violet-200">
                          Executive
                        </span>
                      ) : u.banned_at ? (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-950/60 dark:text-red-200">
                          Suspended
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        {!u.is_executive ? (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                void setBanned(u.id, !u.banned_at)
                              }
                              className={cn(
                                "rounded-full px-3 py-1 text-xs font-semibold transition",
                                u.banned_at
                                  ? "bg-emerald-100 text-emerald-900 hover:bg-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-100"
                                  : "bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-950/50 dark:text-amber-100"
                              )}
                            >
                              {u.banned_at ? "Unban" : "Ban"}
                            </button>
                            <button
                              type="button"
                              onClick={() => void removeUser(u.id)}
                              className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-900 transition hover:bg-red-200 dark:bg-red-950/50 dark:text-red-100"
                            >
                              Delete
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-zinc-400">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3 text-xs dark:border-zinc-800">
          <span className="text-zinc-500">
            Page {page} of {pages} · {total.toLocaleString("en-PH")} accounts
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-full border border-zinc-200 px-3 py-1 font-medium text-zinc-700 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= pages || loading}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-full border border-zinc-200 px-3 py-1 font-medium text-zinc-700 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {showAdd ? (
        <AddCustomerModal
          onClose={() => setShowAdd(false)}
          onCreated={() => {
            setShowAdd(false);
            setPage(1);
            void load();
          }}
        />
      ) : null}
    </div>
  );
}

function AddCustomerModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    const name = String(fd.get("name") ?? "").trim();
    const role = String(fd.get("role") ?? "buyer");
    setPending(true);
    const res = await fetch("/api/executive/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ email, password, name, role }),
    });
    const body = (await res.json()) as { error?: string };
    setPending(false);
    if (!res.ok) {
      toast.error(body.error ?? "Could not create user");
      return;
    }
    toast.success("Customer created");
    onCreated();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div
        className="absolute inset-0"
        role="presentation"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
      />
      <form
        onSubmit={(e) => void onSubmit(e)}
        className="relative z-10 w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
      >
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          New customer
        </h3>
        <p className="mt-1 text-sm text-zinc-500">
          Creates a confirmed email/password auth user and profile row.
        </p>
        <div className="mt-4 space-y-3">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Email
            <input
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Password
            <input
              name="password"
              type="password"
              required
              minLength={6}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Display name
            <input
              name="name"
              type="text"
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Role
            <select
              name="role"
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            >
              <option value="buyer">Buyer</option>
              <option value="seller">Seller</option>
            </select>
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 dark:bg-white dark:text-zinc-900"
          >
            {pending ? "Creating…" : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}
