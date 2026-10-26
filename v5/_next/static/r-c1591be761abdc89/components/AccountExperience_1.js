(self["webpackChunk_N_E"] = self["webpackChunk_N_E"] || []).push([ [ 266 ], {
    /***/ 3266: 
    /***/ function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {
        Promise.resolve().then(__webpack_require__.bind(__webpack_require__, 4597));
        /***/    },
    /***/ 4597: 
    /***/ function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        "use strict";
        /* harmony export */        __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ default: function() {
                /* binding */ return AccountExperience;
            }
            /* harmony export */        });
        /* harmony import */        var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7437);
        /* harmony import */        var _SystemSurface__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(820);
        /* harmony import */        var react__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(2265);
        /* harmony import */        var next_link__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(7648);
        /* harmony import */        var _src_catalog_CatalogProvider__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(7048);
        /* harmony import */        var _src_lib_account_space_ts__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(440);
        /* harmony import */        var _AccountMiniRoom__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(6342);
        /* harmony import */        var _AccountPanels__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(2335);
        /* harmony import */        var _Icon__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(9140);
        /* harmony import */        var _ProgramCard__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(563);
        /* harmony import */        var _SmallNotificationModal__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(7281);
        /* harmony import */        var _SystemDialog__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(1914);
        /* harmony import */        var _SystemNavigation__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(7291);
        /* harmony import */        var _SystemPrimitives__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(6983);
        /* harmony import */        var _useAccountIdentity__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(7215);
        /* harmony import */        var _useFavorites__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(2035);
        /* harmony import */        var _src_lib_account_db_ts__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(5932);
        /* __next_internal_client_entry_do_not_use__ default auto */        const ACCOUNT_TABS = [ "space", "bookings", "favorites", "notes", "services", "profile" ];
        const OFFICIAL_ACCOUNT = "https://www.sejongpac.or.kr/portal/myPage/individual/list.do?menuNo=200479";
        function accountTabFromHash(hash) {
            const id = hash.replace(/^#account-panel-/, "");
            return ACCOUNT_TABS.includes(id) ? id : null;
        }
        // [하나의 마이페이지와 직접 접근 경로 / One account experience with direct panel routes]
                function AccountExperience(param) {
            let {initialTab: initialTab = "space"} = param;
            var _PROGRAMS_find;
            const {catalog: catalog} = (0, _src_catalog_CatalogProvider__WEBPACK_IMPORTED_MODULE_4__ /* .useCatalog */ .r)();
            const PROGRAMS = catalog.programs;
            const RECOMMENDATIONS = PROGRAMS.filter((program => program.category === "공연")).slice(0, 3);
            const PROGRAM_IDS = new Set(PROGRAMS.map((program => program.id)));
            const identity = (0, _useAccountIdentity__WEBPACK_IMPORTED_MODULE_14__ /* ["default"] */ .ZP)();
            const favorites = (0, _useFavorites__WEBPACK_IMPORTED_MODULE_15__ /* ["default"] */ .Z)();
            const [activeTab, setActiveTab] = (0, react__WEBPACK_IMPORTED_MODULE_2__.useState)(initialTab);
            const [space, setSpace] = (0, react__WEBPACK_IMPORTED_MODULE_2__.useState)({
                ..._src_lib_account_space_ts__WEBPACK_IMPORTED_MODULE_5__ /* .DEFAULT_ACCOUNT_SPACE */ .WU
            });
            const [notes, setNotes] = (0, react__WEBPACK_IMPORTED_MODULE_2__.useState)([]);
            const [bookings, setBookings] = (0, react__WEBPACK_IMPORTED_MODULE_2__.useState)([]);
            const [loadedIdentity, setLoadedIdentity] = (0, react__WEBPACK_IMPORTED_MODULE_2__.useState)("");
            const [today, setToday] = (0, react__WEBPACK_IMPORTED_MODULE_2__.useState)("");
            const [bookingFilter, setBookingFilter] = (0, react__WEBPACK_IMPORTED_MODULE_2__.useState)("all");
            const [sessionError, setSessionError] = (0, react__WEBPACK_IMPORTED_MODULE_2__.useState)("");
            const [profileDraft, setProfileDraft] = (0, react__WEBPACK_IMPORTED_MODULE_2__.useState)({
                name: "",
                email: "",
                phone: ""
            });
            const [profileError, setProfileError] = (0, react__WEBPACK_IMPORTED_MODULE_2__.useState)("");
            const [profileSaving, setProfileSaving] = (0, react__WEBPACK_IMPORTED_MODULE_2__.useState)(false);
            const [accountBusy, setAccountBusy] = (0, react__WEBPACK_IMPORTED_MODULE_2__.useState)(false);
            const [reload, setReload] = (0, react__WEBPACK_IMPORTED_MODULE_2__.useState)(0);
            const activeIdentity = (0, react__WEBPACK_IMPORTED_MODULE_2__.useRef)(identity.identityId);
            activeIdentity.current = identity.identityId;
            const [editOpen, setEditOpen] = (0, react__WEBPACK_IMPORTED_MODULE_2__.useState)(false);
            const [spaceDraft, setSpaceDraft] = (0, react__WEBPACK_IMPORTED_MODULE_2__.useState)({
                ..._src_lib_account_space_ts__WEBPACK_IMPORTED_MODULE_5__ /* .DEFAULT_ACCOUNT_SPACE */ .WU
            });
            const [cancelOpen, setCancelOpen] = (0, react__WEBPACK_IMPORTED_MODULE_2__.useState)(false);
            const [pendingCancellation, setPendingCancellation] = (0, react__WEBPACK_IMPORTED_MODULE_2__.useState)(null);
            const editTriggerRef = (0, react__WEBPACK_IMPORTED_MODULE_2__.useRef)(null);
            const cancelTriggerRef = (0, react__WEBPACK_IMPORTED_MODULE_2__.useRef)(null);
            const cancelCloseRef = (0, react__WEBPACK_IMPORTED_MODULE_2__.useRef)(null);
            const dataReady = identity.ready && loadedIdentity === identity.identityId && Boolean(today);
            // [회원 식별 후 읽기만 수행 / Read persisted values only after identity is known]
                        (0, react__WEBPACK_IMPORTED_MODULE_2__.useEffect)((() => {
                setToday((0, _src_lib_account_space_ts__WEBPACK_IMPORTED_MODULE_5__ /* .accountToday */ .ur)());
                let focusFrame = 0;
                const syncTab = event => {
                    const destination = accountTabFromHash(window.location.hash);
                    setActiveTab(destination || initialTab);
                    if (event && destination) {
                        cancelAnimationFrame(focusFrame);
                        focusFrame = requestAnimationFrame((() => {
                            var _document_getElementById;
                            return (_document_getElementById = document.getElementById("account-panel-".concat(destination))) === null || _document_getElementById === void 0 ? void 0 : _document_getElementById.focus();
                        }));
                    }
                };
                syncTab();
                window.addEventListener("hashchange", syncTab);
                window.addEventListener("popstate", syncTab);
                return () => {
                    cancelAnimationFrame(focusFrame);
                    window.removeEventListener("hashchange", syncTab);
                    window.removeEventListener("popstate", syncTab);
                };
            }), [ initialTab ]);
            (0, react__WEBPACK_IMPORTED_MODULE_2__.useEffect)((() => {
                if (!identity.ready) return;
                let cancelled = false;
                setSpace({
                    ..._src_lib_account_space_ts__WEBPACK_IMPORTED_MODULE_5__ /* .DEFAULT_ACCOUNT_SPACE */ .WU
                });
                setNotes([]);
                setBookings([]);
                setLoadedIdentity("");
                setEditOpen(false);
                setCancelOpen(false);
                setSessionError("");
                if (!identity.isLoggedIn) setLoadedIdentity(identity.identityId); else void (0, 
                _src_lib_account_db_ts__WEBPACK_IMPORTED_MODULE_16__ /* .loadMemberAccount */ .jz)(identity.identityId).then((data => {
                    if (cancelled) return;
                    setSpace(data.space);
                    setNotes(data.notes);
                    setBookings(data.bookings);
                })).catch((error => {
                    if (!cancelled) setSessionError(error instanceof Error ? error.message : "나의 공간을 불러오지 못했습니다.");
                })).finally((() => {
                    if (!cancelled) setLoadedIdentity(identity.identityId);
                }));
                return () => {
                    cancelled = true;
                };
            }), [ identity.ready, identity.identityId, identity.isLoggedIn, reload ]);
            (0, react__WEBPACK_IMPORTED_MODULE_2__.useEffect)((() => {
                setProfileDraft({
                    ...identity.profile
                });
                setProfileError("");
            }), [ identity.profile.name, identity.profile.email, identity.profile.phone ]);
            const favoritePrograms = favorites.flatMap((id => {
                const program = PROGRAMS.find((item => item.id === id));
                return program ? [ program ] : [];
            }));
            const displayedPrograms = favoritePrograms.length ? favoritePrograms.slice(0, 3) : RECOMMENDATIONS;
            const summary = (0, _src_lib_account_space_ts__WEBPACK_IMPORTED_MODULE_5__ /* .accountBookingSummary */ .ob)(bookings, today);
            const visibleBookings = bookings.filter((booking => bookingFilter === "cancelled" ? booking.status === "cancelled" : bookingFilter === "upcoming" ? (booking.status === "held" || booking.status === "reserved_unpaid") && booking.date >= today : true));
            const displayName = (dataReady ? space.nickname : "") || identity.profile.name || "관람객";
            const latestNote = notes[0];
            function selectTab(value) {
                if (!ACCOUNT_TABS.includes(value)) return;
                setActiveTab(value);
                const hash = "#account-panel-".concat(value);
                if (window.location.hash !== hash) window.history.pushState(null, "", hash);
            }
            // [명시적인 공간 저장과 즉시 조명 조작 / Explicit room save and immediate light control]
                        function openSpaceEditor() {
                if (!dataReady) return;
                if (!identity.isLoggedIn) {
                    (0, _SmallNotificationModal__WEBPACK_IMPORTED_MODULE_10__ /* .showSmallNotification */ .VX)("로그인한 뒤 나의 공간을 꾸며 주세요.");
                    return;
                }
                editTriggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
                setSpaceDraft({
                    ...space,
                    nickname: (space.nickname || identity.profile.name || "관람객").slice(0, 24)
                });
                setEditOpen(true);
            }
            async function saveSpace(event) {
                event.preventDefault();
                if (!dataReady || accountBusy) return;
                const next = {
                    ...spaceDraft,
                    nickname: spaceDraft.nickname.trim().slice(0, 24),
                    message: spaceDraft.message.trim().slice(0, 100)
                };
                if (!next.nickname) return;
                const owner = identity.identityId;
                setAccountBusy(true);
                try {
                    await (0, _src_lib_account_db_ts__WEBPACK_IMPORTED_MODULE_16__ /* .saveMemberSpace */ .fL)(next, owner);
                    if (activeIdentity.current !== owner) return;
                    setSpace(next);
                    setEditOpen(false);
                    (0, _SmallNotificationModal__WEBPACK_IMPORTED_MODULE_10__ /* .showSmallNotification */ .VX)("나의 공간을 저장했어요.");
                } catch (error) {
                    if (activeIdentity.current === owner) (0, _SmallNotificationModal__WEBPACK_IMPORTED_MODULE_10__ /* .showSmallNotification */ .VX)(error instanceof Error ? error.message : "나의 공간을 저장하지 못했습니다.");
                } finally {
                    setAccountBusy(false);
                }
            }
            async function toggleLight() {
                if (!dataReady || accountBusy) return;
                if (!identity.isLoggedIn) {
                    (0, _SmallNotificationModal__WEBPACK_IMPORTED_MODULE_10__ /* .showSmallNotification */ .VX)("로그인한 뒤 조명을 바꿔 주세요.");
                    return;
                }
                const next = {
                    ...space,
                    lightOn: !space.lightOn
                };
                const owner = identity.identityId;
                setAccountBusy(true);
                try {
                    await (0, _src_lib_account_db_ts__WEBPACK_IMPORTED_MODULE_16__ /* .saveMemberSpace */ .fL)(next, owner);
                    if (activeIdentity.current !== owner) return;
                    setSpace(next);
                    (0, _SmallNotificationModal__WEBPACK_IMPORTED_MODULE_10__ /* .showSmallNotification */ .VX)("공연장 조명을 ".concat(next.lightOn ? "켰어요" : "껐어요", "."));
                } catch (error) {
                    if (activeIdentity.current === owner) (0, _SmallNotificationModal__WEBPACK_IMPORTED_MODULE_10__ /* .showSmallNotification */ .VX)(error instanceof Error ? error.message : "조명을 저장하지 못했습니다.");
                } finally {
                    setAccountBusy(false);
                }
            }
            // [서버 예약의 확인 후 취소 / Confirm before cancelling a reservation]
                        function openCancellation(booking, trigger) {
                cancelTriggerRef.current = trigger;
                setPendingCancellation(booking);
                setCancelOpen(true);
            }
            async function cancelBooking() {
                if (!dataReady || !pendingCancellation || accountBusy) return;
                const owner = identity.identityId;
                setAccountBusy(true);
                try {
                    const result = await (0, _src_lib_account_db_ts__WEBPACK_IMPORTED_MODULE_16__ /* .cancelMemberBooking */ .KK)(pendingCancellation.id, owner);
                    if (activeIdentity.current !== owner) return;
                    cancelTriggerRef.current = document.getElementById("account-bookings-heading");
                    setBookings((current => current.map((booking => booking.id === pendingCancellation.id ? result : booking))));
                    setCancelOpen(false);
                    (0, _SmallNotificationModal__WEBPACK_IMPORTED_MODULE_10__ /* .showSmallNotification */ .VX)(result.status === "cancelled" ? "예약을 취소했습니다." : "예약 상태가 변경되었습니다. 내역을 확인해 주세요.");
                } catch (error) {
                    if (activeIdentity.current === owner) (0, _SmallNotificationModal__WEBPACK_IMPORTED_MODULE_10__ /* .showSmallNotification */ .VX)(error instanceof Error ? error.message : "예매 기록을 취소하지 못했습니다.");
                } finally {
                    setAccountBusy(false);
                }
            }
            // [회원 DB의 관람노트 / Identity-scoped database diary]
                        async function saveNote(draft) {
                if (!dataReady) return false;
                const valid = (0, _src_lib_account_space_ts__WEBPACK_IMPORTED_MODULE_5__ /* .validateAccountNote */ .MU)(draft, PROGRAM_IDS, today);
                if (!valid) return false;
                const owner = identity.identityId;
                const note = await (0, _src_lib_account_db_ts__WEBPACK_IMPORTED_MODULE_16__ /* .createMemberNote */ .qE)(valid, owner);
                if (activeIdentity.current !== owner) return false;
                setNotes((current => [ note, ...current ].slice(0, 100)));
                (0, _SmallNotificationModal__WEBPACK_IMPORTED_MODULE_10__ /* .showSmallNotification */ .VX)("관람노트를 남겼어요.");
                return true;
            }
            async function deleteNote(id) {
                if (!dataReady) return;
                const owner = identity.identityId;
                try {
                    await (0, _src_lib_account_db_ts__WEBPACK_IMPORTED_MODULE_16__ /* .removeMemberNote */ .Nn)(id, owner);
                    if (activeIdentity.current !== owner) return;
                    setNotes((current => current.filter((note => note.id !== id))));
                    (0, _SmallNotificationModal__WEBPACK_IMPORTED_MODULE_10__ /* .showSmallNotification */ .VX)("관람노트를 삭제했어요.");
                } catch (error) {
                    if (activeIdentity.current === owner) (0, _SmallNotificationModal__WEBPACK_IMPORTED_MODULE_10__ /* .showSmallNotification */ .VX)(error instanceof Error ? error.message : "관람노트를 삭제하지 못했습니다.");
                }
            }
            // [실제 세션의 프로필과 로그아웃 / Profile and sign-out for the actual identity]
                        async function saveProfile(event) {
                event.preventDefault();
                if (profileSaving || !identity.isLoggedIn) return;
                setProfileError("");
                setProfileSaving(true);
                try {
                    await identity.updateProfile(profileDraft);
                    (0, _SmallNotificationModal__WEBPACK_IMPORTED_MODULE_10__ /* .showSmallNotification */ .VX)("회원정보를 저장했어요.");
                } catch (error) {
                    setProfileError(error instanceof Error ? error.message : "회원정보를 저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
                } finally {
                    setProfileSaving(false);
                }
            }
            async function logout() {
                setSessionError("");
                try {
                    await identity.logout();
                    (0, _SmallNotificationModal__WEBPACK_IMPORTED_MODULE_10__ /* .showSmallNotification */ .VX)("로그아웃했어요.");
                } catch (error) {
                    setSessionError(error instanceof Error ? error.message : "로그아웃하지 못했어요. 다시 시도해 주세요.");
                }
            }
            const spacePanel =   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                className: "account-space-panel",
                children: [ 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* ["default"] */)(_AccountMiniRoom__WEBPACK_IMPORTED_MODULE_6__.Z, {
                    name: displayName,
                    message: space.message,
                    theme: space.theme,
                    lightOn: space.lightOn,
                    programs: displayedPrograms,
                    hasFavorites: favoritePrograms.length > 0,
                    onEdit: openSpaceEditor,
                    onToggleLight: toggleLight
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("section", {
                    "data-text": "body",
                    className: "account-next-visit",
                    "aria-labelledby": "account-next-heading",
                    children: [ 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                        className: "account-section-heading",
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h2", {
                            "data-text": "heading",
                            id: "account-next-heading",
                            children: "다음에 만날 무대"
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("a", {
                            "data-text": "action",
                            href: "#account-panel-bookings",
                            children: [ "예매내역 보기 ", 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* ["default"] */)(_Icon__WEBPACK_IMPORTED_MODULE_8__.Z, {
                                name: "arrow",
                                size: 20
                            }) ]
                        }) ]
                    }), summary.next ?   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .AccountTicket */)(_AccountPanels__WEBPACK_IMPORTED_MODULE_7__.pN, {
                        booking: summary.next,
                        program: PROGRAMS.find((program => {
                            var _summary_next;
                            return program.id === ((_summary_next = summary.next) === null || _summary_next === void 0 ? void 0 : _summary_next.programId);
                        })),
                        variant: "compact"
                    }) :   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                        className: "account-empty-inline",
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                            children: [ 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h3", {
                                "data-text": "subheading",
                                children: "관람 예정인 예약이 없습니다"
                            }), 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                                "data-text": "body",
                                children: "프로그램을 둘러보고 관람 일정을 확인하세요."
                            }) ]
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_13__.SystemLink, {
                            "data-text": "action",
                            variant: "secondary",
                            href: "/programs/",
                            children: [ "공연 둘러보기 ", 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* ["default"] */)(_Icon__WEBPACK_IMPORTED_MODULE_8__.Z, {
                                name: "arrow",
                                size: 20
                            }) ]
                        }) ]
                    }) ]
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("section", {
                    "aria-labelledby": "account-curation-heading",
                    children: [ 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                        "data-text": "body",
                        className: "account-section-heading",
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                            children: [ 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h2", {
                                "data-text": "heading",
                                id: "account-curation-heading",
                                children: favoritePrograms.length ? "내 마음에 담은 공연" : "새로운 취향을 만나 보세요"
                            }), 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                                "data-text": "body",
                                children: favoritePrograms.length ? "좋아하는 공연이 나의 공간을 채워요." : "세종의 공연 중 세 편을 먼저 골라 두었어요."
                            }) ]
                        }), favoritePrograms.length ?   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("a", {
                            "data-text": "action",
                            href: "#account-panel-favorites",
                            children: [ "전체 보기 ", 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* ["default"] */)(_Icon__WEBPACK_IMPORTED_MODULE_8__.Z, {
                                name: "arrow",
                                size: 20
                            }) ]
                        }) :   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(next_link__WEBPACK_IMPORTED_MODULE_3__["default"], {
                            "data-text": "action",
                            href: "/programs/",
                            children: [ "전체 보기 ", 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* ["default"] */)(_Icon__WEBPACK_IMPORTED_MODULE_8__.Z, {
                                name: "arrow",
                                size: 20
                            }) ]
                        }) ]
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", {
                        "data-text": "body",
                        className: "account-program-grid",
                        children: displayedPrograms.map((program =>   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* ["default"] */)(_ProgramCard__WEBPACK_IMPORTED_MODULE_9__.Z, {
                            program: program
                        }, program.id)))
                    }) ]
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("section", {
                    "data-text": "body",
                    className: "account-latest-note",
                    "aria-labelledby": "account-latest-note-heading",
                    children: [ 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                        className: "account-section-heading",
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h2", {
                            "data-text": "heading",
                            id: "account-latest-note-heading",
                            children: "무대가 남긴 한 줄"
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("a", {
                            "data-text": "action",
                            href: "#account-panel-notes",
                            children: [ "관람노트 쓰기 ", 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* ["default"] */)(_Icon__WEBPACK_IMPORTED_MODULE_8__.Z, {
                                name: "plus",
                                size: 20
                            }) ]
                        }) ]
                    }), latestNote ?   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                        className: "account-note-preview",
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("time", {
                            "data-text": "meta",
                            dateTime: latestNote.date,
                            children: latestNote.date.replaceAll("-", ".")
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h3", {
                            "data-text": "subheading",
                            children: ((_PROGRAMS_find = PROGRAMS.find((program => program.id === latestNote.programId))) === null || _PROGRAMS_find === void 0 ? void 0 : _PROGRAMS_find.title) || "나의 관람 기록"
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                            "data-text": "body",
                            children: latestNote.body
                        }) ]
                    }) :   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                        "data-text": "body",
                        className: "account-empty-note",
                        children: "아직 작성한 관람노트가 없습니다. 관람한 프로그램과 날짜를 선택해 기록하세요."
                    }) ]
                }) ]
            });
            const bookingsPanel =   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("section", {
                "data-text": "body",
                className: "account-bookings-panel",
                "aria-labelledby": "account-bookings-heading",
                children: [ 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                    className: "account-section-heading",
                    children: [ 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h2", {
                            "data-text": "heading",
                            id: "account-bookings-heading",
                            tabIndex: -1,
                            children: "나의 예매내역"
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                            "data-text": "body",
                            children: "관람 일정과 좌석을 확인하세요."
                        }) ]
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_13__.SystemLink, {
                        "data-text": "action",
                        variant: "quiet",
                        href: OFFICIAL_ACCOUNT,
                        target: "_blank",
                        children: [ "예매 서비스 열기 ", 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* ["default"] */)(_Icon__WEBPACK_IMPORTED_MODULE_8__.Z, {
                            name: "diagonal",
                            size: 20
                        }) ]
                    }) ]
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", {
                    "data-text": "body",
                    className: "account-booking-filters",
                    "aria-label": "예매내역 필터",
                    children: [ {
                        id: "all",
                        label: "전체 ".concat(bookings.length)
                    }, {
                        id: "upcoming",
                        label: "관람 예정 ".concat(summary.upcoming)
                    }, {
                        id: "cancelled",
                        label: "취소 ".concat(summary.cancelled)
                    } ].map((filter =>   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .SystemFilterButton */)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_13__.BV, {
                        "data-text": "action",
                        selected: bookingFilter === filter.id,
                        onClick: () => setBookingFilter(filter.id),
                        children: filter.label
                    }, filter.id)))
                }), visibleBookings.length ?   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", {
                    "data-text": "body",
                    className: "account-ticket-list",
                    children: visibleBookings.map((booking =>   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .AccountTicket */)(_AccountPanels__WEBPACK_IMPORTED_MODULE_7__.pN, {
                        booking: booking,
                        program: PROGRAMS.find((program => program.id === booking.programId)),
                        onCancel: openCancellation
                    }, booking.id)))
                }) :   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                    className: "account-empty",
                    children: [ 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h3", {
                        "data-text": "subheading",
                        children: bookingFilter === "all" ? "아직 저장한 예매가 없어요." : "이 조건에 맞는 예매 기록이 없어요."
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                        "data-text": "body",
                        children: "공연을 둘러보고 나에게 맞는 다음 무대를 찾아보세요."
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_13__.SystemLink, {
                        "data-text": "action",
                        href: "/programs/",
                        variant: "secondary",
                        children: [ "공연 둘러보기 ", 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* ["default"] */)(_Icon__WEBPACK_IMPORTED_MODULE_8__.Z, {
                            name: "arrow",
                            size: 20
                        }) ]
                    }) ]
                }) ]
            });
            const favoritesPanel =   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("section", {
                "data-text": "body",
                "aria-labelledby": "account-favorites-heading",
                children: [ 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                    className: "account-section-heading",
                    children: [ 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h2", {
                            "data-text": "heading",
                            id: "account-favorites-heading",
                            children: "내 마음에 담은 프로그램"
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                            "data-text": "body",
                            children: "관심 표시한 공연·전시·교육을 다시 만나 보세요."
                        }) ]
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("span", {
                        "data-text": "body",
                        children: [ favoritePrograms.length, "편" ]
                    }) ]
                }), favoritePrograms.length ?   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", {
                    "data-text": "body",
                    className: "account-list account-program-grid",
                    children: favoritePrograms.map((program =>   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* ["default"] */)(_ProgramCard__WEBPACK_IMPORTED_MODULE_9__.Z, {
                        program: program
                    }, program.id)))
                }) :   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                    className: "account-empty",
                    children: [ 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h3", {
                        "data-text": "subheading",
                        children: "어떤 공연에 마음이 가나요?"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                        "data-text": "body",
                        children: "프로그램의 하트를 누르면 나의 작은 공연장에도 포스터가 걸려요."
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_13__.SystemLink, {
                        "data-text": "action",
                        href: "/programs/",
                        variant: "secondary",
                        children: [ "프로그램 둘러보기 ", 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* ["default"] */)(_Icon__WEBPACK_IMPORTED_MODULE_8__.Z, {
                            name: "heart",
                            size: 20
                        }) ]
                    }) ]
                }) ]
            });
            const servicesPanel =   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("section", {
                "aria-labelledby": "account-services-heading",
                children: [ 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", {
                    className: "account-section-heading",
                    children:   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h2", {
                            "data-text": "heading",
                            id: "account-services-heading",
                            children: "나의 신청과 회원 혜택"
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                            "data-text": "body",
                            children: "신청 현황과 멤버십 혜택을 확인하세요."
                        }) ]
                    })
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                    className: "account-service-list",
                    children: [ 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("article", {
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                            children: [ 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h3", {
                                "data-text": "subheading",
                                children: "회원 등급·포인트·쿠폰"
                            }), 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                                "data-text": "body",
                                children: "나의 멤버십과 사용 가능한 혜택을 확인하세요."
                            }) ]
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_13__.SystemLink, {
                            "data-text": "action",
                            href: OFFICIAL_ACCOUNT,
                            target: "_blank",
                            variant: "secondary",
                            children: [ "세종문화회관 마이페이지 ", 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* ["default"] */)(_Icon__WEBPACK_IMPORTED_MODULE_8__.Z, {
                                name: "diagonal",
                                size: 20
                            }) ]
                        }) ]
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("article", {
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                            children: [ 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h3", {
                                "data-text": "subheading",
                                children: "교육·행사 신청내역"
                            }), 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                                "data-text": "body",
                                children: "신청 현황과 참여 안내를 확인하세요."
                            }) ]
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_13__.SystemLink, {
                            "data-text": "action",
                            href: OFFICIAL_ACCOUNT,
                            target: "_blank",
                            variant: "quiet",
                            children: [ "신청내역 확인 ", 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* ["default"] */)(_Icon__WEBPACK_IMPORTED_MODULE_8__.Z, {
                                name: "diagonal",
                                size: 20
                            }) ]
                        }) ]
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("article", {
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                            children: [ 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h3", {
                                "data-text": "subheading",
                                children: "취향을 넓히는 예술 수업"
                            }), 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                                "data-text": "body",
                                children: "새로운 배움과 만남을 위한 교육 프로그램을 살펴보세요."
                            }) ]
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_13__.SystemLink, {
                            "data-text": "action",
                            href: "/programs/education/",
                            variant: "quiet",
                            children: [ "교육 프로그램 보기 ", 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* ["default"] */)(_Icon__WEBPACK_IMPORTED_MODULE_8__.Z, {
                                name: "arrow",
                                size: 20
                            }) ]
                        }) ]
                    }) ]
                }) ]
            });
            const profilePanel =   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("section", {
                "data-text": "body",
                className: "account-profile-panel",
                "aria-labelledby": "account-profile-heading",
                children: [ 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", {
                    className: "account-section-heading",
                    children:   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h2", {
                            "data-text": "heading",
                            id: "account-profile-heading",
                            children: "회원정보"
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                            "data-text": "body",
                            children: identity.mode === "oauth" ? "로그인한 계정의 이름과 연락처를 관리해요." : "저장한 프로필의 이름과 연락처를 관리해요."
                        }) ]
                    })
                }), identity.isLoggedIn ?   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("form", {
                    className: "account-profile-form",
                    onSubmit: saveProfile,
                    children: [ 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .SystemField */)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_13__.RK, {
                        "data-text": "body",
                        variant: "flow",
                        label: "이름",
                        id: "account-profile-name",
                        name: "name",
                        autoComplete: "name",
                        value: profileDraft.name,
                        onChange: event => setProfileDraft((current => ({
                            ...current,
                            name: event.target.value
                        }))),
                        maxLength: 50,
                        required: true
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .SystemField */)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_13__.RK, {
                        "data-text": "body",
                        variant: "flow",
                        label: "이메일",
                        id: "account-profile-email",
                        name: "email",
                        type: "email",
                        autoComplete: "email",
                        value: profileDraft.email,
                        readOnly: identity.mode === "oauth",
                        hint: identity.mode === "oauth" ? "Google 로그인 이메일은 Google 계정에서 변경할 수 있어요." : undefined,
                        onChange: event => setProfileDraft((current => ({
                            ...current,
                            email: event.target.value
                        }))),
                        required: true
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .SystemField */)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_13__.RK, {
                        "data-text": "body",
                        variant: "flow",
                        label: "연락처",
                        id: "account-profile-phone",
                        name: "phone",
                        type: "tel",
                        autoComplete: "tel",
                        value: profileDraft.phone,
                        onChange: event => setProfileDraft((current => ({
                            ...current,
                            phone: event.target.value
                        }))),
                        maxLength: 24
                    }), profileError &&   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .SystemNotice */)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_13__.F0, {
                        "data-text": "body",
                        error: true,
                        title: "회원정보를 저장하지 못했어요",
                        children: profileError
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", {
                        className: "account-form-actions",
                        children:   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .SystemButton */)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_13__.kR, {
                            "data-text": "action",
                            type: "submit",
                            context: "flow",
                            disabled: profileSaving,
                            children: profileSaving ? "저장 중…" : "회원정보 저장"
                        })
                    }) ]
                }) :   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                    className: "account-empty",
                    children: [ 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h3", {
                        "data-text": "subheading",
                        children: "로그인하고 나의 정보를 관리하세요."
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                        "data-text": "body",
                        children: "로그인한 회원의 이름과 연락처를 이곳에서 확인할 수 있어요."
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_13__.SystemLink, {
                        "data-text": "action",
                        href: "/account/login/",
                        children: [ "로그인 / 회원가입 ", 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* ["default"] */)(_Icon__WEBPACK_IMPORTED_MODULE_8__.Z, {
                            name: "arrow",
                            size: 20
                        }) ]
                    }) ]
                }) ]
            });
             
            return (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                className: "account-page account-experience",
                children: [ 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("section", {
                    className: "account-page-heading",
                    id: "account-page-heading",
                    children:   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                        className: "container",
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("nav", {
                            className: "account-breadcrumbs",
                            "aria-label": "현재 위치",
                            children: [ 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(next_link__WEBPACK_IMPORTED_MODULE_3__["default"], {
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
                                children: "마이페이지"
                            }) ]
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h1", {
                            "data-text": "title",
                            children: "마이페이지"
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                            "data-text": "body",
                            children: "내가 고른 공연과 한 줄의 기록, 나만의 세종을 채워가요."
                        }) ]
                    })
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                    className: "container account-layout",
                    "aria-busy": !dataReady,
                    children: [ 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* ["default"] */)(_SystemSurface__WEBPACK_IMPORTED_MODULE_1__.ZP, {
                        as: "aside",
                        variant: "subtle",
                        padding: "lg",
                        radius: "panel",
                        className: "account-profile-aside",
                        children:   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .AccountMembershipCard */)(_AccountPanels__WEBPACK_IMPORTED_MODULE_7__.pS, {
                            name: displayName,
                            message: dataReady ? space.message : _src_lib_account_space_ts__WEBPACK_IMPORTED_MODULE_5__ /* .DEFAULT_ACCOUNT_SPACE */ .WU.message,
                            mode: identity.mode,
                            counts: {
                                upcoming: dataReady ? summary.upcoming : 0,
                                favorites: favoritePrograms.length,
                                notes: dataReady ? notes.length : 0
                            },
                            onEdit: openSpaceEditor,
                            onLogout: () => void logout()
                        })
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                        "data-text": "body",
                        className: "account-main",
                        children: [ sessionError &&   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs /* .SystemNotice */)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_13__.F0, {
                            "data-text": "body",
                            error: true,
                            title: "계정 상태를 확인해 주세요",
                            children: [ sessionError, 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .SystemButton */)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_13__.kR, {
                                "data-text": "action",
                                variant: "quiet",
                                onClick: () => setReload((value => value + 1)),
                                children: "다시 불러오기"
                            }) ]
                        }), !dataReady ?   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                            "data-text": "body",
                            className: "account-loading",
                            role: "status",
                            children: "나의 공간을 불러오고 있어요."
                        }) :   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .SystemTabs */)(_SystemNavigation__WEBPACK_IMPORTED_MODULE_12__.T, {
                            idPrefix: "account",
                            "aria-label": "마이페이지 메뉴",
                            className: "account-tabs",
                            tabListClassName: "account-tab-list",
                            panelClassName: "account-tab-panel",
                            value: activeTab,
                            onValueChange: selectTab,
                            items: [ {
                                id: "space",
                                label: "나의 공간",
                                content: spacePanel
                            }, {
                                id: "bookings",
                                label: "예매내역 (".concat(bookings.length, ")"),
                                content: bookingsPanel
                            }, {
                                id: "favorites",
                                label: "관심 프로그램 (".concat(favoritePrograms.length, ")"),
                                content: favoritesPanel
                            }, {
                                id: "notes",
                                label: "관람노트",
                                content:   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .AccountDiary */)(_AccountPanels__WEBPACK_IMPORTED_MODULE_7__.Lh, {
                                    programs: PROGRAMS,
                                    notes: notes,
                                    today: today,
                                    onSave: saveNote,
                                    onDelete: deleteNote
                                })
                            }, {
                                id: "services",
                                label: "신청·혜택",
                                content: servicesPanel
                            }, {
                                id: "profile",
                                label: "회원정보",
                                content: profilePanel
                            } ]
                        }) ]
                    }) ]
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* ["default"] */)(_SystemDialog__WEBPACK_IMPORTED_MODULE_11__.Z, {
                    className: "account-space-dialog",
                    open: editOpen,
                    triggerRef: editTriggerRef,
                    "aria-labelledby": "account-space-dialog-heading",
                    "aria-describedby": "account-space-dialog-description",
                    onClose: () => setEditOpen(false),
                    children:   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("form", {
                        className: "account-space-form",
                        onSubmit: saveSpace,
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                            className: "account-dialog-heading",
                            children: [ 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h2", {
                                "data-text": "heading",
                                id: "account-space-dialog-heading",
                                children: "나의 공간 꾸미기"
                            }), 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                                "data-text": "body",
                                id: "account-space-dialog-description",
                                children: "이름과 한마디, 공연장의 빛을 골라 보세요."
                            }) ]
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .SystemField */)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_13__.RK, {
                            "data-text": "body",
                            label: "공간에서 사용할 이름",
                            id: "account-space-name",
                            value: spaceDraft.nickname,
                            onChange: event => setSpaceDraft((current => ({
                                ...current,
                                nickname: event.target.value
                            }))),
                            maxLength: 24,
                            required: true,
                            autoFocus: true
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .SystemField */)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_13__.RK, {
                            "data-text": "body",
                            as: "textarea",
                            label: "나의 한마디",
                            id: "account-space-message",
                            value: spaceDraft.message,
                            onChange: event => setSpaceDraft((current => ({
                                ...current,
                                message: event.target.value
                            }))),
                            maxLength: 100,
                            rows: 3
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("fieldset", {
                            className: "account-theme-picker",
                            children: [ 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("legend", {
                                "data-text": "label",
                                children: "공연장 분위기"
                            }), 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", {
                                "data-text": "body",
                                children: _src_lib_account_space_ts__WEBPACK_IMPORTED_MODULE_5__ /* .ACCOUNT_THEMES */ .PW.map((theme =>   (0, 
                                react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .SystemFilterButton */)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_13__.BV, {
                                    "data-text": "action",
                                    selected: spaceDraft.theme === theme.id,
                                    onClick: () => setSpaceDraft((current => ({
                                        ...current,
                                        theme: theme.id
                                    }))),
                                    children: theme.label
                                }, theme.id)))
                            }) ]
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                            className: "account-dialog-actions",
                            children: [ 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .SystemButton */)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_13__.kR, {
                                "data-text": "action",
                                variant: "secondary",
                                onClick: () => setEditOpen(false),
                                children: "취소"
                            }), 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .SystemButton */)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_13__.kR, {
                                "data-text": "action",
                                type: "submit",
                                disabled: accountBusy,
                                children: accountBusy ? "저장 중…" : "공간에 적용"
                            }) ]
                        }) ]
                    })
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs /* ["default"] */)(_SystemDialog__WEBPACK_IMPORTED_MODULE_11__.Z, {
                    className: "account-cancel-dialog",
                    open: cancelOpen,
                    triggerRef: cancelTriggerRef,
                    initialFocusRef: cancelCloseRef,
                    "aria-labelledby": "account-cancel-heading",
                    "aria-describedby": "account-cancel-description",
                    onClose: () => {
                        setCancelOpen(false);
                        setPendingCancellation(null);
                    },
                    children: [ 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                        className: "account-dialog-heading",
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h2", {
                            "data-text": "heading",
                            id: "account-cancel-heading",
                            children: "이 예매 기록을 취소할까요?"
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("p", {
                            "data-text": "body",
                            id: "account-cancel-description",
                            children: [ pendingCancellation === null || pendingCancellation === void 0 ? void 0 : pendingCancellation.title, 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("br", {}), "취소한 기록은 예매내역에서 다시 확인할 수 있어요." ]
                        }) ]
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                        className: "account-dialog-actions",
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .SystemButton */)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_13__.kR, {
                            "data-text": "action",
                            ref: cancelCloseRef,
                            variant: "secondary",
                            onClick: () => setCancelOpen(false),
                            children: "돌아가기"
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .SystemButton */)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_13__.kR, {
                            "data-text": "action",
                            onClick: cancelBooking,
                            disabled: accountBusy,
                            children: "예매 기록 취소"
                        }) ]
                    }) ]
                }) ]
            });
        }
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
} ]);
//# sourceMappingURL=AccountExperience_1.js.map