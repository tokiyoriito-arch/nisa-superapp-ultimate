
'use client';
export default function Install() {
  const sql = `
create table if not exists public.funds (
  isin text,
  name text not null,
  company text,
  category text,
  nisa_tsumitate boolean default false,
  nisa_growth boolean default false,
  primary key (isin, name)
);
create table if not exists public.fund_sources (
  isin text primary key,
  csv_url text not null,
  encoding text,
  date_col text,
  nav_col text,
  dist_col text
);
create table if not exists public.fund_nav (
  isin text not null,
  date date not null,
  nav numeric not null,
  dist numeric default 0,
  primary key (isin, date)
);
create table if not exists public.fund_metrics (
  isin text primary key,
  asof date,
  ret_1y numeric,
  ret_3y numeric,
  ret_5y numeric,
  vol_3y numeric,
  mdd_3y numeric
);
create table if not exists public.user_profiles (
  device_id text primary key,
  age_group text,
  updated_at timestamp with time zone default now()
);
create table if not exists public.portfolios (
  device_id text primary key,
  alloc jsonb not null,
  risk text,
  updated_at timestamp with time zone default now()
);
`;
  async function seed() {
    await fetch('/api/sync/nisa');
    await fetch('/api/sync/perf?limit=50');
    alert('初期データ投入トリガーを送信しました');
  }
  return (
    <main style={maxWidth:860,margin:'40px auto',padding:'0 16px',fontFamily:'system-ui'}>
      <h1>初期セットアップ</h1>
      <ol>
        <li>Supabase → SQL Editor で下の SQL を実行（テーブル作成）</li>
        <li>「初期データ投入」を押す</li>
      </ol>
      <textarea readOnly rows={20} style={width:'100%',fontFamily:'ui-monospace, Menlo, monospace'}>{sql}</textarea>
      <div style={height:12}/>
      <button onClick={seed} style={padding:'10px 16px',border:'1px solid #0ea5e9',borderRadius:12,background:'#0ea5e9',color:'#fff'}>初期データ投入</button>
      <p style={color:'#64748b',fontSize:12}>完了後は /install を削除/保護してください。</p>
    </main>
  );
}
