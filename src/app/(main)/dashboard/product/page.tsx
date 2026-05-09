"use client";

import { useState } from "react";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { ChevronRight } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { AdsTab } from "./_components/tabs/ads-tab";
import { AllTab } from "./_components/tabs/all-tab";
import { PackagesTab } from "./_components/tabs/packages-tab";
import { ServicesTab } from "./_components/tabs/services-tab";

const tabOptions = [
  { value: "all", label: "全部", href: "?tab=all" },
  { value: "iad", label: "自營廣告 (IAD)", href: "?tab=iad" },
  { value: "ext", label: "外媒 (EXT)", href: "?tab=ext" },
  { value: "svc", label: "服務 (SVC)", href: "?tab=svc" },
  { value: "pkg", label: "專案 (PKG)", href: "?tab=pkg" },
] as const;

export default function ProductPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabParam || "all");

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-2xl">產品中心</h1>
          <p className="text-muted-foreground">Product Catalog Management</p>
        </div>
        <nav className="flex items-center gap-2 text-muted-foreground text-sm">
          <Link href="/dashboard" className="transition-colors hover:text-foreground">
            Dashboard
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="font-medium text-foreground">產品中心</span>
        </nav>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between">
          <TabsList>
            {tabOptions.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <TabsContent value="all">
          <AllTab />
        </TabsContent>
        <TabsContent value="iad">
          <AdsTab mainCode="IAD" />
        </TabsContent>
        <TabsContent value="ext">
          <AdsTab mainCode="EXT" />
        </TabsContent>
        <TabsContent value="svc">
          <ServicesTab />
        </TabsContent>
        <TabsContent value="pkg">
          <PackagesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
