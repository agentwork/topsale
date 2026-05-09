"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Copy, Eye, Filter, Loader2, Pencil, Plus, Search, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { trpc } from "@/lib/trpc";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  draft: { label: "草稿", variant: "secondary" },
  published: { label: "已發佈", variant: "default" },
  inactive: { label: "已下架", variant: "destructive" },
};

const mainCodeLabels: Record<string, string> = {
  IAD: "自營廣告",
  ISY: "系統",
  EXT: "外媒",
  SVC: "服務",
  PKG: "專案",
};

const pricingUnitLabels: Record<string, string> = {
  CPM: "CPM",
  CPC: "CPC",
  CPV: "CPV",
  案: "案",
  篇: "篇",
  人: "人",
  每一尺寸: "每一尺寸",
  小時: "小時",
  式: "式",
};

interface ProductsTableProps {
  filters?: {
    mainCode?: string;
    status?: string;
    search?: string;
  };
}

export function ProductsTable({ filters }: ProductsTableProps) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { data, isLoading } = trpc.product.products.list.useQuery({
    mainCode: filters?.mainCode as "IAD" | "ISY" | "EXT" | "SVC" | "PKG" | undefined,
    status: (statusFilter || filters?.status) as "draft" | "published" | "inactive" | undefined,
    search: search || undefined,
    page,
    pageSize,
  });

  const utils = trpc.useUtils();
  const publishMutation = trpc.product.products.publish.useMutation({
    onSuccess: () => {
      toast.success("產品已發佈");
      utils.product.products.list.invalidate();
    },
    onError: (error) => {
      toast.error(`發佈失敗：${error.message}`);
    },
  });
  const deactivateMutation = trpc.product.products.deactivate.useMutation({
    onSuccess: () => {
      toast.success("產品已下架");
      utils.product.products.list.invalidate();
    },
    onError: (error) => {
      toast.error(`下架失敗：${error.message}`);
    },
  });

  const handleClone = (productCode: string | null | undefined) => {
    if (productCode) {
      router.push(`/dashboard/product/clone/${productCode}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜尋產品名稱或編號..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
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
              <SelectItem value="published">已發佈</SelectItem>
              <SelectItem value="inactive">已下架</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => router.push("/dashboard/product/new")}>
            <Plus className="mr-2 h-4 w-4" />
            新增
          </Button>
        </div>
      </div>

      <div className="text-muted-foreground text-sm">
        {isLoading ? "載入中..." : `共 ${data?.total || 0} 項產品`}
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
            <p className="font-medium text-lg">找不到產品</p>
            <p className="text-sm">嘗試調整搜尋條件或建立新產品</p>
          </div>
          <Button variant="outline" className="mt-4" onClick={() => router.push("/dashboard/product/new")}>
            <Plus className="mr-2 h-4 w-4" />
            新增產品
          </Button>
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">產品編號</TableHead>
                  <TableHead>產品名稱</TableHead>
                  <TableHead className="w-[100px]">類型</TableHead>
                  <TableHead className="w-[100px]">子類別</TableHead>
                  <TableHead className="w-[120px]">單價</TableHead>
                  <TableHead className="w-[80px]">狀態</TableHead>
                  <TableHead className="w-[150px] text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data.map((product) => (
                  <TableRow
                    key={product.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/dashboard/product/${product.id}`)}
                  >
                    <TableCell className="font-mono text-xs">{product.productCode || "-"}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{product.productName}</p>
                        {product.productNameEn && (
                          <p className="text-muted-foreground text-xs">{product.productNameEn}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{mainCodeLabels[product.mainCode]}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">{product.subCategory}</TableCell>
                    <TableCell>
                      ${product.unitPrice.toLocaleString()}/{pricingUnitLabels[product.pricingUnit]}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusLabels[product.status].variant}>{statusLabels[product.status].label}</Badge>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => router.push(`/dashboard/product/${product.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>查看詳情</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => router.push(`/dashboard/product/${product.id}/edit`)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>編輯</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => handleClone(product.productCode)}>
                              <Copy className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>複製</TooltipContent>
                        </Tooltip>

                        {product.status === "draft" && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  publishMutation.mutate({
                                    id: product.id,
                                    publishedBy: "system",
                                  })
                                }
                                disabled={publishMutation.isPending}
                              >
                                <Send className="h-4 w-4 text-green-600" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>發佈</TooltipContent>
                          </Tooltip>
                        )}

                        {product.status === "published" && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  deactivateMutation.mutate({
                                    id: product.id,
                                    deactivatedBy: "system",
                                  })
                                }
                                disabled={deactivateMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>下架</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
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
  );
}
