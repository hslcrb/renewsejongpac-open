(self["webpackChunk_N_E"] = self["webpackChunk_N_E"] || []).push([ [ 185 ], {
    /***/ 3107: 
    /***/ function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {
        Promise.resolve().then(__webpack_require__.bind(__webpack_require__, 1492));
        Promise.resolve().then(__webpack_require__.bind(__webpack_require__, 7048));
        Promise.resolve().then(__webpack_require__.t.bind(__webpack_require__, 8286, 23));
        Promise.resolve().then(__webpack_require__.t.bind(__webpack_require__, 4122, 23));
        Promise.resolve().then(__webpack_require__.t.bind(__webpack_require__, 7780, 23));
        Promise.resolve().then(__webpack_require__.t.bind(__webpack_require__, 5142, 23));
        Promise.resolve().then(__webpack_require__.t.bind(__webpack_require__, 5345, 23));
        Promise.resolve().then(__webpack_require__.t.bind(__webpack_require__, 4504, 23));
        Promise.resolve().then(__webpack_require__.t.bind(__webpack_require__, 1706, 23));
        Promise.resolve().then(__webpack_require__.t.bind(__webpack_require__, 6523, 23));
        Promise.resolve().then(__webpack_require__.t.bind(__webpack_require__, 1090, 23));
        Promise.resolve().then(__webpack_require__.t.bind(__webpack_require__, 3595, 23));
        Promise.resolve().then(__webpack_require__.t.bind(__webpack_require__, 7569, 23));
        Promise.resolve().then(__webpack_require__.t.bind(__webpack_require__, 4889, 23));
        Promise.resolve().then(__webpack_require__.t.bind(__webpack_require__, 9080, 23));
        Promise.resolve().then(__webpack_require__.t.bind(__webpack_require__, 8435, 23));
        Promise.resolve().then(__webpack_require__.t.bind(__webpack_require__, 8270, 23));
        Promise.resolve().then(__webpack_require__.t.bind(__webpack_require__, 687, 23));
        Promise.resolve().then(__webpack_require__.t.bind(__webpack_require__, 4779, 23));
        Promise.resolve().then(__webpack_require__.t.bind(__webpack_require__, 9743, 23));
        Promise.resolve().then(__webpack_require__.t.bind(__webpack_require__, 4080, 23));
        Promise.resolve().then(__webpack_require__.t.bind(__webpack_require__, 5979, 23));
        Promise.resolve().then(__webpack_require__.t.bind(__webpack_require__, 1265, 23));
        Promise.resolve().then(__webpack_require__.t.bind(__webpack_require__, 3485, 23));
        Promise.resolve().then(__webpack_require__.t.bind(__webpack_require__, 7383, 23));
        Promise.resolve().then(__webpack_require__.t.bind(__webpack_require__, 7098, 23));
        Promise.resolve().then(__webpack_require__.t.bind(__webpack_require__, 3506, 23));
        Promise.resolve().then(__webpack_require__.t.bind(__webpack_require__, 8275, 23));
        Promise.resolve().then(__webpack_require__.t.bind(__webpack_require__, 7211, 23));
        Promise.resolve().then(__webpack_require__.t.bind(__webpack_require__, 700, 23));
        Promise.resolve().then(__webpack_require__.t.bind(__webpack_require__, 1695, 23));
        Promise.resolve().then(__webpack_require__.t.bind(__webpack_require__, 8021, 23));
        Promise.resolve().then(__webpack_require__.t.bind(__webpack_require__, 3488, 23));
        Promise.resolve().then(__webpack_require__.t.bind(__webpack_require__, 989, 23));
        Promise.resolve().then(__webpack_require__.t.bind(__webpack_require__, 3522, 23));
        Promise.resolve().then(__webpack_require__.t.bind(__webpack_require__, 4835, 23));
        Promise.resolve().then(__webpack_require__.t.bind(__webpack_require__, 3530, 23));
        Promise.resolve().then(__webpack_require__.t.bind(__webpack_require__, 7050, 23));
        Promise.resolve().then(__webpack_require__.t.bind(__webpack_require__, 5791, 23));
        Promise.resolve().then(__webpack_require__.t.bind(__webpack_require__, 9690, 23));
        /***/    },
    /***/ 1492: 
    /***/ function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        "use strict";
        // EXPORTS
                __webpack_require__.d(__webpack_exports__, {
            default: function() {
                /* binding */ return SiteShell;
            }
        });
        // EXTERNAL MODULE: ./node_modules/next/dist/compiled/react/jsx-runtime.js
                var jsx_runtime = __webpack_require__(7437);
        // EXTERNAL MODULE: ./node_modules/next/dist/api/navigation.js
                var navigation = __webpack_require__(9376);
        // EXTERNAL MODULE: ./node_modules/next/dist/compiled/react/index.js
                var react = __webpack_require__(2265);
        // EXTERNAL MODULE: ./node_modules/next/dist/api/link.js
                var api_link = __webpack_require__(7648);
        // EXTERNAL MODULE: ./src/data/catalog.ts
                var catalog = __webpack_require__(9366);
        // EXTERNAL MODULE: ./components/FloatingMenu.tsx
                var FloatingMenu = __webpack_require__(9378);
        // EXTERNAL MODULE: ./components/SystemPrimitives.tsx
                var SystemPrimitives = __webpack_require__(6983);
        // EXTERNAL MODULE: ./components/SystemDialog.tsx
                var SystemDialog = __webpack_require__(1914);
        // EXTERNAL MODULE: ./components/Icon.tsx
                var Icon = __webpack_require__(9140);
        // EXTERNAL MODULE: ./src/lib/panel-snapshot.ts
                var panel_snapshot = __webpack_require__(7880);
        // EXTERNAL MODULE: ./components/useAccountIdentity.ts
                var useAccountIdentity = __webpack_require__(7215);
        // CONCATENATED MODULE: ./components/Header.tsx
        /* __next_internal_client_entry_do_not_use__ HEADER_VARIANTS,default auto */
        const HEADER_VARIANTS = /* unused pure expression or super */ null && [ "default", "inverse" ];
        function Header() {
            let {variant: variant} = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
            const pathname = (0, navigation.usePathname)();
            const router = (0, navigation.useRouter)();
            const headerVariant = variant || (pathname === "/about/introduction" || pathname === "/about/introduction/" ? "inverse" : "default");
            const {isLoggedIn: isLoggedIn} = (0, useAccountIdentity /* default */ .ZP)();
            const [searchOpen, setSearchOpen] = (0, react.useState)(false);
            const [menuOpen, setMenuOpen] = (0, react.useState)(false);
            const [searchQuery, setSearchQuery] = (0, react.useState)("");
            const menuTrigger = (0, react.useRef)(null);
            const searchTrigger = (0, react.useRef)(null);
            const searchField = (0, react.useRef)(null);
            const menuPosition = (0, react.useRef)(null);
            const closeMenu = (0, react.useCallback)((() => setMenuOpen(false)), []);
            // ESC 키로 모달 닫기
                        (0, react.useEffect)((() => {
                const handleKeyDown = e => {
                    if (e.key === "Escape") {
                        setSearchOpen(false);
                        setMenuOpen(false);
                    }
                };
                window.addEventListener("keydown", handleKeyDown);
                return () => window.removeEventListener("keydown", handleKeyDown);
            }), []);
            // 라우트 변경 시 모달 자동 닫기
                        (0, react.useEffect)((() => {
                setSearchOpen(false);
                setMenuOpen(false);
            }), [ pathname ]);
            const handleSearchSubmit = e => {
                e.preventDefault();
                if (searchQuery.trim()) {
                    router.push("/search?q=".concat(encodeURIComponent(searchQuery.trim())));
                    setSearchOpen(false);
                }
            };
             
            return (0, jsx_runtime.jsxs)("header", {
                id: "header",
                className: "renewal-header",
                "data-component-id": "header",
                "data-header-variant": headerVariant,
                children: [ 
                
                 (0, jsx_runtime.jsxs)("div", {
                    className: "masthead container",
                    children: [ 
                    
                     (0, jsx_runtime.jsx)(api_link["default"], {
                        "data-text": "action",
                        href: "/",
                        className: "sejong-brand",
                        "aria-label": "세종문화회관 홈",
                        children:   (0, jsx_runtime.jsx)("img", {
                            className: "sejong-wordmark",
                            src: "/v5/assets/images/sejong-wordmark.png",
                            alt: "세종문화회관",
                            width: 236,
                            height: 43,
                            onError: e => {
                                // fallback if basePath isn't prepended automatically
                                const target = e.currentTarget;
                                if (!target.src.includes("/assets/")) {
                                    target.src = "/assets/images/sejong-wordmark.png";
                                }
                            }
                        })
                    }), 
                    
                     (0, jsx_runtime.jsx)("nav", {
                        "data-text": "body",
                        className: "desktop-nav",
                        "aria-label": "주 메뉴",
                        children: catalog /* NAV */ .w$.map((item => {
                            const active = pathname === item.path || pathname.startsWith(item.path + "/");
                             
                            return (0, jsx_runtime.jsx)(api_link["default"], {
                                "data-text": "navigation",
                                href: item.path,
                                "data-nav": item.id,
                                "aria-current": active ? "page" : undefined,
                                className: active ? "active" : "",
                                children: item.title
                            }, item.id);
                        }))
                    }), 
                    
                     (0, jsx_runtime.jsxs)("div", {
                        "data-text": "body",
                        className: "masthead-actions",
                        children: [ isLoggedIn ?   (0, jsx_runtime.jsx)(api_link["default"], {
                            "data-text": "utility",
                            href: "/account",
                            className: "account-link",
                            children: "마이페이지"
                        }) :   (0, jsx_runtime.jsxs)(jsx_runtime.Fragment, {
                            children: [ 
                            
                             (0, jsx_runtime.jsx)(api_link["default"], {
                                "data-text": "utility",
                                href: "/account/login",
                                className: "account-link",
                                children: "로그인"
                            }), 
                            
                             (0, jsx_runtime.jsx)(api_link["default"], {
                                "data-text": "utility",
                                href: "/account/login",
                                className: "account-link signup-link",
                                children: "회원가입"
                            }) ]
                        }), 
                        
                         (0, jsx_runtime.jsx)(api_link["default"], {
                            "data-text": "utility",
                            href: "/english",
                            className: "english-link",
                            lang: "en",
                            children: "EN"
                        }), 
                        
                         (0, jsx_runtime.jsx /* SystemIconButton */)(SystemPrimitives.MW, {
                            "data-text": "action",
                            variant: headerVariant === "inverse" ? "inverse-quiet" : "quiet",
                            ref: searchTrigger,
                            type: "button",
                            onClick: () => {
                                setMenuOpen(false);
                                setSearchOpen(true);
                            },
                            "aria-label": "통합검색 열기",
                            "aria-haspopup": "dialog",
                            "aria-expanded": searchOpen,
                            "aria-controls": "search-dialog",
                            children:   (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                                name: "search",
                                group: "header-action"
                            })
                        }), 
                        
                         (0, jsx_runtime.jsx /* SystemIconButton */)(SystemPrimitives.MW, {
                            "data-text": "action",
                            variant: headerVariant === "inverse" ? "inverse-quiet" : "quiet",
                            ref: menuTrigger,
                            type: "button",
                            onClick: () => {
                                setSearchOpen(false);
                                setMenuOpen(!menuOpen);
                            },
                            "aria-label": "전체 메뉴 열기",
                            "aria-haspopup": "dialog",
                            "aria-expanded": menuOpen,
                            "aria-controls": "menu-dialog",
                            onPointerEnter: () => {
                                void (0, panel_snapshot /* warmPanelSnapshot */ .jD)();
                            },
                            onFocus: () => {
                                void (0, panel_snapshot /* warmPanelSnapshot */ .jD)();
                            },
                            children:   (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                                name: "menu",
                                group: "header-action"
                            })
                        }) ]
                    }) ]
                }), 
                
                 (0, jsx_runtime.jsxs /* default */)(SystemDialog.Z, {
                    className: "navigation-dialog",
                    open: searchOpen,
                    onClose: () => setSearchOpen(false),
                    triggerRef: searchTrigger,
                    initialFocusRef: searchField,
                    id: "search-dialog",
                    "aria-labelledby": "search-heading",
                    children: [ 
                    
                     (0, jsx_runtime.jsx)("div", {
                        className: "dialog-top",
                        children:   (0, jsx_runtime.jsx /* SystemIconButton */)(SystemPrimitives.MW, {
                            "data-text": "action",
                            type: "button",
                            onClick: () => setSearchOpen(false),
                            "aria-label": "검색 닫기",
                            children:   (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                                name: "close",
                                size: 22
                            })
                        })
                    }), 
                    
                     (0, jsx_runtime.jsx)("h2", {
                        "data-text": "heading",
                        id: "search-heading",
                        children: "어떤 예술을 찾고 계세요?"
                    }), 
                    
                     (0, jsx_runtime.jsxs)("form", {
                        className: "site-search",
                        onSubmit: handleSearchSubmit,
                        children: [ 
                        
                         (0, jsx_runtime.jsx /* SystemField */)(SystemPrimitives.RK, {
                            "data-text": "body",
                            ref: searchField,
                            label: "검색어",
                            labelHidden: true,
                            outerClassName: "site-search-field",
                            id: "global-query",
                            name: "q",
                            type: "search",
                            placeholder: "공연, 전시, 공간을 검색해 보세요",
                            required: true,
                            autoComplete: "off",
                            value: searchQuery,
                            onChange: e => setSearchQuery(e.target.value)
                        }), 
                        
                         (0, jsx_runtime.jsx /* SystemIconButton */)(SystemPrimitives.MW, {
                            "data-text": "action",
                            type: "submit",
                            "aria-label": "검색",
                            children:   (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                                name: "search",
                                size: 22
                            })
                        }) ]
                    }), 
                    
                     (0, jsx_runtime.jsxs)("div", {
                        "data-text": "body",
                        className: "search-terms",
                        children: [ 
                        
                         (0, jsx_runtime.jsx)("span", {
                            "data-text": "body",
                            children: "추천 검색어"
                        }), [ "일무", "클래식", "주차", "대관" ].map((term =>   (0, jsx_runtime.jsx)(api_link["default"], {
                            "data-text": "action",
                            href: "/search?q=".concat(encodeURIComponent(term)),
                            children: term
                        }, term))) ]
                    }) ]
                }), 
                
                 (0, jsx_runtime.jsx /* default */)(FloatingMenu.Z, {
                    open: menuOpen,
                    onClose: closeMenu,
                    returnFocus: menuTrigger,
                    position: menuPosition
                }) ]
            });
        }
        // CONCATENATED MODULE: ./components/Footer.tsx
        /* __next_internal_client_entry_do_not_use__ default auto */
        function Footer() {
            const router = (0, navigation.useRouter)();
            const handleFamilySiteChange = e => {
                const val = e.target.value;
                if (val) {
                    router.push(val);
                    e.target.value = "";
                }
            };
             
            return (0, jsx_runtime.jsxs)("footer", {
                "data-component-id": "footer",
                id: "footer",
                className: "renewal-footer",
                "data-home-anchor": true,
                children: [ 
                
                 (0, jsx_runtime.jsx)("div", {
                    className: "footer-utility",
                    id: "footer-newsletter",
                    "data-home-anchor": true,
                    children:   (0, jsx_runtime.jsxs)("div", {
                        className: "container",
                        children: [ 
                        
                         (0, jsx_runtime.jsx)("p", {
                            "data-text": "body",
                            children: "세종문화회관의 새 소식."
                        }), 
                        
                         (0, jsx_runtime.jsx)(api_link["default"], {
                            "data-text": "action",
                            href: "/news/newsletter",
                            children: "세종의 소식 받아보기 →"
                        }) ]
                    })
                }), 
                
                 (0, jsx_runtime.jsxs)("div", {
                    className: "container footer-main",
                    children: [ 
                    
                     (0, jsx_runtime.jsxs)("div", {
                        className: "footer-identity",
                        id: "footer-identity",
                        "data-home-anchor": true,
                        children: [ 
                        
                         (0, jsx_runtime.jsx)(api_link["default"], {
                            "data-text": "action",
                            href: "/",
                            "aria-label": "세종문화회관 홈",
                            children:   (0, jsx_runtime.jsx)("img", {
                                className: "sejong-wordmark",
                                src: "/v5/assets/images/sejong-wordmark.png",
                                alt: "세종문화회관",
                                width: 236,
                                height: 43,
                                onError: e => {
                                    const target = e.currentTarget;
                                    if (!target.src.includes("/assets/")) {
                                        target.src = "/assets/images/sejong-wordmark.png";
                                    }
                                }
                            })
                        }), 
                        
                         (0, jsx_runtime.jsxs)("p", {
                            "data-text": "body",
                            children: [ "공연·전시·교육", 
                            
                             (0, jsx_runtime.jsx)("br", {}), "한 곳에서 이어지는 무대." ]
                        }), 
                        
                         (0, jsx_runtime.jsxs)("span", {
                            className: "identity-marks",
                            "aria-hidden": "true",
                            children: [ 
                            
                             (0, jsx_runtime.jsx)("i", {}), 
                            
                             (0, jsx_runtime.jsx)("i", {}), 
                            
                             (0, jsx_runtime.jsx)("i", {}) ]
                        }) ]
                    }), 
                    
                     (0, jsx_runtime.jsxs)("div", {
                        className: "footer-information",
                        id: "footer-information",
                        "data-home-anchor": true,
                        children: [ 
                        
                         (0, jsx_runtime.jsxs)("nav", {
                            className: "footer-policy",
                            id: "footer-policy",
                            "data-home-anchor": true,
                            "aria-label": "정책과 안내",
                            children: [ 
                            
                             (0, jsx_runtime.jsx)(api_link["default"], {
                                "data-text": "navigation",
                                href: "/policy/privacy",
                                id: "footer-policy-privacy",
                                "data-home-anchor": true,
                                children: "개인정보처리방침"
                            }), 
                            
                             (0, jsx_runtime.jsx)(api_link["default"], {
                                "data-text": "navigation",
                                href: "/policy/terms",
                                id: "footer-policy-terms",
                                "data-home-anchor": true,
                                children: "이용약관"
                            }), 
                            
                             (0, jsx_runtime.jsx)(api_link["default"], {
                                "data-text": "navigation",
                                href: "/design-rules",
                                id: "footer-policy-design-system",
                                "data-home-anchor": true,
                                children: "디자인 시스템"
                            }), 
                            
                             (0, jsx_runtime.jsx)(api_link["default"], {
                                "data-text": "navigation",
                                href: "/visit/support",
                                id: "footer-support",
                                "data-home-anchor": true,
                                children: "고객지원"
                            }), 
                            
                             (0, jsx_runtime.jsx)(api_link["default"], {
                                "data-text": "navigation",
                                href: "/sitemap",
                                id: "footer-sitemap",
                                "data-home-anchor": true,
                                children: "사이트맵"
                            }) ]
                        }), 
                        
                         (0, jsx_runtime.jsxs)("address", {
                            "data-text": "body",
                            children: [ "서울특별시 종로구 세종대로 175", 
                            
                             (0, jsx_runtime.jsx)("br", {}), "재단법인 세종문화회관" ]
                        }), 
                        
                         (0, jsx_runtime.jsx)("p", {
                            "data-text": "body",
                            className: "footer-small",
                            children: "© SEJONG CENTER FOR THE PERFORMING ARTS."
                        }) ]
                    }), 
                    
                     (0, jsx_runtime.jsxs)("div", {
                        className: "footer-service",
                        id: "footer-service",
                        "data-home-anchor": true,
                        children: [ 
                        
                         (0, jsx_runtime.jsx)("span", {
                            "data-text": "body",
                            children: "전화예매 및 문의"
                        }), 
                        
                         (0, jsx_runtime.jsx)("a", {
                            "data-text": "action",
                            className: "footer-phone",
                            href: "tel:023991000",
                            id: "footer-phone",
                            "data-home-anchor": true,
                            children: "02-399-1000"
                        }), 
                        
                         (0, jsx_runtime.jsx)("a", {
                            "data-text": "action",
                            className: "footer-citybrand",
                            id: "footer-citybrand",
                            "data-home-anchor": true,
                            href: "https://www.seoul.go.kr/main/index.jsp",
                            children:   (0, jsx_runtime.jsx)("img", {
                                src: "/v5/assets/logos/seoulmysoul-citybrand.svg",
                                alt: "서울시 로고 SEOUL MY SOUL",
                                width: 624.55,
                                height: 101.21,
                                loading: "lazy"
                            })
                        }), 
                        
                         (0, jsx_runtime.jsxs /* SystemField */)(SystemPrimitives.RK, {
                            "data-text": "body",
                            as: "select",
                            label: "관련 페이지",
                            labelHidden: true,
                            id: "family-site",
                            "data-home-anchor": true,
                            onChange: handleFamilySiteChange,
                            defaultValue: "",
                            children: [ 
                            
                             (0, jsx_runtime.jsx)("option", {
                                "data-text": "label",
                                value: "",
                                children: "패밀리 사이트"
                            }), 
                            
                             (0, jsx_runtime.jsx)("option", {
                                "data-text": "label",
                                value: "/about/companies",
                                children: "서울시예술단"
                            }), 
                            
                             (0, jsx_runtime.jsx)("option", {
                                "data-text": "label",
                                value: "/programs/education",
                                children: "세종예술아카데미"
                            }), 
                            
                             (0, jsx_runtime.jsx)("option", {
                                "data-text": "label",
                                value: "/programs/history",
                                children: "세종·충무공 이야기"
                            }) ]
                        }), 
                        
                         (0, jsx_runtime.jsx)("a", {
                            "data-text": "action",
                            className: "version-link",
                            href: "/",
                            id: "footer-versions",
                            "data-home-anchor": true,
                            children: "전체 버전 비교 ↗"
                        }) ]
                    }) ]
                }) ]
            });
        }
        // EXTERNAL MODULE: ./components/SmallNotificationModal.tsx
                var SmallNotificationModal = __webpack_require__(7281);
        // CONCATENATED MODULE: ./components/ReturnTop.tsx
        /* __next_internal_client_entry_do_not_use__ default auto */
        function ReturnTop() {
            const [visible, setVisible] = (0, react.useState)(false);
            (0, react.useEffect)((() => {
                const handleScroll = () => {
                    if (window.scrollY > 400) {
                        setVisible(true);
                    } else {
                        setVisible(false);
                    }
                };
                window.addEventListener("scroll", handleScroll, {
                    passive: true
                });
                return () => window.removeEventListener("scroll", handleScroll);
            }), []);
            const scrollToTop = () => {
                window.scrollTo({
                    top: 0,
                    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth"
                });
            };
            if (!visible) return null;
             
            return (0, jsx_runtime.jsx /* SystemIconButton */)(SystemPrimitives.MW, {
                "data-component-id": "return-top",
                "data-text": "action",
                variant: "secondary",
                className: "return-top is-visible",
                type: "button",
                "aria-label": "맨 위로 이동",
                onClick: scrollToTop,
                children:   (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                    name: "up"
                })
            });
        }
        // EXTERNAL MODULE: ./node_modules/next/dist/compiled/react-dom/index.js
                var react_dom = __webpack_require__(4887);
        // CONCATENATED MODULE: ./components/Toast.tsx
        /* __next_internal_client_entry_do_not_use__ default,showToast auto */ // [기존 호출부의 호환 연결 / Compatibility with existing notification callers]
        // EXTERNAL MODULE: ./components/ContextMenu.module.css
        var ContextMenu_module = __webpack_require__(6175);
        var ContextMenu_module_default =  __webpack_require__.n(ContextMenu_module);
        // CONCATENATED MODULE: ./components/ContextMenu.tsx
        // ==========================================================================
        // [커스텀 우클릭 컨텍스트 메뉴 / Custom Right-click Context Menu]
        // 우클릭 시 토큰 기반 둥근 메뉴를 띄우고 페이지·링크 작업을 실행한다.
        // Opens a token-based rounded menu on right click and runs page or link actions.
        // ==========================================================================
        /* __next_internal_client_entry_do_not_use__ default auto */
        const MARGIN = 12;
        const EDITABLE_SELECTOR = 'input, textarea, select, [contenteditable="true"], [contenteditable=""]';
        function ContextMenu() {
            const router = (0, navigation.useRouter)();
            const [menu, setMenu] = (0, react.useState)(null);
            const shellRef = (0, react.useRef)(null);
            const previousFocusRef = (0, react.useRef)(null);
            const isOpen = menu !== null;
            (0, react.useEffect)((() => {
                const onContextMenu = event => {
                    const target = event.target;
                    // 폼 편집 중에는 네이티브 메뉴(복사·붙여넣기)를 남긴다.
                    // Keep the native menu while editing form fields (copy, paste, etc.).
                                        if (target === null || target === void 0 ? void 0 : target.closest(EDITABLE_SELECTOR)) return;
                    event.preventDefault();
                    const anchor = target === null || target === void 0 ? void 0 : target.closest("a[href]");
                    previousFocusRef.current = document.activeElement;
                    var _anchor_href;
                    setMenu({
                        x: event.clientX,
                        y: event.clientY,
                        href: (_anchor_href = anchor === null || anchor === void 0 ? void 0 : anchor.href) !== null && _anchor_href !== void 0 ? _anchor_href : null,
                        canGoBack: window.history.length > 1
                    });
                };
                document.addEventListener("contextmenu", onContextMenu);
                return () => document.removeEventListener("contextmenu", onContextMenu);
            }), []);
            (0, react.useEffect)((() => {
                if (!isOpen) return;
                const dismiss = () => setMenu(null);
                const onKeyDown = event => {
                    const shell = shellRef.current;
                    if (!shell) return;
                    const items = Array.from(shell.querySelectorAll("button:not([disabled])"));
                    const currentIndex = items.indexOf(document.activeElement);
                    if (event.key === "Escape" || event.key === "Tab") {
                        var _previousFocusRef_current;
                        event.preventDefault();
                        (_previousFocusRef_current = previousFocusRef.current) === null || _previousFocusRef_current === void 0 ? void 0 : _previousFocusRef_current.focus({
                            preventScroll: true
                        });
                        setMenu(null);
                        return;
                    }
                    if (event.key === "ArrowDown") {
                        var _items_;
                        event.preventDefault();
                        (_items_ = items[(currentIndex + 1) % items.length]) === null || _items_ === void 0 ? void 0 : _items_.focus();
                    } else if (event.key === "ArrowUp") {
                        var _items_1;
                        event.preventDefault();
                        (_items_1 = items[(currentIndex - 1 + items.length) % items.length]) === null || _items_1 === void 0 ? void 0 : _items_1.focus();
                    } else if (event.key === "Home") {
                        var _items_2;
                        event.preventDefault();
                        (_items_2 = items[0]) === null || _items_2 === void 0 ? void 0 : _items_2.focus();
                    } else if (event.key === "End") {
                        var _items_3;
                        event.preventDefault();
                        (_items_3 = items[items.length - 1]) === null || _items_3 === void 0 ? void 0 : _items_3.focus();
                    }
                };
                const onPointerDown = event => {
                    const target = event.target;
                    if (target === null || target === void 0 ? void 0 : target.closest('[role="menu"]')) return;
                    dismiss();
                };
                document.addEventListener("keydown", onKeyDown);
                document.addEventListener("pointerdown", onPointerDown, true);
                window.addEventListener("blur", dismiss);
                window.addEventListener("resize", dismiss);
                window.addEventListener("scroll", dismiss, true);
                return () => {
                    document.removeEventListener("keydown", onKeyDown);
                    document.removeEventListener("pointerdown", onPointerDown, true);
                    window.removeEventListener("blur", dismiss);
                    window.removeEventListener("resize", dismiss);
                    window.removeEventListener("scroll", dismiss, true);
                };
            }), [ isOpen ]);
            (0, react.useLayoutEffect)((() => {
                var _shell_querySelector;
                const shell = shellRef.current;
                if (!menu || !shell) return;
                const rect = shell.getBoundingClientRect();
                const x = Math.max(MARGIN, Math.min(menu.x, window.innerWidth - rect.width - MARGIN));
                const y = Math.max(MARGIN, Math.min(menu.y, window.innerHeight - rect.height - MARGIN));
                shell.style.left = "".concat(x, "px");
                shell.style.top = "".concat(y, "px");
                (_shell_querySelector = shell.querySelector("button:not([disabled])")) === null || _shell_querySelector === void 0 ? void 0 : _shell_querySelector.focus({
                    preventScroll: true
                });
            }), [ menu ]);
            const close = function() {
                let restoreFocus = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : false;
                var _previousFocusRef_current;
                if (restoreFocus) (_previousFocusRef_current = previousFocusRef.current) === null || _previousFocusRef_current === void 0 ? void 0 : _previousFocusRef_current.focus({
                    preventScroll: true
                });
                setMenu(null);
            };
            const copyAddress = async text => {
                try {
                    await navigator.clipboard.writeText(text);
                } catch (e) {
                    const scratch = document.createElement("textarea");
                    scratch.value = text;
                    scratch.setAttribute("readonly", "");
                    scratch.style.position = "fixed";
                    scratch.style.opacity = "0";
                    scratch.style.pointerEvents = "none";
                    document.body.appendChild(scratch);
                    scratch.select();
                    document.execCommand("copy");
                    scratch.remove();
                }
                (0, SmallNotificationModal /* showSmallNotification */ .VX)("주소를 복사했어요.");
                close(true);
            };
            if (!menu) return null;
            const linkLocation = menu.href ? new URL(menu.href) : null;
            const actions = [];
            if (linkLocation) {
                actions.push({
                    icon: "open_in_new",
                    label: "새 창에서 열기",
                    run: () => window.open(linkLocation.href, "_blank", "noopener"),
                    closeAfter: true
                });
                actions.push({
                    icon: "content_copy",
                    label: "링크 주소 복사",
                    run: () => {
                        void copyAddress(linkLocation.href);
                    },
                    closeAfter: false
                });
            } else {
                actions.push({
                    icon: "content_copy",
                    label: "페이지 주소 복사",
                    run: () => {
                        void copyAddress(window.location.href);
                    },
                    closeAfter: false
                });
            }
             
            return (0, react_dom.createPortal)(  (0, jsx_runtime.jsxs)("div", {
                "data-text": "body",
                ref: shellRef,
                "data-component-id": "context-menu",
                className: ContextMenu_module_default().shell,
                role: "menu",
                "aria-label": "페이지 바로가기 메뉴",
                style: {
                    left: menu.x,
                    top: menu.y
                },
                children: [ 
                
                 (0, jsx_runtime.jsxs)("div", {
                    "data-text": "body",
                    className: ContextMenu_module_default().list,
                    children: [ 
                    
                     (0, jsx_runtime.jsxs /* SystemButton */)(SystemPrimitives.kR, {
                        "data-text": "action",
                        variant: "quiet",
                        style: {
                            justifyContent: "flex-start"
                        },
                        type: "button",
                        role: "menuitem",
                        className: ContextMenu_module_default().item,
                        onClick: () => location.reload(),
                        children: [ 
                        
                         (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                            name: "refresh",
                            size: 20
                        }), "새로 고침" ]
                    }), actions.map((action =>   (0, jsx_runtime.jsxs /* SystemButton */)(SystemPrimitives.kR, {
                        "data-text": "action",
                        variant: "quiet",
                        style: {
                            justifyContent: "flex-start"
                        },
                        type: "button",
                        role: "menuitem",
                        className: ContextMenu_module_default().item,
                        onClick: () => {
                            action.run();
                            if (action.closeAfter) close(true);
                        },
                        children: [ 
                        
                         (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                            name: action.icon,
                            size: 20
                        }), action.label ]
                    }, action.label))), 
                    
                     (0, jsx_runtime.jsxs /* SystemButton */)(SystemPrimitives.kR, {
                        "data-text": "action",
                        variant: "quiet",
                        style: {
                            justifyContent: "flex-start"
                        },
                        type: "button",
                        role: "menuitem",
                        className: ContextMenu_module_default().item,
                        disabled: !menu.canGoBack,
                        onClick: () => history.back(),
                        children: [ 
                        
                         (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                            name: "undo",
                            size: 20
                        }), "이전 페이지로" ]
                    }), 
                    
                     (0, jsx_runtime.jsxs /* SystemButton */)(SystemPrimitives.kR, {
                        "data-text": "action",
                        variant: "quiet",
                        style: {
                            justifyContent: "flex-start"
                        },
                        type: "button",
                        role: "menuitem",
                        className: ContextMenu_module_default().item,
                        onClick: () => router.push("/"),
                        children: [ 
                        
                         (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                            name: "home",
                            size: 20
                        }), "홈으로" ]
                    }) ]
                }), linkLocation &&   (0, jsx_runtime.jsxs)(jsx_runtime.Fragment, {
                    children: [ 
                    
                     (0, jsx_runtime.jsx)("div", {
                        className: ContextMenu_module_default().divider,
                        "aria-hidden": "true"
                    }), 
                    
                     (0, jsx_runtime.jsxs)("span", {
                        "data-text": "body",
                        className: ContextMenu_module_default().location,
                        children: [ linkLocation.host, linkLocation.pathname ]
                    }) ]
                }) ]
            }), document.body);
        }
        // CONCATENATED MODULE: ./components/SiteShell.tsx
        /* __next_internal_client_entry_do_not_use__ default auto */
        // [사이트와 문서의 탐색 영역 / Product and documentation navigation]
        // 디자인 가이드는 자체 문서 탐색을 사용하고, 나머지 화면은 기존 사이트 셸을 유지합니다.
        // The design guide owns its documentation navigation; other pages retain the product shell.
        function SiteShell(param) {
            let {children: children} = param;
            const pathname = (0, navigation.usePathname)();
            const documentation = pathname.replace(/\/$/, "").endsWith("/design-rules");
            if (documentation) {
                 
                return (0, jsx_runtime.jsxs)(jsx_runtime.Fragment, {
                    children: [ 
                    
                     (0, jsx_runtime.jsx)("a", {
                        "data-text": "action",
                        "data-text-size": "control",
                        "data-component-owner": "site-shell",
                        "data-component-part": "skip-link",
                        className: "skip-link",
                        href: "#main",
                        children: "본문 바로가기"
                    }), children, 
                    
                     (0, jsx_runtime.jsx /* SmallNotificationModalHost */)(SmallNotificationModal.Rr, {}) ]
                });
            }
             
            return (0, jsx_runtime.jsxs)(jsx_runtime.Fragment, {
                children: [ 
                
                 (0, jsx_runtime.jsx)("a", {
                    "data-text": "action",
                    "data-text-size": "control",
                    "data-component-owner": "site-shell",
                    "data-component-part": "skip-link",
                    className: "skip-link",
                    href: "#main",
                    children: "본문 바로가기"
                }), 
                
                 (0, jsx_runtime.jsx)(Header, {}), 
                
                 (0, jsx_runtime.jsx)("main", {
                    "data-component-id": "site-shell",
                    "data-text": "body",
                    id: "main",
                    tabIndex: -1,
                    children: children
                }), 
                
                 (0, jsx_runtime.jsx)(Footer, {}), 
                
                 (0, jsx_runtime.jsx)(ReturnTop, {}), 
                
                 (0, jsx_runtime.jsx)(ContextMenu, {}), 
                
                 (0, jsx_runtime.jsx /* SmallNotificationModalHost */)(SmallNotificationModal.Rr, {}) ]
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
    /***/ 1914: 
    /***/ function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        "use strict";
        /* unused harmony export SystemDialog */
        /* harmony import */        var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7437);
        /* harmony import */        var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(2265);
        /* __next_internal_client_entry_do_not_use__ SystemDialog,default auto */
        // [중첩 모달의 스크롤 잠금 / Scroll locking for nested modals]
                const modalLocks = new Set;
        let previousOverflow = "";
        function lockScroll(dialog) {
            if (modalLocks.has(dialog)) return;
            if (!modalLocks.size) previousOverflow = document.body.style.overflow;
            modalLocks.add(dialog);
            document.body.style.overflow = "hidden";
        }
        function unlockScroll(dialog) {
            if (!modalLocks.delete(dialog)) return;
            if (!modalLocks.size) document.body.style.overflow = previousOverflow;
        }
        const SystemDialog =   (0, react__WEBPACK_IMPORTED_MODULE_1__.forwardRef)((function SystemDialog(param, forwardedRef) {
            let {open: open, triggerRef: triggerRef, initialFocusRef: initialFocusRef, closeOnBackdrop: closeOnBackdrop = true, className: className = "", onClick: onClick, children: children, ...props} = param;
            const dialogRef = (0, react__WEBPACK_IMPORTED_MODULE_1__.useRef)(null);
            const focusRefs = (0, react__WEBPACK_IMPORTED_MODULE_1__.useRef)({
                triggerRef: triggerRef,
                initialFocusRef: initialFocusRef
            });
            focusRefs.current = {
                triggerRef: triggerRef,
                initialFocusRef: initialFocusRef
            };
            (0, react__WEBPACK_IMPORTED_MODULE_1__.useImperativeHandle)(forwardedRef, (() => dialogRef.current), []);
            (0, react__WEBPACK_IMPORTED_MODULE_1__.useEffect)((() => {
                const dialog = dialogRef.current;
                const nativeShowModal = dialog.showModal;
                const nativeClose = dialog.close;
                let returnFocus = null;
                let active = false;
                function available(element) {
                    return dialog.contains(element) && !element.matches(":disabled") && element.getClientRects().length > 0 && getComputedStyle(element).visibility !== "hidden" && !element.closest("[inert]");
                }
                function enter() {
                    var _focusRefs_current_initialFocusRef;
                    if (active) return;
                    active = true;
                    lockScroll(dialog);
                    const preferred = (_focusRefs_current_initialFocusRef = focusRefs.current.initialFocusRef) === null || _focusRefs_current_initialFocusRef === void 0 ? void 0 : _focusRefs_current_initialFocusRef.current;
                    const autofocus = [ ...dialog.querySelectorAll("[autofocus],[data-autofocus]") ].find(available);
                    const first = preferred && available(preferred) ? preferred : autofocus || [ ...dialog.querySelectorAll("button:not(:disabled),[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex='-1'])") ].find(available);
                    if (first) first.focus({
                        preventScroll: true
                    }); else dialog.focus({
                        preventScroll: true
                    });
                }
                function leave() {
                    var _focusRefs_current_triggerRef;
                    if (!active) return;
                    active = false;
                    unlockScroll(dialog);
                    const target = ((_focusRefs_current_triggerRef = focusRefs.current.triggerRef) === null || _focusRefs_current_triggerRef === void 0 ? void 0 : _focusRefs_current_triggerRef.current) || returnFocus;
                    if (target === null || target === void 0 ? void 0 : target.isConnected) target.focus({
                        preventScroll: true
                    });
                    returnFocus = null;
                }
                function containTab(event) {
                    if (!active || event.key !== "Tab" || event.defaultPrevented) return;
                    const controls = [ ...dialog.querySelectorAll("button:not(:disabled),[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex='-1'])") ].filter((element => element.tabIndex >= 0 && available(element)));
                    const first = controls[0];
                    const last = controls[controls.length - 1];
                    if (!first) {
                        event.preventDefault();
                        dialog.focus();
                        return;
                    }
                    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
                        event.preventDefault();
                        last.focus();
                    } else if (!event.shiftKey && document.activeElement === last) {
                        event.preventDefault();
                        first.focus();
                    }
                }
                dialog.showModal = function() {
                    if (dialog.open) return;
                    returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
                    nativeShowModal.call(dialog);
                    enter();
                };
                dialog.close = function(returnValue) {
                    nativeClose.call(dialog, returnValue);
                    leave();
                };
                dialog.addEventListener("close", leave);
                dialog.addEventListener("keydown", containTab);
                // open 속성 제거와 브라우저 Escape 닫기도 자원을 정리합니다.
                // Attribute removal and browser Escape dismissal also release resources.
                                const observer = new MutationObserver((() => {
                    if (!dialog.open) leave(); else if (dialog.matches(":modal")) enter();
                }));
                observer.observe(dialog, {
                    attributes: true,
                    attributeFilter: [ "open" ]
                });
                if (dialog.open && dialog.matches(":modal")) enter();
                return () => {
                    observer.disconnect();
                    dialog.removeEventListener("close", leave);
                    dialog.removeEventListener("keydown", containTab);
                    dialog.showModal = nativeShowModal;
                    dialog.close = nativeClose;
                    leave();
                };
            }), []);
            (0, react__WEBPACK_IMPORTED_MODULE_1__.useEffect)((() => {
                if (open === undefined) return;
                const dialog = dialogRef.current;
                if (open && !dialog.open) dialog.showModal(); else if (!open && dialog.open) dialog.close();
            }), [ open ]);
             
            return (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("dialog", {
                "data-text": "body",
                ...props,
                ref: dialogRef,
                className: "ds-dialog ".concat(className).trim(),
                "data-component": "dialog",
                "data-component-id": "dialog",
                "data-stroke": "inner",
                onClick: event => {
                    onClick === null || onClick === void 0 ? void 0 : onClick(event);
                    if (event.defaultPrevented || !closeOnBackdrop || event.target !== event.currentTarget) return;
                    const rect = event.currentTarget.getBoundingClientRect();
                    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) event.currentTarget.close();
                },
                children: children
            });
        }));
        /* harmony default export */        __webpack_exports__.Z = SystemDialog;
        /***/    },
    /***/ 7291: 
    /***/ function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        "use strict";
        /* harmony export */        __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ T: function() {
                /* binding */ return SystemTabs;
            },
            /* harmony export */ f: function() {
                /* binding */ return SystemDisclosure;
            }
            /* harmony export */        });
        /* harmony import */        var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7437);
        /* harmony import */        var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(2265);
        /* __next_internal_client_entry_do_not_use__ SystemTabs,SystemDisclosure auto */        const SystemTabs =   (0, 
        react__WEBPACK_IMPORTED_MODULE_1__.forwardRef)((function SystemTabs(param, ref) {
            let {items: items, value: value, onValueChange: onValueChange, orientation: orientation = "horizontal", className: className = "", tabListClassName: tabListClassName = "", panelClassName: panelClassName = "", idPrefix: idPrefix, "aria-label": label, "aria-labelledby": labelledBy, ...props} = param;
            var _enabled_;
            const generatedPrefix = (0, react__WEBPACK_IMPORTED_MODULE_1__.useId)();
            const prefix = idPrefix || generatedPrefix;
            const buttons = (0, react__WEBPACK_IMPORTED_MODULE_1__.useRef)(new Map);
            const enabled = items.filter((item => !item.disabled));
            const selected = enabled.some((item => item.id === value)) ? value : (_enabled_ = enabled[0]) === null || _enabled_ === void 0 ? void 0 : _enabled_.id;
            const tabId = id => "".concat(prefix, "-tab-").concat(id);
            const panelId = id => "".concat(prefix, "-panel-").concat(id);
            function handleKey(event, id) {
                var _buttons_current_get;
                const nextKey = orientation === "horizontal" ? "ArrowRight" : "ArrowDown";
                const previousKey = orientation === "horizontal" ? "ArrowLeft" : "ArrowUp";
                if (![ nextKey, previousKey, "Home", "End" ].includes(event.key) || !enabled.length) return;
                event.preventDefault();
                const index = enabled.findIndex((item => item.id === id));
                const targetIndex = event.key === "Home" ? 0 : event.key === "End" ? enabled.length - 1 : (index + (event.key === nextKey ? 1 : -1) + enabled.length) % enabled.length;
                const next = enabled[targetIndex].id;
                onValueChange(next);
                (_buttons_current_get = buttons.current.get(next)) === null || _buttons_current_get === void 0 ? void 0 : _buttons_current_get.focus();
            }
             
            return (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                "data-text": "body",
                ...props,
                ref: ref,
                className: "ds-tab-group ".concat(className).trim(),
                "data-component": "tabs",
                "data-component-id": "tabs",
                "data-orientation": orientation,
                children: [ 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", {
                    "data-text": "body",
                    className: "ds-tabs ".concat(tabListClassName).trim(),
                    "data-component-part": "list",
                    "data-component-owner": "tabs",
                    role: "tablist",
                    "aria-label": label,
                    "aria-labelledby": labelledBy,
                    "aria-orientation": orientation,
                    children: items.map((item =>   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", {
                        "data-text": "action",
                        "data-text-size": "control",
                        ref: element => {
                            if (element) buttons.current.set(item.id, element); else buttons.current.delete(item.id);
                        },
                        type: "button",
                        role: "tab",
                        id: tabId(item.id),
                        "aria-controls": panelId(item.id),
                        "aria-selected": selected === item.id,
                        tabIndex: selected === item.id ? 0 : -1,
                        disabled: item.disabled,
                        onClick: () => onValueChange(item.id),
                        onKeyDown: event => handleKey(event, item.id),
                        children: item.label
                    }, item.id)))
                }), items.map((item =>   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", {
                    "data-text": "body",
                    id: panelId(item.id),
                    "data-component-part": "panel",
                    "data-component-owner": "tabs",
                    role: "tabpanel",
                    "aria-labelledby": tabId(item.id),
                    hidden: selected !== item.id,
                    tabIndex: 0,
                    className: "ds-tabpanel ".concat(panelClassName).trim(),
                    children: item.content
                }, item.id))) ]
            });
        }));
        const SystemDisclosure =   (0, react__WEBPACK_IMPORTED_MODULE_1__.forwardRef)((function SystemDisclosure(param, ref) {
            let {summary: summary, children: children, className: className = "", summaryClassName: summaryClassName, appearance: appearance = "default", ...props} = param;
             
            return (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("details", {
                "data-text": "body",
                ...props,
                ref: ref,
                className: "".concat(appearance === "plain" ? "ds-disclosure-plain" : "ds-disclosure", " ").concat(className).trim(),
                "data-component": "disclosure",
                "data-component-id": "disclosure",
                "data-appearance": appearance,
                children: [ 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("summary", {
                    "data-text": "label",
                    className: summaryClassName,
                    children: summary
                }), children ]
            });
        }));
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
        /***/    },
    /***/ 9376: 
    /***/ function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        "use strict";
        /* harmony import */        var _client_components_navigation__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(5475);
        /* harmony import */        var _client_components_navigation__WEBPACK_IMPORTED_MODULE_0___default =  __webpack_require__.n(_client_components_navigation__WEBPACK_IMPORTED_MODULE_0__);
        /* harmony reexport (checked) */        if (__webpack_require__.o(_client_components_navigation__WEBPACK_IMPORTED_MODULE_0__, "usePathname")) __webpack_require__.d(__webpack_exports__, {
            usePathname: function() {
                return _client_components_navigation__WEBPACK_IMPORTED_MODULE_0__.usePathname;
            }
        });
        /* harmony reexport (checked) */        if (__webpack_require__.o(_client_components_navigation__WEBPACK_IMPORTED_MODULE_0__, "useRouter")) __webpack_require__.d(__webpack_exports__, {
            useRouter: function() {
                return _client_components_navigation__WEBPACK_IMPORTED_MODULE_0__.useRouter;
            }
        });
        //# sourceMappingURL=navigation.js.map
        /***/    },
    /***/ 8270: 
    /***/ function() {
        // extracted by mini-css-extract-plugin
        /***/},
    /***/ 687: 
    /***/ function() {
        // extracted by mini-css-extract-plugin
        /***/},
    /***/ 3522: 
    /***/ function() {
        // extracted by mini-css-extract-plugin
        /***/},
    /***/ 4835: 
    /***/ function() {
        // extracted by mini-css-extract-plugin
        /***/},
    /***/ 1706: 
    /***/ function() {
        // extracted by mini-css-extract-plugin
        /***/},
    /***/ 9080: 
    /***/ function() {
        // extracted by mini-css-extract-plugin
        /***/},
    /***/ 5142: 
    /***/ function() {
        // extracted by mini-css-extract-plugin
        /***/},
    /***/ 7780: 
    /***/ function() {
        // extracted by mini-css-extract-plugin
        /***/},
    /***/ 4122: 
    /***/ function() {
        // extracted by mini-css-extract-plugin
        /***/},
    /***/ 8286: 
    /***/ function() {
        // extracted by mini-css-extract-plugin
        /***/},
    /***/ 989: 
    /***/ function() {
        // extracted by mini-css-extract-plugin
        /***/},
    /***/ 6523: 
    /***/ function() {
        // extracted by mini-css-extract-plugin
        /***/},
    /***/ 4504: 
    /***/ function() {
        // extracted by mini-css-extract-plugin
        /***/},
    /***/ 7211: 
    /***/ function() {
        // extracted by mini-css-extract-plugin
        /***/},
    /***/ 1265: 
    /***/ function() {
        // extracted by mini-css-extract-plugin
        /***/},
    /***/ 9743: 
    /***/ function() {
        // extracted by mini-css-extract-plugin
        /***/},
    /***/ 8275: 
    /***/ function() {
        // extracted by mini-css-extract-plugin
        /***/},
    /***/ 4080: 
    /***/ function() {
        // extracted by mini-css-extract-plugin
        /***/},
    /***/ 1695: 
    /***/ function() {
        // extracted by mini-css-extract-plugin
        /***/},
    /***/ 3485: 
    /***/ function() {
        // extracted by mini-css-extract-plugin
        /***/},
    /***/ 1090: 
    /***/ function() {
        // extracted by mini-css-extract-plugin
        /***/},
    /***/ 9690: 
    /***/ function() {
        // extracted by mini-css-extract-plugin
        /***/},
    /***/ 7569: 
    /***/ function() {
        // extracted by mini-css-extract-plugin
        /***/},
    /***/ 7098: 
    /***/ function() {
        // extracted by mini-css-extract-plugin
        /***/},
    /***/ 3506: 
    /***/ function() {
        // extracted by mini-css-extract-plugin
        /***/},
    /***/ 5979: 
    /***/ function() {
        // extracted by mini-css-extract-plugin
        /***/},
    /***/ 8435: 
    /***/ function() {
        // extracted by mini-css-extract-plugin
        /***/},
    /***/ 3530: 
    /***/ function() {
        // extracted by mini-css-extract-plugin
        /***/},
    /***/ 3595: 
    /***/ function() {
        // extracted by mini-css-extract-plugin
        /***/},
    /***/ 4779: 
    /***/ function() {
        // extracted by mini-css-extract-plugin
        /***/},
    /***/ 700: 
    /***/ function() {
        // extracted by mini-css-extract-plugin
        /***/},
    /***/ 7383: 
    /***/ function() {
        // extracted by mini-css-extract-plugin
        /***/},
    /***/ 3488: 
    /***/ function() {
        // extracted by mini-css-extract-plugin
        /***/},
    /***/ 8021: 
    /***/ function() {
        // extracted by mini-css-extract-plugin
        /***/},
    /***/ 7050: 
    /***/ function() {
        // extracted by mini-css-extract-plugin
        /***/},
    /***/ 5345: 
    /***/ function() {
        // extracted by mini-css-extract-plugin
        /***/},
    /***/ 4889: 
    /***/ function() {
        // extracted by mini-css-extract-plugin
        /***/},
    /***/ 5791: 
    /***/ function() {
        // extracted by mini-css-extract-plugin
        /***/},
    /***/ 6175: 
    /***/ function(module) {
        // extracted by mini-css-extract-plugin
        module.exports = {
            shell: "ContextMenu_shell__CisWs",
            "shell-in": "ContextMenu_shell-in__Mni2X",
            list: "ContextMenu_list__l8KN0",
            item: "ContextMenu_item__dxYNB",
            "material-icon": "ContextMenu_material-icon__dc5iT",
            divider: "ContextMenu_divider__XMtB0",
            location: "ContextMenu_location__wYgIL"
        };
        /***/    }
}, 
/******/ function(__webpack_require__) {
    // webpackRuntimeModules
    /******/ var __webpack_exec__ = function(moduleId) {
        return __webpack_require__(__webpack_require__.s = moduleId);
    }
    /******/;
    __webpack_require__.O(0, [ 286, 335, 175, 184, 758, 953, 762, 648, 369, 498, 663, 378, 971, 117, 744 ], (function() {
        return __webpack_exec__(3107);
    }));
    /******/    var __webpack_exports__ = __webpack_require__.O();
    /******/    _N_E = __webpack_exports__;
    /******/} ]);
//# sourceMappingURL=layout_1.js.map