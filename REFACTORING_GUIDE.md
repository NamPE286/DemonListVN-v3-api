# MVC Refactoring Guide

This guide explains how to refactor existing routes to follow the MVC pattern.

## Step-by-Step Process

### 1. Analyze the Current Route

Before refactoring, understand what the route does:
- What HTTP methods does it support?
- What business logic is present?
- What database operations are performed?
- What middleware is used?

### 2. Create the Service

Extract business logic into a service class.

**Before** (in route file):
```typescript
router.route('/:id')
    .get(async (req, res) => {
        const { id } = req.params
        
        try {
            const level = new Level({ id: parseInt(id) })
            await level.pull()
            res.send(level)
        } catch (err) {
            res.status(404).send()
        }
    })
```

**After** (create `src/services/levelService.ts`):
```typescript
import Level from '@lib/classes/Level'

export class LevelService {
    async getLevelById(id: number) {
        const level = new Level({ id })
        await level.pull()
        return level
    }
}

export default new LevelService()
```

### 3. Create the Controller

Create controller to handle HTTP requests and call services.

**Create** `src/controllers/levelController.ts`:
```typescript
import type { Request, Response } from 'express'
import levelService from '@src/services/levelService'

export class LevelController {
    async getLevel(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id)
            const level = await levelService.getLevelById(id)
            res.send(level)
        } catch (error) {
            res.status(404).send()
        }
    }
}

export default new LevelController()
```

### 4. Update the Route

Simplify route to only define endpoints and link to controllers.

**After** (in route file):
```typescript
import express from 'express'
import levelController from '@src/controllers/levelController'

const router = express.Router()

router.route('/:id')
    .get(levelController.getLevel.bind(levelController))

export default router
```

## Common Patterns

### Pattern 1: Simple GET Request

**Before**:
```typescript
router.route('/')
    .get(async (req, res) => {
        const { data, error } = await supabase
            .from('rules')
            .select('*')

        if (error) {
            res.status(500).send()
        }

        res.send(data)
    })
```

**Service**:
```typescript
export class RulesService {
    async getRules() {
        const { data, error } = await supabase
            .from('rules')
            .select('*')

        if (error) {
            throw error
        }

        return data
    }
}
```

**Controller**:
```typescript
export class RulesController {
    async getRules(req: Request, res: Response) {
        try {
            const rules = await rulesService.getRules()
            res.send(rules)
        } catch (error) {
            res.status(500).send()
        }
    }
}
```

### Pattern 2: Request with Authentication

**Before**:
```typescript
router.route('/')
    .put(userAuth, async (req, res) => {
        const data = req.body
        const user = res.locals.user

        if (user.uid != data.uid && !user.isAdmin) {
            res.status(403).send()
            return
        }

        try {
            const player = new Player(data)
            await player.update()
            res.send()
        } catch (err) {
            res.status(500).send()
        }
    })
```

**Service**:
```typescript
export class PlayerService {
    async updatePlayer(data: any, user: Player) {
        if (user.uid != data.uid && !user.isAdmin) {
            throw new Error("Forbidden")
        }

        const player = new Player(data)
        await player.update()
    }
}
```

**Controller**:
```typescript
export class PlayerController {
    async updatePlayer(req: Request, res: Response) {
        try {
            const user = res.locals.user
            await playerService.updatePlayer(req.body, user)
            res.send()
        } catch (error: any) {
            if (error.message === "Forbidden") {
                res.status(403).send()
            } else {
                res.status(500).send()
            }
        }
    }
}
```

**Route**:
```typescript
router.route('/')
    .put(userAuth, playerController.updatePlayer.bind(playerController))
```

### Pattern 3: Request with Query Parameters

**Before**:
```typescript
router.route('/')
    .get(async (req, res) => {
        const { province, city, sortBy = 'rating', ascending = 'true' } = req.query
        
        try {
            res.send(await getPlayers({ province, city, sortBy, ascending }))
        } catch {
            res.status(500).send()
        }
    })
```

**Service**:
```typescript
export class PlayerService {
    async getFilteredPlayers(filters: any) {
        return await getPlayers(filters)
    }
}
```

**Controller**:
```typescript
export class PlayersController {
    async getPlayers(req: Request, res: Response) {
        try {
            const players = await playerService.getFilteredPlayers(req.query)
            res.send(players)
        } catch (error) {
            res.status(500).send()
        }
    }
}
```

### Pattern 4: Complex Business Logic

**Before**:
```typescript
router.route('/:uid')
    .get(async (req, res) => {
        const { uid } = req.params

        try {
            const player = new Player({})

            if (uid.startsWith('@')) {
                player.name = uid.slice(1)
            } else {
                player.uid = uid
            }

            await player.pull()
            res.send(player)
        } catch (err) {
            res.status(404).send()
        }
    })
```

**Service** (isolate business logic):
```typescript
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
}
```

**Controller** (simple HTTP handling):
```typescript
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
```

## Error Handling Strategy

### 1. Services throw errors
```typescript
// In service
if (!isValid) {
    throw new Error("Specific error message")
}
```

### 2. Controllers catch and map to HTTP status
```typescript
// In controller
try {
    await service.doSomething()
    res.send()
} catch (error: any) {
    if (error.message === "Specific error message") {
        res.status(400).send({ message: error.message })
    } else if (error.message === "Forbidden") {
        res.status(403).send()
    } else {
        res.status(500).send()
    }
}
```

## Checklist

When refactoring a route, ensure:

