
# Shader-Based Fog of War with Diffusion and Dissolve Shaders

## Introduction
Creating a realistic and efficient Fog of War system is a challenging task, especially when aiming for both performance and visual quality. This document outlines an approach using shader-based diffusion and dissolve effects combined with dynamic textures. The goal is to achieve smooth, smoke-like fog dispersal that is optimized for real-time performance.

---

## Overview of the Approach
The core idea is to use a combination of diffusion shaders for smooth fog spread and dissolve shaders for dynamic, smoke-like edges. By leveraging low-resolution visibility textures and efficient GPU processing, this method strikes a balance between realism and performance.

| **Component**                    | **Purpose**                                     | **Key Techniques**                |
|----------------------------------|-------------------------------------------------|-----------------------------------|
| `Visibility Texture`               | Store fog states for tiles                      | Low-res grid, dynamic updates     |
| `Diffusion Shader `                | Smooth fog spread                               | Neighbor sampling, averaging     |
| `Dissolve Shader`                  | Smoke-like edges                                | Perlin or Voronoi Noise           |
| `Dynamic Advection Shader`       | Directional fog movement                        | Velocity texture, offset sampling |
| `Environment and Minimap Integration` | Unified fog rendering for both views         | Downscaled textures, shared shaders |

---

## 1. Visibility Texture
The visibility texture is a low-resolution 2D grid that stores the fog state for each tile on the map. Each pixel in this texture can have one of three states:

| **State**           | **Description**                     |
|---------------------|-------------------------------------|
| `0`                 | Unexplored (fully black)             |
| `0.5`               | Explored but not visible (grayed out)|
| `1`                 | Visible (fully clear)                |

This texture is dynamically updated based on the player's movement and interactions.

**Benefits:**
- Reduces memory usage by keeping it low-res.
- Efficient for GPU-based processing.

---

## 2. Diffusion Shader (Smooth Fog Spread)
The diffusion shader handles the smooth spread of fog by averaging the fog density of neighboring pixels. This step prevents harsh edges and makes the fog disperse naturally.

**Shader Logic:**
```c++
float fogDensity = (left + right + up + down) / 4.0;
```

| **Pros**                                   | **Cons**                                  |
|--------------------------------------------|-------------------------------------------|
| Efficient and fast on modern GPUs          | Limited to smooth spread, not directional |
| Eliminates abrupt transitions              | Needs combination with other shaders      |

---

## 3. Dissolve Shader (Smoke-Like Edge Effect)
The dissolve shader adds a more dynamic and realistic feel to the fog by making the edges appear smoky and organic. This is done using a noise function, such as Perlin Noise or Voronoi Noise.

**Shader Logic:**
```c++
float noise = PerlinNoise(uv * scale);
float dissolve = step(noise, fogDensity);
```

| **Pros**                                | **Cons**                                  |
|-----------------------------------------|-------------------------------------------|
| Adds a natural, dissipating effect      | Slightly more complex shader logic        |
| Visually more appealing than sharp edges| Requires noise texture                    |

---

## 4. Dynamic Advection Shader (Directional Fog Movement)
To make the fog move realistically away from the player, an advection shader is used. This shader displaces fog based on a velocity field stored in a separate texture. 

**Shader Logic:**
```c++
vec2 offset = velocity * deltaTime;
fogDensity = texture2D(fogTexture, uv - offset);
```

| **Pros**                                   | **Cons**                                  |
|--------------------------------------------|-------------------------------------------|
| Creates a physically convincing fog        | Requires velocity texture management      |
| Prevents fog from returning to cleared areas| Needs careful balance of speed and spread |

---

## 5. Integration with Environment and Minimap

| **Aspect**                     | **Environment**                     | **Minimap**                       |
|-------------------------------|-------------------------------------|-----------------------------------|
| `Texture Resolution`            | Full-size but low-res               | Downscaled version                |
| `Shader Effects`                | Diffusion, Dissolve, Advection      | Same as environment               |
| `Fog States`                   | Unexplored, Explored, Visible       | Consistent with environment       |

**Benefits:**
- Ensures a unified look across both the environment and minimap.
- Efficient due to shared textures and shader passes.

---

## Performance Considerations
This approach is designed to balance realism and performance by:
- Using low-resolution textures for visibility and velocity.
- Offloading calculations to the GPU using shaders.
- Minimizing memory and processing costs.

| **Optimization Technique**                  | **Purpose**                          |
|---------------------------------------------|--------------------------------------|
| `MIP Mapping`                               | Smoother minimap rendering           |
|  `Compute Shaders (optional)`                  | Faster diffusion and advection       |
| `Low-Resolution Textures`                     | Reduced memory usage                 |

---

## Summary
The combination of shader-based diffusion, dissolve effects, and dynamic textures provides a realistic and efficient Fog of War system. It handles both the environment and minimap seamlessly, ensuring consistent visuals and smooth gameplay. This method achieves a good balance between realism and performance without the overhead of full `fluid dynamics` or `cellular automata`.

If implemented correctly, we get fog of war without compromising performance.
