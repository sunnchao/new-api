"use client";

import { useTranslation } from "react-i18next";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, Edit, RefreshCw, Crown, Search } from "lucide-react";
import { getAdminPlans, createPlan, updatePlan, patchPlanStatus, getAllUserSubscriptions } from "./api";
import type { SubscriptionPlan, PlanRecord, AdminUserSubscriptionOverview, AdminAllSubscriptionsParams } from "./types";

export default function AdminSubscriptionsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("plans");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Crown className="h-6 w-6 text-[var(--accent)]" />
          {t("subscriptions.title", { defaultValue: "Subscription Management" })}
        </h1>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="plans">{t("subscriptions.plans", { defaultValue: "Plans" })}</TabsTrigger>
          <TabsTrigger value="all">{t("subscriptions.allSubscriptions", { defaultValue: "All Subscriptions" })}</TabsTrigger>
        </TabsList>
        <TabsContent value="plans" className="mt-4"><PlansTab /></TabsContent>
        <TabsContent value="all" className="mt-4"><AllSubscriptionsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function PlansTab() {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<PlanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SubscriptionPlan | null>(null);
  const [form, setForm] = useState<Partial<SubscriptionPlan>>({});

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminPlans();
      if (res.data) setPlans(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: "", price_amount: 0, duration_unit: "month", duration_value: 1, quota_reset_period: "never", total_amount: 0, sort_order: 0, max_purchase_per_user: 0, enabled: true });
    setDialogOpen(true);
  };

  const openEdit = (plan: SubscriptionPlan) => {
    setEditing(plan);
    setForm({ ...plan });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editing) {
        await updatePlan(editing.id, { plan: form });
      } else {
        await createPlan({ plan: form });
      }
      toast.success(t("common.success", { defaultValue: "Success" }));
      setDialogOpen(false);
      fetchPlans();
    } catch {
      // error handled by api interceptor
    }
  };

  const handleToggle = async (plan: SubscriptionPlan) => {
    await patchPlanStatus(plan.id, !plan.enabled);
    fetchPlans();
  };

  const formatDuration = (plan: SubscriptionPlan) => `${plan.duration_value} ${plan.duration_unit}`;

  return (
    <>
      <div className="flex justify-end gap-2 mb-4">
        <Button variant="outline" size="sm" onClick={fetchPlans}><RefreshCw className="h-4 w-4 mr-2" />{t("common.refresh", { defaultValue: "Refresh" })}</Button>
        <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-2" />{t("common.create", { defaultValue: "Create" })}</Button>
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 rounded" />)}</div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>{t("common.name", { defaultValue: "Name" })}</TableHead>
                <TableHead>{t("subscriptions.price", { defaultValue: "Price" })}</TableHead>
                <TableHead>{t("subscriptions.duration", { defaultValue: "Duration" })}</TableHead>
                <TableHead>{t("subscriptions.quota", { defaultValue: "Quota" })}</TableHead>
                <TableHead>{t("common.status", { defaultValue: "Status" })}</TableHead>
                <TableHead className="text-right">{t("common.actions", { defaultValue: "Actions" })}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-[var(--muted)]">{t("common.noData", { defaultValue: "No data" })}</TableCell></TableRow>
              ) : plans.map(({ plan }) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-mono text-xs">{plan.id}</TableCell>
                  <TableCell className="font-medium">{plan.title}</TableCell>
                  <TableCell className="font-mono text-xs">{plan.price_amount} {plan.currency || "USD"}</TableCell>
                  <TableCell className="text-xs">{formatDuration(plan)}</TableCell>
                  <TableCell className="font-mono text-xs">{(plan.total_amount / 500000).toFixed(1)}$</TableCell>
                  <TableCell>
                    <Badge variant={plan.enabled ? "default" : "secondary"}>{plan.enabled ? t("common.enabled", { defaultValue: "Enabled" }) : t("common.disabled", { defaultValue: "Disabled" })}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(plan)}><Edit className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleToggle(plan)}>
                        <Badge variant={plan.enabled ? "destructive" : "default"} className="text-[9px] px-1">{plan.enabled ? "OFF" : "ON"}</Badge>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? t("subscriptions.editPlan", { defaultValue: "Edit Plan" }) : t("subscriptions.createPlan", { defaultValue: "Create Plan" })}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("subscriptions.planTitle", { defaultValue: "Title" })}</Label>
              <Input value={form.title || ""} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("subscriptions.price", { defaultValue: "Price" })}</Label>
                <Input type="number" value={form.price_amount ?? 0} onChange={(e) => setForm((f) => ({ ...f, price_amount: Number(e.target.value) }))} />
              </div>
              <div className="space-y-2">
                <Label>{t("subscriptions.totalQuota", { defaultValue: "Total Quota" })}</Label>
                <Input type="number" value={form.total_amount ?? 0} onChange={(e) => setForm((f) => ({ ...f, total_amount: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("subscriptions.durationValue", { defaultValue: "Duration Value" })}</Label>
                <Input type="number" value={form.duration_value ?? 1} onChange={(e) => setForm((f) => ({ ...f, duration_value: Number(e.target.value) }))} />
              </div>
              <div className="space-y-2">
                <Label>{t("subscriptions.durationUnit", { defaultValue: "Duration Unit" })}</Label>
                <Select value={form.duration_unit || "month"} onValueChange={(v) => setForm((f) => ({ ...f, duration_unit: v as SubscriptionPlan["duration_unit"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hour">Hour</SelectItem>
                    <SelectItem value="day">Day</SelectItem>
                    <SelectItem value="month">Month</SelectItem>
                    <SelectItem value="year">Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("subscriptions.resetPeriod", { defaultValue: "Quota Reset" })}</Label>
                <Select value={form.quota_reset_period || "never"} onValueChange={(v) => setForm((f) => ({ ...f, quota_reset_period: v as SubscriptionPlan["quota_reset_period"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("subscriptions.maxPurchase", { defaultValue: "Max Per User" })}</Label>
                <Input type="number" value={form.max_purchase_per_user ?? 0} onChange={(e) => setForm((f) => ({ ...f, max_purchase_per_user: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("subscriptions.upgradeGroup", { defaultValue: "Upgrade Group" })}</Label>
              <Input value={form.upgrade_group || ""} onChange={(e) => setForm((f) => ({ ...f, upgrade_group: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.enabled ?? true} onCheckedChange={(v) => setForm((f) => ({ ...f, enabled: v }))} />
              <Label>{t("common.enabled", { defaultValue: "Enabled" })}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t("common.cancel", { defaultValue: "Cancel" })}</Button>
            <Button onClick={handleSave}>{t("common.save", { defaultValue: "Save" })}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AllSubscriptionsTab() {
  const { t } = useTranslation();
  const [data, setData] = useState<AdminUserSubscriptionOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useState<AdminAllSubscriptionsParams>({ page: 1, page_size: 20 });
  const [total, setTotal] = useState(0);
  const [searchText, setSearchText] = useState("");

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllUserSubscriptions(params);
      const d = res.data;
      if (d) {
        setData(d.data || []);
        setTotal(d.total || 0);
      }
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleSearch = () => setParams((p) => ({ ...p, page: 1, username: searchText || undefined }));

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
          <Input placeholder={t("subscriptions.searchUser", { defaultValue: "Search username..." })} value={searchText} onChange={(e) => setSearchText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} className="pl-9" />
        </div>
        <Button variant="outline" size="sm" onClick={handleSearch}><Search className="h-4 w-4" /></Button>
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded" />)}</div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("subscriptions.user", { defaultValue: "User" })}</TableHead>
                <TableHead>{t("subscriptions.plan", { defaultValue: "Plan" })}</TableHead>
                <TableHead>{t("common.status", { defaultValue: "Status" })}</TableHead>
                <TableHead>{t("subscriptions.usage", { defaultValue: "Usage" })}</TableHead>
                <TableHead>{t("subscriptions.endTime", { defaultValue: "End Time" })}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-[var(--muted)]">{t("common.noData", { defaultValue: "No data" })}</TableCell></TableRow>
              ) : data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="font-medium text-sm">{row.user_display_name || row.username}</div>
                    <div className="text-xs text-[var(--muted)]">{row.user_email}</div>
                  </TableCell>
                  <TableCell className="text-sm">{row.plan_title}</TableCell>
                  <TableCell><Badge variant={row.status === "active" ? "default" : "secondary"}>{row.status}</Badge></TableCell>
                  <TableCell className="font-mono text-xs">{row.amount_used}/{row.amount_total}</TableCell>
                  <TableCell className="text-xs">{new Date(row.end_time * 1000).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {total > (params.page_size || 20) && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={(params.page || 1) <= 1} onClick={() => setParams((p) => ({ ...p, page: (p.page || 1) - 1 }))}>
            {t("common.prev", { defaultValue: "Previous" })}
          </Button>
          <span className="text-sm self-center text-[var(--muted)]">{params.page || 1} / {Math.ceil(total / (params.page_size || 20))}</span>
          <Button variant="outline" size="sm" disabled={(params.page || 1) >= Math.ceil(total / (params.page_size || 20))} onClick={() => setParams((p) => ({ ...p, page: (p.page || 1) + 1 }))}>
            {t("common.next", { defaultValue: "Next" })}
          </Button>
        </div>
      )}
    </div>
  );
}
