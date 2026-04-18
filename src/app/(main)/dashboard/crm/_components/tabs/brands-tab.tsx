"use client";

import { useState } from "react";

import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";

const INDUSTRY_CATEGORIES = [
  "汽機車產業",
  "汽車用品產業",
  "遊戲產業",
  "醫療用品產業",
  "保健食品產業",
  "低酒精飲產業",
  "烈酒產業",
  "飲料產業",
  "家庭生活與防護用品產業",
  "房產產業",
  "速食產業",
  "食品產業",
  "建築設備與室內建材產業",
  "家居用品產業",
  "3C 電子用品產業",
  "大型家電產業",
  "小型家電產業",
  "資通訊產業",
  "觀光旅遊產業",
  "醫學美容產業",
  "彩妝保養產業",
  "金融產業",
  "餐飲產業",
  "政治產業",
  "服裝產業",
  "精品時尚產業",
  "電商通路產業",
  "母嬰產業",
  "展覽活動產業",
  "百貨超商通路產業",
  "影視娛樂產業",
  "文教產業",
  "乳品製造產業",
  "公益產業",
  "政府機關類",
  "其它產業",
  "寵物用品產業",
  "玩具產業",
  "支援服務業",
];

export function BrandsTab() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [accountId, setAccountId] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    brandName: "",
    accountId: "",
    industryCategory: "",
    mediaRequirement: [] as string[],
    deliveryNotes: "",
    cooperationNotes: "",
  });

  const { data: accountsData } = trpc.crm.accounts.list.useQuery({ page: 1, pageSize: 100 });
  const accounts = accountsData?.data || [];

  const { data, isLoading, refetch } = trpc.crm.brands.list.useQuery({
    page,
    pageSize: 20,
    search: search || undefined,
    accountId: accountId || undefined,
  });

  const createMutation = trpc.crm.brands.create.useMutation({
    onSuccess: () => {
      refetch();
      resetForm();
    },
  });

  const updateMutation = trpc.crm.brands.update.useMutation({
    onSuccess: () => {
      refetch();
      resetForm();
    },
  });

  const deleteMutation = trpc.crm.brands.delete.useMutation({
    onSuccess: () => refetch(),
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      brandName: "",
      accountId: "",
      industryCategory: "",
      mediaRequirement: [],
      deliveryNotes: "",
      cooperationNotes: "",
    });
  };

  const handleEdit = (brand: NonNullable<typeof data>["data"][0]) => {
    setFormData({
      brandName: brand.brandName,
      accountId: brand.accountId,
      industryCategory: brand.industryCategory,
      mediaRequirement: (brand.mediaRequirement as string[]) || [],
      deliveryNotes: brand.deliveryNotes || "",
      cooperationNotes: brand.cooperationNotes || "",
    });
    setEditingId(brand.id);
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!formData.brandName.trim() || !formData.accountId || !formData.industryCategory) return;

    const payload = {
      brandName: formData.brandName,
      accountId: formData.accountId,
      industryCategory: formData.industryCategory,
      mediaRequirement: formData.mediaRequirement.length > 0 ? formData.mediaRequirement : undefined,
      deliveryNotes: formData.deliveryNotes || undefined,
      cooperationNotes: formData.cooperationNotes || undefined,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const getAccountName = (id: string) => {
    const account = accounts.find((a) => a.id === id);
    return account?.accountName || id;
  };

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4">
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <Input
            placeholder="搜尋品牌名稱..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
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
          <Button variant="outline" onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-2 h-4 w-4" />
            新增品牌
          </Button>
        </div>

        {showForm && (
          <div className="mb-4 grid gap-4 rounded-lg border p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>品牌名稱 *</Label>
                <Input
                  value={formData.brandName}
                  onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                  placeholder="品牌名稱"
                />
              </div>
              <div className="space-y-2">
                <Label>所屬公司 *</Label>
                <Select value={formData.accountId} onValueChange={(v) => setFormData({ ...formData, accountId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="選擇公司" />
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
            </div>
            <div className="space-y-2">
              <Label>產業類別 *</Label>
              <Select
                value={formData.industryCategory}
                onValueChange={(v) => setFormData({ ...formData, industryCategory: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="選擇產業類別" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRY_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>投放注意事項</Label>
              <Textarea
                value={formData.deliveryNotes}
                onChange={(e) => setFormData({ ...formData, deliveryNotes: e.target.value })}
                placeholder="投放注意事項"
              />
            </div>
            <div className="space-y-2">
              <Label>合作注意事項</Label>
              <Textarea
                value={formData.cooperationNotes}
                onChange={(e) => setFormData({ ...formData, cooperationNotes: e.target.value })}
                placeholder="合作注意事項"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={resetForm}>
                取消
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending || !formData.brandName.trim()}
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingId ? "更新" : "建立"}
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
                  <TableHead>品牌名稱</TableHead>
                  <TableHead>所屬公司</TableHead>
                  <TableHead>產業類別</TableHead>
                  <TableHead>投放注意事項</TableHead>
                  <TableHead>合作注意事項</TableHead>
                  <TableHead className="w-24">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data.map((brand) => (
                  <TableRow key={brand.id}>
                    <TableCell className="font-medium">{brand.brandName}</TableCell>
                    <TableCell>{getAccountName(brand.accountId)}</TableCell>
                    <TableCell>{brand.industryCategory}</TableCell>
                    <TableCell className="max-w-[150px] truncate">{brand.deliveryNotes || "-"}</TableCell>
                    <TableCell className="max-w-[150px] truncate">{brand.cooperationNotes || "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(brand)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate({ id: brand.id })}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
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
