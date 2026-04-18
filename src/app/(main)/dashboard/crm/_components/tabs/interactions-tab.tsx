"use client";

import { useState } from "react";

import { format } from "date-fns";
import { Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";

const interactionTypeLabels: Record<string, string> = {
  meeting: "會議",
  call: "電話",
  email: "Email",
  message: "訊息",
  event: "事件",
  sales_progress: "銷售進度",
};

export function InteractionsTab() {
  const [page, setPage] = useState(1);
  const [accountId, setAccountId] = useState<string>("");
  const [interactionType, setInteractionType] = useState<string>("");
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    accountId: "",
    brandId: "",
    interactionType: "meeting" as "meeting" | "call" | "email" | "message" | "event" | "sales_progress",
    note: "",
  });

  const { data: accountsData } = trpc.crm.accounts.list.useQuery({ page: 1, pageSize: 100 });
  const accounts = accountsData?.data || [];

  const { data: brandsData } = trpc.crm.accounts.getBrandsByAccount.useQuery(
    { accountId: formData.accountId },
    { enabled: !!formData.accountId },
  );
  const brands = brandsData || [];

  const { data, isLoading, refetch } = trpc.crm.interactions.list.useQuery({
    page,
    pageSize: 20,
    accountId: accountId || undefined,
    interactionType: interactionType ? (interactionType as typeof formData.interactionType) : undefined,
  });

  const createMutation = trpc.crm.interactions.create.useMutation({
    onSuccess: () => {
      refetch();
      resetForm();
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setFormData({
      accountId: "",
      brandId: "",
      interactionType: "meeting",
      note: "",
    });
  };

  const handleSubmit = () => {
    if (!formData.accountId || !formData.interactionType) return;

    createMutation.mutate({
      accountId: formData.accountId,
      brandId: formData.brandId || undefined,
      interactionType: formData.interactionType,
      note: formData.note || undefined,
      createdBy: "00000000-0000-0000-0000-000000000000",
    });
  };

  const getAccountName = (id: string) => {
    const account = accounts.find((a) => a.id === id);
    return account?.accountName || id;
  };

  const getBrandName = (id: string) => {
    const brand = brands.find((b) => b.id === id);
    return brand?.brandName || id;
  };

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4">
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <Select value={accountId} onValueChange={setAccountId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="選擇客戶" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.accountName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={interactionType} onValueChange={setInteractionType}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="互動類型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="meeting">會議</SelectItem>
              <SelectItem value="call">電話</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="message">訊息</SelectItem>
              <SelectItem value="event">事件</SelectItem>
              <SelectItem value="sales_progress">銷售進度</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-2 h-4 w-4" />
            新增記事
          </Button>
        </div>

        {showForm && (
          <div className="mb-4 grid gap-4 rounded-lg border p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>客戶 *</Label>
                <Select
                  value={formData.accountId}
                  onValueChange={(v) => setFormData({ ...formData, accountId: v, brandId: "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選擇客戶" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.accountName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>品牌</Label>
                <Select
                  value={formData.brandId}
                  onValueChange={(v) => setFormData({ ...formData, brandId: v })}
                  disabled={!formData.accountId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選擇品牌" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.brandName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>互動類型 *</Label>
              <Select
                value={formData.interactionType}
                onValueChange={(v) =>
                  setFormData({ ...formData, interactionType: v as typeof formData.interactionType })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meeting">會議</SelectItem>
                  <SelectItem value="call">電話</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="message">訊息</SelectItem>
                  <SelectItem value="event">事件</SelectItem>
                  <SelectItem value="sales_progress">銷售進度</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>詳細紀錄</Label>
              <Textarea
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="會議紀錄 / 電話紀錄 / Email 摘要 / 重要事件"
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={resetForm}>
                取消
              </Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || !formData.accountId}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                建立
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>客戶</TableHead>
                  <TableHead>品牌</TableHead>
                  <TableHead>互動類型</TableHead>
                  <TableHead>詳細紀錄</TableHead>
                  <TableHead>建立時間</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data.map((interaction) => (
                  <TableRow key={interaction.id}>
                    <TableCell className="font-medium">{getAccountName(interaction.accountId)}</TableCell>
                    <TableCell>{interaction.brandId ? getBrandName(interaction.brandId) : "-"}</TableCell>
                    <TableCell>{interactionTypeLabels[interaction.interactionType]}</TableCell>
                    <TableCell className="max-w-[300px] truncate">{interaction.note || "-"}</TableCell>
                    <TableCell>{format(new Date(interaction.createdAt), "yyyy/MM/dd HH:mm")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {data && data.total > 0 && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-muted-foreground text-sm">
                  第 {data.page} 頁，共 {data.pageCount} 頁
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    上一頁
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= data.pageCount}
                  >
                    下一頁
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
