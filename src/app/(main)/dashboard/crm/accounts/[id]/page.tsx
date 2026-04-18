"use client";

import { useState } from "react";

import { useParams, useRouter } from "next/navigation";

import { format } from "date-fns";
import {
  ArrowLeft,
  Building2,
  CreditCard,
  Edit,
  History,
  Loader2,
  MapPin,
  Shield,
  Stethoscope,
  User,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

const accountTypeLabels: Record<string, string> = {
  agency: "代理商",
  client: "客戶",
};

const agencyTierLabels: Record<string, string> = {
  tier1: "Tier 1",
  tier2: "Tier 2",
  tier3: "Tier 3",
};

const paymentTermLabels: Record<string, string> = {
  net30: "月結 30 日",
  net60: "月結 60 日",
  net90: "月結 90 日",
  within30: "30 日內",
  within45: "45 日內",
  prepaid: "預收",
};

const allianceLabels: Record<string, string> = {
  apex: "APEX",
  omnet: "Omnet",
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="font-medium text-sm">{value}</span>
    </div>
  );
}

export default function AccountDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [showHistory, setShowHistory] = useState(false);

  const { data: account, isLoading, error, refetch } = trpc.crm.accounts.getById.useQuery({ id });
  const { data: brands } = trpc.crm.accounts.getBrandsByAccount.useQuery({ accountId: id }, { enabled: !!id });
  const { data: contacts } = trpc.crm.accounts.getContactsByAccount.useQuery({ accountId: id }, { enabled: !!id });
  const { data: group } = trpc.crm.groups.getById.useQuery(
    { id: account?.groupId ?? "" },
    { enabled: !!account?.groupId },
  );
  const { data: allContacts } = trpc.crm.contacts.list.useQuery({ page: 1, pageSize: 100 });
  const { data: history } = trpc.crm.accounts.getHistory.useQuery({ accountId: id }, { enabled: !!id && showHistory });

  const primaryContact = allContacts?.data.find((c) => c.id === account?.primaryContactId);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <p className="text-lg text-muted-foreground">找不到此客戶</p>
        <Button variant="outline" onClick={() => router.push("/dashboard/crm?tab=accounts")}>
          返回客戶列表
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/crm?tab=accounts")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="font-bold text-2xl tracking-tight">{account.accountName}</h1>
          <p className="text-muted-foreground">{account.shortName}</p>
        </div>
        {account.isBlacklist && <Badge variant="destructive">黑名單</Badge>}
        {!account.isBlacklist && account.status === "active" && <Badge variant="default">正常</Badge>}
        {!account.isBlacklist && account.status === "inactive" && <Badge variant="secondary">停用</Badge>}
        <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/crm/accounts/${account.id}/edit`)}>
          <Edit className="mr-2 h-4 w-4" />
          編輯
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setShowHistory(!showHistory)}>
          <History className="h-5 w-5" />
        </Button>
      </div>

      {showHistory && history && history.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 font-medium text-sm">
              <History className="h-4 w-4 text-muted-foreground" />
              交易條件修改紀錄
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {history.map((h) => (
                <div key={h.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                  <div>
                    <span className="font-medium">{h.changedField === "paymentTerm" ? "付款條件" : "聯盟"}</span>
                    <span className="mx-2 text-muted-foreground">：</span>
                    <span className="text-destructive line-through">{h.oldValue || "(無)"}</span>
                    <span className="mx-2">→</span>
                    <span className="text-green-600">{h.newValue || "(無)"}</span>
                  </div>
                  <div className="text-right text-muted-foreground text-xs">
                    <p>{h.changedBy}</p>
                    <p>{format(new Date(h.changedAt), "yyyy/MM/dd HH:mm")}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 font-medium text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  基本資料
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <InfoRow label="客戶類型" value={accountTypeLabels[account.accountType]} />
                {account.groupId && <InfoRow label="集團" value={group?.groupName || "-"} />}
                <InfoRow label="等級" value={agencyTierLabels[account.agencyTier]} />
                <InfoRow label="統一編號" value={account.taxId || "-"} />
                <InfoRow label="身分字號" value={account.personalId || "-"} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 font-medium text-sm">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  交易條件
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <InfoRow label="付款條件" value={paymentTermLabels[account.paymentTerm]} />
                {account.alliance && (
                  <InfoRow label="聯盟" value={<Badge variant="outline">{allianceLabels[account.alliance]}</Badge>} />
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 font-medium text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                負責業務 / 主要聯繫人
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <InfoRow label="負責業務" value={account.accountOwner || "-"} />
              <InfoRow
                label="主要聯繫人"
                value={primaryContact ? `${primaryContact.name} (${primaryContact.title || "未知職稱"})` : "-"}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 font-medium text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                地址
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{account.address}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 font-medium text-sm">
                <Stethoscope className="h-4 w-4 text-muted-foreground" />
                客戶偏好
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {account.customerPreference || "尚無資料"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 font-medium text-sm">
                <Shield className="h-4 w-4 text-muted-foreground" />
                客戶內部政治
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm leading-relaxed">{account.internalPolitics || "尚無資料"}</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="font-medium text-sm">品牌列表</CardTitle>
            </CardHeader>
            <CardContent>
              {brands && brands.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {brands.map((brand) => (
                    <Badge key={brand.id} variant="secondary" className="text-xs">
                      {brand.brandName}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">尚無品牌資料</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="font-medium text-sm">聯絡人列表</CardTitle>
            </CardHeader>
            <CardContent>
              {contacts && contacts.length > 0 ? (
                <div className="space-y-3">
                  {contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className={`flex items-start justify-between rounded-lg border p-3 ${contact.id === account.primaryContactId ? "border-primary bg-muted/50" : ""}`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-sm">
                          {contact.name}
                          {contact.id === account.primaryContactId && (
                            <Badge variant="default" className="ml-2 text-xs">
                              主
                            </Badge>
                          )}
                        </p>
                        <p className="truncate text-muted-foreground text-xs">
                          {contact.title || "未知職稱"} · {contact.department || "未知部門"}
                        </p>
                      </div>
                      <div className="ml-3 text-right">
                        <p className="text-xs">{contact.mobile || contact.tel || "-"}</p>
                        <p className="text-muted-foreground text-xs">{contact.email || "-"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">尚無聯絡人資料</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="rounded-lg border bg-muted/50 p-4">
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-muted-foreground text-xs">
          <span>建立時間：{format(new Date(account.createdAt), "yyyy/MM/dd HH:mm")}</span>
          <span>更新時間：{format(new Date(account.updatedAt), "yyyy/MM/dd HH:mm")}</span>
        </div>
      </div>
    </div>
  );
}
