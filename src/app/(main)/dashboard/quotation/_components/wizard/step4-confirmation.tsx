"use client";

import { useRouter } from "next/navigation";

import { CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

interface Step4ConfirmationProps {
  quotationId: string;
}

export function Step4Confirmation({ quotationId }: Step4ConfirmationProps) {
  const router = useRouter();

  const { data: quotation } = trpc.quotation.quotations.getById.useQuery({
    id: quotationId,
  });

  const { data: lineItems } = trpc.quotation.lineItems.getByQuotation.useQuery({
    quotationId,
  });

  const { data: targeting } = trpc.quotation.targeting.getByQuotation.useQuery({
    quotationId,
  });

  const submitMutation = trpc.quotation.quotations.submitForApproval.useMutation({
    onSuccess: () => {
      toast.success("報價單已建立");
      router.push(`/dashboard/quotation/${quotationId}`);
    },
    onError: (error) => {
      toast.error(`送出失敗：${error.message}`);
    },
  });

  const handleSubmit = () => {
    submitMutation.mutate({ id: quotationId });
  };

  const handleSaveDraft = () => {
    toast.success("已儲存為草稿");
    router.push(`/dashboard/quotation/${quotationId}`);
  };

  if (!quotation) return null;

  const totalItems = lineItems?.length ?? 0;
  const hasTargeting = !!targeting;

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center py-8 text-center">
        <CheckCircle className="mb-4 h-16 w-16 text-green-500" />
        <h3 className="font-semibold text-xl">報價單已準備就緒</h3>
        <p className="mt-2 text-muted-foreground">
          報價單編號：<span className="font-medium font-mono">{quotation.quotationNo}</span>
        </p>
      </div>

      <div className="rounded-lg border p-4">
        <h4 className="mb-3 font-medium">建立摘要</h4>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded bg-muted p-3">
            <p className="text-muted-foreground text-sm">客戶</p>
            <p className="font-medium">{quotation.customerId}</p>
          </div>
          <div className="rounded bg-muted p-3">
            <p className="text-muted-foreground text-sm">活動名稱</p>
            <p className="font-medium">{quotation.campaignName}</p>
          </div>
          <div className="rounded bg-muted p-3">
            <p className="text-muted-foreground text-sm">總額（含稅）</p>
            <p className="font-medium font-mono">${(quotation.totalGross ?? 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <h4 className="mb-3 font-medium">完成度檢查</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm">基本資料</span>
          </div>
          <div className="flex items-center gap-2">
            {totalItems > 0 ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">產品選品 ({totalItems} 項)</span>
              </>
            ) : (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-yellow-500" />
                <span className="text-sm text-yellow-600">尚未新增產品選品</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasTargeting ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">投放條件</span>
              </>
            ) : (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-yellow-500" />
                <span className="text-sm text-yellow-600">尚未設定投放條件</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <Button variant="outline" onClick={handleSaveDraft}>
          儲存草稿
        </Button>
        <Button onClick={handleSubmit} disabled={submitMutation.isPending}>
          {submitMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          送出審核
        </Button>
      </div>
    </div>
  );
}
