import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import './report-executive.css';
import {
  Printer, ShieldCheck, Globe, Database, Smartphone,
  Info, Plus, Trash2,
  AlertTriangle, Activity, Upload, User, Building, X,
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
    labels.push(`${targetYear}/${String(targetMonth).padStart(2, '0')}`);
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
// ※ 公開リポジトリのため、実在の口座番号・Tax ID・電話番号などは初期値に書かないこと。
//   実データは JSON ファイル側で管理する。
const buildInitialData = (): ReportData => {
  const meta = getTodayMeta();
  const labels = getPrevMonthLabels(meta.year, meta.month, GRAPH_MONTHS);
  return {
    meta: {
      ...meta,
      clientName: '（顧客名）',
      author: '（担当コンサルタント名）',
      companyName: 'KAKEHASHI ASIA INC.',
    },
    summary: {
      score: 'A', uptime: '99.9%', threatsBlocked: '0', backupStatus: '全日成功',
      comment: '（当月の総評を記入）\n\n例：当月において、事業運営に影響を与えるシステム停止およびセキュリティインシデントは確認されませんでした。',
    },
    threatStats: [
      { name: 'Port Scan', count: 0, color: '#1E3A5F' },
      { name: 'Brute Force', count: 0, color: '#A8874F' },
      { name: 'Known Malicious IP', count: 0, color: '#5B7083' },
      { name: 'Other', count: 0, color: '#C9BFA8' },
    ],
    securityAnalysis: {
      globalIpTitle: 'Perimeter Defense（境界防御）',
      globalIpComment: '（外部からのアクセス試行の傾向と遮断状況を記入）',
      botDefenseTitle: 'Reconnaissance Blocking（偵察行為の遮断）',
      botDefenseComment: '（スキャン・総当たり攻撃などの検知と対処を記入）',
    },
    resourceStats: {
      nasStorage: labels.map(month => ({ month, value: 0 })),
      cpuUsage:   labels.map(month => ({ month, value: 0 })),
    },
    assets: [
      { id: 'NAS-01', hostName: 'Re:NAS-Main', role: 'セキュアNAS', os: 'OpenMediaVault 8', status: 'Healthy', detail: 'RAID5: clean / SMART: PASSED' },
      { id: 'MOB-001', hostName: 'Re:Veil-01', role: 'セキュアスマホ', os: 'GrapheneOS', status: 'Healthy', detail: 'Auditor: Verified' },
      { id: 'MOB-002', hostName: 'Re:Veil-02', role: 'セキュアスマホ', os: 'GrapheneOS', status: 'Healthy', detail: 'Auditor: Verified' },
    ],
    performance: {
      nasAnalysis: '（容量推移と増設時期の見通しを記入）',
      cpuAnalysis: '（負荷の推移とピークの要因を記入）',
      veilAnalysis: '（OSアップデート適用状況・Auditor検証結果を記入）',
      webAnalysis: '',
    },
    evidenceList: [
      { id: 'ev1', title: 'Backup', iconType: 'db', status: 'Success', desc: '（バックアップ完了の確認内容を記入）', date: '' },
      { id: 'ev2', title: 'Re:Veil Device Integrity', iconType: 'shield', status: 'Verified', desc: '（Auditorによる端末検証結果を記入）', date: '' },
      { id: 'ev3', title: 'RAID / Disk Health Check', iconType: 'activity', status: 'Verified', desc: '（RAID状態・SMART検査の結果を記入）', date: '' },
    ],
    evidenceImages: [],
    news: [
      { id: 'n1', title: '（ニュース見出し）', date: '', source: '', content: '（概要）', impact: '（貴社への影響と対策）' },
    ],
    changes: [
      { id: '1', date: '', type: '定期メンテ', content: '（作業内容）', result: '完了', owner: '' },
    ],
    roadmap: {
      nextMonth: '（来月の予定作業）',
      strategicAdvice: '（中長期の提言）',
    },
    invoice: {
      invNo: `INV-${meta.year}${meta.month}`, invDate: '', dueDate: '',
      currency: 'PHP', taxRate: 0, logoSrc: null,
      senderName: 'KAKEHASHI ASIA INC.',
      senderDetails: '（住所）\nTax ID: （JSON側で入力）',
      clientName: '（請求先）', clientDetails: '',
      bankName: '', bankBranch: '', bankSwift: '', bankType: '', bankNo: '', bankHolder: '',
      notes: 'Please remit the payment by the due date.\nBank fees, if any, are to be borne by the payer.',
      items: [
        { id: '1', desc: 'Maintenance Plan -Executive-', qty: 1, unit: 0 },
      ],
    },
  };
};

// 読み込んだJSONの欠けている項目を初期値で補い、型の違う値を直す（画面が真っ白になるのを防ぐ）
const mergeDefaults = (def: unknown, raw: unknown): unknown => {
  if (def === null) return raw ?? null;
  if (Array.isArray(def)) {
    if (!Array.isArray(raw)) return def;
    const tmpl = def[0];
    return tmpl !== undefined && typeof tmpl === 'object' ? raw.map(r => mergeDefaults(tmpl, r)) : raw;
  }
  if (typeof def === 'object') {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return def;
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(def as object)) {
      out[k] = mergeDefaults((def as Record<string, unknown>)[k], (raw as Record<string, unknown>)[k]);
    }
    return out;
  }
  if (raw === undefined || raw === null) return def;
  if (typeof def === 'number') {
    const n = typeof raw === 'number' ? raw : Number(raw);
    return Number.isFinite(n) ? n : def;
  }
  if (typeof def === 'string') return typeof raw === 'string' ? raw : String(raw);
  return typeof raw === typeof def ? raw : def;
};

