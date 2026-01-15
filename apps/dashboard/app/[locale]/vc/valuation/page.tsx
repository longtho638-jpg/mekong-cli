'use client';
import { MD3AppShell } from '@/components/md3/MD3AppShell';
import { MD3Surface } from '@/components/md3-dna/MD3Surface';
import { TrendingUp, Calculator, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const dcfData = [
    { year: 'Year 1', fcf: 1200, pv: 1091 },
    { year: 'Year 2', fcf: 1500, pv: 1240 },
    { year: 'Year 3', fcf: 1800, pv: 1353 },
    { year: 'Year 4', fcf: 2200, pv: 1503 },
    { year: 'Year 5', fcf: 2800, pv: 1738 },
];

const comparablesData = [
    { company: 'Company A', evRevenue: 8.5, evEbitda: 15.2 },
    { company: 'Company B', evRevenue: 7.2, evEbitda: 12.8 },
    { company: 'Company C', evRevenue: 9.1, evEbitda: 16.5 },
    { company: 'Target', evRevenue: 8.0, evEbitda: 14.0 },
];

export default function ValuationPage() {
    return (
        <MD3AppShell title="🧮 Startup Valuation" subtitle="DCF Analysis • Comparables • Final Valuation">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <MD3Surface shape="large" className="auto-safe">
                    <TrendingUp className="w-8 h-8 text-green-400 mb-2" />
                    <div className="text-sm text-gray-400">DCF Valuation</div>
                    <div className="text-2xl font-bold text-green-400">$12.5M</div>
                    <div className="text-xs text-gray-500 mt-1">WACC: 10%</div>
                </MD3Surface>

                <MD3Surface shape="large" className="auto-safe">
                    <BarChart3 className="w-8 h-8 text-blue-400 mb-2" />
                    <div className="text-sm text-gray-400">Comparables</div>
                    <div className="text-2xl font-bold text-blue-400">$14.2M</div>
                    <div className="text-xs text-gray-500 mt-1">Median EV/Revenue: 8.0x</div>
                </MD3Surface>

                <MD3Surface shape="large" className="auto-safe">
                    <Calculator className="w-8 h-8 text-purple-400 mb-2" />
                    <div className="text-sm text-gray-400">Final Valuation</div>
                    <div className="text-2xl font-bold text-purple-400">$13.4M</div>
                    <div className="text-xs text-gray-500 mt-1">Weighted Average</div>
                </MD3Surface>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <MD3Surface shape="extra-large" className="auto-safe">
                    <h2 className="text-xl font-bold mb-4 text-green-400">DCF Analysis</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={dcfData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis dataKey="year" stroke="#666" />
                            <YAxis stroke="#666" />
                            <Tooltip contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #22c55e' }} />
                            <Bar dataKey="fcf" fill="#22c55e" name="Free Cash Flow ($K)" />
                            <Bar dataKey="pv" fill="#3b82f6" name="Present Value ($K)" />
                        </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-4 text-sm text-gray-400">
                        <div>Terminal Value: $8.2M</div>
                        <div>Discount Rate (WACC): 10%</div>
                        <div>Total PV: $12.5M</div>
                    </div>
                </MD3Surface>

                <MD3Surface shape="extra-large" className="auto-safe">
                    <h2 className="text-xl font-bold mb-4 text-blue-400">Comparable Companies</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={comparablesData} layout="horizontal">
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis type="number" stroke="#666" />
                            <YAxis dataKey="company" type="category" stroke="#666" />
                            <Tooltip contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #3b82f6' }} />
                            <Bar dataKey="evRevenue" fill="#3b82f6" name="EV/Revenue" />
                            <Bar dataKey="evEbitda" fill="#8b5cf6" name="EV/EBITDA" />
                        </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-4 text-sm text-gray-400">
                        <div>Median EV/Revenue: 8.0x</div>
                        <div>Median EV/EBITDA: 14.0x</div>
                        <div>Implied Valuation: $14.2M</div>
                    </div>
                </MD3Surface>
            </div>
        </MD3AppShell>
    );
}
