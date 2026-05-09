"use client";

import { Badge } from "@/components/ui/badge";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "草稿", variant: "secondary" },
  pending_approval: { label: "待審核", variant: "outline" },
  approved: { label: "已核准", variant: "default" },
  confirmed: { label: "已確認", variant: "default" },
  closed: { label: "已結案", variant: "secondary" },
  withdrawn: { label: "已撤回", variant: "destructive" },
};

interface QuotationHeaderProps {
  quotation: {
    id: string;
    quotationNo: string;
    quotationDate: string;
    validUntil: string;
    campaignName: string;
    status: string;
    isRushOrder: boolean | null;
    isSpecialCase: boolean | null;
  };
}

export function QuotationHeader({ quotation }: QuotationHeaderProps) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-xl">{quotation.quotationNo}</h2>
            <Badge variant={statusLabels[quotation.status].variant}>{statusLabels[quotation.status].label}</Badge>
            {quotation.isRushOrder && <Badge variant="destructive">急單</Badge>}
            {quotation.isSpecialCase && <Badge variant="outline">特例</Badge>}
          </div>
          <p className="mt-1 font-medium text-lg">{quotation.campaignName}</p>
        </div>
        <div className="text-right text-muted-foreground text-sm">
          <p>報價日期：{quotation.quotationDate}</p>
          <p>有效至：{quotation.validUntil}</p>
        </div>
      </div>
    </div>
  );
}
