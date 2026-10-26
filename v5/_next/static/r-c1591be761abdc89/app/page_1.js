(self["webpackChunk_N_E"] = self["webpackChunk_N_E"] || []).push([ [ 931 ], {
    /***/ 2395: 
    /***/ function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {
        Promise.resolve().then(__webpack_require__.bind(__webpack_require__, 6494));
        /***/    },
    /***/ 6494: 
    /***/ function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        "use strict";
        // ESM COMPAT FLAG
                __webpack_require__.r(__webpack_exports__);
        // EXPORTS
                __webpack_require__.d(__webpack_exports__, {
            default: function() {
                /* binding */ return HomePage;
            }
        });
        // EXTERNAL MODULE: ./node_modules/next/dist/compiled/react/jsx-runtime.js
                var jsx_runtime = __webpack_require__(7437);
        // EXTERNAL MODULE: ./components/SystemSurface.tsx
                var SystemSurface = __webpack_require__(820);
        // EXTERNAL MODULE: ./node_modules/next/dist/compiled/react/index.js
                var react = __webpack_require__(2265);
        // EXTERNAL MODULE: ./node_modules/next/dist/api/link.js
                var api_link = __webpack_require__(7648);
        // EXTERNAL MODULE: ./src/catalog/CatalogProvider.tsx + 1 modules
                var CatalogProvider = __webpack_require__(7048);
        // EXTERNAL MODULE: ./src/lib/reservations.ts
                var reservations = __webpack_require__(8962);
        // EXTERNAL MODULE: ./components/ProgramCard.tsx
                var ProgramCard = __webpack_require__(563);
        // EXTERNAL MODULE: ./components/Icon.tsx
                var Icon = __webpack_require__(9140);
        // EXTERNAL MODULE: ./components/VioletQuickMenu.tsx + 2 modules
                var VioletQuickMenu = __webpack_require__(9037);
        // CONCATENATED MODULE: ./components/HomeAnchorNavigation.tsx
        /* __next_internal_client_entry_do_not_use__ default auto */
        const hiddenByContent = element => Boolean(element.closest('[hidden], [inert], [aria-hidden="true"]'));
        function focusTarget(target) {
            const canFocus = element => !hiddenByContent(element) && !element.matches(":disabled") && element.getClientRects().length > 0;
            const nativeTarget = target.matches("a[href], button, input, select, textarea, [tabindex]") && canFocus(target);
            const heading = Array.from(target.querySelectorAll("h1, h2, h3, h4")).find(canFocus);
            const control = Array.from(target.querySelectorAll("a[href], button, input, select, textarea")).find(canFocus);
            const parentLink = target.closest("a[href]");
            const element = nativeTarget ? target : heading || control || parentLink || (target.matches(":disabled") ? target.parentElement : target);
            if (!element || !canFocus(element)) return;
            const temporaryTabIndex = !element.matches("a[href], button, input, select, textarea, [tabindex]");
            if (temporaryTabIndex) {
                element.setAttribute("tabindex", "-1");
                element.addEventListener("blur", (() => element.removeAttribute("tabindex")), {
                    once: true
                });
            }
            element.focus({
                preventScroll: true
            });
        }
        /** Resolve fragment navigation once per navigation, never on a carousel render. */        function HomeAnchorNavigation(param) {
            let {resolveAnchor: resolveAnchor} = param;
            const resolveRef = (0, react.useRef)(resolveAnchor);
            resolveRef.current = resolveAnchor;
            (0, react.useEffect)((() => {
                let frame = 0;
                let navigation = 0;
                let disposed = false;
                const html = document.documentElement;
                const previousOffset = html.style.getPropertyValue("--anchor-header-offset");
                const header = document.getElementById("header");
                const headerOffset = () => {
                    if (!header) return 0;
                    const stickyTop = Number.parseFloat(getComputedStyle(header).top) || 0;
                    return Math.max(0, header.getBoundingClientRect().height + Math.min(0, stickyTop));
                };
                const measureHeader = () => html.style.setProperty("--anchor-header-offset", "".concat(Math.ceil(headerOffset()), "px"));
                measureHeader();
                const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measureHeader);
                if (header) observer === null || observer === void 0 ? void 0 : observer.observe(header);
                window.addEventListener("resize", measureHeader);
                const navigate = () => {
                    const token = ++navigation;
                    cancelAnimationFrame(frame);
                    let id;
                    try {
                        id = decodeURIComponent(window.location.hash.slice(1));
                    } catch (e) {
                        return;
                    }
                    if (!id || !resolveRef.current(id)) return;
                    let attempts = 0;
                    const place = () => {
                        if (disposed || token !== navigation) return;
                        const target = document.getElementById(id);
                        if (!target || hiddenByContent(target) || !target.getClientRects().length) {
                            // The resolver can commit a filter/slide change on the next React frame.
                            if (++attempts < 20) frame = requestAnimationFrame(place);
                            return;
                        }
                        // Reveal a booking item in its own vertical list without moving a carousel.
                                                const list = target.closest(".quick-program-list");
                        if (list && list !== target) {
                            const itemRect = target.getBoundingClientRect();
                            const listRect = list.getBoundingClientRect();
                            list.scrollTop += itemRect.top - listRect.top - 8;
                        }
                        focusTarget(target);
                        const top = Math.max(0, window.scrollY + target.getBoundingClientRect().top - headerOffset() - 16);
                        // Fragment navigation is immediate; it never scrolls a cloned slide sideways.
                                                window.scrollTo({
                            top: top,
                            left: window.scrollX,
                            behavior: "instant"
                        });
                    };
                    // The preloaded font can finish after the server's native fragment jump.
                    // Wait for its final layout, then let React reveal the requested content.
                                        if (document.fonts.status === "loading") document.fonts.ready.then((() => {
                        if (!disposed && token === navigation) frame = requestAnimationFrame(place);
                    })); else frame = requestAnimationFrame(place);
                };
                navigate();
                window.addEventListener("hashchange", navigate);
                window.addEventListener("popstate", navigate);
                window.addEventListener("pageshow", navigate);
                return () => {
                    disposed = true;
                    navigation++;
                    cancelAnimationFrame(frame);
                    observer === null || observer === void 0 ? void 0 : observer.disconnect();
                    window.removeEventListener("resize", measureHeader);
                    window.removeEventListener("hashchange", navigate);
                    window.removeEventListener("popstate", navigate);
                    window.removeEventListener("pageshow", navigate);
                    if (previousOffset) html.style.setProperty("--anchor-header-offset", previousOffset); else html.style.removeProperty("--anchor-header-offset");
                };
            }), []);
            return null;
        }
        // EXTERNAL MODULE: ./src/data/design-tokens.ts
                var design_tokens = __webpack_require__(1788);
        // EXTERNAL MODULE: ./components/HeroSlide.tsx
                var HeroSlide = __webpack_require__(9391);
        // EXTERNAL MODULE: ./components/HeroCompanion.tsx + 2 modules
                var HeroCompanion = __webpack_require__(8954);
        // EXTERNAL MODULE: ./components/SystemPrimitives.tsx
                var SystemPrimitives = __webpack_require__(6983);
        // CONCATENATED MODULE: ./components/HeroCarousel.tsx
        /* __next_internal_client_entry_do_not_use__ default auto */
        // [작품·양옆 미리보기·정보 레일의 조합 / Compose the work, neighbour previews and information rail]
        const HeroCarousel =   (0, react.forwardRef)((function HeroCarousel(param, ref) {
            let {externalPaused: externalPaused = false} = param;
            const {catalog: catalog} = (0, CatalogProvider /* useCatalog */ .r)();
            const HOME_FEATURES = catalog.homeFeatures;
            const [active, setActive] = (0, react.useState)(0);
            const [dragX, setDragX] = (0, react.useState)(0);
            const [direction, setDirection] = (0, react.useState)(0);
            const [returning, setReturning] = (0, react.useState)(false);
            const [dragging, setDragging] = (0, react.useState)(false);
            const [paused, setPaused] = (0, react.useState)(true);
            const [hovered, setHovered] = (0, react.useState)(false);
            const [focused, setFocused] = (0, react.useState)(false);
            const [inView, setInView] = (0, react.useState)(true);
            const [documentHidden, setDocumentHidden] = (0, react.useState)(false);
            const [reducedMotion, setReducedMotion] = (0, react.useState)(false);
            const [progress, setProgress] = (0, react.useState)(0);
            const [announcement, setAnnouncement] = (0, react.useState)("");
            const stage = (0, react.useRef)(null);
            const section = (0, react.useRef)(null);
            const timer = (0, react.useRef)(null);
            const locked = (0, react.useRef)(false);
            const gesture = (0, react.useRef)(null);
            const suppressClickUntil = (0, react.useRef)(0);
            const moveRef = (0, react.useRef)((() => {}));
            const count = HOME_FEATURES.length;
            const featureSignature = HOME_FEATURES.map((feature => feature.id)).join("\0");
            const safeActive = Math.min(active, Math.max(0, count - 1));
            const previous = HOME_FEATURES[(safeActive - 1 + count) % count];
            const next = HOME_FEATURES[(safeActive + 1) % count];
            function resetMotion() {
                var _gesture_current, _stage_current;
                if (timer.current) clearTimeout(timer.current);
                timer.current = null;
                locked.current = false;
                if (((_gesture_current = gesture.current) === null || _gesture_current === void 0 ? void 0 : _gesture_current.captured) && ((_stage_current = stage.current) === null || _stage_current === void 0 ? void 0 : _stage_current.hasPointerCapture(gesture.current.id))) stage.current.releasePointerCapture(gesture.current.id);
                if (stage.current) delete stage.current.dataset.dragging;
                gesture.current = null;
                setDirection(0);
                setReturning(false);
                setDragging(false);
                setDragX(0);
                setProgress(0);
            }
            function move(by) {
                let manual = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : true;
                var _stage_current;
                if (locked.current || count < 2) return;
                const target = (safeActive + by + count) % count;
                const finish = () => {
                    setActive(target);
                    resetMotion();
                    if (manual) setAnnouncement("".concat(target + 1, " / ").concat(count, ", ").concat(HOME_FEATURES[target].name));
                };
                if (reducedMotion) {
                    finish();
                    return;
                }
                const track = (_stage_current = stage.current) === null || _stage_current === void 0 ? void 0 : _stage_current.querySelector(".season-track");
                const slide = track === null || track === void 0 ? void 0 : track.querySelector(".season-slide");
                if (!track || !slide) return;
                const step = slide.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || "0");
                locked.current = true;
                setDirection(by);
                setDragX(-by * step);
                setProgress(0);
                timer.current = setTimeout(finish, design_tokens /* HERO_MOTION */ .D3.transition);
            }
            moveRef.current = move;
            (0, react.useEffect)((() => {
                resetMotion();
                setActive((index => Math.min(index, Math.max(0, count - 1))));
            }), [ featureSignature ]);
            // [공유 앵커와 수명 주기 / Shared anchors and lifecycle cleanup]
                        (0, react.useImperativeHandle)(ref, (() => ({
                showFeature(anchor) {
                    const index = HOME_FEATURES.findIndex((feature => anchor === "home-feature-".concat(feature.id)));
                    if (index < 0) return false;
                    resetMotion();
                    setActive(index);
                    setPaused(true);
                    return true;
                }
            })));
            (0, react.useEffect)((() => {
                const preference = matchMedia("(prefers-reduced-motion: reduce)");
                const updatePreference = () => {
                    setReducedMotion(preference.matches);
                    setPaused(preference.matches);
                };
                const updateVisibility = () => setDocumentHidden(document.hidden);
                const releaseUncapturedGesture = event => {
                    var _gesture_current;
                    if (((_gesture_current = gesture.current) === null || _gesture_current === void 0 ? void 0 : _gesture_current.id) !== event.pointerId || gesture.current.captured) return;
                    gesture.current = null;
                    setDragging(false);
                };
                updatePreference();
                updateVisibility();
                preference.addEventListener("change", updatePreference);
                document.addEventListener("visibilitychange", updateVisibility);
                window.addEventListener("pointerup", releaseUncapturedGesture);
                window.addEventListener("pointercancel", releaseUncapturedGesture);
                const observer = new IntersectionObserver((param => {
                    let [entry] = param;
                    return setInView(entry.isIntersecting);
                }), {
                    threshold: .15
                });
                if (section.current) observer.observe(section.current);
                return () => {
                    preference.removeEventListener("change", updatePreference);
                    document.removeEventListener("visibilitychange", updateVisibility);
                    window.removeEventListener("pointerup", releaseUncapturedGesture);
                    window.removeEventListener("pointercancel", releaseUncapturedGesture);
                    observer.disconnect();
                    if (timer.current) clearTimeout(timer.current);
                };
            }), []);
            const suspended = count < 2 || paused || hovered || focused || externalPaused || !inView || documentHidden || direction !== 0 || returning || dragging;
            (0, react.useEffect)((() => {
                if (suspended) return;
                const interval = 50;
                const tick = setInterval((() => setProgress((value => Math.min(1, value + interval / design_tokens /* HERO_MOTION */ .D3.interval)))), interval);
                return () => clearInterval(tick);
            }), [ suspended, active ]);
            (0, react.useEffect)((() => {
                if (progress >= 1 && !suspended) moveRef.current(1, false);
            }), [ progress, suspended ]);
            // [가로 드래그와 세로 스크롤을 구분 / Distinguish a horizontal drag from native vertical scroll]
                        function startGesture(event) {
                if (count < 2 || locked.current || event.button !== 0 || event.target.closest("a,button,input,select,textarea")) return;
                gesture.current = {
                    id: event.pointerId,
                    x: event.clientX,
                    y: event.clientY,
                    time: performance.now(),
                    captured: false
                };
                setDragging(true);
            }
            function dragGesture(event) {
                var _stage_current_querySelector, _stage_current;
                const current = gesture.current;
                if (!current || current.id !== event.pointerId) return;
                const x = event.clientX - current.x;
                const y = event.clientY - current.y;
                if (!current.captured) {
                    if (Math.abs(y) > Math.abs(x) && Math.abs(y) > 8) {
                        gesture.current = null;
                        setDragging(false);
                        return;
                    }
                    if (Math.abs(x) < 8) return;
                    current.captured = true;
                    event.currentTarget.setPointerCapture(event.pointerId);
                    event.currentTarget.dataset.dragging = "true";
                }
                const width = ((_stage_current = stage.current) === null || _stage_current === void 0 ? void 0 : (_stage_current_querySelector = _stage_current.querySelector(".season-slide")) === null || _stage_current_querySelector === void 0 ? void 0 : _stage_current_querySelector.getBoundingClientRect().width) || innerWidth;
                setDragX(Math.max(-width, Math.min(width, x)));
            }
            function endGesture(event) {
                let cancelled = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : false;
                var _stage_current_querySelector, _stage_current;
                const current = gesture.current;
                if (!current || current.id !== event.pointerId) return;
                gesture.current = null;
                setDragging(false);
                delete event.currentTarget.dataset.dragging;
                if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
                if (!current.captured) return;
                suppressClickUntil.current = performance.now() + 250;
                setProgress(0);
                const distance = event.clientX - current.x;
                const width = ((_stage_current = stage.current) === null || _stage_current === void 0 ? void 0 : (_stage_current_querySelector = _stage_current.querySelector(".season-slide")) === null || _stage_current_querySelector === void 0 ? void 0 : _stage_current_querySelector.getBoundingClientRect().width) || innerWidth;
                const velocity = Math.abs(distance) / Math.max(1, performance.now() - current.time);
                if (!cancelled && (Math.abs(distance) > width * .12 || Math.abs(distance) > 40 && velocity > .3)) {
                    move(distance < 0 ? 1 : -1);
                } else if (reducedMotion) setDragX(0); else {
                    locked.current = true;
                    setReturning(true);
                    setDragX(0);
                    timer.current = setTimeout(resetMotion, design_tokens /* HERO_MOTION */ .D3.settle);
                }
            }
            if (!count)   return (0, jsx_runtime.jsx)("section", {
                className: "season-hero container",
                "data-component-id": "hero-carousel",
                "aria-label": "이번 달의 문화예술",
                children:   (0, jsx_runtime.jsx)("p", {
                    "data-text": "body",
                    children: "현재 공개된 주요 프로그램이 없습니다."
                })
            });
             
            return (0, jsx_runtime.jsxs)("section", {
                className: "season-hero",
                id: "featured-season",
                "data-home-anchor": true,
                "data-component": "HeroCarousel",
                "data-component-id": "hero-carousel",
                "aria-label": "이번 달의 문화예술",
                "aria-roledescription": "캐러셀",
                ref: section,
                onMouseEnter: () => setHovered(true),
                onMouseLeave: () => setHovered(false),
                onFocusCapture: () => setFocused(true),
                onBlurCapture: event => {
                    if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
                },
                children: [ 
                
                 (0, jsx_runtime.jsx)("div", {
                    className: "season-stage",
                    ref: stage,
                    onPointerDown: startGesture,
                    onPointerMove: dragGesture,
                    onPointerUp: event => endGesture(event),
                    onPointerCancel: event => endGesture(event, true),
                    onDragStart: event => event.preventDefault(),
                    onClickCapture: event => {
                        if (performance.now() < suppressClickUntil.current) {
                            event.preventDefault();
                            event.stopPropagation();
                        }
                    },
                    children:   (0, jsx_runtime.jsx)("div", {
                        "data-text": "body",
                        className: "season-track".concat(direction ? " is-moving" : "").concat(returning ? " is-returning" : ""),
                        style: {
                            "--drag-x": "".concat(dragX, "px")
                        },
                        children: [ -2, -1, 0, 1, 2 ].map((offset =>   (0, jsx_runtime.jsx /* default */)(HeroSlide.Z, {
                            feature: HOME_FEATURES[(safeActive + offset + count) % count],
                            active: offset === 0,
                            entering: direction === offset && direction !== 0,
                            preview: offset === -1 ? "previous" : offset === 1 ? "next" : undefined,
                            onSelect: offset === -1 ? () => move(-1) : offset === 1 ? () => move(1) : undefined
                        }, offset)))
                    })
                }), 
                
                 (0, jsx_runtime.jsxs)("div", {
                    className: "hero-neighbor-navigation container",
                    role: "group",
                    "aria-label": "양옆 프로그램",
                    children: [ 
                    
                     (0, jsx_runtime.jsxs /* SystemButton */)(SystemPrimitives.kR, {
                        "data-text": "action",
                        variant: "quiet",
                        disabled: count < 2,
                        onClick: () => move(-1),
                        "aria-label": "".concat(previous.name, " 이전 슬라이드로 보기"),
                        children: [ 
                        
                         (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                            name: "back",
                            size: 20
                        }), 
                        
                         (0, jsx_runtime.jsx)("span", {
                            "data-text": "body",
                            children: previous.programTitle
                        }) ]
                    }), 
                    
                     (0, jsx_runtime.jsxs /* SystemButton */)(SystemPrimitives.kR, {
                        "data-text": "action",
                        variant: "quiet",
                        disabled: count < 2,
                        onClick: () => move(1),
                        "aria-label": "".concat(next.name, " 다음 슬라이드로 보기"),
                        children: [ 
                        
                         (0, jsx_runtime.jsx)("span", {
                            "data-text": "body",
                            children: next.programTitle
                        }), 
                        
                         (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                            name: "arrow",
                            size: 20
                        }) ]
                    }) ]
                }), 
                
                 (0, jsx_runtime.jsx /* default */)(HeroCompanion.Z, {}), 
                
                 (0, jsx_runtime.jsxs)("div", {
                    className: "season-toolbar container",
                    children: [ 
                    
                     (0, jsx_runtime.jsx)("p", {
                        "data-text": "body",
                        children: "이번 달의 문화예술"
                    }), 
                    
                     (0, jsx_runtime.jsxs)("div", {
                        className: "season-controls",
                        id: "home-feature-controls",
                        "data-home-anchor": true,
                        role: "group",
                        "aria-label": "주요 프로그램 제어",
                        children: [ 
                        
                         (0, jsx_runtime.jsxs)("span", {
                            className: "season-pagination",
                            "aria-hidden": "true",
                            children: [ 
                            
                             (0, jsx_runtime.jsx)("span", {
                                "data-text": "body",
                                children: String(safeActive + 1).padStart(2, "0")
                            }), 
                            
                             (0, jsx_runtime.jsxs)("span", {
                                "data-text": "body",
                                className: "season-pagination-total",
                                children: [ " / ", String(count).padStart(2, "0") ]
                            }) ]
                        }), 
                        
                         (0, jsx_runtime.jsx)("span", {
                            className: "season-progress",
                            "aria-hidden": "true",
                            children:   (0, jsx_runtime.jsx)("i", {
                                style: {
                                    transform: "scaleX(".concat(progress, ")")
                                }
                            })
                        }), 
                        
                         (0, jsx_runtime.jsx /* SystemIconButton */)(SystemPrimitives.MW, {
                            "data-text": "action",
                            id: "home-feature-previous",
                            disabled: count < 2,
                            className: "round-button",
                            onClick: () => move(-1),
                            "aria-label": "이전 프로그램",
                            children:   (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                                name: "back",
                                size: 24
                            })
                        }), 
                        
                         (0, jsx_runtime.jsx /* SystemIconButton */)(SystemPrimitives.MW, {
                            "data-text": "action",
                            id: "home-feature-next",
                            disabled: count < 2,
                            className: "round-button",
                            onClick: () => move(1),
                            "aria-label": "다음 프로그램",
                            children:   (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                                name: "arrow",
                                size: 24
                            })
                        }), 
                        
                         (0, jsx_runtime.jsx /* SystemIconButton */)(SystemPrimitives.MW, {
                            "data-text": "action",
                            id: "home-feature-playback",
                            disabled: count < 2,
                            className: "round-button",
                            onClick: () => {
                                if (paused) setFocused(false);
                                setPaused((value => !value));
                            },
                            "aria-label": paused ? "자동 재생 시작" : "자동 재생 일시정지",
                            "aria-pressed": paused,
                            children:   (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                                name: paused ? "play" : "pause",
                                size: 24
                            })
                        }), 
                        
                         (0, jsx_runtime.jsx)("span", {
                            "data-text": "body",
                            className: "sr-only",
                            "aria-live": "polite",
                            "aria-atomic": "true",
                            children: announcement
                        }) ]
                    }) ]
                }) ]
            });
        }));
        /* harmony default export */        var components_HeroCarousel = HeroCarousel;
        // EXTERNAL MODULE: ./components/SeasonBanner.tsx
                var SeasonBanner = __webpack_require__(3429);
        // EXTERNAL MODULE: ./components/SystemText.tsx
                var SystemText = __webpack_require__(8519);
        // EXTERNAL MODULE: ./components/HomeBookingControls.tsx + 2 modules
                var HomeBookingControls = __webpack_require__(1378);
        // EXTERNAL MODULE: ./src/catalog/snapshot.ts + 1 modules
                var snapshot = __webpack_require__(2554);
        // CONCATENATED MODULE: ./src/data/official-media.ts
        const OFFICIAL_MEDIA = Object.fromEntries(snapshot.CATALOG_SNAPSHOT.media.map((media => [ media.id, media ])));
        const officialImage = id => OFFICIAL_MEDIA[id] ? "assets/images/official/" + OFFICIAL_MEDIA[id].file : "";
        const officialImageAlt = id => {
            var _OFFICIAL_MEDIA_id;
            return ((_OFFICIAL_MEDIA_id = OFFICIAL_MEDIA[id]) === null || _OFFICIAL_MEDIA_id === void 0 ? void 0 : _OFFICIAL_MEDIA_id.alt) || "";
        };
        // EXTERNAL MODULE: ./src/features/home-domain.ts
                var home_domain = __webpack_require__(4936);
        // CONCATENATED MODULE: ./app/page.tsx
        /* __next_internal_client_entry_do_not_use__ default auto */
        // 히어로 캐러셀 슬라이드 데이터
        // 방문 안내 데이터
        const visitGuides = [ {
            id: "directions",
            title: "오시는 길과 주차",
            description: "지하철·버스·주차장 안내",
            path: "/visit/directions",
            image: "sejong-grand-facade.png",
            alt: "광화문 광장에 면한 세종문화회관 대극장 외관",
            kind: "photo",
            width: 1160,
            height: 680
        }, {
            id: "spaces",
            title: "공간과 좌석",
            description: "객석 배치와 좌석 시야 미리보기",
            path: "/visit/spaces",
            image: "sejong-grand-auditorium.png",
            alt: "무대에서 바라본 세종대극장 객석",
            kind: "photo",
            width: 1160,
            height: 680
        }, {
            id: "accessibility",
            title: "모두를 위한 관람",
            description: "접근성 서비스와 편의시설",
            path: "/visit/accessibility",
            image: "official/" + OFFICIAL_MEDIA["venue-s"].file,
            alt: OFFICIAL_MEDIA["venue-s"].alt,
            kind: "photo",
            width: 1160,
            height: 680
        }, {
            id: "etiquette",
            title: "관람 전 알아두세요",
            description: "예매와 관람에 필요한 안내",
            path: "/visit/etiquette",
            image: "official/" + OFFICIAL_MEDIA["venue-chamber"].file,
            alt: OFFICIAL_MEDIA["venue-chamber"].alt,
            kind: "photo",
            width: 1160,
            height: 680
        } ];
        const programCategoryIds = {
            "전체": "all",
            "공연": "performance",
            "전시": "exhibition",
            "교육": "education",
            "기획·시즌": "season"
        };
        const newsCategoryIds = {
            "전체": "all",
            "공지": "notices",
            "티켓오픈": "ticket-open",
            "대관공고": "rental"
        };
        function HomePage() {
            // 1. 서울 기준 오늘 날짜
            const today = (0, home_domain /* seoulToday */ .bO)();
            // [등록된 히어로 조합의 앵커 연결 / Connect anchors to the registered hero composition]
                        const heroRef = (0, react.useRef)(null);
            const [isQuickMenuOpen, setIsQuickMenuOpen] = (0, react.useState)(false);
            // 3. 캘린더 빠른 예매 위젯 상태
                        const [bookingDate, setBookingDate] = (0, react.useState)(today);
            const [bookingMonth, setBookingMonth] = (0, react.useState)(today.slice(0, 7));
            const [selectedProgramId, setSelectedProgramId] = (0, react.useState)("");
            const [selectedTime, setSelectedTime] = (0, react.useState)("");
            const [participants, setParticipants] = (0, react.useState)(1);
            const {catalog: catalog} = (0, CatalogProvider /* useCatalog */ .r)();
            const PROGRAMS = catalog.programs.map((program => ({
                ...program,
                times: catalog.sessions.filter((session => session.programId === program.id && session.bookingEnabled && session.sourceState === "verified" && (0, 
                reservations /* sessionLocalParts */ .zp)(session).date === bookingDate)).map((session => (0, 
                reservations /* sessionLocalParts */ .zp)(session).time))
            })));
            const NOTICES = catalog.notices;
            const programsOnBookingDate = (0, home_domain /* programsForDate */ .jd)(PROGRAMS, bookingDate);
            const selectedProgram = PROGRAMS.find((p => p.id === selectedProgramId));
            // 날짜 변경 시 프로그램 자동 선택 또는 정리
                        const handleDateSelect = date => {
                setBookingDate(date);
                const progs = (0, home_domain /* programsForDate */ .jd)(PROGRAMS, date);
                if (progs.length > 0) {
                    const firstAvailable = progs.find((p => (0, home_domain /* canSelectProgram */ .Ip)(p) && date >= today));
                    if (firstAvailable) {
                        var _firstAvailable_times;
                        setSelectedProgramId(firstAvailable.id);
                        setSelectedTime(((_firstAvailable_times = firstAvailable.times) === null || _firstAvailable_times === void 0 ? void 0 : _firstAvailable_times[0]) || "");
                    } else {
                        setSelectedProgramId("");
                        setSelectedTime("");
                    }
                } else {
                    setSelectedProgramId("");
                    setSelectedTime("");
                }
            };
            // 프로그램 수동 선택
                        const handleProgramSelect = prog => {
                var _prog_times;
                if (!(0, home_domain /* canSelectProgram */ .Ip)(prog) || bookingDate < today) return;
                setSelectedProgramId(prog.id);
                setSelectedTime(((_prog_times = prog.times) === null || _prog_times === void 0 ? void 0 : _prog_times[0]) || "");
            };
            const dateLabel = date => {
                if (!date) return "날짜를 선택하세요";
                try {
                    return new Intl.DateTimeFormat("ko-KR", {
                        month: "long",
                        day: "numeric",
                        weekday: "short",
                        timeZone: "Asia/Seoul"
                    }).format(new Date("".concat(date, "T03:00:00Z")));
                } catch (e) {
                    return date;
                }
            };
            const isBookingValid = Boolean(selectedProgram) && Boolean(selectedTime) && bookingDate >= today && (0, 
            home_domain /* canSelectProgram */ .Ip)(selectedProgram);
            const bookingButtonLabel = (selectedProgram === null || selectedProgram === void 0 ? void 0 : selectedProgram.category) === "교육" ? "교육 신청으로" : (selectedProgram === null || selectedProgram === void 0 ? void 0 : selectedProgram.category) === "전시" ? "전시 예매로" : "공연 예매로";
            const bookingDestinationUrl = selectedProgram ? "/booking/".concat(selectedProgram.id, "?date=").concat(bookingDate, "&time=").concat(encodeURIComponent(selectedTime), "&participants=").concat(participants, "&source=home") : "";
            // 4. 프로그램 탐색 섹션 상태
                        const [selectedCategory, setSelectedCategory] = (0, react.useState)("전체");
            const [anchorProgramId, setAnchorProgramId] = (0, react.useState)("");
            const categories = [ "전체", "공연", "전시", "교육", "기획·시즌" ];
            const programChoices = (0, home_domain /* discoverPrograms */ .nQ)(PROGRAMS, selectedCategory, today);
            const anchoredProgram = PROGRAMS.find((program => program.id === anchorProgramId));
            const filteredPrograms = (anchoredProgram ? [ anchoredProgram, ...programChoices.filter((program => program.id !== anchoredProgram.id)) ] : programChoices).slice(0, 4);
            // 5. 방문 안내 미리보기 상태
                        const [activeVisitId, setActiveVisitId] = (0, react.useState)("directions");
            const activeGuide = visitGuides.find((g => g.id === activeVisitId)) || visitGuides[0];
            // 6. 소식 & 참여 섹션 상태
                        const [newsCategory, setNewsCategory] = (0, react.useState)("전체");
            const [anchorNoticeId, setAnchorNoticeId] = (0, react.useState)("");
            const newsCategories = [ "전체", "공지", "티켓오픈", "대관공고" ];
            const noticeChoices = NOTICES.filter((notice => newsCategory === "전체" || notice.category === newsCategory));
            const anchoredNotice = NOTICES.find((notice => notice.id === anchorNoticeId));
            const filteredNotices = (anchoredNotice ? [ anchoredNotice, ...noticeChoices.filter((notice => notice.id !== anchoredNotice.id)) ] : noticeChoices).slice(0, 4);
            const resolveHomeAnchor = id => {
                var _heroRef_current;
                if ((_heroRef_current = heroRef.current) === null || _heroRef_current === void 0 ? void 0 : _heroRef_current.showFeature(id)) return true;
                const programCategory = categories.find((category => id === "home-program-category-".concat(programCategoryIds[category])));
                if (programCategory) {
                    setAnchorProgramId("");
                    setSelectedCategory(programCategory);
                    return true;
                }
                const program = PROGRAMS.find((item => id === "home-program-".concat(item.id)));
                if (program) {
                    if (!filteredPrograms.some((item => item.id === program.id))) {
                        setSelectedCategory("전체");
                        setAnchorProgramId(program.id);
                    }
                    return true;
                }
                const noticeCategory = newsCategories.find((category => id === "home-news-category-".concat(newsCategoryIds[category])));
                if (noticeCategory) {
                    setAnchorNoticeId("");
                    setNewsCategory(noticeCategory);
                    return true;
                }
                const notice = NOTICES.find((item => id === "home-notice-".concat(item.id)));
                if (notice) {
                    if (!filteredNotices.some((item => item.id === notice.id))) {
                        setNewsCategory("전체");
                        setAnchorNoticeId(notice.id);
                    }
                    return true;
                }
                const date = id.startsWith("home-booking-date-") ? id.slice("home-booking-date-".length) : "";
                if (date && (0, home_domain /* monthDates */ .RG)(date.slice(0, 7)).includes(date)) {
                    setBookingMonth(date.slice(0, 7));
                    handleDateSelect(date);
                    return true;
                }
                const bookingProgram = PROGRAMS.find((item => id === "home-booking-program-".concat(item.id)));
                if (bookingProgram) {
                    if (!programsOnBookingDate.some((item => item.id === bookingProgram.id))) {
                        const date = today < bookingProgram.start || today > bookingProgram.end ? bookingProgram.start : today;
                        setBookingMonth(date.slice(0, 7));
                        handleDateSelect(date);
                    }
                    return true;
                }
                const guide = visitGuides.find((item => id === "home-visit-".concat(item.id)));
                if (guide) setActiveVisitId(guide.id);
                const target = document.getElementById(id);
                return Boolean(target && (target.closest(".home-v4-wrap, #footer") || [ "header", "main" ].includes(id)));
            };
             
            return (0, jsx_runtime.jsxs)("div", {
                className: "home-v4-wrap",
                id: "home",
                "data-home-anchor": true,
                children: [ 
                
                 (0, jsx_runtime.jsx)(HomeAnchorNavigation, {
                    resolveAnchor: resolveHomeAnchor
                }), 
                
                 (0, jsx_runtime.jsx)("h1", {
                    "data-text": "title",
                    className: "sr-only",
                    children: "세종문화회관 — 공연·전시·교육 일정, 예매와 이용 안내"
                }), 
                
                 (0, jsx_runtime.jsx)(components_HeroCarousel, {
                    ref: heroRef,
                    externalPaused: isQuickMenuOpen
                }), 
                
                 (0, jsx_runtime.jsx /* default */)(VioletQuickMenu.Z, {
                    heroId: "featured-season",
                    onOpenChange: setIsQuickMenuOpen
                }), 
                
                 (0, jsx_runtime.jsxs)("nav", {
                    className: "home-pathways container",
                    id: "home-pathways",
                    "data-home-anchor": true,
                    "aria-label": "이용 목적별 바로가기",
                    children: [ 
                    
                     (0, jsx_runtime.jsxs)(api_link["default"], {
                        "data-text": "action",
                        href: "/programs",
                        id: "home-pathway-programs",
                        "data-home-anchor": true,
                        children: [ 
                        
                         (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                            name: "calendar",
                            size: 26
                        }), 
                        
                         (0, jsx_runtime.jsxs)("span", {
                            children: [ 
                            
                             (0, jsx_runtime.jsx)("strong", {
                                "data-text": "item-title",
                                children: "일정·예매"
                            }), 
                            
                             (0, jsx_runtime.jsx)("small", {
                                "data-text": "caption",
                                children: "공연·전시·교육 살펴보기"
                            }) ]
                        }), 
                        
                         (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                            name: "arrow",
                            size: 22
                        }) ]
                    }), 
                    
                     (0, jsx_runtime.jsxs)(api_link["default"], {
                        "data-text": "action",
                        href: "/visit/group",
                        id: "home-pathway-group",
                        "data-home-anchor": true,
                        children: [ 
                        
                         (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                            name: "ticket",
                            size: 26
                        }), 
                        
                         (0, jsx_runtime.jsxs)("span", {
                            children: [ 
                            
                             (0, jsx_runtime.jsx)("strong", {
                                "data-text": "item-title",
                                children: "단체 관람"
                            }), 
                            
                             (0, jsx_runtime.jsx)("small", {
                                "data-text": "caption",
                                children: "단체관람 안내와 신청"
                            }) ]
                        }), 
                        
                         (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                            name: "arrow",
                            size: 22
                        }) ]
                    }), 
                    
                     (0, jsx_runtime.jsxs)(api_link["default"], {
                        "data-text": "action",
                        href: "/rental",
                        id: "home-pathway-rental",
                        "data-home-anchor": true,
                        children: [ 
                        
                         (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                            name: "pin",
                            size: 26
                        }), 
                        
                         (0, jsx_runtime.jsxs)("span", {
                            children: [ 
                            
                             (0, jsx_runtime.jsx)("strong", {
                                "data-text": "item-title",
                                children: "대관"
                            }), 
                            
                             (0, jsx_runtime.jsx)("small", {
                                "data-text": "caption",
                                children: "대관 시설과 일정 확인"
                            }) ]
                        }), 
                        
                         (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                            name: "arrow",
                            size: 22
                        }) ]
                    }) ]
                }), 
                
                 (0, jsx_runtime.jsxs)("section", {
                    className: "home-booking container",
                    id: "quick-booking",
                    "data-home-anchor": true,
                    "aria-labelledby": "quick-booking-heading",
                    children: [ 
                    
                     (0, jsx_runtime.jsxs)("div", {
                        className: "section-heading",
                        children: [ 
                        
                         (0, jsx_runtime.jsxs)("div", {
                            children: [ 
                            
                             (0, jsx_runtime.jsx /* SystemText */)(SystemText.J, {
                                as: "h2",
                                variant: "heading",
                                id: "quick-booking-heading",
                                className: "booking-invitation",
                                children: "관람 예약"
                            }), 
                            
                             (0, jsx_runtime.jsx)("p", {
                                "data-text": "body",
                                className: "section-description",
                                children: "관람할 날을 고르면, 그날의 예술이 보여요."
                            }) ]
                        }), 
                        
                         (0, jsx_runtime.jsxs)(api_link["default"], {
                            "data-text": "action",
                            className: "text-link",
                            href: "/programs?view=calendar",
                            id: "home-booking-full-calendar",
                            "data-home-anchor": true,
                            children: [ "전체 일정 ", 
                            
                             (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                                name: "arrow",
                                size: 20
                            }) ]
                        }) ]
                    }), 
                    
                     (0, jsx_runtime.jsxs /* default */)(SystemSurface.ZP, {
                        as: "div",
                        variant: "inset",
                        padding: "lg",
                        radius: "dialog",
                        className: "quick-booking-layout",
                        children: [ 
                        
                         (0, jsx_runtime.jsx /* BookingCalendar */)(HomeBookingControls.w, {
                            month: bookingMonth,
                            selectedDate: bookingDate,
                            today: today,
                            programs: PROGRAMS,
                            dateLabel: dateLabel,
                            onMonthChange: setBookingMonth,
                            onDateChange: handleDateSelect
                        }), 
                        
                         (0, jsx_runtime.jsxs)("div", {
                            "data-text": "body",
                            className: "quick-booking-choices",
                            id: "home-booking-programs",
                            "data-home-anchor": true,
                            children: [ 
                            
                             (0, jsx_runtime.jsxs)("div", {
                                className: "quick-day-heading",
                                children: [ 
                                
                                 (0, jsx_runtime.jsxs)("div", {
                                    children: [ 
                                    
                                     (0, jsx_runtime.jsx)("p", {
                                        "data-text": "body",
                                        children: "선택한 날짜"
                                    }), 
                                    
                                     (0, jsx_runtime.jsx)("h3", {
                                        "data-text": "subheading",
                                        id: "home-booking-day-heading",
                                        children: dateLabel(bookingDate)
                                    }) ]
                                }), 
                                
                                 (0, jsx_runtime.jsxs)("span", {
                                    "data-text": "body",
                                    children: [ programsOnBookingDate.length, "개 프로그램" ]
                                }) ]
                            }), programsOnBookingDate.length > 0 ?   (0, jsx_runtime.jsx)("div", {
                                "data-text": "body",
                                className: "quick-program-list",
                                role: "group",
                                "aria-label": "프로그램 선택",
                                children: programsOnBookingDate.map((prog => {
                                    const available = (0, home_domain /* canSelectProgram */ .Ip)(prog) && bookingDate >= today;
                                    const isSelected = selectedProgramId === prog.id;
                                     
                                    return (0, jsx_runtime.jsx /* BookingProgramChoice */)(HomeBookingControls.J, {
                                        program: prog,
                                        selected: isSelected,
                                        available: available,
                                        past: bookingDate < today,
                                        onSelect: () => handleProgramSelect(prog)
                                    }, prog.id);
                                }))
                            }) :   (0, jsx_runtime.jsxs)("div", {
                                className: "quick-empty",
                                children: [ 
                                
                                 (0, jsx_runtime.jsx)("h4", {
                                    "data-text": "item-title",
                                    children: "등록된 프로그램이 없는 날이에요."
                                }), 
                                
                                 (0, jsx_runtime.jsx)("p", {
                                    "data-text": "body",
                                    children: "달력에 점이 있는 날짜를 선택하거나 전체 일정을 살펴보세요."
                                }), 
                                
                                 (0, jsx_runtime.jsxs)(api_link["default"], {
                                    "data-text": "action",
                                    className: "text-link",
                                    href: "/programs?view=calendar&month=".concat(bookingMonth),
                                    children: [ "전체 일정 보기 ", 
                                    
                                     (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                                        name: "arrow",
                                        size: 20
                                    }) ]
                                }) ]
                            }), 
                            
                             (0, jsx_runtime.jsxs)("div", {
                                className: "quick-selection-fields",
                                id: "home-booking-options",
                                "data-home-anchor": true,
                                role: "group",
                                "aria-label": "회차와 인원 선택",
                                children: [ 
                                
                                 (0, jsx_runtime.jsxs /* SystemField */)(SystemPrimitives.RK, {
                                    "data-text": "body",
                                    as: "select",
                                    label: "회차",
                                    id: "quick-time",
                                    value: selectedTime,
                                    onChange: e => setSelectedTime(e.target.value),
                                    disabled: !selectedProgram,
                                    children: [ 
                                    
                                     (0, jsx_runtime.jsx)("option", {
                                        "data-text": "label",
                                        value: "",
                                        children: selectedProgram ? "회차를 선택하세요" : "프로그램을 먼저 선택하세요"
                                    }), ((selectedProgram === null || selectedProgram === void 0 ? void 0 : selectedProgram.times) || []).map((t =>   (0, 
                                    jsx_runtime.jsx)("option", {
                                        "data-text": "label",
                                        value: t,
                                        children: t
                                    }, t))) ]
                                }), 
                                
                                 (0, jsx_runtime.jsx /* SystemField */)(SystemPrimitives.RK, {
                                    "data-text": "body",
                                    as: "select",
                                    label: "인원",
                                    id: "quick-participants",
                                    value: participants,
                                    onChange: e => setParticipants(Number(e.target.value)),
                                    disabled: !selectedProgram,
                                    children: [ 1, 2, 3, 4 ].map((count =>   (0, jsx_runtime.jsxs)("option", {
                                        "data-text": "label",
                                        value: count,
                                        children: [ count, "명" ]
                                    }, count)))
                                }) ]
                            }), 
                            
                             (0, jsx_runtime.jsxs)("div", {
                                "data-text": "body",
                                className: "quick-booking-action",
                                id: "home-booking-action",
                                "data-home-anchor": true,
                                children: [ 
                                
                                 (0, jsx_runtime.jsx)("p", {
                                    "data-text": "body",
                                    children: isBookingValid && selectedProgram ?   (0, jsx_runtime.jsxs)(jsx_runtime.Fragment, {
                                        children: [ selectedProgram.title, 
                                        
                                         (0, jsx_runtime.jsx)("br", {}), selectedTime, " · ", participants, "명" ]
                                    }) : "프로그램과 회차를 선택해 주세요."
                                }), isBookingValid ?   (0, jsx_runtime.jsxs)(SystemPrimitives.SystemLink, {
                                    "data-text": "action",
                                    className: "button button--dark",
                                    href: bookingDestinationUrl,
                                    children: [ bookingButtonLabel, " ", 
                                    
                                     (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                                        name: "arrow",
                                        size: 20
                                    }) ]
                                }) :   (0, jsx_runtime.jsx /* SystemButton */)(SystemPrimitives.kR, {
                                    "data-text": "action",
                                    className: "button button--dark",
                                    type: "button",
                                    disabled: true,
                                    children: "예매·신청"
                                }) ]
                            }) ]
                        }) ]
                    }) ]
                }), 
                
                 (0, jsx_runtime.jsxs)("section", {
                    className: "home-programs container",
                    id: "discover-programs",
                    "data-home-anchor": true,
                    "aria-labelledby": "discover-heading",
                    children: [ 
                    
                     (0, jsx_runtime.jsxs)("div", {
                        className: "section-heading",
                        children: [ 
                        
                         (0, jsx_runtime.jsxs)("div", {
                            children: [ 
                            
                             (0, jsx_runtime.jsx)("h2", {
                                "data-text": "heading",
                                id: "discover-heading",
                                children: "관람 일정"
                            }), 
                            
                             (0, jsx_runtime.jsx)("p", {
                                "data-text": "body",
                                className: "section-description",
                                children: "오늘 열리는 무대부터 다음 달 일정까지."
                            }) ]
                        }), 
                        
                         (0, jsx_runtime.jsxs)(api_link["default"], {
                            "data-text": "action",
                            className: "text-link",
                            href: "/programs",
                            id: "home-program-all",
                            "data-home-anchor": true,
                            children: [ "모든 프로그램 ", 
                            
                             (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                                name: "arrow",
                                size: 20
                            }) ]
                        }) ]
                    }), 
                    
                     (0, jsx_runtime.jsxs)("div", {
                        className: "program-filter-row",
                        children: [ 
                        
                         (0, jsx_runtime.jsx)("div", {
                            "data-text": "body",
                            className: "program-choice",
                            id: "home-program-filters",
                            "data-home-anchor": true,
                            role: "group",
                            "aria-label": "프로그램 분류",
                            children: categories.map((cat =>   (0, jsx_runtime.jsx /* SystemFilterButton */)(SystemPrimitives.BV, {
                                "data-text": "action",
                                selected: selectedCategory === cat,
                                id: "home-program-category-".concat(programCategoryIds[cat]),
                                "data-home-anchor": true,
                                type: "button",
                                onClick: () => {
                                    setAnchorProgramId("");
                                    setSelectedCategory(cat);
                                },
                                className: selectedCategory === cat ? "is-selected" : "",
                                "aria-pressed": selectedCategory === cat,
                                children: cat
                            }, cat)))
                        }), 
                        
                         (0, jsx_runtime.jsxs)(api_link["default"], {
                            "data-text": "action",
                            className: "calendar-link",
                            href: "/programs?view=calendar",
                            id: "home-program-calendar",
                            "data-home-anchor": true,
                            children: [ 
                            
                             (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                                name: "calendar",
                                size: 18
                            }), " 일정으로 보기" ]
                        }) ]
                    }), 
                    
                     (0, jsx_runtime.jsx)("div", {
                        "data-text": "body",
                        className: "home-program-grid",
                        id: "home-program-results",
                        "data-home-anchor": true,
                        children: filteredPrograms.length > 0 ? filteredPrograms.map((program =>   (0, jsx_runtime.jsx)("div", {
                            id: "home-program-".concat(program.id),
                            className: "home-program-anchor",
                            "data-home-anchor": true,
                            children:   (0, jsx_runtime.jsx /* default */)(ProgramCard.Z, {
                                program: program
                            })
                        }, program.id))) :   (0, jsx_runtime.jsxs)("p", {
                            "data-text": "body",
                            className: "selection-empty",
                            children: [ "이 분류의 다음 일정은 아직 확정 전입니다.", " ", 
                            
                             (0, jsx_runtime.jsx)(api_link["default"], {
                                "data-text": "action",
                                href: "/programs",
                                children: "전체 프로그램을 살펴보세요."
                            }) ]
                        })
                    }), 
                    
                     (0, jsx_runtime.jsx /* default */)(SeasonBanner.Z, {}) ]
                }), 
                
                 (0, jsx_runtime.jsxs)("section", {
                    className: "home-visit container",
                    id: "plan-your-visit",
                    "data-home-anchor": true,
                    "aria-labelledby": "visit-heading",
                    children: [ 
                    
                     (0, jsx_runtime.jsx)("figure", {
                        className: "visit-photograph",
                        id: "home-visit-preview",
                        "data-home-anchor": true,
                        "aria-label": "방문 안내 미리보기",
                        children: visitGuides.map((guide => /* eslint-disable-next-line @next/next/no-img-element */  /* eslint-disable-next-line @next/next/no-img-element */  (0, 
                        jsx_runtime.jsx)("img", {
                            src: "/v5/assets/images/".concat(guide.image),
                            alt: guide.alt,
                            width: guide.width,
                            height: guide.height,
                            loading: "lazy",
                            "data-visit-image": guide.id,
                            "data-visit-kind": guide.kind,
                            "aria-hidden": activeVisitId !== guide.id
                        }, guide.id)))
                    }), 
                    
                     (0, jsx_runtime.jsxs)("div", {
                        className: "visit-editorial",
                        children: [ 
                        
                         (0, jsx_runtime.jsx)("h2", {
                            "data-text": "heading",
                            id: "visit-heading",
                            children: "오시는 길"
                        }), 
                        
                         (0, jsx_runtime.jsxs)("p", {
                            "data-text": "body",
                            className: "visit-description",
                            children: [ "지하철과 주차장 이용부터", 
                            
                             (0, jsx_runtime.jsx)("br", {}), "접근성 서비스와 관람 예절까지 정리했습니다." ]
                        }), 
                        
                         (0, jsx_runtime.jsxs)(api_link["default"], {
                            "data-text": "action",
                            className: "text-link home-visit-planner",
                            href: "/visit/plan",
                            id: "home-visit-planner",
                            "data-home-anchor": true,
                            children: [ "방문 계획 만들기 ", 
                            
                             (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                                name: "arrow",
                                size: 20
                            }) ]
                        }), 
                        
                         (0, jsx_runtime.jsxs)("div", {
                            className: "visit-links-layout",
                            children: [ 
                            
                             (0, jsx_runtime.jsx)("div", {
                                "data-text": "body",
                                className: "visit-link-list",
                                children: visitGuides.map((guide =>   (0, jsx_runtime.jsxs)(api_link["default"], {
                                    "data-text": "action",
                                    id: "home-visit-".concat(guide.id),
                                    "data-home-anchor": true,
                                    href: guide.path,
                                    "data-visit-preview": guide.id,
                                    onPointerEnter: () => setActiveVisitId(guide.id),
                                    onFocus: () => setActiveVisitId(guide.id),
                                    className: activeVisitId === guide.id ? "is-previewed" : "",
                                    children: [ 
                                    
                                     (0, jsx_runtime.jsxs)("span", {
                                        children: [ 
                                        
                                         (0, jsx_runtime.jsx)("strong", {
                                            "data-text": "item-title",
                                            children: guide.title
                                        }), 
                                        
                                         (0, jsx_runtime.jsx)("small", {
                                            "data-text": "caption",
                                            children: guide.description
                                        }) ]
                                    }), 
                                    
                                     (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                                        name: "arrow",
                                        size: 22
                                    }) ]
                                }, guide.id)))
                            }), 
                            
                             (0, jsx_runtime.jsx)("div", {
                                className: "visit-hover-rail",
                                "aria-hidden": "true",
                                children:   (0, jsx_runtime.jsx)("div", {
                                    "data-text": "body",
                                    className: "visit-hover-preview",
                                    children: visitGuides.map((guide => /* eslint-disable-next-line @next/next/no-img-element */  /* eslint-disable-next-line @next/next/no-img-element */  (0, 
                                    jsx_runtime.jsx)("img", {
                                        src: "/v5/assets/images/".concat(guide.image),
                                        alt: "",
                                        width: guide.width,
                                        height: guide.height,
                                        loading: "lazy",
                                        "data-visit-hover-image": guide.id,
                                        "data-visit-kind": guide.kind,
                                        className: activeVisitId === guide.id ? "is-active" : ""
                                    }, guide.id)))
                                })
                            }) ]
                        }) ]
                    }) ]
                }), 
                
                 (0, jsx_runtime.jsxs)("section", {
                    className: "home-news container",
                    id: "sejong-news",
                    "data-home-anchor": true,
                    "aria-labelledby": "news-heading",
                    children: [ 
                    
                     (0, jsx_runtime.jsxs)("div", {
                        className: "section-heading",
                        children: [ 
                        
                         (0, jsx_runtime.jsxs)("div", {
                            children: [ 
                            
                             (0, jsx_runtime.jsx)("p", {
                                "data-text": "label",
                                className: "home-section-label",
                                children: "새로운 소식"
                            }), 
                            
                             (0, jsx_runtime.jsx)("h2", {
                                "data-text": "heading",
                                id: "news-heading",
                                children: "소식과 참여"
                            }), 
                            
                             (0, jsx_runtime.jsx)("p", {
                                "data-text": "body",
                                className: "section-description",
                                children: "공지와 티켓오픈, 대관공고 소식."
                            }) ]
                        }), 
                        
                         (0, jsx_runtime.jsxs)(api_link["default"], {
                            "data-text": "action",
                            href: "/news",
                            className: "text-link",
                            id: "home-news-all",
                            "data-home-anchor": true,
                            children: [ "소식 전체 보기 ", 
                            
                             (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                                name: "arrow",
                                size: 20
                            }) ]
                        }) ]
                    }), 
                    
                     (0, jsx_runtime.jsxs)("div", {
                        className: "home-news-layout",
                        children: [ 
                        
                         (0, jsx_runtime.jsxs)("div", {
                            children: [ 
                            
                             (0, jsx_runtime.jsx)("div", {
                                "data-text": "body",
                                className: "home-news-filters",
                                id: "home-news-filters",
                                "data-home-anchor": true,
                                role: "group",
                                "aria-label": "소식 분류",
                                children: newsCategories.map((cat =>   (0, jsx_runtime.jsx /* SystemFilterButton */)(SystemPrimitives.BV, {
                                    "data-text": "action",
                                    selected: newsCategory === cat,
                                    id: "home-news-category-".concat(newsCategoryIds[cat]),
                                    "data-home-anchor": true,
                                    type: "button",
                                    onClick: () => {
                                        setAnchorNoticeId("");
                                        setNewsCategory(cat);
                                    },
                                    "aria-pressed": newsCategory === cat,
                                    children: cat
                                }, cat)))
                            }), 
                            
                             (0, jsx_runtime.jsx)("div", {
                                "data-text": "body",
                                className: "news-editorial-list",
                                id: "home-news-results",
                                "data-home-anchor": true,
                                children: filteredNotices.map((notice =>   (0, jsx_runtime.jsxs)(api_link["default"], {
                                    "data-text": "action",
                                    href: "/news/notices/".concat(notice.id),
                                    id: "home-notice-".concat(notice.id),
                                    "data-home-anchor": true,
                                    children: [ 
                                    
                                     (0, jsx_runtime.jsx /* SystemBadge */)(SystemPrimitives.WT, {
                                        "data-text": "caption",
                                        appearance: "plain",
                                        className: "news-category",
                                        children: notice.category
                                    }), 
                                    
                                     (0, jsx_runtime.jsx)("h3", {
                                        "data-text": "subheading",
                                        children: notice.title
                                    }), 
                                    
                                     (0, jsx_runtime.jsx)("time", {
                                        "data-text": "meta",
                                        dateTime: notice.date,
                                        children: notice.date.replaceAll("-", ".")
                                    }), 
                                    
                                     (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                                        name: "arrow",
                                        size: 22
                                    }) ]
                                }, notice.id)))
                            }) ]
                        }), 
                        
                         (0, jsx_runtime.jsxs)("aside", {
                            className: "membership-feature",
                            id: "home-membership",
                            "data-home-anchor": true,
                            "aria-labelledby": "membership-heading",
                            children: [ 
                            
                             (0, jsx_runtime.jsx)("p", {
                                "data-text": "label",
                                className: "membership-label",
                                children: "세종 멤버십"
                            }), 
                            
                             (0, jsx_runtime.jsxs)("h3", {
                                "data-text": "subheading",
                                id: "membership-heading",
                                children: [ "다시 찾는 관객을 위한", 
                                
                                 (0, jsx_runtime.jsx)("br", {}), "멤버십 혜택을 확인하세요" ]
                            }), 
                            
                             (0, jsx_runtime.jsxs)("p", {
                                "data-text": "body",
                                children: [ "등급별 예매 할인과 초대 공연 혜택", 
                                
                                 (0, jsx_runtime.jsx)("br", {}), "지금 확인해 보세요." ]
                            }), 
                            
                             (0, jsx_runtime.jsxs)(api_link["default"], {
                                "data-text": "action",
                                className: "text-link",
                                href: "/news/membership",
                                id: "home-membership-details",
                                "data-home-anchor": true,
                                children: [ "멤버십 알아보기 ", 
                                
                                 (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                                    name: "arrow",
                                    size: 22
                                }) ]
                            }) ]
                        }) ]
                    }), 
                    
                     (0, jsx_runtime.jsxs)("nav", {
                        className: "home-participation",
                        id: "home-participation",
                        "data-home-anchor": true,
                        "aria-label": "문화예술 참여",
                        children: [ 
                        
                         (0, jsx_runtime.jsxs)(api_link["default"], {
                            "data-text": "action",
                            href: "/news/events",
                            id: "home-participation-events",
                            "data-home-anchor": true,
                            children: [ 
                            
                             (0, jsx_runtime.jsxs)("span", {
                                children: [ 
                                
                                 (0, jsx_runtime.jsx)("strong", {
                                    "data-text": "item-title",
                                    children: "이벤트"
                                }), 
                                
                                 (0, jsx_runtime.jsx)("small", {
                                    "data-text": "caption",
                                    children: "진행 중인 이벤트와 당첨자 발표"
                                }) ]
                            }), 
                            
                             (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                                name: "arrow",
                                size: 22
                            }) ]
                        }), 
                        
                         (0, jsx_runtime.jsxs)(api_link["default"], {
                            "data-text": "action",
                            href: "/news/newsletter",
                            id: "home-participation-newsletter",
                            "data-home-anchor": true,
                            children: [ 
                            
                             (0, jsx_runtime.jsxs)("span", {
                                children: [ 
                                
                                 (0, jsx_runtime.jsx)("strong", {
                                    "data-text": "item-title",
                                    children: "뉴스레터 · 세종문화N"
                                }), 
                                
                                 (0, jsx_runtime.jsx)("small", {
                                    "data-text": "caption",
                                    children: "공연·전시 소식을 이메일로 받아보세요"
                                }) ]
                            }), 
                            
                             (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                                name: "arrow",
                                size: 22
                            }) ]
                        }), 
                        
                         (0, jsx_runtime.jsxs)(api_link["default"], {
                            "data-text": "action",
                            href: "/about/donation",
                            id: "home-participation-donation",
                            "data-home-anchor": true,
                            children: [ 
                            
                             (0, jsx_runtime.jsxs)("span", {
                                children: [ 
                                
                                 (0, jsx_runtime.jsx)("strong", {
                                    "data-text": "item-title",
                                    children: "문화예술 후원"
                                }), 
                                
                                 (0, jsx_runtime.jsx)("small", {
                                    "data-text": "caption",
                                    children: "후원 방법과 참여 안내"
                                }) ]
                            }), 
                            
                             (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                                name: "arrow",
                                size: 22
                            }) ]
                        }) ]
                    }) ]
                }), 
                
                 (0, jsx_runtime.jsxs)("section", {
                    className: "home-identity",
                    id: "our-identity",
                    "data-home-anchor": true,
                    "aria-labelledby": "identity-heading",
                    children: [ 
                    
                     (0, jsx_runtime.jsxs)("div", {
                        className: "container identity-layout",
                        children: [ 
                        
                         (0, jsx_runtime.jsxs)("div", {
                            children: [ 
                            
                             (0, jsx_runtime.jsxs)("h2", {
                                "data-text": "heading",
                                id: "identity-heading",
                                children: [ "광화문의 문화공간", 
                                
                                 (0, jsx_runtime.jsx)("br", {}), "세종문화회관" ]
                            }), 
                            
                             (0, jsx_runtime.jsxs)("p", {
                                "data-text": "body",
                                className: "identity-description",
                                children: [ "1978년 문을 연 공연장과 전시장에서", 
                                
                                 (0, jsx_runtime.jsx)("br", {}), "공연과 전시, 예술교육을 만나세요." ]
                            }), 
                            
                             (0, jsx_runtime.jsxs)(api_link["default"], {
                                "data-text": "action",
                                className: "identity-link",
                                href: "/about",
                                id: "home-identity-about",
                                "data-home-anchor": true,
                                children: [ "세종문화회관을 소개합니다 ", 
                                
                                 (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                                    name: "arrow",
                                    size: 23
                                }) ]
                            }) ]
                        }), 
                        
                         (0, jsx_runtime.jsxs)(api_link["default"], {
                            "data-text": "action",
                            href: "/about/introduction/ci",
                            id: "home-identity-marks",
                            "data-home-anchor": true,
                            className: "identity-composition",
                            "aria-label": "천지인 색상과 세종문화회관의 아이덴티티 알아보기",
                            children: [ 
                            
                             (0, jsx_runtime.jsxs)("div", {
                                className: "identity-channel channel-sky",
                                id: "home-identity-sky",
                                "data-home-anchor": true,
                                children: [ 
                                
                                 (0, jsx_runtime.jsx)("i", {}), 
                                
                                 (0, jsx_runtime.jsxs)("span", {
                                    "data-text": "body",
                                    children: [ "天", 
                                    
                                     (0, jsx_runtime.jsx)("span", {
                                        "data-text": "body",
                                        children: "하늘"
                                    }) ]
                                }) ]
                            }), 
                            
                             (0, jsx_runtime.jsxs)("div", {
                                className: "identity-channel channel-earth",
                                id: "home-identity-earth",
                                "data-home-anchor": true,
                                children: [ 
                                
                                 (0, jsx_runtime.jsx)("i", {}), 
                                
                                 (0, jsx_runtime.jsxs)("span", {
                                    "data-text": "body",
                                    children: [ "地", 
                                    
                                     (0, jsx_runtime.jsx)("span", {
                                        "data-text": "body",
                                        children: "땅"
                                    }) ]
                                }) ]
                            }), 
                            
                             (0, jsx_runtime.jsxs)("div", {
                                className: "identity-channel channel-human",
                                id: "home-identity-human",
                                "data-home-anchor": true,
                                children: [ 
                                
                                 (0, jsx_runtime.jsx)("i", {}), 
                                
                                 (0, jsx_runtime.jsxs)("span", {
                                    "data-text": "body",
                                    children: [ "人", 
                                    
                                     (0, jsx_runtime.jsx)("span", {
                                        "data-text": "body",
                                        children: "사람"
                                    }) ]
                                }) ]
                            }) ]
                        }) ]
                    }), 
                    
                     (0, jsx_runtime.jsxs)("nav", {
                        className: "home-institution-links container",
                        id: "home-institution",
                        "data-home-anchor": true,
                        "aria-label": "기관 이야기",
                        children: [ 
                        
                         (0, jsx_runtime.jsxs)(api_link["default"], {
                            "data-text": "action",
                            href: "/about/companies",
                            id: "home-institution-companies",
                            "data-home-anchor": true,
                            children: [ "서울시예술단 ", 
                            
                             (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                                name: "arrow",
                                size: 20
                            }) ]
                        }), 
                        
                         (0, jsx_runtime.jsxs)(api_link["default"], {
                            "data-text": "action",
                            href: "/about/esg",
                            id: "home-institution-esg",
                            "data-home-anchor": true,
                            children: [ "지속가능한 예술 ", 
                            
                             (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                                name: "arrow",
                                size: 20
                            }) ]
                        }), 
                        
                         (0, jsx_runtime.jsxs)(api_link["default"], {
                            "data-text": "action",
                            href: "/about/disclosure",
                            id: "home-institution-disclosure",
                            "data-home-anchor": true,
                            children: [ "정보공개 ", 
                            
                             (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                                name: "arrow",
                                size: 20
                            }) ]
                        }), 
                        
                         (0, jsx_runtime.jsxs)(api_link["default"], {
                            "data-text": "action",
                            href: "/about/partners",
                            id: "home-institution-partners",
                            "data-home-anchor": true,
                            children: [ "협력과 협찬 ", 
                            
                             (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                                name: "arrow",
                                size: 20
                            }) ]
                        }) ]
                    }) ]
                }) ]
            });
        }
        /***/    },
    /***/ 563: 
    /***/ function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        "use strict";
        /* harmony export */        __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ Z: function() {
                /* binding */ return ProgramCard;
            }
            /* harmony export */        });
        /* harmony import */        var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7437);
        /* harmony import */        var _SystemPrimitives__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(6983);
        /* harmony import */        var react__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(2265);
        /* harmony import */        var next_link__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(7648);
        /* harmony import */        var _SmallNotificationModal__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(7281);
        /* harmony import */        var _Icon__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(9140);
        /* harmony import */        var _useFavorites__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(2035);
        /* harmony import */        var _src_lib_favorites__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(5592);
        /* harmony import */        var _src_lib_media__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(2110);
        /* harmony import */        var _src_catalog_CatalogProvider__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(7048);
        /* __next_internal_client_entry_do_not_use__ default auto */        function ProgramCard(param) {
            let {program: program} = param;
            const {catalog: catalog} = (0, _src_catalog_CatalogProvider__WEBPACK_IMPORTED_MODULE_8__ /* .useCatalog */ .r)();
            const hasVerifiedSession = catalog.sessions.some((session => session.programId === program.id && session.bookingEnabled && session.sourceState === "verified" && new Date(session.startsAt).valueOf() > Date.now()));
            const isFavorite = (0, _useFavorites__WEBPACK_IMPORTED_MODULE_6__ /* ["default"] */ .Z)().includes(program.id);
            const handleFavorite = async e => {
                e.preventDefault();
                e.stopPropagation();
                try {
                    const {saved: saved} = await (0, _src_lib_favorites__WEBPACK_IMPORTED_MODULE_7__ /* .toggleFavorite */ .mN)(program.id);
                    (0, _SmallNotificationModal__WEBPACK_IMPORTED_MODULE_4__ /* .showSmallNotification */ .VX)(saved ? "관심 프로그램에 저장했어요." : "관심 프로그램에서 삭제했어요.");
                } catch (error) {
                    (0, _SmallNotificationModal__WEBPACK_IMPORTED_MODULE_4__ /* .showSmallNotification */ .VX)(error instanceof Error ? error.message : "관심 프로그램을 저장하지 못했습니다.");
                }
            };
            // 포스터 이미지 경로 안전 취득
                        const imagePath = (0, _src_lib_media__WEBPACK_IMPORTED_MODULE_9__ /* .mediaPath */ .e)(program.image);
            const formatDate = val => String(val || "").replaceAll("-", ".");
             
            return (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("article", {
                "data-component-id": "poster",
                className: "card card--poster program-card",
                "data-card": "poster",
                children: [ 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(next_link__WEBPACK_IMPORTED_MODULE_3__["default"], {
                    "data-text": "action",
                    href: "/programs/".concat(program.id),
                    className: "card-poster-link",
                    draggable: false,
                    "aria-label": "".concat(program.title, " 상세보기"),
                    children: [ 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                        className: "poster-media program-art",
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("img", {
                            src: imagePath,
                            alt: program.image ? program.imageAlt || program.title : "세종문화회관 공간 사진",
                            loading: "lazy",
                            width: 450,
                            height: 600,
                            draggable: false,
                            onError: e => {
                                const target = e.currentTarget;
                                if (!target.dataset.fallback) {
                                    target.dataset.fallback = "true";
                                    target.src = (0, _src_lib_media__WEBPACK_IMPORTED_MODULE_9__ /* .mediaPath */ .e)();
                                }
                            }
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .SystemBadge */)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_1__.WT, {
                            "data-text": "meta",
                            tone: "info",
                            className: "poster-tag",
                            children: program.category || "공연"
                        }) ]
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                        className: "program-card-meta",
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", {
                            "data-text": "body",
                            children: program.genre || program.category
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", {
                            "data-text": "body",
                            children: hasVerifiedSession ? "예약 가능" : "일정 확인"
                        }) ]
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h3", {
                        "data-text": "subheading",
                        children: program.title
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("p", {
                        "data-text": "caption",
                        className: "program-card-date",
                        children: [ formatDate(program.start), " — ", formatDate(program.end) ]
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                        "data-text": "body",
                        className: "program-card-venue",
                        children: program.venue
                    }) ]
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", {
                    className: "card-poster-actions",
                    children:   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .SystemIconButton */)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_1__.MW, {
                        "data-text": "action",
                        variant: isFavorite ? "highlight" : "secondary",
                        type: "button",
                        className: "favorite-button ".concat(isFavorite ? "selected" : ""),
                        onClick: handleFavorite,
                        "aria-pressed": isFavorite,
                        "aria-label": "".concat(program.title, " 관심 프로그램 ").concat(isFavorite ? "해제" : "등록"),
                        children:   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* ["default"] */)(_Icon__WEBPACK_IMPORTED_MODULE_5__.Z, {
                            name: "heart",
                            filled: isFavorite,
                            size: 24
                        })
                    })
                }) ]
            });
        }
        /***/    },
    /***/ 7281: 
    /***/ function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        "use strict";
        /* harmony export */        __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ Rr: function() {
                /* binding */ return SmallNotificationModalHost;
            },
            /* harmony export */ VX: function() {
                /* binding */ return showSmallNotification;
            }
            /* harmony export */        });
        /* unused harmony export default */
        /* harmony import */        var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7437);
        /* harmony import */        var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(2265);
        /* harmony import */        var react_dom__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(4887);
        /* harmony import */        var _LiquidGlass__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(8948);
        /* harmony import */        var _SystemText__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(8519);
        /* __next_internal_client_entry_do_not_use__ default,showSmallNotification,SmallNotificationModalHost auto */
        // [알림소형모달: 비차단 캡슐 / Small notification modal: a nonblocking capsule]
                function SmallNotificationModal(param) {
            let {open: open, message: message, id: id, ...props} = param;
            const [mounted, setMounted] = (0, react__WEBPACK_IMPORTED_MODULE_1__.useState)(false);
            (0, react__WEBPACK_IMPORTED_MODULE_1__.useEffect)((() => setMounted(true)), []);
            if (!mounted) return null;
             
            return (0, react_dom__WEBPACK_IMPORTED_MODULE_2__.createPortal)(  (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* ["default"] */)(_LiquidGlass__WEBPACK_IMPORTED_MODULE_3__.Z, {
                ...props,
                id: id,
                variant: "black",
                className: "toast small-notification-modal".concat(open ? " visible" : ""),
                "data-component": "알림소형모달",
                "data-component-id": "small-notification",
                role: "status",
                "aria-live": "polite",
                "aria-atomic": "true",
                "aria-hidden": !open || undefined,
                children:   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", {
                    ...(0, _SystemText__WEBPACK_IMPORTED_MODULE_4__ /* .textAttributes */ .N)("body"),
                    children: message
                })
            }), document.body);
        }
        function showSmallNotification(message) {
            if (true && message.trim()) window.dispatchEvent(new CustomEvent("sejong-toast", {
                detail: message
            }));
        }
        // [연속 알림은 같은 창에서 3.5초 갱신 / Consecutive notices renew one 3.5-second capsule]
                function SmallNotificationModalHost(param) {
            let {duration: duration = 3500} = param;
            const [notice, setNotice] = (0, react__WEBPACK_IMPORTED_MODULE_1__.useState)({
                open: false,
                message: ""
            });
            (0, react__WEBPACK_IMPORTED_MODULE_1__.useEffect)((() => {
                let timer = 0;
                const show = event => {
                    const message = event.detail;
                    if (typeof message !== "string" || !message.trim()) return;
                    clearTimeout(timer);
                    setNotice({
                        open: true,
                        message: message
                    });
                    timer = window.setTimeout((() => setNotice((current => ({
                        ...current,
                        open: false
                    })))), duration);
                };
                window.addEventListener("sejong-toast", show);
                return () => {
                    clearTimeout(timer);
                    window.removeEventListener("sejong-toast", show);
                };
            }), [ duration ]);
             
            return (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(SmallNotificationModal, {
                id: "toast",
                ...notice,
                "data-component-part": "notification-host",
                "data-component-owner": "small-notification"
            });
        }
        /***/    },
    /***/ 820: 
    /***/ function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        "use strict";
        /* harmony export */        __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ eM: function() {
                /* binding */ return SystemSurface;
            }
            /* harmony export */        });
        /* harmony import */        var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(2265);
        // [의미를 보존하는 공통 표면 / Shared surfaces that preserve native semantics]
        // [배치와 콘텐츠는 소비자가 소유 / Consumers own layout and content]
        // overflow를 숨기지 않아 중첩 조작의 초점과 팝업을 보존합니다.
        // Preserve nested control focus and popups by leaving overflow visible.
                const SystemSurface =   (0, react__WEBPACK_IMPORTED_MODULE_0__.forwardRef)((function SystemSurface(param, ref) {
            let {as: as, variant: variant = "panel", padding: padding = "md", radius: radius = "panel", className: className = "", ...props} = param;
             
            return (0, react__WEBPACK_IMPORTED_MODULE_0__.createElement)(as || "div", {
                ...props,
                ref: ref,
                className: "system-surface ".concat(className).trim(),
                "data-component": "surface",
                "data-component-id": "surface",
                "data-stroke": "inner",
                "data-surface-variant": variant,
                "data-surface-padding": padding,
                "data-surface-radius": radius
            });
        }));
        /* harmony default export */        __webpack_exports__.ZP = SystemSurface;
        /***/    },
    /***/ 8519: 
    /***/ function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        "use strict";
        /* harmony export */        __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ J: function() {
                /* binding */ return SystemText;
            },
            /* harmony export */ N: function() {
                /* binding */ return textAttributes;
            }
            /* harmony export */        });
        /* harmony import */        var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(2265);
        // [래퍼 없이 연결하는 공유 텍스트 속성 / Shared text attributes without an extra wrapper]
                function textAttributes() {
            let variant = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "body", size = arguments.length > 1 ? arguments[1] : void 0;
            return {
                "data-text": variant,
                "data-component-id": "text",
                ...size ? {
                    "data-text-size": size
                } : {}
            };
        }
        // [의미와 표시 역할을 분리한 공유 텍스트 / Shared text with independent semantics and visual roles]
                const SystemText =   (0, react__WEBPACK_IMPORTED_MODULE_0__.forwardRef)((function SystemText(param, ref) {
            let {as: as, variant: variant = "body", size: size, className: className, ...props} = param;
             
            return (0, react__WEBPACK_IMPORTED_MODULE_0__.createElement)(as || "span", {
                ...props,
                ...textAttributes(variant, size),
                ref: ref,
                className: [ "system-text", className ].filter(Boolean).join(" ")
            });
        }));
        /***/    },
    /***/ 2035: 
    /***/ function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        "use strict";
        /* harmony export */        __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ Z: function() {
                /* binding */ return useFavorites;
            }
            /* harmony export */        });
        /* harmony import */        var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(2265);
        /* harmony import */        var _src_lib_favorites__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(5592);
        /* __next_internal_client_entry_do_not_use__ default auto */        function useFavorites() {
            return (0, react__WEBPACK_IMPORTED_MODULE_0__.useSyncExternalStore /* .subscribeFavorites */)(_src_lib_favorites__WEBPACK_IMPORTED_MODULE_1__.pt, _src_lib_favorites__WEBPACK_IMPORTED_MODULE_1__ /* .getFavoriteIds */ .Wk, _src_lib_favorites__WEBPACK_IMPORTED_MODULE_1__ /* .serverFavorites */ .pY);
        }
        /***/    },
    /***/ 5592: 
    /***/ function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        "use strict";
        /* harmony export */        __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ Wk: function() {
                /* binding */ return getFavoriteIds;
            },
            /* harmony export */ mN: function() {
                /* binding */ return toggleFavorite;
            },
            /* harmony export */ pY: function() {
                /* binding */ return serverFavorites;
            },
            /* harmony export */ pt: function() {
                /* binding */ return subscribeFavorites;
            }
            /* harmony export */        });
        /* unused harmony export parseFavorites */
        /* harmony import */        var _supabase_ts__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(5526);
        /* harmony import */        var _account_db_ts__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(5932);
        // [DB가 기준인 관심 공연 / Favorites are backed by the member database]
                const EMPTY = Object.freeze([]);
        let snapshot = EMPTY;
        let identity = "";
        let generation = 0;
        let started = false;
        let loading = Promise.resolve();
        let mutations = Promise.resolve();
        const listeners = new Set;
        let channel = null;
        const notify = () => listeners.forEach((listener => listener()));
        function parseFavorites(raw) {
            try {
                const ids = JSON.parse(raw || "[]");
                return Array.isArray(ids) ? [ ...new Set(ids.filter((id => typeof id === "string" && Boolean(id.trim()))).map((id => id.trim()))) ] : EMPTY;
            } catch (e) {
                return EMPTY;
            }
        }
        const serverFavorites = () => EMPTY;
        const getFavoriteIds = () => snapshot;
        async function loadFavorites(id, version) {
            if (!_supabase_ts__WEBPACK_IMPORTED_MODULE_0__ /* .supabase */ .OQ || !id) return;
            const {data: data, error: error} = await _supabase_ts__WEBPACK_IMPORTED_MODULE_0__ /* .supabase */ .OQ.from(_account_db_ts__WEBPACK_IMPORTED_MODULE_1__ /* .MEMBER_TABLES */ .Rl.favorites).select("program_id").eq("user_id", id);
            if (error) throw new Error("관심 프로그램을 불러오지 못했습니다.");
            if (generation !== version || identity !== id) return;
            snapshot = data.map((row => row.program_id));
            notify();
        }
        function start() {
            if (started || "object" === "undefined") return;
            started = true;
            const changeIdentity = id => {
                const version = ++generation;
                identity = id;
                snapshot = EMPTY;
                notify();
                loading = loadFavorites(id, version);
                void loading.catch((() => {}));
            };
            _supabase_ts__WEBPACK_IMPORTED_MODULE_0__ /* .supabase */ .OQ === null || _supabase_ts__WEBPACK_IMPORTED_MODULE_0__ /* .supabase */ .OQ === void 0 ? void 0 : _supabase_ts__WEBPACK_IMPORTED_MODULE_0__ /* .supabase */ .OQ.auth.onAuthStateChange(((_event, session) => {
                if (((session === null || session === void 0 ? void 0 : session.user.id) || "") !== identity) changeIdentity((session === null || session === void 0 ? void 0 : session.user.id) || "");
            }));
            const version = generation;
            void (_supabase_ts__WEBPACK_IMPORTED_MODULE_0__ /* .supabase */ .OQ === null || _supabase_ts__WEBPACK_IMPORTED_MODULE_0__ /* .supabase */ .OQ === void 0 ? void 0 : _supabase_ts__WEBPACK_IMPORTED_MODULE_0__ /* .supabase */ .OQ.auth.getSession().then((param => {
                let {data: data} = param;
                var _data_session;
                if (version === generation) changeIdentity(((_data_session = data.session) === null || _data_session === void 0 ? void 0 : _data_session.user.id) || "");
            })));
            if (typeof BroadcastChannel !== "undefined") {
                channel = new BroadcastChannel("sejong-member-favorites");
                channel.onmessage = () => {
                    loading = loadFavorites(identity, generation);
                    void loading.catch((() => {}));
                };
            }
        }
        function subscribeFavorites(listener) {
            listeners.add(listener);
            start();
            return () => {
                listeners.delete(listener);
            };
        }
        async function toggleFavorite(id) {
            start();
            const owner = identity;
            const version = generation;
            const assertOwner = () => {
                if (!owner) throw new Error("로그인한 뒤 관심 프로그램을 저장해 주세요.");
                if (identity !== owner || generation !== version) throw new Error("로그인한 계정이 변경되었습니다.");
            };
            const run = async () => {
                assertOwner();
                try {
                    await loading;
                } catch (e) {
                    assertOwner();
                    loading = loadFavorites(owner, version);
                    await loading;
                }
                assertOwner();
                const {client: client, user: user} = await (0, _account_db_ts__WEBPACK_IMPORTED_MODULE_1__ /* .authenticatedMember */ .nw)();
                assertOwner();
                if (owner !== user.id) throw new Error("로그인 상태를 확인한 뒤 다시 눌러 주세요.");
                const saved = !snapshot.includes(id);
                const result = saved ? await client.from(_account_db_ts__WEBPACK_IMPORTED_MODULE_1__ /* .MEMBER_TABLES */ .Rl.favorites).upsert({
                    user_id: user.id,
                    program_id: id
                }, {
                    onConflict: "user_id,program_id"
                }) : await client.from(_account_db_ts__WEBPACK_IMPORTED_MODULE_1__ /* .MEMBER_TABLES */ .Rl.favorites).delete().eq("user_id", user.id).eq("program_id", id);
                if (result.error) throw new Error("관심 프로그램을 저장하지 못했습니다. 다시 시도해 주세요.");
                assertOwner();
                snapshot = saved ? [ ...snapshot, id ] : snapshot.filter((value => value !== id));
                notify();
                channel === null || channel === void 0 ? void 0 : channel.postMessage("updated");
                return {
                    saved: saved,
                    persisted: true
                };
            };
            const result = mutations.then(run, run);
            mutations = result.then((() => undefined), (() => undefined));
            return result;
        }
        /***/    },
    /***/ 2110: 
    /***/ function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        "use strict";
        /* harmony export */        __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ e: function() {
                /* binding */ return mediaPath;
            }
            /* harmony export */        });
        // [중복 경로 없는 로컬 이미지 / One canonical path for local media]
                function mediaPath(source) {
            return "/v5/" + (source || "assets/images/sejong-grand-interior.png").replace(/^\/?(?:v5\/)?/, "");
        }
        /***/    }
}, 
/******/ function(__webpack_require__) {
    // webpackRuntimeModules
    /******/ var __webpack_exec__ = function(moduleId) {
        return __webpack_require__(__webpack_require__.s = moduleId);
    }
    /******/;
    __webpack_require__.O(0, [ 0, 762, 648, 369, 498, 663, 854, 971, 117, 744 ], (function() {
        return __webpack_exec__(2395);
    }));
    /******/    var __webpack_exports__ = __webpack_require__.O();
    /******/    _N_E = __webpack_exports__;
    /******/} ]);
//# sourceMappingURL=page_1.js.map