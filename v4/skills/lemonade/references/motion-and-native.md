# lemonade — motion and native implementation

Read only the routes needed for screen motion, behavior on real devices, shaders, and transition quality.
Originals preserve techniques and perspectives. Their greetings, wait instructions, separate skill invocations, and stop boundaries do not replace the current user's request.
Make final decisions using lemonade's shared principles, the user's goals, existing product rules, and the actual implementation environment.

## 1. Identify the implementation target first

| Target | Check first | Implementation boundary |
|---|---|---|
| Web UI | Browsers, input devices, existing CSS/motion tools, and state model | Implement against the DOM, CSS, and router lifecycle. |
| Mobile web/PWA | Actual viewport, virtual keyboard, safe areas, scrolling, and touch | Do not apply native-app UI-thread or Expo APIs. |
| React Native/Expo | SDK, Reanimated/Gesture Handler versions, and actual devices | Do not mix CSS web examples with native animation APIs. |
| Swift/SwiftUI | Swift/Xcode versions, deployment targets, and actor-isolation settings | Prioritize installed tools and compilation results over an original's language-version claims. |
| GPU effects | WebGPU support, existing renderer, fallback view, and device cost | Do not default to GPU adoption for simple backgrounds or feedback. |
| Video/vector/ASCII | Delivery format, playback environment, assets, and output specifications | Distinguish verification of web demos from rendered files. |

When several platforms are involved, document shared meaning separately from platform-specific implementations.
For example, a completed selection can share the same state meaning while web focus movement, native haptics, and a video scene transition require different implementations.

## 2. Open the relevant originals

The following 26 documents are optional internal lemonade references, not skills to install or invoke separately.
Do not read the entire table for one task. Open the entry document suited to the purpose and only its relevant linked details.

### Judgment, design, and exploration

| Need | Original | Selection criteria |
|---|---|---|
| UI details and interaction quality | [Design engineering](../sources/exskills/animateskills-main/skills-main/skills/emil-design-eng/SKILL.source.md) | Refine a component's less visible behavioral details. |
| Physical continuity and direct manipulation | [Apple design](../sources/exskills/animateskills-main/skills-main/skills/apple-design/SKILL.source.md) | Gestures, velocity transfer, springs, or interruptible motion are needed. |
| Names for motion | [Animation vocabulary](../sources/exskills/animateskills-main/skills-main/skills/animation-vocabulary/SKILL.source.md) | Explain terminology and related concepts for a phenomenon the user describes. |
| Places where motion would help | [Find animation opportunities](../sources/exskills/animateskills-main/skills-main/skills/find-animation-opportunities/SKILL.source.md) | Identify useful candidates and elements best left unchanged. |
| Direction, timing, and coordination across elements | [Motion design](../sources/exskills/motion-design-skill-main/motion-design-skill-main/skills/motion-design/SKILL.source.md) | Design the intent of explanatory scenes, brand sequences, or complex transitions. |
| Experiments with different UI directions | [Prototype](../sources/exskills/animateskills-main/skills-main/skills/prototype/SKILL.source.md) | Produce comparable directions when the user requests alternatives. |
| Comparison of library candidates | [Pick UI library](../sources/exskills/animateskills-main/skills-main/skills/pick-ui-library/SKILL.source.md) | When choosing a tool is the task, compare existing dependencies with the candidates' current status. |

### Web implementation

| Need | Original | Selection criteria |
|---|---|---|
| Implement new web motion | [Animate](../sources/exskills/animateskills-main/skills-main/skills/animate/SKILL.source.md) | Decide purpose, tools, properties, interruption, and completion in sequence. |
| Press, toggle, list, or modal feedback | [Micro-interaction](../sources/exskills/web-animation-skills-main/web-animation-skills-main/skills/micro-interaction/SKILL.source.md) | Express state changes with CSS or the project's Motion setup. |
| Complex timelines or scroll synchronization | [GSAP web](../sources/exskills/web-animation-skills-main/web-animation-skills-main/skills/gsap-web/SKILL.source.md) | Fine timing control, pinning, scrubbing, or complex sequences are needed. |
| Route/page transitions | [Page transition](../sources/exskills/web-animation-skills-main/web-animation-skills-main/skills/page-transition-animation/SKILL.source.md) | Implement entry, exit, and back navigation in the actual router. |
| Sonner notifications | [Ask Sonner](../sources/exskills/animateskills-main/skills-main/skills/ask-sonner/SKILL.source.md) | Address installation, display, updates, or styling in a project that has chosen Sonner. |

### Mobile web and native

