"use client";

import { useEffect } from "react";

import { useParams, useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2 } from "lucide-react";
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
  productCode: z.string(),
  ragicId: z.string(),
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

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
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
    },
    mode: "onBlur",
  });

  const { data: product, isLoading } = trpc.product.products.getById.useQuery({ id });

  const updateMutation = trpc.product.products.update.useMutation({
    onSuccess: () => {
      toast.success("產品更新成功");
      router.push(`/dashboard/product/${id}`);
    },
    onError: (error) => {
      toast.error(`更新失敗：${error.message}`);
    },
  });

  useEffect(() => {
    if (product) {
      form.reset({
        productCode: product.productCode || "",
        ragicId: product.ragicId || "",
        mainCode: product.mainCode as FormValues["mainCode"],
        subCategory: product.subCategory,
        productName: product.productName,
        productNameEn: product.productNameEn || "",
        description: product.description || "",
        pricingUnit: product.pricingUnit as FormValues["pricingUnit"],
        unitPrice: product.unitPrice,
        priority: product.priority || 0,
        startDate: product.startDate || "",
        endDate: product.endDate || "",
      });
    }
  }, [product, form]);

  const onSubmit = (values: FormValues) => {
    updateMutation.mutate({
      id,
      data: {
        productName: values.productName,
        productNameEn: values.productNameEn || undefined,
        description: values.description || undefined,
        pricingUnit: values.pricingUnit,
        unitPrice: values.unitPrice,
        priority: values.priority,
        startDate: values.startDate || undefined,
        endDate: values.endDate || undefined,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/dashboard/product/${id}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="font-bold text-2xl tracking-tight">編輯產品</h1>
          <p className="text-muted-foreground text-sm">更新產品資訊</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">產品資料</CardTitle>
        </CardHeader>
        <CardContent>
          <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>產品編號</FieldLabel>
                <Input {...form.register("productCode")} disabled />
              </Field>
              <Field>
                <FieldLabel>Ragic 編號</FieldLabel>
                <Input {...form.register("ragicId")} disabled />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>主代碼</FieldLabel>
                <Select
                  value={form.watch("mainCode")}
                  onValueChange={(v) => form.setValue("mainCode", v as FormValues["mainCode"])}
                  disabled
                >
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
              </Field>
              <Field>
                <FieldLabel>銷售子類別</FieldLabel>
                <Input {...form.register("subCategory")} disabled />
              </Field>
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
              <Button type="button" variant="outline" onClick={() => router.push(`/dashboard/product/${id}`)}>
                取消
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                儲存
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
