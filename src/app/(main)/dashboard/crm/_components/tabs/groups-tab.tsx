"use client";

import { useState } from "react";

import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";

export function GroupsTab() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [groupName, setGroupName] = useState("");

  const { data, isLoading, refetch } = trpc.crm.groups.list.useQuery({
    page,
    pageSize: 20,
    search: search || undefined,
  });

  const createMutation = trpc.crm.groups.create.useMutation({
    onSuccess: () => {
      refetch();
      resetForm();
    },
  });

  const updateMutation = trpc.crm.groups.update.useMutation({
    onSuccess: () => {
      refetch();
      resetForm();
    },
  });

  const deleteMutation = trpc.crm.groups.delete.useMutation({
    onSuccess: () => refetch(),
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setGroupName("");
  };

  const handleEdit = (group: NonNullable<typeof data>["data"][0]) => {
    setGroupName(group.groupName);
    setEditingId(group.id);
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!groupName.trim()) return;

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: { groupName } });
    } else {
      createMutation.mutate({ groupName });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4">
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <Input
            placeholder="搜尋集團名稱..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Button variant="outline" onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-2 h-4 w-4" />
            新增集團
          </Button>
        </div>

        {showForm && (
          <div className="mb-4 grid gap-4 rounded-lg border p-4">
            <div className="space-y-2">
              <Label>集團名稱 *</Label>
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="例：電通集團、宏盟集團"
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={resetForm}>
                取消
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending || !groupName.trim()}
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
                  <TableHead>集團名稱</TableHead>
                  <TableHead className="w-24">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell className="font-medium">{group.groupName}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(group)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate({ id: group.id })}>
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
