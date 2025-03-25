# Theseus Enemy AI System: Behavior Tree & Blackboard Implementation

## Overview

I've implemented a behavior tree and blackboard system for all three enemy types in Theseus (Minitaur, Harpy, and Gorgon). This PR adds sophisticated AI capabilities that enable enemies to coordinate their actions, make tactical decisions, and adapt to changing combat situations. Each enemy type has unique behaviors while sharing the same core architecture.

## Core Architecture

All three enemy types use the same foundational components:

1. **Behavior Tree** - Handles decision making and action selection
2. **Blackboard** - Provides shared memory for data exchange and coordination
3. **State Machine Integration** - Connects AI decisions with animation and movement

### Behavior Node Types

The system uses four basic node types:

- **BehaviorNode** - Base class with `SUCCESS`, `FAILURE`, or `RUNNING` states
- **Selector** - OR logic: tries children until one succeeds
- **Sequence** - AND logic: runs children until one fails
- **Leaf Nodes**:
  - **ConditionNode** - Evaluates boolean conditions
  - **ActionNode** - Performs actual gameplay actions

Here's a simple example of how nodes are constructed:

```cpp
// Create a sequence requiring multiple conditions to be true
auto attackSequence = std::make_unique<Sequence>();

// Add condition: only proceed if in attack range
attackSequence->AddBehaviorNode(std::make_unique<ConditionNode>(
    [this]() { return GetDistanceToTarget() <= m_attackRange; }
));

// Add condition: only proceed if cooldown is complete
attackSequence->AddBehaviorNode(std::make_unique<ConditionNode>(
    [this]() { return m_attackTimer <= 0.0f; }
));

// Add action: perform the attack if all conditions passed
attackSequence->AddBehaviorNode(std::make_unique<ActionNode>(
    [this](float delta) {
        // Attack logic here
        return BehaviorNode::Status::SUCCESS;
    }
));
```

## Minitaur Implementation (Melee Fighter)

### Behavior Tree Structure
```yaml
Root (Selector)
├── Defensive Sequence (Dodge & Counter)
│   ├── Is Defensive Strategy Active? (Condition)
│   ├── Should Dodge Player Attack? (Condition)
│   ├── Perform Dodge (Action)
│   └── Counter-Attack After Dodge (Action)
├── Flanking Sequence (Position & Flank Attack)
│   ├── Is Flanking Strategy Active? (Condition)
│   ├── Is Player Occupied? (Condition)
│   ├── Move To Flanking Position (Action)
│   └── Attack From Flank (Action)
├── Aggressive Sequence (Heavy Attack)
│   ├── Is Aggressive Strategy Active? (Condition)
│   ├── Is Player In Melee Range? (Condition)
│   ├── Is It Our Turn To Attack? (Condition)
│   └── Perform Heavy Attack (Action)
└── Regular Attack Fallback
    ├── Is Player In Melee Range? (Condition)
    ├── Is It Our Turn To Attack? (Condition)
    └── Perform Regular Attack (Action)
```

### Key Features

#### Advanced Dodge System

Minitaurs can detect and dodge player attacks with sophisticated targeting:

```cpp
bool MinitaurController::ShouldDodgePlayerAttack() {
    // Check if player is attacking
    bool playerIsAttacking = playerController->GetPlayerAction() == 
                             PlayerController::PlayerAction::ATTACKING;
    
    if (playerIsAttacking) {
        // Only dodge when close and player is facing this Minitaur
        float facingDot = glm::dot(playerFacing, toMinitaur);
        if (facingDot > 0.8f) {
            // Additional logic to ensure only the targeted Minitaur dodges
            // ...
            return isClosestInDirection;
        }
    }
    return false;
}
```

#### Varied Attack Types

Minitaurs have multiple attack variants based on current strategy:

1. **Regular Attack** - Standard damage and timing
2. **Heavy Attack** - Higher damage (2.0x) with longer windup
3. **Flanking Attack** - Faster attacks (0.8x windup) with bonus damage (1.5x)
4. **Counter-Attack** - Very fast attack (0.7x windup) after successful dodge

#### Collision Avoidance

When multiple Minitaurs are present, they use avoidance steering to prevent clumping:

```cpp
// Check for other Minitaurs in the way
for (auto&& [entity, controller] : GetGameObject()->GetScene().Each<MinitaurController>()) {
    if (controller.GetGameObject()->GetID() != myID) {
        float distToOther = glm::length(otherPos - currentPosition);
        
        if (distToOther < 70.0f) {
            // Calculate avoidance vector away from other Minitaur
            glm::vec2 awayDir = glm::normalize(currentPosition - otherPos);
            avoidance += awayDir * (1.0f - (distToOther / 70.0f));
            needsAvoidance = true;
        }
    }
}

// Blend movement direction with avoidance
if (needsAvoidance) {
    direction = glm::normalize(direction * 0.7f + avoidance * 0.3f);
}
```

## Harpy Implementation (Ranged Attacker)

