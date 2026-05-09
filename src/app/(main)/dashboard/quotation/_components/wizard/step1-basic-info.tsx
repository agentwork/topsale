"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";

interface Step1BasicInfoProps {
  onComplete: (id: string) => void;
}

export function Step1BasicInfo({ onComplete }: Step1BasicInfoProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    campaignName: "",
    quotationDate: new Date().toISOString().split("T")[0],
    agencyId: "",
    customerId: "",
    brandIds: [] as string[],
    ownerId: "",
    contactPhone: "",
    isRushOrder: false,
    isSpecialCase: false,
  });

  const { data: agencies } = trpc.crm.accounts.list.useQuery({
    accountType: "agency",
    pageSize: 100,
  });

  const { data: customers } = trpc.crm.accounts.list.useQuery({
    accountType: "client",
    pageSize: 100,
  });

  const { data: allBrands } = trpc.crm.brands.list.useQuery({
    pageSize: 100,
  });

  const createMutation = trpc.quotation.quotations.create.useMutation({
    onSuccess: (result) => {
      if (result && result.length > 0) {
        toast.success("報價單已建立");
        onComplete(result[0].id);
      }
    },
    onError: (error) => {
      toast.error(`建立失敗：${error.message}`);
    },
  });

  const filteredBrands = formData.customerId
    ? allBrands?.data.filter((b) => b.accountId === formData.customerId)
    : allBrands?.data;

  const handleSubmit = () => {
    if (!formData.campaignName) {
      toast.error("Campaign Name 為必填");
      return;
    }
    if (!formData.customerId) {
      toast.error("請選擇客戶");
      return;
    }
    if (formData.brandIds.length === 0) {
      toast.error("請至少選擇一個品牌");
      return;
    }

    createMutation.mutate({
      campaignName: formData.campaignName,
      quotationDate: formData.quotationDate,
      agencyId: formData.agencyId || null,
      customerId: formData.customerId,
      brandIds: formData.brandIds,
      ownerId: formData.ownerId || null,
      contactPhone: formData.contactPhone || undefined,
      isRushOrder: formData.isRushOrder,
      isSpecialCase: formData.isSpecialCase,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold text-lg">STEP 1: 基本資料</h2>
        <p className="text-muted-foreground text-sm">填寫報價單基本資訊</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Campaign Name *</Label>
          <Input
            value={formData.campaignName}
            onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
            placeholder="請輸入 Campaign 名稱"
          />
        </div>

        <div className="space-y-2">
          <Label>報價日期 *</Label>
          <Input
            type="date"
            value={formData.quotationDate}
            onChange={(e) => setFormData({ ...formData, quotationDate: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>代理商</Label>
          <Select value={formData.agencyId} onValueChange={(v) => setFormData({ ...formData, agencyId: v })}>
            <SelectTrigger>
              <SelectValue placeholder="請選擇代理商（選填）" />
            </SelectTrigger>
            <SelectContent>
              {agencies?.data.map((agency) => (
                <SelectItem key={agency.id} value={agency.id}>
                  {agency.accountName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>客戶 *</Label>
          <Select
            value={formData.customerId}
            onValueChange={(v) => setFormData({ ...formData, customerId: v, brandIds: [] })}
          >
            <SelectTrigger>
              <SelectValue placeholder="請選擇客戶" />
            </SelectTrigger>
            <SelectContent>
              {customers?.data.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.accountName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>品牌 *</Label>
          <Select value={formData.brandIds[0] || ""} onValueChange={(v) => setFormData({ ...formData, brandIds: [v] })}>
            <SelectTrigger>
              <SelectValue placeholder="請選擇品牌" />
            </SelectTrigger>
            <SelectContent>
              {filteredBrands?.map((brand) => (
                <SelectItem key={brand.id} value={brand.id}>
                  {brand.brandName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>聯絡電話</Label>
          <Input
            value={formData.contactPhone}
            onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
            placeholder="請輸入聯絡電話"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.isRushOrder}
            onChange={(e) => setFormData({ ...formData, isRushOrder: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300"
          />
          <span className="text-sm">急單</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.isSpecialCase}
            onChange={(e) => setFormData({ ...formData, isSpecialCase: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300"
          />
          <span className="text-sm">特例案件</span>
        </label>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.push("/dashboard/quotation")}>
          取消
        </Button>
        <Button onClick={handleSubmit} disabled={createMutation.isPending}>
          {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          下一步
        </Button>
      </div>
    </div>
  );
}
