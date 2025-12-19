'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface JobItem { id: string; title: string; department: string; location: string; salary: string; status: 'open' | 'paused' | 'filled'; candidates: number }
interface EmployeeItem { id: string; name: string; title: string; department: string; status: 'active' | 'on_leave' | 'probation'; performance: number; tenure: number }

const JOBS: JobItem[] = [
    { id: '1', title: 'Senior Engineer', department: 'Engineering', location: 'Ho Chi Minh', salary: '$2000-3000', status: 'open', candidates: 12 },
    { id: '2', title: 'Product Manager', department: 'Product', location: 'Ha Noi', salary: '$2500-3500', status: 'open', candidates: 8 },
    { id: '3', title: 'UX Designer', department: 'Design', location: 'Remote', salary: '$1500-2500', status: 'filled', candidates: 5 },
]

const EMPLOYEES: EmployeeItem[] = [
    { id: '1', name: 'Nguyen A', title: 'Senior Engineer', department: 'Engineering', status: 'active', performance: 4.8, tenure: 24 },
    { id: '2', name: 'Tran B', title: 'Product Manager', department: 'Product', status: 'active', performance: 4.5, tenure: 18 },
    { id: '3', name: 'Le C', title: 'Account Executive', department: 'Sales', status: 'on_leave', performance: 4.2, tenure: 12 },
    { id: '4', name: 'Pham D', title: 'Junior Developer', department: 'Engineering', status: 'probation', performance: 3.8, tenure: 2 },
]

export default function HRDashboard() {
    const [jobs] = useState<JobItem[]>(JOBS)
    const [employees] = useState<EmployeeItem[]>(EMPLOYEES)

    const openJobs = jobs.filter(j => j.status === 'open').length
    const totalCandidates = jobs.reduce((sum, j) => sum + j.candidates, 0)
    const activeEmployees = employees.filter(e => e.status === 'active').length
    const avgPerformance = (employees.reduce((sum, e) => sum + e.performance, 0) / employees.length).toFixed(1)

    return (
        <div className="min-h-screen bg-[#050505] text-white font-mono p-8">
            <div className="max-w-5xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-2xl mb-2"><span className="text-pink-500">👥</span> Human Resources</h1>
                    <p className="text-gray-500">Recruitment & Employees</p>
                </header>

                {/* Metrics */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Open Positions', value: openJobs, color: 'text-green-400' },
                        { label: 'Candidates', value: totalCandidates, color: 'text-cyan-400' },
                        { label: 'Active Employees', value: activeEmployees, color: 'text-white' },
                        { label: 'Avg Performance', value: avgPerformance, color: 'text-yellow-400' },
                    ].map((stat, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                            className="bg-white/[0.02] border border-white/5 rounded-xl p-5">
                            <p className="text-gray-500 text-xs mb-2">{stat.label}</p>
                            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-6">
                    {/* Jobs */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6">
                        <h3 className="text-gray-500 text-sm mb-6">OPEN POSITIONS</h3>
                        {jobs.map((job, i) => (
                            <motion.div key={job.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                                className={`bg-white/[0.02] border rounded-lg p-4 mb-3 ${job.status === 'open' ? 'border-green-400/30' : 'border-gray-500/30'}`}>
                                <div className="flex justify-between mb-2">
                                    <div>
                                        <span className="font-semibold">{job.title}</span>
                                        <span className={`ml-2 px-2 py-0.5 rounded text-[10px] ${job.status === 'open' ? 'bg-green-400/10 text-green-400' : 'bg-gray-500/10 text-gray-500'}`}>{job.status}</span>
                                    </div>
                                    <span className="text-cyan-400 text-sm">{job.candidates} candidates</span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>{job.department} • {job.location}</span>
                                    <span className="text-green-400">{job.salary}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Employees */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6">
                        <h3 className="text-gray-500 text-sm mb-6">TEAM DIRECTORY</h3>
                        {employees.map((emp, i) => (
                            <motion.div key={emp.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                                className="flex items-center gap-4 p-3 border-b border-white/5">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-bold ${emp.status === 'active' ? 'bg-gradient-to-br from-green-400 to-green-600' : emp.status === 'on_leave' ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' : 'bg-gradient-to-br from-cyan-400 to-cyan-600'}`}>
                                    {emp.name.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold mb-1">{emp.name}</p>
                                    <p className="text-gray-500 text-xs">{emp.title} • {emp.department}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-yellow-400 text-sm">⭐ {emp.performance}</p>
                                    <p className="text-gray-500 text-xs">{emp.tenure}mo tenure</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
