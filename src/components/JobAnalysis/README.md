# JobAnalysis Component

業務分析・適性評価のためのReactコンポーネントです。障害者雇用に適した業務カテゴリーとスキル要件を定義・表示するために使用します。

## 機能

- 職種カテゴリーの表示と編集
- 必要なスキルの定義と管理
- 適性スコアの視覚的表示
- 編集モードと閲覧専用モードの切り替え

## インストール

このコンポーネントはプロジェクトに統合されていますので、追加のインストール手順は不要です。

## 使用方法

### 基本的な使い方

```tsx
import React from 'react';
import JobAnalysis from '../../components/JobAnalysis';
import { JobCategory } from '../../api/settingsApi';

// 職種カテゴリーデータ
const jobCategories: JobCategory[] = [
  {
    name: 'データ入力',
    description: 'データ入力とスプレッドシート操作が必要な業務です。',
    suitabilityScore: 4,
    requiredSkills: [
      { name: 'タイピング', level: 3 },
      { name: 'Excel操作', level: 2 }
    ]
  }
];

// 変更を保存する関数
const handleSave = (updatedCategories: JobCategory[]) => {
  console.log(updatedCategories);
  // API呼び出しなどで保存処理を実装
};

const MyComponent = () => {
  return (
    <div>
      <JobAnalysis 
        jobCategories={jobCategories} 
        onSave={handleSave} 
      />
    </div>
  );
};
```

### 閲覧専用モード

データを表示するだけで編集機能を無効にしたい場合は、`readOnly` プロパティを `true` に設定します。

```tsx
<JobAnalysis 
  jobCategories={jobCategories} 
  readOnly={true}
/>
```

## Props

| プロパティ名    | 型                   | 必須 | デフォルト値 | 説明                                     |
|----------------|----------------------|------|------------|------------------------------------------|
| jobCategories  | JobCategory[]       | はい  | []         | 職種カテゴリーの配列                       |
| onSave         | Function             | いいえ | undefined  | 保存ボタンクリック時に呼ばれるコールバック |
| readOnly       | boolean             | いいえ | false      | 閲覧専用モードを有効にするかどうか         |

## 型定義

このコンポーネントは、`frontend/src/api/settingsApi.ts` で定義されている次の型を使用します：

```typescript
// 必要なスキル型定義
export interface Skill {
  name: string;
  level: number;
}

// 職種カテゴリー型定義
export interface JobCategory {
  name: string;
  description: string;
  suitabilityScore: number;
  requiredSkills: Skill[];
}
```

## 使用例

より完全な使用例については、`JobAnalysisExample.tsx` を参照してください。このファイルでは、編集モードと閲覧専用モードの両方の使用例を提供しています。