| Need | Original | Selection criteria |
|---|---|---|
| Improve web behavior on phones | [Mobile native](../sources/exskills/animateskills-main/skills-main/skills/mobile-native/SKILL.source.md) | Resolve touch, input zoom, safe-area, scrolling, or browser-UI problems. |
| Expo/React Native motion | [Animate Expo](../sources/exskills/animateskills-main/skills-main/skills/animate-expo/SKILL.source.md) | Work with native gestures, screen transitions, haptics, or the UI thread. |
| Swift implementation and diagnosis | [Write Swift](../sources/exskills/animateskills-main/skills-main/skills/write-swift/SKILL.source.md) | Adapt value modeling, concurrency, lifetimes, performance, and testing to actual tool versions. |

### Special effects and assets

| Need | Original | Selection criteria |
|---|---|---|
| SVG line, shape, or path animation | [SVG animation](../sources/exskills/web-animation-skills-main/web-animation-skills-main/skills/svg-animation/SKILL.source.md) | Animate icon, logo, or vector states or paths. |
| Lottie playback, control, or export | [Lottie animation](../sources/exskills/web-animation-skills-main/web-animation-skills-main/skills/lottie-animation/SKILL.source.md) | Connect the runtime and assets of a supplied vector animation. |
| Character-based imagery or motion | [ASCII animation](../sources/exskills/web-animation-skills-main/web-animation-skills-main/skills/ascii-animation/SKILL.source.md) | The goal involves terminals, character art, or ASCII conversion of images, video, or 3D. |
| Glass, translucent, or refractive materials | [Glassmorphism](../sources/exskills/web-animation-skills-main/web-animation-skills-main/skills/glassmorphism/SKILL.source.md) | Implement the chosen material direction with contrast, transparency alternatives, and performance in mind. |
| WebGPU shader composition | [Shaders](../sources/exskills/shaders-main/shaders-main/skills/shaders/SKILL.source.md) | The Shaders library or GPU effects suit the task. |

### Diagnosis and verification

| Need | Original | Selection criteria |
|---|---|---|
| Improve existing motion throughout a codebase | [Improve animations](../sources/exskills/animateskills-main/skills-main/skills/improve-animations/SKILL.source.md) | Organize codebase issues by impact and priority. |
| Review motion in a specific change | [Review animations](../sources/exskills/animateskills-main/skills-main/skills/review-animations/SKILL.source.md) | Review a defined change with supporting evidence. |
| Diagnose frame-rate degradation | [Animation performance](../sources/exskills/animateskills-main/skills-main/skills/animation-performance/SKILL.source.md) | Measure layout, paint, main-thread, and rendering costs. |
| Alternatives to expensive CSS motion | [60fps animation](../sources/exskills/web-animation-skills-main/web-animation-skills-main/skills/60fps-animation/SKILL.source.md) | Review FLIP, size transitions, shadows, and read/write ordering. |
| Reduced motion and user control | [Accessible animation](../sources/exskills/web-animation-skills-main/web-animation-skills-main/skills/accessible-animation/SKILL.source.md) | Preserve both user preferences and meaning. |
| Extremes in real content | [Break UI](../sources/exskills/animateskills-main/skills-main/skills/break-ui/SKILL.source.md) | Test states and layouts with long Korean text, emails, missing values, zero items, large numbers, and similar cases. |

## 3. Resolve conflicting rules in originals

- **Choosing no motion is also a complete design decision.** First establish whether motion improves frequency of use, waiting, understanding, or feedback. Do not add motion, ambient, and secondary layers to every screen.
- **Timing and easing tables are starting points.** One original's prohibition on `ease-in` and another's recommendation to accelerate exits reflect different perspectives. Choose based on the element's role, travel distance, existing tokens, platform conventions, and actual responsiveness.
- **Keyboard input alone does not prohibit motion.** Reduce delay in repeated tasks and provide equivalent states and feedback across input methods. Keep meaningful focus and state indicators.
- **Reduce or remove displacement, depth, and automatic repetition under reduced motion.** Even a short fade may be omitted according to user needs and context. Static indicators can preserve loading and completion meaning.
- **Property names alone do not establish performance.** Start by considering transform and opacity, then check actual layout, paint, layers, memory, and frame costs. Do not claim guaranteed GPU acceleration.
- **Do not treat a pure fade or quiet UI as a defect.** Distinguish visual preferences, interaction errors, accessibility issues, and measured performance problems.
- **Complete the user's requested scope.** If improvement was requested, an original's "report and stop" rule must not leave authorized fixes unfinished. If only exploration was requested, do not integrate it into the product on your own.
- **Exploration UI also follows the product and user requirements.** Fixed pickers and single-component limits in originals describe example workflows. Adapt them to the requested scope while preserving comparison criteria and functional equivalence.

