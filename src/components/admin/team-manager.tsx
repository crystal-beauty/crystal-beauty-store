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
  OWNER: { icon: ShieldCheck, label: "Propriétaire", desc: "Contrôle total, y compris équipe et suppressions" },
  ADMIN: { icon: Shield, label: "Admin", desc: "Tout sauf la gestion de l'équipe" },
  STAFF: { icon: ShieldAlert, label: "Personnel", desc: "Produits et commandes uniquement, sans suppression" },
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
      return toast.error("Nom, email et mot de passe de 6 caractères minimum sont obligatoires");
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "Impossible d'ajouter le membre");
      toast.success(`${data.member.name} a rejoint l'équipe`);
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
    if (!res.ok) return toast.error(data.error || "Impossible de mettre à jour le rôle");
    toast.success(`${member.name} est maintenant ${ROLE_INFO[role]?.label || role}`);
    load();
  }

  async function toggleActive(member: TeamRow) {
    const res = await fetch(`/api/admin/team/${member.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !member.active }),
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error || "Impossible de mettre à jour");
    toast.success(member.active ? `${member.name} désactivé` : `${member.name} activé`);
    load();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const res = await fetch(`/api/admin/team/${deleteTarget.id}`, { method: "DELETE" });
    const data = await res.json();
    if (res.ok) {
      toast.success("Membre retiré de l'équipe");
      load();
    } else {
      toast.error(data.error || "Impossible de supprimer");
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
          <h1 className="font-display text-2xl lg:text-3xl font-semibold text-[var(--primary)]">Équipe</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Invitez votre personnel et contrôlez précisément ce que chacun peut faire.
          </p>
        </div>
        <button
          onClick={() => setDialogOpen(true)}
          className="inline-flex items-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-[var(--primary)]/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> Ajouter un membre
        </button>
      </div>

      {/* Role legend */}
      <div className="grid sm:grid-cols-3 gap-3">
        {Object.entries(ROLE_INFO).map(([role, info]) => (
          <div key={role} className={cn(
            "rounded-2xl border p-4",
            role === "OWNER" ? "bg-[var(--brand)]/5 border-[var(--brand)]/30" : "bg-white border-border"
          )}>
            <info.icon className={cn("h-5 w-5 mb-2", role === "OWNER" ? "text-[var(--brand)]" : "text-[var(--primary)]")} />
            <p className="text-sm font-semibold text-[var(--primary)]">{info.label}</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{info.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-luxe overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Chargement de l'équipe…</div>
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
                    {member.id === currentUserId && <span className="text-xs text-muted-foreground font-normal"> (vous)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">{member.email}</p>
                  {member.lastLoginAt && (
                    <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                      Dernière connexion : {new Date(member.lastLoginAt).toLocaleDateString("fr-FR")}
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
                    member.active ? "bg-[#e8ecf5] text-[#0a1f44] border-[#d7deea]" : "bg-gray-100 text-gray-500 border-gray-200"
                  )}
                >
                  {member.active ? "Actif" : "Inactif"}
                </button>
                {isOwner && member.id !== currentUserId && (
                  <button
                    onClick={() => setDeleteTarget(member)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                    title="Retirer de l'équipe"
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
                <Users className="h-5 w-5 text-[var(--brand)]" /> Ajouter un membre
              </h2>
              <button onClick={() => setDialogOpen(false)} className="p-2 text-muted-foreground hover:text-[var(--primary)]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Nom complet *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="Sara Mohamed" />
              </div>
              <div>
                <label className={labelCls}>Email *</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} placeholder="sara@boutique.com" />
              </div>
              <div>
                <label className={labelCls}>Mot de passe temporaire * (min. 6 caractères)</label>
                <input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputCls} placeholder="à communiquer en privé" />
              </div>
              <div>
                <label className={labelCls}>Rôle</label>
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
                className="w-full bg-[var(--brand)] text-white font-semibold py-3 rounded-xl hover:bg-[#16305c] transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Ajouter à l'équipe
              </button>
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer {deleteTarget?.name} de l'équipe ?</AlertDialogTitle>
            <AlertDialogDescription>Cette personne perdra immédiatement l'accès au tableau de bord. Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); confirmDelete(); }} className="bg-destructive text-white hover:bg-destructive/90">
              Retirer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
