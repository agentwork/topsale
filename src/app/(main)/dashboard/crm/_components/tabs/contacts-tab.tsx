"use client";

import { useState } from "react";

import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";

const statusLabels: Record<string, string> = {
  active: "在職",
  inactive: "離職",
};

const levelLabels: Record<string, string> = {
  decision_maker: "決策者",
  influencer: "影響者",
  executor: "執行者",
};

export function ContactsTab() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    accountId: "",
    name: "",
    englishName: "",
    title: "",
    department: "",
    tel: "",
    mobile: "",
    email: "",
    status: "active" as "active" | "inactive",
    level: [] as string[],
  });

  const { data: accountsData } = trpc.crm.accounts.list.useQuery({ page: 1, pageSize: 100 });
  const accounts = accountsData?.data || [];

  const { data, isLoading, refetch } = trpc.crm.contacts.list.useQuery({
    page,
    pageSize: 20,
    search: search || undefined,
    status: status ? (status as "active" | "inactive") : undefined,
  });

  const createMutation = trpc.crm.contacts.create.useMutation({
    onSuccess: () => {
      refetch();
      resetForm();
    },
  });

  const updateMutation = trpc.crm.contacts.update.useMutation({
    onSuccess: () => {
      refetch();
      resetForm();
    },
  });

  const deleteMutation = trpc.crm.contacts.delete.useMutation({
    onSuccess: () => refetch(),
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      accountId: "",
      name: "",
      englishName: "",
      title: "",
      department: "",
      tel: "",
      mobile: "",
      email: "",
      status: "active",
      level: [],
    });
  };

  const handleEdit = (contact: NonNullable<typeof data>["data"][0]) => {
    setFormData({
      accountId: contact.accountId,
      name: contact.name,
      englishName: contact.englishName || "",
      title: contact.title || "",
      department: contact.department || "",
      tel: contact.tel || "",
      mobile: contact.mobile || "",
      email: contact.email || "",
      status: contact.status,
      level: (contact.level as string[]) || [],
    });
    setEditingId(contact.id);
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!formData.accountId || !formData.name.trim()) return;

    const payload = {
      accountId: formData.accountId,
      name: formData.name,
      englishName: formData.englishName || undefined,
      title: formData.title || undefined,
      department: formData.department || undefined,
      tel: formData.tel || undefined,
      mobile: formData.mobile || undefined,
      email: formData.email || undefined,
      status: formData.status,
      level:
        formData.level.length > 0 ? (formData.level as ("decision_maker" | "influencer" | "executor")[]) : undefined,
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

  const toggleLevel = (level: string) => {
    setFormData((prev) => ({
      ...prev,
      level: prev.level.includes(level) ? prev.level.filter((l) => l !== level) : [...prev.level, level],
    }));
  };

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4">
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <Input
            placeholder="搜尋聯絡人..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="狀態" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">在職</SelectItem>
              <SelectItem value="inactive">離職</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-2 h-4 w-4" />
            新增聯絡人
          </Button>
        </div>

        {showForm && (
          <div className="mb-4 grid gap-4 rounded-lg border p-4">
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>姓名 *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="姓名"
                />
              </div>
              <div className="space-y-2">
                <Label>英文名</Label>
                <Input
                  value={formData.englishName}
                  onChange={(e) => setFormData({ ...formData, englishName: e.target.value })}
                  placeholder="English Name"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>職稱</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="職稱"
                />
              </div>
              <div className="space-y-2">
                <Label>部門</Label>
                <Input
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="部門"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>電話</Label>
                <Input
                  value={formData.tel}
                  onChange={(e) => setFormData({ ...formData, tel: e.target.value })}
                  placeholder="電話"
                />
              </div>
              <div className="space-y-2">
                <Label>手機</Label>
                <Input
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  placeholder="手機"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                type="email"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>狀態 *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v as "active" | "inactive" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">在職</SelectItem>
                    <SelectItem value="inactive">離職</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>等級</Label>
                <div className="flex gap-2">
                  {["decision_maker", "influencer", "executor"].map((level) => (
                    <Button
                      key={level}
                      variant={formData.level.includes(level) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleLevel(level)}
                      type="button"
                    >
                      {levelLabels[level]}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={resetForm}>
                取消
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending || !formData.name.trim()}
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
                  <TableHead>姓名</TableHead>
                  <TableHead>所屬公司</TableHead>
                  <TableHead>職稱</TableHead>
                  <TableHead>部門</TableHead>
                  <TableHead>電話</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead>等級</TableHead>
                  <TableHead className="w-24">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium">{contact.name}</TableCell>
                    <TableCell>{getAccountName(contact.accountId)}</TableCell>
                    <TableCell>{contact.title || "-"}</TableCell>
                    <TableCell>{contact.department || "-"}</TableCell>
                    <TableCell>{contact.mobile || contact.tel || "-"}</TableCell>
                    <TableCell>{contact.email || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={contact.status === "active" ? "default" : "secondary"}>
                        {statusLabels[contact.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {((contact.level as string[]) || []).map((l) => (
                          <Badge key={l} variant="outline" className="text-xs">
                            {levelLabels[l] || l}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(contact)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate({ id: contact.id })}>
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
