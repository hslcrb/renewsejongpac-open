"use strict";

(self["webpackChunk_N_E"] = self["webpackChunk_N_E"] || []).push([ [ 378 ], {
    /***/ 9378: 
    /***/ function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ Z: function() {
                /* binding */ return FloatingMenu;
            }
            /* harmony export */        });
        /* harmony import */        var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7437);
        /* harmony import */        var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(2265);
        /* harmony import */        var _Icon__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(9140);
        /* harmony import */        var _FloatingPanel__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(3936);
        /* harmony import */        var _SystemNavigation__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(7291);
        /* harmony import */        var _src_data_catalog__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(9366);
        /* harmony import */        var _src_lib_floating_panel__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(8159);
        /* __next_internal_client_entry_do_not_use__ default auto */        const subscribeViewport = listener => {
            const query = matchMedia(_src_lib_floating_panel__WEBPACK_IMPORTED_MODULE_6__ /* .PANEL_DRAWER_QUERY */ .LW);
            query.addEventListener("change", listener);
            return () => query.removeEventListener("change", listener);
        };
        const isDrawer = () => matchMedia(_src_lib_floating_panel__WEBPACK_IMPORTED_MODULE_6__ /* .PANEL_DRAWER_QUERY */ .LW).matches;
        const serverPresentation = () => false
        // [흰 덮개 없는 떠 있는 탐색 / Floating navigation without a page-covering backdrop]
        // 정적 범주·상세 문서는 각 문서 주소로 엽니다. / Document links preserve exported category and detail routes.
        ;
        function FloatingMenu(param) {
            let {open: open, onClose: onClose, returnFocus: returnFocus, position: position} = param;
            const drawer = (0, react__WEBPACK_IMPORTED_MODULE_1__.useSyncExternalStore)(subscribeViewport, isDrawer, serverPresentation);
             
            return (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* ["default"] */)(_FloatingPanel__WEBPACK_IMPORTED_MODULE_3__.Z, {
                open: open,
                variant: drawer ? "drawer" : "floating",
                onClose: onClose,
                anchorRef: returnFocus,
                position: position,
                id: "menu-dialog",
                className: "glass-menu",
                title: "전체 메뉴",
                eyebrow: "세종문화회관",
                closeLabel: "전체 메뉴 닫기",
                moveLabel: "메뉴 위치 이동",
                children:   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                    className: "glass-menu-content",
                    "data-component-id": "floating-menu",
                    "data-component-owner": "floating-panel",
                    children: [ 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                        className: "glass-menu-journeys",
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("a", {
                            "data-text": "action",
                            href: "/v5/visit/plan/",
                            children: [ 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", {
                                "data-text": "body",
                                children: "관람할 날부터 이동 안내까지"
                            }), 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("strong", {
                                "data-text": "item-title",
                                children: [ "방문 계획 ", 
                                
                                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* ["default"] */)(_Icon__WEBPACK_IMPORTED_MODULE_2__.Z, {
                                    name: "arrow",
                                    size: 28
                                }) ]
                            }) ]
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("a", {
                            "data-text": "action",
                            href: "/v5/rental/compare/",
                            children: [ 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", {
                                "data-text": "body",
                                children: "공간 조건을 한눈에 비교"
                            }), 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("strong", {
                                "data-text": "item-title",
                                children: [ "대관 공간 비교 ", 
                                
                                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* ["default"] */)(_Icon__WEBPACK_IMPORTED_MODULE_2__.Z, {
                                    name: "arrow",
                                    size: 28
                                }) ]
                            }) ]
                        }) ]
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("nav", {
                        "data-text": "body",
                        className: "glass-menu-columns",
                        "aria-label": "전체 메뉴",
                        children: _src_data_catalog__WEBPACK_IMPORTED_MODULE_5__ /* .NAV */ .w$.map((group => drawer ?   (0, 
                        react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .SystemDisclosure */)(_SystemNavigation__WEBPACK_IMPORTED_MODULE_4__.f, {
                            appearance: "plain",
                            className: "glass-menu-group",
                            summary:   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.Fragment, {
                                children: [ group.title, " ", 
                                
                                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* ["default"] */)(_Icon__WEBPACK_IMPORTED_MODULE_2__.Z, {
                                    name: "chevron",
                                    size: 24
                                }) ]
                            }),
                            children:   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                "data-text": "body",
                                className: "glass-menu-group-links",
                                children: [ 
                                
                                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("a", {
                                    "data-text": "action",
                                    className: "glass-menu-overview",
                                    href: "/v5".concat(group.path, "/"),
                                    children: [ group.title, " 전체" ]
                                }), group.items.map((param => {
                                    let [label, path] = param;
                                     
                                    return (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("a", {
                                        "data-text": "action",
                                        href: "/v5".concat(path, "/"),
                                        children: label
                                    }, path);
                                })) ]
                            })
                        }, group.id) :   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                            "data-text": "body",
                            children: [ 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("a", {
                                "data-text": "action",
                                className: "glass-menu-title",
                                href: "/v5".concat(group.path, "/"),
                                children: group.title
                            }), group.items.map((param => {
                                let [label, path] = param;
                                 
                                return (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("a", {
                                    "data-text": "action",
                                    href: "/v5".concat(path, "/"),
                                    children: label
                                }, path);
                            })) ]
                        }, group.id)))
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("nav", {
                        className: "glass-menu-utilities",
                        "aria-label": "개인 서비스",
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("a", {
                            "data-text": "action",
                            href: "/v5/account/",
                            children: "마이페이지"
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("a", {
                            "data-text": "action",
                            href: "/v5/account/",
                            children: "예매내역"
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("a", {
                            "data-text": "action",
                            href: "/v5/account/",
                            children: "관심 프로그램"
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("a", {
                            "data-text": "action",
                            href: "/v5/sitemap/",
                            children: "사이트맵"
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("a", {
                            "data-text": "action",
                            href: "/v5/english/",
                            lang: "en",
                            children: "English guide"
                        }) ]
                    }) ]
                })
            });
        }
        /***/    },
    /***/ 3936: 
    /***/ function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        // EXPORTS
        __webpack_require__.d(__webpack_exports__, {
            Z: function() {
                /* binding */ return FloatingPanel;
            }
        });
        // EXTERNAL MODULE: ./node_modules/next/dist/compiled/react/jsx-runtime.js
                var jsx_runtime = __webpack_require__(7437);
        // EXTERNAL MODULE: ./components/SystemPrimitives.tsx
                var SystemPrimitives = __webpack_require__(6983);
        // EXTERNAL MODULE: ./node_modules/next/dist/compiled/react/index.js
                var react = __webpack_require__(2265);
        // EXTERNAL MODULE: ./node_modules/next/dist/compiled/react-dom/index.js
                var react_dom = __webpack_require__(4887);
        // EXTERNAL MODULE: ./components/LiquidGlass.tsx + 1 modules
                var LiquidGlass = __webpack_require__(8948);
        // EXTERNAL MODULE: ./components/Icon.tsx
                var Icon = __webpack_require__(9140);
        // EXTERNAL MODULE: ./src/lib/floating-panel.ts
                var floating_panel = __webpack_require__(8159);
        // CONCATENATED MODULE: ./components/useFloatingPanel.ts
        /* __next_internal_client_entry_do_not_use__ default auto */
        // [마우스·터치·키보드의 같은 위치 / Shared pointer, touch and keyboard positioning]
        function useFloatingPanel(panelRef, savedPosition, onClose) {
            let docked = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : false;
            const [moveMode, setMoveMode] = (0, react.useState)(false);
            const [announcement, setAnnouncement] = (0, react.useState)("");
            const moving = (0, react.useRef)(false);
            moving.current = moveMode;
            (0, react.useLayoutEffect)((() => {
                var _window_visualViewport;
                const panel = panelRef.current;
                if (!panel) return;
                let frame;
                let point;
                let pending = 0;
                let suppressClick = false;
                let clickReset = 0;
                let gesture = null;
                const paint = () => {
                    pending = 0;
                    panel.style.transform = "translate3d(".concat(point.x, "px, ").concat(point.y, "px, 0)");
                };
                const move = target => {
                    point = (0, floating_panel /* constrainPanel */ .v9)(target, frame);
                    // 화면 크기 보정은 사용자가 옮긴 원래 위치를 덮어쓰지 않습니다.
                    // Only an intentional move replaces the saved desktop position.
                                        if (!docked) savedPosition.current = point;
                    if (!pending) pending = requestAnimationFrame(paint);
                };
                const measure = () => {
                    if (pending) cancelAnimationFrame(pending);
                    frame = {
                        width: document.documentElement.clientWidth,
                        height: window.innerHeight,
                        panelWidth: panel.offsetWidth,
                        panelHeight: panel.offsetHeight,
                        inset: 12
                    };
                    point = docked ? {
                        x: 0,
                        y: 0
                    } : (0, floating_panel /* constrainPanel */ .v9)(savedPosition.current || (0, floating_panel /* initialPanelPosition */ .qo)(frame), frame);
                    paint();
                    panel.dataset.ready = "true";
                };
                const finish = () => {
                    if (!gesture) return;
                    const {id: id, dragging: dragging} = gesture;
                    gesture = null;
                    if (panel.hasPointerCapture(id)) panel.releasePointerCapture(id);
                    delete panel.dataset.dragging;
                    if (pending) {
                        cancelAnimationFrame(pending);
                        paint();
                    }
                    if (dragging) {
                        suppressClick = true;
                        clearTimeout(clickReset);
                        clickReset = window.setTimeout((() => {
                            suppressClick = false;
                        }), 0);
                        setAnnouncement("메뉴 위치를 옮겼습니다.");
                    }
                };
                const down = event => {
                    if (docked || panel.dataset.phase !== "open") return;
                    const target = event.target;
                    if (!event.isPrimary || event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey) return;
                    if (target.closest("button,input,textarea,select,[contenteditable=true]")) return;
                    // 터치 본문은 스크롤, 제목과 이동 모드는 자유 이동입니다.
                    // Touch content scrolls; the heading and move mode allow free dragging.
                                        if (event.pointerType === "touch" && !moving.current && !target.closest(".floating-panel-header")) return;
                    measure();
                    gesture = {
                        id: event.pointerId,
                        x: event.clientX,
                        y: event.clientY,
                        origin: point,
                        dragging: false
                    };
                };
                const track = event => {
                    if (!gesture || event.pointerId !== gesture.id) return;
                    const dx = event.clientX - gesture.x;
                    const dy = event.clientY - gesture.y;
                    if (!gesture.dragging && Math.hypot(dx, dy) < 6) return;
                    if (!gesture.dragging) {
                        gesture.dragging = true;
                        panel.setPointerCapture(event.pointerId);
                        panel.dataset.dragging = "true";
                        setAnnouncement("");
                    }
                    if (event.cancelable) event.preventDefault();
                    move({
                        x: gesture.origin.x + dx,
                        y: gesture.origin.y + dy
                    });
                };
                const up = event => {
                    if ((gesture === null || gesture === void 0 ? void 0 : gesture.id) === event.pointerId) finish();
                };
                const preventDraggedClick = event => {
                    if (suppressClick) {
                        suppressClick = false;
                        event.preventDefault();
                        event.stopPropagation();
                    }
                };
                const preventNativeDrag = event => event.preventDefault();
                const keyboard = event => {
                    if (event.key === "Escape") {
                        event.preventDefault();
                        onClose();
                        return;
                    }
                    const target = event.target;
                    if (docked) return;
                    if (!target.closest("[data-panel-move]")) return;
                    const step = event.shiftKey ? 4 : 16;
                    const directions = {
                        ArrowLeft: {
                            x: -step,
                            y: 0
                        },
                        ArrowRight: {
                            x: step,
                            y: 0
                        },
                        ArrowUp: {
                            x: 0,
                            y: -step
                        },
                        ArrowDown: {
                            x: 0,
                            y: step
                        }
                    };
                    if (event.key === "Home") {
                        event.preventDefault();
                        move((0, floating_panel /* initialPanelPosition */ .qo)(frame));
                    } else if (directions[event.key]) {
                        event.preventDefault();
                        const delta = directions[event.key];
                        move({
                            x: point.x + delta.x,
                            y: point.y + delta.y
                        });
                    } else return;
                    setAnnouncement("메뉴 위치를 옮겼습니다.");
                };
                measure();
                const observer = new ResizeObserver(measure);
                observer.observe(panel);
                panel.addEventListener("pointerdown", down);
                panel.addEventListener("click", preventDraggedClick, true);
                panel.addEventListener("dragstart", preventNativeDrag);
                window.addEventListener("pointermove", track, {
                    passive: false
                });
                window.addEventListener("pointerup", up);
                window.addEventListener("pointercancel", up);
                window.addEventListener("blur", finish);
                window.addEventListener("keydown", keyboard);
                window.addEventListener("resize", measure);
                (_window_visualViewport = window.visualViewport) === null || _window_visualViewport === void 0 ? void 0 : _window_visualViewport.addEventListener("resize", measure);
                return () => {
                    var _window_visualViewport;
                    finish();
                    clearTimeout(clickReset);
                    if (pending) cancelAnimationFrame(pending);
                    observer.disconnect();
                    panel.removeEventListener("pointerdown", down);
                    panel.removeEventListener("click", preventDraggedClick, true);
                    panel.removeEventListener("dragstart", preventNativeDrag);
                    window.removeEventListener("pointermove", track);
                    window.removeEventListener("pointerup", up);
                    window.removeEventListener("pointercancel", up);
                    window.removeEventListener("blur", finish);
                    window.removeEventListener("keydown", keyboard);
                    window.removeEventListener("resize", measure);
                    (_window_visualViewport = window.visualViewport) === null || _window_visualViewport === void 0 ? void 0 : _window_visualViewport.removeEventListener("resize", measure);
                };
            }), [ panelRef, savedPosition, onClose, docked ]);
            return {
                moveMode: moveMode,
                setMoveMode: setMoveMode,
                announcement: announcement
            };
        }
        // CONCATENATED MODULE: ./src/lib/panel-motion.ts
        // [중간에 뒤집어도 이어지는 탄성 / A reversible spring that retains its momentum]
        function stepPanelSpring(spring, target, elapsed) {
            const steps = Math.max(1, Math.ceil(Math.min(elapsed, .04) * 240));
            const dt = Math.min(elapsed, .04) / steps;
            for (let i = 0; i < steps; i++) {
                const acceleration = (target - spring.position) * 280 - spring.velocity * 23;
                spring.velocity += acceleration * dt;
                spring.position += spring.velocity * dt;
            }
        }
        // [버튼 가까운 쪽부터 풀리는 메시 / A mesh that unfurls from the trigger side]
                function samplePanelVertex(u, v, progress, velocity, origin, target) {
            let result = arguments.length > 6 && arguments[6] !== void 0 ? arguments[6] : {
                x: 0,
                y: 0
            }, presentation = arguments.length > 7 && arguments[7] !== void 0 ? arguments[7] : "floating";
            const startX = origin.x + u * origin.width;
            const startY = origin.y + v * origin.height;
            const endX = target.x + u * target.width;
            const endY = target.y + v * target.height;
            if (presentation === "drawer") {
                // 왼쪽은 벽 뒤에 유지하고 앞쪽 가장자리만 부드럽게 휩니다.
                // Keep the left edge behind the wall while the leading edge flexes.
                const envelope = Math.sin(Math.PI * Math.max(0, Math.min(progress, 1)));
                const p = progress - (1 - u) * .07 * envelope;
                result.x = progress > 1 ? target.x + u * target.width * progress : startX + (endX - startX) * p;
                result.y = endY + Math.sin(v * Math.PI) * Math.sin(u * Math.PI / 2) * envelope * Math.min(8, Math.abs(velocity) * 1.5);
                return result;
            }
            const centerX = origin.x + origin.width / 2;
            const centerY = origin.y + origin.height / 2;
            const diagonal = Math.max(1, Math.hypot(target.width, target.height));
            const distance = Math.min(1, Math.hypot(endX - centerX, endY - centerY) / diagonal);
            const lag = distance * .17;
            const p = progress - lag * Math.sin(Math.PI * Math.max(0, Math.min(progress, 1)));
            const envelope = Math.sin(Math.PI * Math.max(0, Math.min(progress, 1)));
            const ripple = Math.sin(u * Math.PI * 2 + v * Math.PI - progress * Math.PI * 2) * envelope * Math.min(12, Math.abs(velocity) * 1.8);
            const directionX = target.x + target.width / 2 - centerX;
            const directionY = target.y + target.height / 2 - centerY;
            const length = Math.max(1, Math.hypot(directionX, directionY));
            result.x = startX + (endX - startX) * p - directionY / length * ripple;
            result.y = startY + (endY - startY) * p + directionX / length * ripple;
            return result;
        }
        // EXTERNAL MODULE: ./src/lib/panel-snapshot.ts
                var panel_snapshot = __webpack_require__(7880);
        // CONCATENATED MODULE: ./src/lib/panel-transition.ts
        const vertexSource = "\nprecision highp float;\nattribute vec2 a_position;\nattribute vec2 a_uv;\nuniform vec2 u_viewport;\nvarying vec2 v_uv;\nvarying vec2 v_screen;\nvoid main() {\n    gl_Position = vec4(a_position.x / u_viewport.x * 2.0 - 1.0,\n        1.0 - a_position.y / u_viewport.y * 2.0, 0.0, 1.0);\n    v_uv = a_uv;\n    v_screen = a_position / u_viewport;\n}";
        const fragmentSource = "\nprecision highp float;\nvarying vec2 v_uv;\nvarying vec2 v_screen;\nuniform sampler2D u_content;\nuniform sampler2D u_backdrop;\nuniform vec2 u_viewport;\nuniform vec2 u_size;\nuniform float u_radius;\nuniform float u_fade;\nuniform float u_opacity;\nuniform float u_texture;\nuniform float u_refraction;\nuniform float u_blur;\nuniform float u_thickness;\nuniform float u_drawer;\nvoid main() {\n    float radius = u_drawer > 0.5 && v_uv.x < 0.5 ? 0.0 : u_radius;\n    vec2 q = abs((v_uv - 0.5) * u_size) - (u_size * 0.5 - radius);\n    float distance = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;\n    float mask = 1.0 - smoothstep(-0.8, 0.8, distance);\n    float rim = 1.0 - smoothstep(0.0, u_thickness * 0.5, max(0.0, -distance));\n    float highlight = 0.5 + 0.5 * sin(v_uv.x * 3.8 + v_uv.y * 2.4);\n    vec2 normal = normalize((v_uv - 0.5) * u_size + vec2(0.0001));\n    vec2 uv = v_screen - normal * rim * u_refraction * 0.3125 / u_viewport;\n    vec2 blur = vec2(u_blur * 0.78) / u_viewport;\n    vec3 backdrop = texture2D(u_backdrop, uv).rgb * 0.2;\n    backdrop += texture2D(u_backdrop, uv + vec2(blur.x, 0.0)).rgb * 0.1;\n    backdrop += texture2D(u_backdrop, uv - vec2(blur.x, 0.0)).rgb * 0.1;\n    backdrop += texture2D(u_backdrop, uv + vec2(0.0, blur.y)).rgb * 0.1;\n    backdrop += texture2D(u_backdrop, uv - vec2(0.0, blur.y)).rgb * 0.1;\n    backdrop += texture2D(u_backdrop, uv + blur).rgb * 0.1;\n    backdrop += texture2D(u_backdrop, uv - blur).rgb * 0.1;\n    backdrop += texture2D(u_backdrop, uv + vec2(blur.x, -blur.y)).rgb * 0.1;\n    backdrop += texture2D(u_backdrop, uv + vec2(-blur.x, blur.y)).rgb * 0.1;\n    vec3 glass = mix(backdrop, vec3(0.97 + 0.03 * highlight), min(0.97, u_opacity + rim * 0.13));\n    float glassAlpha = 1.0;\n    vec4 ink = texture2D(u_content, clamp(v_uv, 0.0, 1.0));\n    ink.a *= u_texture;\n    float alpha = ink.a + glassAlpha * (1.0 - ink.a);\n    vec3 rgb = ink.rgb * ink.a + glass * glassAlpha * (1.0 - ink.a);\n    float shadow = exp(-max(distance, 0.0) / 10.0) * (1.0 - mask) * 0.15;\n    gl_FragColor = vec4(rgb * mask, alpha * mask + shadow) * u_fade;\n}";
        function rect(element) {
            const box = element.getBoundingClientRect();
            return {
                x: box.x,
                y: box.y,
                width: box.width,
                height: box.height
            };
        }
        function originFor(options) {
            if (options.panel.dataset.presentation === "drawer") {
                const target = rect(options.panel);
                return {
                    ...target,
                    x: target.x - target.width
                };
            }
            const anchor = options.anchor();
            return anchor && anchor.offsetWidth ? rect(anchor) : {
                x: innerWidth - 72,
                y: 28,
                width: 48,
                height: 48
            };
        }
        function phase(options, value) {
            options.panel.dataset.phase = value;
            options.canvas.dataset.phase = value;
            options.panel.inert = value !== "open";
            options.onPhase(value);
        }
        // [모션 감소와 GPU 미지원의 같은 수명 주기 / Equivalent lifecycle without GPU motion]
                function nativeTransition(options, reduced) {
            const {panel: panel, canvas: canvas} = options;
            canvas.dataset.renderer = reduced ? "reduced-motion" : "dom";
            canvas.style.visibility = "hidden";
            let animation = null;
            let target = false;
            let settled = false;
            let disposed = false;
            const duration = reduced ? 120 : 460;
            return {
                setOpen(open) {
                    if (disposed) return;
                    target = open;
                    phase(options, open ? "opening" : "closing");
                    if (!animation || settled) {
                        const destination = rect(panel);
                        const origin = originFor(options);
                        canvas.dataset.origin = JSON.stringify(origin);
                        canvas.dataset.destination = JSON.stringify(destination);
                        const end = "translate3d(".concat(destination.x, "px, ").concat(destination.y, "px, 0)");
                        const start = reduced ? end : "translate3d(".concat(origin.x, "px, ").concat(origin.y, "px, 0) scale(").concat(origin.width / destination.width, ", ").concat(origin.height / destination.height, ")");
                        panel.style.transformOrigin = "0 0";
                        const radius = panel.dataset.presentation === "drawer" ? "0 24px 24px 0" : "24px";
                        animation = panel.animate([ {
                            transform: start,
                            opacity: 0,
                            borderRadius: radius
                        }, {
                            transform: end,
                            opacity: 1,
                            borderRadius: radius
                        } ], {
                            duration: duration,
                            easing: "cubic-bezier(.2,.88,.2,1)",
                            fill: "both"
                        });
                        animation.pause();
                        animation.currentTime = open ? 0 : duration;
                        animation.onfinish = () => {
                            if (disposed) return;
                            settled = true;
                            if (target) {
                                phase(options, "open");
                                animation === null || animation === void 0 ? void 0 : animation.cancel();
                            } else options.onClosed();
                        };
                    }
                    settled = false;
                    animation.playbackRate = open ? 1 : -1;
                    animation.play();
                },
                dispose() {
                    disposed = true;
                    animation === null || animation === void 0 ? void 0 : animation.cancel();
                    panel.style.transformOrigin = "";
                }
            };
        }
        // [실제 텍스처를 휘는 WebGL 메시 / WebGL mesh deformation of the actual panel texture]
                function createPanelTransition(options) {
            const {panel: panel, canvas: canvas} = options;
            const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
            if (motionPreference.matches) return nativeTransition(options, true);
            const gl = canvas.getContext("webgl", {
                alpha: true,
                antialias: true,
                premultipliedAlpha: true,
                powerPreference: "high-performance",
                preserveDrawingBuffer: false
            });
            if (!gl) return nativeTransition(options, false);
            const shaders = [];
            const compile = (type, source) => {
                const shader = gl.createShader(type);
                gl.shaderSource(shader, source);
                gl.compileShader(shader);
                if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                    gl.deleteShader(shader);
                    throw new Error("Panel shader compilation failed");
                }
                shaders.push(shader);
                return shader;
            };
            const program = gl.createProgram();
            try {
                gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
                gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
                gl.linkProgram(program);
                if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error("Panel shader link failed");
            } catch (error) {
                var _gl_getExtension;
                canvas.dataset.shaderError = String(error);
                shaders.forEach((shader => gl.deleteShader(shader)));
                gl.deleteProgram(program);
                (_gl_getExtension = gl.getExtension("WEBGL_lose_context")) === null || _gl_getExtension === void 0 ? void 0 : _gl_getExtension.loseContext();
                return nativeTransition(options, false);
            }
            const columns = 32, rows = 22;
            const vertexCount = (columns + 1) * (rows + 1);
            const vertices = new Float32Array(vertexCount * 4);
            const indices = new Uint16Array(columns * rows * 6);
            let index = 0;
            for (let y = 0; y <= rows; y++) for (let x = 0; x <= columns; x++) {
                const offset = (y * (columns + 1) + x) * 4;
                vertices[offset + 2] = x / columns * 1.1 - .05;
                vertices[offset + 3] = y / rows * 1.1 - .05;
                if (x < columns && y < rows) {
                    const a = y * (columns + 1) + x, b = a + columns + 1;
                    indices.set([ a, a + 1, b, a + 1, b + 1, b ], index);
                    index += 6;
                }
            }
            const vertexBuffer = gl.createBuffer();
            const indexBuffer = gl.createBuffer();
            const texture = gl.createTexture();
            const backdropTexture = gl.createTexture();
            gl.useProgram(program);
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, vertices.byteLength, gl.DYNAMIC_DRAW);
            const positionLocation = gl.getAttribLocation(program, "a_position");
            const uvLocation = gl.getAttribLocation(program, "a_uv");
            gl.enableVertexAttribArray(positionLocation);
            gl.enableVertexAttribArray(uvLocation);
            gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 16, 0);
            gl.vertexAttribPointer(uvLocation, 2, gl.FLOAT, false, 16, 8);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, backdropTexture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([ 255, 255, 255, 255 ]));
            gl.activeTexture(gl.TEXTURE0);
            const uniforms = Object.fromEntries([ "viewport", "size", "radius", "fade", "opacity", "texture", "content", "backdrop", "refraction", "blur", "thickness", "drawer" ].map((name => [ name, gl.getUniformLocation(program, "u_" + name) ])));
            gl.uniform1i(uniforms.content, 0);
            gl.uniform1i(uniforms.backdrop, 1);
            canvas.dataset.renderer = "webgl";
            canvas.dataset.texture = "pending";
            let disposed = false, target = 0, frame = 0, lastTime = 0, started = 0;
            let textureReadyAt = 0, capturePending = false, capturedContent = "", captureTimer = 0;
            let destination = rect(panel), origin = originFor(options);
            let materialOpacity = .82, materialRadius = 24, materialRefraction = 64, materialBlur = 18, materialThickness = 32;
            const presentation = panel.dataset.presentation === "drawer" ? "drawer" : "floating";
            let fallback = null;
            const spring = {
                position: 0,
                velocity: 0
            };
            const point = {
                x: 0,
                y: 0
            };
            const resize = () => {
                const ratio = Math.min(devicePixelRatio || 1, 2);
                canvas.width = Math.round(innerWidth * ratio);
                canvas.height = Math.round(innerHeight * ratio);
                gl.viewport(0, 0, canvas.width, canvas.height);
                destination = rect(panel);
                origin = originFor(options);
            };
            const contentKey = () => {
                const scrolling = [ ...panel.querySelectorAll("*") ].map(((element, index) => element.scrollTop || element.scrollLeft ? "".concat(index, ":").concat(element.scrollTop, ",").concat(element.scrollLeft) : "")).filter(Boolean).join(";");
                const disclosures = [ ...panel.querySelectorAll("details") ].map((element => Number(element.open))).join("");
                return "".concat(panel.offsetWidth, "x").concat(panel.offsetHeight, "|").concat(scrolling, "|").concat(disclosures, "|").concat(panel.textContent);
            };
            const capture = async () => {
                const content = contentKey();
                if (disposed || capturePending || capturedContent === content) return;
                capturePending = true;
                try {
                    const bitmap = await (0, panel_snapshot /* capturePanelTexture */ .eB)(panel);
                    if (disposed) return;
                    gl.bindTexture(gl.TEXTURE_2D, texture);
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bitmap);
                    textureReadyAt || (textureReadyAt = performance.now());
                    capturedContent = content;
                    canvas.dataset.texture = "ready";
                } catch (error) {
                    if (!disposed) {
                        canvas.dataset.texture = "unavailable";
                        canvas.dataset.snapshotError = String(error).slice(0, 160);
                    }
                } finally {
                    capturePending = false;
                }
            };
            const scheduleCapture = () => {
                clearTimeout(captureTimer);
                // 모션 중 DOM 복제와 폰트 삽입을 피합니다. / Keep rasterization out of the animation's frame budget.
                                captureTimer = window.setTimeout((() => {
                    captureTimer = 0;
                    if (!disposed && !frame && target) void capture();
                }), 80);
            };
            const rest = () => {
                spring.position = target;
                spring.velocity = 0;
                frame = 0;
                canvas.style.visibility = "hidden";
                gl.clear(gl.COLOR_BUFFER_BIT);
                if (target) {
                    phase(options, "open");
                    scheduleCapture();
                } else options.onClosed();
            };
            const draw = now => {
                if (disposed || fallback) return;
                // 긴 layout effect 안에서 예약한 RAF의 과거 시각을 보정합니다. / RAF can carry an earlier timestamp.
                                const elapsed = Math.max(0, Math.min((now - lastTime) / 1e3, .04));
                lastTime = now;
                stepPanelSpring(spring, target, elapsed);
                if (Math.abs(spring.position - target) < 8e-4 && Math.abs(spring.velocity) < .014 || now - started > 1600) {
                    rest();
                    return;
                }
                const p = spring.position;
                for (let offset = 0; offset < vertices.length; offset += 4) {
                    samplePanelVertex(vertices[offset + 2], vertices[offset + 3], p, spring.velocity, origin, destination, point, presentation);
                    vertices[offset] = point.x;
                    vertices[offset + 1] = point.y;
                }
                gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
                gl.bufferSubData(gl.ARRAY_BUFFER, 0, vertices);
                gl.useProgram(program);
                gl.uniform2f(uniforms.viewport, innerWidth, innerHeight);
                const sizeProgress = Math.max(0, Math.min(1, p));
                const width = origin.width + (destination.width - origin.width) * sizeProgress;
                const height = origin.height + (destination.height - origin.height) * sizeProgress;
                gl.uniform2f(uniforms.size, width, height);
                gl.uniform1f(uniforms.radius, Math.min(materialRadius, width / 2, height / 2));
                gl.uniform1f(uniforms.fade, Math.max(0, Math.min(1, p / .14)));
                gl.uniform1f(uniforms.opacity, materialOpacity);
                gl.uniform1f(uniforms.refraction, materialRefraction);
                gl.uniform1f(uniforms.blur, materialBlur);
                gl.uniform1f(uniforms.thickness, materialThickness);
                gl.uniform1f(uniforms.drawer, Number(presentation === "drawer"));
                gl.uniform1f(uniforms.texture, textureReadyAt ? Math.min(1, (now - textureReadyAt) / 90) : 0);
                gl.clearColor(0, 0, 0, 0);
                gl.clear(gl.COLOR_BUFFER_BIT);
                canvas.dataset.progress = p.toFixed(4);
                gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
                frame = requestAnimationFrame(draw);
            };
            const onHidden = () => {
                if (document.hidden && frame) {
                    cancelAnimationFrame(frame);
                    rest();
                }
            };
            const onPreference = () => {
                if (motionPreference.matches && frame) {
                    cancelAnimationFrame(frame);
                    rest();
                }
            };
            const onContextLost = event => {
                event.preventDefault();
                cancelAnimationFrame(frame);
                frame = 0;
                fallback = nativeTransition(options, false);
                fallback.setOpen(Boolean(target));
            };
            const observer = new ResizeObserver((() => {
                if (!frame) {
                    destination = rect(panel);
                    if (target) scheduleCapture();
                }
            }));
            observer.observe(panel);
            window.addEventListener("resize", resize);
            document.addEventListener("visibilitychange", onHidden);
            motionPreference.addEventListener("change", onPreference);
            canvas.addEventListener("webglcontextlost", onContextLost);
            resize();
            return {
                setOpen(open) {
                    if (disposed) return;
                    if (!fallback && motionPreference.matches) {
                        cancelAnimationFrame(frame);
                        frame = 0;
                        fallback = nativeTransition(options, true);
                    }
                    if (fallback) {
                        fallback.setOpen(open);
                        return;
                    }
                    if (frame && target === Number(open)) return;
                    clearTimeout(captureTimer);
                    target = Number(open);
                    destination = rect(panel);
                    origin = originFor(options);
                    const style = getComputedStyle(panel);
                    materialOpacity = parseFloat(style.getPropertyValue("--glass-opacity")) || .82;
                    materialRadius = parseFloat(style.borderTopLeftRadius) || 24;
                    materialRefraction = parseFloat(style.getPropertyValue("--glass-refraction")) || 64;
                    materialBlur = parseFloat(style.getPropertyValue("--glass-blur")) || 18;
                    materialThickness = parseFloat(style.getPropertyValue("--glass-thickness")) || 32;
                    canvas.dataset.origin = JSON.stringify(origin);
                    canvas.dataset.destination = JSON.stringify(destination);
                    phase(options, open ? "opening" : "closing");
                    const backdrop = (0, panel_snapshot /* capturePanelBackdrop */ .xm)(panel);
                    gl.activeTexture(gl.TEXTURE1);
                    gl.bindTexture(gl.TEXTURE_2D, backdropTexture);
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, backdrop);
                    gl.activeTexture(gl.TEXTURE0);
                    if (!textureReadyAt || !open && capturedContent !== contentKey()) {
                        gl.bindTexture(gl.TEXTURE_2D, texture);
                        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, (0, panel_snapshot /* capturePanelPreview */ .T7)(panel));
                        textureReadyAt = performance.now() - 90;
                        canvas.dataset.texture = "preview";
                    }
                    canvas.style.visibility = "visible";
                    started = performance.now();
                    if (!frame) {
                        lastTime = started;
                        frame = requestAnimationFrame(draw);
                    }
                },
                dispose() {
                    var _gl_getExtension;
                    disposed = true;
                    clearTimeout(captureTimer);
                    cancelAnimationFrame(frame);
                    observer.disconnect();
                    fallback === null || fallback === void 0 ? void 0 : fallback.dispose();
                    window.removeEventListener("resize", resize);
                    document.removeEventListener("visibilitychange", onHidden);
                    motionPreference.removeEventListener("change", onPreference);
                    canvas.removeEventListener("webglcontextlost", onContextLost);
                    gl.deleteTexture(texture);
                    gl.deleteTexture(backdropTexture);
                    gl.deleteBuffer(vertexBuffer);
                    gl.deleteBuffer(indexBuffer);
                    shaders.forEach((shader => gl.deleteShader(shader)));
                    gl.deleteProgram(program);
                    (_gl_getExtension = gl.getExtension("WEBGL_lose_context")) === null || _gl_getExtension === void 0 ? void 0 : _gl_getExtension.loseContext();
                }
            };
        }
        // CONCATENATED MODULE: ./components/FloatingPanel.tsx
        /* __next_internal_client_entry_do_not_use__ default auto */
        // [퇴장이 끝날 때까지 유지되는 창 / Keep the panel mounted through its complete exit]
        function FloatingPanel(props) {
            const [retained, setRetained] = (0, react.useState)(props.open);
            const onExited = (0, react.useCallback)((() => setRetained(false)), []);
            (0, react.useLayoutEffect)((() => {
                if (props.open) setRetained(true);
            }), [ props.open ]);
            if (!props.open && !retained || typeof document === "undefined") return null;
             
            return (0, jsx_runtime.jsx)(PanelSurface, {
                ...props,
                onExited: onExited
            });
        }
        // [LiquidGlass를 사용하는 이동·모션·탐색의 공통 창 / Shared glass, positioning and motion lifecycle]
                function PanelSurface(param) {
            let {open: open, variant: variant = "floating", onClose: onClose, onExited: onExited, anchorRef: anchorRef, position: position, title: title, eyebrow: eyebrow, closeLabel: closeLabel = "창 닫기", moveLabel: moveLabel = "창 위치 이동", id: id, className: className = "", children: children} = param;
            const panelRef = (0, react.useRef)(null);
            const canvasRef = (0, react.useRef)(null);
            const closeRef = (0, react.useRef)(null);
            const defaultPosition = (0, react.useRef)(null);
            const transitionRef = (0, react.useRef)(null);
            const desiredOpen = (0, react.useRef)(open);
            desiredOpen.current = open;
            const [currentPhase, setPhase] = (0, react.useState)("opening");
            const labelId = "floating-panel-" + (0, react.useId)().replace(/:/g, "");
            const {moveMode: moveMode, setMoveMode: setMoveMode, announcement: announcement} = useFloatingPanel(panelRef, position || defaultPosition, onClose, variant === "drawer");
            (0, react.useLayoutEffect)((() => {
                const panel = panelRef.current;
                const transition = createPanelTransition({
                    panel: panel,
                    canvas: canvasRef.current,
                    anchor: () => anchorRef.current,
                    onPhase: setPhase,
                    onClosed: () => {
                        if (!desiredOpen.current) onExited();
                    }
                });
                transitionRef.current = transition;
                transition.setOpen(desiredOpen.current);
                return () => {
                    transitionRef.current = null;
                    transition.dispose();
                };
            }), [ anchorRef, onExited, variant ]);
            (0, react.useLayoutEffect)((() => {
                var _transitionRef_current;
                (_transitionRef_current = transitionRef.current) === null || _transitionRef_current === void 0 ? void 0 : _transitionRef_current.setOpen(open);
            }), [ open ]);
            (0, react.useEffect)((() => {
                if (currentPhase === "open" && (document.activeElement === anchorRef.current || document.activeElement === document.body)) {
                    var _closeRef_current;
                    (_closeRef_current = closeRef.current) === null || _closeRef_current === void 0 ? void 0 : _closeRef_current.focus({
                        preventScroll: true
                    });
                }
            }), [ currentPhase, anchorRef ]);
            (0, react.useEffect)((() => {
                const panel = panelRef.current;
                const anchor = anchorRef.current;
                return () => {
                    if ((anchor === null || anchor === void 0 ? void 0 : anchor.isConnected) && (document.activeElement === document.body || (panel === null || panel === void 0 ? void 0 : panel.contains(document.activeElement)))) {
                        anchor.focus({
                            preventScroll: true
                        });
                    }
                };
            }), [ anchorRef ]);
             
            return (0, react_dom.createPortal)(  (0, jsx_runtime.jsxs)(jsx_runtime.Fragment, {
                children: [ 
                
                 (0, jsx_runtime.jsxs /* default */)(LiquidGlass.Z, {
                    ref: panelRef,
                    "data-component-id": "floating-panel",
                    "data-component-part": "glass-surface",
                    "data-component-owner": "floating-panel",
                    id: id,
                    className: "floating-panel ".concat(className).trim(),
                    variant: variant === "drawer" ? "drawer" : "surface",
                    "data-presentation": variant,
                    role: "dialog",
                    "aria-modal": "false",
                    "aria-labelledby": "".concat(labelId, "-heading"),
                    "aria-hidden": currentPhase !== "open" || undefined,
                    "data-phase": currentPhase,
                    "data-move-mode": variant === "floating" && moveMode || undefined,
                    children: [ 
                    
                     (0, jsx_runtime.jsxs)("div", {
                        className: "glass-menu-header floating-panel-header",
                        children: [ 
                        
                         (0, jsx_runtime.jsxs)("div", {
                            "data-text": "body",
                            children: [ eyebrow &&   (0, jsx_runtime.jsx)("p", {
                                "data-text": "body",
                                className: "glass-menu-brand",
                                children: eyebrow
                            }), 
                            
                             (0, jsx_runtime.jsx)("h2", {
                                "data-text": "heading",
                                id: "".concat(labelId, "-heading"),
                                children: title
                            }) ]
                        }), 
                        
                         (0, jsx_runtime.jsxs)("div", {
                            "data-text": "body",
                            className: "glass-menu-actions",
                            children: [ variant === "floating" &&   (0, jsx_runtime.jsxs /* SystemButton */)(SystemPrimitives.kR, {
                                "data-text": "action",
                                variant: "quiet",
                                shape: "pill",
                                type: "button",
                                className: "glass-menu-move",
                                "data-panel-move": true,
                                "aria-label": moveLabel,
                                "aria-pressed": moveMode,
                                "aria-describedby": "".concat(labelId, "-move-help"),
                                onClick: () => setMoveMode(!moveMode),
                                children: [ 
                                
                                 (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                                    name: "open_with"
                                }), 
                                
                                 (0, jsx_runtime.jsx)("span", {
                                    "data-text": "body",
                                    children: "이동"
                                }) ]
                            }), 
                            
                             (0, jsx_runtime.jsx /* SystemIconButton */)(SystemPrimitives.MW, {
                                "data-text": "action",
                                ref: closeRef,
                                type: "button",
                                onClick: onClose,
                                "aria-label": closeLabel,
                                children:   (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                                    name: "close",
                                    size: 24
                                })
                            }) ]
                        }) ]
                    }), 
                    
                     (0, jsx_runtime.jsx)("p", {
                        "data-text": "body",
                        id: "".concat(labelId, "-move-help"),
                        className: "sr-only",
                        children: variant === "drawer" ? "왼쪽에 고정된 메뉴입니다. 목록을 스크롤하고 그룹을 펼쳐 탐색할 수 있습니다." : "마우스로 글자나 여백을 잡아 옮길 수 있습니다. 터치에서는 제목을 잡거나 이동 버튼을 켜세요. 이동 버튼에서 방향키로 옮기고 Home 키로 처음 위치로 돌립니다."
                    }), 
                    
                     (0, jsx_runtime.jsx)("span", {
                        "data-text": "body",
                        className: "sr-only",
                        role: "status",
                        "aria-live": "polite",
                        children: announcement
                    }), children ]
                }), 
                
                 (0, jsx_runtime.jsx)("canvas", {
                    ref: canvasRef,
                    className: "floating-panel-webgl",
                    "aria-hidden": "true"
                }) ]
            }), document.body);
        }
        /***/    },
    /***/ 9366: 
    /***/ function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ Lr: function() {
                /* binding */ return PROGRAMS;
            },
            /* harmony export */ q5: function() {
                /* binding */ return PAGES;
            },
            /* harmony export */ w$: function() {
                /* binding */ return NAV;
            }
            /* harmony export */        });
        /* unused harmony exports VENUES, COMPANIES, NOTICES */
        /* harmony import */        var _catalog_snapshot_ts__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(2554);
        const page = function(path, title, group) {
            let description = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : "", type = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : "content";
            return {
                path: path,
                title: title,
                group: group,
                description: description,
                type: type,
                eyebrow: {
                    programs: "PROGRAMS",
                    rental: "VENUE RENTAL",
                    visit: "VISIT SEJONG",
                    news: "NEWS & BENEFITS",
                    about: "ABOUT SEJONG",
                    account: "MY SEJONG"
                }[group] || "SEJONG CENTER"
            };
        };
        const NAV = [ {
            id: "programs",
            title: "프로그램",
            path: "/programs",
            items: [ [ "공연", "/programs/performance" ], [ "전시", "/programs/exhibition" ], [ "교육", "/programs/education" ], [ "기획·시즌 프로그램", "/programs/season" ], [ "백스테이지 투어", "/programs/tour" ], [ "세종·충무공 이야기", "/programs/history" ] ]
        }, {
            id: "rental",
            title: "대관",
            path: "/rental",
            items: [ [ "대관안내", "/rental/guide" ], [ "대관시설", "/rental/venues" ], [ "대관일정", "/rental/schedule" ], [ "대관절차", "/rental/process" ], [ "대관신청", "/rental/apply" ], [ "대관문의", "/rental/contact" ] ]
        }, {
            id: "visit",
            title: "이용안내",
            path: "/visit",
            items: [ [ "공간안내", "/visit/spaces" ], [ "오시는 길·주차", "/visit/directions" ], [ "편의시설", "/visit/amenities" ], [ "장애인 이용안내", "/visit/accessibility" ], [ "관람 유의사항", "/visit/etiquette" ], [ "고객지원", "/visit/support" ] ]
        }, {
            id: "news",
            title: "소식과 혜택",
            path: "/news",
            items: [ [ "공지사항", "/news/notices" ], [ "이벤트", "/news/events" ], [ "뉴스레터·세종문화N", "/news/newsletter" ], [ "멤버십", "/news/membership" ], [ "세종 굿즈", "/news/goods" ] ]
        }, {
            id: "about",
            title: "세종문화회관",
            path: "/about",
            items: [ [ "기관소개", "/about/introduction" ], [ "서울시예술단", "/about/companies" ], [ "ESG 경영", "/about/esg" ], [ "정보공개", "/about/disclosure" ], [ "협력 및 협찬", "/about/partners" ], [ "후원", "/about/donation" ] ]
        } ];
        const PAGES = [ page("/", "홈", "home", "공연·전시·교육 일정, 예매와 이용 안내", "home"), ...NAV.flatMap((n => [ page(n.path, n.title, n.id), ...n.items.map((param => {
            let [t, p] = param;
            return page(p, t, n.id);
        })) ])), ...[ [ "/programs/booking-guide", "예매안내", "programs" ], [ "/programs/education/apply-guide", "교육 신청안내", "programs" ], [ "/programs/season/sejong", "2026 세종시즌", "programs" ], [ "/programs/season/sync-next", "Sync Next", "programs" ], [ "/programs/season/everyone", "모든 누구나", "programs" ], [ "/programs/season/package", "시즌 패키지", "programs" ], [ "/programs/season/classic", "누구나 클래식", "programs" ], [ "/programs/season/orchestra", "누구나 꿈나무오케스트라", "programs" ], [ "/programs/season/summer", "누구나 세종썸머페스티벌", "programs" ], [ "/rental/guide/fees", "대관요금", "rental" ], [ "/rental/guide/eligibility", "대관 대상 및 기준", "rental" ], [ "/rental/process/documents", "신청서류 및 심사기준", "rental" ], [ "/rental/equipment", "무대 기술·장비 안내", "rental" ], [ "/visit/directions/parking", "주차안내", "visit" ], [ "/visit/amenities/dining", "F&B · 다이닝", "visit" ], [ "/visit/amenities/facilities", "편의시설 위치", "visit" ], [ "/visit/support/faq", "자주 묻는 질문", "visit" ], [ "/visit/support/inquiry", "문의하기", "visit" ], [ "/visit/support/lost", "분실물 안내", "visit" ], [ "/visit/group", "단체관람 안내·신청", "visit" ], [ "/news/events/winners", "당첨자 발표", "news" ], [ "/news/notices/recruit/apply", "공연장 안내원 지원서", "news" ], [ "/news/goods/art-postcards", "공연의 한 장면 · 엽서", "news" ], [ "/news/goods/canvas-bag", "캔버스 토트백", "news" ], [ "/news/goods/viewing-journal", "관람 기록 노트", "news" ], [ "/news/goods/cart", "굿즈 장바구니", "news" ], [ "/news/goods/orders", "굿즈 주문내역", "news" ], [ "/news/newsletter/archive", "뉴스레터 아카이브", "news" ], [ "/news/magazine", "세종문화N", "news" ], [ "/news/membership/benefits", "멤버십 혜택", "news" ], [ "/news/membership/join", "멤버십 가입", "news" ], [ "/about/introduction/greeting", "인사말", "about" ], [ "/about/introduction/history", "걸어온 역사", "about" ], [ "/about/introduction/organization", "조직도", "about" ], [ "/about/introduction/ci", "CI 소개", "about" ], [ "/about/esg/environment", "환경경영", "about" ], [ "/about/esg/social", "사회공헌", "about" ], [ "/about/esg/governance", "윤리경영", "about" ], [ "/about/disclosure/management", "경영공시", "about" ], [ "/about/disclosure/request", "정보공개 청구", "about" ], [ "/about/disclosure/ethics", "부패신고·규제혁신센터", "about" ], [ "/about/donation/apply", "후원 참여", "about" ], [ "/about/partners/apply", "협력·협찬 제안", "about" ], [ "/about/arts-center", "꿈의숲 아트센터", "about" ], [ "/account/login", "로그인", "account" ], [ "/account/signup", "회원가입", "account" ], [ "/account/recovery", "아이디·비밀번호 찾기", "account" ], [ "/account", "마이페이지", "account" ], [ "/account/bookings", "예매내역", "account" ], [ "/account/favorites", "관심 프로그램", "account" ], [ "/account/applications", "신청내역", "account" ], [ "/account/profile", "내 정보", "account" ], [ "/search", "통합검색", "utility" ], [ "/sitemap", "사이트맵", "utility" ], [ "/policy/privacy", "개인정보처리방침", "utility" ], [ "/policy/terms", "이용약관", "utility" ], [ "/policy/email", "이메일 무단수집거부", "utility" ], [ "/english", "English visitor guide", "utility" ] ].map((param => {
            let [path, title, group] = param;
            return page(path, title, group);
        })) ];
        // Published content is generated from the database; navigation stays in code.
                const {programs: PROGRAMS, venues: VENUES, companies: COMPANIES, notices: NOTICES} = _catalog_snapshot_ts__WEBPACK_IMPORTED_MODULE_0__.CATALOG_SNAPSHOT;
        for (const p of PROGRAMS) if (!PAGES.some((page => page.path === "/programs/" + p.id))) PAGES.push(page("/programs/" + p.id, p.title, "programs", p.description, "program"));
        for (const v of VENUES) {
            PAGES.push(page("/rental/venues/" + v.id, v.name, "rental", v.description, "venue"));
            PAGES.push(page("/visit/spaces/" + v.id, v.name + " 공간안내", "visit", v.description, "space"));
        }
        for (const c of COMPANIES) PAGES.push(page("/about/companies/" + c.id, c.name, "about", c.description, "company"));
        for (const n of NOTICES) PAGES.push(page("/news/notices/" + n.id, n.title, "news", n.content, "notice"));
        for (const [id, title] of [ [ "autumn-walk", "가을의 취향을 나누다" ], [ "review", "관람 후기 이벤트" ], [ "summer-end", "여름의 기억" ] ]) PAGES.push(page("/news/events/" + id, title, "news", "이벤트 상세 안내입니다.", "event"));
        for (const [path, title, group, description] of [ [ "/news/events/autumn-walk/apply", "가을의 취향을 나누다 · 참여", "news", "관심 있는 공연과 기대평을 남겨 보세요." ], [ "/news/events/review/apply", "관람 후기 이벤트 · 참여", "news", "관람한 작품에 대한 후기를 남겨 주세요." ], [ "/visit/support/lost/umbrella", "분실물 상세 · 우산", "visit", "가상의 습득물 정보와 문의 경로를 확인하세요." ], [ "/visit/support/lost/scarf", "분실물 상세 · 머플러", "visit", "가상의 습득물 정보와 문의 경로를 확인하세요." ], [ "/visit/support/lost/glasses", "분실물 상세 · 안경", "visit", "가상의 습득물 정보와 문의 경로를 확인하세요." ] ]) PAGES.push(page(path, title, group, description));
        PAGES.push({
            path: "/visit/plan",
            title: "방문 계획",
            description: "관람 날짜와 이동 방법, 준비할 안내를 정리합니다.",
            group: "visit",
            eyebrow: "방문 준비",
            type: "content"
        }, {
            path: "/rental/compare",
            title: "대관 공간 비교",
            description: "규모와 무대, 장비를 비교하고 맞는 공간으로 이어가세요.",
            group: "rental",
            eyebrow: "대관 준비",
            type: "content"
        }, {
            path: "/design-rules",
            title: "디자인 시스템",
            description: "컬러·16px 타이포그래피·컴포넌트·모션을 정의한 v5 디자인 가이드",
            group: "rules",
            eyebrow: "디자인 설계",
            type: "content"
        });
        /***/    },
    /***/ 8159: 
    /***/ function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ LW: function() {
                /* binding */ return PANEL_DRAWER_QUERY;
            },
            /* harmony export */ qo: function() {
                /* binding */ return initialPanelPosition;
            },
            /* harmony export */ v9: function() {
                /* binding */ return constrainPanel;
            }
            /* harmony export */        });
        /* harmony import */        var _liquid_glass_ts__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(9174);
        const PANEL_DRAWER_QUERY = "(max-width: 700px)";
        // [화면 안의 자유로운 배치 / Free positioning within the viewport]
                function constrainPanel(point, frame) {
            return {
                x: Math.max(frame.inset, Math.min(point.x, frame.width - frame.panelWidth - frame.inset)),
                y: Math.max(frame.inset, Math.min(point.y, frame.height - frame.panelHeight - frame.inset))
            };
        }
        function initialPanelPosition(frame) {
            return constrainPanel({
                x: (frame.width - frame.panelWidth) / 2,
                y: 108
            }, frame);
        }
        // [기존 굴절 함수의 호환 내보내기 / Compatibility export for the extracted optical helper]
        /***/    },
    /***/ 7880: 
    /***/ function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ T7: function() {
                /* binding */ return capturePanelPreview;
            },
            /* harmony export */ eB: function() {
                /* binding */ return capturePanelTexture;
            },
            /* harmony export */ jD: function() {
                /* binding */ return warmPanelSnapshot;
            },
            /* harmony export */ xm: function() {
                /* binding */ return capturePanelBackdrop;
            }
            /* harmony export */        });
        let snapshotModule = null;
        let fontCss = null;
        // [사용할 때만 불러오는 전환용 텍스처 / Transition textures loaded only when needed]
                function warmPanelSnapshot() {
            return snapshotModule || (snapshotModule = __webpack_require__.e(/* import() */ 732).then(__webpack_require__.bind(__webpack_require__, 3732)));
        }
        // [첫 프레임부터 보이는 실제 글자 / Paint the live text immediately, before asynchronous rasterization]
                function capturePanelPreview(panel) {
            const canvas = document.createElement("canvas");
            const ratio = Math.min(devicePixelRatio || 1, 1.5);
            canvas.width = Math.ceil(panel.offsetWidth * ratio);
            canvas.height = Math.ceil(panel.offsetHeight * ratio);
            const context = canvas.getContext("2d");
            const bounds = panel.getBoundingClientRect();
            context.scale(ratio, ratio);
            const walker = document.createTreeWalker(panel, NodeFilter.SHOW_TEXT);
            const range = document.createRange();
            while (walker.nextNode()) {
                var _node_textContent;
                const node = walker.currentNode;
                const parent = node.parentElement;
                if (!parent || !((_node_textContent = node.textContent) === null || _node_textContent === void 0 ? void 0 : _node_textContent.trim()) || parent.closest(".sr-only, .liquid-glass-optics, .glass-lens-definitions, svg, script, style")) continue;
                const style = getComputedStyle(parent);
                if (style.visibility === "hidden" || style.display === "none") continue;
                context.font = "".concat(style.fontStyle, " ").concat(style.fontWeight, " ").concat(style.fontSize, " ").concat(style.fontFamily);
                context.fillStyle = style.color;
                context.letterSpacing = style.letterSpacing === "normal" ? "0px" : style.letterSpacing;
                context.textBaseline = "alphabetic";
                range.selectNodeContents(node);
                const rectangles = range.getClientRects();
                const paint = (text, box) => {
                    if (!text.trim() || !box.width || !box.height) return;
                    const metrics = context.measureText(text);
                    var _metrics_fontBoundingBoxAscent;
                    const ascent = (_metrics_fontBoundingBoxAscent = metrics.fontBoundingBoxAscent) !== null && _metrics_fontBoundingBoxAscent !== void 0 ? _metrics_fontBoundingBoxAscent : parseFloat(style.fontSize) * .8;
                    var _metrics_fontBoundingBoxDescent;
                    const descent = (_metrics_fontBoundingBoxDescent = metrics.fontBoundingBoxDescent) !== null && _metrics_fontBoundingBoxDescent !== void 0 ? _metrics_fontBoundingBoxDescent : parseFloat(style.fontSize) * .2;
                    context.fillText(text.trim(), box.x - bounds.x, box.y - bounds.y + (box.height - ascent - descent) / 2 + ascent);
                };
                context.save();
                for (let ancestor = parent; ancestor && ancestor !== panel; ancestor = ancestor.parentElement) {
                    const computed = ancestor === parent ? style : getComputedStyle(ancestor);
                    if (computed.overflowX !== "visible" || computed.overflowY !== "visible") {
                        const clip = ancestor.getBoundingClientRect();
                        context.beginPath();
                        context.rect(clip.x - bounds.x, clip.y - bounds.y, clip.width, clip.height);
                        context.clip();
                    }
                }
                if (rectangles.length === 1) paint(node.textContent, rectangles[0]); else {
                    let line = "", box = null;
                    for (let index = 0; index < node.textContent.length; index++) {
                        range.setStart(node, index);
                        range.setEnd(node, index + 1);
                        const current = range.getBoundingClientRect();
                        if (box && Math.abs(current.y - box.y) > 1) {
                            paint(line, box);
                            line = "";
                            box = null;
                        }
                        box || (box = current);
                        line += node.textContent[index];
                    }
                    if (box) paint(line, box);
                }
                context.restore();
            }
            return canvas;
        }
        async function capturePanelTexture(panel) {
            const {toCanvas: toCanvas, getFontEmbedCSS: getFontEmbedCSS} = await warmPanelSnapshot();
            await document.fonts.ready;
            fontCss || (fontCss = getFontEmbedCSS(panel, {
                preferredFontFormat: "woff2"
            }).catch((() => "")));
            return toCanvas(panel, {
                width: panel.offsetWidth,
                height: panel.offsetHeight,
                pixelRatio: Math.min(window.devicePixelRatio || 1, 1.5),
                fontEmbedCSS: await fontCss,
                filter: node => !(node instanceof Element && (node.classList.contains("liquid-glass-optics") || node.classList.contains("glass-lens-definitions") || node.classList.contains("sr-only"))),
                style: {
                    position: "relative",
                    left: "0",
                    top: "0",
                    margin: "0",
                    transform: "none",
                    opacity: "1",
                    visibility: "visible",
                    boxShadow: "none",
                    borderColor: "transparent",
                    borderRadius: "0",
                    background: "transparent",
                    transition: "none",
                    animation: "none"
                }
            });
        }
        // [현재 화면의 색과 이미지를 유리 아래에 유지 / Preserve the visible page beneath the moving glass]
        // 블러에 필요한 배경만 그려 DOM 전체의 복제와 매 프레임 캡처를 피합니다.
        // Paint only visible backgrounds and images; never clone the page or capture every frame.
                function capturePanelBackdrop(exclude) {
            const canvas = document.createElement("canvas");
            const ratio = Math.min(1, 1200 / innerWidth);
            canvas.width = Math.ceil(innerWidth * ratio);
            canvas.height = Math.ceil(innerHeight * ratio);
            const context = canvas.getContext("2d");
            context.scale(ratio, ratio);
            context.fillStyle = "#fff";
            context.fillRect(0, 0, innerWidth, innerHeight);
            context.fillStyle = getComputedStyle(document.body).backgroundColor;
            context.fillRect(0, 0, innerWidth, innerHeight);
            const header = document.querySelector("#header");
            const elements = [ ...document.body.querySelectorAll("*") ].filter((element => element instanceof HTMLElement && !exclude.contains(element) && !element.closest(".floating-panel-webgl")));
            elements.sort(((a, b) => Number(Boolean(header === null || header === void 0 ? void 0 : header.contains(a))) - Number(Boolean(header === null || header === void 0 ? void 0 : header.contains(b)))));
            for (const element of elements) {
                const box = element.getBoundingClientRect();
                if (box.width < 1 || box.height < 1 || box.right < 0 || box.bottom < 0 || box.x > innerWidth || box.y > innerHeight) continue;
                const style = getComputedStyle(element);
                if (style.visibility === "hidden" || style.display === "none") continue;
                context.save();
                let opacity = 1;
                for (let ancestor = element; ancestor && ancestor !== document.body; ancestor = ancestor.parentElement) {
                    const ancestorStyle = ancestor === element ? style : getComputedStyle(ancestor);
                    opacity *= Number(ancestorStyle.opacity);
                    if (!opacity) break;
                    if (ancestorStyle.overflowX !== "visible" || ancestorStyle.overflowY !== "visible") {
                        const bounds = ancestor.getBoundingClientRect();
                        const radius = Math.max(0, Math.min(parseFloat(ancestorStyle.borderTopLeftRadius) || 0, bounds.width / 2, bounds.height / 2));
                        context.beginPath();
                        context.roundRect(bounds.x, bounds.y, bounds.width, bounds.height, radius);
                        context.clip();
                    }
                }
                context.globalAlpha = opacity;
                if (opacity && style.backgroundColor !== "rgba(0, 0, 0, 0)" && style.backgroundColor !== "transparent") {
                    context.fillStyle = style.backgroundColor;
                    context.fillRect(box.x, box.y, box.width, box.height);
                }
                if (opacity && element instanceof HTMLImageElement && element.complete && element.naturalWidth && (element.currentSrc.startsWith(location.origin) || element.currentSrc.startsWith("data:"))) {
                    if (style.objectFit === "cover") {
                        const scale = Math.max(box.width / element.naturalWidth, box.height / element.naturalHeight);
                        const width = box.width / scale, height = box.height / scale;
                        context.drawImage(element, (element.naturalWidth - width) / 2, (element.naturalHeight - height) / 2, width, height, box.x, box.y, box.width, box.height);
                    } else context.drawImage(element, box.x, box.y, box.width, box.height);
                }
                context.restore();
            }
            return canvas;
        }
        /***/    }
} ]);
//# sourceMappingURL=FloatingMenu_1.js.map