### Behavior Tree Structure
```yaml
Root (Selector)
├── Repositioning Sequence
│   ├── Should Reposition? (Condition)
│   └── Move To Optimal Position (Action)
├── Attack Sequence
│   ├── In Range And Cooldown Ready? (Condition)
│   ├── Target In Sight? (Condition)
│   └── Perform Attack Pattern (Action)
│       ├── Choose Attack Pattern (Single/Spread/Burst)
│       ├── Set Attack Chain
│       └── Execute Attack
└── Chase Sequence
    ├── Target In Sight But Not In Range? (Condition)
    └── Move Towards Target (Action)
```

### Key Features

#### Projectile Attack System

Harpies have three distinct attack patterns:

1. **Single Shot** - High damage (1.5x), enhanced tracking, longer status effect
   ```cpp
   // Higher damage for focused shot
   auto& attackDamageComponent = projectile.AddComponent<AttackDamageComponent>(
       m_baseDamage * 1.5f, m_pColliderManager, 0.0f, statusEffects, GetGameObject());
   
   // Better tracking
   auto& projectileHoming = projectile.AddComponent<HomingComponent>(m_pTarget, 8.0f, 0.2f);
   ```

2. **Spread Shot** - Multiple projectiles in a fan pattern, lower individual damage
   ```cpp
   // Create 5 projectiles in a spread pattern
   int numProjectiles = 5;
   float spreadWidth = 40.0f;
   
   for (int i = 0; i < numProjectiles; i++) {
       // Calculate spread offset
       float spreadOffset = (i - (numProjectiles - 1) / 2.0f) * (spreadWidth / (numProjectiles - 1));
       glm::vec2 offset = perpendicular * spreadOffset;
       
       // Apply slight angle variation to direction
       float angleVariation = spreadOffset / spreadWidth * 0.3f;
       glm::vec2 adjustedDirection = direction + perpendicular * angleVariation;
   }
   ```

3. **Burst Attack** - Three volleys of three projectiles each, rapid fire
   ```cpp
   // Set attack chain to fire 3 separate volleys
   m_attackChain = 3;
   
   // Spawn 3 projectiles per volley
   for(int i = -1; i <= 1; i += 1) {
       // Position with spread
       glm::vec2 offset = perpendicularVector * (30.0f * i);
   }
   ```

#### Dynamic Range Management

Harpies maintain optimal distance using a hysteresis system to prevent oscillation:

```cpp
// Get current strategy to determine preferred distance
Strategy currentStrategy = g_blackboard.GetStrategy();
float preferredDistance = m_rangedRange * 0.9f; // Default position

if (currentStrategy == Strategy::DEFENSIVE) {
    preferredDistance = m_rangedRange * 0.95f; // Further back when defensive
} else if (currentStrategy == Strategy::AGGRESSIVE) {
    preferredDistance = m_rangedRange * 0.7f; // Closer when aggressive
}

// Apply hysteresis - only adjust position if significantly off from desired range
const float hysteresisRange = 20.0f; // Distance buffer zone
```

## Gorgon Implementation (Petrification Specialist)

### Behavior Tree Structure
```yaml
Root (Selector)
├── Repositioning Sequence
│   ├── Should Reposition? (Condition)
│   └── Move To Optimal Position (Action)
├── Attack Sequence
│   ├── Can Perform Gaze Attack? (Condition)
│   └── Execute Gaze Attack (Action)
│       ├── Choose Attack Type (Quick/Sustained/Area)
│       ├── Apply Visual Effects
│       └── Execute Petrification
├── Chase Sequence
│   ├── Target In Sight But Not In Range? (Condition)
│   └── Chase Target (Action)
└── Prospect Sequence
    ├── Target Not Visible Or Petrified? (Condition)
    └── Enter Prospect State (Action)
```

### Key Features

#### Gaze Attack System

Gorgons have three types of petrification attacks:

1. **Quick Attack** - Faster windup (70% of standard), shorter petrification (3s)
   ```cpp
   case GazeAttackType::QUICK:
       m_currentGazeAttackType = GazeAttackType::QUICK;
       m_rangedWindupTimer = m_rangedWindupTime * 0.7f;
       m_curentCrosshairColour = glm::vec4(1.0f, 0.7f, 0.0f, 1.0f); // Orange
       // Shorter duration for quick attacks
       petrificationDuration = 3.0f;
   ```

2. **Sustained Attack** - Longer windup (120% of standard), extended petrification (7s)
   ```cpp
   case GazeAttackType::SUSTAINED:
       m_currentGazeAttackType = GazeAttackType::SUSTAINED;
       m_rangedWindupTimer = m_rangedWindupTime * 1.2f;
       m_curentCrosshairColour = glm::vec4(0.0f, 1.0f, 0.0f, 1.0f); // Green
       // Longer duration for sustained attacks
       petrificationDuration = 7.0f;
   ```

