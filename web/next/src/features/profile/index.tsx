"use client";

import { useTranslation } from "react-i18next";
import { useState } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  User,
  Shield,
  Globe,
  Link2,
  CalendarDays,
} from "lucide-react";
import { SecurityTab } from "./components/security-tab";
import { BindingsTab } from "./components/bindings-tab";
import { CheckinTab } from "./components/checkin-tab";

export default function ProfilePage() {
  const { t, i18n } = useTranslation();
  const user = useAuthStore((s) => s.auth.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [displayName, setDisplayName] = useState(user?.display_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [saving, setSaving] = useState(false);

  const initials = user?.display_name
    ? user.display_name.slice(0, 2).toUpperCase()
    : user?.username?.slice(0, 2).toUpperCase() ?? "??";

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put("/api/user/self", { display_name: displayName, email });
      if (res.data?.success) {
        toast.success(t("common.success"));
        if (user) setUser({ ...user, display_name: displayName, email });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  const languages = [
    { code: "en", label: "English" },
    { code: "zh", label: "中文" },
    { code: "fr", label: "Français" },
    { code: "ru", label: "Русский" },
    { code: "ja", label: "日本語" },
    { code: "vi", label: "Tiếng Việt" },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold">{t("nav.profile")}</h1>

      <Tabs defaultValue="general">
        <TabsList className="h-auto flex-wrap gap-1">
          <TabsTrigger value="general">
            <User className="h-4 w-4 mr-2" />
            {t("General")}
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            {t("Security")}
          </TabsTrigger>
          <TabsTrigger value="bindings">
            <Link2 className="h-4 w-4 mr-2" />
            {t("Bindings")}
          </TabsTrigger>
          <TabsTrigger value="checkin">
            <CalendarDays className="h-4 w-4 mr-2" />
            {t("Check-in")}
          </TabsTrigger>
          <TabsTrigger value="language">
            <Globe className="h-4 w-4 mr-2" />
            {t("Language")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("Profile Information")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user?.avatar_url} />
                  <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-lg">{user?.display_name || user?.username}</div>
                  <div className="text-sm text-[var(--muted)]">{user?.email || user?.username}</div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("common.username")}</Label>
                <Input value={user?.username || ""} disabled />
              </div>
              <div className="space-y-2">
                <Label>{t("Display Name")}</Label>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("common.email")}</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? t("common.loading") : t("common.save")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <SecurityTab />
        </TabsContent>

        <TabsContent value="bindings" className="mt-6">
          <BindingsTab />
        </TabsContent>

        <TabsContent value="checkin" className="mt-6">
          <CheckinTab />
        </TabsContent>

        <TabsContent value="language" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("Language Preference")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {languages.map((lang) => (
                  <Button
                    key={lang.code}
                    variant={i18n.language === lang.code ? "default" : "outline"}
                    onClick={() => i18n.changeLanguage(lang.code)}
                    className="justify-start"
                  >
                    {lang.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
