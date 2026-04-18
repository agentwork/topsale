"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

export function AccountsTab() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [accountType, setAccountType] = useState<string>("");

  const { data, isLoading, refetch } = trpc.crm.accounts.list.useQuery({
    page,
    pageSize: 20,
    search: search || undefined,
    accountType: accountType ? (accountType as "agency" | "client") : undefined,
  });

  const deleteMutation = trpc.crm.accounts.delete.useMutation({
    onSuccess: () => refetch(),
  });

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4">
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <Input
            placeholder="搜尋客戶名稱..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select value={accountType} onValueChange={setAccountType}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="客戶類型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="agency">代理商</SelectItem>
              <SelectItem value="client">客戶</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => router.push("/dashboard/crm/accounts/new")}>
            <Plus className="mr-2 h-4 w-4" />
            新增客戶
          </Button>
        </div>
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
                  <TableHead>客戶名稱</TableHead>
                  <TableHead>簡稱</TableHead>
                  <TableHead>類型</TableHead>
                  <TableHead>等級</TableHead>
                  <TableHead>付款條件</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead className="w-24">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell>
                      <Button
                        variant="link"
                        className="h-auto p-0 font-medium"
                        onClick={() => router.push(`/dashboard/crm/accounts/${account.id}`)}
                      >
                        {account.accountName}
                      </Button>
                    </TableCell>
                    <TableCell>{account.shortName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{accountTypeLabels[account.accountType]}</Badge>
                    </TableCell>
                    <TableCell>{account.agencyTier ? agencyTierLabels[account.agencyTier] : "-"}</TableCell>
                    <TableCell>{paymentTermLabels[account.paymentTerm]}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {account.isBlacklist ? (
                          <Badge variant="destructive">黑名單</Badge>
                        ) : (
                          <Badge variant={account.status === "active" ? "default" : "secondary"}>
                            {account.status === "active" ? "正常" : "停用"}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/dashboard/crm/accounts/${account.id}/edit`)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("確定要刪除這個客戶嗎？")) {
                              deleteMutation.mutate({ id: account.id });
                            }
                          }}
                        >
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
