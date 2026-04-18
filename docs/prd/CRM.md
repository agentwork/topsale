# 1. CRM Module

> **Editor:** VMFIVE Eunice
> **Version:** v1.0
> **Date:** 2026.03.06 (Update: 2026.04.13)

---

## 1. 模組定位

CRM（Customer Relationship Management）模組為 TopSale 系統中負責管理**客戶資訊、商業關係、銷售機會與互動紀錄**的核心模組。

本模組的主要目的在於建立一個**集中化、可追蹤、可分析的客戶資料庫**，協助公司有效管理客戶關係。

CRM 模組將整合以下功能：

- 客戶資料管理
- 客戶組織架構與聯絡人管理
- 客戶互動紀錄
- 商機管理

---

## 2. Data Model

### Core Data Entities

1. Group
2. Account (Company)
3. Brand
4. Contact
5. Contract (Agency Contract)

> 上傳文件附檔關聯於 Account

---

## 2.1 Group

Group 用於表示客戶所屬集團。

| 顯示欄位 (UI) | Schema Key | 規則 | 選項 | 備註 |
|--------------|-----------|------|------|------|
| 集團編號 | Group_ID | 數字，系統自動產生 | - | ex. 01, 02... |
| 集團名稱 | Group_Name | 必填，文字 | - | ex. 電通集團、宏盟集團... |

**關聯**

- Group 1:N Account

---

## 2.2 Account

Account 代表一個企業或組織單位。

**基本資料**

| 顯示欄位 (UI) | Schema Key | 規則 | 選項 | 備註 |
|--------------|-----------|------|------|------|
| 客戶編號 | Account_ID | 數字，系統自動產生 | - | - |
| 客戶名稱 | Account_Name | 必填，文字 | - | 有統編者寫公司完整抬頭<br>無統編者寫個人姓名 |
| 客戶簡稱 | Short_Name | 必填，文字 | - | - |
| 統一編號 | Tax_ID | TaxID or PersonalID 擇一必填，8 碼 | - | 公司統一編號 |
| 身分字號 | Personal_ID | TaxID or PersonalID 擇一必填，10 碼 | - | 無統編寫身分字號 |
| 地址 | Address | 必填，文字 | - | - |
| 集團名稱 | FK → Group_ID | 非必填，下拉式選單 | - | - |
| 類別 | Account_Type | 必填，Multi-select ENUM | Agency 代理商<br>Client 客戶 | - |
| 等級 | Agency_Tier | 必填，ENUM<br>（只有 Account_Type = Agency 才會使用） | Tier1 / Tier2 / Tier3 | 詳見下方說明 |
| 合約 | Contract | 非必填，附件檔案 | - | 有權限者才可看 |
| 負責業務 | Account_Owner | User ID | - | 業務有可能轉換，故要記錄 |
| 主要聯絡人 | - | 選擇該代理商旗下聯絡人 | - | - |
| 客戶偏好 | - | 非必填，Text | - | - |
| 客戶內部政治 | - | 非必填，Text | - | - |

**Agency_Tier 說明**

| 等級 | 範例 |
|------|------|
| Tier 1 | 電通集團、宏盟集團、陽獅集團、統一數網 |
| Tier 2 | 群邑集團、格威集團、宏將集團 |
| Tier 3 | 其他代理商 |

**交易條件**

| 顯示欄位 (UI) | Schema Key | 規則 | 選項 | 備註 |
|--------------|-----------|------|------|------|
| 客戶付款條件 | Payment_Term | 必填，ENUM | 月結 30 日<br>月結 60 日<br>月結 90 日<br>30 日內<br>45 日內<br>預收 | - |
| 聯盟 | Alliance | 非必填，ENUM | APEX, Omnet | **需保留變動歷史軌跡紀錄 (Audit Log)** |

### 2.2.1 Agency Brand Owner Assignment

| 顯示欄位 (UI) | Schema Key | 規則 | 選項 | 備註 |
|--------------|-----------|------|------|------|
| 代理商負責客戶 | Agency_Brand_Owner_Assignment | 只有 Account_Type = Agency 才會使用 | 所有 Account_Type = Client<br>可搜尋 | 此處可連結代理商負責的品牌主 |
| 代理起始日 | Assignment_Start_Date | 非必填，系統自動記錄 | - | 代理商有可能轉換，故要記錄 |
| 代理結束日 | Assignment_End_Date | 非必填，系統自動記錄 | - | - |

**關聯**

- Account 1:N Brand
- Account 1:N Contact
- Account 1:N Contract

---

## 2.3 Brand

Brand 代表品牌主旗下的品牌。

> ex. 台灣福斯股份有限公司旗下擁有 VW、SKODA、Audi。
> ex. 王品餐飲股份有限公司旗下擁有 藝奇、尬鍋、王品、丰禾。

| 顯示欄位 (UI) | Schema Key | 規則 | 選項 |
|--------------|-----------|------|------|
| 品牌名稱 | Brand_Name | 必填，文字 | - |
| 所屬公司 | FK → Account_ID | 必填，下拉選單 | Account_Name<br>Account_Type = Client |
| 產業類別 | Industry_Category | 必填，ENUM | 詳見下方產業類別清單 |
| 媒體屬性 | Media_Requirement | 勾選 Multi-select<br>（選擇後用 tag 方式呈現） | 不指定<br>指定媒體類別<br>指定媒體<br>進行第三方監控 |
| 投放注意事項 | - | 非必填，Text | - |
| 合作注意事項 | - | 非必填，Text | - |

