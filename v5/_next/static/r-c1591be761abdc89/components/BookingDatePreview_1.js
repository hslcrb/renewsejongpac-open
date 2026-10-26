(self["webpackChunk_N_E"] = self["webpackChunk_N_E"] || []).push([ [ 854 ], {
    /***/ 8954: 
    /***/ function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        "use strict";
        // EXPORTS
                __webpack_require__.d(__webpack_exports__, {
            Z: function() {
                /* binding */ return components_HeroCompanion;
            }
        });
        // EXTERNAL MODULE: ./node_modules/next/dist/compiled/react/jsx-runtime.js
                var jsx_runtime = __webpack_require__(7437);
        // EXTERNAL MODULE: ./src/catalog/CatalogProvider.tsx + 1 modules
                var CatalogProvider = __webpack_require__(7048);
        // EXTERNAL MODULE: ./node_modules/next/dist/compiled/react/index.js
                var react = __webpack_require__(2265);
        // EXTERNAL MODULE: ./components/Icon.tsx
                var Icon = __webpack_require__(9140);
        // EXTERNAL MODULE: ./components/LiquidGlass.tsx + 1 modules
                var LiquidGlass = __webpack_require__(8948);
        // EXTERNAL MODULE: ./src/catalog/snapshot.ts + 1 modules
                var snapshot = __webpack_require__(2554);
        // CONCATENATED MODULE: ./src/data/ticket-openings.ts
        const TICKET_OPENINGS = snapshot.CATALOG_SNAPSHOT.ticketOpenings;
        const TICKET_OPENINGS_URL = "https://www.sejongpac.or.kr/portal/bbs/B0000049/list.do?menuNo=200440";
        // CONCATENATED MODULE: ./src/lib/ticket-openings.ts
        const clock = new Intl.DateTimeFormat("en-GB", {
            timeZone: "Asia/Seoul",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hourCycle: "h23"
        });
        const date = new Intl.DateTimeFormat("ko-KR", {
            timeZone: "Asia/Seoul",
            month: "2-digit",
            day: "2-digit",
            weekday: "short"
        });
        // [기기가 어디에 있든 서울 시각으로 / Seoul time independent of the visitor's timezone]
                function seoulClock(now) {
            return clock.format(now);
        }
        function openingDateLabel(opensAt) {
            return "".concat(date.format(new Date(opensAt)), " ").concat(clock.format(new Date(opensAt)).slice(0, 5));
        }
        function upcomingTicketOpenings(entries, now) {
            if (!Number.isFinite(now)) return [];
            return entries.filter((item => Date.parse(item.opensAt) > now)).sort(((a, b) => Date.parse(a.opensAt) - Date.parse(b.opensAt)));
        }
        function openingDayLabel(opensAt, now) {
            const opening = Date.parse(opensAt);
            if (opening <= now) return "예매 오픈";
            const seoulDay = timestamp => Math.floor((timestamp + 9 * 36e5) / 864e5);
            const days = seoulDay(opening) - seoulDay(now);
            return days === 0 ? "오늘 오픈" : "D-".concat(days);
        }
        // CONCATENATED MODULE: ./components/HeroCompanion.tsx
        /* __next_internal_client_entry_do_not_use__ default auto */
        // [작품 옆의 예매 정보 / Booking information beside the featured work]
        // 실시간 시계만 독립적으로 갱신하고 목록은 공식 공지로 연결합니다.
        // Update the clock independently and link each release to its official announcement.
        function HeroCompanion() {
            const {catalog: catalog} = (0, CatalogProvider /* useCatalog */ .r)();
            const TICKET_OPENINGS = catalog.ticketOpenings;
            const [now, setNow] = (0, react.useState)(null);
            (0, react.useEffect)((() => {
                let timer;
                const refresh = () => setNow(Date.now());
                const resume = () => {
                    clearInterval(timer);
                    if (!document.hidden) {
                        refresh();
                        timer = setInterval(refresh, 1e3);
                    }
                };
                resume();
                document.addEventListener("visibilitychange", resume);
                return () => {
                    clearInterval(timer);
                    document.removeEventListener("visibilitychange", resume);
                };
            }), []);
            const next = now === null ? null : upcomingTicketOpenings(TICKET_OPENINGS, now)[0];
            const calendarDate = now === null ? "서울 기준" : new Intl.DateTimeFormat("ko-KR", {
                timeZone: "Asia/Seoul",
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "short"
            }).format(now);
             
            return (0, jsx_runtime.jsxs)("aside", {
                "data-component-id": "hero-companion",
                className: "hero-companion",
                "aria-label": "티켓오픈과 현재 시각",
                children: [ 
                
                 (0, jsx_runtime.jsxs)("section", {
                    className: "hero-release-list",
                    "aria-labelledby": "hero-release-heading",
                    children: [ 
                    
                     (0, jsx_runtime.jsxs)("div", {
                        className: "hero-companion-heading",
                        children: [ 
                        
                         (0, jsx_runtime.jsx)("h2", {
                            "data-text": "heading",
                            id: "hero-release-heading",
                            children: "티켓오픈"
                        }), 
                        
                         (0, jsx_runtime.jsx)("a", {
                            "data-text": "action",
                            href: TICKET_OPENINGS_URL,
                            target: "_blank",
                            rel: "noreferrer",
                            className: "hero-companion-more",
                            "aria-label": "티켓오픈 전체 안내 (새 창)",
                            children:   (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                                name: "plus",
                                size: 24
                            })
                        }) ]
                    }), 
                    
                     (0, jsx_runtime.jsx)("ul", {
                        children: TICKET_OPENINGS.map((item =>   (0, jsx_runtime.jsx)("li", {
                            "data-text": "body",
                            children:   (0, jsx_runtime.jsxs)("a", {
                                "data-text": "action",
                                href: item.href,
                                target: "_blank",
                                rel: "noreferrer",
                                children: [ 
                                
                                 (0, jsx_runtime.jsx)("strong", {
                                    "data-text": "item-title",
                                    children: item.title
                                }), 
                                
                                 (0, jsx_runtime.jsxs)("span", {
                                    className: "hero-release-meta",
                                    children: [ 
                                    
                                     (0, jsx_runtime.jsx)("time", {
                                        "data-text": "meta",
                                        dateTime: item.opensAt,
                                        children: openingDateLabel(item.opensAt)
                                    }), 
                                    
                                     (0, jsx_runtime.jsx)("span", {
                                        "data-text": "body",
                                        children: now === null ? "오픈 안내" : openingDayLabel(item.opensAt, now)
                                    }) ]
                                }) ]
                            })
                        }, item.id)))
                    }) ]
                }), 
                
                 (0, jsx_runtime.jsxs /* default */)(LiquidGlass.Z, {
                    className: "hero-time-glass",
                    variant: "hero",
                    children: [ 
                    
                     (0, jsx_runtime.jsxs)("div", {
                        className: "hero-clock-heading",
                        children: [ 
                        
                         (0, jsx_runtime.jsx)("span", {
                            "data-text": "body",
                            children: "현재 시각 · 서울"
                        }), 
                        
                         (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                            name: "clock",
                            size: 22
                        }) ]
                    }), 
                    
                     (0, jsx_runtime.jsx)("time", {
                        "data-text": "meta",
                        className: "hero-clock",
                        dateTime: now === null ? undefined : new Date(now).toISOString(),
                        "aria-label": now === null ? "현재 시각 확인 중" : "서울 현재 시각 ".concat(seoulClock(now)),
                        children: now === null ? "--:--:--" : seoulClock(now)
                    }), 
                    
                     (0, jsx_runtime.jsx)("p", {
                        "data-text": "caption",
                        className: "hero-clock-date",
                        children: calendarDate
                    }), 
                    
                     (0, jsx_runtime.jsxs)("div", {
                        "data-text": "body",
                        className: "hero-next-release",
                        children: [ 
                        
                         (0, jsx_runtime.jsxs)("p", {
                            "data-text": "body",
                            children: [ "다음 티켓오픈 ", 
                            
                             (0, jsx_runtime.jsx)("span", {
                                "data-text": "body",
                                children: next && now !== null ? openingDayLabel(next.opensAt, now) : ""
                            }) ]
                        }), next ?   (0, jsx_runtime.jsxs)("a", {
                            "data-text": "action",
                            href: next.href,
                            target: "_blank",
                            rel: "noreferrer",
                            "aria-label": "".concat(next.title, " 티켓오픈 안내 (새 창)"),
                            children: [ 
                            
                             (0, jsx_runtime.jsx)("time", {
                                "data-text": "meta",
                                dateTime: next.opensAt,
                                children: openingDateLabel(next.opensAt)
                            }), 
                            
                             (0, jsx_runtime.jsxs)("span", {
                                children: [ 
                                
                                 (0, jsx_runtime.jsx)("span", {
                                    "data-text": "body",
                                    children: next.title
                                }), 
                                
                                 (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                                    name: "diagonal",
                                    size: 20
                                }) ]
                            }) ]
                        }) :   (0, jsx_runtime.jsxs)("a", {
                            "data-text": "action",
                            href: TICKET_OPENINGS_URL,
                            target: "_blank",
                            rel: "noreferrer",
                            children: [ 
                            
                             (0, jsx_runtime.jsx)("strong", {
                                "data-text": "item-title",
                                children: now === null ? "일정을 확인하고 있어요" : "새로운 오픈 일정을 기다려 주세요"
                            }), 
                            
                             (0, jsx_runtime.jsxs)("span", {
                                children: [ 
                                
                                 (0, jsx_runtime.jsx)("span", {
                                    "data-text": "body",
                                    children: "전체 티켓오픈 안내"
                                }), 
                                
                                 (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                                    name: "diagonal",
                                    size: 20
                                }) ]
                            }) ]
                        }) ]
                    }) ]
                }) ]
            });
        }
        /* harmony default export */        var components_HeroCompanion =   (0, react.memo)(HeroCompanion);
        /***/    },
    /***/ 9391: 
    /***/ function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        "use strict";
        /* harmony export */        __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ Z: function() {
                /* binding */ return HeroSlide;
            }
            /* harmony export */        });
        /* harmony import */        var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7437);
        /* harmony import */        var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(2265);
        /* harmony import */        var _Icon__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(9140);
        /* harmony import */        var _SystemPrimitives__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(6983);
        /* harmony import */        var _src_lib_media__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(2110);
        /* __next_internal_client_entry_do_not_use__ default auto */
        // [작품 중심 히어로의 공통 규격 / Shared artwork-led hero slide]
                function HeroSlide(param) {
            let {feature: feature, active: active, entering: entering = false, preview: preview, onSelect: onSelect, layout: layout = "with-companion", idPrefix: idPrefix = "home-feature"} = param;
             
            return (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("article", {
                className: "card card--hero season-slide season-".concat(feature.theme).concat(active ? " is-active" : "").concat(entering ? " is-entering" : ""),
                "data-card": "hero",
                "data-component": "HeroSlide",
                "data-component-id": "hero-slide",
                "data-layout": layout,
                "data-feature": feature.id,
                "data-preview": preview,
                id: active ? "".concat(idPrefix, "-").concat(feature.id) : undefined,
                "data-home-anchor": active ? "" : undefined,
                "aria-hidden": !active && !preview,
                children:   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                    "data-text": "body",
                    className: "season-card-link",
                    children: [ 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("img", {
                        className: "season-image",
                        src: feature.image ? (0, _src_lib_media__WEBPACK_IMPORTED_MODULE_4__ /* .mediaPath */ .e)("assets/images/".concat(feature.image)) : (0, 
                        _src_lib_media__WEBPACK_IMPORTED_MODULE_4__ /* .mediaPath */ .e)(),
                        alt: feature.image && feature.alt ? feature.alt : "세종문화회관 공간 사진",
                        width: 1672,
                        height: 941,
                        draggable: false,
                        loading: active || preview ? "eager" : "lazy",
                        onError: event => {
                            if (event.currentTarget.dataset.fallback) return;
                            event.currentTarget.dataset.fallback = "true";
                            event.currentTarget.src = (0, _src_lib_media__WEBPACK_IMPORTED_MODULE_4__ /* .mediaPath */ .e)();
                            event.currentTarget.alt = "세종문화회관 공간 사진";
                        }
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                        className: "season-copy",
                        "aria-hidden": !active,
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                            "data-text": "label",
                            className: "season-label",
                            children: feature.label
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h2", {
                            "data-text": "heading",
                            "data-text-size": layout === "standalone" ? "hero-standalone" : "hero-with-companion",
                            children: feature.title.split("\n").map(((line, index, lines) =>   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(react__WEBPACK_IMPORTED_MODULE_1__.Fragment, {
                                children: [ line, index < lines.length - 1 &&   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("br", {}) ]
                            }, index)))
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                            "data-text": "body",
                            className: "season-name",
                            children: feature.name
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("p", {
                            "data-text": "caption",
                            className: "season-meta",
                            children: [ feature.date, 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", {
                                "data-text": "body",
                                children: feature.venue
                            }) ]
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                            "data-text": "body",
                            className: "season-description",
                            children: feature.description
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                            className: "season-actions",
                            children: [ 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_3__.SystemLink, {
                                "data-text": "action",
                                variant: "inverse",
                                href: "/programs/".concat(feature.id),
                                tabIndex: active ? 0 : -1,
                                draggable: false,
                                children: [ "상세보기 ", 
                                
                                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* ["default"] */)(_Icon__WEBPACK_IMPORTED_MODULE_2__.Z, {
                                    name: "arrow",
                                    size: 20
                                }) ]
                            }), 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_3__.SystemLink, {
                                "data-text": "action",
                                variant: "inverse-outline",
                                href: "/booking/".concat(feature.id),
                                tabIndex: active ? 0 : -1,
                                draggable: false,
                                children: [ "예매하기 ", 
                                
                                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* ["default"] */)(_Icon__WEBPACK_IMPORTED_MODULE_2__.Z, {
                                    name: "ticket",
                                    size: 20
                                }) ]
                            }) ]
                        }) ]
                    }), preview &&   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs /* .SystemButton */)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_3__.kR, {
                        "data-text": "action",
                        variant: "inverse-quiet",
                        className: "season-peer-title",
                        "aria-label": "".concat(feature.name, " ").concat(preview === "previous" ? "이전" : "다음", " 슬라이드로 보기"),
                        onClick: onSelect,
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* ["default"] */)(_Icon__WEBPACK_IMPORTED_MODULE_2__.Z, {
                            name: preview === "previous" ? "back" : "arrow",
                            size: 24
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("strong", {
                            "data-text": "item-title",
                            children: feature.programTitle
                        }) ]
                    }) ]
                })
            });
        }
        /***/    },
    /***/ 1378: 
    /***/ function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        "use strict";
        // EXPORTS
                __webpack_require__.d(__webpack_exports__, {
            w: function() {
                /* binding */ return BookingCalendar;
            },
            J: function() {
                /* binding */ return BookingProgramChoice;
            }
        });
        // EXTERNAL MODULE: ./node_modules/next/dist/compiled/react/jsx-runtime.js
                var jsx_runtime = __webpack_require__(7437);
        // EXTERNAL MODULE: ./node_modules/next/dist/compiled/react/index.js
                var react = __webpack_require__(2265);
        // EXTERNAL MODULE: ./node_modules/next/dist/compiled/react-dom/index.js
                var react_dom = __webpack_require__(4887);
        // EXTERNAL MODULE: ./components/Icon.tsx
                var Icon = __webpack_require__(9140);
        // EXTERNAL MODULE: ./components/SystemSurface.tsx
                var SystemSurface = __webpack_require__(820);
        // EXTERNAL MODULE: ./src/lib/media.ts
                var media = __webpack_require__(2110);
        // CONCATENATED MODULE: ./components/BookingDatePreview.tsx
        /* __next_internal_client_entry_do_not_use__ default auto */
        // [선택을 바꾸지 않는 날짜 미리보기 / A date preview that never commits a selection]
        const BookingDatePreview =   (0, react.forwardRef)((function BookingDatePreview(param, ref) {
            let {id: id, label: label, programs: programs, onPointerEnter: onPointerEnter, onPointerLeave: onPointerLeave} = param;
             
            return (0, jsx_runtime.jsx)("aside", {
                ref: ref,
                id: id,
                role: "tooltip",
                className: "booking-date-preview",
                "data-component-part": "booking-date-preview",
                "data-component-owner": "booking-calendar",
                onPointerEnter: onPointerEnter,
                onPointerLeave: onPointerLeave,
                children:   (0, jsx_runtime.jsxs /* default */)(SystemSurface.ZP, {
                    variant: "elevated",
                    padding: "sm",
                    className: "booking-date-preview-surface",
                    children: [ 
                    
                     (0, jsx_runtime.jsxs)("header", {
                        className: "booking-date-preview-heading",
                        children: [ 
                        
                         (0, jsx_runtime.jsx)("strong", {
                            "data-text": "item-title",
                            children: label
                        }), 
                        
                         (0, jsx_runtime.jsxs)("span", {
                            "data-text": "meta",
                            children: [ programs.length, "개 프로그램" ]
                        }) ]
                    }), programs.length ?   (0, jsx_runtime.jsx)("ul", {
                        className: "booking-date-preview-list",
                        children: programs.slice(0, 3).map((program =>   (0, jsx_runtime.jsxs)("li", {
                            children: [ 
                            
                             (0, jsx_runtime.jsx)("img", {
                                src: (0, media /* mediaPath */ .e)(program.image),
                                alt: "",
                                width: 54,
                                height: 72,
                                onError: event => {
                                    if (event.currentTarget.dataset.fallback) return;
                                    event.currentTarget.dataset.fallback = "true";
                                    event.currentTarget.src = (0, media /* mediaPath */ .e)();
                                }
                            }), 
                            
                             (0, jsx_runtime.jsxs)("div", {
                                children: [ 
                                
                                 (0, jsx_runtime.jsx)("span", {
                                    "data-text": "meta",
                                    children: program.category
                                }), 
                                
                                 (0, jsx_runtime.jsx)("strong", {
                                    "data-text": "label",
                                    children: program.title
                                }), 
                                
                                 (0, jsx_runtime.jsx)("span", {
                                    "data-text": "meta",
                                    children: program.venue
                                }) ]
                            }) ]
                        }, program.id)))
                    }) :   (0, jsx_runtime.jsx)("p", {
                        "data-text": "body",
                        className: "booking-date-preview-empty",
                        children: "등록된 프로그램이 없습니다."
                    }), programs.length > 3 &&   (0, jsx_runtime.jsxs)("p", {
                        "data-text": "meta",
                        className: "booking-date-preview-more",
                        children: [ "외 ", programs.length - 3, "개 · 날짜를 선택하면 전체 목록을 볼 수 있습니다." ]
                    }) ]
                })
            });
        }));
        /* harmony default export */        var components_BookingDatePreview = BookingDatePreview;
        // EXTERNAL MODULE: ./components/SystemPrimitives.tsx
                var SystemPrimitives = __webpack_require__(6983);
        // EXTERNAL MODULE: ./src/features/home-domain.ts
                var home_domain = __webpack_require__(4936);
        // CONCATENATED MODULE: ./src/lib/calendar-preview.ts
        // [커서 간격과 화면 가장자리 충돌 / Cursor gap and viewport collision]
        // 표면 크기는 CSS가 제한하고, 위치는 넘칠 때 반대편 또는 가장자리로 조정합니다.
        // CSS constrains the surface size; flip or clamp its position at viewport edges.
        function positionCalendarPreview(anchor, size, viewport) {
            const gap = 18;
            const margin = 12;
            let x = anchor.x + gap;
            let y = anchor.y + gap;
            if (x + size.width > viewport.width - margin) x = anchor.x - size.width - gap;
            if (y + size.height > viewport.height - margin) {
                const above = anchor.y - size.height - gap;
                y = above >= margin ? above : viewport.height - size.height - margin;
            }
            return {
                x: Math.max(margin, Math.min(x, viewport.width - size.width - margin)),
                y: Math.max(margin, Math.min(y, viewport.height - size.height - margin))
            };
        }
        // CONCATENATED MODULE: ./components/HomeBookingControls.tsx
        /* __next_internal_client_entry_do_not_use__ BookingCalendar,BookingProgramChoice auto */
        // [일곱 열을 유지하는 달력 / A calendar retaining its seven-column spatial layout]
        // 날짜 셀은 좁은 화면의 공간 관계를 보존하는 등록된 특수 조작입니다.
        // Date cells are registered spatial controls, preserving the narrow-screen grid.
        function BookingCalendar(param) {
            let {month: month, selectedDate: selectedDate, today: today, programs: programs, dateLabel: dateLabel, onMonthChange: onMonthChange, onDateChange: onDateChange} = param;
            const previewId = (0, react.useId)();
            const previewRef = (0, react.useRef)(null);
            const anchor = (0, react.useRef)({
                x: 0,
                y: 0
            });
            const frame = (0, react.useRef)(0);
            const dismissal = (0, react.useRef)();
            const [preview, setPreview] = (0, react.useState)(null);
            const cancelDismissal = (0, react.useCallback)((() => clearTimeout(dismissal.current)), []);
            const closePreview = (0, react.useCallback)((() => {
                cancelDismissal();
                setPreview(null);
            }), [ cancelDismissal ]);
            const deferDismissal = () => {
                cancelDismissal();
                dismissal.current = setTimeout(closePreview, 160);
            };
            const positionPreview = (0, react.useCallback)((() => {
                const element = previewRef.current;
                if (!element) return;
                const bounds = element.getBoundingClientRect();
                const point = positionCalendarPreview(anchor.current, bounds, {
                    width: window.innerWidth,
                    height: window.innerHeight
                });
                element.style.transform = "translate3d(".concat(point.x, "px, ").concat(point.y, "px, 0)");
            }), []);
            const movePreview = (x, y) => {
                anchor.current = {
                    x: x,
                    y: y
                };
                if (!frame.current) frame.current = requestAnimationFrame((() => {
                    frame.current = 0;
                    positionPreview();
                }));
            };
            // [비차단 미리보기의 수명과 해제 / Nonblocking preview lifecycle and dismissal]
                        (0, react.useLayoutEffect)((() => {
                if (!preview || !previewRef.current) return;
                positionPreview();
                // 웹폰트와 콘텐츠가 늦게 자리 잡아도 화면 안의 위치를 다시 계산합니다.
                // Recheck viewport collisions after web fonts or content change the card size.
                                const observer = new ResizeObserver(positionPreview);
                observer.observe(previewRef.current);
                return () => observer.disconnect();
            }), [ preview, programs, positionPreview ]);
            (0, react.useEffect)(closePreview, [ month, closePreview ]);
            (0, react.useEffect)((() => {
                if (!preview) return;
                const escape = event => {
                    if (event.key !== "Escape") return;
                    event.preventDefault();
                    event.stopPropagation();
                    closePreview();
                };
                const scroll = event => {
                    var _previewRef_current;
                    if (event.target instanceof Node && ((_previewRef_current = previewRef.current) === null || _previewRef_current === void 0 ? void 0 : _previewRef_current.contains(event.target))) return;
                    closePreview();
                };
                window.addEventListener("keydown", escape, true);
                window.addEventListener("scroll", scroll, true);
                window.addEventListener("resize", closePreview);
                return () => {
                    window.removeEventListener("keydown", escape, true);
                    window.removeEventListener("scroll", scroll, true);
                    window.removeEventListener("resize", closePreview);
                };
            }), [ preview, closePreview ]);
            (0, react.useEffect)((() => () => {
                clearTimeout(dismissal.current);
                cancelAnimationFrame(frame.current);
            }), []);
             
            return (0, jsx_runtime.jsxs)("div", {
                "data-text": "body",
                className: "quick-calendar",
                id: "home-booking-calendar",
                "data-home-anchor": true,
                "data-component": "BookingCalendar",
                "data-component-id": "booking-calendar",
                children: [ 
                
                 (0, jsx_runtime.jsxs)("div", {
                    className: "quick-calendar-heading",
                    children: [ 
                    
                     (0, jsx_runtime.jsx)("h3", {
                        "data-text": "subheading",
                        id: "quick-month",
                        "aria-live": "polite",
                        children: month.replace("-", ". ")
                    }), 
                    
                     (0, jsx_runtime.jsxs)("div", {
                        className: "quick-month-controls",
                        children: [ 
                        
                         (0, jsx_runtime.jsx /* SystemIconButton */)(SystemPrimitives.MW, {
                            "data-text": "action",
                            id: "home-booking-previous-month",
                            onClick: () => onMonthChange((0, home_domain /* moveMonth */ .DT)(month, -1)),
                            "aria-label": "이전 달",
                            children:   (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                                name: "back",
                                size: 20
                            })
                        }), 
                        
                         (0, jsx_runtime.jsx /* SystemButton */)(SystemPrimitives.kR, {
                            "data-text": "action",
                            variant: "quiet",
                            id: "home-booking-today",
                            onClick: () => {
                                onMonthChange(today.slice(0, 7));
                                onDateChange(today);
                            },
                            children: "오늘"
                        }), 
                        
                         (0, jsx_runtime.jsx /* SystemIconButton */)(SystemPrimitives.MW, {
                            "data-text": "action",
                            id: "home-booking-next-month",
                            onClick: () => onMonthChange((0, home_domain /* moveMonth */ .DT)(month, 1)),
                            "aria-label": "다음 달",
                            children:   (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                                name: "arrow",
                                size: 20
                            })
                        }) ]
                    }) ]
                }), 
                
                 (0, jsx_runtime.jsx)("div", {
                    "data-text": "body",
                    className: "quick-native-date",
                    children:   (0, jsx_runtime.jsx /* SystemField */)(SystemPrimitives.RK, {
                        type: "date",
                        label: "관람 날짜",
                        value: selectedDate,
                        onChange: event => {
                            const date = event.currentTarget.value;
                            if (date) onMonthChange(date.slice(0, 7));
                            onDateChange(date);
                        }
                    })
                }), 
                
                 (0, jsx_runtime.jsx)("div", {
                    "data-text": "body",
                    className: "quick-calendar-week",
                    "aria-hidden": "true",
                    children: [ "일", "월", "화", "수", "목", "금", "토" ].map((day =>   (0, jsx_runtime.jsx)("span", {
                        "data-text": "body",
                        children: day
                    }, day)))
                }), 
                
                 (0, jsx_runtime.jsx)("div", {
                    "data-text": "body",
                    className: "quick-calendar-grid",
                    role: "group",
                    "aria-labelledby": "quick-month",
                    children: (0, home_domain /* monthDates */ .RG)(month).map(((date, index) => {
                        if (!date)   return (0, jsx_runtime.jsx)("span", {
                            className: "quick-calendar-blank",
                            "aria-hidden": "true"
                        }, "blank-".concat(index));
                        const count = (0, home_domain /* programsForDate */ .jd)([ ...programs ], date).length;
                        const current = date === today;
                        const selected = date === selectedDate;
                         
                        return (0, jsx_runtime.jsxs)("button", {
                            "data-text": "caption",
                            id: "home-booking-date-".concat(date),
                            "data-home-anchor": true,
                            "data-system-part": "calendar-day",
                            type: "button",
                            onClick: () => {
                                closePreview();
                                onDateChange(date);
                            },
                            onPointerEnter: event => {
                                if (event.pointerType === "touch") return;
                                cancelDismissal();
                                anchor.current = {
                                    x: event.clientX,
                                    y: event.clientY
                                };
                                setPreview({
                                    date: date,
                                    source: "pointer"
                                });
                            },
                            onPointerMove: event => {
                                if ((preview === null || preview === void 0 ? void 0 : preview.source) === "pointer" && preview.date === date && event.pointerType !== "touch") movePreview(event.clientX, event.clientY);
                            },
                            onPointerLeave: deferDismissal,
                            onFocus: event => {
                                if (!event.currentTarget.matches(":focus-visible")) return;
                                cancelDismissal();
                                const bounds = event.currentTarget.getBoundingClientRect();
                                anchor.current = {
                                    x: bounds.right,
                                    y: bounds.bottom
                                };
                                setPreview({
                                    date: date,
                                    source: "focus"
                                });
                            },
                            onBlur: deferDismissal,
                            "aria-label": "".concat(dateLabel(date)).concat(current ? ", 오늘" : "", ", ").concat(count ? "".concat(count, "개 프로그램") : "등록된 일정 없음"),
                            "aria-pressed": selected,
                            "aria-current": current ? "date" : undefined,
                            "aria-describedby": (preview === null || preview === void 0 ? void 0 : preview.date) === date ? previewId : undefined,
                            className: "quick-date".concat(selected ? " is-selected" : "").concat(current ? " is-today" : ""),
                            children: [ 
                            
                             (0, jsx_runtime.jsx)("span", {
                                "data-text": "body",
                                children: Number(date.slice(-2))
                            }), count > 0 &&   (0, jsx_runtime.jsx)("i", {
                                "aria-hidden": "true"
                            }) ]
                        }, date);
                    }))
                }), 
                
                 (0, jsx_runtime.jsxs)("p", {
                    "data-text": "body",
                    className: "quick-calendar-key",
                    children: [ 
                    
                     (0, jsx_runtime.jsx)("i", {
                        "aria-hidden": "true"
                    }), "프로그램이 있는 날" ]
                }), preview &&   (0, react_dom.createPortal)(  (0, jsx_runtime.jsx)(components_BookingDatePreview, {
                    ref: previewRef,
                    id: previewId,
                    label: dateLabel(preview.date),
                    programs: (0, home_domain /* programsForDate */ .jd)([ ...programs ], preview.date),
                    onPointerEnter: cancelDismissal,
                    onPointerLeave: deferDismissal
                }), document.body) ]
            });
        }
        // [포스터를 포함한 선택 타일 / Rich selection tile with a program poster]
                function BookingProgramChoice(param) {
            let {program: program, selected: selected, available: available, past: past, onSelect: onSelect} = param;
            var _program_times;
             
            return (0, jsx_runtime.jsxs)("button", {
                "data-text": "action",
                id: "home-booking-program-".concat(program.id),
                "data-home-anchor": true,
                "data-component": "BookingProgramChoice",
                "data-component-id": "booking-choice",
                "data-system-part": "program-choice",
                type: "button",
                className: "quick-program".concat(selected ? " is-selected" : ""),
                onClick: onSelect,
                "aria-pressed": selected,
                disabled: !available,
                children: [ 
                
                 (0, jsx_runtime.jsx)("img", {
                    src: (0, media /* mediaPath */ .e)(program.image),
                    alt: "",
                    width: "90",
                    height: "120",
                    loading: "lazy",
                    onError: event => {
                        if (event.currentTarget.dataset.fallback) return;
                        event.currentTarget.dataset.fallback = "true";
                        event.currentTarget.src = (0, media /* mediaPath */ .e)();
                    }
                }), 
                
                 (0, jsx_runtime.jsxs)("span", {
                    className: "quick-program-copy",
                    children: [ 
                    
                     (0, jsx_runtime.jsxs)("span", {
                        "data-text": "caption",
                        className: "quick-program-category",
                        children: [ program.category, " · ", available ? program.status : past ? "지난 일정" : program.status ]
                    }), 
                    
                     (0, jsx_runtime.jsx)("strong", {
                        "data-text": "item-title",
                        children: program.title
                    }), 
                    
                     (0, jsx_runtime.jsx)("span", {
                        "data-text": "body",
                        children: program.venue
                    }), 
                    
                     (0, jsx_runtime.jsx)("span", {
                        "data-text": "body",
                        children: (_program_times = program.times) === null || _program_times === void 0 ? void 0 : _program_times.join(" · ")
                    }) ]
                }), 
                
                 (0, jsx_runtime.jsx)("span", {
                    "data-text": "body",
                    className: "quick-program-check",
                    "aria-hidden": "true",
                    children: selected ? "✓" : "+"
                }) ]
            });
        }
        /***/    },
    /***/ 3429: 
    /***/ function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        "use strict";
        /* harmony export */        __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ Z: function() {
                /* binding */ return SeasonBanner;
            }
            /* harmony export */        });
        /* harmony import */        var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7437);
        /* harmony import */        var next_link__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(7648);
        /* harmony import */        var _Icon__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(9140);
        /* __next_internal_client_entry_do_not_use__ default auto */
        // [시즌 탐색 배너 / A shared editorial season banner]
                function SeasonBanner(param) {
            let {id: id = "home-season-programs"} = param;
             
            return (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(next_link__WEBPACK_IMPORTED_MODULE_1__["default"], {
                "data-text": "action",
                href: "/programs/season",
                className: "home-season-link",
                id: id,
                "data-home-anchor": true,
                "data-component": "SeasonBanner",
                "data-component-id": "season-banner",
                children: [ 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("span", {
                    children: [ 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("strong", {
                        "data-text": "item-title",
                        children: "한 편에서 시작하는, 나만의 시즌."
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", {
                        "data-text": "body",
                        children: "세종시즌부터 Sync Next까지, 취향을 넓히는 기획 프로그램"
                    }) ]
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("span", {
                    "data-text": "body",
                    children: [ "기획·시즌 살펴보기 ", 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* ["default"] */)(_Icon__WEBPACK_IMPORTED_MODULE_2__.Z, {
                        name: "arrow",
                        size: 22
                    }) ]
                }) ]
            });
        }
        /***/    },
    /***/ 9037: 
    /***/ function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        "use strict";
        // EXPORTS
                __webpack_require__.d(__webpack_exports__, {
            J: function() {
                /* binding */ return SEJONG_QUICK_MENU_ITEMS;
            },
            Z: function() {
                /* binding */ return components_VioletQuickMenu;
            }
        });
        // EXTERNAL MODULE: ./node_modules/next/dist/compiled/react/jsx-runtime.js
                var jsx_runtime = __webpack_require__(7437);
        // EXTERNAL MODULE: ./node_modules/next/dist/compiled/react/index.js
                var react = __webpack_require__(2265);
        // EXTERNAL MODULE: ./node_modules/next/dist/api/link.js
                var api_link = __webpack_require__(7648);
        // EXTERNAL MODULE: ./components/Icon.tsx
                var Icon = __webpack_require__(9140);
        // EXTERNAL MODULE: ./src/data/design-tokens.ts
                var design_tokens = __webpack_require__(1788);
        // CONCATENATED MODULE: ./src/lib/quick-menu-fluid.ts
        const FLUID_SIZE = 400;
        const clampInput = value => Math.max(-1, Math.min(1, value))
        // [입력의 잔향과 일정한 흐름 / Damped input and a steady flow]
        ;
        function stepFluid(state, input, elapsed, now) {
            const {period: period, response: response, maxInput: maxInput} = design_tokens.QUICK_MENU_MATERIAL.motion;
            const dt = Math.min(.05, Math.max(0, elapsed));
            const freshness = input.active ? 1 : Math.exp(-Math.max(0, now - input.lastInput) / 450);
            const follow = 1 - Math.exp(-response * dt);
            state.x += (clampInput(input.x) * maxInput * freshness - state.x) * follow;
            state.y += (clampInput(input.y) * maxInput * freshness - state.y) * follow;
            state.spin += (clampInput(input.spin) * freshness - state.spin) * follow;
            state.phase += dt * (Math.PI * 2 / period + state.spin * .65);
        }
        // [한 번 만든 색 면과 광택 / Cached color fields and soft highlights]
                function createFluidPaint(context, palette) {
            const base = context.createLinearGradient(0, 0, FLUID_SIZE, FLUID_SIZE);
            base.addColorStop(0, palette.mint);
            base.addColorStop(.6, palette.green);
            base.addColorStop(1, palette.mint);
            const yellow = context.createLinearGradient(0, 0, FLUID_SIZE * .8, FLUID_SIZE);
            yellow.addColorStop(0, palette.lemon);
            yellow.addColorStop(.5, palette.yellow);
            yellow.addColorStop(1, palette.lemon);
            const mint = context.createLinearGradient(0, FLUID_SIZE, FLUID_SIZE, 0);
            mint.addColorStop(0, palette.mint);
            mint.addColorStop(1, palette.green);
            const light = context.createRadialGradient(110, 70, 0, 125, 85, 280);
            light.addColorStop(0, palette.light);
            light.addColorStop(1, palette.clear);
            const shade = context.createRadialGradient(170, 145, 130, 200, 200, 210);
            shade.addColorStop(0, palette.clear);
            shade.addColorStop(1, palette.ink);
            return {
                base: base,
                yellow: yellow,
                mint: mint,
                light: light,
                shade: shade
            };
        }
        // [직접 구성한 넓은 물결 / Authored broad wave contours]
        // A few continuous curves replace thousands of individual fibres.
                function drawFluid(context, paint, state) {
            const phase = state.phase;
            const swell = Math.sin(phase) * .095;
            const tide = Math.cos(phase * .85) * .075;
            const curl = Math.sin(phase + 1.4) * .055;
            const x = state.x;
            const y = state.y;
            context.clearRect(0, 0, FLUID_SIZE, FLUID_SIZE);
            context.save();
            context.beginPath();
            context.arc(200, 200, 200, 0, Math.PI * 2);
            context.clip();
            context.fillStyle = paint.base;
            context.fillRect(0, 0, FLUID_SIZE, FLUID_SIZE);
            context.scale(FLUID_SIZE, FLUID_SIZE);
            context.beginPath();
            context.moveTo(-.2, -.2);
            context.lineTo(1.2, -.2);
            context.lineTo(1.2, .24 + tide);
            context.bezierCurveTo(.8 + x, .15 + swell, .73 - x, .9 + y, .31 + curl, .72 + swell);
            context.bezierCurveTo(.06 - x, .61 + tide, .21 + x, .3 + y, -.2, .45 + curl);
            context.closePath();
            context.fillStyle = paint.yellow;
            context.fill();
            context.beginPath();
            context.moveTo(-.2, .79 + tide);
            context.bezierCurveTo(.23 + x, .43 + y, .27 - x, 1.07 - swell, .78, .88 + curl);
            context.bezierCurveTo(.95, .83 + swell, 1.03, .63 + tide, 1.2, .66);
            context.lineTo(1.2, 1.2);
            context.lineTo(-.2, 1.2);
            context.closePath();
            context.fill();
            context.beginPath();
            context.moveTo(.12 + curl, -.2);
            context.bezierCurveTo(-.05 + x, .14 + y, .23 + swell, .4, .51 + tide, .35 + curl);
            context.bezierCurveTo(.74 + x, .3 - swell, .71, -.07, 1, -.2);
            context.closePath();
            context.fillStyle = paint.mint;
            context.globalAlpha = .7;
            context.fill();
            context.restore();
            context.save();
            context.beginPath();
            context.arc(200, 200, 199.5, 0, Math.PI * 2);
            context.clip();
            context.globalAlpha = .24;
            context.fillStyle = paint.light;
            context.fillRect(0, 0, FLUID_SIZE, FLUID_SIZE);
            context.globalAlpha = .11;
            context.fillStyle = paint.shade;
            context.fillRect(0, 0, FLUID_SIZE, FLUID_SIZE);
            context.restore();
        }
        // EXTERNAL MODULE: ./components/VioletQuickMenu.module.css
                var VioletQuickMenu_module = __webpack_require__(5731);
        var VioletQuickMenu_module_default =  __webpack_require__.n(VioletQuickMenu_module);
        // CONCATENATED MODULE: ./components/QuickMenuFluid.tsx
        /* __next_internal_client_entry_do_not_use__ default auto */
        /** Native navigation remains usable with the CSS material if Canvas is unavailable. */ function QuickMenuFluid(param) {
            let {awake: awake, animated: animated, expanded: expanded = false, interaction: interaction} = param;
            const canvasRef = (0, react.useRef)(null);
            const state = (0, react.useRef)({
                phase: .7,
                x: 0,
                y: 0,
                spin: 0
            });
            (0, react.useEffect)((() => {
                if (!awake) return;
                const canvas = canvasRef.current;
                const context = canvas === null || canvas === void 0 ? void 0 : canvas.getContext("2d");
                if (!canvas || !context) return;
                const style = getComputedStyle(canvas);
                const palette = {};
                for (const key of Object.keys(design_tokens.QUICK_MENU_MATERIAL.colors)) {
                    palette[key] = style.getPropertyValue(design_tokens.QUICK_MENU_MATERIAL.colors[key]).trim();
                }
                const modest = window.matchMedia("(pointer: coarse)").matches;
                const ratio = Math.min(window.devicePixelRatio || 1, modest ? 1.5 : 2);
                let paint;
                const interval = 1e3 / (modest ? design_tokens.QUICK_MENU_MATERIAL.motion.mobileFps : design_tokens.QUICK_MENU_MATERIAL.motion.desktopFps);
                let frame = 0;
                let lastDraw = 0;
                let previous = 0;
                const resize = () => {
                    const pixels = Math.max(96, Math.min(800, Math.round((canvas.clientWidth || (expanded ? 370 : 88)) * ratio)));
                    if (canvas.width !== pixels || canvas.height !== pixels) {
                        canvas.width = pixels;
                        canvas.height = pixels;
                    }
                    context.setTransform(pixels / FLUID_SIZE, 0, 0, pixels / FLUID_SIZE, 0, 0);
                    paint = createFluidPaint(context, palette);
                    drawFluid(context, paint, state.current);
                };
                // [보이는 동안만 그리기 / Paint only while visible]
                                const tick = now => {
                    const elapsed = previous ? (now - previous) / 1e3 : 0;
                    previous = now;
                    stepFluid(state.current, interaction.current, elapsed, now);
                    if (now - lastDraw >= interval) {
                        drawFluid(context, paint, state.current);
                        lastDraw = now - (now - lastDraw) % interval;
                    }
                    frame = requestAnimationFrame(tick);
                };
                resize();
                const observer = new ResizeObserver(resize);
                observer.observe(canvas);
                if (animated) frame = requestAnimationFrame(tick);
                return () => {
                    cancelAnimationFrame(frame);
                    observer.disconnect();
                };
            }), [ awake, animated, expanded, interaction ]);
             
            return (0, jsx_runtime.jsx)("canvas", {
                ref: canvasRef,
                className: VioletQuickMenu_module_default().fluid,
                "data-component-part": "quick-menu-fluid",
                "data-component-owner": "quick-menu",
                "data-quick-fluid": expanded ? "expanded" : "resting",
                "aria-hidden": "true"
            });
        }
        // CONCATENATED MODULE: ./components/VioletQuickMenu.tsx
        /* __next_internal_client_entry_do_not_use__ SEJONG_QUICK_MENU_ITEMS,default auto */
        const SEJONG_QUICK_MENU_ITEMS = [ {
            id: "booking",
            label: "빠른 예매",
            href: "#quick-booking",
            icon: "ticket"
        }, {
            id: "programs",
            label: "공연·전시",
            href: "/programs",
            icon: "calendar"
        }, {
            id: "directions",
            label: "오시는 길",
            href: "/visit/directions",
            icon: "pin"
        }, {
            id: "group",
            label: "단체 관람",
            href: "/visit/group",
            icon: "user"
        }, {
            id: "rental",
            label: "대관 안내",
            href: "/rental",
            icon: "building"
        }, {
            id: "account",
            label: "나의 예매",
            href: "/account",
            icon: "heart"
        } ];
        const STEP = 60;
        const radians = degrees => degrees * Math.PI / 180;
        const angleDelta = (from, to) => ((to - from + 540) % 360 + 360) % 360 - 180;
        const selectedAt = rotation => (-Math.round(rotation / STEP) % 6 + 6) % 6;
        function sectorPath(index) {
            const start = radians(-120 + index * STEP);
            const end = start + radians(STEP);
            // Browser and server math libraries can differ in their last binary digits.
                        const point = (radius, angle) => "".concat((200 + Math.cos(angle) * radius).toFixed(3), ",").concat((200 + Math.sin(angle) * radius).toFixed(3));
            return "M ".concat(point(195, start), " A 195,195 0 0 1 ").concat(point(195, end), " L ").concat(point(67, end), " A 67,67 0 0 0 ").concat(point(67, start), " Z");
        }
        function LiquidSurface() {
             
            return (0, jsx_runtime.jsx)("span", {
                className: VioletQuickMenu_module_default().art,
                "aria-hidden": "true"
            });
        }
        /** Non-modal radial navigation for a hero or an inline preview. All destinations are real links. */        function VioletQuickMenu(param) {
            let {placement: placement = "hero", heroId: heroId = "featured-season", items: items = SEJONG_QUICK_MENU_ITEMS, onOpenChange: onOpenChange} = param;
            const menuId = (0, react.useId)();
            const hintId = (0, react.useId)();
            const [visible, setVisible] = (0, react.useState)(false);
            const [open, setOpen] = (0, react.useState)(false);
            const [rotation, setRotation] = (0, react.useState)(0);
            const [dragging, setDragging] = (0, react.useState)(false);
            const [reducedMotion, setReducedMotion] = (0, react.useState)(true);
            const [sleeping, setSleeping] = (0, react.useState)(false);
            const rootRef = (0, react.useRef)(null);
            const dockRef = (0, react.useRef)(null);
            const toggleRef = (0, react.useRef)(null);
            const linksRef = (0, react.useRef)([]);
            const rotationRef = (0, react.useRef)(0);
            const gestureRef = (0, react.useRef)(null);
            const openRef = (0, react.useRef)(false);
            const pinnedRef = (0, react.useRef)(false);
            const hoverBlockedRef = (0, react.useRef)(false);
            const hoverTimer = (0, react.useRef)(null);
            const closeTimer = (0, react.useRef)(null);
            const suppressClickUntil = (0, react.useRef)(0);
            const interaction = (0, react.useRef)({
                x: -.3,
                y: -.5,
                energy: 0,
                velocityX: 0,
                velocityY: 0,
                spin: 0,
                lastInput: 0,
                active: false
            });
            const interactionSurface = (0, react.useRef)(null);
            const selected = selectedAt(rotation);
            const current = items[selected];
            const clearTimers = (0, react.useCallback)((() => {
                if (hoverTimer.current) clearTimeout(hoverTimer.current);
                if (closeTimer.current) clearTimeout(closeTimer.current);
                hoverTimer.current = null;
                closeTimer.current = null;
            }), []);
            const changeRotation = (0, react.useCallback)((value => {
                rotationRef.current = value;
                setRotation(value);
            }), []);
            const finishGesture = (0, react.useCallback)((function() {
                let cancelled = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : false;
                const gesture = gestureRef.current;
                if (!gesture) return;
                gestureRef.current = null;
                interaction.current.active = false;
                setDragging(false);
                if (gesture.dragged) {
                    suppressClickUntil.current = performance.now() + 450;
                    const velocity = performance.now() - gesture.lastTime < 100 ? gesture.velocity : 0;
                    const coast = cancelled || reducedMotion ? 0 : Math.max(-70, Math.min(70, velocity * 110));
                    changeRotation(Math.round((rotationRef.current + coast) / STEP) * STEP);
                }
                if (gesture.capture.hasPointerCapture(gesture.pointerId)) {
                    gesture.capture.releasePointerCapture(gesture.pointerId);
                }
            }), [ changeRotation, reducedMotion ]);
            const closeMenu = (0, react.useCallback)((function() {
                let restoreFocus = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : false, blockHover = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : true;
                var _toggleRef_current;
                clearTimers();
                finishGesture(true);
                openRef.current = false;
                pinnedRef.current = false;
                hoverBlockedRef.current = blockHover;
                interaction.current.active = false;
                interaction.current.velocityX = 0;
                interaction.current.velocityY = 0;
                interaction.current.spin = 0;
                interactionSurface.current = null;
                setOpen(false);
                if (restoreFocus) (_toggleRef_current = toggleRef.current) === null || _toggleRef_current === void 0 ? void 0 : _toggleRef_current.focus({
                    preventScroll: true
                });
            }), [ clearTimers, finishGesture ]);
            const openMenu = function(pinned) {
                let focusLink = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : false;
                clearTimers();
                pinnedRef.current = pinned;
                openRef.current = true;
                setOpen(true);
                if (focusLink) requestAnimationFrame((() => {
                    var _linksRef_current_selectedAt;
                    return (_linksRef_current_selectedAt = linksRef.current[selectedAt(rotationRef.current)]) === null || _linksRef_current_selectedAt === void 0 ? void 0 : _linksRef_current_selectedAt.focus({
                        preventScroll: true
                    });
                }));
            };
            (0, react.useEffect)((() => {
                const observed = placement === "inline" ? rootRef.current : document.getElementById(heroId);
                const root = rootRef.current;
                if (!observed || !root) return;
                const header = placement === "hero" ? document.querySelector(".renewal-header") : null;
                let frame = 0;
                let lastOpacity = -1;
                let lastVisible = null;
                const update = () => {
                    frame = 0;
                    const rect = observed.getBoundingClientRect();
                    const topInset = header ? header.getBoundingClientRect().height : 0;
                    const inView = rect.bottom > topInset && rect.top < window.innerHeight;
                    // Start fading when the hero reaches the header; finish within a short scroll.
                                        const distance = Math.min(180, Math.max(120, rect.height * .25));
                    const opacity = placement === "inline" ? 1 : inView ? Math.min(1, Math.max(0, (rect.top - topInset + distance) / distance)) : 0;
                    const nextVisible = inView && (placement === "inline" || opacity > .001);
                    if (Math.abs(opacity - lastOpacity) > .001) {
                        root.style.setProperty("--hero-opacity", opacity.toFixed(4));
                        lastOpacity = opacity;
                    }
                    // No invisible links can intercept pointer or keyboard input during dismissal.
                                        root.inert = !nextVisible;
                    if (nextVisible !== lastVisible) {
                        lastVisible = nextVisible;
                        setVisible(nextVisible);
                    }
                };
                const schedule = () => {
                    if (!frame) frame = requestAnimationFrame(update);
                };
                update();
                // Event-driven and coalesced: no idle loop or per-scroll React render.
                                window.addEventListener("scroll", schedule, {
                    passive: true
                });
                window.addEventListener("resize", schedule);
                const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);
                observer === null || observer === void 0 ? void 0 : observer.observe(observed);
                if (header) observer === null || observer === void 0 ? void 0 : observer.observe(header);
                return () => {
                    cancelAnimationFrame(frame);
                    window.removeEventListener("scroll", schedule);
                    window.removeEventListener("resize", schedule);
                    observer === null || observer === void 0 ? void 0 : observer.disconnect();
                };
            }), [ heroId, placement ]);
            (0, react.useEffect)((() => {
                // A lost window or changed wheel geometry must not leave a captured drag active.
                const cancel = () => finishGesture(true);
                window.addEventListener("blur", cancel);
                window.addEventListener("resize", cancel);
                return () => {
                    window.removeEventListener("blur", cancel);
                    window.removeEventListener("resize", cancel);
                };
            }), [ finishGesture ]);
            (0, react.useEffect)((() => {
                const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
                const updateMotion = () => setReducedMotion(motion.matches);
                const updateVisibility = () => setSleeping(document.hidden);
                updateMotion();
                updateVisibility();
                motion.addEventListener("change", updateMotion);
                document.addEventListener("visibilitychange", updateVisibility);
                return () => {
                    motion.removeEventListener("change", updateMotion);
                    document.removeEventListener("visibilitychange", updateVisibility);
                };
            }), []);
            (0, react.useEffect)((() => {
                if (!visible || sleeping) closeMenu(); else hoverBlockedRef.current = false;
            }), [ visible, sleeping, closeMenu ]);
            (0, react.useEffect)((() => {
                onOpenChange === null || onOpenChange === void 0 ? void 0 : onOpenChange(open && visible);
            }), [ open, visible, onOpenChange ]);
            (0, react.useEffect)((() => () => {
                clearTimers();
                onOpenChange === null || onOpenChange === void 0 ? void 0 : onOpenChange(false);
            }), [ clearTimers, onOpenChange ]);
            (0, react.useEffect)((() => {
                if (!open) return;
                const outside = event => {
                    var _dockRef_current;
                    if (!((_dockRef_current = dockRef.current) === null || _dockRef_current === void 0 ? void 0 : _dockRef_current.contains(event.target))) closeMenu(false, false);
                };
                document.addEventListener("pointerdown", outside);
                return () => document.removeEventListener("pointerdown", outside);
            }), [ open, closeMenu ]);
            const selectItem = function(index) {
                let focus = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : false;
                var _linksRef_current_index;
                const delta = angleDelta(rotationRef.current, -index * STEP);
                changeRotation(rotationRef.current + delta);
                if (Math.abs(delta) > .01) {
                    interaction.current.spin = Math.max(-.5, Math.min(.5, delta / 120));
                    interaction.current.lastInput = performance.now();
                }
                if (focus) (_linksRef_current_index = linksRef.current[index]) === null || _linksRef_current_index === void 0 ? void 0 : _linksRef_current_index.focus({
                    preventScroll: true
                });
            };
            const onKeyDown = event => {
                if (event.key === "Escape" && open) {
                    event.preventDefault();
                    event.stopPropagation();
                    closeMenu(true);
                    return;
                }
                if (event.altKey || event.ctrlKey || event.metaKey || ![ "ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End" ].includes(event.key)) return;
                event.preventDefault();
                if (!open) {
                    openMenu(true, true);
                    return;
                }
                const focused = linksRef.current.findIndex((link => link === document.activeElement));
                const from = focused >= 0 ? focused : selected;
                const next = event.key === "Home" ? 0 : event.key === "End" ? 5 : (from + (event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1) + 6) % 6;
                pinnedRef.current = true;
                selectItem(next, true);
            };
            const trackSurfacePointer = function(event) {
                let reset = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : false, bounds = arguments.length > 2 ? arguments[2] : void 0;
                if (!event.isPrimary) return;
                const rect = bounds || event.currentTarget.getBoundingClientRect();
                const x = Math.max(-1, Math.min(1, (event.clientX - rect.left) / Math.max(1, rect.width) * 2 - 1));
                const y = Math.max(-1, Math.min(1, (event.clientY - rect.top) / Math.max(1, rect.height) * 2 - 1));
                const now = performance.now();
                const pointer = interaction.current;
                const continuous = !reset && interactionSurface.current === event.currentTarget && now - pointer.lastInput < 120;
                const elapsed = Math.max(8, now - pointer.lastInput);
                const velocityX = continuous ? Math.max(-8, Math.min(8, (x - pointer.x) * 1e3 / elapsed)) : 0;
                const velocityY = continuous ? Math.max(-8, Math.min(8, (y - pointer.y) * 1e3 / elapsed)) : 0;
                pointer.velocityX = continuous ? pointer.velocityX * .4 + velocityX * .6 : 0;
                pointer.velocityY = continuous ? pointer.velocityY * .4 + velocityY * .6 : 0;
                pointer.x = x;
                pointer.y = y;
                pointer.lastInput = now;
                pointer.active = true;
                pointer.energy = Math.min(1, Math.hypot(pointer.velocityX, pointer.velocityY) / 8);
                if (!gestureRef.current) pointer.spin = 0;
                interactionSurface.current = event.currentTarget;
            };
            const onPointerDown = event => {
                if (!event.isPrimary || event.button !== 0 || gestureRef.current || event.target.closest("[data-no-drag]")) return;
                const bounds = event.currentTarget.getBoundingClientRect();
                trackSurfacePointer(event, true, bounds);
                const centerX = bounds.left + bounds.width / 2;
                const centerY = bounds.top + bounds.height / 2;
                const capture = event.target.closest("a") || event.currentTarget;
                // Capturing on the original anchor preserves ordinary taps and modified clicks.
                                capture.setPointerCapture(event.pointerId);
                suppressClickUntil.current = 0;
                gestureRef.current = {
                    pointerId: event.pointerId,
                    capture: capture,
                    centerX: centerX,
                    centerY: centerY,
                    startX: event.clientX,
                    startY: event.clientY,
                    lastAngle: Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180 / Math.PI,
                    lastTime: performance.now(),
                    velocity: 0,
                    dragged: false
                };
                pinnedRef.current = true;
                clearTimers();
            };
            const onPointerMove = event => {
                trackSurfacePointer(event);
                const gesture = gestureRef.current;
                if (!gesture || event.pointerId !== gesture.pointerId) return;
                const x = event.clientX - gesture.centerX;
                const y = event.clientY - gesture.centerY;
                if (Math.hypot(x, y) < 32) {
                    gesture.lastAngle = null;
                    return;
                }
                const angle = Math.atan2(y, x) * 180 / Math.PI;
                if (gesture.lastAngle === null) {
                    gesture.lastAngle = angle;
                    return;
                }
                const delta = angleDelta(gesture.lastAngle, angle);
                const now = performance.now();
                if (!gesture.dragged && Math.hypot(event.clientX - gesture.startX, event.clientY - gesture.startY) >= 7) {
                    gesture.dragged = true;
                    setDragging(true);
                }
                if (gesture.dragged) {
                    event.preventDefault();
                    changeRotation(rotationRef.current + delta);
                    gesture.velocity = gesture.velocity * .55 + delta / Math.max(8, now - gesture.lastTime) * .45;
                    interaction.current.energy = Math.min(1, Math.abs(gesture.velocity) * 1.7);
                    interaction.current.spin = Math.max(-1, Math.min(1, gesture.velocity * 1.8));
                }
                gesture.lastAngle = angle;
                gesture.lastTime = now;
            };
            const onNavigate = (event, item) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
                closeMenu();
                if (item.href.startsWith("#")) {
                    const section = document.getElementById(item.href.slice(1));
                    if (!section) return;
                    event.preventDefault();
                    window.history.pushState(window.history.state, "", item.href);
                    const heading = section.querySelector("h2, h3") || section;
                    heading.setAttribute("tabindex", "-1");
                    heading.focus({
                        preventScroll: true
                    });
                    section.scrollIntoView({
                        behavior: reducedMotion ? "instant" : "smooth",
                        block: "start"
                    });
                }
            };
            const renderLink = (item, index) => {
                const angle = radians(index * STEP - 90);
                 
                return (0, jsx_runtime.jsx)(api_link["default"], {
                    "data-text": "action",
                    ref: node => {
                        linksRef.current[index] = node;
                    },
                    href: item.href,
                    prefetch: false,
                    draggable: false,
                    className: VioletQuickMenu_module_default().menuLink,
                    "data-violet-link": item.id,
                    "data-selected": selected === index,
                    tabIndex: open ? 0 : -1,
                    style: {
                        "--item-x": "".concat((50 + Math.cos(angle) * 35.5).toFixed(4), "%"),
                        "--item-y": "".concat((50 + Math.sin(angle) * 35.5).toFixed(4), "%")
                    },
                    onFocus: () => {
                        if (openRef.current && !gestureRef.current) {
                            pinnedRef.current = true;
                            selectItem(index);
                        }
                    },
                    onClick: event => onNavigate(event, item),
                    children:   (0, jsx_runtime.jsxs)("span", {
                        className: VioletQuickMenu_module_default().menuLabel,
                        children: [ 
                        
                         (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                            name: item.icon,
                            size: 24
                        }), 
                        
                         (0, jsx_runtime.jsx)("span", {
                            "data-text": "body",
                            children: item.label
                        }) ]
                    })
                }, item.id);
            };
             
            return (0, jsx_runtime.jsx)("div", {
                "data-component-id": "quick-menu",
                ref: rootRef,
                className: VioletQuickMenu_module_default().experience,
                "data-violet-menu": true,
                "data-placement": placement,
                "data-visible": visible,
                "data-state": open ? "open" : "closed",
                "data-sleeping": sleeping || !visible,
                "aria-hidden": !visible,
                children:   (0, jsx_runtime.jsxs)("div", {
                    ref: dockRef,
                    className: VioletQuickMenu_module_default().dock,
                    onKeyDown: onKeyDown,
                    onPointerEnter: () => {
                        if (closeTimer.current) clearTimeout(closeTimer.current);
                    },
                    onPointerLeave: event => {
                        hoverBlockedRef.current = false;
                        if (!gestureRef.current) interaction.current.active = false;
                        if (hoverTimer.current) clearTimeout(hoverTimer.current);
                        if (openRef.current && event.pointerType === "mouse" && !pinnedRef.current && !gestureRef.current) closeTimer.current = setTimeout((() => closeMenu(false, false)), 220);
                    },
                    onBlur: event => {
                        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) closeMenu(false, false);
                    },
                    children: [ 
                    
                     (0, jsx_runtime.jsxs)("div", {
                        className: VioletQuickMenu_module_default().panel,
                        "aria-hidden": !open,
                        children: [ 
                        
                         (0, jsx_runtime.jsx)("p", {
                            "data-text": "body",
                            className: VioletQuickMenu_module_default().instruction,
                            id: hintId,
                            children: "원을 돌려 고르고, 눌러서 이동해요"
                        }), 
                        
                         (0, jsx_runtime.jsx)("nav", {
                            id: menuId,
                            "aria-label": "원형 퀵메뉴",
                            "aria-describedby": hintId,
                            children:   (0, jsx_runtime.jsxs)("div", {
                                className: VioletQuickMenu_module_default().wheel,
                                "data-violet-wheel": true,
                                "data-rotation": rotation,
                                "data-dragging": dragging,
                                style: {
                                    "--rotation": "".concat(rotation, "deg")
                                },
                                onPointerEnter: event => trackSurfacePointer(event, true),
                                onPointerLeave: () => {
                                    if (!gestureRef.current) interaction.current.active = false;
                                },
                                onPointerDown: onPointerDown,
                                onPointerMove: onPointerMove,
                                onPointerUp: event => {
                                    var _gestureRef_current;
                                    if (event.pointerId === ((_gestureRef_current = gestureRef.current) === null || _gestureRef_current === void 0 ? void 0 : _gestureRef_current.pointerId)) finishGesture();
                                },
                                onPointerCancel: event => {
                                    var _gestureRef_current;
                                    if (event.pointerId === ((_gestureRef_current = gestureRef.current) === null || _gestureRef_current === void 0 ? void 0 : _gestureRef_current.pointerId)) finishGesture(true);
                                },
                                onLostPointerCapture: event => {
                                    var _gestureRef_current;
                                    if (event.pointerId === ((_gestureRef_current = gestureRef.current) === null || _gestureRef_current === void 0 ? void 0 : _gestureRef_current.pointerId)) finishGesture(true);
                                },
                                onClickCapture: event => {
                                    if (event.detail !== 0 && performance.now() < suppressClickUntil.current) {
                                        event.preventDefault();
                                        event.stopPropagation();
                                    }
                                },
                                onDragStart: event => event.preventDefault(),
                                children: [ 
                                
                                 (0, jsx_runtime.jsx)(LiquidSurface, {}), 
                                
                                 (0, jsx_runtime.jsx)(QuickMenuFluid, {
                                    awake: visible && open && !sleeping,
                                    animated: !reducedMotion && !sleeping,
                                    expanded: true,
                                    interaction: interaction
                                }), 
                                
                                 (0, jsx_runtime.jsxs)("div", {
                                    "data-text": "body",
                                    className: VioletQuickMenu_module_default().rotor,
                                    children: [ 
                                    
                                     (0, jsx_runtime.jsx)("svg", {
                                        className: VioletQuickMenu_module_default().slices,
                                        viewBox: "0 0 400 400",
                                        "aria-hidden": "true",
                                        children: items.map(((item, index) =>   (0, jsx_runtime.jsx)("path", {
                                            className: VioletQuickMenu_module_default().slice,
                                            d: sectorPath(index),
                                            "data-selected": selected === index
                                        }, item.id)))
                                    }), items.map(renderLink) ]
                                }), 
                                
                                 (0, jsx_runtime.jsx)("span", {
                                    className: VioletQuickMenu_module_default().marker,
                                    "aria-hidden": "true"
                                }), 
                                
                                 (0, jsx_runtime.jsxs)(api_link["default"], {
                                    "data-text": "action",
                                    href: current.href,
                                    prefetch: false,
                                    className: VioletQuickMenu_module_default().current,
                                    "data-violet-current": true,
                                    "data-no-drag": true,
                                    tabIndex: open ? 0 : -1,
                                    onClick: event => onNavigate(event, current),
                                    "aria-label": "".concat(current.label, "로 이동"),
                                    children: [ 
                                    
                                     (0, jsx_runtime.jsx)("strong", {
                                        "data-text": "item-title",
                                        "data-text-size": "quick-action",
                                        children: current.label
                                    }), 
                                    
                                     (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                                        name: "diagonal",
                                        size: 19
                                    }) ]
                                }), 
                                
                                 (0, jsx_runtime.jsx)("span", {
                                    "data-text": "body",
                                    className: "sr-only",
                                    "aria-live": "polite",
                                    "aria-atomic": "true",
                                    children: open && !dragging ? "선택한 메뉴: ".concat(current.label, ".") : ""
                                }) ]
                            })
                        }) ]
                    }), 
                    
                     (0, jsx_runtime.jsxs)("button", {
                        "data-text": "action",
                        "data-system-part": "violet-toggle",
                        ref: toggleRef,
                        type: "button",
                        className: VioletQuickMenu_module_default().toggle,
                        "data-violet-toggle": true,
                        "aria-label": open ? "퀵메뉴 닫기" : "퀵메뉴 열기",
                        "aria-expanded": open,
                        "aria-controls": menuId,
                        onClick: event => {
                            if (open) closeMenu(); else openMenu(true, event.detail === 0);
                        },
                        onPointerMove: event => {
                            if (!open) trackSurfacePointer(event);
                        },
                        onPointerEnter: event => {
                            if (!open) trackSurfacePointer(event, true);
                            if (event.pointerType !== "mouse" || open || hoverBlockedRef.current || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
                            clearTimers();
                            hoverTimer.current = setTimeout((() => openMenu(false)), 180);
                        },
                        children: [ 
                        
                         (0, jsx_runtime.jsx)(LiquidSurface, {}), 
                        
                         (0, jsx_runtime.jsx)(QuickMenuFluid, {
                            awake: visible && !open && !sleeping,
                            animated: !reducedMotion && !sleeping,
                            interaction: interaction
                        }), open ?   (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                            name: "close",
                            size: 21
                        }) :   (0, jsx_runtime.jsxs)("span", {
                            className: VioletQuickMenu_module_default().toggleLabel,
                            "aria-hidden": "true",
                            children: [ 
                            
                             (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                                name: "menu",
                                size: 24
                            }), 
                            
                             (0, jsx_runtime.jsx)("span", {
                                "data-text": "body",
                                children: "퀵메뉴"
                            }) ]
                        }), 
                        
                         (0, jsx_runtime.jsx)("span", {
                            "data-text": "body",
                            className: VioletQuickMenu_module_default().closedHint,
                            "aria-hidden": "true",
                            children: "돌려서 둘러보기"
                        }) ]
                    }) ]
                })
            });
        }
        /* harmony default export */        var components_VioletQuickMenu =   (0, react.memo)(VioletQuickMenu);
        /***/    },
    /***/ 4936: 
    /***/ function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        "use strict";
        /* harmony export */        __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ DT: function() {
                /* binding */ return moveMonth;
            },
            /* harmony export */ Ip: function() {
                /* binding */ return canSelectProgram;
            },
            /* harmony export */ RG: function() {
                /* binding */ return monthDates;
            },
            /* harmony export */ bO: function() {
                /* binding */ return seoulToday;
            },
            /* harmony export */ jd: function() {
                /* binding */ return programsForDate;
            },
            /* harmony export */ nQ: function() {
                /* binding */ return discoverPrograms;
            }
            /* harmony export */        });
        /* unused harmony exports createBookingState, changeBookingState, bookingDestination */
        // [날짜와 선택 상태 / Dates and selection state]
        // 달력의 표시 월과 확정 날짜를 분리하고 날짜는 서울을 기준으로 해석합니다.
                function seoulToday() {
            let now = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : new Date;
            return new Intl.DateTimeFormat("en-CA", {
                timeZone: "Asia/Seoul",
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            }).format(now);
        }
        function validDate(value) {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;
            const date = new Date("".concat(value, "T12:00:00Z"));
            return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
        }
        function monthDates(month) {
            if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month || "")) return [];
            const [year, number] = (month || "").split("-").map(Number);
            const first = new Date(Date.UTC(year, number - 1, 1)).getUTCDay();
            const days = new Date(Date.UTC(year, number, 0)).getUTCDate();
            const entries = Array(first).fill("");
            for (let day = 1; day <= days; day++) entries.push("".concat(month, "-").concat(String(day).padStart(2, "0")));
            while (entries.length % 7) entries.push("");
            return entries;
        }
        function moveMonth(month, step) {
            if (!monthDates(month).length || !Number.isInteger(step)) return month;
            const [year, number] = month.split("-").map(Number);
            return new Date(Date.UTC(year, number - 1 + step, 1)).toISOString().slice(0, 7);
        }
        function programsForDate(programs, date) {
            if (!validDate(date)) return [];
            return programs.filter((program => (program.start || "") <= (date || "") && (program.end || "") >= (date || "")));
        }
        function canSelectProgram(program) {
            var _program_times;
            return Boolean(program && ((_program_times = program.times) === null || _program_times === void 0 ? void 0 : _program_times.length) && !/매진|종료|마감|예정|준비|오픈\s*전/.test(program.status || ""));
        }
        function createBookingState() {
            let date = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : seoulToday();
            const selectedDate = validDate(date) ? date : seoulToday();
            return {
                month: selectedDate.slice(0, 7),
                date: selectedDate,
                programId: "",
                time: "",
                participants: 1
            };
        }
        function changeBookingState(state, change, programs) {
            if (change.type === "month") {
                return monthDates(change.value).length ? {
                    ...state,
                    month: change.value
                } : state;
            }
            if (change.type === "date") {
                return validDate(change.value) ? createBookingState(change.value) : {
                    ...state,
                    date: "",
                    programId: "",
                    time: "",
                    participants: 1
                };
            }
            if (change.type === "program") {
                const program = programsForDate(programs, state.date).find((item => item.id === change.value));
                return {
                    ...state,
                    programId: canSelectProgram(program) ? program.id : "",
                    time: "",
                    participants: 1
                };
            }
            if (change.type === "time") {
                var _program_times;
                const program = programs.find((item => item.id === state.programId));
                return {
                    ...state,
                    time: (program === null || program === void 0 ? void 0 : (_program_times = program.times) === null || _program_times === void 0 ? void 0 : _program_times.includes(change.value)) ? change.value : ""
                };
            }
            if (change.type === "participants") {
                const count = Number(change.value);
                return {
                    ...state,
                    participants: Number.isInteger(count) && count >= 1 && count <= 4 ? count : 0
                };
            }
            return state;
        }
        // [다음 단계로 전달 / Handoff to the next step]
        // 선택을 다시 검증한 뒤 동일한 값으로 공연·전시·교육 흐름을 엽니다.
                function bookingDestination(state, programs) {
            let today = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : seoulToday();
            var _program_times;
            const program = programsForDate(programs, state.date).find((item => item.id === state.programId));
            if (!canSelectProgram(program) || state.date < today || !(program === null || program === void 0 ? void 0 : (_program_times = program.times) === null || _program_times === void 0 ? void 0 : _program_times.includes(state.time)) || !Number.isInteger(state.participants) || state.participants < 1 || state.participants > 4) return "";
            const params = new URLSearchParams;
            params.set("date", state.date);
            params.set("time", state.time);
            params.set("participants", String(state.participants));
            params.set("source", "home");
            return "/booking/".concat(encodeURIComponent(program.id), "?").concat(params);
        }
        const seasonPrograms = new Set([ "autumn", "carmen", "dance", "sumire", "hypnosis", "choral", "ballet", "winter", "everyone-classic", "chamber-autumn" ]);
        function discoverPrograms(programs) {
            let category = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "전체", today = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : seoulToday();
            return programs.filter((program => (program.end || "") >= today && (category === "전체" || (category === "기획·시즌" ? seasonPrograms.has(program.id) : program.category === category)))).sort(((left, right) => {
                const leftToday = (left.start || "") <= today;
                const rightToday = (right.start || "") <= today;
                if (leftToday !== rightToday) return leftToday ? -1 : 1;
                if (leftToday && canSelectProgram(left) !== canSelectProgram(right)) return canSelectProgram(left) ? -1 : 1;
                if (leftToday) return (left.end || "").localeCompare(right.end || "");
                return (left.start || "").localeCompare(right.start || "");
            }));
        }
        /***/    },
    /***/ 5731: 
    /***/ function(module) {
        // extracted by mini-css-extract-plugin
        module.exports = {
            experience: "VioletQuickMenu_experience__KgF5J",
            dock: "VioletQuickMenu_dock__BFkoy",
            panel: "VioletQuickMenu_panel__JUNTu",
            instruction: "VioletQuickMenu_instruction__Tbu0m",
            wheel: "VioletQuickMenu_wheel__5HNog",
            art: "VioletQuickMenu_art__OZKSz",
            fluid: "VioletQuickMenu_fluid__0xVzI",
            toggle: "VioletQuickMenu_toggle__EmR5Q",
            rotor: "VioletQuickMenu_rotor__MRBi0",
            menuLink: "VioletQuickMenu_menuLink__VFkFt",
            slices: "VioletQuickMenu_slices__mm_JI",
            slice: "VioletQuickMenu_slice__ZNyPw",
            menuLabel: "VioletQuickMenu_menuLabel__wHYO9",
            current: "VioletQuickMenu_current__4fhzD",
            marker: "VioletQuickMenu_marker__Of9LD",
            toggleLabel: "VioletQuickMenu_toggleLabel__KIK9H",
            closedHint: "VioletQuickMenu_closedHint__vmV38"
        };
        /***/    }
} ]);
//# sourceMappingURL=BookingDatePreview_1.js.map