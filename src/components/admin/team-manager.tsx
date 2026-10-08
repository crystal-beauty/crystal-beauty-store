"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Users, Loader2, X, ShieldCheck, ShieldAlert, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TeamRow {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

const ROLE_INFO: Record<string, { icon: typeof Shield; label: string; desc: string }> = {
  OWNER: { icon: ShieldCheck, label: "Owner", desc: "Full control, including team & deletions" },
  ADMIN: { icon: Shield, label: "Admin", desc: "Everything except team management" },
  STAFF: { icon: ShieldAlert, label: "Staff", desc: "Products & orders only, no deletions" },
};

export default function TeamManager({ currentUserId, isOwner }: { currentUserId: string; isOwner: boolean }) {
  const [team, setTeam] = useState<TeamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "STAFF" });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TeamRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/team");
      const data = await res.json();
      setTeam(data.team || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function addMember() {
    if (!form.name.trim() || !form.email.trim() || form.password.length < 6) {
      return toast.error("Name, email and a password of 6+ characters are required");
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "Could not add the member");
      toast.success(`${data.member.name} joined the team`);
      setDialogOpen(false);
      setForm({ name: "", email: "", password: "", role: "STAFF" });
      load();
    } finally {
      setSaving(false);
    }
  }

  async function changeRole(member: TeamRow, role: string) {
    const res = await fetch(`/api/admin/team/${member.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error || "Could not update the role");
    toast.success(`${member.name} is now ${ROLE_INFO[role]?.label || role}`);
    load();
  }

  async function toggleActive(member: TeamRow) {
    const res = await fetch(`/api/admin/team/${member.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !member.active }),
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error || "Could not update");
    toast.success(member.active ? `${member.name} deactivated` : `${member.name} activated`);
    load();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const res = await fetch(`/api/admin/team/${deleteTarget.id}`, { method: "DELETE" });
    const data = await res.json();
    if (res.ok) {
      toast.success("Team member removed");
      load();
    } else {
      toast.error(data.error || "Could not delete");
    }
    setDeleteTarget(null);
  }

  const inputCls =
    "w-full bg-white border border-input rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25";
  const labelCls = "block text-sm font-medium text-[var(--primary)] mb-1.5";

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-semibold text-[var(--primary)]">Team</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Invite your staff and control exactly what each person can do.
          </p>
        </div>
        <button
          onClick={() => setDialogOpen(true)}
          className="inline-flex items-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-[var(--primary)]/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Team Member
        </button>
      </div>

      {/* Role legend */}
      <div className="grid sm:grid-cols-3 gap-3">
        {Object.entries(ROLE_INFO).map(([role, info]) => (
          <div key={role} className={cn(
            "rounded-2xl border p-4",
            role === "OWNER" ? "bg-[var(--gold)]/5 border-[var(--gold)]/30" : "bg-white border-border"
          )}>
            <info.icon className={cn("h-5 w-5 mb-2", role === "OWNER" ? "text-[var(--gold)]" : "text-[var(--primary)]")} />
            <p className="text-sm font-semibold text-[var(--primary)]">{info.label}</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{info.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-luxe overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Loading team…</div>
        ) : (
          <div className="divide-y divide-border">
            {team.map((member) => (
              <div key={member.id} className="flex items-center gap-4 px-5 py-4 flex-wrap">
                <div className="h-10 w-10 rounded-full bg-[var(--primary)]/8 text-[var(--primary)] flex items-center justify-center text-sm font-bold shrink-0">
                  {member.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                </div>
                <div className="flex-1 min-w-[180px]">
                  <p className="font-medium text-[var(--primary)]">
                    {member.name}
                    {member.id === currentUserId && <span className="text-xs text-muted-foreground font-normal"> (you)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">{member.email}</p>
                  {member.lastLoginAt && (
                    <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                      Last login: {new Date(member.lastLoginAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <select
                  value={member.role}
                  onChange={(e) => changeRole(member, e.target.value)}
                  disabled={!isOwner || member.id === currentUserId}
                  className="bg-white border border-input rounded-lg px-3 py-2 text-xs font-medium text-[var(--primary)] focus:outline-none disabled:opacity-60"
                >
                  {Object.keys(ROLE_INFO).map((r) => (
                    <option key={r} value={r}>{ROLE_INFO[r].label}</option>
                  ))}
                </select>
                <button
                  onClick={() => toggleActive(member)}
                  disabled={member.id === currentUserId}
                  className={cn(
                    "text-[11px] font-semibold px-2.5 py-1 rounded-full border shrink-0 disabled:opacity-40",
                    member.active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-500 border-gray-200"
                  )}
                >
                  {member.active ? "Active" : "Inactive"}
                </button>
                {isOwner && member.id !== currentUserId && (
                  <button
                    onClick={() => setDeleteTarget(member)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                    title="Remove from team"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setDialogOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-luxe-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg font-semibold text-[var(--primary)] flex items-center gap-2">
                <Users className="h-5 w-5 text-[var(--gold)]" /> Add Team Member
              </h2>
              <button onClick={() => setDialogOpen(false)} className="p-2 text-muted-foreground hover:text-[var(--primary)]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Full Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="Sara Mohamed" />
              </div>
              <div>
                <label className={labelCls}>Email *</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} placeholder="sara@store.com" />
              </div>
              <div>
                <label className={labelCls}>Temporary Password * (min 6 chars)</label>
                <input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputCls} placeholder="share it privately" />
              </div>
              <div>
                <label className={labelCls}>Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={inputCls}>
                  {Object.entries(ROLE_INFO)
                    .filter(([role]) => role !== "OWNER" || isOwner)
                    .map(([role, info]) => (
                      <option key={role} value={role}>{info.label} — {info.desc}</option>
                    ))}
                </select>
              </div>
              <button
                onClick={addMember}
                disabled={saving}
                className="w-full bg-[var(--gold)] text-white font-semibold py-3 rounded-xl hover:bg-[#b8903a] transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Add to Team
              </button>
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deleteTarget?.name} from the team?</AlertDialogTitle>
            <AlertDialogDescription>They will immediately lose access to the dashboard. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); confirmDelete(); }} className="bg-destructive text-white hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
