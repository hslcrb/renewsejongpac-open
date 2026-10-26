(self["webpackChunk_N_E"] = self["webpackChunk_N_E"] || []).push([ [ 798 ], {
    /***/ 1578: 
    /***/ function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {
        Promise.resolve().then(__webpack_require__.bind(__webpack_require__, 8890));
        /***/    },
    /***/ 8890: 
    /***/ function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        "use strict";
        /* harmony export */        __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ default: function() {
                /* binding */ return BookingClient;
            }
            /* harmony export */        });
        /* harmony import */        var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7437);
        /* harmony import */        var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(2265);
        /* harmony import */        var _components_SystemPrimitives__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(6983);
        /* harmony import */        var _components_SystemSurface__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(820);
        /* harmony import */        var _components_useAccountIdentity__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(7215);
        /* harmony import */        var _src_catalog_CatalogProvider__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(7048);
        /* harmony import */        var _src_lib_reservations_ts__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(8962);
        /* __next_internal_client_entry_do_not_use__ default auto */
        // [서버 회차·좌석과 실제 예약 / Server sessions, inventory, and unpaid reservations]
                function BookingClient(param) {
            let {program: initialProgram} = param;
            const identity = (0, _components_useAccountIdentity__WEBPACK_IMPORTED_MODULE_4__ /* ["default"] */ .ZP)();
            const owner = (0, react__WEBPACK_IMPORTED_MODULE_1__.useRef)(identity.identityId);
            owner.current = identity.identityId;
            const {catalog: catalog, error: catalogError, loading: catalogLoading} = (0, _src_catalog_CatalogProvider__WEBPACK_IMPORTED_MODULE_5__ /* .useCatalog */ .r)();
            const program = catalog.programs.find((item => item.id === initialProgram.id)) || initialProgram;
            const sessions = catalog.sessions.filter((session => session.programId === program.id));
            const [sessionId, setSessionId] = (0, react__WEBPACK_IMPORTED_MODULE_1__.useState)("");
            const [participants, setParticipants] = (0, react__WEBPACK_IMPORTED_MODULE_1__.useState)(1);
            const [inventory, setInventory] = (0, react__WEBPACK_IMPORTED_MODULE_1__.useState)(null);
            const [selected, setSelected] = (0, react__WEBPACK_IMPORTED_MODULE_1__.useState)([]);
            const [reservation, setReservation] = (0, react__WEBPACK_IMPORTED_MODULE_1__.useState)(null);
            const [error, setError] = (0, react__WEBPACK_IMPORTED_MODULE_1__.useState)("");
            const [busy, setBusy] = (0, react__WEBPACK_IMPORTED_MODULE_1__.useState)(false);
            const [now, setNow] = (0, react__WEBPACK_IMPORTED_MODULE_1__.useState)(Date.now());
            const clockOffset = (0, react__WEBPACK_IMPORTED_MODULE_1__.useRef)(0);
            const attempts = (0, react__WEBPACK_IMPORTED_MODULE_1__.useRef)(new Map);
            const prefilling = (0, react__WEBPACK_IMPORTED_MODULE_1__.useRef)(false);
            (0, react__WEBPACK_IMPORTED_MODULE_1__.useEffect)((() => {
                if (prefilling.current || catalogLoading) return;
                prefilling.current = true;
                const prefill = (0, _src_lib_reservations_ts__WEBPACK_IMPORTED_MODULE_6__ /* .validateBookingPrefill */ .lW)(new URLSearchParams(window.location.search), sessions);
                setSessionId(prefill.sessionId);
                setParticipants(prefill.participants);
                setError(prefill.error);
            }), [ sessions, catalogLoading ]);
            (0, react__WEBPACK_IMPORTED_MODULE_1__.useEffect)((() => {
                setReservation(null);
                setSelected([]);
                attempts.current.clear();
            }), [ identity.identityId ]);
            (0, react__WEBPACK_IMPORTED_MODULE_1__.useEffect)((() => {
                const timer = setInterval((() => setNow(Date.now() + clockOffset.current)), 1e3);
                return () => clearInterval(timer);
            }), []);
            async function refreshSeats() {
                let id = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : sessionId;
                if (!id) return;
                const result = await (0, _src_lib_reservations_ts__WEBPACK_IMPORTED_MODULE_6__ /* .getSessionSeats */ .oU)(id);
                if (result.kind === "inventory") clockOffset.current = new Date(result.serverNow).valueOf() - Date.now();
                setInventory(result);
            }
            (0, react__WEBPACK_IMPORTED_MODULE_1__.useEffect)((() => {
                let current = true;
                setSelected([]);
                setInventory(null);
                if (sessionId) (0, _src_lib_reservations_ts__WEBPACK_IMPORTED_MODULE_6__ /* .getSessionSeats */ .oU)(sessionId).then((result => {
                    if (current) {
                        setInventory(result);
                        if (result.kind === "inventory") clockOffset.current = new Date(result.serverNow).valueOf() - Date.now();
                    }
                })).catch((cause => {
                    if (current) setError(cause.message);
                }));
                return () => {
                    current = false;
                };
            }), [ sessionId ]);
            const remaining = reservation ? Math.max(0, Math.ceil((new Date(reservation.expiresAt).valueOf() - now) / 1e3)) : 0;
            const active = reservation && [ "held", "reserved_unpaid" ].includes(reservation.status) && remaining > 0;
            const requestKey = key => {
                const saved = attempts.current.get(key) || crypto.randomUUID();
                attempts.current.set(key, saved);
                return saved;
            };
            async function act(operation) {
                if (busy) return;
                if (!identity.isLoggedIn) {
                    setError("로그인한 뒤 예약해 주세요.");
                    return;
                }
                const expected = owner.current;
                setBusy(true);
                setError("");
                try {
                    const result = await operation();
                    if (owner.current !== expected) return;
                    if (result.kind === "error") setError((0, _src_lib_reservations_ts__WEBPACK_IMPORTED_MODULE_6__ /* .reservationError */ .i6)(result.code)); else {
                        setReservation(result.reservation);
                        clockOffset.current = new Date(result.serverNow).valueOf() - Date.now();
                        setNow(new Date(result.serverNow).valueOf());
                    }
                    await refreshSeats();
                } catch (cause) {
                    if (owner.current === expected) setError(cause instanceof Error ? cause.message : "예약 요청을 처리하지 못했습니다.");
                } finally {
                    setBusy(false);
                }
            }
            const seats = (inventory === null || inventory === void 0 ? void 0 : inventory.kind) === "inventory" ? inventory.seats : [];
            const total = seats.filter((seat => selected.includes(seat.id))).reduce(((sum, seat) => sum + seat.price), 0);
            if (!catalogLoading && !catalogError && !catalog.programs.some((item => item.id === initialProgram.id)))   return (0, 
            react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", {
                className: "container page-layout",
                children:   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .SystemNotice */)(_components_SystemPrimitives__WEBPACK_IMPORTED_MODULE_2__.F0, {
                    title: "공개가 종료된 프로그램입니다",
                    children:   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_components_SystemPrimitives__WEBPACK_IMPORTED_MODULE_2__.SystemLink, {
                        href: "/programs/",
                        children: "프로그램 목록"
                    })
                })
            });
             
            return (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                className: "container page-layout booking-page",
                children: [ 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("nav", {
                    className: "page-layout-breadcrumbs",
                    "aria-label": "현재 위치",
                    children: [ 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_components_SystemPrimitives__WEBPACK_IMPORTED_MODULE_2__.SystemLink, {
                        variant: "quiet",
                        href: "/",
                        children: "홈"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", {
                        "data-text": "body",
                        children: "/"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_components_SystemPrimitives__WEBPACK_IMPORTED_MODULE_2__.SystemLink, {
                        variant: "quiet",
                        href: "/programs/".concat(program.id),
                        children: program.title
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", {
                        "data-text": "body",
                        children: "/ 예약"
                    }) ]
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("header", {
                    className: "page-layout-heading",
                    children: [ 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                        "data-text": "body",
                        children: program.venue
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h1", {
                        "data-text": "title",
                        children: program.title
                    }) ]
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                    className: "booking-page-content",
                    "data-text": "body",
                    children: [ (error || catalogError) &&   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .SystemNotice */)(_components_SystemPrimitives__WEBPACK_IMPORTED_MODULE_2__.F0, {
                        error: true,
                        title: "확인이 필요합니다",
                        children: error || catalogError
                    }), !identity.isLoggedIn &&   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .SystemNotice */)(_components_SystemPrimitives__WEBPACK_IMPORTED_MODULE_2__.F0, {
                        title: "로그인 후 예약할 수 있습니다",
                        children:   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_components_SystemPrimitives__WEBPACK_IMPORTED_MODULE_2__.SystemLink, {
                            href: "/account/login/",
                            children: "로그인하기"
                        })
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs /* ["default"] */)(_components_SystemSurface__WEBPACK_IMPORTED_MODULE_3__.ZP, {
                        as: "section",
                        padding: "lg",
                        className: "booking-page-panel",
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h2", {
                            "data-text": "heading",
                            children: "회차와 인원"
                        }), sessions.length ?   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                            className: "booking-page-fields",
                            children: [ 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs /* .SystemField */)(_components_SystemPrimitives__WEBPACK_IMPORTED_MODULE_2__.RK, {
                                as: "select",
                                variant: "flow",
                                id: "booking-session",
                                label: "관람 회차",
                                value: sessionId,
                                disabled: Boolean(active) || busy,
                                onChange: event => {
                                    setSessionId(event.target.value);
                                    setReservation(null);
                                    setError("");
                                },
                                children: [ 
                                
                                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("option", {
                                    "data-text": "label",
                                    value: "",
                                    children: "회차 선택"
                                }), sessions.map((session => {
                                    const local = (0, _src_lib_reservations_ts__WEBPACK_IMPORTED_MODULE_6__ /* .sessionLocalParts */ .zp)(session);
                                     
                                    return (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("option", {
                                        "data-text": "label",
                                        value: session.id,
                                        disabled: !session.bookingEnabled,
                                        children: [ local.date, " ", local.time, !session.bookingEnabled ? " · 예약 준비 중" : "" ]
                                    }, session.id);
                                })) ]
                            }), 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .SystemField */)(_components_SystemPrimitives__WEBPACK_IMPORTED_MODULE_2__.RK, {
                                as: "select",
                                variant: "flow",
                                id: "booking-participants",
                                label: "인원",
                                value: participants,
                                disabled: Boolean(active) || busy,
                                onChange: event => {
                                    setParticipants(Number(event.target.value));
                                    setSelected([]);
                                },
                                children: [ 1, 2, 3, 4 ].map((count =>   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("option", {
                                    "data-text": "label",
                                    value: count,
                                    children: [ count, "명" ]
                                }, count)))
                            }) ]
                        }) :   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .SystemNotice */)(_components_SystemPrimitives__WEBPACK_IMPORTED_MODULE_2__.F0, {
                            title: "예약 가능한 회차를 준비하고 있습니다",
                            children: "확인된 관람 일정과 좌석이 등록되면 이곳에서 예약할 수 있습니다."
                        }) ]
                    }), sessionId &&   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs /* ["default"] */)(_components_SystemSurface__WEBPACK_IMPORTED_MODULE_3__.ZP, {
                        as: "section",
                        padding: "lg",
                        className: "booking-page-panel",
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h2", {
                            "data-text": "heading",
                            children: "좌석 선택"
                        }), !inventory ?   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                            "data-text": "body",
                            role: "status",
                            children: "좌석을 불러오는 중입니다."
                        }) : inventory.kind === "error" ?   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .SystemNotice */)(_components_SystemPrimitives__WEBPACK_IMPORTED_MODULE_2__.F0, {
                            error: true,
                            title: "회차 확인",
                            children: (0, _src_lib_reservations_ts__WEBPACK_IMPORTED_MODULE_6__ /* .reservationError */ .i6)(inventory.code)
                        }) : !inventory.bookingEnabled ?   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .SystemNotice */)(_components_SystemPrimitives__WEBPACK_IMPORTED_MODULE_2__.F0, {
                            title: "예약 준비 중",
                            children: "현재 선택할 수 없는 회차입니다."
                        }) :   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.Fragment, {
                            children: [ !seats.some((seat => seat.available)) && !active &&   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .SystemNotice */)(_components_SystemPrimitives__WEBPACK_IMPORTED_MODULE_2__.F0, {
                                title: "현재 선택 가능한 좌석이 없습니다",
                                children: "좌석을 새로 불러와 다시 확인할 수 있습니다."
                            }), 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("p", {
                                "data-text": "body",
                                children: [ participants, "석을 선택해 주세요. 선택한 좌석은 5분간 보류됩니다." ]
                            }), 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", {
                                className: "booking-page-seat-scroll",
                                role: "region",
                                "aria-label": "좌석 목록",
                                tabIndex: 0,
                                children:   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", {
                                    className: "booking-page-seat-rows",
                                    children: [ ...new Set(seats.map((seat => seat.row))) ].map((row =>   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", {
                                        className: "booking-page-seat-row",
                                        children: seats.filter((seat => seat.row === row)).map((seat =>   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs /* .SystemButton */)(_components_SystemPrimitives__WEBPACK_IMPORTED_MODULE_2__.kR, {
                                            variant: selected.includes(seat.id) ? "primary" : "secondary",
                                            "aria-pressed": selected.includes(seat.id),
                                            disabled: Boolean(active) || busy || !seat.available,
                                            onClick: () => setSelected((current => current.includes(seat.id) ? current.filter((id => id !== seat.id)) : current.length < participants ? [ ...current, seat.id ] : current)),
                                            children: [ seat.label, " · ", seat.price.toLocaleString(), "원", !seat.available ? " · 선택 불가" : "" ]
                                        }, seat.id)))
                                    }, row)))
                                })
                            }), !active &&   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                className: "page-layout-actions",
                                children: [ 
                                
                                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .SystemButton */)(_components_SystemPrimitives__WEBPACK_IMPORTED_MODULE_2__.kR, {
                                    variant: "secondary",
                                    disabled: busy,
                                    onClick: () => refreshSeats().catch((cause => setError(cause.message))),
                                    children: "좌석 새로고침"
                                }), 
                                
                                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .SystemButton */)(_components_SystemPrimitives__WEBPACK_IMPORTED_MODULE_2__.kR, {
                                    disabled: busy || selected.length !== participants,
                                    onClick: () => act((() => (0, _src_lib_reservations_ts__WEBPACK_IMPORTED_MODULE_6__ /* .holdSeats */ .xD)(sessionId, selected, requestKey("hold:".concat(identity.identityId, ":").concat(sessionId, ":").concat([ ...selected ].sort().join(",")))))),
                                    children: busy ? "처리 중…" : "".concat(total.toLocaleString(), "원 · ").concat(selected.length, "석 보류하기")
                                }) ]
                            }) ]
                        }) ]
                    }), reservation &&   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs /* ["default"] */)(_components_SystemSurface__WEBPACK_IMPORTED_MODULE_3__.ZP, {
                        as: "section",
                        padding: "lg",
                        className: "booking-page-panel",
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h2", {
                            "data-text": "heading",
                            children: active ? (0, _src_lib_reservations_ts__WEBPACK_IMPORTED_MODULE_6__ /* .reservationStatusLabel */ .Bd)(reservation.status) : [ "held", "reserved_unpaid" ].includes(reservation.status) ? "기한 만료" : (0, 
                            _src_lib_reservations_ts__WEBPACK_IMPORTED_MODULE_6__ /* .reservationStatusLabel */ .Bd)(reservation.status)
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("p", {
                            "data-text": "body",
                            children: [ reservation.date, " ", reservation.time, " · ", reservation.seats.join(", "), " · ", reservation.total.toLocaleString(), "원" ]
                        }), active &&   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("p", {
                            "data-text": "body",
                            role: "timer",
                            children: [ "남은 시간 ", Math.floor(remaining / 60), "분 ", remaining % 60, "초" ]
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                            "data-text": "body",
                            children: reservation.status === "reserved_unpaid" ? "예약이 접수되었습니다. 결제와 발권은 아직 진행되지 않았으며, 기한이 지나면 좌석이 해제됩니다." : "예약 내용을 확인한 뒤 예약을 접수해 주세요."
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                            className: "page-layout-actions",
                            children: [ active && reservation.status === "held" &&   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .SystemButton */)(_components_SystemPrimitives__WEBPACK_IMPORTED_MODULE_2__.kR, {
                                disabled: busy,
                                onClick: () => act((() => (0, _src_lib_reservations_ts__WEBPACK_IMPORTED_MODULE_6__ /* .confirmReservation */ .fr)(reservation.id, requestKey("confirm:".concat(reservation.id))))),
                                children: "예약 접수하기"
                            }), active &&   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .SystemButton */)(_components_SystemPrimitives__WEBPACK_IMPORTED_MODULE_2__.kR, {
                                variant: "secondary",
                                disabled: busy,
                                onClick: () => act((() => (0, _src_lib_reservations_ts__WEBPACK_IMPORTED_MODULE_6__ /* .cancelReservation */ .kv)(reservation.id))),
                                children: "예약 취소"
                            }), !active &&   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .SystemButton */)(_components_SystemPrimitives__WEBPACK_IMPORTED_MODULE_2__.kR, {
                                variant: "secondary",
                                disabled: busy,
                                onClick: () => {
                                    attempts.current.clear();
                                    setReservation(null);
                                    setSelected([]);
                                    void refreshSeats().catch((cause => setError(cause.message)));
                                },
                                children: "새 예약 선택"
                            }), 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_components_SystemPrimitives__WEBPACK_IMPORTED_MODULE_2__.SystemLink, {
                                href: "/account/bookings/",
                                children: "예약 내역 확인"
                            }) ]
                        }) ]
                    }) ]
                }) ]
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
    /***/ 7215: 
    /***/ function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        "use strict";
        /* harmony export */        __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ ZP: function() {
                /* binding */ return useAccountIdentity;
            }
            /* harmony export */        });
        /* unused harmony exports readAccountIdentity, queueAccountMutation */
        /* harmony import */        var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(2265);
        /* harmony import */        var _src_lib_supabase_ts__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(5526);
        /* harmony import */        var _src_lib_account_db_ts__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(5932);
        /* __next_internal_client_entry_do_not_use__ readAccountIdentity,queueAccountMutation,default auto */
        // [인증 세션만 신뢰하는 회원 정보 / Member identity comes only from an authenticated session]
                const readAccountIdentity = (user, _storage) => resolveAccountIdentity(user);
        let pendingAccountMutation = Promise.resolve();
        function queueAccountMutation(run) {
            const result = pendingAccountMutation.then(run, run);
            pendingAccountMutation = result.then((() => undefined), (() => undefined));
            return result;
        }
        function useAccountIdentity() {
            const [identity, setIdentity] = (0, react__WEBPACK_IMPORTED_MODULE_0__.useState)({
                ...(0, _src_lib_supabase_ts__WEBPACK_IMPORTED_MODULE_1__ /* .resolveAccountIdentity */ .vU)(null),
                mode: "loading",
                ready: false
            });
            const currentUser = (0, react__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
            const revision = (0, react__WEBPACK_IMPORTED_MODULE_0__.useRef)(0);
            const applyUser = (0, react__WEBPACK_IMPORTED_MODULE_0__.useCallback)((user => {
                var _currentUser_current;
                if (((_currentUser_current = currentUser.current) === null || _currentUser_current === void 0 ? void 0 : _currentUser_current.id) !== (user === null || user === void 0 ? void 0 : user.id)) revision.current += 1;
                currentUser.current = user;
                setIdentity((current => {
                    const next = (0, _src_lib_supabase_ts__WEBPACK_IMPORTED_MODULE_1__ /* .resolveAccountIdentity */ .vU)(user);
                    return user && current.identityId === user.id ? {
                        ...next,
                        profile: {
                            ...current.profile,
                            email: next.profile.email
                        }
                    } : next;
                }));
            }), []);
            (0, react__WEBPACK_IMPORTED_MODULE_0__.useEffect)((() => {
                let mounted = true;
                let changes = 0;
                const subscription = _src_lib_supabase_ts__WEBPACK_IMPORTED_MODULE_1__ /* .supabase */ .OQ === null || _src_lib_supabase_ts__WEBPACK_IMPORTED_MODULE_1__ /* .supabase */ .OQ === void 0 ? void 0 : _src_lib_supabase_ts__WEBPACK_IMPORTED_MODULE_1__ /* .supabase */ .OQ.auth.onAuthStateChange(((event, session) => {
                    var _currentUser_current;
                    changes += 1;
                    if (mounted && !(event === "USER_UPDATED" && (session === null || session === void 0 ? void 0 : session.user.id) !== ((_currentUser_current = currentUser.current) === null || _currentUser_current === void 0 ? void 0 : _currentUser_current.id))) applyUser((session === null || session === void 0 ? void 0 : session.user) || null);
                }));
                const started = changes;
                if (_src_lib_supabase_ts__WEBPACK_IMPORTED_MODULE_1__ /* .supabase */ .OQ) void _src_lib_supabase_ts__WEBPACK_IMPORTED_MODULE_1__ /* .supabase */ .OQ.auth.getSession().then((param => {
                    let {data: data, error: error} = param;
                    var _data_session;
                    if (mounted && started === changes) applyUser(error ? null : ((_data_session = data.session) === null || _data_session === void 0 ? void 0 : _data_session.user) || null);
                })).catch((() => {
                    if (mounted && started === changes) applyUser(null);
                })); else applyUser(null);
                return () => {
                    mounted = false;
                    subscription === null || subscription === void 0 ? void 0 : subscription.data.subscription.unsubscribe();
                };
            }), [ applyUser ]);
            (0, react__WEBPACK_IMPORTED_MODULE_0__.useEffect)((() => {
                if (!identity.isLoggedIn) return;
                let cancelled = false;
                const owner = identity.identityId;
                const started = revision.current;
                void (0, _src_lib_account_db_ts__WEBPACK_IMPORTED_MODULE_2__ /* .loadMemberProfile */ .t3)(owner).then((profile => {
                    var _currentUser_current;
                    if (profile && !cancelled && revision.current === started && ((_currentUser_current = currentUser.current) === null || _currentUser_current === void 0 ? void 0 : _currentUser_current.id) === owner) setIdentity((current => ({
                        ...current,
                        profile: profile
                    })));
                })).catch((() => {}));
                return () => {
                    cancelled = true;
                };
            }), [ identity.identityId, identity.isLoggedIn ]);
            const logout = (0, react__WEBPACK_IMPORTED_MODULE_0__.useCallback)((async () => {
                revision.current += 1;
                return queueAccountMutation((async () => {
                    if (_src_lib_supabase_ts__WEBPACK_IMPORTED_MODULE_1__ /* .supabase */ .OQ) {
                        const {error: error} = await _src_lib_supabase_ts__WEBPACK_IMPORTED_MODULE_1__ /* .supabase */ .OQ.auth.signOut();
                        if (error) throw new Error("로그아웃하지 못했습니다. 다시 시도해 주세요.");
                    }
                    applyUser(null);
                }));
            }), [ applyUser ]);
            const updateProfile = (0, react__WEBPACK_IMPORTED_MODULE_0__.useCallback)((async profile => {
                const next = {
                    name: profile.name.trim(),
                    email: profile.email.trim(),
                    phone: profile.phone.trim()
                };
                const user = currentUser.current;
                if (!user || !_src_lib_supabase_ts__WEBPACK_IMPORTED_MODULE_1__ /* .supabase */ .OQ) throw new Error("로그인한 뒤 회원정보를 변경해 주세요.");
                if (!next.name || next.email !== user.email) throw new Error("이름과 로그인한 이메일을 확인해 주세요.");
                const started = ++revision.current;
                return queueAccountMutation((async () => {
                    var _currentUser_current, _currentUser_current1, _currentUser_current2;
                    if (revision.current !== started || ((_currentUser_current = currentUser.current) === null || _currentUser_current === void 0 ? void 0 : _currentUser_current.id) !== user.id) throw new Error("로그인한 계정이 변경되었습니다.");
                    await (0, _src_lib_account_db_ts__WEBPACK_IMPORTED_MODULE_2__ /* .saveMemberProfile */ .uF)(next, user.id);
                    if (revision.current !== started || ((_currentUser_current1 = currentUser.current) === null || _currentUser_current1 === void 0 ? void 0 : _currentUser_current1.id) !== user.id) throw new Error("로그인한 계정이 변경되었습니다.");
                    if (revision.current === started && ((_currentUser_current2 = currentUser.current) === null || _currentUser_current2 === void 0 ? void 0 : _currentUser_current2.id) === user.id) setIdentity((current => ({
                        ...current,
                        profile: next
                    })));
                }));
            }), []);
            return {
                ...identity,
                logout: logout,
                updateProfile: updateProfile
            };
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
        return __webpack_exec__(1578);
    }));
    /******/    var __webpack_exports__ = __webpack_require__.O();
    /******/    _N_E = __webpack_exports__;
    /******/} ]);
//# sourceMappingURL=page_1.js.map