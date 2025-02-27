# Tackling the Particle System in *Theseus*
**Date:** 2025-02-27  

The particle system in *Theseus* is responsible for effects like fire, smoke, and dust. It was designed to be modular, efficient, and easily debuggable.

---

## System Structure
The system is split into:
- **`ParticleComponent`**: Manages individual particles.
- **`ParticleSystem2D`**: Handles multiple components and rendering.

Each **Particle** has:
- Position (`m_pos`), Velocity (`m_vel`)
- Color (`m_color`), Size (`m_size`)
- Lifetime (`m_lifetime`), Active state (`m_active`)

### `ParticleComponent.h`
```c++
#pragma once
#include <vector>
#include <glm/vec2.hpp>
#include <glm/vec4.hpp>
#include <W_BaseComponent.h>

struct Particle {
    glm::vec2 m_pos, m_vel;
    glm::vec4 m_color;
    float m_size, m_lifetime, m_initialLifetime;
    bool m_active = false;

    void Reset(const glm::vec2& pos, const glm::vec2& vel, const glm::vec4& col, float size, float lifetime) {
        m_pos = pos; m_vel = vel; m_color = col;
        m_size = size; m_lifetime = lifetime;
        m_initialLifetime = lifetime; m_active = true;
    }

    void Update(float delta) {
        if (!m_active) return;
        m_pos += m_vel * delta;
        m_lifetime -= delta;
        if (m_lifetime <= 0.0f) m_active = false;
    }
};

class ParticleComponent : public wolf::BaseComponent {
public:
    ParticleComponent(size_t maxParticles = 100);
    void Update(float delta);
    void Emit(const glm::vec2& pos, const glm::vec2& vel, const glm::vec4& col, float size, float lifetime);
    std::vector<Particle>& GetParticles() { return m_particles; }
private:
    std::vector<Particle> m_particles;
};
```

---

## Problems and Solutions
### Managing Many Particles Efficiently
**Problem:** Keeping track of thousands of particles is performance-heavy.  
**Solution:** Pre-allocate a fixed-size pool of particles and reuse inactive ones.

### `ParticleComponent.cpp`
```c++
#include "ParticleComponent.h"

ParticleComponent::ParticleComponent(size_t maxParticles) {
    m_particles.resize(maxParticles);
}

void ParticleComponent::Update(float delta) {
    for (auto& particle : m_particles) {
        if (particle.m_active) particle.Update(delta);
    }
}

void ParticleComponent::Emit(const glm::vec2& pos, const glm::vec2& vel, const glm::vec4& col, float size, float lifetime) {
    for (auto& particle : m_particles) {
        if (!particle.m_active) {
            particle.Reset(pos, vel, col, size, lifetime);
            return;
        }
    }
}
```

### Managing Multiple Components
**Problem:** A single particle system needs to handle many components across different game objects.  
**Solution:** Register each `ParticleComponent` in `ParticleSystem2D` and iterate over them.

### `ParticleSystem2D.h`
```c++
#pragma once
#include <unordered_set>
#include "ParticleComponent.h"

class ParticleSystem2D {
public:
    void RegisterComponent(ParticleComponent* component);
    void UnregisterComponent(ParticleComponent* component);
    void Update(float delta);
private:
    std::unordered_set<ParticleComponent*> m_components;
};
```

### `ParticleSystem2D.cpp`
```c++
#include "ParticleSystem2D.h"

void ParticleSystem2D::RegisterComponent(ParticleComponent* component) {
    m_components.insert(component);
}

void ParticleSystem2D::UnregisterComponent(ParticleComponent* component) {
    m_components.erase(component);
}

void ParticleSystem2D::Update(float delta) {
    for (auto* component : m_components) {
        component->Update(delta);
    }
}
```

### Real-Time Debugging
**Problem:** Hardcoding values made tweaking particle effects difficult.  
**Solution:** Integrated ImGui for a real-time editor.

### ImGui Debug Panel
```c++
void ParticleSystem2D::ShowEditor() {
    if (!m_showEditor) return;
    ImGui::Begin("Particle Editor");

    for (auto* component : m_components) {
        if (ImGui::CollapsingHeader("Particle Component")) {
            ImGui::ColorEdit4("Color", &m_editorColor.r);
            ImGui::SliderFloat("Size", &m_editorSize, 1.0f, 20.0f);
            ImGui::SliderFloat("Lifetime", &m_editorLifetime, 0.1f, 5.0f);
            ImGui::SliderFloat2("Velocity", &m_editorVelocity.x, -20.0f, 20.0f);
            
            if (ImGui::Button("Emit Particle")) {
                component->Emit({0, 0}, m_editorVelocity, m_editorColor, m_editorSize, m_editorLifetime);
            }
        }
    }

    ImGui::End();
}
```

---

## Conclusion
This optimized particle system efficiently manages particles, supports multiple components, and enables real-time debugging with ImGui.

### Key Takeaways
- Used a fixed-size pool to prevent dynamic allocations.
- Created a central system for managing multiple components.
- Added ImGui controls for real-time particle customization.

### Next Steps
- Add animated particles 
- Allow each particle component to manage their own rendering 
- Implement collision interactions  
- Optimize rendering using instancing  

