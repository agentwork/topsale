"use client";

import { useState } from "react";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";

interface Step3TargetingProps {
  quotationId: string;
  onComplete: () => void;
}

const mediaCatOptions = [
  { id: "display", label: "展示廣告" },
  { id: "video", label: "影片廣告" },
  { id: "mobile", label: "行動廣告" },
  { id: "social", label: "社群廣告" },
];

const demoAgeOptions = [
  { id: "18-24", label: "18-24 歲" },
  { id: "25-34", label: "25-34 歲" },
  { id: "35-44", label: "35-44 歲" },
  { id: "45-54", label: "45-54 歲" },
  { id: "55+", label: "55 歲以上" },
];

const geoOptions = [
  { id: "taipei", label: "台北市" },
  { id: "new-taipei", label: "新北市" },
  { id: "taoyuan", label: "桃園市" },
  { id: "taichung", label: "台中市" },
  { id: "tainan", label: "台南市" },
  { id: "kaohsiung", label: "高雄市" },
];

const incomeOptions = [
  { id: "low", label: "30K 以下" },
  { id: "medium", label: "30K-60K" },
  { id: "high", label: "60K-100K" },
  { id: "very-high", label: "100K 以上" },
];

const interestOptions = [
  { id: "tech", label: "科技" },
  { id: "fashion", label: "時尚" },
  { id: "travel", label: "旅遊" },
  { id: "food", label: "美食" },
  { id: "finance", label: "財經" },
  { id: "sports", label: "運動" },
];

