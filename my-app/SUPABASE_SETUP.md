# Supabase連携セットアップガイド

このガイドでは、カンバンボードアプリをSupabaseと連携させる手順を説明します。

## 📋 セットアップ手順

### ステップ1: Supabaseダッシュボードにログイン

1. [https://app.supabase.com](https://app.supabase.com) にアクセス
2. 既存のプロジェクトを選択（プロジェクトID: `xtodkugusohecieyheuc`）

### ステップ2: データベーステーブルの作成

1. Supabaseダッシュボードで **SQL Editor** を開く
   - 左サイドバーから「SQL Editor」を選択

2. `supabase-schema.sql` の内容をコピー&ペーストして実行
   - プロジェクトルートにある `supabase-schema.sql` ファイルを開く
   - 全文をコピーしてSQL Editorに貼り付け
   - 右上の「Run」ボタンをクリック

3. 成功すると以下のテーブルが作成されます：
   - `users` - ユーザー情報
   - `tasks` - タスク情報
   - `comments` - コメント情報

### ステップ3: 初期データの確認

1. Supabaseダッシュボードで **Table Editor** を開く
2. `users` テーブルを確認
3. 以下の初期ユーザーが登録されているはずです：
   - 田中太郎 (tanaka@example.com)
   - 佐藤花子 (sato@example.com)
   - 山田次郎 (yamada@example.com)

### ステップ4: アプリケーションの起動

開発サーバーがすでに起動している場合は、そのまま使用できます：

```bash
npm run dev -- -p 3001
```

### ステップ5: 動作確認

1. ブラウザで http://localhost:3001 を開く
2. 「読み込み中...」と表示された後、ログイン画面が表示されます
3. ドロップダウンから既存ユーザーを選択してログイン
4. タスクを追加・編集・削除してみてください
5. データがSupabaseに保存されていることを確認：
   - Supabaseダッシュボードの Table Editor でリアルタイムにデータが更新されます

---

## 🔧 トラブルシューティング

### エラー: "Failed to fetch users"

**原因**: Supabaseへの接続に失敗している

**解決方法**:
1. `.env.local` ファイルの設定を確認
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xtodkugusohecieyheuc.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
2. 開発サーバーを再起動

### エラー: "relation 'users' does not exist"

**原因**: データベーステーブルが作成されていない

**解決方法**:
1. `supabase-schema.sql` をSupabaseダッシュボードで実行
2. Table Editor でテーブルが作成されたことを確認

### テーブルが空の場合

**解決方法**:
1. SQL Editorで以下を実行：
   ```sql
   insert into users (name, email) values
     ('田中太郎', 'tanaka@example.com'),
     ('佐藤花子', 'sato@example.com'),
     ('山田次郎', 'yamada@example.com')
   on conflict (email) do nothing;
   ```

### RLSポリシーエラー

**原因**: Row Level Securityポリシーが正しく設定されていない

**解決方法**:
1. `supabase-schema.sql` を再度実行してポリシーを作成
2. または、開発中は一時的にRLSを無効化：
   ```sql
   alter table users disable row level security;
   alter table tasks disable row level security;
   alter table comments disable row level security;
   ```

---

## 📊 データベーススキーマ

### `users` テーブル
| カラム名 | 型 | 説明 |
|---------|---|-----|
| id | bigint | 主キー（自動生成） |
| name | text | ユーザー名 |
| email | text | メールアドレス（ユニーク） |
| created_at | timestamp | 作成日時 |

### `tasks` テーブル
| カラム名 | 型 | 説明 |
|---------|---|-----|
| id | bigint | 主キー（自動生成） |
| user_id | bigint | ユーザーID（外部キー） |
| text | text | タスク内容 |
| completed | boolean | 完了フラグ |
| created_at | timestamp | 作成日時 |

### `comments` テーブル
| カラム名 | 型 | 説明 |
|---------|---|-----|
| id | bigint | 主キー（自動生成） |
| task_id | bigint | タスクID（外部キー） |
| user_id | bigint | ユーザーID（外部キー） |
| user_name | text | 投稿者名 |
| content | text | コメント内容 |
| created_at | timestamp | 作成日時 |

---

## 🎯 実装済み機能

### localStorage → Supabaseへの移行完了

以下の機能がSupabaseで動作します：

✅ **ユーザー管理**
- ユーザー一覧の取得
- 新規ユーザー登録（重複メール防止）
- ログイン/ログアウト

✅ **タスク管理**
- タスクの追加（Supabaseに保存）
- タスクの取得（ユーザーごとにフィルタ）
- タスクの完了/未完了の切り替え
- タスクの削除（カスケード削除）
- ドラッグアンドドロップでの状態変更

✅ **コメント機能**
- コメントの追加（Supabaseに保存）
- コメントの取得
- タスク削除時に関連コメントも削除

✅ **UI機能**
- ローディング画面
- エラーハンドリング（アラート表示）
- カンバンボード表示
- ダークモード対応

---

## 🚀 次のステップ（オプション）

### リアルタイム更新の追加

他のユーザーがタスクを変更したら自動で反映する機能を追加できます：

```typescript
useEffect(() => {
  if (!currentUser) return;

  const channel = supabase
    .channel('tasks-changes')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${currentUser.id}` },
      () => {
        fetchTasks();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [currentUser]);
```

### より厳密なRLSポリシー

現在は誰でも全てのデータにアクセス可能です。セキュリティを強化する場合：

```sql
-- ユーザーは自分のタスクのみ閲覧
create policy "Users can view their own tasks"
  on tasks for select
  using (user_id = auth.uid()::bigint);
```

※ この場合、Supabase Authの実装が必要です

---

## 📝 注意事項

- **既存のlocalStorageデータは使用されません**
  - 全てのデータはSupabaseに保存されます
  - ログイン状態のみlocalStorageに保存（`kanban-current-user-id`）

- **ネットワーク接続が必要**
  - オフラインでは動作しません

- **Supabase無料プランの制限**
  - 500MB データベースストレージ
  - 2GB データ転送/月
  - 50,000 月間アクティブユーザー

---

## ✅ セットアップ完了チェックリスト

- [ ] Supabaseダッシュボードにログイン
- [ ] `supabase-schema.sql` を実行
- [ ] `users` テーブルに初期データが存在
- [ ] `.env.local` の設定を確認
- [ ] 開発サーバーを起動（npm run dev）
- [ ] ブラウザでログイン画面が表示される
- [ ] ユーザーでログイン可能
- [ ] タスクの追加・編集・削除が動作
- [ ] Supabaseダッシュボードでデータが確認できる

全てチェックできたら、Supabase連携は完了です！
