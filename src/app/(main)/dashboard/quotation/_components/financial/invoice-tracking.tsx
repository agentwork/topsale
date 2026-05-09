"use client";

import { useState } from "react";

import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";

interface InvoiceTrackingProps {
  quotationId: string;
  totalGross: number;
}

export function InvoiceTracking({ quotationId, totalGross }: InvoiceTrackingProps) {
  const [estMonth, setEstMonth] = useState("");
  const [estAmount, setEstAmount] = useState("");

  const { data: invoicePlans } = trpc.quotation.invoices.getByQuotation.useQuery({
    quotationId,
  });

  const createMutation = trpc.quotation.invoices.create.useMutation({
    onSuccess: () => {
      toast.success("已新增發票計畫");
      setEstMonth("");
      setEstAmount("");
    },
    onError: (error) => {
      toast.error(`新增失敗：${error.message}`);
    },
  });

  const deleteMutation = trpc.quotation.invoices.delete.useMutation({
    onSuccess: () => {
      toast.success("已刪除發票計畫");
    },
    onError: (error) => {
      toast.error(`刪除失敗：${error.message}`);
    },
  });

  const handleAdd = () => {
    if (!estMonth) {
      toast.error("請輸入預計開立月份");
      return;
    }
    if (!estAmount || parseInt(estAmount, 10) <= 0) {
      toast.error("請輸入有效金額");
      return;
    }

    createMutation.mutate({
      quotationId,
      estMonth,
      estAmount: parseInt(estAmount, 10),
    });
  };

  const totalPlanned = invoicePlans?.reduce((sum, plan) => sum + plan.estAmount, 0) ?? 0;
  const remaining = totalGross - totalPlanned;

  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="mb-4 font-semibold">發票追蹤</h3>

      <div className="mb-4 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg bg-muted p-4">
          <p className="text-muted-foreground text-sm">總額(含稅)</p>
          <p className="font-mono font-semibold text-lg">${totalGross.toLocaleString()}</p>
        </div>
        <div className="rounded-lg bg-muted p-4">
          <p className="text-muted-foreground text-sm">已規劃金額</p>
          <p className="font-mono font-semibold text-lg">${totalPlanned.toLocaleString()}</p>
        </div>
        <div className="rounded-lg bg-muted p-4">
          <p className="text-muted-foreground text-sm">未規劃金額</p>
          <p className="font-mono font-semibold text-lg">${remaining.toLocaleString()}</p>
        </div>
      </div>

      <div className="mb-4 flex gap-4">
        <div className="flex-1 space-y-2">
          <Label>預計開立月份</Label>
          <Input type="month" value={estMonth} onChange={(e) => setEstMonth(e.target.value)} />
        </div>
        <div className="flex-1 space-y-2">
          <Label>預計開立金額</Label>
          <Input
            type="number"
            value={estAmount}
            onChange={(e) => setEstAmount(e.target.value)}
            placeholder="請輸入金額"
          />
        </div>
        <div className="flex items-end">
          <Button onClick={handleAdd} disabled={createMutation.isPending}>
            {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Plus className="mr-2 h-4 w-4" />
            新增
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>預計開立月份</TableHead>
            <TableHead className="text-right">預計開立金額</TableHead>
            <TableHead className="w-[60px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {!invoicePlans?.length ? (
            <TableRow>
              <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                尚未新增發票計畫
              </TableCell>
            </TableRow>
          ) : (
            invoicePlans.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell>{plan.estMonth}</TableCell>
                <TableCell className="text-right font-mono">${plan.estAmount.toLocaleString()}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate({ id: plan.id })}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
