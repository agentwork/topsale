"use client";

import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

interface PdfExportButtonProps {
  quotationId: string;
}

export function PdfExportButton({ quotationId }: PdfExportButtonProps) {
  const exportMutation = trpc.quotation.quotations.exportPdf.useMutation({
    onSuccess: (data) => {
      if (data?.downloadUrl) {
        window.open(data.downloadUrl, "_blank");
        toast.success("PDF 已產生");
      }
    },
    onError: (error) => {
      toast.error(`匯出失敗：${error.message}`);
    },
  });

  const handleExport = () => {
    exportMutation.mutate({ id: quotationId });
  };

  return (
    <Button variant="outline" onClick={handleExport} disabled={exportMutation.isPending}>
      {exportMutation.isPending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="mr-2 h-4 w-4" />
      )}
      匯出 PDF
    </Button>
  );
}
