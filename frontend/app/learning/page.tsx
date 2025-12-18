'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface Course {
    id: string
    title: string
    category: string
    duration: string
    progress: number
    status: 'in_progress' | 'completed' | 'not_started'
    instructor: string
}

interface Skill {
    id: string
    name: string
    level: number
    target: number
    category: string
}

interface CareerPath {
    id: string
    role: string
    department: string
    requirements: string[]
    progress: number
    estimatedTime: string
}

// Sample data
const COURSES: Course[] = [
    { id: '1', title: 'Binh Pháp for Startups', category: 'Strategy', duration: '4 weeks', progress: 75, status: 'in_progress', instructor: 'Sun Tzu AI' },
    { id: '2', title: 'Advanced AgentOps', category: 'Technical', duration: '2 weeks', progress: 100, status: 'completed', instructor: 'Tech Lead' },
    { id: '3', title: 'Win-Win Negotiation', category: 'Business', duration: '3 weeks', progress: 30, status: 'in_progress', instructor: 'BD Master' },
    { id: '4', title: 'Cloud Architecture 2026', category: 'Technical', duration: '6 weeks', progress: 0, status: 'not_started', instructor: 'CTO' },
]

const SKILLS: Skill[] = [
    { id: '1', name: 'Strategic Thinking', level: 85, target: 100, category: 'Leadership' },
    { id: '2', name: 'AI/ML Operations', level: 72, target: 90, category: 'Technical' },
    { id: '3', name: 'Team Management', level: 90, target: 95, category: 'Leadership' },
    { id: '4', name: 'Financial Analysis', level: 65, target: 80, category: 'Business' },
    { id: '5', name: 'Product Development', level: 78, target: 85, category: 'Technical' },
]

const CAREER_PATHS: CareerPath[] = [
    { id: '1', role: 'Senior Engineer', department: 'Engineering', requirements: ['3+ years experience', 'Lead 2 projects', 'Mentor 1 junior'], progress: 80, estimatedTime: '6 months' },
    { id: '2', role: 'Tech Lead', department: 'Engineering', requirements: ['Senior Engineer', 'Architecture certification', 'Team leadership'], progress: 45, estimatedTime: '18 months' },
    { id: '3', role: 'CTO Track', department: 'Executive', requirements: ['Tech Lead', 'MBA or equiv', 'P&L responsibility'], progress: 20, estimatedTime: '3 years' },
]

const STATUS_COLORS: Record<string, string> = {
    in_progress: '#00bfff',
    completed: '#00ff41',
    not_started: '#888',
}

const CATEGORY_COLORS: Record<string, string> = {
    Strategy: '#ff0000',
    Technical: '#00bfff',
    Business: '#ffd700',
    Leadership: '#8a2be2',
}

