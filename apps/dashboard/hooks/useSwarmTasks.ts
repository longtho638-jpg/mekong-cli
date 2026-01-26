import { useQuery } from '@tanstack/react-query'

export function useSwarmTasks() {
  return useQuery({
    queryKey: ['swarm', 'tasks'],
    queryFn: async () => {
      const response = await fetch('/swarm/tasks')
      return response.json()
    }
  })
}