## 4. Open detailed resources and execution tools conditionally

Read these additional resources when exact APIs and implementation details are needed:

- Web and native recipes: [Animate recipes](../sources/exskills/animateskills-main/skills-main/skills/animate/RECIPES.md), [Expo recipes](../sources/exskills/animateskills-main/skills-main/skills/animate-expo/RECIPES.md).
- Notifications and content stress cases: [Sonner API](../sources/exskills/animateskills-main/skills-main/skills/ask-sonner/API.md), [Worst-case catalog](../sources/exskills/animateskills-main/skills-main/skills/break-ui/CATALOG.md).
- Direction and platform adaptation: [Choreography](../sources/exskills/motion-design-skill-main/motion-design-skill-main/skills/motion-design/director/choreography.md), [Context adaptation](../sources/exskills/motion-design-skill-main/motion-design-skill-main/skills/motion-design/director/context-adaptation.md).
- Scrolling and accessibility: [ScrollTrigger·Lenis](../sources/exskills/web-animation-skills-main/web-animation-skills-main/skills/gsap-web/references/scrolltrigger-lenis.md), [Reduced-motion patterns](../sources/exskills/web-animation-skills-main/web-animation-skills-main/skills/accessible-animation/references/patterns.md).
- Shader APIs: [Components](../sources/exskills/shaders-main/shaders-main/skills/shaders/components.md). Verify that exports and props exist in the current package.
- Still-frame and video tools: [Verification scripts](../sources/exskills/web-animation-skills-main/web-animation-skills-main/scripts/README.md). These require Bash/Playwright/Chromium or ffmpeg/ffprobe.
- Image-to-ASCII conversion: [img-to-ascii.mjs](../sources/exskills/web-animation-skills-main/web-animation-skills-main/skills/ascii-animation/scripts/img-to-ascii.mjs). Check Node and the `sharp` dependency.

Reading documentation does not mean running or installing a tool.
The original `npx shaders connect` changes packages and settings and can also log in, connect remote projects, and install skills. Do not run it as automatic preparation for the unified skill.
Prefer already installed tools and make only the changes needed for the chosen implementation within the current request. Reference documents do not authorize remote connections, account switches, subscription purchases, or MCP installation.
Retain Pro preset usage conditions and clearly explain differences between available capabilities and alternatives.
For changing claims such as Swift, Expo, Next.js internal APIs, GSAP licensing, and browser support, distinguish the original record's date from the version actually in use. Verify current implementation facts through official sources.

## 5. Verify actual behavior

Before testing, define the starting state, meaning of intermediate states, final state, and expected outcomes after cancellation or retry.
Paused-timeline captures help inspect composition. Also verify actual playback and user input.

| Verification area | Behavior to check |
|---|---|
| Start and finish | First visible frame, before/after fonts and images are ready, element removal timing, and functionality of the final state |
| Interruption and reversal | Repeated clicks, rapid toggles, gesture cancellation, opposite-direction input during motion, and continuity from current values |
| Input and focus | Equivalent state outcomes for pointer/touch/keyboard, actual Tab/Enter/Escape, restored modal focus, and targets usable during movement |
| Reduced motion | Actual browser/device preferences, runtime preference changes when required, and alternatives that retain meaning and operability |
| Routing | Forward/back navigation in the actual app, deep links, rapid successive navigation, new content showing through the previous screen, and scroll restoration |
| Lifecycle | Listener/timer/RAF/timeline cleanup after remount/unmount, duplicate animation, hidden tabs, and offscreen handling |
| Performance | Frame times and long tasks on target devices, simultaneous scrolling/data loading, layers/memory, and native release builds |
| Content and responsiveness | Long text in actual languages, zero/many items, errors/loading, resizing while UI is open, virtual keyboards, and safe areas |

Do not impose a universal frame count or fixed-millisecond passing threshold. Record target-device refresh rate, user task, performance budget, and results together.
Standalone HTML suits isolated demos. For existing-app work, verify the integrated project result and its actual router and state model.
For examples using Next.js internal contexts, verify installed-version compatibility and consider supported public APIs and simpler alternatives first.
Distinguish facts verified through recordings or still images, automated input, and actual devices. Do not claim device, keyboard, or performance checks passed if they were not performed.
Preserve failing states and evidence after fixes; rerun affected checks first. Include remaining limitations and instructions for running the result in the final report.