3. **Area Attack** - Standard windup, coordinates with other enemies via blackboard
   ```cpp
   case GazeAttackType::AREA:
       m_currentGazeAttackType = GazeAttackType::AREA;
       m_rangedWindupTimer = m_rangedWindupTime;
       m_curentCrosshairColour = glm::vec4(0.7f, 0.0f, 0.7f, 1.0f); // Purple
       // Standard duration
       petrificationDuration = 5.0f;
       
       // Signal to other gorgons via blackboard
       g_blackboard.SetBool("petrificationSuccess", true);
       g_blackboard.SetInt("lastPetrifierID", GetGameObject()->GetID());
   ```

#### Strategic Position Selection

Gorgons find optimal attack positions with clear line of sight:

```cpp
// Score each valid position
for (const auto& pos : potentialPositions) {
    float score = 0.0f;
    
    // Distance scoring
    float distanceFromCurrent = glm::length(pos - selfPos);
    score -= distanceFromCurrent * 0.1f;
    
    // Clustering avoidance
    if (isClear) {
        score += 30.0f;
    }
    
    // For LOS attackers like Gorgons, positions with clear line of sight are critical
    glm::vec2 endpoint = pDDA->GetEndpoint(pos, playerPos);
    if (glm::length(endpoint - playerPos) < 0.1f) {
        // Clear line of sight to player from this position
        score += 50.0f;
    }
}
```

## Shared Strategy System

All three enemy types use a common strategy system with three options:

1. **Defensive**
   - Triggered when health drops below 30%
   - Prioritizes safety and counterattacks
   - Maintains distance from player when possible

2. **Aggressive**
   - Activated when player health is low (<20%)
   - Focuses on maximum damage output
   - Uses more powerful but slower attacks

3. **Flanking**
   - Used when multiple enemies are present
   - Coordinates positioning around player
   - Creates group tactics through role division

### ID-Based Role Assignment

Enemies use their entity ID for consistent role assignment:

```cpp
// Use modulo to distribute roles consistently
int roleSelector = myID % 3;
switch (roleSelector) {
    case 0: 
        g_blackboard.SetStrategy(Strategy::AGGRESSIVE); 
        break;
    case 1: 
        g_blackboard.SetStrategy(Strategy::FLANKING); 
        break;
    case 2:
        g_blackboard.SetStrategy(Strategy::DEFENSIVE);
        break;
}
```

## Performance Optimizations

To ensure the AI doesn't impact framerate, I've implemented several optimizations:

1. **Throttled Updates**
   - Strategy evaluations limited to every 200ms
   - Separate timers for different AI components
   ```cpp
   // Run expensive AI operations at most every 200ms
   bool shouldUpdateAI = (s_aiUpdateTimers[myID] > 0.2f);
   if (shouldUpdateAI) {
       // Only evaluate strategy occasionally
       EvaluateStrategy();
       // Update blackboard with current game state
       UpdateBlackboard();
       // Reset the timer
       s_aiUpdateTimers[myID] = 0.0f;
   }
   ```

2. **Cached Enemy Counting**
   - Nearby enemy counts cached and updated periodically
   - Single cache shared across all enemies
   ```cpp
   // Only count nearby enemies every 0.5 seconds
   static float s_enemyCountTimer = 0.0f;
   static int s_cachedNearbyEnemies = 0;
   
   s_enemyCountTimer += 0.1f;
   if (s_enemyCountTimer > 0.5f) {
       // Perform count and update cache
       s_cachedNearbyEnemies = CountNearbyEnemies();
       g_blackboard.SetInt("nearbyEnemies", s_cachedNearbyEnemies);
       s_enemyCountTimer = 0.0f;
   }
   ```

3. **Global Attack Lock**
   - Prevents all enemies from attacking simultaneously
   - Auto-releases after timeout to prevent deadlocks
   ```cpp
   int attackingID = g_blackboard.GetAttackingEnemyID();
   if (attackingID != -1) {
       float attackLockTime = g_blackboard.GetFloat("attackLockTime");
       attackLockTime += delta;
       g_blackboard.SetFloat("attackLockTime", attackLockTime);
       
       if (attackLockTime > 2.0f) {
           // Auto-release lock after timeout
           g_blackboard.SetAttackingEnemyID(-1);
           g_blackboard.SetFloat("attackLockTime", 0.0f);
       }
   }
   ```

## Testing Notes

I've tested all three enemy types individually and in groups. They show the following behaviors:

- **Single Enemy** - Makes appropriate strategic decisions, maintains effective positioning
- **Groups of Same Type** - Coordinate well, avoid clustering, take turns attacking
- **Mixed Groups** - Different types complement each other (e.g., Gorgons petrify while Minitaurs flank)

The AI produces dynamic combat situations where enemies react to player actions and each other. Enemies now dodge player attacks, reposition intelligently, and use varied attack patterns.

## Next Steps

idk but prob potential future improvements:
- More varied attack patterns // idk if i need to do this 
- Additional coordination between different enemy types // idk if i need to do this 
- Fine-tuning of timing and positioning parameters // probably need to do this, i hate how harpies shot from inside the wall tiles lmfao.
