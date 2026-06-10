"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import "../i18n";
import { Shield, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getClaudeCodeAdminSubscriptions,
  getClaudeCodePlans,
  grantClaudeCodeSubscription,
  cancelClaudeCodeSubscription,
} from "../api";
import type { VibeCodingPlan, VibeCodingSubscription } from "../api";

export function ClaudeCodeAdmin() {
  const { t } = useTranslation();
  const [subscriptions, setSubscriptions] = useState<VibeCodingSubscription[]>([]);
  const [plans, setPlans] = useState<VibeCodingPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [showGrantDialog, setShowGrantDialog] = useState(false);
  const [grantForm, setGrantForm] = useState({
    user_id: "",
    plan_id: "",
  });

  const loadSubscriptions = async () => {
    setLoading(true);
    try {
      const res = await getClaudeCodeAdminSubscriptions();
      if (res.success) {
        setSubscriptions(res.data || []);
      }
    } catch {
      toast.error(t("Failed to load subscriptions"));
    } finally {
      setLoading(false);
    }
  };

  const loadPlans = async () => {
    try {
      const res = await getClaudeCodePlans();
      if (res.success) {
        const nextPlans = res.data || [];
        setPlans(nextPlans);
        setGrantForm((form) => ({
          ...form,
          plan_id: form.plan_id || (nextPlans[0]?.id ? String(nextPlans[0].id) : ""),
        }));
      }
    } catch {
      toast.error(t("Failed to load plans"));
    }
  };

  const handleGrant = async () => {
    try {
      const res = await grantClaudeCodeSubscription({
        user_id: Number(grantForm.user_id),
        plan_id: Number(grantForm.plan_id),
      });
      if (res.success) {
        toast.success(t("Subscription granted successfully"));
        setShowGrantDialog(false);
        loadSubscriptions();
      } else {
        toast.error(res.message || t("Failed to grant subscription"));
      }
    } catch {
      toast.error(t("Failed to grant subscription"));
    }
  };

  const handleCancel = async (id: number) => {
    try {
      const res = await cancelClaudeCodeSubscription(id);
      if (res.success) {
        toast.success(t("Subscription cancelled successfully"));
        loadSubscriptions();
      } else {
        toast.error(res.message || t("Failed to cancel subscription"));
      }
    } catch {
      toast.error(t("Failed to cancel subscription"));
    }
  };

  useEffect(() => {
    loadSubscriptions();
    loadPlans();
  }, []);

  const statusColor = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "expired":
        return "secondary";
      case "cancelled":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
        <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <span className="text-sm text-blue-800 dark:text-blue-200">
          {t("Admin only: Manage all users' Claude Code subscriptions")}
        </span>
      </div>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-1 rounded-full bg-gradient-to-b from-blue-500 to-purple-600" />
            <CardTitle>{t("Claude Code Subscription Management")}</CardTitle>
          </div>
          <Button onClick={() => setShowGrantDialog(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            {t("Grant Subscription")}
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("User ID")}</TableHead>
                <TableHead>{t("Username")}</TableHead>
                <TableHead>{t("Plan Type")}</TableHead>
                <TableHead>{t("Status")}</TableHead>
                <TableHead>{t("Start Time")}</TableHead>
                <TableHead>{t("End Time")}</TableHead>
                <TableHead>{t("Actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-[var(--muted)]">
                    {t("Loading...")}
                  </TableCell>
                </TableRow>
              ) : subscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-[var(--muted)]">
                    {t("No subscriptions found")}
                  </TableCell>
                </TableRow>
              ) : (
                subscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>{sub.user_id}</TableCell>
                    <TableCell>{sub.username}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{sub.plan_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColor(sub.status)}>{sub.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(sub.start_time * 1000).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {new Date(sub.end_time * 1000).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={sub.status !== "active"}
                        onClick={() => handleCancel(sub.id)}
                      >
                        {t("Cancel")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Grant Dialog */}
      <Dialog open={showGrantDialog} onOpenChange={setShowGrantDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Grant Subscription")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("User ID")}</Label>
              <Input
                type="number"
                placeholder={t("Enter user ID")}
                value={grantForm.user_id}
                onChange={(e) =>
                  setGrantForm((f) => ({ ...f, user_id: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t("Plan")}</Label>
              <Select
                value={grantForm.plan_id}
                onValueChange={(v) =>
                  setGrantForm((f) => ({ ...f, plan_id: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("Select a plan")} />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={String(plan.id)}>
                      {plan.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGrantDialog(false)}>
              {t("Cancel")}
            </Button>
            <Button
              disabled={!grantForm.user_id || !grantForm.plan_id}
              onClick={handleGrant}
            >
              {t("Confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
