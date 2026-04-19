import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Printer, ShieldCheck, Globe, TrendingUp, Database, Smartphone,
  Info, Plus, Trash2, List, Cpu, HardDrive, Image as ImageIcon,
  AlertTriangle, Activity, CreditCard, Upload, User, Building, X,
  Download, FolderOpen, GripVertical, AlertCircle
} from 'lucide-react';

// ============================================================
// TYPES
// ============================================================
type Asset = {
  id: string; hostName: string; role: string; os: string;
  status: 'Healthy' | 'Warning' | 'Critical'; detail: string;
};
type ChangeLog = {
  id: string; date: string; type: string; content: string; result: string; owner: string;
};
type NewsItem = {
  id: string; title: string; date: string; source: string; content: string; impact: string;
};
type ThreatStat = { name: string; count: number; color: string; };
type ResourceStat = { month: string; value: number; };
type EvidenceItem = {
  id: string; title: string; status: string; date: string; desc: string;
  iconType: 'db' | 'shield' | 'activity';
};
type InvoiceItem = { id: string; desc: string; qty: number; unit: number; };
type InvoiceData = {
  invNo: string; invDate: string; dueDate: string; currency: 'JPY' | 'USD' | 'PHP';
  taxRate: number; logoSrc: string | null; senderName: string; senderDetails: string;
  clientName: string; clientDetails: string; bankName: string; bankBranch: string;
  bankSwift: string; bankType: string; bankNo: string; bankHolder: string;
  items: InvoiceItem[]; notes: string;
};
type ReportData = {
  meta: {
    year: string; month: string; clientName: string;
    createDate: string; author: string; companyName: string;
  };
  summary: {
    score: 'S' | 'A' | 'B' | 'C'; uptime: string;
    threatsBlocked: string; backupStatus: string; comment: string;
  };
  threatStats: ThreatStat[];
  securityAnalysis: {
    globalIpTitle: string; globalIpComment: string;
    botDefenseTitle: string; botDefenseComment: string;
  };
  resourceStats: { nasStorage: ResourceStat[]; cpuUsage: ResourceStat[]; };
  assets: Asset[];
  performance: {
    nasAnalysis: string; cpuAnalysis: string; veilAnalysis: string; webAnalysis: string;
  };
  evidenceList: EvidenceItem[];
  evidenceImages: string[];
  news: NewsItem[];
  changes: ChangeLog[];
  roadmap: { nextMonth: string; strategicAdvice: string; };
  invoice: InvoiceData;
};

// ============================================================
// HELPERS
// ============================================================
const getTodayMeta = () => {
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const createDate = `${year}年${String(now.getMonth() + 1).padStart(2, '0')}月${String(now.getDate()).padStart(2, '0')}日`;
  return { year, month, createDate };
};

// 対象年月から遡って count ヶ月分のラベルを生成
const getPrevMonthLabels = (year: string, month: string, count: number): string[] => {
  const y = parseInt(year) || new Date().getFullYear();
  const m = parseInt(month) || new Date().getMonth() + 1;
  const labels: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    let targetMonth = m - i;
    let targetYear = y;
    while (targetMonth <= 0) {
      targetMonth += 12;
      targetYear -= 1;
    }
    labels.push(`${targetMonth}月`);
  }
  return labels;
};

const STORAGE_KEY = 'report_generator_data_v1';
const GRAPH_MONTHS = 3; // グラフの月数

const fmtMoney = (amount: number, currency: 'JPY' | 'USD' | 'PHP') => {
  const locales = { JPY: 'ja-JP', USD: 'en-US', PHP: 'en-PH' };
  return new Intl.NumberFormat(locales[currency], {
    style: 'currency', currency,
    minimumFractionDigits: currency === 'JPY' ? 0 : 2,
  }).format(amount);
};

// ============================================================
// INITIAL DATA
// ============================================================
const buildInitialData = (): ReportData => {
  const meta = getTodayMeta();
  const labels = getPrevMonthLabels(meta.year, meta.month, GRAPH_MONTHS);
  return {
    meta: {
      ...meta,
      clientName: '株式会社サンプル・プロジェクト',
      author: '山田 太郎 (Senior Security Consultant)',
      companyName: 'KAKEHASHI ASIA INC.',
    },
    summary: {
      score: 'S', uptime: '100%', threatsBlocked: '14,280', backupStatus: '全日成功',
      comment: '当月において、貴社の事業運営に影響を与えるシステム停止、およびセキュリティインシデントは皆無でした。\n\n特筆すべき点として、Re:NAS（ファイルサーバー）の定期セキュリティアップデートにおきましても、冗長構成を活かした無停止メンテナンスに成功しており、データ保全性は極めて高い状態です。\n\nまた、Re:Veil（スマートフォン）全台のOSバージョン整合性も確認済みであり、紛失・盗難などのインシデント報告もありません。',
    },
    threatStats: [
      { name: 'Port Scan', count: 8500, color: '#64748b' },
      { name: 'SQL Injection', count: 1200, color: '#ef4444' },
      { name: 'XSS Attempt', count: 800, color: '#f59e0b' },
      { name: 'Malware Download', count: 150, color: '#8b5cf6' },
      { name: 'Brute Force', count: 3630, color: '#3b82f6' },
    ],
    securityAnalysis: {
      globalIpTitle: 'Internal Network Monitoring',
      globalIpComment: '海外からの不正アクセス試行が全体の92%を占めています。Geo-IPフィルタリングにより、業務に関係のない国からのアクセスをネットワーク境界でドロップしており、リソース消費を最小限に抑えています。',
      botDefenseTitle: 'Access Control Monitoring',
      botDefenseComment: '既知のBotネットからのスキャン行為（Port 22, 443等）を検知。IPレピュテーションベースのブラックリストにより、攻撃の前段階である「偵察行為」を無効化しました。',
    },
    resourceStats: {
      nasStorage: labels.map((month, i) => ({ month, value: [45, 48, 50][i] ?? 50 })),
      cpuUsage:   labels.map((month, i) => ({ month, value: [35, 65, 40][i] ?? 40 })),
    },
    assets: [
      { id: 'NAS-01', hostName: 'Re:NAS-Main', role: 'セキュアNAS', os: 'Debian 12 (Hardened)', status: 'Healthy', detail: 'ZFS Pool Status: ONLINE (No Errors), Scrub完了: 2025/05/28' },
      { id: 'WEB-01', hostName: 'Corp-HP', role: '簡易HP (Web)', os: 'Debian / Nginx', status: 'Healthy', detail: 'WAF有効, SSL証明書有効期限: 残り320日' },
      { id: 'MOB-001', hostName: 'Re:Veil-User01', role: 'セキュアスマホ', os: 'GrapheneOS', status: 'Healthy', detail: 'Auditor App: Verified, 最終同期: 2時間前' },
      { id: 'MOB-002', hostName: 'Re:Veil-User02', role: 'セキュアスマホ', os: 'GrapheneOS', status: 'Healthy', detail: 'Auditor App: Verified, 最終同期: 5時間前' },
    ],
    performance: {
      nasAnalysis: 'Re:NAS (ZFSプール) の使用率は50%に達しました。過去3ヶ月のトレンドから分析すると、月間約2%の増加傾向にあります。現在のペースであれば、今後18ヶ月間はディスク増設なしで運用可能です。',
      cpuAnalysis: '全体的に低負荷で推移していますが、先月に一時的なピーク（65%）を記録しました。これは四半期ごとのフルバックアップ処理と、Re:NASのScrub処理（データ整合性チェック）が重なったためであり、正常な動作です。',
      veilAnalysis: 'Re:Veil全端末において、GrapheneOSの最新パッチが適用されていることを確認しました。メモリ使用量、バッテリー劣化度ともに正常範囲内であり、ハードウェア起因のトラブル予兆はありません。',
      webAnalysis: '外部公開Webサーバーへのアクセス数は安定しており、DDoS等の攻撃予兆は見られません。WAFによる遮断ログの9割は海外IPからの無差別スキャンであり、実害はありません。',
    },
    evidenceList: [
      { id: 'ev1', title: 'Immutable Backup', iconType: 'db', status: 'Success', desc: 'ランサムウェア対策済みの不変ストレージへのバックアップ完了を確認。', date: '2025/06/01' },
      { id: 'ev2', title: 'Re:Veil Device Integrity', iconType: 'shield', status: 'Active', desc: '全エンドポイントにて最新のシグネチャ適用を確認。未検知の脅威なし。', date: '2025/06/01' },
      { id: 'ev3', title: 'Quarterly Restore Test', iconType: 'activity', status: 'Verified', desc: '四半期復元テストを実施。Re:NAS上のランダムな10ファイルをリストアし、ハッシュ値の一致を確認。', date: '2025/05/28' },
    ],
    evidenceImages: [],
    news: [
      { id: 'n1', title: 'スマートフォンの位置情報を悪用した標的型攻撃', date: '2025/12/20', source: 'Global Cyber Security Watch', content: '一般的な商用OSの脆弱性を突き、位置情報やマイク音声を盗聴するスパイウェアが確認されています。特定の企業幹部を狙うケースが増加傾向にあります。', impact: '【貴社への影響】貴社採用の「Re:Veil (GrapheneOS)」は、OSレベルでトラッキング防止機能が強化されており、当該スパイウェアの影響を受けません。' },
      { id: 'n2', title: 'ランサムウェアによるNAS機器への攻撃激化', date: '2025/12/15', source: 'TechDefense Report', content: '未修正の脆弱性を放置したNAS機器がランサムウェアに感染し、バックアップデータごと暗号化される被害が多発しています。', impact: '【貴社への影響】「Re:NAS」はDebianベースの堅牢化設定に加え、定期的な自動アップデートが適用されており、脆弱性は解消済みです。' },
      { id: 'n3', title: 'Webサイト改ざん攻撃のトレンド変化', date: '2025/12/10', source: 'WebSec Journal', content: 'CMSのプラグイン脆弱性を狙ったWebサイト改ざん攻撃が増えています。見た目は変わらずとも、閲覧者にマルウェアを配布するサイトに書き換えられる事例です。', impact: '【貴社への影響】貴社HPは簡易構成（静的サイト中心）で運用されており、攻撃対象となる動的プラグインを使用していないため、リスクは極めて限定的です。' },
    ],
    changes: [
      { id: '1', date: '05/10', type: '定期メンテ', content: 'Re:NAS セキュリティパッチ適用 (Debian Security Update)', result: '完了', owner: '山田' },
      { id: '2', date: '05/15', type: '設定変更', content: 'Re:Veil 新規セットアップ (1台) - キッティング実施', result: '完了', owner: '鈴木' },
      { id: '3', date: '05/20', type: '予防保守', content: 'Re:NAS ZFS Scrub実行および整合性チェック', result: '正常', owner: 'System' },
      { id: '4', date: '05/25', type: 'Web更新', content: 'HP お知らせ情報の更新作業 (Git Deploy)', result: '完了', owner: '佐藤' },
      { id: '5', date: '05/28', type: '監査', content: '月次ログ監査およびレポート作成', result: '完了', owner: '山田' },
    ],
    roadmap: {
      nextMonth: '・Re:Veil OSアップデート: 来月リリース予定のGrapheneOS大型アップデートに向けた検証を実施します。\n・Re:NAS 容量監査: 不要な一時ファイル(スナップショットの古い世代)のクリーンアップを実施予定です。',
      strategicAdvice: '■ スマートフォン (Re:Veil) の追加導入について\n現在試験導入中の2台に加え、営業部門への展開をご検討中とのことですが、現在の管理サーバー構成で最大50台まで収容可能です。\n\n■ ゼロトラスト環境へのステップアップ\nRe:VeilとRe:NASの連携において、デバイス証明書を用いたより強固な認証方式（mTLS）の導入準備が整いつつあります。来期予算での実装をご提案します。\n\n推奨アクション:\n・次月定例会にて、追加キッティングのスケジュール案を提示いたします。\n・mTLS導入によるセキュリティ向上効果の試算表を作成します。',
    },
    invoice: {
      invNo: 'INV-2025-0501', invDate: '2025-06-01', dueDate: '2025-06-30',
      currency: 'USD', taxRate: 0, logoSrc: null,
      senderName: 'KAKEHASHI ASIA INC.',
      senderDetails: '7/F Finman Bldg.,131 Tordesillas St., Bel Air, Makati,1200 METRO MANILA,PHILIPPINES\nTax ID: 010-908-840-00000\nPhone: +63 09178171702',
      clientName: 'Client Corp (Global)', clientDetails: 'Manila, Philippines\nAttn: Finance Dept',
      bankName: 'East West Banking Corp.', bankBranch: 'Benavidez Branch',
      bankSwift: 'EWBCPHIMMXXX', bankType: 'Ordinary',
      bankNo: '200056876412', bankHolder: 'KAKEHASHI ASIA INC.',
      notes: 'Please remit the payment by the due date.\nBank fees, if any, are to be borne by the payer.',
      items: [
        { id: '1', desc: 'Monthly Security Consulting Fee (Basic Plan)', qty: 1, unit: 4500 },
        { id: '2', desc: 'Re:Veil Management License (May Usage)', qty: 2, unit: 45 },
        { id: '3', desc: 'Re:NAS Maintenance Support', qty: 1, unit: 250 },
      ],
    },
  };
};