export function Step3Targeting({ quotationId, onComplete }: Step3TargetingProps) {
  const [formData, setFormData] = useState({
    mediaCat: [] as string[],
    demoAge: [] as string[],
    demoGender: "",
    geoLocation: [] as string[],
    income: [] as string[],
    family: [] as string[],
    interests: [] as string[],
    fpSiteType: "",
    fpSiteUrl: "",
    fpAppCategory: "",
    fpApps: "",
    consumerData: "",
    interactAd: "",
    interactSite: "",
    interactApp: "",
    audiencePkg: "",
    crmAdid: "",
    contextKeywords: "",
    brandSafety: "",
    thirdPartyAudit: [] as string[],
    dataLoop: [] as string[],
  });

  const upsertMutation = trpc.quotation.targeting.upsert.useMutation({
    onSuccess: () => {
      toast.success("投放條件已儲存");
      onComplete();
    },
    onError: (error) => {
      toast.error(`儲存失敗：${error.message}`);
    },
  });

  const handleCheckboxToggle = (field: string, value: string) => {
    setFormData((prev) => {
      const current = prev[field as keyof typeof prev] as string[];
      return {
        ...prev,
        [field]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
      };
    });
  };

  const handleSave = () => {
    upsertMutation.mutate({
      quotationId,
      ...formData,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 font-semibold text-lg">媒體類別</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {mediaCatOptions.map((option) => (
            <div key={option.id} className="flex items-center gap-2">
              <Checkbox
                id={`media-${option.id}`}
                checked={formData.mediaCat.includes(option.id)}
                onCheckedChange={() => handleCheckboxToggle("mediaCat", option.id)}
              />
              <Label htmlFor={`media-${option.id}`}>{option.label}</Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-4 font-semibold text-lg">人口統計</h3>
        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">年齡層</Label>
            <div className="grid gap-3 md:grid-cols-3">
              {demoAgeOptions.map((option) => (
                <div key={option.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`age-${option.id}`}
                    checked={formData.demoAge.includes(option.id)}
                    onCheckedChange={() => handleCheckboxToggle("demoAge", option.id)}
                  />
                  <Label htmlFor={`age-${option.id}`}>{option.label}</Label>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label className="mb-2 block">性別</Label>
            <div className="flex gap-4">
              {["male", "female", "all"].map((gender) => (
                <Button
                  key={gender}
                  variant={formData.demoGender === gender ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFormData((prev) => ({ ...prev, demoGender: gender }))}
                >
                  {gender === "male" ? "男性" : gender === "female" ? "女性" : "不限"}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 font-semibold text-lg">地理位置</h3>
        <div className="grid gap-3 md:grid-cols-3">
          {geoOptions.map((option) => (
            <div key={option.id} className="flex items-center gap-2">
              <Checkbox
                id={`geo-${option.id}`}
                checked={formData.geoLocation.includes(option.id)}
                onCheckedChange={() => handleCheckboxToggle("geoLocation", option.id)}
              />
              <Label htmlFor={`geo-${option.id}`}>{option.label}</Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-4 font-semibold text-lg">收入與家庭</h3>
        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">收入區間</Label>
            <div className="grid gap-3 md:grid-cols-2">
              {incomeOptions.map((option) => (
                <div key={option.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`income-${option.id}`}
                    checked={formData.income.includes(option.id)}
                    onCheckedChange={() => handleCheckboxToggle("income", option.id)}
                  />
                  <Label htmlFor={`income-${option.id}`}>{option.label}</Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 font-semibold text-lg">興趣標籤</h3>
        <div className="grid gap-3 md:grid-cols-3">
          {interestOptions.map((option) => (
            <div key={option.id} className="flex items-center gap-2">
              <Checkbox
                id={`interest-${option.id}`}
                checked={formData.interests.includes(option.id)}
                onCheckedChange={() => handleCheckboxToggle("interests", option.id)}
              />
              <Label htmlFor={`interest-${option.id}`}>{option.label}</Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-4 font-semibold text-lg">第一方數據</h3>
        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">網站類型</Label>
            <input
              className="w-full rounded-md border bg-background p-2 text-sm"
              value={formData.fpSiteType}
              onChange={(e) => setFormData((prev) => ({ ...prev, fpSiteType: e.target.value }))}
              placeholder="例如：電商、新聞、娛樂"
            />
          </div>
          <div>
            <Label className="mb-2 block">網站 URL</Label>
            <input
              className="w-full rounded-md border bg-background p-2 text-sm"
              value={formData.fpSiteUrl}
              onChange={(e) => setFormData((prev) => ({ ...prev, fpSiteUrl: e.target.value }))}
              placeholder="https://example.com"
            />
          </div>
          <div>
            <Label className="mb-2 block">App 類別</Label>
            <input
              className="w-full rounded-md border bg-background p-2 text-sm"
              value={formData.fpAppCategory}
              onChange={(e) => setFormData((prev) => ({ ...prev, fpAppCategory: e.target.value }))}
              placeholder="例如：購物、社交、遊戲"
            />
          </div>
          <div>
            <Label className="mb-2 block">App 名稱</Label>
            <input
              className="w-full rounded-md border bg-background p-2 text-sm"
              value={formData.fpApps}
              onChange={(e) => setFormData((prev) => ({ ...prev, fpApps: e.target.value }))}
              placeholder="多個 App 以逗號分隔"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 font-semibold text-lg">受眾數據</h3>
        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">消費者數據</Label>
            <Textarea
              value={formData.consumerData}
              onChange={(e) => setFormData((prev) => ({ ...prev, consumerData: e.target.value }))}
              placeholder="描述目標受眾特徵"
              rows={3}
            />
          </div>
          <div>
            <Label className="mb-2 block">受眾包</Label>
            <input
              className="w-full rounded-md border bg-background p-2 text-sm"
              value={formData.audiencePkg}
              onChange={(e) => setFormData((prev) => ({ ...prev, audiencePkg: e.target.value }))}
              placeholder="受眾包名稱或 ID"
            />
          </div>
          <div>
            <Label className="mb-2 block">CRM AdID</Label>
            <input
              className="w-full rounded-md border bg-background p-2 text-sm"
              value={formData.crmAdid}
              onChange={(e) => setFormData((prev) => ({ ...prev, crmAdid: e.target.value }))}
              placeholder="CRM 廣告識別碼"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 font-semibold text-lg">情境關鍵字</h3>
        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">關鍵字列表</Label>
            <Textarea
              value={formData.contextKeywords}
              onChange={(e) => setFormData((prev) => ({ ...prev, contextKeywords: e.target.value }))}
              placeholder="每行一個關鍵字"
              rows={3}
            />
          </div>
          <div>
            <Label className="mb-2 block">品牌安全</Label>
            <input
              className="w-full rounded-md border bg-background p-2 text-sm"
              value={formData.brandSafety}
              onChange={(e) => setFormData((prev) => ({ ...prev, brandSafety: e.target.value }))}
              placeholder="品牌安全設定"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <Button onClick={handleSave} disabled={upsertMutation.isPending}>
          {upsertMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          儲存並繼續
        </Button>
      </div>
    </div>
  );
}
