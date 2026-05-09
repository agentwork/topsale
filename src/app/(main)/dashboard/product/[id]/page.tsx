"use client";

import { useState } from "react";

import { useParams, useRouter } from "next/navigation";

import { format } from "date-fns";
import { ArrowLeft, Edit, History, Loader2, MoreHorizontal, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="font-medium text-sm">{value}</span>
    </div>
  );
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [showHistory, setShowHistory] = useState(false);

  const { data: product, isLoading, error } = trpc.product.products.getById.useQuery({ id });
  const { data: history } = trpc.product.products.getHistory.useQuery(
    { productId: id },
    { enabled: !!id && showHistory },
  );

  const utils = trpc.useUtils();
  const publishMutation = trpc.product.products.publish.useMutation({
    onSuccess: () => {
      toast.success("產品已發佈");
      utils.product.products.getById.invalidate({ id });
    },
    onError: (error) => {
      toast.error(`發佈失敗：${error.message}`);
    },
  });
  const deactivateMutation = trpc.product.products.deactivate.useMutation({
    onSuccess: () => {
      toast.success("產品已下架");
      utils.product.products.getById.invalidate({ id });
    },
    onError: (error) => {
      toast.error(`下架失敗：${error.message}`);
    },
  });

  const handlePublish = () => {
    publishMutation.mutate({ id, publishedBy: "system" });
  };

  const handleDeactivate = () => {
    deactivateMutation.mutate({ id, deactivatedBy: "system" });
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <div className="text-center">
          <p className="font-medium text-lg">找不到此產品</p>
          <p className="text-muted-foreground text-sm">產品可能已被刪除或不存在</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/dashboard/product?tab=all")}>
          返回產品列表
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/product?tab=all")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>返回列表</TooltipContent>
        </Tooltip>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-bold text-2xl tracking-tight">{product.productName}</h1>
            <Badge variant={statusLabels[product.status].variant}>{statusLabels[product.status].label}</Badge>
          </div>
          <p className="text-muted-foreground">{product.productCode || "無編號"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowHistory(!showHistory)}
                className={showHistory ? "bg-muted" : ""}
              >
                <History className={showHistory ? "h-5 w-5 text-primary" : "h-5 w-5"} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{showHistory ? "隱藏紀錄" : "顯示紀錄"}</TooltipContent>
          </Tooltip>

          <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/product/${product.id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            編輯
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {product.status === "draft" && (
                <DropdownMenuItem onClick={handlePublish} disabled={publishMutation.isPending}>
                  {publishMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4 text-green-600" />
                  )}
                  發佈產品
                </DropdownMenuItem>
              )}
              {product.status === "published" && (
                <DropdownMenuItem
                  onClick={handleDeactivate}
                  disabled={deactivateMutation.isPending}
                  className="text-destructive"
                >
                  {deactivateMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  下架產品
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push(`/dashboard/product/${product.id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                編輯產品
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {showHistory && history && history.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 font-medium text-sm">
              <History className="h-4 w-4 text-muted-foreground" />
              修改紀錄
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {history.map((h) => (
                <div key={h.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                  <div>
                    <span className="font-medium">{h.changedField}</span>
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

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-medium text-sm">基本資料</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <InfoRow label="產品編號" value={product.productCode || "-"} />
          <InfoRow label="Ragic 編號" value={product.ragicId || "-"} />
          <InfoRow label="主代碼" value={<Badge variant="outline">{mainCodeLabels[product.mainCode]}</Badge>} />
          <InfoRow label="銷售子類別" value={product.subCategory} />
          <InfoRow label="英文名稱" value={product.productNameEn || "-"} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-medium text-sm">定價資料</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <InfoRow label="計價單位" value={pricingUnitLabels[product.pricingUnit]} />
          <InfoRow label="單價" value={`$${product.unitPrice.toLocaleString()}`} />
          <InfoRow label="優先順序" value={product.priority || 0} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-medium text-sm">時間資料</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <InfoRow label="生效日" value={product.startDate ? format(new Date(product.startDate), "yyyy/MM/dd") : "-"} />
          <InfoRow label="失效日" value={product.endDate ? format(new Date(product.endDate), "yyyy/MM/dd") : "-"} />
          <InfoRow label="建立時間" value={format(new Date(product.createdAt), "yyyy/MM/dd HH:mm")} />
          <InfoRow label="更新時間" value={format(new Date(product.updatedAt), "yyyy/MM/dd HH:mm")} />
          {product.publishedAt && (
            <InfoRow label="發佈時間" value={format(new Date(product.publishedAt), "yyyy/MM/dd HH:mm")} />
          )}
        </CardContent>
      </Card>

      {product.description && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-medium text-sm">產品描述</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm leading-relaxed">{product.description}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