// ============================================================
// DRAG & DROP HOOK
// ============================================================
const useDragSort = <T extends { id: string }>(
  items: T[],
  onReorder: (newItems: T[]) => void
) => {
  const dragIndex = useRef<number | null>(null);
  const onDragStart = (index: number) => { dragIndex.current = index; };
  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex.current === null || dragIndex.current === index) return;
    const newItems = [...items];
    const [moved] = newItems.splice(dragIndex.current, 1);
    newItems.splice(index, 0, moved);
    dragIndex.current = index;
    onReorder(newItems);
  };
  const onDragEnd = () => { dragIndex.current = null; };
  return { onDragStart, onDragOver, onDragEnd };
};

// ============================================================
// CHART COMPONENTS
// ============================================================
const SimplePieChart = ({ data }: { data: ThreatStat[] }) => {
  const total = data.reduce((acc, cur) => acc + cur.count, 0);
  if (total === 0) return <div className="h-64 flex items-center justify-center text-slate-400 text-sm">データなし</div>;
  let currentAngle = 0;
  return (
    <div className="flex items-center gap-8 justify-center h-64">
      <div className="relative w-48 h-48">
        <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full drop-shadow-md">
          {data.map((item, i) => {
            const percentage = item.count / total;
            const angle = percentage * 360;
            const x1 = 50 + 50 * Math.cos((Math.PI * currentAngle) / 180);
            const y1 = 50 + 50 * Math.sin((Math.PI * currentAngle) / 180);
            const x2 = 50 + 50 * Math.cos((Math.PI * (currentAngle + angle)) / 180);
            const y2 = 50 + 50 * Math.sin((Math.PI * (currentAngle + angle)) / 180);
            const pathData = percentage >= 1
              ? 'M 50 50 m -50,0 a 50,50 0 1,0 100,0 a 50,50 0 1,0 -100,0'
              : `M 50 50 L ${x1} ${y1} A 50 50 0 ${angle > 180 ? 1 : 0} 1 ${x2} ${y2} Z`;
            const el = <path key={i} d={pathData} fill={item.color} stroke="white" strokeWidth="1" />;
            currentAngle += angle;
            return el;
          })}
        </svg>
      </div>
      <div className="space-y-2">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            <span className="font-bold text-slate-700 w-24">{item.name}</span>
            <span className="font-mono text-slate-500">{item.count.toLocaleString()}</span>
            <span className="text-slate-400 text-[10px]">({Math.round((item.count / total) * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const SimpleBarChart = ({ data, color = '#3b82f6', unit = '%' }: { data: ResourceStat[]; color?: string; unit?: string }) => {
  const maxValue = Math.max(...data.map(d => d.value), 100);
  return (
    <div className="w-full px-4 pt-4 pb-2">
      <div className="flex items-end justify-between gap-2 h-32 border-b border-slate-200">
        {data.map((item, i) => (
          <div key={i} className="flex flex-col items-center justify-end flex-1 h-full group relative">
            <div className="absolute -top-6 text-xs font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {item.value}{unit}
            </div>
            <div
              className="w-full rounded-t transition-all duration-500"
              style={{
                height: `${Math.max((item.value / maxValue) * 100, 2)}%`,
                backgroundColor: color,
                printColorAdjust: 'exact',
                WebkitPrintColorAdjust: 'exact',
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between gap-2 mt-2">
        {data.map((item, i) => (
          <div key={i} className="flex-1 text-center text-xs text-slate-500 font-medium">{item.month}</div>
        ))}
      </div>
    </div>
  );
};

// ============================================================
// UI HELPERS
// ============================================================
const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    Healthy: 'bg-green-100 text-green-800 border-green-200',
    Warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    Critical: 'bg-red-100 text-red-800 border-red-200',
  };
  const labels: Record<string, string> = {
    Healthy: '🟢 正常', Warning: '🟡 注意', Critical: '🔴 危険',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${styles[status] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
      {labels[status] ?? status}
    </span>
  );
};

const SectionHeader = ({ number, title, subTitle }: { number: string; title: string; subTitle: string }) => (
  <div className="mb-6 border-b-2 border-slate-800 pb-2 mt-4 break-inside-avoid">
    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
      <span className="bg-slate-900 text-white w-8 h-8 flex items-center justify-center rounded text-lg font-serif">{number}</span>
      {title}
    </h2>
    <p className="text-slate-500 text-xs font-bold mt-1 ml-11 uppercase tracking-[0.2em]">{subTitle}</p>
  </div>
);

const PageHeader = ({ meta, pageNum, totalPages, title }: { meta: ReportData['meta']; pageNum: number; totalPages: number; title?: string }) => (
  <div className="flex justify-between items-end border-b border-slate-300 pb-2 mb-8 print:mb-6 text-xs text-slate-500">
    <div>
      <h1 className="font-bold text-slate-700 text-sm">月次システム監査レポート - {meta.month}月度</h1>
      <span>{meta.clientName} 御中</span>
    </div>
    <div className="text-right">
      <div className="font-bold text-slate-400">{title ?? 'Confidential'}</div>
      <div>{meta.companyName} | Page {pageNum} / {totalPages}</div>
    </div>
  </div>
);

const ScoreCard = ({ score }: { score: string }) => {
  const colors: Record<string, string> = {
    S: 'bg-gradient-to-br from-blue-700 to-blue-900',
    A: 'bg-gradient-to-br from-green-600 to-green-800',
    B: 'bg-gradient-to-br from-yellow-500 to-yellow-700',
    C: 'bg-gradient-to-br from-red-600 to-red-800',
  };
  const descs: Record<string, string> = {
    S: '極めて安定（推奨・模範的状態）',
    A: '概ね安定・要軽微対応',
    B: '要注意・改善推奨',
    C: '危険・即時対応が必要',
  };
  return (
    <div className="flex items-center gap-6 bg-slate-50 p-6 rounded-lg border border-slate-200 shadow-sm mb-6">
      <div className={`${colors[score] ?? colors.C} text-white w-24 h-24 flex items-center justify-center text-6xl font-bold rounded-lg shadow-md font-serif border-4 border-white`}>{score}</div>
      <div>
        <h3 className="font-bold text-lg text-slate-800 mb-1">総合健全性スコア (Health Score)</h3>
        <p className="text-sm font-medium text-slate-600 mb-2">{descs[score] ?? ''}</p>
        <div className="text-xs text-slate-400">※ 評価基準: 可用性(40%) + セキュリティ強度(40%) + リソース余裕度(20%)</div>
      </div>
    </div>
  );
};

const GuideBox = ({ page, title, desc }: { page: string; title: string; desc: string }) => (
  <div className="bg-blue-50 border border-blue-200 p-3 rounded-md mb-4">
    <div className="flex items-center gap-2 text-blue-800 font-bold text-xs mb-1">
      <Info size={14} className="shrink-0" />
      <span>反映先: {page}</span>
    </div>
    <div className="text-xs text-slate-700 font-bold mb-1">{title}</div>
    <div className="text-[10px] text-slate-600 leading-relaxed whitespace-pre-wrap">{desc}</div>
  </div>
);

const OverflowWarningModal = ({ warnings, onConfirm, onCancel }: { warnings: string[]; onConfirm: () => void; onCancel: () => void }) => (
  <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 print:hidden">
    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-amber-100 p-2 rounded-full"><AlertCircle className="w-6 h-6 text-amber-600" /></div>
        <h3 className="font-bold text-lg text-slate-800">ページ溢れの可能性があります</h3>
      </div>
      <p className="text-sm text-slate-600 mb-4">以下のページでコンテンツがA4サイズを超える可能性があります：</p>
      <ul className="space-y-2 mb-6">
        {warnings.map((w, i) => (
          <li key={i} className="flex items-center gap-2 text-sm bg-amber-50 border border-amber-200 rounded p-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" /><span>{w}</span>
          </li>
        ))}
      </ul>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm font-bold hover:bg-slate-50">戻って修正する</button>
        <button onClick={onConfirm} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-blue-500">このまま印刷する</button>
      </div>
    </div>
  </div>
);

// ============================================================
// MAIN APP
// ============================================================
export default function ReportGenerator() {
  const [data, setData] = useState<ReportData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved) as ReportData;
    } catch { /* ignore */ }
    return buildInitialData();
  });

  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [editSection, setEditSection] = useState('basic');
  const [invoiceSubTab, setInvoiceSubTab] = useState<'info' | 'sender' | 'client' | 'bank' | 'items'>('info');
  const [showRestoreBanner, setShowRestoreBanner] = useState(() => {
    try { return !!localStorage.getItem(STORAGE_KEY); } catch { return false; }
  });
  const [overflowWarnings, setOverflowWarnings] = useState<string[]>([]);
  const [showOverflowModal, setShowOverflowModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const evidenceImageInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // localStorage 自動保存
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
  }, [data]);

  // JSON エクスポート
  const handleExport = useCallback(() => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${data.meta.year}_${data.meta.month}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data]);

  // JSON インポート
  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string) as ReportData;
        setData(parsed);
        setShowRestoreBanner(false);
        alert('データを読み込みました！');
      } catch {
        alert('JSONファイルの読み込みに失敗しました。');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  // 印刷前ページ溢れチェック
  const checkOverflowAndPrint = useCallback(() => {
    const warnings: string[] = [];
    const A4_PX = 1122;
    previewRef.current?.querySelectorAll('.report-page').forEach((page, i) => {
      if ((page as HTMLElement).scrollHeight > A4_PX * 1.05) {
        warnings.push(`P.${i + 1} — コンテンツが多い可能性があります`);
      }
    });
    if (warnings.length > 0) {
      setOverflowWarnings(warnings);
      setShowOverflowModal(true);
    } else {
      window.print();
    }
  }, []);

  // ============================================================
  // STATE UPDATERS
  // ============================================================

  // meta 変更 + 年月変更時にグラフ月名を自動更新（値は保持）
  const handleMetaChange = useCallback((field: keyof ReportData['meta'], value: string) => {
    const newMeta = { ...data.meta, [field]: value };
    if (field === 'year' || field === 'month') {
      const labels = getPrevMonthLabels(newMeta.year, newMeta.month, GRAPH_MONTHS);
      setData(prev => ({
        ...prev,
        meta: newMeta,
        resourceStats: {
          nasStorage: prev.resourceStats.nasStorage.map((s, i) => ({ ...s, month: labels[i] ?? s.month })),
          cpuUsage:   prev.resourceStats.cpuUsage.map((s, i)   => ({ ...s, month: labels[i] ?? s.month })),
        },
      }));
    } else {
      setData(prev => ({ ...prev, meta: newMeta }));
    }
  }, [data.meta]);

  const handleSummaryChange = (field: keyof ReportData['summary'], value: string) =>
    setData(prev => ({ ...prev, summary: { ...prev.summary, [field]: value } }));

  const handlePerformanceChange = (field: keyof ReportData['performance'], value: string) =>
    setData(prev => ({ ...prev, performance: { ...prev.performance, [field]: value } }));

  const handleRoadmapChange = (field: keyof ReportData['roadmap'], value: string) =>
    setData(prev => ({ ...prev, roadmap: { ...prev.roadmap, [field]: value } }));

  const handleSecAnalysisChange = (field: keyof ReportData['securityAnalysis'], value: string) =>
    setData(prev => ({ ...prev, securityAnalysis: { ...prev.securityAnalysis, [field]: value } }));

  // Assets
  const updateAsset = (idx: number, field: keyof Asset, value: string) =>
    setData(prev => ({ ...prev, assets: prev.assets.map((a, i) => i === idx ? { ...a, [field]: value } : a) }));
  const addAsset = () =>
    setData(prev => ({ ...prev, assets: [...prev.assets, { id: `MOB-${String(prev.assets.length + 1).padStart(3, '0')}`, hostName: 'Re:Veil-New', role: 'セキュアスマホ', os: 'GrapheneOS', status: 'Healthy' as const, detail: 'Initial Setup' }] }));
  const removeAsset = (idx: number) => {
    if (confirm('削除しますか？')) setData(prev => ({ ...prev, assets: prev.assets.filter((_, i) => i !== idx) }));
  };
  const assetDrag = useDragSort(data.assets, (items) => setData(prev => ({ ...prev, assets: items })));

  // Evidence
  const updateEvidence = (idx: number, field: keyof EvidenceItem, value: string) =>
    setData(prev => ({ ...prev, evidenceList: prev.evidenceList.map((e, i) => i === idx ? { ...e, [field]: value } : e) }));
  const handleEvidenceImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) setData(prev => ({ ...prev, evidenceImages: [...prev.evidenceImages, ev.target!.result as string] }));
    };
    reader.readAsDataURL(file);
  };
  const removeEvidenceImage = (idx: number) => {
    if (confirm('削除しますか？')) setData(prev => ({ ...prev, evidenceImages: prev.evidenceImages.filter((_, i) => i !== idx) }));
  };

  // Changes
  const updateChange = (idx: number, field: keyof ChangeLog, value: string) =>
    setData(prev => ({ ...prev, changes: prev.changes.map((c, i) => i === idx ? { ...c, [field]: value } : c) }));
  const addChange = () =>
    setData(prev => ({ ...prev, changes: [...prev.changes, { id: `${Date.now()}`, date: `${prev.meta.month}/XX`, type: '定期メンテ', content: '作業内容を入力', result: '完了', owner: '担当者' }] }));
  const removeChange = (idx: number) => {
    if (confirm('削除しますか？')) setData(prev => ({ ...prev, changes: prev.changes.filter((_, i) => i !== idx) }));
  };
  const changeDrag = useDragSort(data.changes, (items) => setData(prev => ({ ...prev, changes: items })));

  // News
  const updateNews = (idx: number, field: keyof NewsItem, value: string) =>
    setData(prev => ({ ...prev, news: prev.news.map((n, i) => i === idx ? { ...n, [field]: value } : n) }));
  const addNews = () =>
    setData(prev => ({ ...prev, news: [...prev.news, { id: `n${Date.now()}`, title: 'New Article', date: new Date().toLocaleDateString('ja-JP'), source: '', content: '', impact: '' }] }));
  const removeNews = (idx: number) =>
    setData(prev => ({ ...prev, news: prev.news.filter((_, i) => i !== idx) }));
  const newsDrag = useDragSort(data.news, (items) => setData(prev => ({ ...prev, news: items })));

  // ThreatStats
  const updateThreatStat = (idx: number, field: 'name' | 'count', value: string | number) =>
    setData(prev => ({ ...prev, threatStats: prev.threatStats.map((s, i) => i === idx ? { ...s, [field]: value } : s) }));

  // ResourceStats
  const updateResourceStat = (type: 'nasStorage' | 'cpuUsage', idx: number, value: number) =>
    setData(prev => ({
      ...prev,
      resourceStats: {
        ...prev.resourceStats,
        [type]: prev.resourceStats[type].map((s, i) => i === idx ? { ...s, value } : s),
      },
    }));

  // Invoice
  const handleInvoiceChange = (field: keyof InvoiceData, value: unknown) =>
    setData(prev => ({ ...prev, invoice: { ...prev.invoice, [field]: value } }));
  const updateInvoiceItem = (idx: number, field: keyof InvoiceItem, value: unknown) =>
    setData(prev => ({ ...prev, invoice: { ...prev.invoice, items: prev.invoice.items.map((item, i) => i === idx ? { ...item, [field]: value } : item) } }));
  const addInvoiceItem = () =>
    setData(prev => ({ ...prev, invoice: { ...prev.invoice, items: [...prev.invoice.items, { id: `i${Date.now()}`, desc: '', qty: 1, unit: 0 }] } }));
  const removeInvoiceItem = (idx: number) =>
    setData(prev => ({ ...prev, invoice: { ...prev.invoice, items: prev.invoice.items.filter((_, i) => i !== idx) } }));
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => handleInvoiceChange('logoSrc', ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const invoiceCalc = useMemo(() => {
    const subtotal = data.invoice.items.reduce((sum, item) => sum + item.qty * item.unit, 0);
    const tax = Math.floor(subtotal * (data.invoice.taxRate / 100));
    return { subtotal, tax, total: subtotal + tax };
  }, [data.invoice]);

  const totalPages = 11;

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="min-h-screen bg-gray-100 font-sans text-slate-800">
      {showOverflowModal && (
        <OverflowWarningModal
          warnings={overflowWarnings}
          onConfirm={() => { setShowOverflowModal(false); window.print(); }}
          onCancel={() => setShowOverflowModal(false)}
        />
      )}

      {/* Navbar */}
      <nav className="bg-slate-900 text-white p-4 shadow-md print:hidden sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-400" />
            <div>
              <h1 className="text-lg font-bold leading-tight">Advanced Security Report</h1>
              <p className="text-[10px] text-slate-400">Professional Edition v4.6</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <input type="file" ref={importInputRef} onChange={handleImport} className="hidden" accept=".json" />
            <button onClick={() => importInputRef.current?.click()} className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded text-xs font-bold transition">
              <FolderOpen className="w-3.5 h-3.5" /> 読み込み
            </button>
            <button onClick={handleExport} className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded text-xs font-bold transition">
              <Download className="w-3.5 h-3.5" /> 保存
            </button>
            <div className="flex bg-slate-800 rounded p-1">
              <button onClick={() => setActiveTab('edit')} className={`px-4 py-1.5 rounded text-sm transition ${activeTab === 'edit' ? 'bg-slate-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>編集</button>
              <button onClick={() => setActiveTab('preview')} className={`px-4 py-1.5 rounded text-sm transition ${activeTab === 'preview' ? 'bg-slate-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>プレビュー</button>
            </div>
            <button onClick={checkOverflowAndPrint} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded text-sm font-bold transition shadow-lg">
              <Printer className="w-4 h-4" /> 印刷 / PDF
            </button>
          </div>
        </div>
      </nav>

      {/* 復元バナー */}
      {showRestoreBanner && (
        <div className="print:hidden bg-green-600 text-white px-6 py-2 flex items-center justify-between text-sm">
          <span className="flex items-center gap-2"><Info size={14} /> 前回の編集データを自動復元しました</span>
          <div className="flex gap-3">
            <button onClick={() => { setData(buildInitialData()); setShowRestoreBanner(false); localStorage.removeItem(STORAGE_KEY); }} className="underline text-green-200 text-xs">リセットして初期値に戻す</button>
            <button onClick={() => setShowRestoreBanner(false)} className="text-green-200 hover:text-white"><X size={16} /></button>
          </div>
        </div>
      )}

      <main className="max-w-[1600px] mx-auto p-4 md:p-8 flex gap-8 items-start">

        {/* ===================== EDITOR ===================== */}
        <div className={`w-full md:w-1/3 bg-white rounded-xl shadow-xl overflow-hidden print:hidden flex flex-col h-[calc(100vh-120px)] ${activeTab === 'preview' ? 'hidden lg:flex' : ''}`}>
          <div className="p-4 bg-slate-50 border-b font-bold text-slate-700 flex justify-between items-center shrink-0">
            <span>入力フォーム</span>
            <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full">v4.6 Ready</span>
          </div>

          {/* Section tabs */}
          <div className="flex overflow-x-auto p-2 bg-white border-b border-slate-100 shrink-0 gap-1 no-scrollbar">
            {['basic','summary','stats','assets','analysis','evidence','changes','news','roadmap','invoice'].map(id => (
              <button key={id} onClick={() => setEditSection(id)}
                className={`px-3 py-1.5 text-xs font-bold rounded whitespace-nowrap transition-colors ${editSection === id ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}>
                {{'basic':'基本情報','summary':'サマリー','stats':'統計データ','assets':'資産詳細','analysis':'分析','evidence':'運用証跡','changes':'変更履歴','news':'ニュース','roadmap':'提言','invoice':'請求書'}[id]}
              </button>
            ))}
          </div>

          <div className="p-6 space-y-6 overflow-y-auto grow bg-slate-50/50">

            {/* ---- 基本情報 ---- */}
            {editSection === 'basic' && (
              <div className="space-y-4 animate-fadeIn">
                <GuideBox page="表紙 (P.1) / 全ヘッダー" title="基本情報の入力"
                  desc="対象年・月を変更すると、グラフの月名ラベルが自動で直前3ヶ月に更新されます（値は保持）。" />
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="text-[10px] text-slate-400">対象年</label><input className="w-full border p-2 rounded text-sm" value={data.meta.year} onChange={e => handleMetaChange('year', e.target.value)} /></div>
                  <div><label className="text-[10px] text-slate-400">対象月 (01〜12)</label><input className="w-full border p-2 rounded text-sm" value={data.meta.month} onChange={e => handleMetaChange('month', e.target.value)} /></div>
                </div>
                <div><label className="text-[10px] text-slate-400">クライアント名</label><input className="w-full border p-2 rounded text-sm" value={data.meta.clientName} onChange={e => handleMetaChange('clientName', e.target.value)} /></div>
                <div><label className="text-[10px] text-slate-400">作成日</label><input className="w-full border p-2 rounded text-sm" value={data.meta.createDate} onChange={e => handleMetaChange('createDate', e.target.value)} /></div>
                <div><label className="text-[10px] text-slate-400">作成者名</label><input className="w-full border p-2 rounded text-sm" value={data.meta.author} onChange={e => handleMetaChange('author', e.target.value)} /></div>
              </div>
            )}

            {/* ---- サマリー ---- */}
            {editSection === 'summary' && (
              <div className="space-y-4 animate-fadeIn">
                <GuideBox page="サマリー (P.3)" title="総合評価とハイライト" desc="スコアと今月の主要指標を入力します。" />
                <div>
                  <label className="text-[10px] text-slate-400">総合健全性スコア</label>
                  <select className="w-full border p-2 rounded text-sm" value={data.summary.score} onChange={e => handleSummaryChange('score', e.target.value)}>
                    <option value="S">S - 極めて安定</option><option value="A">A - 概ね安定</option>
                    <option value="B">B - 要注意</option><option value="C">C - 危険</option>
                  </select>
                </div>
                <div><label className="text-[10px] text-slate-400">コンサルタント総評</label><textarea className="w-full border p-2 rounded text-sm h-32" value={data.summary.comment} onChange={e => handleSummaryChange('comment', e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="text-[10px] text-slate-400">稼働率</label><input className="w-full border p-2 rounded text-sm" value={data.summary.uptime} onChange={e => handleSummaryChange('uptime', e.target.value)} /></div>
                  <div><label className="text-[10px] text-slate-400">脅威遮断数</label><input className="w-full border p-2 rounded text-sm" value={data.summary.threatsBlocked} onChange={e => handleSummaryChange('threatsBlocked', e.target.value)} /></div>
                </div>
              </div>
            )}

            {/* ---- 統計データ ---- */}
            {editSection === 'stats' && (
              <div className="space-y-6 animate-fadeIn">
                <GuideBox page="P.4 & P.6" title="グラフデータ"
                  desc="月名は基本情報の「対象年月」から自動生成されます。数値のみ入力してください。" />

                {/* 脅威統計 */}
                <div className="bg-white p-4 rounded shadow-sm border border-slate-200">
                  <div className="text-xs font-bold text-slate-600 mb-2 uppercase">① 脅威検知内訳 (P.4)</div>
                  {data.threatStats.map((stat, idx) => (
                    <div key={idx} className="flex gap-2 mb-2 items-center">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: stat.color }} />
                      <input className="border p-1 rounded text-xs w-24" value={stat.name}
                        onChange={e => updateThreatStat(idx, 'name', e.target.value)} />
                      <input className="border p-1 rounded text-xs w-20" type="number" value={stat.count}
                        onChange={e => updateThreatStat(idx, 'count', parseInt(e.target.value) || 0)} />
                    </div>
                  ))}
                </div>

                {/* セキュリティ分析 */}
                <div className="bg-white p-4 rounded shadow-sm border border-slate-200">
                  <div className="text-xs font-bold text-slate-600 mb-3 uppercase border-b pb-1">② セキュリティ分析 (P.4下部)</div>
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-slate-500 mb-1">左側</label>
                    <input className="w-full border p-2 rounded text-sm mb-1 bg-slate-50" value={data.securityAnalysis.globalIpTitle} onChange={e => handleSecAnalysisChange('globalIpTitle', e.target.value)} />
                    <textarea className="w-full border p-2 rounded text-sm h-20" value={data.securityAnalysis.globalIpComment} onChange={e => handleSecAnalysisChange('globalIpComment', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">右側</label>
                    <input className="w-full border p-2 rounded text-sm mb-1 bg-slate-50" value={data.securityAnalysis.botDefenseTitle} onChange={e => handleSecAnalysisChange('botDefenseTitle', e.target.value)} />
                    <textarea className="w-full border p-2 rounded text-sm h-20" value={data.securityAnalysis.botDefenseComment} onChange={e => handleSecAnalysisChange('botDefenseComment', e.target.value)} />
                  </div>
                </div>

                {/* NAS容量 */}
                <div className="bg-white p-4 rounded shadow-sm border border-slate-200">
                  <div className="text-xs font-bold text-slate-600 mb-2 uppercase">③ NAS容量推移 / 直近3ヶ月 (P.6)</div>
                  {data.resourceStats.nasStorage.map((stat, idx) => (
                    <div key={idx} className="flex gap-2 mb-2 items-center">
                      <span className="border px-2 py-1 rounded text-xs bg-slate-50 text-slate-500 w-14 text-center">{stat.month}</span>
                      <input className="border p-1 rounded text-xs w-20" type="number" value={stat.value}
                        onChange={e => updateResourceStat('nasStorage', idx, parseInt(e.target.value) || 0)} />
                      <span className="text-xs text-slate-400">%</span>
                    </div>
                  ))}
                </div>

                {/* CPU */}
                <div className="bg-white p-4 rounded shadow-sm border border-slate-200">
                  <div className="text-xs font-bold text-slate-600 mb-2 uppercase">④ CPU使用率推移 / 直近3ヶ月 (P.6)</div>
                  {data.resourceStats.cpuUsage.map((stat, idx) => (
                    <div key={idx} className="flex gap-2 mb-2 items-center">
                      <span className="border px-2 py-1 rounded text-xs bg-slate-50 text-slate-500 w-14 text-center">{stat.month}</span>
                      <input className="border p-1 rounded text-xs w-20" type="number" value={stat.value}
                        onChange={e => updateResourceStat('cpuUsage', idx, parseInt(e.target.value) || 0)} />
                      <span className="text-xs text-slate-400">%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ---- 資産詳細 ---- */}
            {editSection === 'assets' && (
              <div className="space-y-4 animate-fadeIn">
                <GuideBox page="資産詳細 (P.5)" title="管理対象デバイス" desc="左端の ⠿ をドラッグして並び替えできます。" />
                <div className="flex justify-between items-center">
                  <div className="text-xs font-bold text-slate-400 uppercase">Assets</div>
                  <button onClick={addAsset} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded flex items-center gap-1"><Plus size={12} /> Add</button>
                </div>
                {data.assets.map((asset, idx) => (
                  <div key={asset.id} draggable
                    onDragStart={() => assetDrag.onDragStart(idx)}
                    onDragOver={e => assetDrag.onDragOver(e, idx)}
                    onDragEnd={assetDrag.onDragEnd}
                    className="bg-white p-3 rounded border shadow-sm text-sm cursor-grab active:cursor-grabbing">
                    <div className="flex items-start gap-2">
                      <GripVertical size={16} className="text-slate-300 mt-1 shrink-0" />
                      <div className="flex-1">
                        <div className="flex justify-between mb-2">
                          <div className="font-bold text-blue-600 text-xs">{asset.id}</div>
                          <button onClick={() => removeAsset(idx)} className="text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mb-1">
                          <div className="col-span-2"><label className="text-[10px] text-slate-400">Host Name</label><input className="w-full border p-1 rounded text-xs" value={asset.hostName} onChange={e => updateAsset(idx, 'hostName', e.target.value)} /></div>
                          <div><label className="text-[10px] text-slate-400">Status</label>
                            <select className="w-full border p-1 rounded bg-white text-xs" value={asset.status} onChange={e => updateAsset(idx, 'status', e.target.value)}>
                              <option value="Healthy">Healthy</option><option value="Warning">Warning</option><option value="Critical">Critical</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-1">
                          <div><label className="text-[10px] text-slate-400">Role</label><input className="w-full border p-1 rounded text-xs" value={asset.role} onChange={e => updateAsset(idx, 'role', e.target.value)} /></div>
                          <div><label className="text-[10px] text-slate-400">OS</label><input className="w-full border p-1 rounded text-xs" value={asset.os} onChange={e => updateAsset(idx, 'os', e.target.value)} /></div>
                        </div>
                        <div><label className="text-[10px] text-slate-400">Detail</label><input className="w-full border p-1 rounded text-xs" value={asset.detail} onChange={e => updateAsset(idx, 'detail', e.target.value)} /></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ---- 分析 ---- */}
            {editSection === 'analysis' && (
              <div className="space-y-4 animate-fadeIn">
                <GuideBox page="P.6 & P.7" title="分析コメント" desc="NAS・CPUはP.6に、Re:Veil・WebはP.7（運用証跡）に表示されます。" />
                <div><label className="text-xs font-bold">Re:NAS Storage Analysis</label><textarea className="w-full border p-2 rounded text-sm h-24 mt-1" value={data.performance.nasAnalysis} onChange={e => handlePerformanceChange('nasAnalysis', e.target.value)} /></div>
                <div><label className="text-xs font-bold">CPU Trend Analysis</label><textarea className="w-full border p-2 rounded text-sm h-24 mt-1" value={data.performance.cpuAnalysis} onChange={e => handlePerformanceChange('cpuAnalysis', e.target.value)} /></div>
                <div className="border-t pt-4">
                  <div className="text-[10px] bg-teal-50 text-teal-700 border border-teal-200 rounded px-2 py-1 mb-3 font-bold">↓ P.7（運用証跡）に表示</div>
                  <div><label className="text-xs font-bold">Re:Veil (Mobile) Analysis</label><textarea className="w-full border p-2 rounded text-sm h-24 mt-1" value={data.performance.veilAnalysis} onChange={e => handlePerformanceChange('veilAnalysis', e.target.value)} /></div>
                  <div className="mt-3"><label className="text-xs font-bold">Web / Network Analysis</label><textarea className="w-full border p-2 rounded text-sm h-24 mt-1" value={data.performance.webAnalysis} onChange={e => handlePerformanceChange('webAnalysis', e.target.value)} /></div>
                </div>
              </div>
            )}

            {/* ---- 運用証跡 ---- */}
            {editSection === 'evidence' && (
              <div className="space-y-4 animate-fadeIn">
                <GuideBox page="運用証跡 (P.7)" title="エビデンス管理" desc="タイトル・ステータス・説明をすべて編集できます。" />
                {data.evidenceList.map((ev, idx) => (
                  <div key={ev.id} className="bg-white p-3 rounded border shadow-sm text-sm">
                    <div className="mb-2"><label className="text-[10px] text-slate-400">Title</label><input className="w-full border p-1 rounded font-bold text-blue-600 text-sm" value={ev.title} onChange={e => updateEvidence(idx, 'title', e.target.value)} /></div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div><label className="text-[10px] text-slate-400">Status</label><input className="w-full border p-1 rounded text-xs" value={ev.status} onChange={e => updateEvidence(idx, 'status', e.target.value)} /></div>
                      <div><label className="text-[10px] text-slate-400">Verified Date</label><input className="w-full border p-1 rounded text-xs" value={ev.date} onChange={e => updateEvidence(idx, 'date', e.target.value)} /></div>
                    </div>
                    <div><label className="text-[10px] text-slate-400">Description</label><textarea className="w-full border p-1 rounded h-16 text-xs" value={ev.desc} onChange={e => updateEvidence(idx, 'desc', e.target.value)} /></div>
                  </div>
                ))}
                <div className="pt-4 border-t">
                  <div className="text-xs font-bold text-slate-400 uppercase mb-2">Evidence Screenshots</div>
                  {data.evidenceImages.map((img, idx) => (
                    <div key={idx} className="relative group mb-2">
                      <img src={img} className="w-full rounded border h-32 object-cover" alt="Evidence" />
                      <button onClick={() => removeEvidenceImage(idx)} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={14} /></button>
                    </div>
                  ))}
                  <input type="file" accept="image/*" className="hidden" ref={evidenceImageInputRef} onChange={handleEvidenceImageUpload} />
                  <button onClick={() => evidenceImageInputRef.current?.click()} className="w-full bg-slate-100 border border-dashed border-slate-300 rounded p-3 text-xs text-slate-500 hover:bg-slate-200 flex items-center justify-center gap-2">
                    <Upload size={14} /> Add Screenshot
                  </button>
                </div>
              </div>
            )}

            {/* ---- 変更履歴 ---- */}
            {editSection === 'changes' && (
              <div className="space-y-4 animate-fadeIn">
                <GuideBox page="変更履歴 (P.8)" title="作業ログ" desc="⠿ をドラッグして順番を変更できます。" />
                <div className="flex justify-between items-center">
                  <div className="text-xs font-bold text-slate-400 uppercase">Change Log</div>
                  <button onClick={addChange} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded flex items-center gap-1"><Plus size={12} /> Add</button>
                </div>
                {data.changes.map((log, idx) => (
                  <div key={log.id} draggable
                    onDragStart={() => changeDrag.onDragStart(idx)}
                    onDragOver={e => changeDrag.onDragOver(e, idx)}
                    onDragEnd={changeDrag.onDragEnd}
                    className="bg-white p-3 rounded border shadow-sm text-sm cursor-grab active:cursor-grabbing relative">
                    <div className="flex items-start gap-2">
                      <GripVertical size={16} className="text-slate-300 mt-1 shrink-0" />
                      <div className="flex-1">
                        <button onClick={() => removeChange(idx)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          <div><label className="text-[10px] text-slate-400">Date</label><input className="w-full border p-1 rounded text-xs" value={log.date} onChange={e => updateChange(idx, 'date', e.target.value)} /></div>
                          <div className="col-span-2"><label className="text-[10px] text-slate-400">Type</label><input className="w-full border p-1 rounded text-xs" value={log.type} onChange={e => updateChange(idx, 'type', e.target.value)} /></div>
                        </div>
                        <div className="mb-2"><label className="text-[10px] text-slate-400">Content</label><input className="w-full border p-1 rounded text-xs" value={log.content} onChange={e => updateChange(idx, 'content', e.target.value)} /></div>
                        <div className="grid grid-cols-2 gap-2">
                          <div><label className="text-[10px] text-slate-400">Result</label><input className="w-full border p-1 rounded text-xs" value={log.result} onChange={e => updateChange(idx, 'result', e.target.value)} /></div>
                          <div><label className="text-[10px] text-slate-400">Owner</label><input className="w-full border p-1 rounded text-xs" value={log.owner} onChange={e => updateChange(idx, 'owner', e.target.value)} /></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ---- ニュース ---- */}
            {editSection === 'news' && (
              <div className="space-y-4 animate-fadeIn">
                <GuideBox page="ニュース (P.9)" title="セキュリティ情報" desc="⠿ をドラッグして表示順を変更できます。" />
                <div className="flex justify-between items-center">
                  <div className="text-xs font-bold text-slate-400 uppercase">Global Intelligence</div>
                  <button onClick={addNews} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded flex items-center gap-1"><Plus size={12} /> Add</button>
                </div>
                {data.news.map((item, idx) => (
                  <div key={item.id} draggable
                    onDragStart={() => newsDrag.onDragStart(idx)}
                    onDragOver={e => newsDrag.onDragOver(e, idx)}
                    onDragEnd={newsDrag.onDragEnd}
                    className="bg-white p-3 rounded border shadow-sm text-sm cursor-grab active:cursor-grabbing">
                    <div className="flex items-start gap-2">
                      <GripVertical size={16} className="text-slate-300 mt-1 shrink-0" />
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="font-bold text-blue-600 text-xs">News #{idx + 1}</span>
                          <button onClick={() => removeNews(idx)} className="text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
                        </div>
                        <input className="w-full border p-1 mb-1 rounded text-sm font-bold" value={item.title} onChange={e => updateNews(idx, 'title', e.target.value)} />
                        <textarea className="w-full border p-1 mb-1 rounded h-16 text-xs" value={item.content} onChange={e => updateNews(idx, 'content', e.target.value)} />
                        <textarea className="w-full border bg-red-50 border-red-100 p-1 rounded h-12 text-xs" value={item.impact} onChange={e => updateNews(idx, 'impact', e.target.value)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ---- 提言 ---- */}
            {editSection === 'roadmap' && (
              <div className="space-y-4 animate-fadeIn">
                <GuideBox page="ロードマップ (P.10)" title="今後の計画と提言" desc="来月の施策と中長期提言を入力します。" />
                <div><label className="text-xs font-bold">来月の重点施策</label><textarea className="w-full border p-2 rounded text-sm h-24 mt-1" value={data.roadmap.nextMonth} onChange={e => handleRoadmapChange('nextMonth', e.target.value)} /></div>
                <div><label className="text-xs font-bold">戦略的提言</label><textarea className="w-full border p-2 rounded text-sm h-40 mt-1" value={data.roadmap.strategicAdvice} onChange={e => handleRoadmapChange('strategicAdvice', e.target.value)} /></div>
              </div>
            )}

            {/* ---- 請求書 ---- */}
            {editSection === 'invoice' && (
              <div className="space-y-4 animate-fadeIn">
                <GuideBox page="請求書 (P.11)" title="請求書データ" desc="タブを切り替えて各項目を入力してください。" />
                <div className="flex gap-1 border-b pb-2 flex-wrap">
                  {(['info','sender','client','bank','items'] as const).map(tab => (
                    <button key={tab} onClick={() => setInvoiceSubTab(tab)}
                      className={`text-xs px-2 py-1 rounded ${invoiceSubTab === tab ? 'bg-blue-100 text-blue-700 font-bold' : 'text-slate-500 hover:bg-slate-100'}`}>
                      {{'info':'基本','sender':'請求元','client':'請求先','bank':'銀行','items':'明細'}[tab]}
                    </button>
                  ))}
                </div>

                {invoiceSubTab === 'info' && (
                  <div className="bg-white p-3 rounded border shadow-sm space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="text-[10px] text-slate-400">Invoice No</label><input className="w-full border p-1 rounded text-sm" value={data.invoice.invNo} onChange={e => handleInvoiceChange('invNo', e.target.value)} /></div>
                      <div><label className="text-[10px] text-slate-400">Currency</label>
                        <select className="w-full border p-1 rounded text-sm" value={data.invoice.currency} onChange={e => handleInvoiceChange('currency', e.target.value)}>
                          <option value="JPY">JPY</option><option value="USD">USD</option><option value="PHP">PHP</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="text-[10px] text-slate-400">Issue Date</label><input type="date" className="w-full border p-1 rounded text-sm" value={data.invoice.invDate} onChange={e => handleInvoiceChange('invDate', e.target.value)} /></div>
                      <div><label className="text-[10px] text-slate-400">Due Date</label><input type="date" className="w-full border p-1 rounded text-sm" value={data.invoice.dueDate} onChange={e => handleInvoiceChange('dueDate', e.target.value)} /></div>
                    </div>
                    <div><label className="text-[10px] text-slate-400">Tax Rate (%)</label><input type="number" className="w-full border p-1 rounded text-sm" value={data.invoice.taxRate} onChange={e => handleInvoiceChange('taxRate', parseFloat(e.target.value) || 0)} /></div>
                    <div>
                      <label className="text-[10px] text-slate-400 mb-1 block">Logo</label>
                      <input type="file" ref={fileInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
                      <div className="flex gap-2">
                        <button onClick={() => fileInputRef.current?.click()} className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded text-xs border border-slate-300 hover:bg-slate-200 flex items-center gap-2"><Upload size={14} /> Upload Logo</button>
                        {data.invoice.logoSrc && <button onClick={() => handleInvoiceChange('logoSrc', null)} className="text-red-500 hover:bg-red-50 px-2 rounded"><Trash2 size={14} /></button>}
                      </div>
                    </div>
                  </div>
                )}
                {invoiceSubTab === 'sender' && (
                  <div className="bg-white p-3 rounded border shadow-sm space-y-2">
                    <div className="text-xs font-bold text-blue-600 flex items-center gap-1"><Building size={12} /> Sender</div>
                    <input className="w-full border p-1 rounded text-sm" placeholder="Sender Name" value={data.invoice.senderName} onChange={e => handleInvoiceChange('senderName', e.target.value)} />
                    <textarea className="w-full border p-1 rounded h-24 text-sm" placeholder="Details" value={data.invoice.senderDetails} onChange={e => handleInvoiceChange('senderDetails', e.target.value)} />
                  </div>
                )}
                {invoiceSubTab === 'client' && (
                  <div className="bg-white p-3 rounded border shadow-sm space-y-2">
                    <div className="text-xs font-bold text-blue-600 flex items-center gap-1"><User size={12} /> Client</div>
                    <input className="w-full border p-1 rounded text-sm" placeholder="Client Name" value={data.invoice.clientName} onChange={e => handleInvoiceChange('clientName', e.target.value)} />
                    <textarea className="w-full border p-1 rounded h-24 text-sm" placeholder="Details" value={data.invoice.clientDetails} onChange={e => handleInvoiceChange('clientDetails', e.target.value)} />
                  </div>
                )}
                {invoiceSubTab === 'bank' && (
                  <div className="bg-white p-3 rounded border shadow-sm space-y-2">
                    <div className="text-xs font-bold text-blue-600 mb-1">Bank Info</div>
                    <input className="w-full border p-1 rounded text-sm" placeholder="Bank Name" value={data.invoice.bankName} onChange={e => handleInvoiceChange('bankName', e.target.value)} />
                    <div className="grid grid-cols-2 gap-2">
                      <input className="w-full border p-1 rounded text-sm" placeholder="Branch" value={data.invoice.bankBranch} onChange={e => handleInvoiceChange('bankBranch', e.target.value)} />
                      <input className="w-full border p-1 rounded text-sm" placeholder="SWIFT" value={data.invoice.bankSwift} onChange={e => handleInvoiceChange('bankSwift', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input className="w-full border p-1 rounded text-sm" placeholder="Type" value={data.invoice.bankType} onChange={e => handleInvoiceChange('bankType', e.target.value)} />
                      <input className="w-full border p-1 rounded text-sm" placeholder="Account No" value={data.invoice.bankNo} onChange={e => handleInvoiceChange('bankNo', e.target.value)} />
                    </div>
                    <input className="w-full border p-1 rounded text-sm" placeholder="Holder" value={data.invoice.bankHolder} onChange={e => handleInvoiceChange('bankHolder', e.target.value)} />
                    <textarea className="w-full border p-1 rounded h-16 text-sm" placeholder="Notes" value={data.invoice.notes} onChange={e => handleInvoiceChange('notes', e.target.value)} />
                  </div>
                )}
                {invoiceSubTab === 'items' && (
                  <div className="bg-white p-3 rounded border shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-xs font-bold text-blue-600">Line Items</div>
                      <button onClick={addInvoiceItem} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded flex items-center gap-1"><Plus size={12} /> Add</button>
                    </div>
                    {data.invoice.items.map((item, idx) => (
                      <div key={item.id} className="relative group border-b border-slate-100 pb-2 last:border-0 mb-2">
                        <button onClick={() => removeInvoiceItem(idx)} className="absolute top-0 right-0 text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
                        <input className="w-[90%] border p-1 rounded mb-1 text-sm font-bold" placeholder="Description" value={item.desc} onChange={e => updateInvoiceItem(idx, 'desc', e.target.value)} />
                        <div className="flex gap-2">
                          <input type="number" className="w-20 border p-1 rounded text-right text-sm" placeholder="Qty" value={item.qty} onChange={e => updateInvoiceItem(idx, 'qty', parseInt(e.target.value) || 0)} />
                          <input type="number" className="w-28 border p-1 rounded text-right text-sm" placeholder="Unit Price" value={item.unit} onChange={e => updateInvoiceItem(idx, 'unit', parseInt(e.target.value) || 0)} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ===================== PREVIEW ===================== */}
        <div ref={previewRef} className={`w-full bg-slate-200/50 p-8 overflow-y-auto print:p-0 print:bg-white print:w-full print:overflow-visible shadow-inner rounded-xl ${activeTab === 'edit' ? 'hidden md:block' : ''}`}>

          {/* P.1 Cover */}
          <div className="report-page bg-white shadow-2xl mx-auto mb-8 print:mb-0 print:shadow-none relative flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-slate-100 rounded-bl-[100%] -z-0" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-50 rounded-tr-[100%] -z-0" />
            <div className="p-[20mm] flex-grow flex flex-col justify-center relative z-10">
              <div className="border-l-8 border-blue-600 pl-8 mb-20">
                <p className="text-slate-500 tracking-[0.3em] font-bold text-sm uppercase mb-4">Confidential Security Audit</p>
                <h1 className="text-5xl font-bold text-slate-900 leading-tight mb-6">Monthly System<br /><span className="text-blue-600">Audit & Resilience</span><br />Report</h1>
                <p className="text-xl text-slate-600 font-serif italic">Comprehensive Asset Protection & Threat Analysis</p>
              </div>
              <div className="max-w-lg">
                {[{ label: 'Client', value: `${data.meta.clientName} 御中` }, { label: 'Reporting Period', value: `${data.meta.year} / ${data.meta.month}` }, { label: 'Issue Date', value: data.meta.createDate }, { label: 'Prepared By', value: data.meta.author }].map((row, i) => (
                  <div key={i} className="flex border-b border-slate-200 py-4">
                    <span className="w-40 text-slate-400 font-bold text-xs uppercase tracking-wider pt-1">{row.label}</span>
                    <span className="text-slate-800 font-bold text-lg">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-900 text-white p-8 text-center relative z-10">
              <div className="text-sm font-bold tracking-widest uppercase mb-1">{data.meta.companyName}</div>
              <div className="text-[10px] text-slate-400">Advanced Cyber Security Solutions</div>
            </div>
          </div>
          <div className="page-break" />

          {/* P.2 TOC */}
          <div className="report-page bg-white shadow-2xl mx-auto mb-8 print:mb-0 print:shadow-none p-[15mm]">
            <PageHeader meta={data.meta} pageNum={2} totalPages={totalPages} title="Table of Contents" />
            <h2 className="text-2xl font-bold text-slate-800 mb-12 mt-8">目次</h2>
            <div className="space-y-6 max-w-2xl mx-auto">
              {[
                { p: 3, t: 'エグゼクティブ・サマリー' }, { p: 4, t: 'セキュリティインシデント統計' },
                { p: 5, t: '資産稼働状況詳細' }, { p: 6, t: 'リソース＆パフォーマンス分析' },
                { p: 7, t: '運用証跡・エビデンス' }, { p: 8, t: '変更管理・メンテナンス履歴' },
                { p: 9, t: 'Global Threat Intelligence' }, { p: 10, t: '戦略的ロードマップ＆提言' },
                { p: 11, t: '請求書 (Invoice)' },
              ].map(item => (
                <div key={item.p} className="flex items-baseline border-b border-dashed border-slate-300 pb-2">
                  <span className="text-lg font-bold text-slate-700">{item.t}</span>
                  <span className="flex-grow" />
                  <span className="text-slate-500 font-mono">P.{item.p}</span>
                </div>
              ))}
            </div>
            <div className="mt-24 p-6 bg-slate-50 rounded border border-slate-200">
              <h3 className="font-bold text-slate-700 mb-2 text-sm uppercase">監査対象スコープ</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                本レポートは、貴社より委託を受けた以下の領域を対象としています。<br />
                1. <strong>Re:NAS</strong> の可用性およびデータ保全性<br />
                2. <strong>Re:Veil</strong> のOS整合性およびフリート管理状況<br />
                3. <strong>Web Server</strong> の外部公開サービスにおける脆弱性および攻撃検知状況
              </p>
            </div>
          </div>
          <div className="page-break" />

          {/* P.3 Summary */}
          <div className="report-page bg-white shadow-2xl mx-auto mb-8 print:mb-0 print:shadow-none p-[15mm]">
            <PageHeader meta={data.meta} pageNum={3} totalPages={totalPages} title="Executive Summary" />
            <SectionHeader number="1" title="エグゼクティブ・サマリー" subTitle="Overall Health & Key Highlights" />
            <div className="mb-8">
              <h3 className="text-sm font-bold text-slate-500 mb-4 uppercase">1.1 総合健全性スコア判定</h3>
              <ScoreCard score={data.summary.score} />
            </div>
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div className="bg-blue-50 p-5 rounded border-l-4 border-blue-600">
                <div className="text-xs font-bold text-blue-800 uppercase mb-2">System Uptime</div>
                <div className="text-3xl font-bold text-slate-800">{data.summary.uptime}</div>
                <div className="text-xs text-slate-500 mt-1">計画停止を除く実稼働率</div>
              </div>
              <div className="bg-indigo-50 p-5 rounded border-l-4 border-indigo-600">
                <div className="text-xs font-bold text-indigo-800 uppercase mb-2">Threats Blocked</div>
                <div className="text-3xl font-bold text-slate-800">{data.summary.threatsBlocked}</div>
                <div className="text-xs text-slate-500 mt-1">IPS/WAFによる自動防御件数</div>
              </div>
            </div>
            <div className="mb-6">
              <h3 className="text-sm font-bold text-slate-500 mb-4 uppercase">1.2 コンサルタント総評</h3>
              <div className="text-sm leading-7 whitespace-pre-wrap text-justify">{data.summary.comment}</div>
            </div>
          </div>
          <div className="page-break" />

          {/* P.4 Threat Stats */}
          <div className="report-page bg-white shadow-2xl mx-auto mb-8 print:mb-0 print:shadow-none p-[15mm]">
            <PageHeader meta={data.meta} pageNum={4} totalPages={totalPages} title="Security Statistics" />
            <SectionHeader number="2" title="セキュリティインシデント統計" subTitle="Threat Detection & Analysis" />
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-4"><ShieldCheck className="w-5 h-5 text-blue-600" /><h3 className="font-bold text-slate-700">検知された攻撃の内訳</h3></div>
              <div className="p-6 bg-slate-50 rounded-xl border border-slate-200"><SimplePieChart data={data.threatStats} /></div>
              <div className="mt-4 text-xs text-slate-500 text-center">※ FW/WAFにて遮断された攻撃の種別内訳（実被害なし）</div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="p-4 border border-slate-200 rounded">
                <h4 className="font-bold text-sm text-slate-700 mb-2">{data.securityAnalysis.globalIpTitle}</h4>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{data.securityAnalysis.globalIpComment}</p>
              </div>
              <div className="p-4 border border-slate-200 rounded">
                <h4 className="font-bold text-sm text-slate-700 mb-2">{data.securityAnalysis.botDefenseTitle}</h4>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{data.securityAnalysis.botDefenseComment}</p>
              </div>
            </div>
          </div>
          <div className="page-break" />

          {/* P.5 Assets */}
          <div className="report-page bg-white shadow-2xl mx-auto mb-8 print:mb-0 print:shadow-none p-[15mm]">
            <PageHeader meta={data.meta} pageNum={5} totalPages={totalPages} title="Asset Details" />
            <SectionHeader number="3" title="資産稼働状況詳細" subTitle="Detailed Status per Asset" />
            <div className="space-y-6">
              {data.assets.map((asset, i) => (
                <div key={i} className="break-inside-avoid border border-slate-200 rounded-lg p-5 shadow-sm">
                  <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${asset.id.includes('NAS') ? 'bg-indigo-100 text-indigo-600' : asset.id.includes('MOB') ? 'bg-teal-100 text-teal-600' : 'bg-blue-100 text-blue-600'}`}>
                        {asset.id.includes('NAS') ? <HardDrive size={20} /> : asset.id.includes('MOB') ? <Smartphone size={20} /> : <Globe size={20} />}
                      </div>
                      <div>
                        <div className="font-bold text-lg text-slate-800">{asset.hostName}</div>
                        <div className="text-xs text-slate-500 font-mono">{asset.id} | {asset.os}</div>
                      </div>
                    </div>
                    <StatusBadge status={asset.status} />
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div><div className="text-xs font-bold text-slate-400 uppercase mb-1">Role</div><div className="font-medium text-slate-700">{asset.role}</div></div>
                    <div className="col-span-2"><div className="text-xs font-bold text-slate-400 uppercase mb-1">Technical Status</div><div className="font-mono text-xs bg-slate-50 p-2 rounded border border-slate-200 text-slate-600">{asset.detail}</div></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="page-break" />

          {/* P.6 Performance */}
          <div className="report-page bg-white shadow-2xl mx-auto mb-8 print:mb-0 print:shadow-none p-[15mm]">
            <PageHeader meta={data.meta} pageNum={6} totalPages={totalPages} title="Performance Analysis" />
            <SectionHeader number="4" title="リソース＆パフォーマンス分析" subTitle="Capacity Planning & Trends" />
            <div className="mb-10 break-inside-avoid">
              <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-4"><HardDrive className="w-5 h-5 text-indigo-500" />Re:NAS Storage Growth (直近{GRAPH_MONTHS}ヶ月)</h3>
              <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-4"><SimpleBarChart data={data.resourceStats.nasStorage} color="#6366f1" /></div>
              <div className="bg-indigo-50 border-l-4 border-indigo-400 p-4 text-sm text-slate-700 leading-relaxed rounded-r"><strong>【専門家による分析】</strong><br />{data.performance.nasAnalysis}</div>
            </div>
            <div className="mb-8 break-inside-avoid">
              <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-4"><Cpu className="w-5 h-5 text-blue-500" />System Load Average / CPU (直近{GRAPH_MONTHS}ヶ月)</h3>
              <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-4"><SimpleBarChart data={data.resourceStats.cpuUsage} color="#3b82f6" /></div>
              <div className="p-4 text-sm text-slate-600 leading-relaxed border border-slate-200 rounded"><strong>【トレンド分析】</strong><br />{data.performance.cpuAnalysis}</div>
            </div>
          </div>
          <div className="page-break" />

          {/* P.7 Evidence */}
          <div className="report-page bg-white shadow-2xl mx-auto mb-8 print:mb-0 print:shadow-none p-[15mm]">
            <PageHeader meta={data.meta} pageNum={7} totalPages={totalPages} title="Operational Evidence" />
            <SectionHeader number="5" title="運用証跡 (Evidence)" subTitle="Proof of Protection" />
            <div className="grid grid-cols-1 gap-6">
              {data.evidenceList.map((ev, i) => (
                <div key={i} className="flex gap-4 p-4 border border-slate-200 rounded-lg shadow-sm break-inside-avoid">
                  <div className="bg-slate-100 p-4 rounded flex items-center justify-center text-slate-500 w-16 h-16 shrink-0">
                    {ev.iconType === 'db' ? <Database /> : ev.iconType === 'shield' ? <ShieldCheck /> : <Activity />}
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between mb-1">
                      <h4 className="font-bold text-slate-800">{ev.title}</h4>
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold">{ev.status}</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-2 font-mono">Verified At: {ev.date}</p>
                    <p className="text-sm text-slate-600">{ev.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Device & Network Analysis */}
            <div className="mt-8 space-y-4">
              <h3 className="text-sm font-bold text-slate-500 uppercase border-b border-slate-200 pb-2">Device & Network Analysis</h3>
              <div className="flex gap-4 p-4 border border-slate-200 rounded-lg shadow-sm break-inside-avoid">
                <div className="bg-teal-100 p-4 rounded flex items-center justify-center text-teal-600 w-16 h-16 shrink-0"><Smartphone size={24} /></div>
                <div className="flex-grow">
                  <h4 className="font-bold text-slate-800 mb-1">Re:Veil (Mobile) Analysis</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">{data.performance.veilAnalysis}</p>
                </div>
              </div>
              <div className="flex gap-4 p-4 border border-slate-200 rounded-lg shadow-sm break-inside-avoid">
                <div className="bg-blue-100 p-4 rounded flex items-center justify-center text-blue-600 w-16 h-16 shrink-0"><Globe size={24} /></div>
                <div className="flex-grow">
                  <h4 className="font-bold text-slate-800 mb-1">Web / Network Analysis</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">{data.performance.webAnalysis}</p>
                </div>
              </div>
            </div>

            {/* Evidence Images */}
            <div className="mt-8 p-6 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50">
              {data.evidenceImages.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {data.evidenceImages.map((img, idx) => (
                    <div key={idx} className="bg-white p-2 shadow-sm rounded border border-slate-200">
                      <img src={img} className="w-full h-auto rounded" alt={`Evidence ${idx + 1}`} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-slate-400 py-8">
                  <ImageIcon className="mx-auto h-12 w-12 text-slate-300 mb-2" />
                  <span className="text-sm font-bold block">Additional Evidence Screenshots</span>
                  <span className="text-xs">(No images attached)</span>
                </div>
              )}
            </div>
          </div>
          <div className="page-break" />

          {/* P.8 Changes */}
          <div className="report-page bg-white shadow-2xl mx-auto mb-8 print:mb-0 print:shadow-none p-[15mm]">
            <PageHeader meta={data.meta} pageNum={8} totalPages={totalPages} title="Change Management" />
            <SectionHeader number="6" title="変更管理・メンテナンス履歴" subTitle="System Audit Log" />
            <div className="overflow-hidden rounded-lg border border-slate-200 shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="px-4 py-3 border-b font-bold w-20">Date</th>
                    <th className="px-4 py-3 border-b font-bold w-24">Type</th>
                    <th className="px-4 py-3 border-b font-bold">Content</th>
                    <th className="px-4 py-3 border-b font-bold w-20 text-center">Result</th>
                    <th className="px-4 py-3 border-b font-bold w-20">Owner</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.changes.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{log.date}</td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-600">
                        <span className={`px-2 py-1 rounded ${log.type === '障害対応' ? 'bg-red-50 text-red-600' : 'bg-slate-100'}`}>{log.type}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{log.content}</td>
                      <td className="px-4 py-3 text-center"><span className="text-green-600 text-xs font-bold border border-green-200 bg-green-50 px-2 py-0.5 rounded">{log.result}</span></td>
                      <td className="px-4 py-3 text-xs text-slate-500">{log.owner}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-8 text-xs text-slate-500"><p>※ 本リストには、システム構成に影響を与える変更およびセキュリティパッチ適用のみを記載しています。</p></div>
          </div>
          <div className="page-break" />

          {/* P.9 Intelligence */}
          <div className="report-page bg-white shadow-2xl mx-auto mb-8 print:mb-0 print:shadow-none p-[15mm]">
            <PageHeader meta={data.meta} pageNum={9} totalPages={totalPages} title="Global Intelligence" />
            <SectionHeader number="7" title="Global Security Intelligence" subTitle="Threat Trends & Risk Analysis" />
            <div className="space-y-6">
              {data.news.map(item => (
                <div key={item.id} className="bg-white border border-slate-200 p-6 rounded-lg shadow-sm break-inside-avoid">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-slate-800 text-lg flex items-center gap-2"><Globe className="w-4 h-4 text-blue-500" />{item.title}</h4>
                    <span className="text-xs text-slate-400 whitespace-nowrap bg-slate-50 px-2 py-1 rounded">{item.date} | {item.source}</span>
                  </div>
                  <p className="text-sm text-slate-600 mb-4 leading-relaxed">{item.content}</p>
                  <div className="flex items-start gap-3 bg-red-50 p-4 rounded-lg border border-red-100">
                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-red-800 uppercase mb-1">Impact & Mitigation</div>
                      <p className="text-sm font-medium text-red-700 leading-relaxed">{item.impact}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="page-break" />

          {/* P.10 Roadmap */}
          <div className="report-page bg-white shadow-2xl mx-auto mb-8 print:mb-0 print:shadow-none p-[15mm] flex flex-col justify-between min-h-[297mm]">
            <div>
              <PageHeader meta={data.meta} pageNum={10} totalPages={totalPages} title="Strategic Roadmap" />
              <SectionHeader number="8" title="戦略的ロードマップ＆提言" subTitle="Future Strategy & Recommendations" />
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-4"><List className="w-5 h-5 text-slate-400" /><h3 className="text-sm font-bold text-slate-500 uppercase">Next Month's Focus</h3></div>
                <div className="bg-white border-l-4 border-blue-500 p-6 shadow-sm rounded-r-lg whitespace-pre-wrap text-sm leading-7 text-slate-700">{data.roadmap.nextMonth}</div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-4"><TrendingUp className="w-5 h-5 text-slate-400" /><h3 className="text-sm font-bold text-slate-500 uppercase">Strategic Advice</h3></div>
                <div className="bg-slate-800 text-slate-200 p-8 rounded-xl shadow-lg whitespace-pre-wrap text-sm leading-7">{data.roadmap.strategicAdvice}</div>
              </div>
            </div>
            <div className="mt-12 pt-8 border-t border-slate-200 text-center">
              <p className="text-slate-400 text-xs mb-2">End of Report</p>
              <div className="inline-block bg-slate-100 px-4 py-2 rounded-full text-slate-500 text-xs font-bold">Generated by {data.meta.companyName} Reporting System</div>
            </div>
          </div>
          <div className="page-break" />

          {/* P.11 Invoice */}
          <div className="report-page bg-white shadow-2xl mx-auto mb-8 print:mb-0 print:shadow-none p-[13mm] flex flex-col min-h-[297mm] text-slate-800">
            <div className="flex justify-between items-start border-b-4 border-slate-800 pb-6 mb-8">
              <div>
                <div className="text-4xl font-black text-slate-900 tracking-tight mb-2">INVOICE</div>
                <div className="text-xs text-slate-500 font-bold uppercase tracking-widest">{data.meta.companyName}</div>
              </div>
              <div className="text-right flex flex-col items-end">
                {data.invoice.logoSrc
                  ? <img src={data.invoice.logoSrc} alt="Logo" className="h-16 object-contain mb-2" />
                  : <div className="text-5xl font-black text-slate-100 tracking-widest absolute top-[13mm] right-[13mm] pointer-events-none select-none opacity-20 -rotate-12">KAKEHASHI</div>
                }
                <div className="text-sm font-bold mt-2">{data.invoice.senderName}</div>
                <div className="text-xs text-slate-500 whitespace-pre-wrap text-right leading-tight">{data.invoice.senderDetails}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
              <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-2">Bill To</div>
                <div className="font-bold text-lg mb-1">{data.invoice.clientName}</div>
                <div className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{data.invoice.clientDetails}</div>
              </div>
              <div className="space-y-4">
                {[{ label: 'Invoice No', value: data.invoice.invNo }, { label: 'Issue Date', value: data.invoice.invDate }, { label: 'Due Date', value: data.invoice.dueDate }].map((row, i) => (
                  <div key={i} className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase">{row.label}</span>
                    <span className="font-mono font-bold">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-grow">
              <table className="w-full mb-8">
                <thead className="bg-slate-100 text-slate-600 text-xs uppercase font-black">
                  <tr>
                    <th className="py-3 px-4 text-left rounded-l">Description</th>
                    <th className="py-3 px-4 text-right w-20">Qty</th>
                    <th className="py-3 px-4 text-right w-32">Unit Price</th>
                    <th className="py-3 px-4 text-right w-32 rounded-r">Amount</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-100">
                  {data.invoice.items.map(item => (
                    <tr key={item.id}>
                      <td className="py-3 px-4 font-medium">{item.desc}</td>
                      <td className="py-3 px-4 text-right font-mono">{item.qty}</td>
                      <td className="py-3 px-4 text-right font-mono">{fmtMoney(item.unit, data.invoice.currency)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold">{fmtMoney(item.qty * item.unit, data.invoice.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-2 gap-12 items-end border-t border-slate-200 pt-8">
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4" /> Bank Transfer Info</div>
                <div className="bg-slate-50 p-4 rounded border border-slate-200 text-sm space-y-1">
                  {[
                    { l: 'Bank', v: data.invoice.bankName }, { l: 'Branch', v: data.invoice.bankBranch },
                    { l: 'SWIFT/BIC', v: data.invoice.bankSwift }, { l: 'Type', v: data.invoice.bankType },
                    { l: 'Account No', v: data.invoice.bankNo }, { l: 'Holder', v: data.invoice.bankHolder },
                  ].filter(r => r.v).map((row, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="text-slate-500">{row.l}</span>
                      <span className="font-bold font-mono">{row.v}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-xs text-slate-500 bg-yellow-50 p-2 rounded border border-yellow-100">Note: {data.invoice.notes}</div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-slate-500">Subtotal</span>
                  <span className="font-mono font-bold">{fmtMoney(invoiceCalc.subtotal, data.invoice.currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-slate-500">Tax ({data.invoice.taxRate}%)</span>
                  <span className="font-mono font-bold">{fmtMoney(invoiceCalc.tax, data.invoice.currency)}</span>
                </div>
                <div className="flex justify-between text-xl border-t-2 border-slate-800 pt-3">
                  <span className="font-black text-slate-900">TOTAL</span>
                  <span className="font-mono font-black text-blue-600">{fmtMoney(invoiceCalc.total, data.invoice.currency)}</span>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-8 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400">
              <div>{data.invoice.senderName}</div>
              <div>Generated by KAKEHASHI System</div>
            </div>
          </div>

        </div>
      </main>

      <style>{`
        .report-page { width: 210mm; min-height: 297mm; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
        @media print {
          @page { margin: 0; size: A4; }
          body { background: white; -webkit-print-color-adjust: exact; }
          .report-page { margin: 0; width: 100%; min-height: auto; page-break-after: auto; break-after: auto; border: none; box-shadow: none; }
          .page-break { page-break-after: always; break-after: page; height: 0; display: block; }
        }
        svg { print-color-adjust: exact; }
      `}</style>
    </div>
  );
}
