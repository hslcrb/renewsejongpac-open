(self["webpackChunk_N_E"] = self["webpackChunk_N_E"] || []).push([ [ 884 ], {
    /***/ 8075: 
    /***/ function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {
        Promise.resolve().then(__webpack_require__.bind(__webpack_require__, 2490));
        /***/    },
    /***/ 2490: 
    /***/ function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        "use strict";
        /* harmony export */        __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ default: function() {
                /* binding */ return IntroductionExperience;
            }
            /* harmony export */        });
        /* harmony import */        var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7437);
        /* harmony import */        var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(2265);
        /* harmony import */        var _SystemPrimitives__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(6983);
        /* harmony import */        var _SystemSurface__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(820);
        /* harmony import */        var _introduction_css__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(8815);
        /* harmony import */        var _introduction_css__WEBPACK_IMPORTED_MODULE_4___default =  __webpack_require__.n(_introduction_css__WEBPACK_IMPORTED_MODULE_4__);
        /* __next_internal_client_entry_do_not_use__ default auto */        const scenes = [ {
            id: "opening",
            label: "세종문화회관"
        }, {
            id: "pulse",
            label: "서울시예술단"
        }, {
            id: "space",
            label: "공연장과 전시장"
        }, {
            id: "together",
            label: "관람 안내"
        } ];
        // [공연장 사진과 기관 정보로 읽는 소개 / An introduction grounded in venues and people]
                function IntroductionExperience() {
            const [active, setActive] = (0, react__WEBPACK_IMPORTED_MODULE_1__.useState)("opening");
            (0, react__WEBPACK_IMPORTED_MODULE_1__.useEffect)((() => {
                const observer = new IntersectionObserver((entries => {
                    for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.dataset.introScene || "opening");
                }), {
                    threshold: .45
                });
                document.querySelectorAll("[data-intro-scene]").forEach((element => observer.observe(element)));
                return () => observer.disconnect();
            }), []);
            function jump(id) {
                var _document_getElementById;
                (_document_getElementById = document.getElementById("intro-" + id)) === null || _document_getElementById === void 0 ? void 0 : _document_getElementById.scrollIntoView({
                    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
                    block: "start"
                });
            }
             
            return (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                className: "sejong-intro",
                "data-component-id": "introduction",
                children: [ 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("nav", {
                    className: "intro-scenes container",
                    "aria-label": "기관 소개 장면",
                    children: scenes.map((scene =>   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .SystemButton */)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_2__.kR, {
                        variant: "quiet",
                        "aria-current": active === scene.id ? "step" : undefined,
                        onClick: () => jump(scene.id),
                        children: scene.label
                    }, scene.id)))
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("section", {
                    id: "intro-opening",
                    "data-intro-scene": "opening",
                    className: "intro-panel intro-cover",
                    children: [ 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("img", {
                        src: "/v5/assets/images/sejong-grand-facade.png",
                        alt: "광화문광장에 면한 세종문화회관 외관",
                        width: 1160,
                        height: 680
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                        className: "intro-cover-copy container",
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                            "data-text": "label",
                            children: "1978년 개관"
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("h1", {
                            "data-text": "title",
                            children: [ "광화문에서 만나는", 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("br", {}), "세종문화회관" ]
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                            "data-text": "body",
                            children: "공연과 전시를 보고, 예술을 배우는 서울의 문화공간입니다."
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .SystemButton */)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_2__.kR, {
                            variant: "inverse",
                            onClick: () => jump("pulse"),
                            children: "세종문화회관 둘러보기"
                        }) ]
                    }) ]
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("section", {
                    id: "intro-pulse",
                    "data-intro-scene": "pulse",
                    className: "intro-panel container intro-editorial",
                    children: [ 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                            "data-text": "label",
                            children: "서울시예술단"
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h2", {
                            "data-text": "heading",
                            children: "무대를 만드는 사람들"
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                            "data-text": "body",
                            children: "국악, 무용, 합창, 뮤지컬, 연극과 오페라. 서울시예술단의 공연과 활동을 소개합니다."
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_2__.SystemLink, {
                            href: "/about/companies",
                            variant: "secondary",
                            children: "서울시예술단 소개"
                        }) ]
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("figure", {
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("img", {
                            src: "/v5/assets/images/official/ilmu-stage.jpg",
                            alt: "서울시무용단 일무의 공연 장면",
                            width: 1200,
                            height: 675,
                            loading: "lazy"
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("figcaption", {
                            "data-text": "meta",
                            children: "서울시무용단 〈일무〉"
                        }) ]
                    }) ]
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("section", {
                    id: "intro-space",
                    "data-intro-scene": "space",
                    className: "intro-panel container intro-editorial intro-editorial-reverse",
                    children: [ 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("figure", {
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("img", {
                            src: "/v5/assets/images/sejong-grand-auditorium.png",
                            alt: "세종대극장의 객석과 무대",
                            width: 1160,
                            height: 680,
                            loading: "lazy"
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("figcaption", {
                            "data-text": "meta",
                            children: "세종대극장"
                        }) ]
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                            "data-text": "label",
                            children: "공연장과 전시장"
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h2", {
                            "data-text": "heading",
                            children: "공간마다 다른 관람 경험"
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                            "data-text": "body",
                            children: "대극장과 체임버홀, M씨어터와 S씨어터, 미술관의 위치와 객석을 관람 전에 살펴보세요."
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_2__.SystemLink, {
                            href: "/visit/spaces",
                            variant: "secondary",
                            children: "공간과 객석 안내"
                        }) ]
                    }) ]
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("section", {
                    id: "intro-together",
                    "data-intro-scene": "together",
                    className: "intro-panel container",
                    children:   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs /* ["default"] */)(_SystemSurface__WEBPACK_IMPORTED_MODULE_3__.ZP, {
                        as: "section",
                        variant: "subtle",
                        padding: "lg",
                        className: "intro-visit",
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                            children: [ 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h2", {
                                "data-text": "heading",
                                children: "관람을 준비하세요"
                            }), 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                                "data-text": "body",
                                children: "프로그램 일정과 찾아오는 길, 접근성 서비스를 안내합니다."
                            }) ]
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                            className: "page-layout-actions",
                            children: [ 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_2__.SystemLink, {
                                href: "/programs",
                                children: "프로그램 일정"
                            }), 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_2__.SystemLink, {
                                href: "/visit/directions",
                                variant: "secondary",
                                children: "오시는 길"
                            }), 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_2__.SystemLink, {
                                href: "/visit/accessibility",
                                variant: "secondary",
                                children: "접근성 안내"
                            }), 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_2__.SystemLink, {
                                href: "/about/introduction/history",
                                variant: "quiet",
                                children: "연혁"
                            }) ]
                        }) ]
                    })
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
    /***/ 8815: 
    /***/ function() {
        // extracted by mini-css-extract-plugin
        /***/}
}, 
/******/ function(__webpack_require__) {
    // webpackRuntimeModules
    /******/ var __webpack_exec__ = function(moduleId) {
        return __webpack_require__(__webpack_require__.s = moduleId);
    }
    /******/;
    __webpack_require__.O(0, [ 161, 648, 498, 971, 117, 744 ], (function() {
        return __webpack_exec__(8075);
    }));
    /******/    var __webpack_exports__ = __webpack_require__.O();
    /******/    _N_E = __webpack_exports__;
    /******/} ]);
//# sourceMappingURL=page_1.js.map