"use client";

interface QuotationSummaryProps {
  quotation: {
    subtotalNet: number | null;
    taxAmount: number | null;
    totalGross: number | null;
  };
}

export function QuotationSummary({ quotation }: QuotationSummaryProps) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="mb-4 font-semibold">財務摘要</h3>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg bg-muted p-4">
          <p className="text-muted-foreground text-sm">小計(未稅)</p>
          <p className="font-mono font-semibold text-2xl">${(quotation.subtotalNet ?? 0).toLocaleString()}</p>
        </div>
        <div className="rounded-lg bg-muted p-4">
          <p className="text-muted-foreground text-sm">稅額 (5%)</p>
          <p className="font-mono font-semibold text-2xl">${(quotation.taxAmount ?? 0).toLocaleString()}</p>
        </div>
        <div className="rounded-lg bg-primary/10 p-4">
          <p className="text-muted-foreground text-sm">總額(含稅)</p>
          <p className="font-mono font-semibold text-2xl">${(quotation.totalGross ?? 0).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
