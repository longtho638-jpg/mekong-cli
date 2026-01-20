/**
 * 📋 VIBE Project - Engine
 */
import {
    Project, WorkPackage, Sprint, TimeEntry, Meeting,
    WorkPackageType, WorkPackageStatus, BoardColumn
} from './types';

export class VibeProject {
    private projects: Map<string, Project> = new Map();
    private workPackages: Map<string, WorkPackage> = new Map();
    private sprints: Map<string, Sprint> = new Map();
    private timeEntries: TimeEntry[] = [];
    private meetings: Meeting[] = [];

    // ============ PROJECTS ============

    createProject(name: string, planet?: string): Project {
        const project: Project = {
            id: `proj_${Date.now()}`,
            name,
            status: 'active',
            planet,
            spentBudget: 0,
            createdAt: new Date(),
        };
        this.projects.set(project.id, project);
        return project;
    }

    getProject(id: string): Project | undefined {
        return this.projects.get(id);
    }

    // ============ WORK PACKAGES ============

    createWorkPackage(
        projectId: string,
        title: string,
        type: WorkPackageType = 'task'
    ): WorkPackage | undefined {
        if (!this.projects.has(projectId)) return undefined;

        const wp: WorkPackage = {
            id: `wp_${Date.now()}`,
            type,
            title,
            status: 'new',
            priority: 'normal',
            projectId,
            spentHours: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.workPackages.set(wp.id, wp);
        return wp;
    }

    updateWorkPackage(id: string, updates: Partial<WorkPackage>): WorkPackage | undefined {
        const wp = this.workPackages.get(id);
        if (!wp) return undefined;

        Object.assign(wp, updates, { updatedAt: new Date() });
        return wp;
    }

    getByProject(projectId: string): WorkPackage[] {
        return Array.from(this.workPackages.values())
            .filter(wp => wp.projectId === projectId);
    }

    getBySprint(sprintId: string): WorkPackage[] {
        return Array.from(this.workPackages.values())
            .filter(wp => wp.sprintId === sprintId);
    }

    // ============ SPRINTS ============

    createSprint(projectId: string, name: string, startDate: Date, endDate: Date): Sprint {
        const sprint: Sprint = {
            id: `sprint_${Date.now()}`,
            projectId,
            name,
            startDate,
            endDate,
            status: 'planning',
        };
        this.sprints.set(sprint.id, sprint);
        return sprint;
    }

    startSprint(sprintId: string): Sprint | undefined {
        const sprint = this.sprints.get(sprintId);
        if (sprint) sprint.status = 'active';
        return sprint;
    }

    completeSprint(sprintId: string): Sprint | undefined {
        const sprint = this.sprints.get(sprintId);
        if (sprint) sprint.status = 'completed';
        return sprint;
    }

    // ============ TIME TRACKING ============

    logTime(workPackageId: string, userId: string, hours: number, billable = true): TimeEntry {
        const entry: TimeEntry = {
            id: `time_${Date.now()}`,
            workPackageId,
            userId,
            hours,
            date: new Date(),
            billable,
        };
        this.timeEntries.push(entry);

        const wp = this.workPackages.get(workPackageId);
        if (wp) wp.spentHours += hours;

        return entry;
    }

    getTimeByProject(projectId: string): TimeEntry[] {
        const wpIds = this.getByProject(projectId).map(wp => wp.id);
        return this.timeEntries.filter(t => wpIds.includes(t.workPackageId));
    }

    getTotalHours(projectId: string): { total: number; billable: number } {
        const entries = this.getTimeByProject(projectId);
        return {
            total: entries.reduce((sum, e) => sum + e.hours, 0),
            billable: entries.filter(e => e.billable).reduce((sum, e) => sum + e.hours, 0),
        };
    }

    // ============ MEETINGS ============

    scheduleMeeting(projectId: string, title: string, date: Date, attendees: string[]): Meeting {
        const meeting: Meeting = {
            id: `meeting_${Date.now()}`,
            projectId,
            title,
            date,
            duration: 60,
            agenda: [],
            attendees,
        };
        this.meetings.push(meeting);
        return meeting;
    }

    addAgendaItem(meetingId: string, item: string): Meeting | undefined {
        const meeting = this.meetings.find(m => m.id === meetingId);
        if (meeting) meeting.agenda.push(item);
        return meeting;
    }

    // ============ BOARDS (Kanban) ============

    getBoard(projectId: string): { columns: BoardColumn[]; cards: WorkPackage[] } {
        const columns: BoardColumn[] = [
            { id: '1', name: 'New', status: 'new', order: 0 },
            { id: '2', name: 'In Progress', status: 'in_progress', order: 1 },
            { id: '3', name: 'Review', status: 'review', order: 2 },
            { id: '4', name: 'Done', status: 'done', order: 3 },
        ];

        return {
            columns,
            cards: this.getByProject(projectId),
        };
    }

    moveCard(workPackageId: string, newStatus: WorkPackageStatus): void {
        this.updateWorkPackage(workPackageId, { status: newStatus });
    }

    // ============ ANALYTICS ============

    getProjectStats(projectId: string): {
        totalTasks: number;
        completedTasks: number;
        progress: number;
        totalHours: number;
    } {
        const tasks = this.getByProject(projectId);
        const completed = tasks.filter(t => t.status === 'done' || t.status === 'closed');
        const hours = this.getTotalHours(projectId);

        return {
            totalTasks: tasks.length,
            completedTasks: completed.length,
            progress: tasks.length > 0 ? (completed.length / tasks.length) * 100 : 0,
            totalHours: hours.total,
        };
    }
}
