'use client';
import { usePathname, useRouter } from 'next/navigation';
import { Shield, TrendingUp, Calculator, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

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

export default function ValuationPage({ params: { locale } }: { params: { locale: string } }) {
    const router = useRouter();
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-[#020202] text-white font-mono">
            <nav className="fixed top-0 w-full z-50 border-b border-green-500/20 bg-black/50 backdrop-blur-xl h-14 flex items-center px-6 justify-between">
                <div className="flex items-center gap-2 text-green-400">
                    <Shield className="w-5 h-5" />
                    <span className="font-bold">VC VALUATION</span>
                    <span className="px-1.5 py-0.5 text-[10px] bg-green-500/20 border border-green-500/30 rounded">DCF</span>
                </div>
                <div className="flex gap-2">
                    {['en', 'vi', 'zh'].map((l) => (
                        <button key={l} onClick={() => router.push(pathname.replace(`/${locale}`, `/${l}`))} className={`px-3 py-1 text-xs rounded ${locale === l ? 'bg-green-500/20 text-green-400' : 'text-gray-500'}`}>{l.toUpperCase()}</button>
                    ))}
                </div>
            </nav>

            <main className="pt-24 px-6 max-w-[1920px] mx-auto pb-20">
                <h1 className="text-4xl font-bold mb-8 text-green-400"><Calculator className="inline w-10 h-10 mr-3" />Startup Valuation</h1>

                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-[#0A0A0A] border border-green-500/20 rounded-lg p-6">
                        <TrendingUp className="w-8 h-8 text-green-400 mb-2" />
                        <div className="text-sm text-gray-400">DCF Valuation</div>
                        <div className="text-2xl font-bold text-green-400">$12.5M</div>
                        <div className="text-xs text-gray-500 mt-1">WACC: 10%</div>
                    </div>

                    <div className="bg-[#0A0A0A] border border-green-500/20 rounded-lg p-6">
                        <BarChart3 className="w-8 h-8 text-blue-400 mb-2" />
                        <div className="text-sm text-gray-400">Comparables</div>
                        <div className="text-2xl font-bold text-blue-400">$14.2M</div>
                        <div className="text-xs text-gray-500 mt-1">Median EV/Revenue: 8.0x</div>
                    </div>

                    <div className="bg-[#0A0A0A] border border-green-500/20 rounded-lg p-6">
                        <Calculator className="w-8 h-8 text-purple-400 mb-2" />
                        <div className="text-sm text-gray-400">Final Valuation</div>
                        <div className="text-2xl font-bold text-purple-400">$13.4M</div>
                        <div className="text-xs text-gray-500 mt-1">Weighted Average</div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="bg-[#0A0A0A] border border-green-500/10 rounded-lg p-6">
                        <h2 className="text-xl font-bold mb-4 text-green-400">DCF Analysis</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={dcfData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis dataKey="year" stroke="#666" />
                                <YAxis stroke="#666" />
                                <Tooltip contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #00ff41' }} />
                                <Bar dataKey="fcf" fill="#00ff41" name="Free Cash Flow ($K)" />
                                <Bar dataKey="pv" fill="#00bfff" name="Present Value ($K)" />
                            </BarChart>
                        </ResponsiveContainer>
                        <div className="mt-4 text-sm text gray-400">
                            <div>Terminal Value: $8.2M</div>
                            <div>Discount Rate (WACC): 10%</div>
                            <div>Total PV: $12.5M</div>
                        </div>
                    </div>

                    <div className="bg-[#0A0A0A] border border-blue-500/10 rounded-lg p-6">
                        <h2 className="text-xl font-bold mb-4 text-blue-400">Comparable Companies</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={comparablesData} layout="horizontal">
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis type="number" stroke="#666" />
                                <YAxis dataKey="company" type="category" stroke="#666" />
                                <Tooltip contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #00bfff' }} />
                                <Bar dataKey="evRevenue" fill="#00bfff" name="EV/Revenue" />
                                <Bar dataKey="evEbitda" fill="#8b5cf6" name="EV/EBITDA" />
                            </BarChart>
                        </ResponsiveContainer>
                        <div className="mt-4 text-sm text-gray-400">
                            <div>Median EV/Revenue: 8.0x</div>
                            <div>Median EV/EBITDA: 14.0x</div>
                            <div>Implied Valuation: $14.2M</div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