export default function LearningHubPage() {
    const [courses] = useState(COURSES)
    const [skills] = useState(SKILLS)
    const [paths] = useState(CAREER_PATHS)

    // Metrics
    const completedCourses = courses.filter(c => c.status === 'completed').length
    const avgSkillLevel = (skills.reduce((sum, s) => sum + s.level, 0) / skills.length).toFixed(0)
    const inProgressCourses = courses.filter(c => c.status === 'in_progress').length
    const totalHours = courses.filter(c => c.status === 'completed').length * 20

    return (
        <div style={{
            minHeight: '100vh',
            background: '#050505',
            color: '#fff',
            fontFamily: "'JetBrains Mono', monospace",
            padding: '2rem',
        }}>
            {/* Ambient */}
            <div style={{
                position: 'fixed',
                top: '-20%',
                left: '30%',
                width: '40%',
                height: '40%',
                background: 'radial-gradient(circle, rgba(138,43,226,0.06) 0%, transparent 60%)',
                pointerEvents: 'none',
            }} />

            <div style={{ maxWidth: 1400, margin: '0 auto', position: 'relative', zIndex: 1 }}>

                {/* Header */}
                <header style={{ marginBottom: '2rem' }}>
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ fontSize: '2rem', marginBottom: '0.5rem' }}
                    >
                        <span style={{ color: '#8a2be2' }}>🎓</span> Learning Hub
                    </motion.h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Courses • Skills • Career Paths</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Completed', value: completedCourses, color: '#00ff41' },
                        { label: 'In Progress', value: inProgressCourses, color: '#00bfff' },
                        { label: 'Skill Level', value: `${avgSkillLevel}%`, color: '#8a2be2' },
                        { label: 'Total Hours', value: `${totalHours}h`, color: '#ffd700' },
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            style={{
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.05)',
                                borderRadius: '12px',
                                padding: '1.25rem',
                                textAlign: 'center',
                            }}
                        >
                            <p style={{ color: '#888', fontSize: '0.75rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>{stat.label}</p>
                            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: stat.color }}>{stat.value}</p>
                        </motion.div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>

                    {/* Courses */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(138,43,226,0.2)',
                        borderTop: '3px solid #8a2be2',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#8a2be2' }}>📚 My Courses</h3>

                        {courses.map((course, i) => (
                            <motion.div
                                key={course.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(0,0,0,0.3)',
                                    borderLeft: `3px solid ${STATUS_COLORS[course.status]}`,
                                    borderRadius: '0 8px 8px 0',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                    <div>
                                        <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{course.title}</p>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <span style={{
                                                padding: '1px 4px',
                                                borderRadius: '4px',
                                                fontSize: '0.55rem',
                                                background: `${CATEGORY_COLORS[course.category]}20`,
                                                color: CATEGORY_COLORS[course.category],
                                            }}>
                                                {course.category}
                                            </span>
                                            <span style={{ color: '#888', fontSize: '0.7rem' }}>{course.duration} • {course.instructor}</span>
                                        </div>
                                    </div>
                                    <span style={{
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontSize: '0.65rem',
                                        background: `${STATUS_COLORS[course.status]}20`,
                                        color: STATUS_COLORS[course.status],
                                    }}>
                                        {course.status.replace('_', ' ')}
                                    </span>
                                </div>
                                {course.status !== 'not_started' && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ flex: 1, height: 6, background: '#333', borderRadius: 3, overflow: 'hidden' }}>
                                            <div style={{
                                                width: `${course.progress}%`,
                                                height: '100%',
                                                background: course.progress === 100 ? '#00ff41' : '#00bfff',
                                                borderRadius: 3,
                                            }} />
                                        </div>
                                        <span style={{ fontSize: '0.8rem', color: '#fff' }}>{course.progress}%</span>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>

                    {/* Skills + Career Paths */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* Skills */}
                        <div style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(0,255,65,0.2)',
                            borderTop: '3px solid #00ff41',
                            borderRadius: '12px',
                            padding: '1.25rem',
                        }}>
                            <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#00ff41' }}>🎯 Skill Matrix</h3>

                            {skills.map((skill, i) => (
                                <div key={skill.id} style={{ marginBottom: '0.75rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                        <span style={{ fontSize: '0.8rem' }}>{skill.name}</span>
                                        <span style={{ fontSize: '0.75rem', color: skill.level >= skill.target ? '#00ff41' : '#888' }}>
                                            {skill.level}%
                                        </span>
                                    </div>
                                    <div style={{
                                        height: 6,
                                        background: '#333',
                                        borderRadius: 3,
                                        overflow: 'hidden',
                                        position: 'relative',
                                    }}>
                                        <div style={{
                                            width: `${skill.level}%`,
                                            height: '100%',
                                            background: skill.level >= skill.target ? '#00ff41' : CATEGORY_COLORS[skill.category] || '#00bfff',
                                            borderRadius: 3,
                                        }} />
                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: `${skill.target}%`,
                                            width: 2,
                                            height: '100%',
                                            background: '#ff0000',
                                        }} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Career Paths */}
                        <div style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,215,0,0.2)',
                            borderTop: '3px solid #ffd700',
                            borderRadius: '12px',
                            padding: '1.25rem',
                        }}>
                            <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#ffd700' }}>🚀 Career Paths</h3>

                            {paths.map((path, i) => (
                                <div
                                    key={path.id}
                                    style={{
                                        background: 'rgba(0,0,0,0.3)',
                                        borderRadius: '8px',
                                        padding: '0.75rem',
                                        marginBottom: '0.5rem',
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{path.role}</p>
                                        <span style={{ color: '#888', fontSize: '0.7rem' }}>{path.estimatedTime}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ flex: 1, height: 6, background: '#333', borderRadius: 3, overflow: 'hidden' }}>
                                            <div style={{
                                                width: `${path.progress}%`,
                                                height: '100%',
                                                background: path.progress >= 70 ? '#00ff41' : path.progress >= 40 ? '#ffd700' : '#ff6347',
                                                borderRadius: 3,
                                            }} />
                                        </div>
                                        <span style={{ fontSize: '0.75rem', color: '#fff' }}>{path.progress}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer style={{ marginTop: '2rem', textAlign: 'center', color: '#888', fontSize: '0.8rem' }}>
                    🏯 agencyos.network - Continuous Learning
                </footer>
            </div>
        </div>
    )
}
