(self["webpackChunk_N_E"] = self["webpackChunk_N_E"] || []).push([ [ 983 ], {
    /***/ 7002: 
    /***/ function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {
        Promise.resolve().then(__webpack_require__.bind(__webpack_require__, 3274));
        Promise.resolve().then(__webpack_require__.bind(__webpack_require__, 3744));
        Promise.resolve().then(__webpack_require__.bind(__webpack_require__, 3548));
        /***/    },
    /***/ 3274: 
    /***/ function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        "use strict";
        /* harmony export */        __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ default: function() {
                /* binding */ return ProgramDetailClient;
            }
            /* harmony export */        });
        /* harmony import */        var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7437);
        /* harmony import */        var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(2265);
        /* harmony import */        var _src_catalog_CatalogProvider__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(7048);
        /* harmony import */        var next_link__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(7648);
        /* harmony import */        var _src_lib_media__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(2110);
        /* harmony import */        var _components_SystemPrimitives__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(6983);
        /* __next_internal_client_entry_do_not_use__ default auto */
        // [원본 포스터와 읽기 영역의 관계 / Natural poster proportions beside readable details]
                function ProgramDetailClient(param) {
            let {program: initialProgram} = param;
            const {catalog: catalog, loading: loading, error: error} = (0, _src_catalog_CatalogProvider__WEBPACK_IMPORTED_MODULE_2__ /* .useCatalog */ .r)();
            const program = catalog.programs.find((item => item.id === initialProgram.id)) || initialProgram;
            const imagePath = (0, _src_lib_media__WEBPACK_IMPORTED_MODULE_5__ /* .mediaPath */ .e)(program.image);
            const [imageFailed, setImageFailed] = (0, react__WEBPACK_IMPORTED_MODULE_1__.useState)(false);
            if (!loading && !error && !catalog.programs.some((item => item.id === initialProgram.id)))   return (0, 
            react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", {
                className: "container page-layout",
                children:   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .SystemNotice */)(_components_SystemPrimitives__WEBPACK_IMPORTED_MODULE_4__.F0, {
                    title: "공개가 종료된 프로그램입니다",
                    children:   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_components_SystemPrimitives__WEBPACK_IMPORTED_MODULE_4__.SystemLink, {
                        href: "/programs/",
                        children: "프로그램 목록"
                    })
                })
            });
             
            return (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                className: "container page-layout program-detail-page",
                children: [ 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("nav", {
                    className: "page-layout-breadcrumbs",
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
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(next_link__WEBPACK_IMPORTED_MODULE_3__["default"], {
                        "data-text": "action",
                        href: "/programs",
                        children: "프로그램"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", {
                        "data-text": "body",
                        "aria-hidden": "true",
                        children: "/"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", {
                        "data-text": "body",
                        "aria-current": "page",
                        children: program.title
                    }) ]
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("article", {
                    className: "program-detail-page-grid",
                    children: [ 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", {
                        className: "program-detail-page-poster",
                        children: program.image && !imageFailed ?   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("img", {
                            src: imagePath,
                            alt: program.imageAlt || program.title,
                            onError: () => setImageFailed(true)
                        }) :   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                            "data-text": "body",
                            children: "공식 이미지 준비 중"
                        })
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                        className: "program-detail-page-summary",
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("header", {
                            className: "page-layout-heading",
                            children: [ 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                className: "page-layout-actions",
                                children: [ 
                                
                                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .SystemBadge */)(_components_SystemPrimitives__WEBPACK_IMPORTED_MODULE_4__.WT, {
                                    "data-text": "meta",
                                    tone: "info",
                                    children: program.category
                                }), 
                                
                                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .SystemBadge */)(_components_SystemPrimitives__WEBPACK_IMPORTED_MODULE_4__.WT, {
                                    "data-text": "meta",
                                    children: program.genre
                                }) ]
                            }), 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h1", {
                                "data-text": "title",
                                children: program.title
                            }) ]
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("dl", {
                            className: "page-layout-facts program-detail-page-facts",
                            children: [ 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("dt", {
                                "data-text": "label",
                                children: "일시"
                            }), 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("dd", {
                                "data-text": "body",
                                children: [ program.start, " ~ ", program.end ]
                            }), 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("dt", {
                                "data-text": "label",
                                children: "장소"
                            }), 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("dd", {
                                "data-text": "body",
                                children: program.venue
                            }), 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("dt", {
                                "data-text": "label",
                                children: "가격"
                            }), 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("dd", {
                                "data-text": "body",
                                children: typeof program.price === "number" ? "".concat(program.price.toLocaleString("ko-KR"), "원") : program.price || "확인 중"
                            }), 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("dt", {
                                "data-text": "label",
                                children: "시간"
                            }), 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("dd", {
                                "data-text": "body",
                                children: program.time || "확인 중"
                            }) ]
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("section", {
                            className: "page-layout-prose program-detail-page-description",
                            "aria-labelledby": "program-description-heading",
                            children: [ 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h2", {
                                "data-text": "heading",
                                id: "program-description-heading",
                                children: "프로그램 소개"
                            }), 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                                "data-text": "body",
                                children: program.description
                            }) ]
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                            className: "page-layout-actions program-detail-page-actions",
                            children: [ 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_components_SystemPrimitives__WEBPACK_IMPORTED_MODULE_4__.SystemLink, {
                                "data-text": "action",
                                context: "flow",
                                href: "/booking/".concat(program.id),
                                children: "예약 회차 확인"
                            }), 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_components_SystemPrimitives__WEBPACK_IMPORTED_MODULE_4__.SystemLink, {
                                "data-text": "action",
                                context: "flow",
                                variant: "secondary",
                                href: "/programs",
                                children: "목록으로"
                            }) ]
                        }) ]
                    }) ]
                }) ]
            });
        }
        /***/    }
}, 
/******/ function(__webpack_require__) {
    // webpackRuntimeModules
    /******/ var __webpack_exec__ = function(moduleId) {
        return __webpack_require__(__webpack_require__.s = moduleId);
    }
    /******/;
    __webpack_require__.O(0, [ 922, 762, 648, 369, 498, 663, 29, 971, 117, 744 ], (function() {
        return __webpack_exec__(7002);
    }));
    /******/    var __webpack_exports__ = __webpack_require__.O();
    /******/    _N_E = __webpack_exports__;
    /******/} ]);
//# sourceMappingURL=page_1.js.map