const normalizeData = (raw: unknown): ReportData => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('invalid');
  return mergeDefaults(buildInitialData(), raw) as ReportData;
};

const docRef = (meta: ReportData['meta']) => `SAR-${meta.year}-${String(meta.month).padStart(2, '0')}`;

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
// EXECUTIVE DESIGN COMPONENTS（印刷される報告書の部品）
// ============================================================
const EX_PALETTE = ['#13294B', '#A8874F', '#5B7083', '#C9BFA8', '#2E4A6B', '#7A6A4F'];

const DonutChart = ({ data }: { data: ThreatStat[] }) => {
  const total = data.reduce((acc, cur) => acc + (cur.count || 0), 0);
  if (total === 0) return <div className="ex-empty">当月の検知データなし</div>;
  const R = 40;
  const C = 2 * Math.PI * R;
  const segs = data.reduce<{ name: string; count: number; start: number; frac: number; color: string }[]>((acc, item, i) => {
    const prev = acc[acc.length - 1];
    const start = prev ? prev.start + prev.frac : 0;
    acc.push({ name: item.name, count: item.count, start, frac: (item.count || 0) / total, color: EX_PALETTE[i % EX_PALETTE.length] });
    return acc;
  }, []);
  return (
    <div className="ex-donut">
      <svg viewBox="0 0 100 100" className="ex-donut-svg">
        <circle cx="50" cy="50" r={R} fill="none" stroke="#ECE7DC" strokeWidth="11" />
        {segs.map((s, i) => (
          <circle key={i} cx="50" cy="50" r={R} fill="none" stroke={s.color} strokeWidth="11"
            strokeDasharray={`${s.frac * C} ${C}`} strokeDashoffset={-s.start * C}
            transform="rotate(-90 50 50)" />
        ))}
        <text x="50" y="49" textAnchor="middle" className="ex-donut-num">{total.toLocaleString()}</text>
        <text x="50" y="59" textAnchor="middle" className="ex-donut-cap">TOTAL BLOCKED</text>
      </svg>
      <table className="ex-legend">
        <tbody>
          {segs.map((s, i) => (
            <tr key={i}>
              <td><span className="ex-swatch" style={{ backgroundColor: s.color }} /></td>
              <td className="ex-legend-name">{s.name}</td>
              <td className="ex-num">{s.count.toLocaleString()}</td>
              <td className="ex-legend-pct">{(s.frac * 100).toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const BarChart = ({ data, unit = '%' }: { data: ResourceStat[]; unit?: string }) => {
  const maxValue = Math.max(...data.map(d => d.value), 100);
  return (
    <div className="ex-bars">
      <div className="ex-bars-plot">
        {[25, 50, 75].map(g => <div key={g} className="ex-grid" style={{ bottom: `${(g / maxValue) * 100}%` }}><span>{g}{unit}</span></div>)}
        {data.map((item, i) => (
          <div key={i} className="ex-bar-col">
            <div className="ex-bar-val">{item.value}{unit}</div>
            <div className={`ex-bar ${i === data.length - 1 ? 'is-current' : ''}`} style={{ height: `${Math.max((item.value / maxValue) * 100, 1.5)}%` }} />
          </div>
        ))}
      </div>
      <div className="ex-bars-labels">
        {data.map((item, i) => <div key={i} className={i === data.length - 1 ? 'is-current' : ''}>{item.month}</div>)}
      </div>
    </div>
  );
};

const StatusMark = ({ status }: { status: string }) => {
  const map: Record<string, { jp: string; en: string; cls: string }> = {
    Healthy: { jp: '正常', en: 'NOMINAL', cls: 'ok' },
    Warning: { jp: '注意', en: 'ADVISORY', cls: 'warn' },
    Critical: { jp: '警戒', en: 'CRITICAL', cls: 'crit' },
  };
  const s = map[status] ?? { jp: status, en: '', cls: 'warn' };
  return <span className={`ex-status ${s.cls}`}><i />{s.jp}<small>{s.en}</small></span>;
};

const Monogram = ({ name, size = 28, light = false }: { name: string; size?: number; light?: boolean }) => {
  const letter = (name.trim()[0] ?? 'K').toUpperCase();
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className="ex-mono">
      <circle cx="20" cy="20" r="19" fill="none" stroke="#A8874F" strokeWidth="1" />
      <circle cx="20" cy="20" r="16" fill="none" stroke="#A8874F" strokeWidth="0.5" />
      <text x="20" y="26.5" textAnchor="middle" fill={light ? '#E9DFC8' : '#13294B'} className="ex-mono-letter">{letter}</text>
    </svg>
  );
};

const SectionHeader = ({ number, title, subTitle }: { number: string; title: string; subTitle: string }) => (
  <div className="ex-section">
    <div className="ex-section-no">{number}</div>
    <div>
      <div className="ex-section-en">{subTitle}</div>
      <h2 className="ex-section-title">{title}</h2>
    </div>
  </div>
);

const SubHeading = ({ children }: { children: React.ReactNode }) => <h3 className="ex-sub">{children}</h3>;

const PageFrame = ({ meta, pageNum, totalPages, section, children }: { meta: ReportData['meta']; pageNum: number; totalPages: number; section: string; children: React.ReactNode }) => (
  <section className="report-page ex-page">
    <header className="ex-head">
      <div className="ex-head-l">
        <Monogram name={meta.companyName} size={24} />
        <div>
          <div className="ex-head-title">月次セキュリティ監査報告書</div>
          <div className="ex-head-meta">{meta.clientName} 御中 ／ {meta.year}年{Number(meta.month)}月度</div>
        </div>
      </div>
      <div className="ex-head-r">
        <div className="ex-class">CONFIDENTIAL</div>
        <div className="ex-head-sec">{section}</div>
      </div>
    </header>
    <div className="ex-body">{children}</div>
    <footer className="ex-foot">
      <span>Ref. {docRef(meta)}</span>
      <span>本書は機密情報を含みます。権限のない複製・転送・開示を禁じます。</span>
      <span className="ex-pg">{String(pageNum).padStart(2, '0')} <em>/</em> {String(totalPages).padStart(2, '0')}</span>
    </footer>
  </section>
);

const ScoreSeal = ({ score }: { score: string }) => {
  const descs: Record<string, string> = {
    S: '極めて安定 ― 模範的な運用状態',
    A: '概ね安定 ― 軽微な対応を推奨',
    B: '要注意 ― 改善を推奨',
    C: '危険 ― 即時対応が必要',
  };
  return (
    <div className="ex-score">
      <div className="ex-seal">
        <svg viewBox="0 0 120 120" width="132" height="132">
          <circle cx="60" cy="60" r="57" fill="none" stroke="#A8874F" strokeWidth="1.2" />
          <circle cx="60" cy="60" r="51" fill="#13294B" />
          <circle cx="60" cy="60" r="47" fill="none" stroke="#A8874F" strokeWidth="0.6" />
          <text x="60" y="78" textAnchor="middle" className="ex-seal-letter">{score}</text>
        </svg>
      </div>
      <div>
        <div className="ex-kicker">Overall Health Rating</div>
        <div className="ex-score-title">総合健全性評価</div>
        <div className="ex-score-desc">{descs[score] ?? ''}</div>
        <div className="ex-note">評価基準：可用性 40％ ＋ セキュリティ強度 40％ ＋ リソース余裕度 20％</div>
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
      if (saved) return normalizeData(JSON.parse(saved));
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
  const [saveFailed, setSaveFailed] = useState(false);
  useEffect(() => {
    // 入力のたびに書き込まないよう、少し待ってから保存する
    const t = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); setSaveFailed(false); }
      catch { setSaveFailed(true); }
    }, 400);
    return () => clearTimeout(t);
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
        const parsed = normalizeData(JSON.parse(ev.target?.result as string));
        setData(parsed);
        setShowRestoreBanner(false);
        alert('データを読み込みました。不足していた項目は初期値で補完しています。');
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
    const rawTax = subtotal * (data.invoice.taxRate / 100);
    // 円は1円未満切り捨て、USD/PHPはセント単位で四捨五入
    const tax = data.invoice.currency === 'JPY' ? Math.floor(rawTax) : Math.round(rawTax * 100) / 100;
    return { subtotal, tax, total: subtotal + tax };
  }, [data.invoice]);

  const totalPages = 12;
  const hasNas = data.assets.some(a => a.id.includes('NAS'));
  const hasMobile = data.assets.some(a => a.id.includes('MOB'));
  const hasWeb = data.assets.some(a => a.id.includes('WEB'));
  const tocItems = [
    { p: 3, t: 'エグゼクティブ・サマリー', en: 'Executive Summary' },
    { p: 4, t: 'セキュリティインシデント統計', en: 'Threat Detection & Analysis' },
    { p: 5, t: '資産稼働状況', en: 'Asset Status' },
    { p: 6, t: 'リソース＆パフォーマンス分析', en: 'Capacity Planning & Trends' },
    { p: 7, t: '運用証跡', en: 'Proof of Protection' },
    { p: 8, t: hasWeb ? 'デバイス＆ネットワーク分析' : 'デバイス分析', en: 'Device Integrity' },
    { p: 9, t: '変更管理・メンテナンス履歴', en: 'System Change Log' },
    { p: 10, t: '脅威インテリジェンス', en: 'Global Threat Intelligence' },
    { p: 11, t: '戦略的ロードマップ＆提言', en: 'Strategy & Recommendations' },
    { p: 12, t: '請求書', en: 'Invoice' },
  ];

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="min-h-screen bg-gray-100 font-sans text-slate-800 print:bg-white print:min-h-0">
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

      {/* 自動保存失敗の警告 */}
      {saveFailed && (
        <div className="print:hidden bg-red-700 text-white px-6 py-2 flex items-center gap-2 text-sm">
          <AlertCircle size={14} /> 自動保存できませんでした（画像が大きすぎる可能性があります）。「エクスポート」でJSONを保存してください。
        </div>
      )}

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

      <main className="max-w-[1600px] mx-auto p-4 md:p-8 flex gap-8 items-start print:block print:p-0 print:m-0 print:max-w-none">

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
        <div ref={previewRef} className={`ex-root w-full bg-[#D9D4CA] p-8 overflow-y-auto print:p-0 print:bg-white print:w-full print:overflow-visible shadow-inner rounded-xl ${activeTab === 'edit' ? 'hidden md:block' : ''}`}>

          {/* P.1 Cover */}
          <section className="report-page ex-cover">
            <div className="ex-cover-frame">
              <div className="ex-cover-band">{'CONFIDENTIAL \u3000・\u3000 取扱注意 \u3000・\u3000 RESTRICTED DISTRIBUTION'}</div>
              <div className="ex-cover-main">
                <Monogram name={data.meta.companyName} size={64} light />
                <div className="ex-cover-kicker">Monthly Security Audit &amp; Resilience Report</div>
                <h1 className="ex-cover-title">月次セキュリティ<br />監査報告書</h1>
                <div className="ex-cover-rule"><span /></div>
                <div className="ex-cover-period">{data.meta.year}年 {Number(data.meta.month)}月度</div>
                <table className="ex-cover-table">
                  <tbody>
                    {[
                      { l: 'Prepared For', v: `${data.meta.clientName} 御中` },
                      { l: 'Issue Date', v: data.meta.createDate },
                      { l: 'Prepared By', v: data.meta.author },
                      { l: 'Document Ref.', v: docRef(data.meta) },
                    ].map((r, i) => (
                      <tr key={i}><th>{r.l}</th><td>{r.v}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="ex-cover-foot">
                <div className="ex-cover-company">{data.meta.companyName}</div>
                <div className="ex-cover-tag">Advanced Cyber Security Solutions</div>
                <p className="ex-cover-notice">本書は受領者のみを対象とした機密文書です。記載内容の全部または一部を、発行者の書面による許可なく複製・転送・開示することを禁じます。</p>
              </div>
            </div>
          </section>
          <div className="page-break" />

          {/* P.2 TOC */}
          <PageFrame meta={data.meta} pageNum={2} totalPages={totalPages} section="Contents">
            <div className="ex-kicker mt-6">Table of Contents</div>
            <h2 className="ex-toc-title">目次</h2>
            <ol className="ex-toc">
              {tocItems.map((item, i) => (
                <li key={item.p}>
                  <span className="ex-toc-no">{String(i + 1).padStart(2, '0')}</span>
                  <span className="ex-toc-t">{item.t}<small>{item.en}</small></span>
                  <span className="ex-toc-dots" />
                  <span className="ex-toc-p">{item.p}</span>
                </li>
              ))}
            </ol>
            <div className="ex-scope">
              <div className="ex-kicker">Scope of Engagement</div>
              <div className="ex-scope-title">監査対象範囲</div>
              <p>本報告書は、貴社より委託を受けた以下の領域を対象とします。</p>
              <ol>
                {hasNas && <li><strong>Re:NAS</strong>{'\u3000'}可用性およびデータ保全性</li>}
                {hasMobile && <li><strong>Re:Veil</strong>{'\u3000'}OS整合性および端末管理状況</li>}
                {hasWeb && <li><strong>Web Server</strong>{'\u3000'}外部公開サービスの脆弱性および攻撃検知状況</li>}
              </ol>
            </div>
          </PageFrame>
          <div className="page-break" />

          {/* P.3 Summary */}
          <PageFrame meta={data.meta} pageNum={3} totalPages={totalPages} section="Executive Summary">
            <SectionHeader number="01" title="エグゼクティブ・サマリー" subTitle="Executive Summary" />
            <ScoreSeal score={data.summary.score} />
            <div className="ex-kpis">
              <div><div className="ex-kicker">System Uptime</div><div className="ex-kpi-v">{data.summary.uptime}</div><div className="ex-note">計画停止を除く実稼働率</div></div>
              <div><div className="ex-kicker">Threats Blocked</div><div className="ex-kpi-v">{data.summary.threatsBlocked}</div><div className="ex-note">境界防御による自動遮断件数</div></div>
              <div><div className="ex-kicker">Backup Status</div><div className="ex-kpi-v ex-kpi-sm">{data.summary.backupStatus}</div><div className="ex-note">当月のバックアップ実行結果</div></div>
            </div>
            <SubHeading>コンサルタント総評</SubHeading>
            <div className="ex-prose ex-lead">{data.summary.comment}</div>
          </PageFrame>
          <div className="page-break" />

          {/* P.4 Threat Stats */}
          <PageFrame meta={data.meta} pageNum={4} totalPages={totalPages} section="Security Statistics">
            <SectionHeader number="02" title="セキュリティインシデント統計" subTitle="Threat Detection & Analysis" />
            <SubHeading>検知・遮断された攻撃の内訳</SubHeading>
            <div className="ex-panel"><DonutChart data={data.threatStats} /></div>
            <div className="ex-note text-center mt-2">※ 境界防御にて遮断された攻撃の種別内訳（実被害なし）</div>
            <div className="ex-two mt-8">
              <div className="ex-card">
                <h4>{data.securityAnalysis.globalIpTitle}</h4>
                <p>{data.securityAnalysis.globalIpComment}</p>
              </div>
              <div className="ex-card">
                <h4>{data.securityAnalysis.botDefenseTitle}</h4>
                <p>{data.securityAnalysis.botDefenseComment}</p>
              </div>
            </div>
          </PageFrame>
          <div className="page-break" />

          {/* P.5 Assets */}
          <PageFrame meta={data.meta} pageNum={5} totalPages={totalPages} section="Asset Status">
            <SectionHeader number="03" title="資産稼働状況" subTitle="Detailed Status per Asset" />
            <table className="ex-ledger">
              <thead>
                <tr><th style={{ width: '17%' }}>Asset ID</th><th style={{ width: '27%' }}>Host / Role</th><th style={{ width: '20%' }}>Platform</th><th style={{ width: '14%' }}>Status</th><th>Technical Status</th></tr>
              </thead>
              <tbody>
                {data.assets.map((asset, i) => (
                  <tr key={i}>
                    <td className="ex-mono-cell">{asset.id}</td>
                    <td><div className="ex-strong">{asset.hostName}</div><div className="ex-note">{asset.role}</div></td>
                    <td>{asset.os}</td>
                    <td><StatusMark status={asset.status} /></td>
                    <td className="ex-mono-cell ex-small">{asset.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="ex-note mt-4">ステータス定義 ― 正常：対応不要 ／ 注意：経過観察または軽微な対応 ／ 警戒：即時対応が必要</div>
          </PageFrame>
          <div className="page-break" />

          {/* P.6 Performance */}
          <PageFrame meta={data.meta} pageNum={6} totalPages={totalPages} section="Performance Analysis">
            <SectionHeader number="04" title="リソース＆パフォーマンス分析" subTitle="Capacity Planning & Trends" />
            <SubHeading>Re:NAS ストレージ使用率（直近{GRAPH_MONTHS}ヶ月）</SubHeading>
            <div className="ex-chart-row">
              <div className="ex-panel"><BarChart data={data.resourceStats.nasStorage} /></div>
              <div className="ex-analysis"><div className="ex-kicker">Analyst Note</div><p>{data.performance.nasAnalysis}</p></div>
            </div>
            <SubHeading>CPU 使用率（直近{GRAPH_MONTHS}ヶ月）</SubHeading>
            <div className="ex-chart-row">
              <div className="ex-panel"><BarChart data={data.resourceStats.cpuUsage} /></div>
              <div className="ex-analysis"><div className="ex-kicker">Trend Analysis</div><p>{data.performance.cpuAnalysis}</p></div>
            </div>
          </PageFrame>
          <div className="page-break" />

          {/* P.7 Evidence */}
          <PageFrame meta={data.meta} pageNum={7} totalPages={totalPages} section="Operational Evidence">
            <SectionHeader number="05" title="運用証跡" subTitle="Proof of Protection" />
            <div className="ex-evidence">
              {data.evidenceList.map((ev, i) => (
                <div key={i} className="ex-ev">
                  <div className="ex-ev-icon">{ev.iconType === 'db' ? <Database size={20} strokeWidth={1.3} /> : ev.iconType === 'shield' ? <ShieldCheck size={20} strokeWidth={1.3} /> : <Activity size={20} strokeWidth={1.3} />}</div>
                  <div className="ex-ev-body">
                    <div className="ex-ev-top"><h4>{ev.title}</h4><span className="ex-chip">{ev.status}</span></div>
                    <p>{ev.desc}</p>
                    {ev.date && <div className="ex-note">確認日：{ev.date}</div>}
                  </div>
                </div>
              ))}
            </div>
          </PageFrame>
          <div className="page-break" />

          {/* P.8 Device & Network Analysis + Evidence Images */}
          <PageFrame meta={data.meta} pageNum={8} totalPages={totalPages} section="Device Analysis">
            <SectionHeader number="06" title={hasWeb ? 'デバイス＆ネットワーク分析' : 'デバイス分析'} subTitle={hasWeb ? 'Device Integrity & Network Status' : 'Device Integrity'} />
            <div className="ex-card ex-card-wide">
              <h4><Smartphone size={15} strokeWidth={1.5} /> Re:Veil（モバイル端末）</h4>
              <p>{data.performance.veilAnalysis}</p>
            </div>
            {hasWeb && (
              <div className="ex-card ex-card-wide">
                <h4><Globe size={15} strokeWidth={1.5} /> Web / Network</h4>
                <p>{data.performance.webAnalysis}</p>
              </div>
            )}
            {data.evidenceImages.length > 0 && (
              <>
                <SubHeading>添付エビデンス</SubHeading>
                <div className="ex-figs">
                  {data.evidenceImages.map((img, idx) => (
                    <figure key={idx}>
                      <img src={img} alt={`Exhibit ${idx + 1}`} />
                      <figcaption>Exhibit {String(idx + 1).padStart(2, '0')}</figcaption>
                    </figure>
                  ))}
                </div>
              </>
            )}
          </PageFrame>
          <div className="page-break" />

          {/* P.9 Changes */}
          <PageFrame meta={data.meta} pageNum={9} totalPages={totalPages} section="Change Management">
            <SectionHeader number="07" title="変更管理・メンテナンス履歴" subTitle="System Change Log" />
            <table className="ex-ledger">
              <thead>
                <tr><th style={{ width: '11%' }}>Date</th><th style={{ width: '15%' }}>Type</th><th>Description</th><th style={{ width: '11%' }}>Result</th><th style={{ width: '13%' }}>Owner</th></tr>
              </thead>
              <tbody>
                {data.changes.map(log => (
                  <tr key={log.id}>
                    <td className="ex-mono-cell">{log.date}</td>
                    <td><span className={`ex-tag ${log.type === '障害対応' ? 'is-alert' : ''}`}>{log.type}</span></td>
                    <td>{log.content}</td>
                    <td className="ex-strong">{log.result}</td>
                    <td className="ex-small">{log.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="ex-note mt-4">※ 本表には、システム構成に影響する変更およびセキュリティパッチの適用のみを記載しています。</div>
          </PageFrame>
          <div className="page-break" />

          {/* P.10 Intelligence */}
          <PageFrame meta={data.meta} pageNum={10} totalPages={totalPages} section="Threat Intelligence">
            <SectionHeader number="08" title="脅威インテリジェンス" subTitle="Global Threat Intelligence" />
            <div className="ex-intel">
              {data.news.map((item, i) => (
                <article key={item.id}>
                  <div className="ex-intel-no">Intel {String(i + 1).padStart(2, '0')}</div>
                  <h4>{item.title}</h4>
                  <div className="ex-note">{[item.date, item.source].filter(Boolean).join('\u3000｜\u3000')}</div>
                  <p>{item.content}</p>
                  <div className="ex-impact"><div className="ex-kicker">Impact &amp; Mitigation</div><p>{item.impact}</p></div>
                </article>
              ))}
            </div>
          </PageFrame>
          <div className="page-break" />

          {/* P.11 Roadmap */}
          <PageFrame meta={data.meta} pageNum={11} totalPages={totalPages} section="Strategic Roadmap">
            <SectionHeader number="09" title="戦略的ロードマップ＆提言" subTitle="Strategy & Recommendations" />
            <SubHeading>次月の重点施策</SubHeading>
            <div className="ex-prose ex-focus">{data.roadmap.nextMonth}</div>
            <div className="ex-advice">
              <div className="ex-kicker ex-kicker-gold">Strategic Advisory</div>
              <div className="ex-advice-title">戦略的提言</div>
              <div className="ex-prose">{data.roadmap.strategicAdvice}</div>
            </div>
            <div className="ex-end">
              <span />— End of Report —<span />
            </div>
          </PageFrame>
          <div className="page-break" />

          {/* P.12 Invoice */}
          <section className="report-page ex-page ex-invoice">
            <div className="ex-inv-head">
              <div>
                <div className="ex-inv-title">INVOICE</div>
                <div className="ex-kicker">Statement of Services</div>
              </div>
              <div className="ex-inv-from">
                {data.invoice.logoSrc ? <img src={data.invoice.logoSrc} alt="Logo" className="ex-inv-logo" /> : <Monogram name={data.invoice.senderName || data.meta.companyName} size={44} />}
                <div className="ex-strong mt-2">{data.invoice.senderName}</div>
                <div className="ex-small ex-pre">{data.invoice.senderDetails}</div>
              </div>
            </div>
            <div className="ex-inv-meta">
              <div>
                <div className="ex-kicker">Bill To</div>
                <div className="ex-inv-client">{data.invoice.clientName}</div>
                <div className="ex-small ex-pre">{data.invoice.clientDetails}</div>
              </div>
              <table className="ex-inv-info">
                <tbody>
                  {[{ l: 'Invoice No.', v: data.invoice.invNo }, { l: 'Issue Date', v: data.invoice.invDate }, { l: 'Due Date', v: data.invoice.dueDate }, { l: 'Currency', v: data.invoice.currency }].map((r, i) => (
                    <tr key={i}><th>{r.l}</th><td>{r.v}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <table className="ex-ledger ex-inv-items">
              <thead><tr><th>Description</th><th className="r" style={{ width: '10%' }}>Qty</th><th className="r" style={{ width: '20%' }}>Unit Price</th><th className="r" style={{ width: '20%' }}>Amount</th></tr></thead>
              <tbody>
                {data.invoice.items.map(item => (
                  <tr key={item.id}>
                    <td>{item.desc}</td>
                    <td className="r ex-num">{item.qty}</td>
                    <td className="r ex-num">{fmtMoney(item.unit, data.invoice.currency)}</td>
                    <td className="r ex-num ex-strong">{fmtMoney(item.qty * item.unit, data.invoice.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="ex-inv-bottom">
              <div>
                <div className="ex-kicker">Remittance Details</div>
                <table className="ex-inv-bank">
                  <tbody>
                    {[
                      { l: 'Bank', v: data.invoice.bankName }, { l: 'Branch', v: data.invoice.bankBranch },
                      { l: 'SWIFT / BIC', v: data.invoice.bankSwift }, { l: 'Account Type', v: data.invoice.bankType },
                      { l: 'Account No.', v: data.invoice.bankNo }, { l: 'Account Name', v: data.invoice.bankHolder },
                    ].filter(r => r.v).map((r, i) => <tr key={i}><th>{r.l}</th><td>{r.v}</td></tr>)}
                  </tbody>
                </table>
                {data.invoice.notes && <div className="ex-small ex-pre mt-4">{data.invoice.notes}</div>}
              </div>
              <table className="ex-inv-total">
                <tbody>
                  <tr><th>Subtotal</th><td>{fmtMoney(invoiceCalc.subtotal, data.invoice.currency)}</td></tr>
                  <tr><th>Tax ({data.invoice.taxRate}%)</th><td>{fmtMoney(invoiceCalc.tax, data.invoice.currency)}</td></tr>
                  <tr className="is-total"><th>Total Due</th><td>{fmtMoney(invoiceCalc.total, data.invoice.currency)}</td></tr>
                </tbody>
              </table>
            </div>
            <footer className="ex-foot">
              <span>{data.invoice.senderName}</span>
              <span>Thank you for your continued trust.</span>
              <span className="ex-pg">{String(totalPages).padStart(2, '0')} <em>/</em> {String(totalPages).padStart(2, '0')}</span>
            </footer>
          </section>

        </div>
      </main>

      <style>{`
        .report-page { width: 210mm; min-height: 297mm; }
        @media print { #root { max-width: none; padding: 0; margin: 0; } .ex-root { padding: 0 !important; margin: 0 !important; border-radius: 0 !important; box-shadow: none !important; } }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
        @media print {
          @page { margin: 0; size: A4; }
          html, body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .report-page { margin: 0 !important; width: 210mm; height: 297mm; min-height: 297mm; box-shadow: none !important; break-after: page; page-break-after: always; }
          .report-page:last-of-type { break-after: auto; page-break-after: auto; }
          .page-break { display: none; }
        }
      `}</style>
    </div>
  );
}
