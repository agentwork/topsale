"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { ArrowLeft, Check } from "lucide-react";

import { Button } from "@/components/ui/button";

import { Step1BasicInfo } from "../_components/wizard/step1-basic-info";
import { Step2ProductItems } from "../_components/wizard/step2-product-items";
import { Step3Targeting } from "../_components/wizard/step3-targeting";
import { Step4Confirmation } from "../_components/wizard/step4-confirmation";

const steps = [
  { id: 1, title: "基本資料" },
  { id: 2, title: "產品選品" },
  { id: 3, title: "投放條件" },
  { id: 4, title: "確認送出" },
];

export default function NewQuotationPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [quotationId, setQuotationId] = useState<string | null>(null);

  const handleStep1Complete = (id: string) => {
    setQuotationId(id);
    setCurrentStep(2);
  };

  const handleStep2Complete = () => {
    setCurrentStep(3);
  };

  const handleStep3Complete = () => {
    setCurrentStep(4);
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/quotation")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="font-semibold text-2xl">新增報價單</h1>
          <p className="text-muted-foreground">New Quotation</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full font-medium text-sm ${
                step.id < currentStep
                  ? "bg-primary text-primary-foreground"
                  : step.id === currentStep
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {step.id < currentStep ? <Check className="h-4 w-4" /> : step.id}
            </div>
            <span
              className={`text-sm ${step.id <= currentStep ? "font-medium text-foreground" : "text-muted-foreground"}`}
            >
              {step.title}
            </span>
            {index < steps.length - 1 && <div className="h-px w-8 bg-border" />}
          </div>
        ))}
      </div>

      <div className="rounded-lg border bg-card p-6">
        {currentStep === 1 && <Step1BasicInfo onComplete={handleStep1Complete} />}
        {currentStep === 2 && quotationId && (
          <Step2ProductItems quotationId={quotationId} onComplete={handleStep2Complete} />
        )}
        {currentStep === 3 && quotationId && (
          <Step3Targeting quotationId={quotationId} onComplete={handleStep3Complete} />
        )}
        {currentStep === 4 && quotationId && <Step4Confirmation quotationId={quotationId} />}
      </div>
    </div>
  );
}
