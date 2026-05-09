"use client";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";

const mainCodeOptions = [
  { value: "IAD", label: "自營廣告 (IAD)" },
  { value: "ISY", label: "系統 (ISY)" },
  { value: "EXT", label: "外媒 (EXT)" },
  { value: "SVC", label: "服務 (SVC)" },
  { value: "PKG", label: "專案 (PKG)" },
] as const;

const pricingUnitOptions = [
  { value: "CPM", label: "CPM" },
  { value: "CPC", label: "CPC" },
  { value: "CPV", label: "CPV" },
  { value: "案", label: "案" },
  { value: "篇", label: "篇" },
  { value: "人", label: "人" },
  { value: "每一尺寸", label: "每一尺寸" },
  { value: "小時", label: "小時" },
  { value: "式", label: "式" },
] as const;

const formSchema = z.object({
  productCode: z.string().optional(),
  ragicId: z.string().optional(),
  mainCode: z.enum(["IAD", "ISY", "EXT", "SVC", "PKG"]),
  subCategory: z.string().min(1, "請輸入銷售子類別"),
  productName: z.string().min(1, "請輸入產品名稱"),
  productNameEn: z.string().optional(),
  description: z.string().optional(),
  pricingUnit: z.enum(["CPM", "CPC", "CPV", "案", "篇", "人", "每一尺寸", "小時", "式"]),
  unitPrice: z.number().int().min(0, "單價不可為負數"),
  priority: z.number().int().min(0),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const defaultValues: FormValues = {
  productCode: "",
  ragicId: "",
  mainCode: "IAD",
  subCategory: "",
  productName: "",
  productNameEn: "",
  description: "",
  pricingUnit: "CPM",
  unitPrice: 0,
  priority: 0,
  startDate: "",
  endDate: "",
};

export default function NewProductPage() {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: "onBlur",
  });

  const createMutation = trpc.product.products.create.useMutation({
    onSuccess: (data) => {
      toast.success("產品建立成功");
      router.push(`/dashboard/product/${data[0].id}`);
    },
    onError: (error) => {
      toast.error(`建立失敗：${error.message}`);
    },
  });

  const onSubmit = (values: FormValues) => {
    createMutation.mutate({
      productCode: values.productCode || undefined,
      ragicId: values.ragicId || undefined,
      mainCode: values.mainCode,
      subCategory: values.subCategory,
      productName: values.productName,
      productNameEn: values.productNameEn || undefined,
      description: values.description || undefined,
      pricingUnit: values.pricingUnit,
      unitPrice: values.unitPrice,
      priority: values.priority,
      startDate: values.startDate || undefined,
      endDate: values.endDate || undefined,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          ←
        </Button>
        <div>
          <h1 className="font-bold text-2xl tracking-tight">新增產品</h1>
          <p className="text-muted-foreground text-sm">建立新的產品項目</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">產品資料</CardTitle>
        </CardHeader>
        <CardContent>
          <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="productCode"
                render={({ field }) => (
                  <Field>
                    <FieldLabel>產品編號</FieldLabel>
                    <Input {...field} placeholder="新制結構化 ID" />
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="ragicId"
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Ragic 編號</FieldLabel>
                    <Input {...field} placeholder="舊系統編號對照" />
                  </Field>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="mainCode"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>
                      主代碼 <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {mainCodeOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="subCategory"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>
                      銷售子類別 <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input {...field} placeholder="如：PMP, PCN, Google, 口碑, 設計" />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="productName"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>
                      產品名稱 <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input {...field} placeholder="輸入產品名稱" />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="productNameEn"
                render={({ field }) => (
                  <Field>
                    <FieldLabel>英文名稱</FieldLabel>
                    <Input {...field} placeholder="English name (optional)" />
                  </Field>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Controller
                control={form.control}
                name="pricingUnit"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>
                      計價單位 <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {pricingUnitOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="unitPrice"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>
                      單價 <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      type="number"
                      {...field}
                      value={field.value}
                      onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <Field>
                    <FieldLabel>優先順序</FieldLabel>
                    <Input
                      type="number"
                      {...field}
                      value={field.value}
                      onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                    />
                  </Field>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <Field>
                    <FieldLabel>生效日</FieldLabel>
                    <Input type="date" {...field} />
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <Field>
                    <FieldLabel>失效日</FieldLabel>
                    <Input type="date" {...field} />
                  </Field>
                )}
              />
            </div>

            <Controller
              control={form.control}
              name="description"
              render={({ field }) => (
                <Field>
                  <FieldLabel>產品描述</FieldLabel>
                  <Textarea {...field} placeholder="輸入產品描述 (可選)" className="min-h-[100px]" />
                </Field>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                取消
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                建立
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
