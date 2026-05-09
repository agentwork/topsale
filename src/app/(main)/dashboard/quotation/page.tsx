"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Filter, Loader2, Plus, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "草稿", variant: "secondary" },
  pending_approval: { label: "待審核", variant: "outline" },
  approved: { label: "已核准", variant: "default" },
  confirmed: { label: "已確認", variant: "default" },
  closed: { label: "已結案", variant: "secondary" },
  withdrawn: { label: "已撤回", variant: "destructive" },
};

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  pending_approval: "bg-blue-100 text-blue-800",
  approved: "bg-green-100 text-green-800",
  confirmed: "bg-purple-100 text-purple-800",
  closed: "bg-gray-100 text-gray-600",
  withdrawn: "bg-red-100 text-red-800",
};

export default function QuotationPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data, isLoading } = trpc.quotation.quotations.list.useQuery({
    status: (statusFilter || undefined) as
      | "draft"
      | "pending_approval"
      | "approved"
      | "confirmed"
      | "closed"
      | "withdrawn"
      | undefined,
    search: search || undefined,
    page,
    pageSize,
  });

  const statusCounts = {
    draft: data?.data.filter((q) => q.status === "draft").length ?? 0,
    pending_approval: data?.data.filter((q) => q.status === "pending_approval").length ?? 0,
    approved: data?.data.filter((q) => q.status === "approved").length ?? 0,
    confirmed: data?.data.filter((q) => q.status === "confirmed").length ?? 0,
    closed: data?.data.filter((q) => q.status === "closed").length ?? 0,
    withdrawn: data?.data.filter((q) => q.status === "withdrawn").length ?? 0,
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(data?.data.map((q) => q.id) ?? []);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    }
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-2xl">報價單管理</h1>
          <p className="text-muted-foreground">Quotation Management</p>
        </div>
        <Button onClick={() => router.push("/dashboard/quotation/new")}>
          <Plus className="mr-2 h-4 w-4" />
          新增報價單
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {Object.entries(statusLabels).map(([key, { label }]) => (
          <button
            key={key}
            type="button"
            className={`rounded-lg border p-4 text-left transition hover:border-primary ${
              statusFilter === key ? "border-primary bg-primary/5" : ""
            }`}
            onClick={() => {
              setStatusFilter(statusFilter === key ? "" : key);
              setPage(1);
            }}
          >
            <div className={`mb-1 inline-block rounded-full px-2 py-0.5 font-medium text-xs ${statusColors[key]}`}>
              {label}
            </div>
            <p className="font-semibold text-2xl">{statusCounts[key as keyof typeof statusCounts]}</p>
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜尋 Campaign 或報價單號..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v === "all" ? "" : v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[140px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="狀態篩選" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部狀態</SelectItem>
              <SelectItem value="draft">草稿</SelectItem>
              <SelectItem value="pending_approval">待審核</SelectItem>
              <SelectItem value="approved">已核准</SelectItem>
              <SelectItem value="confirmed">已確認</SelectItem>
              <SelectItem value="closed">已結案</SelectItem>
              <SelectItem value="withdrawn">已撤回</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-4 rounded-lg border bg-muted/50 p-4">
            <span className="font-medium text-sm">已選擇 {selectedIds.length} 筆</span>
            <Button variant="outline" size="sm">
              批量刪除
            </Button>
            <Button variant="outline" size="sm">
              批量匯出
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])}>
              取消選擇
            </Button>
          </div>
        )}

        <div className="text-muted-foreground text-sm">
          {isLoading ? "載入中..." : `共 ${data?.total || 0} 筆報價單`}
          {statusFilter && ` · 狀態：${statusLabels[statusFilter]?.label || statusFilter}`}
          {search && ` · 搜尋：${search}`}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : !data?.data.length ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
            <div className="text-muted-foreground">
              <Search className="mx-auto mb-3 h-10 w-10" />
              <p className="font-medium text-lg">找不到報價單</p>
              <p className="text-sm">嘗試調整搜尋條件或建立新報價單</p>
            </div>
            <Button variant="outline" className="mt-4" onClick={() => router.push("/dashboard/quotation/new")}>
              <Plus className="mr-2 h-4 w-4" />
              新增報價單
            </Button>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === data?.data.length && data?.data.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </TableHead>
                    <TableHead className="w-[140px]">報價單號</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead className="w-[100px]">狀態</TableHead>
                    <TableHead className="w-[120px] text-right">總額(含稅)</TableHead>
                    <TableHead className="w-[100px]">急單</TableHead>
                    <TableHead className="w-[120px]">建立日期</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data.map((quotation) => (
                    <TableRow
                      key={quotation.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/dashboard/quotation/${quotation.id}`)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(quotation.id)}
                          onChange={(e) => handleSelectRow(quotation.id, e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs">{quotation.quotationNo}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{quotation.campaignName}</p>
                          {quotation.isSpecialCase && <p className="text-amber-600 text-xs">特例案件</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusLabels[quotation.status].variant}>
                          {statusLabels[quotation.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ${(quotation.totalGross ?? 0).toLocaleString()}
                      </TableCell>
                      <TableCell>{quotation.isRushOrder && <Badge variant="destructive">急單</Badge>}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {quotation.createdAt ? new Date(quotation.createdAt).toLocaleDateString("zh-TW") : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {data && data.total > pageSize && (
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  上一頁
                </Button>
                <span className="text-muted-foreground text-sm">
                  第 {page} 頁，共 {Math.ceil(data.total / pageSize)} 頁
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page * pageSize >= data.total}
                >
                  下一頁
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
