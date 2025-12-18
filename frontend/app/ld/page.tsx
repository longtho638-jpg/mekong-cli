'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Types
interface CourseItem {
    id: string
    title: string
    type: 'mandatory' | 'optional' | 'certification'
    duration: number
    enrolled: number
    completed: number
}

interface SkillItem {
    id: string
    employeeName: string
    skillName: string
    category: string
    current: 'beginner' | 'intermediate' | 'advanced' | 'expert'
    target: 'beginner' | 'intermediate' | 'advanced' | 'expert'
    gap: number
}

// Sample data
const COURSES: CourseItem[] = [
    { id: '1', title: 'Python Fundamentals', type: 'mandatory', duration: 8, enrolled: 15, completed: 12 },
    { id: '2', title: 'AWS Certification Prep', type: 'certification', duration: 40, enrolled: 8, completed: 3 },
    { id: '3', title: 'Leadership Essentials', type: 'optional', duration: 16, enrolled: 10, completed: 7 },
    { id: '4', title: 'System Design', type: 'mandatory', duration: 24, enrolled: 12, completed: 5 },
]

const SKILLS: SkillItem[] = [
    { id: '1', employeeName: 'Nguyen A', skillName: 'Python', category: 'Technical', current: 'intermediate', target: 'advanced', gap: 1 },
    { id: '2', employeeName: 'Nguyen A', skillName: 'System Design', category: 'Technical', current: 'beginner', target: 'advanced', gap: 2 },
    { id: '3', employeeName: 'Tran B', skillName: 'Leadership', category: 'Soft Skills', current: 'beginner', target: 'intermediate', gap: 1 },
    { id: '4', employeeName: 'Le C', skillName: 'AWS', category: 'Cloud', current: 'intermediate', target: 'expert', gap: 2 },
]

const TYPE_COLORS = {
    mandatory: '#ff5f56',
    optional: '#00bfff',
    certification: '#ffd700',
}

const LEVEL_COLORS = {
    beginner: '#888',
    intermediate: '#00bfff',
    advanced: '#00ff41',
    expert: '#ffd700',
}

export default function LDDashboard() {
    const [courses] = useState<CourseItem[]>(COURSES)
    const [skills] = useState<SkillItem[]>(SKILLS)

    const totalEnrolled = courses.reduce((sum, c) => sum + c.enrolled, 0)
    const totalCompleted = courses.reduce((sum, c) => sum + c.completed, 0)
    const avgCompletion = Math.round((totalCompleted / totalEnrolled) * 100)
    const skillGaps = skills.filter(s => s.gap > 0).length

    return (
        <div style={{
            minHeight: '100vh',
            background: '#050505',
            color: '#fff',
            fontFamily: "'JetBrains Mono', monospace",
            padding: '2rem',
        }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>

                {/* Header */}
                <header style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
                        <span style={{ color: '#9b59b6' }}>📚</span> Learning & Development
                    </h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Training & Career Growth</p>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Enrolled', value: totalEnrolled, color: '#00bfff' },
                        { label: 'Completed', value: totalCompleted, color: '#00ff41' },
                        { label: 'Completion Rate', value: `${avgCompletion}%`, color: '#ffd700' },
                        { label: 'Skill Gaps', value: skillGaps, color: '#ff5f56' },
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
                            }}
                        >
                            <p style={{ color: '#888', fontSize: '0.75rem', marginBottom: '0.5rem' }}>{stat.label}</p>
                            <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: stat.color }}>{stat.value}</p>
                        </motion.div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

                    {/* Courses */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>COURSE CATALOG</h3>

                        {courses.map((course, i) => (
                            <motion.div
                                key={course.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${TYPE_COLORS[course.type]}30`,
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <div>
                                        <span style={{ fontWeight: 600 }}>{course.title}</span>
                                        <span style={{
                                            marginLeft: '0.5rem',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            fontSize: '0.6rem',
                                            background: `${TYPE_COLORS[course.type]}20`,
                                            color: TYPE_COLORS[course.type],
                                        }}>
                                            {course.type}
                                        </span>
                                    </div>
                                    <span style={{ color: '#888', fontSize: '0.75rem' }}>{course.duration}h</span>
                                </div>
                                <div style={{ marginBottom: '0.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '0.25rem' }}>
                                        <span style={{ color: '#888' }}>Completion</span>
                                        <span style={{ color: '#00ff41' }}>{Math.round((course.completed / course.enrolled) * 100)}%</span>
                                    </div>
                                    <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${(course.completed / course.enrolled) * 100}%`,
                                            background: '#00ff41',
                                            borderRadius: 2,
                                        }} />
                                    </div>
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#888' }}>
                                    {course.completed}/{course.enrolled} completed
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Skill Gaps */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>SKILL GAPS</h3>

                        {skills.map((skill, i) => (
                            <motion.div
                                key={skill.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ fontWeight: 600 }}>{skill.employeeName}</span>
                                    <span style={{ color: skill.gap > 1 ? '#ff5f56' : '#ffd700', fontWeight: 'bold' }}>
                                        Gap: {skill.gap}
                                    </span>
                                </div>
                                <div style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                                    <span style={{ color: '#888' }}>{skill.skillName}</span>
                                    <span style={{ color: '#888', marginLeft: '0.5rem', fontSize: '0.7rem' }}>({skill.category})</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                                    <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        background: `${LEVEL_COLORS[skill.current]}20`,
                                        color: LEVEL_COLORS[skill.current],
                                    }}>
                                        {skill.current}
                                    </span>
                                    <span style={{ color: '#888' }}>→</span>
                                    <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        background: `${LEVEL_COLORS[skill.target]}20`,
                                        color: LEVEL_COLORS[skill.target],
                                    }}>
                                        {skill.target}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
