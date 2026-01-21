'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { getAvailableSkills, createAgent, AgentDefinition } from '@/lib/agent-creator-api'
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Textarea, Select, Checkbox } from '@agencyos/ui'
import { useRouter } from 'next/navigation'

export default function NewAgentPage() {
  const router = useRouter()
  const { register, handleSubmit, formState: { errors } } = useForm<AgentDefinition>()
  const [skills, setSkills] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getAvailableSkills().then(setSkills)
  }, [])

  const onSubmit = async (data: AgentDefinition) => {
    setLoading(true)
    const result = await createAgent(data)
    setLoading(false)

    if (result?.success) {
      alert('Agent created successfully!')
      router.push('/dashboard/agentops')
    } else {
      alert('Failed to create agent')
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Custom Agent</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input {...register('name', { required: true })} placeholder="e.g. Lead Researcher" />
              {errors.name && <span className="text-red-500 text-xs">Name is required</span>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Input {...register('role', { required: true })} placeholder="e.g. Research Specialist" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea {...register('description')} placeholder="What does this agent do?" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Model</label>
              <select {...register('model')} className="w-full p-2 border rounded">
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                <option value="gpt-4o">GPT-4o</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Skills</label>
              <div className="grid grid-cols-2 gap-2 border p-4 rounded bg-gray-50">
                {skills.map(skill => (
                  <div key={skill} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      value={skill}
                      {...register('skills')}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{skill.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Creating...' : 'Create Agent'}
              </Button>
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  )
}
