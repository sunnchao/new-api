"use client";

import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuthStore, ROLE } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  FileText,
  RefreshCw,
  Plus,
  Building2,
  UserCheck,
  Check,
  X,
  Send,
} from "lucide-react";

interface Invoice {
  id: number;
  status: number;
  amount: number;
  title: string;
  tax_number?: string;
  email?: string;
  address?: string;
  type?: number;
  created_time: number;
}

interface EligibleRecord {
  id: number;
  amount: number;
  created_time: number;
  type: string;
  title?: string;
}

interface InvoiceProfile {
  id: number;
  title: string;
  tax_number?: string;
  address?: string;
  phone?: string;
  email?: string;
  bank_name?: string;
  bank_account?: string;
}

const statusMap: Record<number, { label: string; variant: "default" | "success" | "destructive" | "warning" | "secondary" }> = {
  0: { label: "Pending", variant: "warning" },
  1: { label: "Approved", variant: "default" },
  2: { label: "Rejected", variant: "destructive" },
  3: { label: "Issued", variant: "success" },
};

export default function InvoicesPage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.auth.user);
  const isAdmin = (user?.role ?? 0) >= ROLE.ADMIN;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-[var(--accent)]" />
          <h1 className="text-2xl font-bold">{t("nav.invoices")}</h1>
        </div>
      </div>

      <Tabs defaultValue="self">
        <TabsList>
          <TabsTrigger value="self">My Invoices</TabsTrigger>
          <TabsTrigger value="new">Request Invoice</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          {isAdmin && <TabsTrigger value="admin">Admin</TabsTrigger>}
        </TabsList>

        <TabsContent value="self" className="mt-6">
          <MyInvoices />
        </TabsContent>
        <TabsContent value="new" className="mt-6">
          <NewInvoiceTab />
        </TabsContent>
        <TabsContent value="profile" className="mt-6">
          <ProfileTab />
        </TabsContent>
        {isAdmin && (
          <TabsContent value="admin" className="mt-6">
            <AdminTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function MyInvoices() {
  const { t } = useTranslation();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/invoice/self");
      if (res.data?.data) setInvoices(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const formatQuota = (q: number) => "$" + (q / 500000).toFixed(2);

  if (loading) {
    return <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded" />)}</div>;
  }

  return (
    <Card>
      <div className="flex items-center justify-end p-4 pb-0">
        <Button variant="outline" size="sm" onClick={fetch}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {t("common.refresh")}
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>{t("common.amount")}</TableHead>
            <TableHead>{t("common.status")}</TableHead>
            <TableHead>{t("common.date")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-12 text-[var(--muted)]">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                No invoices yet
              </TableCell>
            </TableRow>
          ) : (
            invoices.map((inv) => {
              const status = statusMap[inv.status] || { label: "Unknown", variant: "secondary" as const };
              return (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-xs">{inv.id}</TableCell>
                  <TableCell>{inv.title}</TableCell>
                  <TableCell className="font-mono text-xs">{formatQuota(inv.amount)}</TableCell>
                  <TableCell><Badge variant={status.variant}>{status.label}</Badge></TableCell>
                  <TableCell className="text-xs text-[var(--muted)]">
                    {inv.created_time ? new Date(inv.created_time * 1000).toLocaleDateString() : "—"}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </Card>
  );
}

function NewInvoiceTab() {
  const { t } = useTranslation();
  const [records, setRecords] = useState<EligibleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get("/api/invoice/eligible-records").then((res) => {
      if (res.data?.data) setRecords(res.data.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const totalAmount = records
    .filter((r) => selected.has(r.id))
    .reduce((sum, r) => sum + r.amount, 0);

  const handleSubmit = async () => {
    if (selected.size === 0) {
      toast.error("Select at least one record");
      return;
    }
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post("/api/invoice", {
        title: title.trim(),
        record_ids: Array.from(selected),
        amount: totalAmount,
      });
      if (res.data?.success) {
        toast.success("Invoice requested");
        setSelected(new Set());
        setTitle("");
      } else {
        toast.error(res.data?.message || t("common.error"));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("common.error"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Skeleton className="h-80 rounded-lg" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Request New Invoice</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {records.length === 0 ? (
          <div className="text-center py-12 text-[var(--muted)]">
            No eligible records for invoice
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label>Select records to include</Label>
              <div className="rounded-md border border-[var(--border)] max-h-64 overflow-auto">
                {records.map((r) => (
                  <label
                    key={r.id}
                    className="flex items-center gap-3 p-3 hover:bg-[var(--surface)]/50 cursor-pointer border-b border-[var(--border)] last:border-0"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(r.id)}
                      onChange={() => toggle(r.id)}
                      className="h-4 w-4 rounded accent-[var(--accent)]"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{r.title || r.type}</div>
                      <div className="text-xs text-[var(--muted)]">
                        {new Date(r.created_time * 1000).toLocaleDateString()}
                      </div>
                    </div>
                    <span className="font-mono text-sm">${(r.amount / 500000).toFixed(2)}</span>
                  </label>
                ))}
              </div>
              <p className="text-sm text-[var(--muted)]">
                Total: <span className="font-mono font-medium text-[var(--foreground)]">
                  ${(totalAmount / 500000).toFixed(2)}
                </span> ({selected.size} selected)
              </p>
            </div>
            <div className="space-y-2">
              <Label>Invoice Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Company Name Ltd." />
            </div>
            <Button onClick={handleSubmit} disabled={submitting || selected.size === 0}>
              <Send className="h-4 w-4 mr-2" />
              {submitting ? t("common.loading") : "Submit Request"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ProfileTab() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<InvoiceProfile>({
    id: 0,
    title: "",
    tax_number: "",
    address: "",
    phone: "",
    email: "",
    bank_name: "",
    bank_account: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/api/invoice/profile").then((res) => {
      if (res.data?.data) setProfile(res.data.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const update = (key: keyof InvoiceProfile, value: string) =>
    setProfile((p) => ({ ...p, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/api/invoice/profile", profile);
      toast.success(t("common.success"));
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Skeleton className="h-80 rounded-lg" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="h-4 w-4 text-[var(--accent)]" />
          Billing Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={profile.title} onChange={(e) => update("title", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Tax Number</Label>
            <Input value={profile.tax_number || ""} onChange={(e) => update("tax_number", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={profile.email || ""} onChange={(e) => update("email", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={profile.phone || ""} onChange={(e) => update("phone", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Bank Name</Label>
            <Input value={profile.bank_name || ""} onChange={(e) => update("bank_name", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Bank Account</Label>
            <Input value={profile.bank_account || ""} onChange={(e) => update("bank_account", e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Address</Label>
          <Textarea value={profile.address || ""} onChange={(e) => update("address", e.target.value)} rows={2} />
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? t("common.loading") : t("common.save")}
        </Button>
      </CardContent>
    </Card>
  );
}

function AdminTab() {
  const { t } = useTranslation();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectDialog, setRejectDialog] = useState<Invoice | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/invoice/admin/list");
      if (res.data?.data) setInvoices(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const handleApprove = async (id: number) => {
    try {
      await api.post(`/api/invoice/admin/${id}/approve`);
      toast.success(t("common.success"));
      fetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("common.error"));
    }
  };

  const handleIssue = async (id: number) => {
    try {
      await api.post(`/api/invoice/admin/${id}/issue`);
      toast.success(t("common.success"));
      fetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("common.error"));
    }
  };

  const handleReject = async () => {
    if (!rejectDialog) return;
    try {
      await api.post(`/api/invoice/admin/${rejectDialog.id}/reject`, { reason: rejectReason });
      toast.success(t("common.success"));
      setRejectDialog(null);
      setRejectReason("");
      fetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("common.error"));
    }
  };

  if (loading) return <Skeleton className="h-80 rounded-lg" />;

  return (
    <>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>{t("common.status")}</TableHead>
              <TableHead className="text-right">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-12 text-[var(--muted)]">No pending invoices</TableCell></TableRow>
            ) : (
              invoices.map((inv) => {
                const status = statusMap[inv.status] || { label: "Unknown", variant: "secondary" as const };
                return (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-xs">{inv.id}</TableCell>
                    <TableCell>{inv.title}</TableCell>
                    <TableCell className="font-mono text-xs">${(inv.amount / 500000).toFixed(2)}</TableCell>
                    <TableCell><Badge variant={status.variant}>{status.label}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {inv.status === 0 && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => handleApprove(inv.id)}>
                              <Check className="h-3 w-3 mr-1 text-[var(--success)]" />
                              Approve
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setRejectDialog(inv)}>
                              <X className="h-3 w-3 mr-1 text-[var(--destructive)]" />
                              Reject
                            </Button>
                          </>
                        )}
                        {inv.status === 1 && (
                          <Button variant="ghost" size="sm" onClick={() => handleIssue(inv.id)}>
                            <UserCheck className="h-3 w-3 mr-1" />
                            Issue
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!rejectDialog} onOpenChange={(o) => !o && setRejectDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Invoice</DialogTitle>
            <DialogDescription>Provide a reason for rejection</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(null)}>{t("common.cancel")}</Button>
            <Button onClick={handleReject}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