**媒體屬性互動邏輯**

| 勾選項目 | 顯示欄位 |
|----------|----------|
| 指定媒體類別 | `Selected_Media_Categories` |
| 指定媒體 | `Selected_Media_List` |
| 進行第三方監控 | `Third_Party_Monitor_List` |

**產業類別選項**

```
汽機車產業、汽車用品產業、遊戲產業、醫療用品產業、保健食品產業、
低酒精飲產業、烈酒產業、飲料產業、家庭生活與防護用品產業、房產產業、
速食產業、食品產業、建築設備與室內建材產業、家居用品產業、
3C 電子用品產業、大型家電產業、小型家電產業、資通訊產業、
觀光旅遊產業、醫學美容產業、彩妝保養產業、金融產業、餐飲產業、
政治產業、服裝產業、精品時尚產業、電商通路產業、母嬰產業、
展覽活動產業、百貨超商通路產業、影視娛樂產業、文教產業、
乳品製造產業、公益產業、政府機關類、其它產業、寵物用品產業、
玩具產業、支援服務業
```

**關聯**

- Account 1:N Brand
- Brand N:N Contact

---

## 2.4 Contact

Contact 為公司內的聯絡窗口。

在 "Account 頁面" 可以新增聯絡人，聯絡人歸屬在 "account 底下" 只不過可以 assign brand。

| 顯示欄位 (UI) | Schema Key | 規則 | 選項 |
|--------------|-----------|------|------|
| 承辦窗口 | Name | - | - |
| 英文名 | English_Name | - | - |
| 職稱 | Title | - | - |
| 部門 | Department | - | - |
| 電話 | Tel | - | - |
| 手機 | Mobile | - | - |
| E-mail | E-mail | - | - |
| 狀態 | Status | 必填，ENUM | 在職 / 離職 |
| 等級 | Level | 必填，Multi-select ENUM | 決策者 / 影響者 / 執行者 |
| 負責品牌 | Contact_Brand_Assignment | N:N 關聯於 Brand<br>多選 (Multi-select) | 實作於 Contact_Brand_Assignment 表 |

**關聯**

- Account 1:N Contact
- Contact N:N Brand


### 2.4.1 Contact_Brand_Assignment

此為中間表，用於實作聯絡人與品牌之間的多對多關聯。

| 顯示欄位 (UI) | Schema Key | 規則 | 備註 |
|--------------|-----------|------|------|
| 聯絡人 | FK → Contact_ID | - | - |
| 品牌 | FK → Brand_ID | - | - |
| 負責類型 | Assignment_Role | ENUM | 主要窗口 / 日常執行 / 財務聯繫 |
| 起始日 | Assignment_Start_Date | 系統自動記錄 | - |
| 結束日 | Assignment_End_Date | 系統自動記錄 | - |

---

## 3. 功能需求

### 3-1. Interaction 客戶記事 / 互動記錄

此表用於**記錄所有與客戶、品牌、聯絡人的互動**，是 CRM 最核心的銷售活動追蹤資料。

**入口方式**

1. 客戶資料頁面 → 新增記事（預設 Related Account）
2. 側欄選單 → 記事（需選擇 Related Account）

| Field | Type | Description | Rules |
|-------|------|-------------|-------|
| InteractionID | PK | 唯一識別碼 | 系統自動產生 |
| RelatedAccountID | FK → Account | 所屬公司 | 必填<br>1. 下拉選單可搜尋<br>2. **級聯選擇 (Cascading)**：若先選 Brand，需自動帶入對應 Account |
| RelatedBrandID | FK → Brand | 所屬品牌 | 非必填，下拉選單可搜尋<br>**級聯過濾**：僅能選擇屬於該 RelatedAccountID 旗下之品牌 |
| RelatedContactID | FK → Contact | 互動對象 | 非必填，可單一或多個 Contact |
| RelatedQuotationID | FK → Quotation | 關聯報價單 | 非必填，關聯商機進度 |
| InteractionType | ENUM | 互動類型 | Meeting / Call / Email / Message / Event / SalesProgress |
| InteractionNote | Text | 詳細紀錄 | 會議紀錄 / 電話紀錄 / Email 摘要 / 重要事件 |
| CreatedBy | FK → User | 建立者 | 系統自動產生 |
| CreatedAt | Timestamp | 建立時間 | 系統自動產生 |
| UpdatedBy | FK → User | 更新者 | 系統自動產生 |
| UpdatedAt | Timestamp | 更新時間 | 系統自動產生 |


**業務日報整合**

業務日報希望可以結合進 Interaction 記事裡：

| 入口 | 說明 |
|------|------|
| 入口 1 | 在業務個人頁面有一次填寫功能 |
| 入口 2 | Slack + AI Agent，業務有 daily report 頻道，可用語音/文字輸入：客戶名+內容，自動串接回系統，並且系統自動產生日報給主管/小組長 |

**日報 → CRM 對應**

| 日報內容 | CRM |
|----------|-----|
| 排 cue / 提案進度 | Quotation + Interaction |
| 客戶經營 | Interaction |

---
