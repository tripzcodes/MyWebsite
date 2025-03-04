
# **Enhancing Melee Attack Patterns with Behavior Trees and Blackboard System**
This document explores how to refactor the current melee attack system for Minitaurs, Harpies, and Gorgons in *Theseus* using **Behavior Trees** and a **Blackboard System**. The goal is to enable more complex, coordinated, and intelligent melee attack patterns. The updated system introduces **strategies (aggressive, defensive with dodging, and flanking)** and **coordinated attacks** for a more challenging and dynamic gameplay experience.

---

## **1. Current Implementation (Before)**
### **1.1 Melee Attack Handling in `MinitaurController`**
Currently, melee attacks are handled in a straightforward manner with if-else conditions for attack range and cooldown checks. This simplistic approach leads to predictable and exploitable attack patterns.

**Code Example:**
```c++
void MinitaurController::HandleAttackingState(float delta) {{
    if (!m_pTarget) {{
        ChangeState(EnemyState::IDLE);
        return;
    }}

    if (m_meleeWindupTimer > 0.0f) {{
        m_meleeWindupTimer -= delta;
        m_pAnimComponent->SetTint(glm::vec3(1.0f, 0.5f, 0.5f));
    }} else {{
        m_pAnimComponent->SetTint(glm::vec3(1.0f));
        auto* playerHealth = m_pTarget->GetComponent<HealthComponent>();
        if (playerHealth) {{
            playerHealth->Damage(m_baseDamage);
        }}
        ChangeState(EnemyState::CHASING);
    }}
}}
```

### **1.2 Limitations:**
- **Predictable:** Single attack pattern makes it easy for players to exploit.
- **Rigid:** No flexibility for different melee strategies (no dodging, flanking, etc.).
- **No Coordination:** Multiple enemies attack simultaneously without strategy.
- **Difficulty Scaling:** Lacks adaptability based on player skill or health.

---

## **2. Proposed Implementation (After)**
### **2.1 Behavior Trees with Blackboard System for Melee Attack Patterns**
I'll introduce a **Behavior Tree** integrated with a **Blackboard System** to handle different melee attack patterns for Minitaurs, Harpies, and Gorgons. The system will:
1. **Use Selector and Sequence Nodes** to decide actions based on game context.
2. **Support Multiple Melee Patterns:** Regular attack, Heavy attack, Dodging, and Flanking.
3. **Coordinate Multiple Enemies:** Share data via the blackboard to prevent simultaneous attacks and enable flanking.

---

### **2.2 Enhanced Blackboard System Implementation**
The **Blackboard** acts as a shared memory for enemy AI to exchange information about player status, attack cooldowns, and tactical decisions.

**Blackboard.h:**
```c++
#pragma once
#include <unordered_map>
#include <string>

enum class Strategy {{ AGGRESSIVE, DEFENSIVE, FLANKING }};

class Blackboard {{
public:
    void SetBool(const std::string& key, bool value);
    bool GetBool(const std::string& key) const;
    void SetFloat(const std::string& key, float value);
    float GetFloat(const std::string& key) const;
    void SetStrategy(Strategy strategy);
    Strategy GetStrategy() const;
    void SetAttackingEnemyID(int id);
    int GetAttackingEnemyID() const;

private:
    std::unordered_map<std::string, bool> m_boolData;
    std::unordered_map<std::string, float> m_floatData;
    Strategy m_strategy = Strategy::AGGRESSIVE;
    int m_attackingEnemyID = -1;
}};

extern Blackboard g_blackboard;
```

**Key Features:**
- **Strategy Switching:** Dynamic adaptation based on player health and group status.
- **Coordinated Attacks:** Ensures enemies attack in turns to avoid overwhelming the player unfairly.

---

### **2.3 Updated Behavior Tree Structure**
```yaml
Root
├── Selector
│   ├── Sequence: Aggressive Strategy
│       ├── ChargeAttack
│       ├── PerformAttack
│   ├── Sequence: Defensive Strategy (Dodging)
│       ├── ShouldDodge
│       ├── PerformDodge
│       ├── CounterAttack
│   ├── Sequence: Flanking Strategy
│       ├── MoveToFlank
│       ├── AttackFromBehind
│   ├── MoveTowardsTarget
```

---

### **2.4 Implementing Melee Attack Patterns:**
- **`Regular Attack:`** Standard melee attack with cooldown.
- **`Heavy Attack:`** High-damage, slower attack with longer cooldown.
- **`Dodging:`** Evades player attacks if within range.
- **`Flanking:`** Moves to attack the player from the side or behind.

---

### **2.5 Dynamic Strategy Switching**
- **`Condition:`** If the player is low on health, switch to aggressive.
- **`Condition:`** If multiple enemies are low on health, switch to defensive with dodging.
- **`Condition:`** If player attacks frequently, adopt flanking strategy.

**Code Example:**
```c++
void MinitaurController::EvaluateStrategy() {{
    float playerHealth = g_blackboard.GetFloat("playerHealth");
    float groupHealth = g_blackboard.GetFloat("groupHealth");

    if (playerHealth < 20.0f) {{
        g_blackboard.SetStrategy(Strategy::AGGRESSIVE);
    }} else if (groupHealth < 30.0f) {{
        g_blackboard.SetStrategy(Strategy::DEFENSIVE);
    }} else {{
        g_blackboard.SetStrategy(Strategy::FLANKING);
    }}
}}
```

---

### **Summary: Before vs. After**
| **Aspect**                         | **Before**                            | **After (Behavior Trees + Blackboard)**    |
|------------------------------------|---------------------------------------|---------------------------------------------|
| **`Attack Patterns`**                | Single melee attack                   | Regular, Heavy, Flank, Dodging             |
| **`Coordination`**                   | Chaotic and simultaneous              | Coordinated using Behavior Trees and Blackboard |
| **`Strategy Switching`**             | None                                  | Dynamic based on player and group health   |
| **`Difficulty Scaling`**             | None                                  | Adaptive based on player behavior          |
| **`Code Complexity`**                | Flat, If-Else                         | Modular and maintainable                   |


### **Conclusion:**
Implementing Behavior Trees with a Blackboard system and introducing **dodging, flanking, and coordinated attacks** significantly enhances AI flexibility and complexity.

---

### **Inspirations:**
- **`Dark Souls:`** Strategic enemy placements and attack patterns.
- **`Unreal Engine Behavior Trees:`** Modular approach to AI with Blackboard systems.
- **`Sekiro: Shadows Die Twice:`** Aggressive yet methodical enemy behaviors with coordinated attacks.


