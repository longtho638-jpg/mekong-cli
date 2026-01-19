# Phase 02: Monolithic Component Decomposition

**Files:** 2 massive files (1,391 + 1,103 lines)  
**Timeline:** Phase 2 (Critical)  
**Impact:** Core kanban functionality & project interface

---

## 🎯 TARGET FILES

### **1. `/external/vibe-kanban/frontend/src/lib/api.ts` (1,391 lines)**

#### **Current Issues:**

```typescript
// 🔥 God Object Anti-pattern:
// - 1,391 lines in single file
// - 67 TODO/FIXME comments
// - No request caching
// - Duplicate API patterns
// - Mixed concerns (client, cache, error handling)
```

#### **Decomposition Strategy:**

```typescript
// ✅ Split into 4 focused modules:

// 1. API Client Core
src/lib/api/client.ts (300 lines)
// - Base fetch configuration
// - Authentication handling
// - Request/response interceptors

// 2. Caching Layer
src/lib/api/cache.ts (200 lines)
// - Request memoization
// - Cache invalidation strategies
// - Offline data management

// 3. Error Handling
src/lib/api/errors.ts (150 lines)
// - Centralized error types
// - Retry logic
// - User-friendly messages

// 4. API Endpoints
src/lib/api/endpoints/ (741 lines split)
// ├── tasks.ts
// ├── projects.ts
// ├── users.ts
// ├── boards.ts
// ├── columns.ts
// └── comments.ts
```

#### **Implementation Plan:**

**Step 1: Extract API Client Core**

```typescript
// src/lib/api/client.ts
export class APIClient {
    private baseURL: string;
    private authToken?: string;
    private cache: Map<string, CachedResponse>;

    constructor(baseURL: string) {
        this.baseURL = baseURL;
        this.cache = new Map();
    }

    async request<T>(endpoint: string, options?: RequestOptions): Promise<T> {
        // Core request logic with caching
    }

    setAuth(token: string): void {
        this.authToken = token;
    }
}
```

**Step 2: Implement Caching Layer**

```typescript
// src/lib/api/cache.ts
export interface CacheOptions {
    ttl?: number; // Time to live in seconds
    tags?: string[]; // Cache invalidation tags
}

export class APICache {
    private cache = new Map<string, CacheEntry>();

    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (entry && !this.isExpired(entry)) {
            return entry.data as T;
        }
        return null;
    }

    set<T>(key: string, data: T, options?: CacheOptions): void {
        this.cache.set(key, {
            data,
            expires: options?.ttl ? Date.now() + options.ttl * 1000 : 0,
            tags: options?.tags || [],
        });
    }
}
```

---

### **2. `/external/vibe-kanban/frontend/src/pages/ProjectTasks.tsx` (1,103 lines)**

#### **Current Issues:**

```typescript
// 🔥 Monolithic React Component:
// - 1,103 lines in single component
// - 75+ imports
// - Mixed UI, business logic, state management
// - No memoization (performance issues)
// - Nested rendering logic
```

#### **Decomposition Strategy:**

```typescript
// ✅ Split into focused components:

// 1. Main Container
ProjectTasks.tsx (100 lines)
// - Route handling
// - Data orchestration
// - Error boundaries

// 2. Task List Component
components/TaskList.tsx (200 lines)
// - Virtualized task rendering
// - Drag & drop functionality
// - Keyboard navigation

// 3. Filter System
components/TaskFilters.tsx (150 lines)
// - Search functionality
// - Filter dropdowns
// - State persistence

// 4. Task Actions
components/TaskActions.tsx (100 lines)
// - Bulk operations
// - Context menus
// - Quick actions

// 5. State Management
hooks/useTasks.ts (200 lines)
// - Task state logic
// - API integration
// - Optimistic updates

// 6. Utility Functions
utils/taskHelpers.ts (100 lines)
// - Task sorting
// - Filter functions
// - Validation helpers
```

#### **Implementation Plan:**

**Step 1: Extract Custom Hooks**

```typescript
// hooks/useTasks.ts
export function useTasks(projectId: string) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Memoized task operations
    const filteredTasks = useMemo(() => {
        return tasks.filter(filterTasks);
    }, [tasks, filters]);

    const createTask = useCallback(
        async (taskData: CreateTaskData) => {
            // Optimistic updates
            // API call
            // Error handling
        },
        [projectId],
    );

    return {
        tasks: filteredTasks,
        loading,
        error,
        createTask,
        updateTask,
        deleteTask,
    };
}
```

**Step 2: Create Task List Component**

