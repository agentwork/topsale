"use client";

import { useState } from "react";

import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";

interface TargetingSectionProps {
  targeting:
    | {
        id: string;
        quotationId: string;
        mediaCat: string[] | null;
        demoAge: string[] | null;
        demoGender: string | null;
        geoLocation: string[] | null;
        income: string[] | null;
        family: string[] | null;
        occupation: string[] | null;
        interests: string[] | null;
        fpSiteType: string | null;
        fpSiteUrl: string | null;
        fpAppCategory: string | null;
        fpApps: string | null;
        consumerData: string | null;
        interactAd: string | null;
        interactSite: string | null;
        interactApp: string | null;
        audiencePkg: string | null;
        crmAdid: string | null;
        contextKeywords: string | null;
        brandSafety: string | null;
        thirdPartyAudit: string[] | null;
        dataLoop: string[] | null;
      }
    | null
    | undefined;
  quotationId: string;
}

export function TargetingSection({ targeting, quotationId }: TargetingSectionProps) {
  const [formData, setFormData] = useState({
    mediaCat: targeting?.mediaCat || [],
    demoAge: targeting?.demoAge || [],
    demoGender: targeting?.demoGender || "",
    geoLocation: targeting?.geoLocation || [],
    income: targeting?.income || [],
    family: targeting?.family || [],
    occupation: targeting?.occupation || [],
    interests: targeting?.interests || [],
    fpSiteType: targeting?.fpSiteType || "",
    fpSiteUrl: targeting?.fpSiteUrl || "",
    fpAppCategory: targeting?.fpAppCategory || "",
    fpApps: targeting?.fpApps || "",
    consumerData: targeting?.consumerData || "",
    interactAd: targeting?.interactAd || "",
    interactSite: targeting?.interactSite || "",
    interactApp: targeting?.interactApp || "",
    audiencePkg: targeting?.audiencePkg || "",
    crmAdid: targeting?.crmAdid || "",
    contextKeywords: targeting?.contextKeywords || "",
    brandSafety: targeting?.brandSafety || "",
    thirdPartyAudit: targeting?.thirdPartyAudit || [],
    dataLoop: targeting?.dataLoop || [],
  });

  const upsertMutation = trpc.quotation.targeting.upsert.useMutation({
    onSuccess: () => {
      toast.success("投放條件已儲存");
    },
    onError: (error) => {
      toast.error(`儲存失敗：${error.message}`);
    },
  });

  const handleSave = () => {
    upsertMutation.mutate({
      quotationId,
      ...formData,
    });
  };

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">投放條件</h3>
        <Button onClick={handleSave} disabled={upsertMutation.isPending}>
          {upsertMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          儲存
        </Button>
      </div>

      <div className="space-y-6">
        <div>
          <h4 className="mb-2 font-medium text-sm">媒體類別</h4>
          <Textarea
            placeholder="請輸入媒體類別（逗號分隔）"
            value={formData.mediaCat.join(", ")}
            onChange={(e) =>
              setFormData({
                ...formData,
                mediaCat: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>性別</Label>
            <Select value={formData.demoGender} onValueChange={(v) => setFormData({ ...formData, demoGender: v })}>
              <SelectTrigger>
                <SelectValue placeholder="請選擇" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M">男</SelectItem>
                <SelectItem value="F">女</SelectItem>
                <SelectItem value="ALL">不限</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>年齡層</Label>
            <Textarea
              placeholder="請輸入年齡層（逗號分隔）"
              value={formData.demoAge.join(", ")}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  demoAge: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>地區</Label>
            <Textarea
              placeholder="請輸入地區（逗號分隔）"
              value={formData.geoLocation.join(", ")}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  geoLocation: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>收入</Label>
            <Textarea
              placeholder="請輸入收入層級（逗號分隔）"
              value={formData.income.join(", ")}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  income: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>家庭狀況</Label>
            <Textarea
              placeholder="請輸入家庭狀況（逗號分隔）"
              value={formData.family.join(", ")}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  family: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>職業</Label>
            <Textarea
              placeholder="請輸入職業（逗號分隔）"
              value={formData.occupation.join(", ")}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  occupation: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>興趣</Label>
          <Textarea
            placeholder="請輸入興趣（逗號分隔）"
            value={formData.interests.join(", ")}
            onChange={(e) =>
              setFormData({
                ...formData,
                interests: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
          />
        </div>

        <div className="space-y-2">
          <Label>足跡 - 網站類型</Label>
          <Input
            value={formData.fpSiteType}
            onChange={(e) => setFormData({ ...formData, fpSiteType: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>足跡 - 網站 URL</Label>
          <Input value={formData.fpSiteUrl} onChange={(e) => setFormData({ ...formData, fpSiteUrl: e.target.value })} />
        </div>

        <div className="space-y-2">
          <Label>足跡 - App 類別</Label>
          <Input
            value={formData.fpAppCategory}
            onChange={(e) => setFormData({ ...formData, fpAppCategory: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>足跡 - Apps</Label>
          <Input value={formData.fpApps} onChange={(e) => setFormData({ ...formData, fpApps: e.target.value })} />
        </div>

        <div className="space-y-2">
          <Label>消費行為</Label>
          <Textarea
            value={formData.consumerData}
            onChange={(e) => setFormData({ ...formData, consumerData: e.target.value })}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>互動 - 廣告</Label>
            <Input
              value={formData.interactAd}
              onChange={(e) => setFormData({ ...formData, interactAd: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>互動 - 網站</Label>
            <Input
              value={formData.interactSite}
              onChange={(e) => setFormData({ ...formData, interactSite: e.target.value })}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>互動 - App</Label>
            <Input
              value={formData.interactApp}
              onChange={(e) => setFormData({ ...formData, interactApp: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>受眾包</Label>
            <Input
              value={formData.audiencePkg}
              onChange={(e) => setFormData({ ...formData, audiencePkg: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>CRM ADID</Label>
          <Input value={formData.crmAdid} onChange={(e) => setFormData({ ...formData, crmAdid: e.target.value })} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>內文關鍵字</Label>
            <Input
              value={formData.contextKeywords}
              onChange={(e) => setFormData({ ...formData, contextKeywords: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>品牌安全</Label>
            <Input
              value={formData.brandSafety}
              onChange={(e) => setFormData({ ...formData, brandSafety: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>第三方驗證</Label>
          <Textarea
            placeholder="請輸入第三方驗證（逗號分隔）"
            value={formData.thirdPartyAudit.join(", ")}
            onChange={(e) =>
              setFormData({
                ...formData,
                thirdPartyAudit: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
          />
        </div>

        <div className="space-y-2">
          <Label>Data Loop</Label>
          <Textarea
            placeholder="請輸入 Data Loop（逗號分隔）"
            value={formData.dataLoop.join(", ")}
            onChange={(e) =>
              setFormData({
                ...formData,
                dataLoop: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
          />
        </div>
      </div>
    </div>
  );
}