- [ ] Create service file in `src/services/`
- [ ] Extract all business logic to service
- [ ] Service methods do not depend on `req` or `res`
- [ ] Service throws errors instead of returning them
- [ ] Create controller file in `src/controllers/`
- [ ] Controller handles HTTP concerns only
- [ ] Controller catches errors and maps to status codes
- [ ] Update route file to use controller
- [ ] Route file is minimal (endpoint + middleware + controller)
- [ ] Keep existing OpenAPI documentation in route
- [ ] Middleware remains in route definition
- [ ] Test that build succeeds (`npm run build`)
- [ ] Verify no functionality changes (API contract preserved)

## Common Mistakes to Avoid

### ❌ Don't put HTTP logic in services
```typescript
// BAD - Service should not know about HTTP
async getPlayer(req: Request, res: Response) {
    const player = await this.findPlayer(req.params.id)
    res.send(player)
}
```

```typescript
// GOOD - Service returns data, controller handles HTTP
async getPlayer(id: string) {
    return await this.findPlayer(id)
}
```

### ❌ Don't put business logic in controllers
```typescript
// BAD - Business logic in controller
async updatePlayer(req: Request, res: Response) {
    const { data } = req.body
    
    // Business validation in controller - WRONG
    if (!data.name || data.name.length < 3) {
        res.status(400).send()
        return
    }
    
    await playerService.update(data)
    res.send()
}
```

```typescript
// GOOD - Business logic in service
// Service:
async updatePlayer(data: any) {
    if (!data.name || data.name.length < 3) {
        throw new Error("Invalid name")
    }
    // ... update logic
}

// Controller:
async updatePlayer(req: Request, res: Response) {
    try {
        await playerService.updatePlayer(req.body)
        res.send()
    } catch (error: any) {
        if (error.message === "Invalid name") {
            res.status(400).send({ message: error.message })
        } else {
            res.status(500).send()
        }
    }
}
```

### ❌ Don't forget to bind controller methods
```typescript
// BAD - 'this' context will be lost
router.route('/')
    .get(controller.getAll)
```

```typescript
// GOOD - Bind the method to preserve 'this' context
router.route('/')
    .get(controller.getAll.bind(controller))
```

## Example: Complete Refactoring

Let's refactor the `deathCount` route as an example.

### Original Route
```typescript
import express from 'express'
import { getDeathCount, updateDeathCount } from '@src/lib/client/deathCount'
import userAuth from '@src/middleware/userAuth'

const router = express.Router()

router.route('/:uid/:levelID')
    .get(async (req, res) => {
        try {
            const { uid, levelID } = req.params
            res.send(await getDeathCount(uid, parseInt(levelID)))
        } catch {
            res.status(500).send()
        }
    })
    .put(userAuth, async (req, res) => {
        const { user } = res.locals
        const { uid, levelID } = req.params
        const { deathCount } = req.body

        if (user.uid != uid) {
            res.status(403).send()
            return
        }

        try {
            await updateDeathCount(uid, parseInt(levelID), deathCount)
            res.send()
        } catch {
            res.status(500).send()
        }
    })

export default router
```

### Step 1: Create Service
```typescript
// src/services/deathCountService.ts
import { getDeathCount, updateDeathCount } from '@src/lib/client/deathCount'
import type Player from '@lib/classes/Player'

export class DeathCountService {
    async getDeathCount(uid: string, levelId: number) {
        return await getDeathCount(uid, levelId)
    }

    async updateDeathCount(uid: string, levelId: number, count: number, user: Player) {
        if (user.uid != uid) {
            throw new Error("Forbidden")
        }

        await updateDeathCount(uid, levelId, count)
    }
}

export default new DeathCountService()
```

### Step 2: Create Controller
```typescript
// src/controllers/deathCountController.ts
import type { Request, Response } from 'express'
import deathCountService from '@src/services/deathCountService'

export class DeathCountController {
    async getDeathCount(req: Request, res: Response) {
        try {
            const { uid, levelID } = req.params
            const deathCount = await deathCountService.getDeathCount(
                uid,
                parseInt(levelID)
            )
            res.send(deathCount)
        } catch (error) {
            res.status(500).send()
        }
    }

    async updateDeathCount(req: Request, res: Response) {
        try {
            const { user } = res.locals
            const { uid, levelID } = req.params
            const { deathCount } = req.body

            await deathCountService.updateDeathCount(
                uid,
                parseInt(levelID),
                deathCount,
                user
            )
            res.send()
        } catch (error: any) {
            if (error.message === "Forbidden") {
                res.status(403).send()
            } else {
                res.status(500).send()
            }
        }
    }
}

export default new DeathCountController()
```

### Step 3: Update Route
```typescript
// src/routes/deathCount.ts
import express from 'express'
import userAuth from '@src/middleware/userAuth'
import deathCountController from '@src/controllers/deathCountController'

const router = express.Router()

router.route('/:uid/:levelID')
    .get(deathCountController.getDeathCount.bind(deathCountController))
    .put(userAuth, deathCountController.updateDeathCount.bind(deathCountController))

export default router
```

## Testing Your Refactoring

After refactoring:

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Check for TypeScript errors**:
   Ensure no new errors are introduced

3. **Verify the API contract**:
   - Same endpoints
   - Same request/response formats
   - Same status codes
   - Same authentication requirements

4. **Manual testing** (if possible):
   - Test each endpoint
   - Verify error cases
   - Check edge cases

## Next Steps

After completing a refactoring:

1. Test the build
2. Commit your changes
3. Update the progress in the PR description
4. Move on to the next route

Happy refactoring! 🚀
