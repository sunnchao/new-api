"use client";

import { useTranslation } from "react-i18next";
import { useEffect, useState, useCallback } from "react";
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
  Send,
  Building2,
  Check,
  X,
  UserCheck,
} from "lucide-react";
import {
  approveInvoice,
  cancelInvoice,
  createInvoice,
  getAdminInvoices,
  getEligibleRecords,
  getInvoiceProfiles,
  getSelfInvoices,
  issueInvoice,
  rejectInvoice,
  updateInvoiceProfile,
} from "./api";
import type {
  InvoiceableRecord,
  InvoiceProfile,
  InvoiceRequestRecord,
  InvoiceStatus,
} from "./types";

const statusVariant: Record<InvoiceStatus, "default" | "success" | "destructive" | "warning" | "secondary"> = {
  pending: "warning",
  approved: "default",
  rejected: "destructive",
  issued: "success",
  cancelled: "secondary",
};

function formatMoney(amount: number) {
  return "¥" + (amount / 100).toFixed(2);
}

function formatDate(ts: number) {
  if (!ts) return "—";
  return new Date(ts * 1000).toLocaleDateString();
}

export default function InvoicesPage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.auth.user);
  const isAdmin = (user?.role ?? 0) >= ROLE.ADMIN;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="h-6 w-6 text-[var(--accent)]" />
        <h1 className="text-2xl font-semibold tracking-tight">{t("Invoices")}</h1>
      </div>

      <Tabs defaultValue="self">
        <TabsList>
          <TabsTrigger value="self">{t("My Invoices")}</TabsTrigger>
          <TabsTrigger value="new">{t("Request Invoice")}</TabsTrigger>
          <TabsTrigger value="profile">{t("Profile")}</TabsTrigger>
          {isAdmin && <TabsTrigger value="admin">{t("Admin")}</TabsTrigger>}
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
  const [invoices, setInvoices] = useState<InvoiceRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSelfInvoices({ p: 1, page_size: 50 });
      if (res.success && res.data) setInvoices(res.data.items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleCancel = async (id: number) => {
    const res = await cancelInvoice(id);
    if (res.success) {
      toast.success(t("Invoice cancelled"));
      fetch();
    } else {
      toast.error(res.message || t("Failed to cancel"));
    }
  };

  if (loading) {
    return <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded" />)}</div>;
  }

  return (
    <Card>
      <div className="flex items-center justify-end p-4 pb-0">
        <Button variant="outline" size="sm" onClick={fetch}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {t("Refresh")}
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>{t("Title")}</TableHead>
            <TableHead>{t("Amount")}</TableHead>
            <TableHead>{t("Status")}</TableHead>
            <TableHead>{t("Date")}</TableHead>
            <TableHead className="text-right">{t("Actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-12 text-[var(--muted)]">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                {t("No invoices yet")}
              </TableCell>
            </TableRow>
          ) : (
            invoices.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell className="font-mono text-xs">{inv.id}</TableCell>
                <TableCell>{inv.title}</TableCell>
                <TableCell className="font-mono text-xs">{formatMoney(inv.amount)}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[inv.status] || "secondary"}>{inv.status}</Badge>
                </TableCell>
                <TableCell className="text-xs text-[var(--muted)]">{formatDate(inv.created_at)}</TableCell>
                <TableCell className="text-right">
                  {inv.status === "pending" && (
                    <Button variant="ghost" size="sm" onClick={() => handleCancel(inv.id)}>
                      <X className="h-3 w-3 mr-1" />{t("Cancel")}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );
}

function NewInvoiceTab() {
  const { t } = useTranslation();
  const [records, setRecords] = useState<InvoiceableRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getEligibleRecords({ p: 1, page_size: 50 })
      .then((res) => {
        if (res.success && res.data) setRecords(res.data.items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggle = (record: InvoiceableRecord) => {
    const key = `${record.source_type}:${record.source_id}`;
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const selectedRecords = records.filter(
    (r) => selected.has(`${r.source_type}:${r.source_id}`),
  );
  const totalAmount = selectedRecords.reduce((sum, r) => sum + r.money, 0);

  const handleSubmit = async () => {
    if (selected.size === 0) {
      toast.error(t("Select at least one record"));
      return;
    }
    if (!title.trim()) {
      toast.error(t("Title is required"));
      return;
    }
    setSubmitting(true);
    try {
      const res = await createInvoice({
        items: selectedRecords.map((r) => ({
          source_type: r.source_type,
          source_id: r.source_id,
        })),
        invoice_type: "company",
        title: title.trim(),
      });
      if (res.success) {
        toast.success(t("Invoice requested"));
        setSelected(new Set());
        setTitle("");
      } else {
        toast.error(res.message || t("Failed to submit"));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("Failed to submit");
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Skeleton className="h-80 rounded-lg" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("Request New Invoice")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {records.length === 0 ? (
          <div className="text-center py-12 text-[var(--muted)]">
            {t("No eligible records for invoice")}
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label>{t("Select records to include")}</Label>
              <div className="rounded-md border border-[var(--border)] max-h-64 overflow-auto">
                {records.map((r) => {
                  const key = `${r.source_type}:${r.source_id}`;
                  return (
                    <label
                      key={key}
                      className="flex items-center gap-3 p-3 hover:bg-[var(--surface)]/50 cursor-pointer border-b border-[var(--border)] last:border-0"
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(key)}
                        onChange={() => toggle(r)}
                        className="h-4 w-4 rounded accent-[var(--accent)]"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{r.source_type}</div>
                        <div className="text-xs text-[var(--muted)]">{formatDate(r.complete_time)}</div>
                      </div>
                      <span className="font-mono text-sm">{formatMoney(r.money)}</span>
                    </label>
                  );
                })}
              </div>
              <p className="text-sm text-[var(--muted)]">
                {t("Total")}: <span className="font-mono font-medium text-[var(--foreground)]">
                  {formatMoney(totalAmount)}
                </span> ({selected.size} {t("selected")})
              </p>
            </div>
            <div className="space-y-2">
              <Label>{t("Invoice Title")}</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("Company Name Ltd.")} />
            </div>
            <Button onClick={handleSubmit} disabled={submitting || selected.size === 0}>
              <Send className="h-4 w-4 mr-2" />
              {submitting ? t("Submitting...") : t("Submit Request")}
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
    invoice_type: "company",
    title: "",
    tax_no: "",
    email: "",
    phone: "",
    bank_name: "",
    bank_account: "",
    registered_address: "",
    registered_phone: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getInvoiceProfiles()
      .then((res) => {
        if (res.success && res.data?.company) {
          setProfile(res.data.company);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const update = (key: keyof InvoiceProfile, value: string) =>
    setProfile((p) => ({ ...p, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateInvoiceProfile(profile);
      if (res.success) toast.success(t("Profile saved"));
      else toast.error(res.message || t("Failed to save"));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("Failed to save");
      toast.error(msg);
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
          {t("Billing Profile")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t("Title")}</Label>
            <Input value={profile.title} onChange={(e) => update("title", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t("Tax Number")}</Label>
            <Input value={profile.tax_no} onChange={(e) => update("tax_no", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t("Email")}</Label>
            <Input value={profile.email} onChange={(e) => update("email", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t("Phone")}</Label>
            <Input value={profile.phone} onChange={(e) => update("phone", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t("Bank Name")}</Label>
            <Input value={profile.bank_name} onChange={(e) => update("bank_name", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t("Bank Account")}</Label>
            <Input value={profile.bank_account} onChange={(e) => update("bank_account", e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>{t("Registered Address")}</Label>
          <Textarea value={profile.registered_address} onChange={(e) => update("registered_address", e.target.value)} rows={2} />
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? t("Saving...") : t("Save")}
        </Button>
      </CardContent>
    </Card>
  );
}

function AdminTab() {
  const { t } = useTranslation();
  const [invoices, setInvoices] = useState<InvoiceRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectDialog, setRejectDialog] = useState<InvoiceRequestRecord | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [issueDialog, setIssueDialog] = useState<InvoiceRequestRecord | null>(null);
  const [issueNo, setIssueNo] = useState("");
  const [issueUrl, setIssueUrl] = useState("");

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminInvoices({ p: 1, page_size: 50 });
      if (res.success && res.data) setInvoices(res.data.items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleApprove = async (id: number) => {
    const res = await approveInvoice(id);
    if (res.success) { toast.success(t("Approved")); fetch(); }
    else toast.error(res.message || t("Failed"));
  };

  const handleReject = async () => {
    if (!rejectDialog) return;
    const res = await rejectInvoice(rejectDialog.id, rejectReason);
    if (res.success) { toast.success(t("Rejected")); setRejectDialog(null); setRejectReason(""); fetch(); }
    else toast.error(res.message || t("Failed"));
  };

  const handleIssue = async () => {
    if (!issueDialog || !issueNo.trim()) return;
    const res = await issueInvoice(issueDialog.id, { invoice_no: issueNo.trim(), invoice_url: issueUrl.trim() || undefined });
    if (res.success) { toast.success(t("Issued")); setIssueDialog(null); setIssueNo(""); setIssueUrl(""); fetch(); }
    else toast.error(res.message || t("Failed"));
  };

  if (loading) return <Skeleton className="h-80 rounded-lg" />;

  return (
    <>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>{t("User")}</TableHead>
              <TableHead>{t("Title")}</TableHead>
              <TableHead>{t("Amount")}</TableHead>
              <TableHead>{t("Status")}</TableHead>
              <TableHead className="text-right">{t("Actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-12 text-[var(--muted)]">{t("No invoices")}</TableCell></TableRow>
            ) : (
              invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-xs">{inv.id}</TableCell>
                  <TableCell className="text-sm">{inv.username}</TableCell>
                  <TableCell>{inv.title}</TableCell>
                  <TableCell className="font-mono text-xs">{formatMoney(inv.amount)}</TableCell>
                  <TableCell><Badge variant={statusVariant[inv.status] || "secondary"}>{inv.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {inv.status === "pending" && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => handleApprove(inv.id)}>
                            <Check className="h-3 w-3 mr-1" />{t("Approve")}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setRejectDialog(inv)}>
                            <X className="h-3 w-3 mr-1" />{t("Reject")}
                          </Button>
                        </>
                      )}
                      {inv.status === "approved" && (
                        <Button variant="ghost" size="sm" onClick={() => setIssueDialog(inv)}>
                          <UserCheck className="h-3 w-3 mr-1" />{t("Issue")}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!rejectDialog} onOpenChange={(o) => !o && setRejectDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Reject Invoice")}</DialogTitle>
            <DialogDescription>{t("Provide a reason for rejection")}</DialogDescription>
          </DialogHeader>
          <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(null)}>{t("Cancel")}</Button>
            <Button onClick={handleReject}>{t("Reject")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!issueDialog} onOpenChange={(o) => !o && setIssueDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Issue Invoice")}</DialogTitle>
            <DialogDescription>{t("Enter invoice number and optional URL")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>{t("Invoice Number")}</Label>
              <Input value={issueNo} onChange={(e) => setIssueNo(e.target.value)} placeholder="INV-2024-001" />
            </div>
            <div className="space-y-2">
              <Label>{t("Invoice URL (optional)")}</Label>
              <Input value={issueUrl} onChange={(e) => setIssueUrl(e.target.value)} placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIssueDialog(null)}>{t("Cancel")}</Button>
            <Button onClick={handleIssue} disabled={!issueNo.trim()}>{t("Issue")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
