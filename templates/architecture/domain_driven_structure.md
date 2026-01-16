src/
├── core/                       # Enterprise Business Rules (Entities)
│   ├── common/                 # Shared kernels, Value Objects
│   │   ├── entity.base.ts
│   │   └── value-object.base.ts
│   └── modules/                # Domain Modules (Bounded Contexts)
│       ├── user/
│       │   ├── domain/         # Entities, Events, Repository Interfaces
│       │   │   ├── user.entity.ts
│       │   │   └── user.repository.port.ts
│       │   ├── application/    # Use Cases (Business Logic)
│       │   │   ├── create-user/
│       │   │   │   ├── create-user.command.ts
│       │   │   │   └── create-user.use-case.ts
│       │   │   └── dtos/
│       │   └── infrastructure/ # Adapters (DB, API implementation)
│       │       ├── database/
│       │       │   ├── user.orm-entity.ts
│       │       │   └── user.repository.ts
│       │       └── http/       # Controllers
│       │           └── create-user.controller.ts
│       └── order/              # Another module...
├── infrastructure/             # Frameworks & Drivers
│   ├── database/               # DB Config
│   └── configs/                # Env Config
└── app.module.ts               # Dependency Injection Root
