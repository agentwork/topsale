"use client";

import { useState } from "react";

import { useSearchParams } from "next/navigation";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { AccountsTab } from "./_components/tabs/accounts-tab";
import { BrandsTab } from "./_components/tabs/brands-tab";
import { ContactsTab } from "./_components/tabs/contacts-tab";
import { GroupsTab } from "./_components/tabs/groups-tab";
import { InteractionsTab } from "./_components/tabs/interactions-tab";

export default function CrmPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabParam || "groups");

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-semibold text-2xl">CRM</h1>
        <p className="text-muted-foreground">客戶關係管理系統</p>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="groups">集團</TabsTrigger>
          <TabsTrigger value="accounts">客戶</TabsTrigger>
          <TabsTrigger value="brands">品牌</TabsTrigger>
          <TabsTrigger value="contacts">聯絡人</TabsTrigger>
          <TabsTrigger value="interactions">互動紀錄</TabsTrigger>
        </TabsList>
        <TabsContent value="accounts">
          <AccountsTab />
        </TabsContent>
        <TabsContent value="brands">
          <BrandsTab />
        </TabsContent>
        <TabsContent value="contacts">
          <ContactsTab />
        </TabsContent>
        <TabsContent value="groups">
          <GroupsTab />
        </TabsContent>
        <TabsContent value="interactions">
          <InteractionsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
