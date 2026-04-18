"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";

type AccountFormData = {
  accountName: string;
  shortName: string;
  taxId: string;
  personalId: string;
  address: string;
  groupId: string;
  accountType: "agency" | "client";
  agencyTier: "tier1" | "tier2" | "tier3";
  paymentTerm: "net30" | "net60" | "net90" | "within30" | "within45" | "prepaid";
  accountOwner: string;
  primaryContactId: string;
  customerPreference: string;
  internalPolitics: string;
  alliance: "apex" | "omnet" | "";
  isBlacklist: boolean;
  status: "active" | "inactive";
};

const initialFormData: AccountFormData = {
  accountName: "",
  shortName: "",
  taxId: "",
  personalId: "",
  address: "",
  groupId: "",
  accountType: "client",
  agencyTier: "tier1",
  paymentTerm: "net30",
  accountOwner: "",
  primaryContactId: "",
  customerPreference: "",
  internalPolitics: "",
  alliance: "",
  isBlacklist: false,
  status: "active",
};

export default function NewAccountPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<AccountFormData>(initialFormData);
  const [idError, setIdError] = useState("");

  const { data: groupsData } = trpc.crm.groups.list.useQuery({ page: 1, pageSize: 100 });
  const groups = groupsData?.data || [];

  const { data: contactsData } = trpc.crm.contacts.list.useQuery({ page: 1, pageSize: 100 });
  const contacts = contactsData?.data || [];

  const createMutation = trpc.crm.accounts.create.useMutation({
    onSuccess: (result) => {
      router.push(`/dashboard/crm/accounts/${result.id}`);
    },
  });

  const handleSubmit = () => {
    if (!formData.accountName.trim()) return;
    if (!formData.taxId.trim() && !formData.personalId.trim()) {
      setIdError("統一編號或身分字號至少需要填寫一個");
      return;
    }
    setIdError("");

    createMutation.mutate({
      accountName: formData.accountName,
      shortName: formData.shortName,
      address: formData.address,
      accountType: formData.accountType,
      paymentTerm: formData.paymentTerm,
      taxId: formData.taxId || undefined,
      personalId: formData.personalId || undefined,
      groupId: formData.groupId || undefined,
      agencyTier: formData.agencyTier,
      accountOwner: formData.accountOwner || undefined,
      primaryContactId: formData.primaryContactId || undefined,
      customerPreference: formData.customerPreference || undefined,
      internalPolitics: formData.internalPolitics || undefined,
      alliance: formData.alliance || undefined,
      isBlacklist: formData.isBlacklist || undefined,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-bold text-2xl tracking-tight">新增客戶</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">客戶資料</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>客戶名稱 *</Label>
              <Input
                value={formData.accountName}
                onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                placeholder="公司完整抬頭或姓名"
              />
            </div>
            <div className="space-y-2">
              <Label>客戶簡稱 *</Label>
              <Input
                value={formData.shortName}
                onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                placeholder="簡稱"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>
                統一編號 {idError && <span className="text-destructive text-xs">（請填寫統一編號或身分字號）</span>}
              </Label>
              <Input
                value={formData.taxId}
                onChange={(e) => {
                  setFormData({ ...formData, taxId: e.target.value });
                  setIdError("");
                }}
                placeholder="8 碼"
              />
            </div>
            <div className="space-y-2">
              <Label>身分字號</Label>
              <Input
                value={formData.personalId}
                onChange={(e) => {
                  setFormData({ ...formData, personalId: e.target.value });
                  setIdError("");
                }}
                placeholder="10 碼"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>地址 *</Label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="地址"
            />
          </div>

          <div className="space-y-2">
            <Label>集團</Label>
            <Select
              value={formData.groupId}
              onValueChange={(v) => setFormData({ ...formData, groupId: v === "none" ? "" : v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="選擇集團（可留空）" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">無歸屬集團</SelectItem>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.groupName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>客戶類型 *</Label>
              <Select
                value={formData.accountType}
                onValueChange={(v) => setFormData({ ...formData, accountType: v as "agency" | "client" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agency">代理商</SelectItem>
                  <SelectItem value="client">客戶</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>等級 *</Label>
              <Select
                value={formData.agencyTier}
                onValueChange={(v) => setFormData({ ...formData, agencyTier: v as "tier1" | "tier2" | "tier3" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tier1">Tier 1</SelectItem>
                  <SelectItem value="tier2">Tier 2</SelectItem>
                  <SelectItem value="tier3">Tier 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>付款條件 *</Label>
              <Select
                value={formData.paymentTerm}
                onValueChange={(v) => setFormData({ ...formData, paymentTerm: v as typeof formData.paymentTerm })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="net30">月結 30 日</SelectItem>
                  <SelectItem value="net60">月結 60 日</SelectItem>
                  <SelectItem value="net90">月結 90 日</SelectItem>
                  <SelectItem value="within30">30 日內</SelectItem>
                  <SelectItem value="within45">45 日內</SelectItem>
                  <SelectItem value="prepaid">預收</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>聯盟</Label>
              <Select
                value={formData.alliance}
                onValueChange={(v) => setFormData({ ...formData, alliance: v as "apex" | "omnet" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="選擇聯盟" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apex">APEX</SelectItem>
                  <SelectItem value="omnet">Omnet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>負責業務</Label>
              <Input
                value={formData.accountOwner}
                onChange={(e) => setFormData({ ...formData, accountOwner: e.target.value })}
                placeholder="業務姓名"
              />
            </div>
            <div className="space-y-2">
              <Label>主要聯繫人</Label>
              <Select
                value={formData.primaryContactId}
                onValueChange={(v) => setFormData({ ...formData, primaryContactId: v === "none" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="選擇主要聯繫人" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">無</SelectItem>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.name} ({contact.title || "未知職稱"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>客戶偏好</Label>
            <Textarea
              value={formData.customerPreference}
              onChange={(e) => setFormData({ ...formData, customerPreference: e.target.value })}
              placeholder="客戶偏好備註"
            />
          </div>

          <div className="space-y-2">
            <Label>客戶內部政治</Label>
            <Textarea
              value={formData.internalPolitics}
              onChange={(e) => setFormData({ ...formData, internalPolitics: e.target.value })}
              placeholder="客戶內部政治備註"
            />
          </div>

          <div className="space-y-3">
            <Label>客戶是否正常經營</Label>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="statusActive"
                  name="accountStatus"
                  checked={formData.status === "active"}
                  onChange={() => setFormData({ ...formData, status: "active" })}
                  className="h-4 w-4"
                />
                <Label htmlFor="statusActive" className="cursor-pointer">
                  正常
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="statusInactive"
                  name="accountStatus"
                  checked={formData.status === "inactive"}
                  onChange={() => setFormData({ ...formData, status: "inactive" })}
                  className="h-4 w-4"
                />
                <Label htmlFor="statusInactive" className="cursor-pointer">
                  停用
                </Label>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isBlacklist"
              checked={formData.isBlacklist}
              onChange={(e) => setFormData({ ...formData, isBlacklist: e.target.checked })}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="isBlacklist" className="cursor-pointer text-destructive">
              列為黑名單
            </Label>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => router.back()}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || !formData.accountName.trim()}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              建立
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
