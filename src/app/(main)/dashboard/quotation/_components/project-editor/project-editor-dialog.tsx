"use client";

import { useState } from "react";

import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";

interface ProjectEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotationId: string;
  onComplete: () => void;
}

export function ProjectEditorDialog({ open, onOpenChange, quotationId, onComplete }: ProjectEditorDialogProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [bonusItems, setBonusItems] = useState<{ id: string; ratio: number }[]>([]);

  const { data: products } = trpc.product.products.list.useQuery({
    mainCode: "PKG",
    status: "published",
    pageSize: 100,
  });

  const addLineItemMutation = trpc.quotation.lineItems.create.useMutation({
    onSuccess: () => {
      toast.success("已新增品項");
    },
    onError: (error) => {
      toast.error(`新增失敗：${error.message}`);
    },
  });

  const handleToggleItem = (productId: string) => {
    setSelectedItems((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    );
  };

  const handleAddBonus = (productId: string) => {
    setBonusItems((prev) => [...prev, { id: productId, ratio: 10 }]);
  };

  const handleSave = () => {
    selectedItems.forEach((productId) => {
      const product = products?.data.find((p) => p.id === productId);
      if (product) {
        addLineItemMutation.mutate({
          quotationId,
          productId,
          displayName: product.productName,
          startDate: new Date().toISOString().split("T")[0],
          endDate: new Date().toISOString().split("T")[0],
          days: 1,
          unitPrice: product.unitPrice,
          budget: product.unitPrice,
        });
      }
    });

    toast.success("專案品項已儲存");
    onOpenChange(false);
    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>專案編輯器</DialogTitle>
          <DialogDescription>選擇必選品項、選配品項及贈送品項</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <h3 className="mb-2 font-semibold">必選品項</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]" />
                  <TableHead>產品名稱</TableHead>
                  <TableHead className="w-[100px] text-right">單價</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products?.data
                  .filter((p) => p.subCategory === "required")
                  .map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Checkbox checked disabled />
                      </TableCell>
                      <TableCell className="font-medium">{product.productName}</TableCell>
                      <TableCell className="text-right font-mono">${product.unitPrice.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>

          <div>
            <h3 className="mb-2 font-semibold">選配品項</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]" />
                  <TableHead>產品名稱</TableHead>
                  <TableHead className="w-[100px] text-right">單價</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products?.data
                  .filter((p) => p.subCategory === "optional")
                  .map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedItems.includes(product.id)}
                          onCheckedChange={() => handleToggleItem(product.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{product.productName}</TableCell>
                      <TableCell className="text-right font-mono">${product.unitPrice.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>

          <div>
            <h3 className="mb-2 font-semibold">贈送品項</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]" />
                  <TableHead>產品名稱</TableHead>
                  <TableHead className="w-[100px] text-right">贈送比例</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {bonusItems.map((bonus) => {
                  const product = products?.data.find((p) => p.id === bonus.id);
                  if (!product) return null;
                  return (
                    <TableRow key={bonus.id}>
                      <TableCell>
                        <Checkbox checked disabled />
                      </TableCell>
                      <TableCell className="font-medium">{product.productName}</TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          value={bonus.ratio}
                          onChange={(e) =>
                            setBonusItems((prev) =>
                              prev.map((b) =>
                                b.id === bonus.id ? { ...b, ratio: parseInt(e.target.value, 10) || 0 } : b,
                              ),
                            )
                          }
                          className="w-20 text-right"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setBonusItems((prev) => prev.filter((b) => b.id !== bonus.id))}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => {
                const optional = products?.data.find((p) => p.subCategory === "optional");
                if (optional) handleAddBonus(optional.id);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              新增贈送品項
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={addLineItemMutation.isPending}>
            {addLineItemMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            儲存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
