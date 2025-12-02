# MVC Architecture Documentation

## Overview

The codebase has been refactored to follow the Model-View-Controller (MVC) architectural pattern, providing better separation of concerns and maintainability.

## Architecture Layers

### Routes (`src/routes/`)
**Responsibility**: Define API endpoints and link them to controllers

Routes are thin layers that:
- Define HTTP methods and paths
- Include Swagger/OpenAPI documentation
- Apply middleware (authentication, validation, etc.)
- Delegate to controllers

**Example**:
```typescript
import express from 'express'
import playerController from '@src/controllers/playerController'
import userAuth from '@src/middleware/userAuth'

const router = express.Router()

router.route('/:uid')
    .get(playerController.getPlayer.bind(playerController))

router.route('/')
    .put(userAuth, playerController.updatePlayer.bind(playerController))

export default router
```

### Controllers (`src/controllers/`)
**Responsibility**: Handle HTTP request/response and orchestrate services

Controllers:
- Extract data from requests (params, query, body)
- Call appropriate service methods
- Handle errors and return appropriate HTTP status codes
- Format responses
- Do NOT contain business logic

**Example**:
```typescript
import type { Request, Response } from 'express'
import playerService from '@src/services/playerService'

export class PlayerController {
    async getPlayer(req: Request, res: Response) {
        try {
            const { uid } = req.params
            const player = await playerService.getPlayerByUidOrName(uid)
            res.send(player)
        } catch (error) {
            res.status(404).send()
        }
    }
}

export default new PlayerController()
```

### Services (`src/services/`)
**Responsibility**: Implement business logic and coordinate data access

Services:
- Contain all business logic
- Validate business rules
- Coordinate between models and data access layers
- Throw errors for controllers to handle
- Can call other services
- Independent of HTTP concerns

**Example**:
```typescript
import Player from '@lib/classes/Player'
import supabase from '@src/database/supabase'

export class PlayerService {
    async getPlayerByUidOrName(identifier: string) {
        const player = new Player({})

        if (identifier.startsWith('@')) {
            player.name = identifier.slice(1)
        } else {
            player.uid = identifier
        }

        await player.pull()
        return player
    }

    async updatePlayer(data: any, user: Player) {
        if (!('uid' in data)) {
            if (user.isAdmin) {
                throw new Error("Missing 'uid' property")
            } else {
                data.uid = user.uid
            }
        }

        if (user.uid != data.uid && !user.isAdmin) {
            throw new Error("Forbidden")
        }

        const player = new Player(data)
        await player.update()
    }
}

export default new PlayerService()
```

### Models (`src/lib/classes/` and `src/lib/client/`)
**Responsibility**: Data models and database operations

- **Classes** (`src/lib/classes/`): Active Record pattern - domain models with persistence methods
- **Client functions** (`src/lib/client/`): Database queries and data access functions

These remain largely unchanged but are now used by services.

## Benefits of MVC Pattern

### 1. Separation of Concerns
- Routes: Routing and middleware
- Controllers: HTTP handling
- Services: Business logic
- Models: Data access

### 2. Testability
Each layer can be tested independently:
- Services can be tested without HTTP
- Controllers can be tested with mocked services
- Business logic is isolated from framework details

### 3. Maintainability
- Changes to business logic don't affect HTTP handling
- New endpoints can reuse existing services
- Clear file organization makes code easy to find

### 4. Reusability
- Services can be called from multiple controllers
- Business logic is not tied to specific endpoints
- Easy to add new interfaces (GraphQL, gRPC, etc.)

## File Structure

