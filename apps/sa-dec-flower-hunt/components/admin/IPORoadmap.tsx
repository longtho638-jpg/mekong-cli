"use client";

import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import {
  Rocket, Crown, Shield, Users, DollarSign, TrendingUp, Target,
  Building2, CheckCircle2, Circle, Clock, Zap, Globe, Sparkles,
  ChevronDown, ChevronUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ═══════════════════════════════════════════════════════════════════════════════
// 🚀 AGRIOS IPO ROADMAP - WOW EDITION
// ═══════════════════════════════════════════════════════════════════════════════

interface FinancialMetrics {
  revenue: string;
  ebitda: string;
  margin: string;
  valuation: string;
}

interface FundingRound {
  round: string;
  target: string;
  investors: string;
  roi: string;
}

interface RoadmapPhase {
  title: string;
  period: string;
  focus: string;
  legalEntity: string;
  vsicCode: string;
  initiatives: string[];
  owner: string;
  status: 'completed' | 'in_progress' | 'pending';
  financials: FinancialMetrics;
  fundingRound?: FundingRound;
  color: string;
  icon: React.ReactNode;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3-MAN ARMY - THE FOUNDERS TRINITY
// ═══════════════════════════════════════════════════════════════════════════════

const FOUNDERS = [
  {
    name: "Minh Long",
    title: "Group CEO & Chief Architect",
    nickname: "The Visionary",
    emoji: "🧠",
    color: "from-violet-500 to-purple-600",
    borderColor: "border-violet-500",
    bgGlow: "shadow-violet-500/30",
    role: "AI/Tech, Strategy, Capital",
    power: "Quyết định 'Đi đâu'",
    equity: { day1: 40, ipo: 16 },
    quote: "Người biến nông nghiệp thành dữ liệu"
  },
  {
    name: "Hữu Còn",
    title: "Chief Operations Officer",
    nickname: "The Warlord",
    emoji: "⚔️",
    color: "from-orange-500 to-red-600",
    borderColor: "border-orange-500",
    bgGlow: "shadow-orange-500/30",
    role: "Agri, Farmers, Execution",
    power: "Quyết định 'Đi như thế nào'",
    equity: { day1: 30, ipo: 12 },
    quote: "Không có anh, không nông dân nào giao hoa"
  },
  {
    name: "Hữu Thông",
    title: "Chief Product Officer",
    nickname: "The Scientist",
    emoji: "🔬",
    color: "from-cyan-500 to-blue-600",
    borderColor: "border-cyan-500",
    bgGlow: "shadow-cyan-500/30",
    role: "Bio-Tech, Quality, Global Standards",
    power: "Quyết định 'Mang cái gì đi'",
    equity: { day1: 30, ipo: 12 },
    quote: "Người đảm bảo hoa Sa Đéc sống ở Dubai"
  }
];

// ═══════════════════════════════════════════════════════════════════════════════
// CAP TABLE EVOLUTION
// ═══════════════════════════════════════════════════════════════════════════════

const CAP_TABLE = [
  { stage: 'Day 1', long: 40, con: 30, thong: 30, esop: 0, investors: 0, total: 100 },
  { stage: 'Angel', long: 34, con: 25.5, thong: 25.5, esop: 5, investors: 10, total: 85 },
  { stage: 'Series A', long: 26, con: 19.5, thong: 19.5, esop: 10, investors: 25, total: 65 },
  { stage: 'Pre-IPO', long: 22, con: 16.5, thong: 16.5, esop: 10, investors: 35, total: 55 },
  { stage: 'IPO', long: 16, con: 12, thong: 12, esop: 8, investors: 52, total: 40 },
];

// ═══════════════════════════════════════════════════════════════════════════════
// ROADMAP PHASES
// ═══════════════════════════════════════════════════════════════════════════════

const PHASES: RoadmapPhase[] = [
  {
    title: 'Phase 1: Pháo Đài Hợp Nhất',
    period: 'Tháng 0-18 (2026)',
    focus: 'Tồn tại & Chứng minh PMF',
    legalEntity: 'CÔNG TY TNHH CÔNG NGHỆ AGRIOS',
    vsicCode: '6201 (Software)',
    initiatives: [
      '🔐 Đăng ký Bản quyền Source Code',
      '💰 Góp vốn IP 1.8 Tỷ (90%)',
      '🎪 Festival Sa Đéc 2026 MVP',
      '🌱 Đạt 1,000 Nông dân Digital Twin'
    ],
    owner: 'CEO (Long) + COO (Còn)',
    status: 'in_progress',
    financials: {
      revenue: '5 Tỷ VNĐ',
      ebitda: '(5 Tỷ) - Lỗ',
      margin: '60%',
      valuation: '$3M - $4M'
    },
    fundingRound: {
      round: '🚀 Angel / Seed',
      target: '$300k - $500k',
      investors: 'Tech Mafias, Local Tycoons',
      roi: '25x - 30x'
    },
    color: 'from-emerald-500 via-green-500 to-teal-500',
    icon: <Shield className="w-6 h-6" />
  },
  {
    title: 'Phase 2: Tách Bạch & Gọi Vốn',
    period: 'Tháng 18-36 (2027)',
    focus: 'Scale 10x & Series A',
    legalEntity: 'AGRIOS TECH JSC + AGRIOS OPCO',
    vsicCode: '6201 + 4791 (TMĐT)',
    initiatives: [
      '🔄 Chuyển đổi TNHH → JSC',
      '🏢 Thành lập OpCo (Vận hành)',
      '📈 Scale 10,000 Nông dân',
      '📊 First External Audit (Big 4)'
    ],
    owner: 'COO (Còn) + CPO (Thông)',
    status: 'pending',
    financials: {
      revenue: '50 Tỷ VNĐ',
      ebitda: '5 Tỷ (10%)',
      margin: '70%',
      valuation: '$15M - $20M'
    },
    fundingRound: {
      round: '💼 Series A',
      target: '$2M - $3M',
      investors: 'Insignia, Jungle, Patamar',
      roi: '6x - 7x'
    },
    color: 'from-blue-500 via-indigo-500 to-purple-500',
    icon: <TrendingUp className="w-6 h-6" />
  },
  {
    title: 'Phase 3: Đế Chế Holding & IPO',
    period: 'Tháng 36+ (2028)',
    focus: 'IPO HOSE/HNX',
    legalEntity: 'AGRIOS FOUNDERS HOLDINGS → TECH JSC → OpCo',
    vsicCode: '6420 (Holdings) + 6201 + 4791',
    initiatives: [
      '👑 Thành lập Founders Holdings',
      '🏦 Chọn Investment Bank',
      '📋 Draft Prospectus',
      '🌍 Investor Roadshow → IPO'
    ],
    owner: 'Board + Advisors',
    status: 'pending',
    financials: {
      revenue: '300 Tỷ VNĐ',
      ebitda: '140 Tỷ (47%)',
      margin: '80%',
      valuation: '$60M - $100M'
    },
    fundingRound: {
      round: '🎯 Pre-IPO / IPO',
      target: '$10M+',
      investors: 'Dragon Capital, Retail',
      roi: '1.5x - 2x'
    },
    color: 'from-amber-500 via-orange-500 to-red-500',
    icon: <Crown className="w-6 h-6" />
  }
];

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATED COUNTER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function AnimatedValue({ value, suffix = "" }: { value: string; suffix?: string }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="font-mono font-bold"
    >
      {value}{suffix}
    </motion.span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FOUNDER CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function FounderCard({ founder, index }: { founder: typeof FOUNDERS[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.15 }}
      className="relative group"
    >
      <div className={`absolute -inset-0.5 bg-gradient-to-r ${founder.color} rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500`}></div>
      <div className={`relative bg-stone-900 rounded-2xl p-5 border-2 ${founder.borderColor} shadow-xl ${founder.bgGlow}`}>
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${founder.color} flex items-center justify-center text-2xl shadow-lg`}>
            {founder.emoji}
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-white text-lg">{founder.name}</h4>
            <p className={`text-xs bg-gradient-to-r ${founder.color} bg-clip-text text-transparent font-semibold`}>
              {founder.title}
            </p>
          </div>
        </div>

        {/* Nickname Badge */}
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r ${founder.color} text-white text-xs font-bold mb-3`}>
          <Sparkles className="w-3 h-3" />
          {founder.nickname}
        </div>

        {/* Role */}
        <p className="text-stone-400 text-sm mb-3">{founder.role}</p>

        {/* Power */}
        <div className="bg-stone-800/50 rounded-lg p-2 mb-3">
          <p className="text-xs text-stone-500">Quyền lực</p>
          <p className="text-white font-medium text-sm">{founder.power}</p>
        </div>

        {/* Equity Change */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-stone-500">Equity Journey</span>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold">{founder.equity.day1}%</span>
            <span className="text-stone-600">→</span>
            <span className="text-orange-400 font-bold">{founder.equity.ipo}%</span>
          </div>
        </div>

        {/* Quote */}
        <p className="mt-3 text-xs italic text-stone-500 border-t border-stone-800 pt-3">
          "{founder.quote}"
        </p>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VISUAL EQUITY BAR
// ═══════════════════════════════════════════════════════════════════════════════

function EquityBar({ row, isFirst }: { row: typeof CAP_TABLE[0]; isFirst: boolean }) {
  const segments = [
    { label: 'Long', value: row.long, color: 'bg-violet-500' },
    { label: 'Còn', value: row.con, color: 'bg-orange-500' },
    { label: 'Thông', value: row.thong, color: 'bg-cyan-500' },
    { label: 'ESOP', value: row.esop, color: 'bg-yellow-500' },
    { label: 'Investors', value: row.investors, color: 'bg-stone-500' },
  ];

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-stone-300">{row.stage}</span>
        <span className="text-xs text-stone-500">Founders: {row.total}%</span>
      </div>
      <div className="flex h-6 rounded-full overflow-hidden bg-stone-800">
        {segments.map((seg, i) => (
          seg.value > 0 && (
            <motion.div
              key={i}
              initial={{ width: 0 }}
              animate={{ width: `${seg.value}%` }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className={`${seg.color} flex items-center justify-center relative group`}
            >
              {seg.value >= 10 && (
                <span className="text-[10px] font-bold text-white/90">{seg.value}%</span>
              )}
            </motion.div>
          )
        ))}
      </div>
      {isFirst && (
        <div className="flex justify-between mt-1 text-[10px] text-stone-500">
          <div className="flex gap-3">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-violet-500"></span>Long</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-orange-500"></span>Còn</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-cyan-500"></span>Thông</span>
          </div>
          <div className="flex gap-3">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-yellow-500"></span>ESOP</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-stone-500"></span>Investors</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function PhaseCard({ phase, index }: { phase: RoadmapPhase; index: number }) {
  const [isExpanded, setIsExpanded] = useState(phase.status === 'in_progress');

  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.2 }}
      className="relative"
    >
      {/* Connector Line */}
      {index < PHASES.length - 1 && (
        <div className="absolute left-6 top-14 bottom-0 w-0.5 bg-gradient-to-b from-stone-600 to-stone-800"></div>
      )}

      {/* Phase Number Badge */}
      <div className={`absolute -left-2 top-0 w-16 h-16 rounded-2xl bg-gradient-to-br ${phase.color} flex items-center justify-center text-white shadow-lg shadow-black/30`}>
        {phase.status === 'completed' ? (
          <CheckCircle2 className="w-8 h-8" />
        ) : phase.status === 'in_progress' ? (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <Zap className="w-8 h-8" />
          </motion.div>
        ) : (
          <Circle className="w-8 h-8" />
        )}
      </div>

      {/* Main Content */}
      <div className="ml-20">
        <Card
          className={`overflow-hidden border-2 ${phase.status === 'in_progress'
              ? 'border-emerald-500 shadow-lg shadow-emerald-500/20'
              : 'border-stone-700'
            } bg-stone-900/80 backdrop-blur cursor-pointer hover:border-stone-600 transition-all`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <CardContent className="p-0">
            {/* Header with Gradient */}
            <div className={`bg-gradient-to-r ${phase.color} p-4 text-white`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-xl">{phase.title}</h3>
                  <p className="text-white/80 text-sm mt-1">{phase.period}</p>
                </div>
                <div className="flex items-center gap-2">
                  {phase.status === 'in_progress' && (
                    <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-bold animate-pulse">
                      ⚡ ACTIVE
                    </span>
                  )}
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </div>

              {/* Legal Entity */}
              <div className="flex items-center gap-2 mt-3 text-sm">
                <Building2 className="w-4 h-4" />
                <span className="font-medium">{phase.legalEntity}</span>
                <span className="px-2 py-0.5 bg-white/20 rounded text-xs">{phase.vsicCode}</span>
              </div>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-4 gap-0 border-b border-stone-800">
              {[
                { icon: DollarSign, label: 'Revenue', value: phase.financials.revenue, color: 'text-emerald-400' },
                { icon: TrendingUp, label: 'EBITDA', value: phase.financials.ebitda, color: 'text-blue-400' },
                { icon: Target, label: 'Margin', value: phase.financials.margin, color: 'text-purple-400' },
                { icon: Globe, label: 'Valuation', value: phase.financials.valuation, color: 'text-amber-400' },
              ].map((stat, i) => (
                <div key={i} className="p-3 text-center border-r last:border-r-0 border-stone-800">
                  <stat.icon className={`w-4 h-4 mx-auto mb-1 ${stat.color}`} />
                  <p className="text-[10px] text-stone-500 uppercase">{stat.label}</p>
                  <p className={`text-sm font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Expandable Content */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 space-y-4">
                    {/* Funding Round */}
                    {phase.fundingRound && (
                      <div className={`bg-gradient-to-r ${phase.color} p-4 rounded-xl text-white`}>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-white/80 text-xs">Fundraising Round</p>
                            <p className="font-bold text-lg">{phase.fundingRound.round}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-white/80 text-xs">Target</p>
                            <p className="font-mono font-bold text-xl">{phase.fundingRound.target}</p>
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/20">
                          <div>
                            <p className="text-white/80 text-xs">Investor Targets</p>
                            <p className="text-sm font-medium">{phase.fundingRound.investors}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-white/80 text-xs">ROI at IPO</p>
                            <p className="font-bold text-emerald-300">{phase.fundingRound.roi}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Initiatives */}
                    <div>
                      <h4 className="text-xs font-semibold uppercase text-stone-500 mb-2">Key Initiatives</h4>
                      <ul className="grid md:grid-cols-2 gap-2">
                        {phase.initiatives.map((item, idx) => (
                          <motion.li
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex items-center gap-2 text-sm text-stone-300 bg-stone-800/50 px-3 py-2 rounded-lg"
                          >
                            {item}
                          </motion.li>
                        ))}
                      </ul>
                    </div>

                    {/* Owner */}
                    <div className="flex justify-between items-center pt-3 border-t border-stone-800">
                      <div>
                        <p className="text-xs text-stone-500">Owner</p>
                        <p className="text-stone-300 font-medium">{phase.owner}</p>
                      </div>
                      <div>
                        <p className="text-xs text-stone-500">Focus</p>
                        <p className="text-stone-300 italic">{phase.focus}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function IPORoadmap() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 text-white p-6">
      {/* ═══════════════════ HERO HEADER ═══════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 rounded-full text-emerald-400 text-sm font-medium mb-4">
          <Sparkles className="w-4 h-4" />
          ZERO → $100M IPO ROADMAP
        </div>
        <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent mb-3">
          AGRIOS TECH
        </h1>
        <p className="text-stone-400 text-lg max-w-2xl mx-auto">
          Lộ trình IPO 2026-2028: Từ 3 người thành Đế chế Nông nghiệp Số
        </p>

        {/* Quick Stats */}
        <div className="flex flex-wrap justify-center gap-6 mt-8">
          {[
            { label: 'Target IPO', value: '$100M', icon: Target },
            { label: 'Timeline', value: '3 Years', icon: Clock },
            { label: 'Founders', value: '3 People', icon: Users },
            { label: 'AI Agents', value: '30+ Bots', icon: Zap },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-2 px-4 py-2 bg-stone-800/50 rounded-xl border border-stone-700"
            >
              <stat.icon className="w-5 h-5 text-emerald-500" />
              <div className="text-left">
                <p className="text-xs text-stone-500">{stat.label}</p>
                <p className="font-bold text-emerald-400">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ═══════════════════ 3-MAN ARMY SECTION ═══════════════════ */}
      <section className="mb-16">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-stone-700 to-transparent"></div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Crown className="w-6 h-6 text-amber-500" />
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              The 3-Man Army
            </span>
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-stone-700 to-transparent"></div>
        </div>
        <p className="text-center text-stone-500 mb-8 max-w-xl mx-auto">
          Công ty đầu tiên tại Việt Nam vận hành theo mô hình <span className="text-emerald-400 font-semibold">Agentic Enterprise</span> - dùng AI thay thế 30 kỹ sư
        </p>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {FOUNDERS.map((founder, i) => (
            <FounderCard key={i} founder={founder} index={i} />
          ))}
        </div>
      </section>

      {/* ═══════════════════ ROADMAP TIMELINE ═══════════════════ */}
      <section className="mb-16">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-stone-700 to-transparent"></div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Rocket className="w-6 h-6 text-emerald-500" />
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              IPO Roadmap 2026-2028
            </span>
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-stone-700 to-transparent"></div>
        </div>
        <div className="max-w-4xl mx-auto space-y-8 pl-4">
          {PHASES.map((phase, i) => (
            <PhaseCard key={i} phase={phase} index={i} />
          ))}
        </div>
      </section>

      {/* ═══════════════════ CAP TABLE EVOLUTION ═══════════════════ */}
      <section className="mb-16">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-stone-700 to-transparent"></div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-violet-500" />
            <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              Founders Dilution Roadmap
            </span>
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-stone-700 to-transparent"></div>
        </div>

        <Card className="max-w-4xl mx-auto bg-stone-900/80 border-stone-700">
          <CardContent className="p-6">
            {/* Visual Equity Bars */}
            <div className="mb-6">
              {CAP_TABLE.map((row, i) => (
                <EquityBar key={i} row={row} isFirst={i === 0} />
              ))}
            </div>

            {/* Control Mechanism */}
            <div className="bg-gradient-to-r from-emerald-900/30 to-cyan-900/30 rounded-xl p-4 border border-emerald-700/50">
              <h4 className="font-bold text-emerald-400 mb-2 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Cơ Chế "Checkmate" - Giữ Quyền Kiểm Soát
              </h4>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="bg-stone-900/50 rounded-lg p-3">
                  <p className="text-stone-500 text-xs mb-1">Block Vote</p>
                  <p className="text-white font-bold">40% + ESOP 8%</p>
                  <p className="text-emerald-400 text-xs">= 48% Control</p>
                </div>
                <div className="bg-stone-900/50 rounded-lg p-3">
                  <p className="text-stone-500 text-xs mb-1">Board Seats</p>
                  <p className="text-white font-bold">3/5 Ghế HĐQT</p>
                  <p className="text-emerald-400 text-xs">Founders chỉ định</p>
                </div>
                <div className="bg-stone-900/50 rounded-lg p-3">
                  <p className="text-stone-500 text-xs mb-1">Golden Share</p>
                  <p className="text-white font-bold">IP Lock</p>
                  <p className="text-emerald-400 text-xs">3 chữ ký mới bán</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ═══════════════════ FOOTER CTA ═══════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-8"
      >
        <div className="inline-block bg-gradient-to-r from-emerald-500 via-cyan-500 to-violet-500 p-[2px] rounded-2xl">
          <div className="bg-stone-950 rounded-2xl px-8 py-6">
            <p className="text-stone-400 text-sm mb-2">Next Milestone</p>
            <h3 className="text-2xl font-bold text-white mb-1">🎪 Festival Sa Đéc 2026</h3>
            <p className="text-emerald-400 font-medium">January 01-28, 2026</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default IPORoadmap;