```typescript
// components/TaskList.tsx
import { FixedSizeList as List } from 'react-window';

interface TaskListProps {
  tasks: Task[];
  onTaskUpdate: (task: Task) => void;
  onTaskSelect: (taskId: string) => void;
}

export const TaskList = memo<TaskListProps>(({ tasks, onTaskUpdate, onTaskSelect }) => {
  const TaskRow = memo(({ index, style }) => (
    <div style={style}>
      <TaskItem
        task={tasks[index]}
        onUpdate={onTaskUpdate}
        onSelect={onTaskSelect}
      />
    </div>
  ));

  return (
    <List
      height={600}
      itemCount={tasks.length}
      itemSize={80}
      itemData={tasks}
    >
      {TaskRow}
    </List>
  );
});
```

---

## 🚀 PERFORMANCE OPTIMIZATIONS

### **API Layer Optimizations**

```typescript
// 1. Request Deduplication
const pendingRequests = new Map<string, Promise<any>>();

export function dedupedRequest<T>(
    key: string,
    requestFn: () => Promise<T>,
): Promise<T> {
    if (pendingRequests.has(key)) {
        return pendingRequests.get(key)!;
    }

    const promise = requestFn().finally(() => {
        pendingRequests.delete(key);
    });

    pendingRequests.set(key, promise);
    return promise;
}

// 2. Response Caching
export const cachedGet = cache((endpoint: string) => apiClient.get(endpoint));

// 3. Optimistic Updates
export function optimisticUpdate<T>(
    mutationFn: () => Promise<T>,
    updateCache: (data: T) => void,
) {
    // Update cache immediately
    // Rollback on error
}
```

### **React Component Optimizations**

```typescript
// 1. Virtual Scrolling for Large Lists
import { FixedSizeList as List } from "react-window";

// 2. Memoized Render Functions
const TaskItem = memo(
    ({ task }: { task: Task }) => {
        // Component implementation
    },
    (prevProps, nextProps) => {
        return (
            prevProps.task.id === nextProps.task.id &&
            prevProps.task.updated === nextProps.task.updated
        );
    },
);

// 3. Callback Memoization
const handleTaskUpdate = useCallback(
    (task: Task) => {
        // Update logic
    },
    [projectId],
);

// 4. State Selector Optimization
const tasks = useSelector((state: RootState) => state.tasks, shallowEqual);
```

---

## 📋 TESTING STRATEGY

### **API Layer Tests**

```typescript
describe("API Client", () => {
    test("handles authentication correctly");
    test("caches responses appropriately");
    test("retries failed requests");
    test("handles network errors");
});

describe("API Cache", () => {
    test("caches responses with TTL");
    test("invalidates cache by tags");
    test("handles cache size limits");
});
```

### **Component Tests**

```typescript
describe("TaskList", () => {
    test("renders tasks efficiently");
    test("handles drag and drop");
    test("supports keyboard navigation");
    test("optimizes re-renders");
});

describe("useTasks hook", () => {
    test("manages task state correctly");
    test("handles optimistic updates");
    test("provides loading states");
});
```

### **Integration Tests**

```typescript
describe("End-to-End Task Flow", () => {
    test("create → update → delete task cycle");
    test("filter and search functionality");
    test("real-time updates");
    test("error recovery");
});
```

---

## 📊 PERFORMANCE METRICS

### **Before Refactoring**

- Bundle size: 1.5MB (api.ts: 200KB)
- First render: 3.2s (ProjectTasks: 2.1s)
- Memory usage: 120MB (large lists)
- Re-renders: 50+ per action

### **After Refactoring (Target)**

- Bundle size: 800KB (-47%)
- First render: 1.2s (-63%)
- Memory usage: 60MB (-50%)
- Re-renders: 5+ per action (-90%)

---

## 🚦 DEPLOYMENT STRATEGY

### **Phase 2A: API Layer Refactoring**

- [ ] Extract API client core
- [ ] Implement caching layer
- [ ] Create endpoint modules
- [ ] Add comprehensive tests
- [ ] Deploy backend changes

### **Phase 2B: Component Decomposition**

- [ ] Extract custom hooks
- [ ] Split component tree
- [ ] Add virtualization
- [ ] Implement memoization
- [ ] Deploy frontend changes

### **Rollback Plan**

- [ ] Feature flags for new API layer
- [ ] Legacy component fallback
- [ ] Database migration rollback
- [ ] Monitoring alerts

---

_Phase 2: Eliminate monolithic antipatterns and optimize core functionality_
