'use client'

import React from 'react'
import { HelpCircle, ChevronDown, ChevronUp, Mail, MessageCircle } from 'lucide-react'
import { AgencyCard } from '@/components/ui/agency-card'
import { MD3Button } from '@/components/md3/MD3Button'
import { StatusLine } from '@/components/CommandCenter'

const FAQS = [
    {
        question: 'How do I add a new team member?',
        answer: 'Navigate to Settings > Team and click the "Invite Member" button. Enter their email address and select a role (Admin, Member, or Viewer). They will receive an email invitation to join your workspace.'
    },
    {
        question: 'What payment gateways are supported?',
        answer: 'AgencyOS currently supports Stripe, PayPal, and SePay (for Vietnam). You can configure your payment gateways in the Revenue > Settings section of your dashboard.'
    },
    {
        question: 'How is the churn rate calculated?',
        answer: 'Churn rate is calculated as the percentage of subscribers who cancelled their subscription within a specific period (usually monthly). Formula: (Cancelled Customers / Total Customers at Start of Period) * 100.'
    },
    {
        question: 'Can I export my data?',
        answer: 'Yes, you can export your data (clients, revenue, activity logs) in CSV or PDF format. Look for the "Export" button in the top right corner of most data tables and reports.'
    },
    {
        question: 'How do I reset my password?',
        answer: 'If you are logged in, go to Settings > Security. If you are locked out, use the "Forgot Password" link on the login page to receive a reset link via email.'
    }
]

export default function HelpPage() {
    const [openIndex, setOpenIndex] = React.useState<number | null>(0)

    return (
        <div className="min-h-screen bg-black/90 text-white p-6">
            <div className="max-w-4xl mx-auto space-y-8">
                <StatusLine />

                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                        How can we help you?
                    </h1>
                    <p className="text-neutral-400 text-lg">
                        Browse our frequently asked questions or contact support.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    <AgencyCard className="md:col-span-2 p-6">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <HelpCircle className="w-5 h-5 text-blue-400" />
                            Frequently Asked Questions
                        </h2>
                        <div className="space-y-4">
                            {FAQS.map((faq, idx) => (
                                <div
                                    key={idx}
                                    className="border border-white/5 rounded-lg overflow-hidden transition-all duration-200"
                                >
                                    <button
                                        onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                                        className="w-full flex items-center justify-between p-4 hover:bg-white/5 text-left"
                                    >
                                        <span className="font-medium text-sm md:text-base">{faq.question}</span>
                                        {openIndex === idx ? (
                                            <ChevronUp className="w-4 h-4 text-neutral-400" />
                                        ) : (
                                            <ChevronDown className="w-4 h-4 text-neutral-400" />
                                        )}
                                    </button>
                                    {openIndex === idx && (
                                        <div className="p-4 pt-0 text-neutral-400 text-sm leading-relaxed border-t border-white/5 bg-white/[0.02]">
                                            {faq.answer}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </AgencyCard>

                    <div className="space-y-6">
                        <AgencyCard className="p-6">
                            <h3 className="text-lg font-bold mb-4">Contact Support</h3>
                            <div className="space-y-4">
                                <MD3Button variant="outlined" className="w-full justify-start gap-3">
                                    <Mail className="w-4 h-4" />
                                    Email Support
                                </MD3Button>
                                <MD3Button variant="filled" className="w-full justify-start gap-3">
                                    <MessageCircle className="w-4 h-4" />
                                    Live Chat
                                </MD3Button>
                            </div>
                        </AgencyCard>

                        <AgencyCard className="p-6 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20">
                            <h3 className="text-lg font-bold mb-2 text-blue-400">Documentation</h3>
                            <p className="text-sm text-neutral-400 mb-4">
                                Check out our detailed guides and API reference.
                            </p>
                            <MD3Button variant="text" className="text-blue-400 pl-0 hover:pl-2 transition-all">
                                View Docs →
                            </MD3Button>
                        </AgencyCard>
                    </div>
                </div>
            </div>
        </div>
    )
}
