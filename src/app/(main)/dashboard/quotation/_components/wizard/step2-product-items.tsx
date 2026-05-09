"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";

interface Step2ProductItemsProps {
  quotationId: string;
  onComplete?: () => void;
}

export function Step2ProductItems({ quotationId, onComplete }: Step2ProductItemsProps) {
  const router = useRouter();
  const [mainCode, setMainCode] = useState<string>("");
  const [subCategory, setSubCategory] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budget, setBudget] = useState("");

  const { data: products } = trpc.product.products.list.useQuery({
    mainCode: mainCode as "IAD" | "ISY" | "EXT" | "SVC" | "PKG" | undefined,
    status: "published",
    pageSize: 100,
  });

  const { data: lineItems } = trpc.quotation.lineItems.getByQuotation.useQuery({
    quotationId,
  });

  const { data: quotation } = trpc.quotation.quotations.getById.useQuery({ id: quotationId });

  const addLineItemMutation = trpc.quotation.lineItems.create.useMutation({
    onSuccess: () => {
      toast.success("已新增品項");
      setMainCode("");
      setSubCategory("");
      setStartDate("");
      setEndDate("");
      setBudget("");
    },
    onError: (error) => {
      toast.error(`新增失敗：${error.message}`);
    },
  });

  const deleteLineItemMutation = trpc.quotation.lineItems.delete.useMutation({
    onSuccess: () => {
      toast.success("已刪除品項");
    },
    onError: (error) => {
      toast.error(`刪除失敗：${error.message}`);
    },
  });

  const filteredProducts = subCategory ? products?.data.filter((p) => p.subCategory === subCategory) : products?.data;

  const handleAddItem = () => {
    if (!mainCode) {
      toast.error("請選擇主類別");
      return;
    }
    if (!subCategory) {
      toast.error("請選擇子類別");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("請選擇走期");
      return;
    }
    if (!budget || parseInt(budget, 10) <= 0) {
      toast.error("請輸入有效預算");
      return;
    }

    const product = filteredProducts?.[0];
    if (!product) {
      toast.error("找不到對應產品");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    addLineItemMutation.mutate({
      quotationId,
      productId: product.id,
      displayName: product.productName,
      startDate,
      endDate,
      days,
      unitPrice: product.unitPrice,
      budget: parseInt(budget, 10),
    });
  };

  const handleFinish = () => {
    toast.success("報價單已建立完成");
    router.push(`/dashboard/quotation/${quotationId}`);
  };

  const days =
    startDate && endDate
      ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold text-lg">STEP 2: 產品選品</h2>
        <p className="text-muted-foreground text-sm">選擇產品並設定走期與預算</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label>主類別 *</Label>
          <Select
            value={mainCode}
            onValueChange={(v) => {
              setMainCode(v);
              setSubCategory("");
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="請選擇" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="IAD">自營廣告 (IAD)</SelectItem>
              <SelectItem value="EXT">外媒 (EXT)</SelectItem>
              <SelectItem value="SVC">服務 (SVC)</SelectItem>
              <SelectItem value="PKG">專案 (PKG)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>子類別 *</Label>
          <Select value={subCategory} onValueChange={setSubCategory}>
            <SelectTrigger>
              <SelectValue placeholder="請選擇" />
            </SelectTrigger>
            <SelectContent>
              {products?.data
                .filter((p) => p.mainCode === mainCode)
                .map((p) => p.subCategory)
                .filter((v, i, a) => a.indexOf(v) === i)
                .map((sub) => (
                  <SelectItem key={sub} value={sub}>
                    {sub}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>走期起 *</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label>走期訖 *</Label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label>天數</Label>
          <Input value={days > 0 ? `${days} 天` : "-"} disabled />
        </div>

        <div className="space-y-2">
          <Label>預算 *</Label>
          <Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="請輸入預算" />
        </div>
      </div>

      <Button onClick={handleAddItem} disabled={addLineItemMutation.isPending}>
        {addLineItemMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        <Plus className="mr-2 h-4 w-4" />
        新增品項
      </Button>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>產品名稱</TableHead>
              <TableHead className="w-[120px]">走期起</TableHead>
              <TableHead className="w-[120px]">走期訖</TableHead>
              <TableHead className="w-[80px]">天數</TableHead>
              <TableHead className="w-[120px] text-right">預算</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {!lineItems?.length ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  尚未新增品項
                </TableCell>
              </TableRow>
            ) : (
              lineItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.displayName}</TableCell>
                  <TableCell className="text-xs">{item.startDate}</TableCell>
                  <TableCell className="text-xs">{item.endDate}</TableCell>
                  <TableCell>{item.days}</TableCell>
                  <TableCell className="text-right font-mono">${item.budget.toLocaleString()}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteLineItemMutation.mutate({ id: item.id, quotationId })}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {quotation && (
        <div className="rounded-lg border bg-muted p-4">
          <div className="grid gap-2 md:grid-cols-3">
            <div>
              <p className="text-muted-foreground text-sm">小計(未稅)</p>
              <p className="font-mono font-semibold text-lg">${quotation.subtotalNet?.toLocaleString() ?? 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">稅額 (5%)</p>
              <p className="font-mono font-semibold text-lg">${quotation.taxAmount?.toLocaleString() ?? 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">總額(含稅)</p>
              <p className="font-mono font-semibold text-lg">${quotation.totalGross?.toLocaleString() ?? 0}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.push("/dashboard/quotation")}>
          取消
        </Button>
        <Button onClick={onComplete || handleFinish}>下一步</Button>
      </div>
    </div>
  );
}