```
src/
├── routes/          # API endpoint definitions
│   ├── player.ts
│   ├── players.ts
│   ├── level.ts
│   └── ...
├── controllers/     # HTTP request handlers
│   ├── playerController.ts
│   ├── playersController.ts
│   ├── levelController.ts
│   └── ...
├── services/        # Business logic layer
│   ├── playerService.ts
│   ├── levelService.ts
│   ├── recordService.ts
│   └── ...
├── lib/
│   ├── classes/     # Domain models (Active Record)
│   │   ├── Player.ts
│   │   ├── Level.ts
│   │   └── Record.ts
│   └── client/      # Data access functions
│       ├── player.ts
│       ├── level.ts
│       └── record.ts
├── middleware/      # Express middleware
└── database/        # Database configuration
```

## Error Handling Pattern

### Services throw errors:
```typescript
async updatePlayer(data: any, user: Player) {
    if (!('uid' in data) && user.isAdmin) {
        throw new Error("Missing 'uid' property")
    }
    // ... business logic
}
```

### Controllers catch and handle errors:
```typescript
async updatePlayer(req: Request, res: Response) {
    try {
        await playerService.updatePlayer(req.body, res.locals.user)
        res.send()
    } catch (error: any) {
        if (error.message === "Missing 'uid' property") {
            res.status(400).send({ message: error.message })
        } else {
            res.status(500).send()
        }
    }
}
```

## Migration Status

### Refactored Routes (15/35 completed):
✅ player, players - Player management
✅ level, levels - Level management  
✅ record, records - Record management
✅ rules, provinces, search - Data retrieval
✅ item, notification, refresh - System operations

### Remaining Routes (20/35):
Awaiting refactoring to complete MVC migration.

## Best Practices

### 1. Controller Methods
- Should be thin - minimal logic
- One method per endpoint operation
- Always use try-catch for async operations
- Return appropriate HTTP status codes

### 2. Service Methods
- Contain all business validation
- Throw errors with descriptive messages
- No knowledge of HTTP (no req/res)
- Can call other services
- Should be pure when possible

### 3. Naming Conventions
- Controllers: `{Resource}Controller` (e.g., `PlayerController`)
- Services: `{Resource}Service` (e.g., `PlayerService`)
- Controller methods: match HTTP action (e.g., `getPlayer`, `updatePlayer`)
- Service methods: describe business operation (e.g., `getPlayerByUidOrName`)

### 4. Dependency Flow
```
Routes → Controllers → Services → Models/Database
       ←             ←           ←
```

## Testing Strategy

### Service Testing
```typescript
// Test business logic without HTTP
describe('PlayerService', () => {
    it('should validate uid requirement for admin updates', async () => {
        const data = { name: 'test' }
        const adminUser = { isAdmin: true }
        
        await expect(
            playerService.updatePlayer(data, adminUser)
        ).rejects.toThrow("Missing 'uid' property")
    })
})
```

### Controller Testing  
```typescript
// Test HTTP handling with mocked services
describe('PlayerController', () => {
    it('should return 404 when player not found', async () => {
        jest.spyOn(playerService, 'getPlayerByUidOrName')
            .mockRejectedValue(new Error('Not found'))
        
        const req = { params: { uid: 'test' } }
        const res = { status: jest.fn().mockReturnThis(), send: jest.fn() }
        
        await playerController.getPlayer(req, res)
        
        expect(res.status).toHaveBeenCalledWith(404)
    })
})
```

## Future Improvements

1. **Complete Migration**: Refactor remaining 20 routes
2. **Add Test Suite**: Implement comprehensive unit and integration tests
3. **Validation Layer**: Add request validation using libraries like Joi or Zod
4. **DTOs**: Introduce Data Transfer Objects for type-safe request/response handling
5. **Dependency Injection**: Consider implementing DI for better testability
6. **Documentation**: Generate API documentation from OpenAPI annotations

## Contributing

When adding new endpoints:

1. Create service in `src/services/` with business logic
2. Create controller in `src/controllers/` for HTTP handling
3. Create route in `src/routes/` linking to controller
4. Follow existing patterns for consistency
5. Include OpenAPI documentation
6. Write tests for service and controller

## References

- [MVC Pattern](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Express Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
