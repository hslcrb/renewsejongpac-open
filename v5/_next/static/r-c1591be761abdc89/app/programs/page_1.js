(self["webpackChunk_N_E"] = self["webpackChunk_N_E"] || []).push([ [ 625 ], {
    /***/ 3751: 
    /***/ function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {
        Promise.resolve().then(__webpack_require__.bind(__webpack_require__, 709));
        /***/    },
    /***/ 709: 
    /***/ function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        "use strict";
        __webpack_require__.r(__webpack_exports__);
        /* harmony export */        __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ default: function() {
                /* binding */ return ProgramsPage;
            }
            /* harmony export */        });
        /* harmony import */        var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7437);
        /* harmony import */        var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(2265);
        /* harmony import */        var next_link__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(7648);
        /* harmony import */        var _src_catalog_CatalogProvider__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(7048);
        /* harmony import */        var _components_ProgramCard__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(563);
        /* harmony import */        var _components_SystemPrimitives__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(6983);
        /* __next_internal_client_entry_do_not_use__ default auto */
        // [넓은 지면의 프로그램 탐색 / Program discovery across the shared page frame]
                function ProgramsPage() {
            const {catalog: catalog} = (0, _src_catalog_CatalogProvider__WEBPACK_IMPORTED_MODULE_3__ /* .useCatalog */ .r)();
            const PROGRAMS = catalog.programs;
            const [category, setCategory] = (0, react__WEBPACK_IMPORTED_MODULE_1__.useState)("전체");
            const [search, setSearch] = (0, react__WEBPACK_IMPORTED_MODULE_1__.useState)("");
            const categories = [ "전체", "공연", "전시", "교육" ];
            const filtered = PROGRAMS.filter((p => {
                const matchCat = category === "전체" || p.category === category;
                const matchSearch = !search.trim() || [ p.title, p.genre || "", p.venue || "", p.description || "" ].join(" ").toLowerCase().includes(search.toLowerCase());
                return matchCat && matchSearch;
            }));
             
            return (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                "data-text": "body",
                className: "container page-layout programs-page",
                children: [ 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("nav", {
                    className: "page-layout-breadcrumbs",
                    "aria-label": "현재 위치",
                    children: [ 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(next_link__WEBPACK_IMPORTED_MODULE_2__["default"], {
                        "data-text": "action",
                        href: "/",
                        children: "홈"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", {
                        "data-text": "body",
                        "aria-hidden": "true",
                        children: "/"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", {
                        "data-text": "body",
                        "aria-current": "page",
                        children: "프로그램 전체보기"
                    }) ]
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("header", {
                    className: "page-layout-heading",
                    children: [ 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h1", {
                        "data-text": "title",
                        children: "세종의 프로그램"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                        "data-text": "body",
                        children: "공연과 전시, 예술교육 프로그램의 일정과 장소를 확인하세요."
                    }) ]
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                    className: "programs-page-controls",
                    children: [ 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", {
                        "data-text": "body",
                        className: "page-layout-actions",
                        role: "group",
                        "aria-label": "프로그램 분류",
                        children: categories.map((cat =>   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .SystemFilterButton */)(_components_SystemPrimitives__WEBPACK_IMPORTED_MODULE_5__.BV, {
                            "data-text": "action",
                            selected: category === cat,
                            onClick: () => setCategory(cat),
                            children: cat
                        }, cat)))
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", {
                        className: "programs-page-search",
                        children:   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .SystemField */)(_components_SystemPrimitives__WEBPACK_IMPORTED_MODULE_5__.RK, {
                            "data-text": "body",
                            id: "program-query",
                            label: "프로그램 검색",
                            labelHidden: true,
                            type: "search",
                            placeholder: "공연명, 장르, 공연장 검색...",
                            value: search,
                            onChange: e => setSearch(e.target.value)
                        })
                    }) ]
                }), filtered.length > 0 ?   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", {
                    "data-text": "body",
                    className: "programs-page-grid",
                    children: filtered.map((program =>   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* ["default"] */)(_components_ProgramCard__WEBPACK_IMPORTED_MODULE_4__.Z, {
                        program: program
                    }, program.id)))
                }) :   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                    className: "page-layout-empty",
                    role: "status",
                    children: [ 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h2", {
                        "data-text": "heading",
                        children: "검색 결과가 없습니다"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                        "data-text": "body",
                        children: "다른 검색어를 입력하시거나 카테고리 필터를 변경해 보세요."
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
    __webpack_require__.O(0, [ 762, 648, 369, 498, 663, 971, 117, 744 ], (function() {
        return __webpack_exec__(3751);
    }));
    /******/    var __webpack_exports__ = __webpack_require__.O();
    /******/    _N_E = __webpack_exports__;
    /******/} ]);
//# sourceMappingURL=page_1.js.map