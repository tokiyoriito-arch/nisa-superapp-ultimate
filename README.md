
# NISA Super App — Ultimate（フルUI版）

## セットアップ
1) 環境変数（Vercel）
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE`
- `ADMIN_TOKEN`（任意の長い文字列）

2) 初期化
- Supabaseのテーブルを作成（/install か、同梱の seed.sql を使う）
- `/api/sync/nisa` を開く → NISA対象
- `fund_sources` にCSV URLを登録 → `/api/sync/perf?limit=50`

3) 主な画面
- `/wizard` `/portfolio` `/community` `/nisa` `/performance` `/planner`
