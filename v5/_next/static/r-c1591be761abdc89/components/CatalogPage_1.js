(self["webpackChunk_N_E"] = self["webpackChunk_N_E"] || []).push([ [ 29 ], {
    /***/ 3744: 
    /***/ function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        "use strict";
        /* harmony export */        __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ default: function() {
                /* binding */ return CatalogPage;
            }
            /* harmony export */        });
        /* harmony import */        var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7437);
        /* harmony import */        var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(2265);
        /* harmony import */        var next_link__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(7648);
        /* harmony import */        var _src_data_catalog__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(9366);
        /* harmony import */        var _src_catalog_CatalogProvider__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(7048);
        /* harmony import */        var _SystemPrimitives__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(6983);
        /* harmony import */        var _SystemNavigation__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(7291);
        /* harmony import */        var _SystemControlGroup__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(8127);
        /* harmony import */        var _SystemSurface__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(820);
        /* harmony import */        var _ProgramCard__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(563);
        /* __next_internal_client_entry_do_not_use__ default auto */
        // [DB 본문 블록과 실제 목록의 조합 / Compose database content with live collections]
                function CatalogPage(param) {
            let {path: path} = param;
            var _venue_features;
            const {catalog: catalog} = (0, _src_catalog_CatalogProvider__WEBPACK_IMPORTED_MODULE_4__ /* .useCatalog */ .r)();
            const page = catalog.pages.find((item => item.path === path));
            const venue = /^\/(visit\/spaces|rental\/venues)\//.test(path) ? catalog.venues.find((item => path.endsWith("/".concat(item.id)))) : undefined;
            const notice = path.startsWith("/news/notices/") ? catalog.notices.find((item => path.endsWith("/".concat(item.id)))) : undefined;
            const group = _src_data_catalog__WEBPACK_IMPORTED_MODULE_3__ /* .NAV */ .w$.find((item => path === item.path || path.startsWith("".concat(item.path, "/"))));
            const [query, setQuery] = (0, react__WEBPACK_IMPORTED_MODULE_1__.useState)("");
            (0, react__WEBPACK_IMPORTED_MODULE_1__.useEffect)((() => {
                if (path === "/search") setQuery(new URLSearchParams(window.location.search).get("q") || "");
            }), [ path ]);
            const title = (page === null || page === void 0 ? void 0 : page.title) || (venue === null || venue === void 0 ? void 0 : venue.name) || (notice === null || notice === void 0 ? void 0 : notice.title) || "세종문화회관";
            const description = (page === null || page === void 0 ? void 0 : page.description) || (venue === null || venue === void 0 ? void 0 : venue.description) || (notice === null || notice === void 0 ? void 0 : notice.date);
            const category = path === "/programs/performance" ? "공연" : path === "/programs/exhibition" ? "전시" : path.startsWith("/programs/education") ? "교육" : null;
            const collection = path === "/search" ? catalog.programs.filter((item => "".concat(item.title, " ").concat(item.genre, " ").concat(item.venue).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))) : category ? catalog.programs.filter((item => item.category === category)) : path.startsWith("/programs/season") ? catalog.programs.filter((item => {
                var _item_tags;
                return (_item_tags = item.tags) === null || _item_tags === void 0 ? void 0 : _item_tags.includes("세종시즌");
            })) : [];
            function blocks(items) {
                return items.map(((block, index) => {
                    if (block.type === "prose")   return (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("section", {
                        className: "catalog-content-block",
                        children: [ block.heading &&   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h2", {
                            "data-text": "heading",
                            children: block.heading
                        }), block.paragraphs.map(((paragraph, i) =>   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                            "data-text": "body",
                            children: paragraph
                        }, i))) ]
                    }, index);
                    if (block.type === "facts")   return (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("section", {
                        className: "catalog-content-block",
                        children: [ block.title &&   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h2", {
                            "data-text": "heading",
                            children: block.title
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("dl", {
                            className: "page-layout-facts",
                            children: block.items.map((item =>   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                children: [ 
                                
                                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("dt", {
                                    "data-text": "label",
                                    children: item.label
                                }), 
                                
                                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("dd", {
                                    "data-text": "body",
                                    children: item.value
                                }) ]
                            }, item.label)))
                        }) ]
                    }, index);
                    if (block.type === "faq")   return (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("section", {
                        className: "catalog-content-block",
                        children: [ block.title &&   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h2", {
                            "data-text": "heading",
                            children: block.title
                        }), block.items.map((item =>   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .SystemDisclosure */)(_SystemNavigation__WEBPACK_IMPORTED_MODULE_6__.f, {
                            summary: item.question,
                            children:   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                                "data-text": "body",
                                children: item.answer
                            })
                        }, item.question))) ]
                    }, index);
                    if (block.type === "timeline")   return (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("section", {
                        className: "catalog-content-block",
                        children: [ block.title &&   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h2", {
                            "data-text": "heading",
                            children: block.title
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("ol", {
                            className: "catalog-timeline",
                            children: block.items.map((item =>   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("li", {
                                children: [ 
                                
                                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("time", {
                                    "data-text": "label",
                                    children: item.date
                                }), 
                                
                                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h3", {
                                    "data-text": "subheading",
                                    children: item.title
                                }), item.body &&   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                                    "data-text": "body",
                                    children: item.body
                                }) ]
                            }, "".concat(item.date, "-").concat(item.title))))
                        }) ]
                    }, index);
                    if (block.type === "map")   return (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs /* ["default"] */)(_SystemSurface__WEBPACK_IMPORTED_MODULE_8__.ZP, {
                        variant: "inset",
                        padding: "lg",
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                            "data-text": "label",
                            children: block.address
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_5__.SystemLink, {
                            href: block.href,
                            target: "_blank",
                            rel: "noreferrer",
                            children: block.label
                        }) ]
                    }, index);
                    if (block.type === "downloads")   return (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("section", {
                        className: "catalog-content-block",
                        children: [ block.title &&   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h2", {
                            "data-text": "heading",
                            children: block.title
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", {
                            className: "page-layout-actions",
                            children: block.items.map((item =>   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_5__.SystemLink, {
                                href: item.href,
                                variant: "secondary",
                                target: "_blank",
                                rel: "noreferrer",
                                children: item.label
                            }, item.href)))
                        }) ]
                    }, index);
                     
                    return (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", {
                        className: "page-layout-actions catalog-page-actions",
                        children: block.items.map((item =>   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_5__.SystemLink, {
                            href: item.href,
                            variant: "secondary",
                            target: item.external || item.href.startsWith("http") ? "_blank" : undefined,
                            rel: item.external || item.href.startsWith("http") ? "noreferrer" : undefined,
                            children: item.label
                        }, "".concat(item.href, "-").concat(item.label))))
                    }, index);
                }));
            }
             
            return (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                className: "container page-layout catalog-page",
                "data-component-id": "catalog-page",
                children: [ 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("nav", {
                    className: "page-layout-breadcrumbs",
                    "aria-label": "현재 위치",
                    children: [ 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(next_link__WEBPACK_IMPORTED_MODULE_2__["default"], {
                        "data-text": "action",
                        href: "/",
                        children: "홈"
                    }), group &&   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.Fragment, {
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", {
                            "data-text": "body",
                            "aria-hidden": "true",
                            children: "/"
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(next_link__WEBPACK_IMPORTED_MODULE_2__["default"], {
                            "data-text": "action",
                            href: group.path,
                            children: group.title
                        }) ]
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", {
                        "data-text": "body",
                        "aria-hidden": "true",
                        children: "/"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", {
                        "data-text": "body",
                        "aria-current": "page",
                        children: title
                    }) ]
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("header", {
                    className: "page-layout-heading catalog-page-heading",
                    children: [ 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h1", {
                        "data-text": "title",
                        children: title
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                        "data-text": "body",
                        children: description
                    }), group &&   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .SystemControlGroup */)(_SystemControlGroup__WEBPACK_IMPORTED_MODULE_7__.L, {
                        as: "nav",
                        className: "catalog-page-navigation",
                        "aria-label": "".concat(group.title, " 메뉴"),
                        children: group.items.map((param => {
                            let [label, href] = param;
                             
                            return (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_5__.SystemLink, {
                                href: href,
                                variant: path === href ? "primary" : "secondary",
                                "aria-current": path === href ? "page" : undefined,
                                children: label
                            }, href);
                        }))
                    }) ]
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                    "data-text": "body",
                    className: "catalog-page-content",
                    children: [ path === "/search" &&   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .SystemField */)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_5__.RK, {
                        label: "프로그램 검색",
                        value: query,
                        onChange: event => {
                            const value = event.currentTarget.value;
                            setQuery(value);
                            window.history.replaceState(null, "", "?q=".concat(encodeURIComponent(value)));
                        },
                        placeholder: "프로그램 이름, 장르, 공간",
                        type: "search"
                    }), (category || path.startsWith("/programs/season") || path === "/search") &&   (0, 
                    react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("section", {
                        className: "catalog-content-block",
                        "aria-label": "프로그램 목록",
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("p", {
                            "data-text": "meta",
                            children: [ collection.length, "개 프로그램" ]
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", {
                            className: "programs-page-grid",
                            children: collection.map((program =>   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* ["default"] */)(_ProgramCard__WEBPACK_IMPORTED_MODULE_9__.Z, {
                                program: program
                            }, program.id)))
                        }), !collection.length &&   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .SystemNotice */)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_5__.F0, {
                            children: "현재 이 분류에 공개된 프로그램이 없습니다."
                        }) ]
                    }), (path === "/visit/spaces" || path === "/rental/venues" || path === "/rental/compare") &&   (0, 
                    react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", {
                        className: "catalog-space-grid",
                        children: catalog.venues.map((item =>   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs /* ["default"] */)(_SystemSurface__WEBPACK_IMPORTED_MODULE_8__.ZP, {
                            padding: "lg",
                            children: [ 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h2", {
                                "data-text": "subheading",
                                children: item.name
                            }), 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                                "data-text": "body",
                                children: item.description
                            }), 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("p", {
                                "data-text": "meta",
                                children: [ "수용 규모 ", item.capacity, typeof item.capacity === "number" ? "석" : "" ]
                            }), 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_5__.SystemLink, {
                                href: "".concat(path.startsWith("/rental") ? "/rental/venues" : "/visit/spaces", "/").concat(item.id),
                                variant: "secondary",
                                children: "공간 상세"
                            }) ]
                        }, item.id)))
                    }), (path === "/news" || path === "/news/notices") &&   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", {
                        className: "catalog-content-block",
                        children: catalog.notices.map((item =>   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs /* ["default"] */)(_SystemSurface__WEBPACK_IMPORTED_MODULE_8__.ZP, {
                            padding: "lg",
                            children: [ 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("p", {
                                "data-text": "meta",
                                children: [ item.category, " · ", item.date ]
                            }), 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(next_link__WEBPACK_IMPORTED_MODULE_2__["default"], {
                                "data-text": "subheading",
                                href: "/news/notices/".concat(item.id),
                                children: item.title
                            }) ]
                        }, item.id)))
                    }), venue &&   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                        "data-text": "body",
                        className: "page-layout-prose",
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h2", {
                            "data-text": "heading",
                            children: "공간 정보"
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("dl", {
                            className: "page-layout-facts",
                            children: [ 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                children: [ 
                                
                                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("dt", {
                                    "data-text": "label",
                                    children: "수용 규모"
                                }), 
                                
                                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("dd", {
                                    "data-text": "body",
                                    children: [ venue.capacity, typeof venue.capacity === "number" ? "석" : "" ]
                                }) ]
                            }), 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                children: [ 
                                
                                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("dt", {
                                    "data-text": "label",
                                    children: "위치"
                                }), 
                                
                                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("dd", {
                                    "data-text": "body",
                                    children: venue.location || "세종문화회관"
                                }) ]
                            }) ]
                        }), (_venue_features = venue.features) === null || _venue_features === void 0 ? void 0 : _venue_features.map((item =>   (0, 
                        react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                            "data-text": "body",
                            children: item
                        }, item))), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_5__.SystemLink, {
                            href: "https://www.sejongpac.or.kr/portal/main/contents.do?menuNo=200368",
                            variant: "secondary",
                            target: "_blank",
                            rel: "noreferrer",
                            children: "공간·객석 배치 확인"
                        }) ]
                    }), notice &&   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("article", {
                        className: "page-layout-prose",
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("p", {
                            "data-text": "meta",
                            children: [ notice.category, " · ", notice.date ]
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                            "data-text": "body",
                            children: notice.content || notice.body
                        }), notice.details &&   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("dl", {
                            className: "page-layout-facts",
                            children: notice.details.map((param => {
                                let [label, value] = param;
                                 
                                return (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                    children: [ 
                                    
                                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("dt", {
                                        "data-text": "label",
                                        children: label
                                    }), 
                                    
                                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("dd", {
                                        "data-text": "body",
                                        children: value
                                    }) ]
                                }, label);
                            }))
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_5__.SystemLink, {
                            href: "https://www.sejongpac.or.kr/portal/bbs/B0000058/list.do?menuNo=200568",
                            target: "_blank",
                            rel: "noreferrer",
                            children: "기관 공지 원문 확인"
                        }) ]
                    }), page &&   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", {
                        "data-text": "body",
                        className: "page-layout-prose",
                        children: blocks(page.blocks)
                    }), (page === null || page === void 0 ? void 0 : page.sourceUrl) &&   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                        "data-text": "meta",
                        className: "catalog-content-source",
                        children:   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("a", {
                            "data-text": "action",
                            href: page.sourceUrl,
                            target: "_blank",
                            rel: "noreferrer",
                            children: "업무별 최신 안내 확인"
                        })
                    }) ]
                }) ]
            });
        }
        /***/    },
    /***/ 3548: 
    /***/ function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        "use strict";
        // EXPORTS
                __webpack_require__.d(__webpack_exports__, {
            default: function() {
                /* binding */ return CompletedPage;
            }
        });
        // EXTERNAL MODULE: ./node_modules/next/dist/compiled/react/jsx-runtime.js
                var jsx_runtime = __webpack_require__(7437);
        // EXTERNAL MODULE: ./node_modules/next/dist/api/link.js
                var api_link = __webpack_require__(7648);
        // EXTERNAL MODULE: ./node_modules/next/dist/compiled/react/index.js
                var react = __webpack_require__(2265);
        // EXTERNAL MODULE: ./src/data/catalog.ts
                var data_catalog = __webpack_require__(9366);
        // EXTERNAL MODULE: ./src/catalog/CatalogProvider.tsx + 1 modules
                var CatalogProvider = __webpack_require__(7048);
        // CONCATENATED MODULE: ./src/page-completion/manifest.ts
        // [미구현 페이지의 명시적 허용 목록 / Explicit allowlist of unfinished pages]
        const COMPLETION_PATHS = [ "/about", "/about/arts-center", "/about/companies", "/about/companies/ballet", "/about/companies/chorus", "/about/companies/dance", "/about/companies/musical", "/about/companies/opera", "/about/companies/theater", "/about/companies/traditional", "/about/disclosure", "/about/disclosure/ethics", "/about/disclosure/management", "/about/disclosure/request", "/about/donation", "/about/donation/apply", "/about/esg", "/about/esg/environment", "/about/esg/governance", "/about/esg/social", "/about/introduction/ci", "/about/introduction/greeting", "/about/introduction/history", "/about/introduction/organization", "/about/partners", "/about/partners/apply", "/english", "/news/events", "/news/events/autumn-walk", "/news/events/autumn-walk/apply", "/news/events/review", "/news/events/review/apply", "/news/events/summer-end", "/news/events/winners", "/news/goods", "/news/goods/art-postcards", "/news/goods/canvas-bag", "/news/goods/cart", "/news/goods/orders", "/news/goods/viewing-journal", "/news/magazine", "/news/membership", "/news/membership/benefits", "/news/membership/join", "/news/newsletter", "/news/newsletter/archive", "/news/notices/recruit/apply", "/policy/email", "/policy/privacy", "/policy/terms", "/programs/booking-guide", "/programs/education/apply-guide", "/programs/history", "/programs/season/classic", "/programs/season/everyone", "/programs/season/orchestra", "/programs/season/package", "/programs/season/sejong", "/programs/season/summer", "/programs/season/sync-next", "/rental", "/rental/apply", "/rental/compare", "/rental/contact", "/rental/equipment", "/rental/guide", "/rental/guide/eligibility", "/rental/guide/fees", "/rental/process", "/rental/process/documents", "/rental/schedule", "/sitemap", "/visit", "/visit/accessibility", "/visit/amenities", "/visit/amenities/dining", "/visit/amenities/facilities", "/visit/directions", "/visit/directions/parking", "/visit/etiquette", "/visit/group", "/visit/plan", "/visit/support", "/visit/support/faq", "/visit/support/inquiry", "/visit/support/lost", "/visit/support/lost/glasses", "/visit/support/lost/scarf", "/visit/support/lost/umbrella" ];
        const allowed = new Set(COMPLETION_PATHS);
        const isCompletionPath = path => allowed.has(path)
        // EXTERNAL MODULE: ./components/SystemPrimitives.tsx
        ;
        var SystemPrimitives = __webpack_require__(6983);
        // EXTERNAL MODULE: ./components/SystemControlGroup.tsx
                var SystemControlGroup = __webpack_require__(8127);
        // EXTERNAL MODULE: ./components/SystemNavigation.tsx
                var SystemNavigation = __webpack_require__(7291);
        // EXTERNAL MODULE: ./components/SystemSurface.tsx
                var SystemSurface = __webpack_require__(820);
        // EXTERNAL MODULE: ./components/SystemText.tsx
                var SystemText = __webpack_require__(8519);
        // EXTERNAL MODULE: ./components/ProgramCard.tsx
                var ProgramCard = __webpack_require__(563);
        // CONCATENATED MODULE: ./src/page-completion/requests.ts
        const requests_text = function(name, label) {
            let required = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : true, maxLength = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : 120;
            return {
                name: name,
                label: label,
                type: "text",
                required: required,
                maxLength: maxLength
            };
        };
        const message = function() {
            let label = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "신청 내용", required = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : true;
            return {
                name: "message",
                label: label,
                type: "textarea",
                required: required,
                maxLength: 2e3
            };
        };
        const venue = {
            name: "venue",
            label: "희망 공간",
            type: "select",
            required: true,
            options: [ {
                value: "grand",
                label: "세종대극장"
            }, {
                value: "m-theater",
                label: "세종M씨어터"
            }, {
                value: "s-theater",
                label: "세종S씨어터"
            }, {
                value: "chamber",
                label: "세종체임버홀"
            }, {
                value: "gallery",
                label: "세종미술관"
            } ]
        };
        const date = {
            name: "date",
            label: "희망일",
            type: "date",
            required: true
        };
        const attendees = {
            name: "attendees",
            label: "예상 인원",
            type: "number",
            required: true,
            min: 1,
            max: 1e4
        };
        function defineServiceForm(page) {
            if (!page.form) return null;
            const kind = page.form.kind;
            const common = [ requests_text("name", "이름", true, 80), {
                name: "email",
                label: "연락받을 이메일",
                type: "email",
                required: true,
                maxLength: 254
            } ];
            if (kind !== "newsletter") common.push({
                name: "phone",
                label: "연락처",
                type: "tel",
                required: ![ "event", "membership" ].includes(kind),
                maxLength: 30
            });
            const specific = {
                rental: [ requests_text("organization", "단체·기관명"), venue, date, {
                    ...date,
                    name: "endDate",
                    label: "종료 희망일"
                }, attendees, requests_text("subject", "행사명", true, 160), message("행사 개요와 필요한 시설") ],
                group: [ requests_text("organization", "단체·기관명"), requests_text("program", "희망 프로그램", true, 160), date, attendees, requests_text("subject", "문의 제목", false, 160), message("관람 목적과 필요한 지원") ],
                inquiry: [ requests_text("subject", "문의 제목", true, 160), message("문의 내용") ],
                partnership: [ requests_text("organization", "기관·기업명"), requests_text("subject", "제안 제목", true, 160), message("제안 내용과 협력 방식") ],
                donation: [ requests_text("organization", "소속", false), {
                    name: "amount",
                    label: "희망 후원 금액(원, 선택)",
                    type: "number",
                    min: 1,
                    max: 1e9
                }, {
                    name: "frequency",
                    label: "후원 방식",
                    type: "select",
                    required: true,
                    options: [ {
                        value: "once",
                        label: "일시 후원"
                    }, {
                        value: "regular",
                        label: "정기 후원 상담"
                    } ]
                }, message("관심 사업과 상담 내용", false) ],
                recruitment: [ requests_text("subject", "지원 분야", true, 160), {
                    name: "experience",
                    label: "관련 경험",
                    type: "textarea",
                    required: true,
                    maxLength: 3e3
                }, requests_text("portfolio", "포트폴리오 URL(선택)", false, 500), message("지원 동기") ],
                event: [ requests_text("subject", "참여 이벤트", true, 160), message("참여 내용", false) ],
                newsletter: [ {
                    name: "interests",
                    label: "관심 소식",
                    type: "select",
                    required: true,
                    options: [ {
                        value: "all",
                        label: "공연·전시·교육 전체"
                    }, {
                        value: "performance",
                        label: "공연"
                    }, {
                        value: "exhibition",
                        label: "전시"
                    }, {
                        value: "education",
                        label: "교육"
                    } ]
                } ],
                membership: [ {
                    name: "interests",
                    label: "관심 분야",
                    type: "select",
                    required: true,
                    options: [ {
                        value: "performance",
                        label: "공연"
                    }, {
                        value: "exhibition",
                        label: "전시"
                    }, {
                        value: "education",
                        label: "교육"
                    } ]
                }, message("가입 상담 내용", false) ],
                education: [ requests_text("program", "희망 교육 프로그램", true, 160), message("신청·상담 내용") ],
                order: [ message("상품·수령 관련 요청(선택)", false) ]
            };
            return {
                id: page.path,
                path: page.path,
                kind: kind,
                title: page.form.title,
                enabled: !page.form.closed,
                fields: [ ...common, ...specific[kind] ]
            };
        }
        function validateServiceValues(form, values) {
            const errors = {};
            const allowed = new Set([ ...form.fields.map((field => field.name)), "consent" ]);
            if (Object.keys(values).some((key => !allowed.has(key)))) errors._form = "신청 항목이 변경되었습니다. 입력 내용을 확인해 주세요.";
            if (values.consent !== true) errors.consent = "신청정보 수집·이용에 동의해 주세요.";
            for (const field of form.fields) {
                var _field_options;
                const value = typeof values[field.name] === "string" ? values[field.name].trim() : "";
                if (!value) {
                    if (field.required) errors[field.name] = "".concat(field.label, "을(를) 입력해 주세요.");
                    continue;
                }
                if (field.maxLength && value.length > field.maxLength) errors[field.name] = "".concat(field.maxLength, "자 이내로 입력해 주세요.");
                if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors[field.name] = "이메일 주소를 확인해 주세요.";
                if (field.type === "tel" && !/^[+\d()\s-]{8,30}$/.test(value)) errors[field.name] = "연락처를 확인해 주세요.";
                var _field_min, _field_max;
                if (field.type === "number" && (!/^\d+$/.test(value) || Number(value) < ((_field_min = field.min) !== null && _field_min !== void 0 ? _field_min : 0) || Number(value) > ((_field_max = field.max) !== null && _field_max !== void 0 ? _field_max : Number.MAX_SAFE_INTEGER))) errors[field.name] = "허용된 범위의 정수를 입력해 주세요.";
                if (field.type === "date" && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value)) errors[field.name] = "날짜를 확인해 주세요.";
                if (field.type === "select" && !((_field_options = field.options) === null || _field_options === void 0 ? void 0 : _field_options.some((option => option.value === value)))) errors[field.name] = "목록에서 선택해 주세요.";
                if (field.name === "portfolio" && !/^https?:\/\//.test(value)) errors[field.name] = "http 또는 https로 시작하는 주소를 입력해 주세요.";
            }
            if (!errors.date && !errors.endDate && values.date && values.endDate && String(values.endDate) < String(values.date)) errors.endDate = "종료일은 시작일 이후로 선택해 주세요.";
            return errors;
        }
        // EXTERNAL MODULE: ./src/lib/supabase.ts
                var supabase = __webpack_require__(5526);
        // EXTERNAL MODULE: ./node_modules/@supabase/supabase-js/dist/index.mjs + 25 modules
                var dist = __webpack_require__(897);
        // CONCATENATED MODULE: ./src/page-completion/request-db.ts
        // [본인 확인 후 서버에서 저장 / Server persistence after authenticated ownership checks]
        async function clientFor(owner) {
            if (!supabase /* supabase */ .OQ) throw new Error("신청 서비스에 연결하지 못했습니다.");
            const sessionResult = await supabase /* supabase */ .OQ.auth.getSession();
            const session = sessionResult.data.session;
            if (sessionResult.error || !session || session.user.id !== owner) throw new Error("로그인한 계정을 확인한 뒤 다시 시도해 주세요.");
            const {data: data, error: error} = await supabase /* supabase */ .OQ.auth.getUser(session.access_token);
            if (error || !data.user || data.user.id !== owner) throw new Error("로그인한 계정을 확인한 뒤 다시 시도해 주세요.");
            // 비동기 요청 중 계정이 바뀌어도 새 계정의 토큰으로 보내지 않습니다. / Bind each operation to its verified session token.
                        return (0, dist /* createClient */ .eI)("https://cowalyqaoqoclrfmxszp.supabase.co" || 0, "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvd2FseXFhb3FvY2xyZm14c3pwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzNDU2OTAsImV4cCI6MjEwNzkyMTY5MH0.AURrQwk9gjkfb6teqGVa8OWJ3YWs7gCS9AYwTvHNnyQ" || 0, {
                global: {
                    headers: {
                        Authorization: "Bearer ".concat(session.access_token)
                    }
                },
                auth: {
                    persistSession: false,
                    autoRefreshToken: false,
                    detectSessionInUrl: false
                }
            });
        }
        function result(param) {
            let {data: data, error: error} = param;
            if (error) throw new Error(error.message || "저장하지 못했습니다. 다시 시도해 주세요.");
            return data;
        }
        async function loadServiceRequests(owner, formId) {
            const client = await clientFor(owner);
            let query = client.from("sejong_service_requests").select("id,reference,form_id,kind,status,values,created_at,expires_at").order("created_at", {
                ascending: false
            }).limit(50);
            if (formId) query = query.eq("form_id", formId);
            return result(await query);
        }
        async function submitServiceRequest(owner, formId, key, values) {
            const client = await clientFor(owner);
            return result(await client.rpc("submit_sejong_request", {
                p_form_id: formId,
                p_request_key: key,
                p_values: values
            }));
        }
        async function cancelServiceRequest(owner, id) {
            const client = await clientFor(owner);
            return result(await client.rpc("cancel_sejong_request", {
                p_id: id
            }));
        }
        async function loadServiceGoods() {
            if (!supabase /* supabase */ .OQ) throw new Error("상품 목록에 연결하지 못했습니다.");
            return result(await supabase /* supabase */ .OQ.from("sejong_service_goods").select("id,title,description,source_url,image,price").eq("published", true).order("sort_order"));
        }
        async function loadServiceCart(owner) {
            const client = await clientFor(owner);
            const rows = result(await client.from("sejong_service_cart").select("good_id,quantity,sejong_service_goods(id,title,description,source_url,image,price)").order("updated_at")) || [];
            return rows.map((row => ({
                good_id: row.good_id,
                quantity: row.quantity,
                sejong_goods: row.sejong_service_goods
            })));
        }
        async function setServiceCartQuantity(owner, goodId, quantity) {
            let increment = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : false;
            const client = await clientFor(owner);
            result(await client.rpc("set_sejong_cart_quantity", {
                p_good_id: goodId,
                p_quantity: quantity,
                p_increment: increment
            }));
        }
        // EXTERNAL MODULE: ./components/useAccountIdentity.ts
                var useAccountIdentity = __webpack_require__(7215);
        // EXTERNAL MODULE: ./components/SmallNotificationModal.tsx
                var SmallNotificationModal = __webpack_require__(7281);
        // EXTERNAL MODULE: ./styles/service-requests.css
                var service_requests = __webpack_require__(5063);
        // CONCATENATED MODULE: ./components/ServiceRequestForm.tsx
        /* __next_internal_client_entry_do_not_use__ default auto */
        // [신청 입력·저장·본인 기록 / Request entry, confirmed persistence and owner history]
        function ServiceRequestForm(param) {
            let {page: page, onSaved: onSaved} = param;
            var _page_form, _page_form1;
            const identity = (0, useAccountIdentity /* default */ .ZP)();
            const owner = identity.isLoggedIn ? identity.identityId : null;
            const activeOwner = (0, react.useRef)(owner);
            activeOwner.current = owner;
            const generation = (0, react.useRef)(0);
            const form = (0, react.useMemo)((() => defineServiceForm(page)), [ page ]);
            const [values, setValues] = (0, react.useState)({
                consent: false
            });
            const [errors, setErrors] = (0, react.useState)({});
            const [records, setRecords] = (0, react.useState)([]);
            const [loading, setLoading] = (0, react.useState)(false);
            const [pending, setPending] = (0, react.useState)(false);
            const [failure, setFailure] = (0, react.useState)("");
            const [saved, setSaved] = (0, react.useState)(null);
            const [cancelling, setCancelling] = (0, react.useState)("");
            const key = (0, react.useRef)(null);
            const requestValues = (0, react.useRef)(null);
            const dirty = (0, react.useRef)(false);
            const errorBox = (0, react.useRef)(null);
            const id = "request-".concat(page.path.replace(/[^a-z0-9]/gi, "-"));
            (0, react.useEffect)((() => {
                var _page_form;
                let stopped = false;
                generation.current += 1;
                dirty.current = false;
                key.current = null;
                requestValues.current = null;
                const query = new URLSearchParams(window.location.search);
                setValues({
                    name: identity.profile.name,
                    email: identity.profile.email,
                    phone: identity.profile.phone,
                    subject: ((_page_form = page.form) === null || _page_form === void 0 ? void 0 : _page_form.entityId) || "",
                    venue: query.get("venue") || "",
                    consent: false
                });
                setRecords([]);
                setErrors({});
                setFailure("");
                setSaved(null);
                setPending(false);
                setCancelling("");
                if (owner && form) {
                    setLoading(true);
                    void loadServiceRequests(owner, form.id).then((rows => {
                        if (!stopped && activeOwner.current === owner) setRecords(rows);
                    })).catch((error => {
                        if (!stopped && activeOwner.current === owner) setFailure(error instanceof Error ? error.message : "신청 기록을 불러오지 못했습니다.");
                    })).finally((() => {
                        if (!stopped && activeOwner.current === owner) setLoading(false);
                    }));
                } else setLoading(false);
                return () => {
                    stopped = true;
                };
                // 계정·경로가 바뀔 때만 작성 중인 내용을 초기화합니다. / Reset drafts only when the account or route changes.
                // eslint-disable-next-line react-hooks/exhaustive-deps
                        }), [ owner, form === null || form === void 0 ? void 0 : form.id ]);
            (0, react.useEffect)((() => {
                if (!dirty.current) setValues((current => ({
                    ...current,
                    name: identity.profile.name,
                    email: identity.profile.email,
                    phone: identity.profile.phone
                })));
            }), [ identity.profile.name, identity.profile.email, identity.profile.phone ]);
            function change(name, value) {
                dirty.current = true;
                key.current = null;
                requestValues.current = null;
                setValues((current => ({
                    ...current,
                    [name]: value
                })));
                setErrors((current => ({
                    ...current,
                    [name]: ""
                })));
                setSaved(null);
            }
            async function submit(event) {
                event.preventDefault();
                if (!form || !owner || pending || !form.enabled) return;
                // 프로필 전용 초기값은 신청 정의에 포함된 경우에만 전송합니다. / Send only fields owned by this form.
                                const clean = Object.fromEntries(form.fields.map((field => [ field.name, typeof values[field.name] === "string" ? String(values[field.name]).trim() : "" ])));
                clean.consent = values.consent === true;
                const nextErrors = validateServiceValues(form, clean);
                setErrors(nextErrors);
                setFailure("");
                if (Object.keys(nextErrors).length) {
                    setFailure("입력한 내용을 확인해 주세요.");
                    requestAnimationFrame((() => {
                        var _errorBox_current;
                        return (_errorBox_current = errorBox.current) === null || _errorBox_current === void 0 ? void 0 : _errorBox_current.focus();
                    }));
                    return;
                }
                if (!key.current) {
                    key.current = crypto.randomUUID();
                    requestValues.current = clean;
                }
                const capturedOwner = owner;
                setPending(true);
                const capturedGeneration = generation.current;
                const current = () => activeOwner.current === capturedOwner && generation.current === capturedGeneration;
                try {
                    const request = await submitServiceRequest(owner, form.id, key.current, requestValues.current || clean);
                    if (!current()) return;
                    setSaved(request);
                    setRecords((current => [ request, ...current.filter((item => item.id !== request.id)) ]));
                    key.current = null;
                    requestValues.current = null;
                    setValues((current => ({
                        ...current,
                        consent: false
                    })));
                    (0, SmallNotificationModal /* showSmallNotification */ .VX)("신청 내용을 저장했습니다.");
                    onSaved === null || onSaved === void 0 ? void 0 : onSaved(request);
                } catch (error) {
                    if (current()) {
                        setFailure(error instanceof Error ? error.message : "저장하지 못했습니다. 다시 시도해 주세요.");
                        requestAnimationFrame((() => {
                            var _errorBox_current;
                            return (_errorBox_current = errorBox.current) === null || _errorBox_current === void 0 ? void 0 : _errorBox_current.focus();
                        }));
                    }
                } finally {
                    if (current()) setPending(false);
                }
            }
            async function cancel(request) {
                if (!owner || cancelling) return;
                const capturedOwner = owner;
                setCancelling(request.id);
                setFailure("");
                const capturedGeneration = generation.current;
                const current = () => activeOwner.current === capturedOwner && generation.current === capturedGeneration;
                try {
                    const changed = await cancelServiceRequest(owner, request.id);
                    if (!current()) return;
                    setRecords((current => current.map((item => item.id === changed.id ? changed : item))));
                    if ((saved === null || saved === void 0 ? void 0 : saved.id) === changed.id) setSaved(changed);
                    (0, SmallNotificationModal /* showSmallNotification */ .VX)("신청을 취소했습니다.");
                } catch (error) {
                    if (current()) setFailure(error instanceof Error ? error.message : "취소하지 못했습니다.");
                } finally {
                    if (current()) setCancelling("");
                }
            }
            if (!form) return null;
             
            return (0, jsx_runtime.jsxs)("section", {
                className: "service-request",
                "data-component-id": "service-request",
                "aria-labelledby": "".concat(id, "-title"),
                children: [ 
                
                 (0, jsx_runtime.jsx)("h2", {
                    "data-text": "subheading",
                    id: "".concat(id, "-title"),
                    children: form.title
                }), ((_page_form = page.form) === null || _page_form === void 0 ? void 0 : _page_form.description) &&   (0, 
                jsx_runtime.jsx)("p", {
                    "data-text": "body",
                    children: page.form.description
                }), !form.enabled ?   (0, jsx_runtime.jsx /* SystemNotice */)(SystemPrimitives.F0, {
                    title: "신청 접수 안내",
                    children: ((_page_form1 = page.form) === null || _page_form1 === void 0 ? void 0 : _page_form1.closedReason) || "현재 접수할 수 없습니다."
                }) : !identity.ready ?   (0, jsx_runtime.jsx)("p", {
                    "data-text": "body",
                    role: "status",
                    children: "로그인 정보를 확인하고 있습니다."
                }) : !owner ?   (0, jsx_runtime.jsxs /* SystemNotice */)(SystemPrimitives.F0, {
                    title: "로그인 후 신청할 수 있습니다",
                    children: [ 
                    
                     (0, jsx_runtime.jsx)("p", {
                        "data-text": "body",
                        children: "신청 내역은 본인 계정에서 확인하고 취소할 수 있습니다."
                    }), 
                    
                     (0, jsx_runtime.jsx)(SystemPrimitives.SystemLink, {
                        href: "/account/login",
                        target: "_blank",
                        variant: "secondary",
                        shape: "pill",
                        children: "로그인하기 · 새 창"
                    }) ]
                }) :   (0, jsx_runtime.jsxs /* default */)(SystemSurface.ZP, {
                    as: "form",
                    variant: "panel",
                    padding: "lg",
                    className: "service-request-form",
                    onSubmit: submit,
                    noValidate: true,
                    "aria-busy": pending,
                    children: [ failure &&   (0, jsx_runtime.jsx /* SystemNotice */)(SystemPrimitives.F0, {
                        error: true,
                        tabIndex: -1,
                        ref: errorBox,
                        children: failure
                    }), saved &&   (0, jsx_runtime.jsxs /* SystemNotice */)(SystemPrimitives.F0, {
                        title: saved.status === "cancelled" ? "취소된 신청입니다" : "신청 내용을 저장했습니다",
                        children: [ 
                        
                         (0, jsx_runtime.jsxs)("p", {
                            "data-text": "body",
                            children: [ "접수번호 ", saved.reference ]
                        }), 
                        
                         (0, jsx_runtime.jsx)("p", {
                            "data-text": "body",
                            children: form.kind === "order" ? "구매 요청이 저장됐습니다. 결제·배송 상태는 아직 확정되지 않았습니다." : "아래 신청 내역에서 저장한 내용을 확인할 수 있습니다."
                        }) ]
                    }), 
                    
                     (0, jsx_runtime.jsx)("div", {
                        className: "service-request-fields",
                        children: form.fields.map((field => {
                            var _field_options;
                            const common = {
                                id: "".concat(id, "-").concat(field.name),
                                name: field.name,
                                label: field.label,
                                required: field.required,
                                value: String(values[field.name] || ""),
                                disabled: pending,
                                error: errors[field.name],
                                onChange: event => change(field.name, event.currentTarget.value)
                            };
                            if (field.type === "textarea")   return (0, jsx_runtime.jsx /* SystemField */)(SystemPrimitives.RK, {
                                ...common,
                                as: "textarea",
                                rows: 5,
                                maxLength: field.maxLength,
                                outerClassName: "service-request-wide"
                            }, field.name);
                            if (field.type === "select")   return (0, jsx_runtime.jsxs /* SystemField */)(SystemPrimitives.RK, {
                                ...common,
                                as: "select",
                                children: [ 
                                
                                 (0, jsx_runtime.jsx)("option", {
                                    "data-text": "body",
                                    value: "",
                                    children: "선택해 주세요"
                                }), (_field_options = field.options) === null || _field_options === void 0 ? void 0 : _field_options.map((option =>   (0, 
                                jsx_runtime.jsx)("option", {
                                    "data-text": "body",
                                    value: option.value,
                                    children: option.label
                                }, option.value))) ]
                            }, field.name);
                             
                            return (0, jsx_runtime.jsx /* SystemField */)(SystemPrimitives.RK, {
                                ...common,
                                type: field.type,
                                maxLength: field.maxLength,
                                min: field.min,
                                max: field.max,
                                step: field.type === "number" ? 1 : undefined,
                                autoComplete: field.name === "name" ? "name" : field.type === "email" ? "email" : field.type === "tel" ? "tel" : undefined
                            }, field.name);
                        }))
                    }), 
                    
                     (0, jsx_runtime.jsx /* SystemDisclosure */)(SystemNavigation.f, {
                        summary: "신청정보 수집·이용 안내",
                        appearance: "plain",
                        children:   (0, jsx_runtime.jsxs)("dl", {
                            className: "service-request-privacy",
                            children: [ 
                            
                             (0, jsx_runtime.jsxs)("div", {
                                children: [ 
                                
                                 (0, jsx_runtime.jsx)("dt", {
                                    "data-text": "label",
                                    children: "처리 주체·목적"
                                }), 
                                
                                 (0, jsx_runtime.jsx)("dd", {
                                    "data-text": "body",
                                    children: "이 사이트 운영자가 신청 확인과 답변을 위해 처리합니다."
                                }) ]
                            }), 
                            
                             (0, jsx_runtime.jsxs)("div", {
                                children: [ 
                                
                                 (0, jsx_runtime.jsx)("dt", {
                                    "data-text": "label",
                                    children: "수집 항목"
                                }), 
                                
                                 (0, jsx_runtime.jsxs)("dd", {
                                    "data-text": "body",
                                    children: [ "이름·이메일", form.kind !== "newsletter" ? "·연락처" : "", "와 이 양식에 입력한 신청 내용, 동의 기록" ]
                                }) ]
                            }), 
                            
                             (0, jsx_runtime.jsxs)("div", {
                                children: [ 
                                
                                 (0, jsx_runtime.jsx)("dt", {
                                    "data-text": "label",
                                    children: "보관 기간"
                                }), 
                                
                                 (0, jsx_runtime.jsx)("dd", {
                                    "data-text": "body",
                                    children: "접수일로부터 90일 보관 후 자동 삭제합니다. 동의를 거부할 수 있으며, 이 경우 신청을 저장할 수 없습니다."
                                }) ]
                            }) ]
                        })
                    }), 
                    
                     (0, jsx_runtime.jsx /* SystemCheckbox */)(SystemPrimitives.U1, {
                        checked: values.consent === true,
                        disabled: pending,
                        onChange: event => change("consent", event.target.checked),
                        "aria-describedby": errors.consent ? "".concat(id, "-consent-error") : undefined,
                        label: "신청정보 수집·이용에 동의합니다 (필수)"
                    }), errors.consent &&   (0, jsx_runtime.jsx)("p", {
                        "data-text": "body",
                        id: "".concat(id, "-consent-error"),
                        children: errors.consent
                    }), 
                    
                     (0, jsx_runtime.jsxs)("div", {
                        className: "service-request-actions",
                        children: [ 
                        
                         (0, jsx_runtime.jsx /* SystemButton */)(SystemPrimitives.kR, {
                            type: "submit",
                            disabled: pending,
                            shape: "pill",
                            children: pending ? "저장 중" : form.kind === "order" ? "구매 요청 저장" : "신청 내용 저장"
                        }), 
                        
                         (0, jsx_runtime.jsx)("p", {
                            "data-text": "meta",
                            children: "저장 완료 후 접수번호가 표시됩니다."
                        }) ]
                    }) ]
                }), owner &&   (0, jsx_runtime.jsxs)("div", {
                    className: "service-request-history",
                    children: [ 
                    
                     (0, jsx_runtime.jsx)("h3", {
                        "data-text": "item-title",
                        children: "나의 신청 내역"
                    }), loading ?   (0, jsx_runtime.jsx)("p", {
                        "data-text": "body",
                        role: "status",
                        children: "내역을 불러오고 있습니다."
                    }) : !records.length ?   (0, jsx_runtime.jsx)("p", {
                        "data-text": "body",
                        children: "저장한 신청 내역이 없습니다."
                    }) : records.map((request =>   (0, jsx_runtime.jsxs /* SystemDisclosure */)(SystemNavigation.f, {
                        summary:   (0, jsx_runtime.jsxs)("span", {
                            "data-text": "label",
                            children: [ request.reference, " · ", request.status === "cancelled" ? "취소" : "접수", " · ", new Date(request.created_at).toLocaleDateString("ko-KR", {
                                timeZone: "Asia/Seoul"
                            }) ]
                        }),
                        children: [ 
                        
                         (0, jsx_runtime.jsx)("dl", {
                            className: "service-request-privacy",
                            children: form.fields.map((field =>   (0, jsx_runtime.jsxs)("div", {
                                children: [ 
                                
                                 (0, jsx_runtime.jsx)("dt", {
                                    "data-text": "label",
                                    children: field.label
                                }), 
                                
                                 (0, jsx_runtime.jsx)("dd", {
                                    "data-text": "body",
                                    children: String(request.values[field.name] || "—")
                                }) ]
                            }, field.name)))
                        }), request.status === "submitted" &&   (0, jsx_runtime.jsx /* SystemButton */)(SystemPrimitives.kR, {
                            variant: "secondary",
                            shape: "pill",
                            disabled: Boolean(cancelling),
                            onClick: () => void cancel(request),
                            children: cancelling === request.id ? "취소 중" : "신청 취소"
                        }) ]
                    }, request.id))) ]
                }), failure && (!form.enabled || !owner) &&   (0, jsx_runtime.jsx /* SystemNotice */)(SystemPrimitives.F0, {
                    error: true,
                    children: failure
                }) ]
            });
        }
        // CONCATENATED MODULE: ./components/ServiceGoods.tsx
        /* __next_internal_client_entry_do_not_use__ default auto */
        const money = price => price == null ? "가격 확인 필요" : "".concat(price.toLocaleString("ko-KR"), "원")
        // [실제 상품과 본인 장바구니·구매 요청 / Published goods, owner carts and purchase requests]
        ;
        function ServiceGoods(param) {
            let {mode: mode, page: page} = param;
            const identity = (0, useAccountIdentity /* default */ .ZP)();
            const owner = identity.isLoggedIn ? identity.identityId : null;
            const activeOwner = (0, react.useRef)(owner);
            activeOwner.current = owner;
            const generation = (0, react.useRef)(0);
            const [goods, setGoods] = (0, react.useState)([]);
            const [cart, setCart] = (0, react.useState)([]);
            const [orders, setOrders] = (0, react.useState)([]);
            const [receipt, setReceipt] = (0, react.useState)(null);
            const [query, setQuery] = (0, react.useState)("");
            const [loading, setLoading] = (0, react.useState)(true);
            const [failure, setFailure] = (0, react.useState)("");
            const [pending, setPending] = (0, react.useState)("");
            const [refresh, setRefresh] = (0, react.useState)(0);
            const heading = mode === "goods" ? "굿즈 둘러보기" : mode === "cart" ? "나의 장바구니" : "나의 구매 요청";
            const cartPage = {
                ...page,
                path: "/news/goods/cart",
                form: {
                    kind: "order",
                    title: "구매 요청",
                    description: "상품과 수량을 확인한 뒤 연락받을 정보를 남겨 주세요. 이 단계에서 결제되거나 상품 재고가 확보되지는 않습니다."
                }
            };
            (0, react.useEffect)((() => {
                let stopped = false;
                generation.current += 1;
                const capturedOwner = owner;
                setCart([]);
                setOrders([]);
                setReceipt(null);
                setFailure("");
                setPending("");
                setLoading(true);
                const work = mode === "goods" ? loadServiceGoods().then((rows => {
                    if (!stopped) setGoods(rows);
                })) : owner && mode === "cart" ? loadServiceCart(owner).then((rows => {
                    if (!stopped && activeOwner.current === capturedOwner) setCart(rows);
                })) : owner ? loadServiceRequests(owner).then((rows => {
                    if (!stopped && activeOwner.current === capturedOwner) setOrders(rows.filter((row => row.kind === "order")));
                })) : Promise.resolve();
                void work.catch((error => {
                    if (!stopped) setFailure(error instanceof Error ? error.message : "목록을 불러오지 못했습니다.");
                })).finally((() => {
                    if (!stopped) setLoading(false);
                }));
                return () => {
                    stopped = true;
                };
            }), [ mode, owner, refresh ]);
            async function quantity(good, next) {
                if (!owner) {
                    setFailure("로그인한 뒤 장바구니에 담아 주세요.");
                    return;
                }
                if (pending) return;
                const capturedOwner = owner;
                setPending(good.id);
                setFailure("");
                const capturedGeneration = generation.current;
                const current = () => activeOwner.current === capturedOwner && generation.current === capturedGeneration;
                try {
                    await setServiceCartQuantity(owner, good.id, next, mode === "goods");
                    if (!current()) return;
                    if (mode === "cart") {
                        const rows = await loadServiceCart(owner);
                        if (current()) setCart(rows);
                    }
                    if (current()) (0, SmallNotificationModal /* showSmallNotification */ .VX)(next ? "장바구니에 저장했습니다." : "장바구니에서 삭제했습니다.");
                } catch (error) {
                    if (current()) setFailure(error instanceof Error ? error.message : "장바구니를 변경하지 못했습니다.");
                } finally {
                    if (current()) setPending("");
                }
            }
            async function cancel(request) {
                if (!owner || pending) return;
                const capturedOwner = owner;
                setPending(request.id);
                setFailure("");
                const capturedGeneration = generation.current;
                const current = () => activeOwner.current === capturedOwner && generation.current === capturedGeneration;
                try {
                    const next = await cancelServiceRequest(owner, request.id);
                    if (current()) {
                        setOrders((rows => rows.map((item => item.id === next.id ? next : item))));
                        (0, SmallNotificationModal /* showSmallNotification */ .VX)("구매 요청을 취소했습니다.");
                    }
                } catch (error) {
                    if (current()) setFailure(error instanceof Error ? error.message : "요청을 취소하지 못했습니다.");
                } finally {
                    if (current()) setPending("");
                }
            }
            const filtered = goods.filter((good => "".concat(good.title, " ").concat(good.description).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())));
            const total = cart.every((line => line.sejong_goods.price != null)) ? cart.reduce(((sum, line) => sum + (line.sejong_goods.price || 0) * line.quantity), 0) : null;
             
            return (0, jsx_runtime.jsxs)("section", {
                className: "service-goods",
                "data-component-id": "service-goods",
                "data-goods-mode": mode,
                "aria-label": heading,
                children: [ 
                
                 (0, jsx_runtime.jsxs)("div", {
                    className: "service-goods-toolbar",
                    children: [ 
                    
                     (0, jsx_runtime.jsx)("h2", {
                        "data-text": "subheading",
                        children: heading
                    }), 
                    
                     (0, jsx_runtime.jsxs)("div", {
                        className: "service-request-actions",
                        children: [ 
                        
                         (0, jsx_runtime.jsx)(SystemPrimitives.SystemLink, {
                            href: "/news/goods",
                            variant: "quiet",
                            shape: "pill",
                            children: "상품 목록"
                        }), 
                        
                         (0, jsx_runtime.jsx)(SystemPrimitives.SystemLink, {
                            href: "/news/goods/cart",
                            variant: "secondary",
                            shape: "pill",
                            children: "장바구니"
                        }), 
                        
                         (0, jsx_runtime.jsx)(SystemPrimitives.SystemLink, {
                            href: "/news/goods/orders",
                            variant: "secondary",
                            shape: "pill",
                            children: "구매 요청 내역"
                        }) ]
                    }) ]
                }), failure &&   (0, jsx_runtime.jsxs /* SystemNotice */)(SystemPrimitives.F0, {
                    error: true,
                    children: [ failure, 
                    
                     (0, jsx_runtime.jsx /* SystemButton */)(SystemPrimitives.kR, {
                        variant: "quiet",
                        onClick: () => setRefresh((value => value + 1)),
                        children: "다시 불러오기"
                    }) ]
                }), mode === "goods" &&   (0, jsx_runtime.jsx /* SystemField */)(SystemPrimitives.RK, {
                    type: "search",
                    label: "상품 검색",
                    value: query,
                    onChange: event => setQuery(event.currentTarget.value)
                }), receipt &&   (0, jsx_runtime.jsxs /* SystemNotice */)(SystemPrimitives.F0, {
                    title: "구매 요청을 저장했습니다",
                    children: [ 
                    
                     (0, jsx_runtime.jsxs)("p", {
                        "data-text": "body",
                        children: [ "접수번호 ", receipt.reference ]
                    }), 
                    
                     (0, jsx_runtime.jsx)("p", {
                        "data-text": "body",
                        children: "결제·배송 전 상태입니다. 구매 요청 내역에서 상품과 수량을 확인하고 취소할 수 있습니다."
                    }), 
                    
                     (0, jsx_runtime.jsx)(SystemPrimitives.SystemLink, {
                        href: "/news/goods/orders",
                        variant: "secondary",
                        shape: "pill",
                        children: "구매 요청 내역 확인"
                    }) ]
                }), loading ?   (0, jsx_runtime.jsx)("p", {
                    "data-text": "body",
                    role: "status",
                    children: "목록을 불러오고 있습니다."
                }) : mode !== "goods" && !owner ?   (0, jsx_runtime.jsx /* SystemNotice */)(SystemPrimitives.F0, {
                    title: "로그인 후 확인할 수 있습니다",
                    children:   (0, jsx_runtime.jsx)(SystemPrimitives.SystemLink, {
                        href: "/account/login",
                        target: "_blank",
                        variant: "secondary",
                        shape: "pill",
                        children: "로그인하기 · 새 창"
                    })
                }) : mode === "goods" ?   (0, jsx_runtime.jsxs)(jsx_runtime.Fragment, {
                    children: [ !filtered.length &&   (0, jsx_runtime.jsx /* SystemNotice */)(SystemPrimitives.F0, {
                        children: "조건에 맞는 상품이 없습니다."
                    }), 
                    
                     (0, jsx_runtime.jsx)("div", {
                        className: "service-goods-grid",
                        children: filtered.map((good =>   (0, jsx_runtime.jsxs /* default */)(SystemSurface.ZP, {
                            padding: "lg",
                            className: "service-goods-card",
                            children: [ good.image &&   (0, jsx_runtime.jsx)("img", {
                                className: "service-goods-image",
                                src: good.image,
                                alt: good.title,
                                width: 480,
                                height: 480,
                                loading: "lazy"
                            }), 
                            
                             (0, jsx_runtime.jsx)("h3", {
                                "data-text": "item-title",
                                children: good.title
                            }), 
                            
                             (0, jsx_runtime.jsx)("p", {
                                "data-text": "body",
                                children: good.description
                            }), 
                            
                             (0, jsx_runtime.jsx)("strong", {
                                "data-text": "item-title",
                                children: money(good.price)
                            }), 
                            
                             (0, jsx_runtime.jsxs)("div", {
                                className: "service-request-actions",
                                children: [ 
                                
                                 (0, jsx_runtime.jsx /* SystemButton */)(SystemPrimitives.kR, {
                                    shape: "pill",
                                    disabled: Boolean(pending),
                                    onClick: () => void quantity(good, 1),
                                    children: pending === good.id ? "저장 중" : "장바구니 담기"
                                }), 
                                
                                 (0, jsx_runtime.jsx)(SystemPrimitives.SystemLink, {
                                    variant: "quiet",
                                    href: good.source_url,
                                    target: "_blank",
                                    children: "상품 원문"
                                }) ]
                            }) ]
                        }, good.id)))
                    }), !owner &&   (0, jsx_runtime.jsx)(SystemPrimitives.SystemLink, {
                        href: "/account/login",
                        target: "_blank",
                        variant: "secondary",
                        shape: "pill",
                        children: "로그인하고 장바구니 사용하기 · 새 창"
                    }) ]
                }) : mode === "cart" ? !cart.length ?   (0, jsx_runtime.jsx /* SystemNotice */)(SystemPrimitives.F0, {
                    title: "장바구니가 비어 있습니다",
                    children:   (0, jsx_runtime.jsx)(SystemPrimitives.SystemLink, {
                        href: "/news/goods",
                        variant: "secondary",
                        shape: "pill",
                        children: "상품 둘러보기"
                    })
                }) :   (0, jsx_runtime.jsxs)(jsx_runtime.Fragment, {
                    children: [ 
                    
                     (0, jsx_runtime.jsx)("div", {
                        className: "service-cart-lines",
                        children: cart.map((line =>   (0, jsx_runtime.jsxs /* default */)(SystemSurface.ZP, {
                            padding: "lg",
                            className: "service-cart-line",
                            children: [ 
                            
                             (0, jsx_runtime.jsxs)("div", {
                                children: [ 
                                
                                 (0, jsx_runtime.jsx)("h3", {
                                    "data-text": "item-title",
                                    children: line.sejong_goods.title
                                }), 
                                
                                 (0, jsx_runtime.jsxs)("p", {
                                    "data-text": "meta",
                                    children: [ "개당 ", money(line.sejong_goods.price) ]
                                }) ]
                            }), 
                            
                             (0, jsx_runtime.jsx /* SystemField */)(SystemPrimitives.RK, {
                                as: "select",
                                label: "".concat(line.sejong_goods.title, " 수량"),
                                value: String(line.quantity),
                                disabled: Boolean(pending),
                                onChange: event => void quantity(line.sejong_goods, Number(event.currentTarget.value)),
                                children: Array.from({
                                    length: 20
                                }, ((_, i) =>   (0, jsx_runtime.jsxs)("option", {
                                    "data-text": "body",
                                    value: i + 1,
                                    children: [ i + 1, "개" ]
                                }, i + 1)))
                            }), 
                            
                             (0, jsx_runtime.jsx /* SystemButton */)(SystemPrimitives.kR, {
                                variant: "quiet",
                                shape: "pill",
                                disabled: Boolean(pending),
                                onClick: () => void quantity(line.sejong_goods, 0),
                                children: "삭제"
                            }) ]
                        }, line.good_id)))
                    }), 
                    
                     (0, jsx_runtime.jsxs)("div", {
                        className: "service-cart-total",
                        children: [ 
                        
                         (0, jsx_runtime.jsx)("span", {
                            "data-text": "label",
                            children: "상품 금액 합계"
                        }), 
                        
                         (0, jsx_runtime.jsx)("strong", {
                            "data-text": "subheading",
                            children: money(total)
                        }) ]
                    }), 
                    
                     (0, jsx_runtime.jsx)("p", {
                        "data-text": "body",
                        children: "배송비·재고·결제 조건은 요청 확인 후 안내됩니다."
                    }), 
                    
                     (0, jsx_runtime.jsx)(ServiceRequestForm, {
                        page: cartPage,
                        onSaved: request => {
                            setReceipt(request);
                            setCart([]);
                        }
                    }) ]
                }) : !orders.length ?   (0, jsx_runtime.jsx /* SystemNotice */)(SystemPrimitives.F0, {
                    children: "저장한 구매 요청이 없습니다."
                }) : orders.map((order =>   (0, jsx_runtime.jsxs /* SystemDisclosure */)(SystemNavigation.f, {
                    summary:   (0, jsx_runtime.jsxs)("span", {
                        "data-text": "label",
                        children: [ order.reference, " · ", order.status === "cancelled" ? "취소" : "구매 요청 · 결제 전" ]
                    }),
                    children: [ 
                    
                     (0, jsx_runtime.jsx)("p", {
                        "data-text": "meta",
                        children: new Date(order.created_at).toLocaleString("ko-KR", {
                            timeZone: "Asia/Seoul"
                        })
                    }), 
                    
                     (0, jsx_runtime.jsx)("ul", {
                        className: "service-order-lines",
                        children: (Array.isArray(order.values.items) ? order.values.items : []).map((item =>   (0, 
                        jsx_runtime.jsxs)("li", {
                            "data-text": "body",
                            children: [ 
                            
                             (0, jsx_runtime.jsxs)("span", {
                                "data-text": "body",
                                children: [ item.title, " × ", item.quantity ]
                            }), 
                            
                             (0, jsx_runtime.jsx)("span", {
                                "data-text": "body",
                                children: money(item.unitPrice == null ? null : item.unitPrice * item.quantity)
                            }) ]
                        }, item.id)))
                    }), 
                    
                     (0, jsx_runtime.jsxs)("p", {
                        "data-text": "item-title",
                        children: [ "상품 금액 ", money(typeof order.values.total === "number" ? order.values.total : null) ]
                    }), order.status === "submitted" &&   (0, jsx_runtime.jsx /* SystemButton */)(SystemPrimitives.kR, {
                        variant: "secondary",
                        shape: "pill",
                        disabled: Boolean(pending),
                        onClick: () => void cancel(order),
                        children: pending === order.id ? "취소 중" : "구매 요청 취소"
                    }) ]
                }, order.id))) ]
            });
        }
        // EXTERNAL MODULE: ./styles/completed-pages.css
                var completed_pages = __webpack_require__(5976);
        // CONCATENATED MODULE: ./components/CompletedPage.tsx
        /* __next_internal_client_entry_do_not_use__ default auto */
        // [공개 경로와 안전한 목적지 / Published routes and safe destinations]
        // 실제 탐색 목록과 DB에 존재하는 내부 경로만 링크로 연결합니다.
        // Only internal destinations present in navigation or the published catalog become links.
        function publishedPaths(catalog) {
            return new Set([ ...data_catalog /* PAGES */ .q5.map((page => page.path)), ...COMPLETION_PATHS, ...catalog.pages.map((page => page.path)), ...data_catalog /* NAV */ .w$.flatMap((group => [ group.path, ...group.items.map((param => {
                let [, path] = param;
                return path;
            })) ])), ...catalog.programs.map((program => "/programs/".concat(program.id))), ...catalog.venues.flatMap((venue => [ "/rental/venues/".concat(venue.id), "/visit/spaces/".concat(venue.id) ])), ...catalog.notices.map((notice => "/news/notices/".concat(notice.id))) ]);
        }
        function destination(href, paths, anchors) {
            if (!href || href !== href.trim() || /[\\\u0000-\u001f\u007f]/.test(href)) return undefined;
            if (href.startsWith("#")) {
                try {
                    return anchors.has(decodeURIComponent(href.slice(1))) ? href : undefined;
                } catch (e) {
                    return undefined;
                }
            }
            if (/^https?:\/\//i.test(href)) {
                try {
                    return new URL(href).href;
                } catch (e) {
                    return undefined;
                }
            }
            if (/^(?:tel:|mailto:)[^\s]+$/i.test(href)) return href;
            const localHref = /^assets\//.test(href) ? "/".concat(href) : href;
            if (!localHref.startsWith("/") || localHref.startsWith("//")) return undefined;
            try {
                const url = new URL(localHref, "https://completion.local");
                const pathname = (url.pathname === "/v5" ? "/" : url.pathname.replace(/^\/v5\//, "/")).replace(/\/$/, "") || "/";
                const suffix = "".concat(url.search).concat(url.hash);
                // 공개 정적 파일은 네이티브 링크로 열어 Next basePath가 중복되지 않게 합니다.
                // Open public files natively to avoid adding the Next base path a second time.
                                if (/^\/assets\/.+\.(?:pdf|hwp|hwpx|docx?|xlsx?|pptx?|zip|7z|dwg|dxf|png|jpe?g|webp|gif|svg)$/i.test(pathname)) return "/v5".concat(pathname).concat(suffix);
                return paths.has(pathname) ? "".concat(pathname).concat(suffix) : undefined;
            } catch (e) {
                return undefined;
            }
        }
        function imageSource(src) {
            if (/^https?:\/\//i.test(src)) return src;
            if (/^\/?(?:v5\/)?assets\//.test(src)) return "/v5/".concat(src.replace(/^\/?(?:v5\/)?/, ""));
            return undefined;
        }
        function ResolvedLink(param) {
            let {href: href, children: children, ...props} = param;
            if (/^(?:https?:\/\/|tel:|mailto:|#|\/v5\/assets\/)/i.test(href))   return (0, jsx_runtime.jsx)("a", {
                "data-text": "action",
                ...props,
                href: href,
                children: children
            });
             
            return (0, jsx_runtime.jsx)(api_link["default"], {
                "data-text": "action",
                ...props,
                href: href,
                children: children
            });
        }
        function ContentLink(param) {
            let {href: href, resolve: resolve, children: children, className: className = "", download: download} = param;
            const target = resolve(href);
            if (!target)   return (0, jsx_runtime.jsx)("span", {
                "data-text": "action",
                className: className,
                children: children
            });
            const external = /^https?:\/\//i.test(target);
             
            return (0, jsx_runtime.jsxs)(ResolvedLink, {
                "data-text": "action",
                className: "completed-text-link ".concat(className).trim(),
                href: target,
                download: download || undefined,
                target: external ? "_blank" : undefined,
                rel: external ? "noopener noreferrer" : undefined,
                children: [ children, external &&   (0, jsx_runtime.jsx)("span", {
                    "data-text": "caption",
                    className: "completed-sr-only",
                    children: " (새 창)"
                }) ]
            });
        }
        // [원본 사진과 설명 / Source images and descriptions]
                function ContentImage(param) {
            let {image: image, hero: hero = false} = param;
            const src = imageSource(image.src);
            if (!src) return null;
             
            return (0, jsx_runtime.jsxs)("figure", {
                className: hero ? "completed-hero-image" : "completed-image",
                children: [ 
                
                 (0, jsx_runtime.jsx)("img", {
                    src: src,
                    alt: image.alt,
                    loading: hero ? "eager" : "lazy",
                    decoding: "async"
                }), image.caption &&   (0, jsx_runtime.jsx)("figcaption", {
                    "data-text": "caption",
                    children: image.caption
                }) ]
            });
        }
        // [목록의 실제 검색과 분류 / Search and categories derived from real list items]
                function CardsSection(param) {
            let {section: section, resolve: resolve} = param;
            const [query, setQuery] = (0, react.useState)("");
            const [category, setCategory] = (0, react.useState)("");
            const categories = Array.from(new Set(section.items.map((item => item.category)).filter(Boolean)));
            const normalizedQuery = query.trim().toLocaleLowerCase();
            const items = section.items.filter((item => (!category || item.category === category) && "".concat(item.title, " ").concat(item.description || "", " ").concat(item.meta || "", " ").concat(item.category || "", " ").concat(item.status || "").toLocaleLowerCase().includes(normalizedQuery)));
            const hasImages = items.some((item => item.image && imageSource(item.image.src)));
             
            return (0, jsx_runtime.jsxs)(jsx_runtime.Fragment, {
                children: [ section.searchable &&   (0, jsx_runtime.jsxs)("div", {
                    className: "completed-list-tools",
                    children: [ 
                    
                     (0, jsx_runtime.jsx /* SystemField */)(SystemPrimitives.RK, {
                        type: "search",
                        label: "".concat(section.title, " 검색"),
                        value: query,
                        onChange: event => setQuery(event.currentTarget.value),
                        placeholder: "제목 또는 내용으로 검색"
                    }), categories.length > 1 &&   (0, jsx_runtime.jsxs)("div", {
                        className: "completed-filters",
                        role: "group",
                        "aria-label": "".concat(section.title, " 분류"),
                        children: [ 
                        
                         (0, jsx_runtime.jsx /* SystemFilterButton */)(SystemPrimitives.BV, {
                            selected: !category,
                            onClick: () => setCategory(""),
                            children: "전체"
                        }), categories.map((item =>   (0, jsx_runtime.jsx /* SystemFilterButton */)(SystemPrimitives.BV, {
                            selected: category === item,
                            onClick: () => setCategory(item),
                            children: item
                        }, item))) ]
                    }), 
                    
                     (0, jsx_runtime.jsxs)("p", {
                        "data-text": "meta",
                        role: "status",
                        "aria-live": "polite",
                        children: [ items.length, "개 항목", (query || category) &&   (0, jsx_runtime.jsx /* SystemButton */)(SystemPrimitives.kR, {
                            variant: "quiet",
                            onClick: () => {
                                setQuery("");
                                setCategory("");
                            },
                            children: "검색 초기화"
                        }) ]
                    }) ]
                }), items.length ?   (0, jsx_runtime.jsx)("ul", {
                    className: "completed-card-list".concat(hasImages ? " completed-card-list-media" : ""),
                    children: items.map((item =>   (0, jsx_runtime.jsx)(CompletionListItem, {
                        item: item,
                        resolve: resolve
                    }, item.id)))
                }) :   (0, jsx_runtime.jsx)("p", {
                    "data-text": "body",
                    className: "completed-empty",
                    role: "status",
                    children: query || category ? "검색 조건에 맞는 항목이 없습니다. 검색어나 분류를 바꿔 주세요." : section.emptyMessage || "현재 공개된 항목이 없습니다."
                }) ]
            });
        }
        function CompletionListItem(param) {
            let {item: item, resolve: resolve} = param;
            const src = item.image && imageSource(item.image.src);
            const href = resolve(item.href);
            const external = Boolean(href && /^https?:\/\//i.test(href));
            const body =   (0, jsx_runtime.jsxs)(jsx_runtime.Fragment, {
                children: [ src &&   (0, jsx_runtime.jsx)("div", {
                    className: "completed-list-image",
                    children:   (0, jsx_runtime.jsx)("img", {
                        src: src,
                        alt: item.image.alt,
                        loading: "lazy",
                        decoding: "async",
                        draggable: false
                    })
                }), 
                
                 (0, jsx_runtime.jsxs)("div", {
                    className: "completed-list-copy",
                    children: [ (item.category || item.date || item.status) &&   (0, jsx_runtime.jsxs)("div", {
                        "data-text": "meta",
                        className: "completed-item-meta",
                        children: [ item.category &&   (0, jsx_runtime.jsx)("span", {
                            "data-text": "meta",
                            children: item.category
                        }), item.date &&   (0, jsx_runtime.jsx)("time", {
                            "data-text": "meta",
                            dateTime: /^\d{4}-\d{2}-\d{2}$/.test(item.date) ? item.date : undefined,
                            children: item.date
                        }), item.status &&   (0, jsx_runtime.jsx)("span", {
                            "data-text": "meta",
                            children: item.status
                        }) ]
                    }), 
                    
                     (0, jsx_runtime.jsxs)("h3", {
                        "data-text": "item-title",
                        children: [ item.title, external &&   (0, jsx_runtime.jsx)("span", {
                            "data-text": "caption",
                            className: "completed-sr-only",
                            children: " (새 창)"
                        }) ]
                    }), item.description &&   (0, jsx_runtime.jsx)("p", {
                        "data-text": "body",
                        children: item.description
                    }), item.meta &&   (0, jsx_runtime.jsx)("p", {
                        "data-text": "meta",
                        className: "completed-item-detail",
                        children: item.meta
                    }) ]
                }) ]
            });
             
            return (0, jsx_runtime.jsx)("li", {
                children: href ?   (0, jsx_runtime.jsx)(ResolvedLink, {
                    className: "completed-list-entry",
                    href: href,
                    target: external ? "_blank" : undefined,
                    rel: external ? "noopener noreferrer" : undefined,
                    draggable: false,
                    onDragStart: event => event.preventDefault(),
                    children: body
                }) :   (0, jsx_runtime.jsx)("div", {
                    "data-text": "body",
                    className: "completed-list-entry",
                    children: body
                })
            });
        }
        // [각 정보 형태를 보존하는 본문 / Content retaining the semantics of every section type]
                function SectionBody(param) {
            let {section: section, resolve: resolve} = param;
            switch (section.type) {
              case "prose":
                 
                return (0, jsx_runtime.jsx)("div", {
                    className: "completed-prose",
                    children: section.paragraphs.map(((paragraph, index) =>   (0, jsx_runtime.jsx)("p", {
                        "data-text": "body",
                        children: paragraph
                    }, index)))
                });

              case "facts":
                 
                return (0, jsx_runtime.jsx)("dl", {
                    className: "completed-facts",
                    children: section.items.map(((item, index) =>   (0, jsx_runtime.jsxs)("div", {
                        children: [ 
                        
                         (0, jsx_runtime.jsx)("dt", {
                            "data-text": "label",
                            children: item.label
                        }), 
                        
                         (0, jsx_runtime.jsx)("dd", {
                            "data-text": "body",
                            children: item.value
                        }) ]
                    }, "".concat(item.label, "-").concat(index))))
                });

              case "table":
                 
                return (0, jsx_runtime.jsxs)(jsx_runtime.Fragment, {
                    children: [ 
                    
                     (0, jsx_runtime.jsx)("div", {
                        className: "completed-table-scroll",
                        tabIndex: 0,
                        role: "region",
                        "aria-label": "".concat(section.title, " 표, 좌우로 스크롤할 수 있습니다"),
                        children:   (0, jsx_runtime.jsxs)("table", {
                            className: "completed-table",
                            children: [ 
                            
                             (0, jsx_runtime.jsx)("caption", {
                                "data-text": "caption",
                                className: "completed-sr-only",
                                children: section.title
                            }), 
                            
                             (0, jsx_runtime.jsx)("thead", {
                                children:   (0, jsx_runtime.jsx)("tr", {
                                    children: section.columns.map(((column, index) =>   (0, jsx_runtime.jsx)("th", {
                                        "data-text": "label",
                                        scope: "col",
                                        children: column
                                    }, index)))
                                })
                            }), 
                            
                             (0, jsx_runtime.jsx)("tbody", {
                                children: section.rows.map(((row, index) =>   (0, jsx_runtime.jsx)("tr", {
                                    children: section.columns.map(((_, column) => column === 0 ?   (0, jsx_runtime.jsx)("th", {
                                        "data-text": "label",
                                        scope: "row",
                                        children: row[column] || "—"
                                    }, column) :   (0, jsx_runtime.jsx)("td", {
                                        "data-text": "body",
                                        children: row[column] || "—"
                                    }, column)))
                                }, index)))
                            }) ]
                        })
                    }), section.note &&   (0, jsx_runtime.jsx)("p", {
                        "data-text": "caption",
                        className: "completed-note",
                        children: section.note
                    }) ]
                });

              case "timeline":
                 
                return (0, jsx_runtime.jsx)("ol", {
                    className: "completed-timeline",
                    children: section.items.map(((item, index) =>   (0, jsx_runtime.jsxs)("li", {
                        children: [ 
                        
                         (0, jsx_runtime.jsx)("p", {
                            "data-text": "label",
                            className: "completed-timeline-date",
                            children: item.date
                        }), 
                        
                         (0, jsx_runtime.jsxs)("div", {
                            children: [ 
                            
                             (0, jsx_runtime.jsx)("h3", {
                                "data-text": "item-title",
                                children: item.title
                            }), 
                            
                             (0, jsx_runtime.jsx)("p", {
                                "data-text": "body",
                                children: item.body
                            }) ]
                        }) ]
                    }, "".concat(item.date, "-").concat(index))))
                });

              case "faq":
                 
                return (0, jsx_runtime.jsx)("div", {
                    className: "completed-faq",
                    children: section.items.map(((item, index) =>   (0, jsx_runtime.jsx /* SystemDisclosure */)(SystemNavigation.f, {
                        appearance: "plain",
                        summary: item.question,
                        children:   (0, jsx_runtime.jsx)("p", {
                            "data-text": "body",
                            children: item.answer
                        })
                    }, "".concat(item.question, "-").concat(index))))
                });

              case "links":
              case "downloads":
                 
                return (0, jsx_runtime.jsx)("ul", {
                    className: "completed-resource-list",
                    children: section.items.map(((item, index) =>   (0, jsx_runtime.jsxs)("li", {
                        children: [ 
                        
                         (0, jsx_runtime.jsxs)("div", {
                            children: [ 
                            
                             (0, jsx_runtime.jsx)(ContentLink, {
                                href: item.href,
                                resolve: resolve,
                                download: section.type === "downloads",
                                children: item.label
                            }), item.description &&   (0, jsx_runtime.jsx)("p", {
                                "data-text": "body",
                                children: item.description
                            }) ]
                        }), section.type === "downloads" && resolve(item.href) &&   (0, jsx_runtime.jsx)("span", {
                            "data-text": "meta",
                            className: "completed-resource-kind",
                            children: "자료"
                        }) ]
                    }, "".concat(item.href, "-").concat(index))))
                });

              case "cards":
                 
                return (0, jsx_runtime.jsx)(CardsSection, {
                    section: section,
                    resolve: resolve
                });

              case "image":
                 
                return (0, jsx_runtime.jsx)(ContentImage, {
                    image: section.image
                });
            }
        }
        // [공개된 시설을 직접 선택하는 비교 / Comparing selected venues from the published inventory]
                function VenueComparison(param) {
            let {catalog: catalog} = param;
            const [selected, setSelected] = (0, react.useState)([]);
            const venues = catalog.venues.filter((venue => selected.includes(venue.id)));
            const capacity = value => "".concat(value).concat(typeof value === "number" || /^[\d,]+$/.test(String(value)) ? "석" : "");
             
            return (0, jsx_runtime.jsxs)("section", {
                className: "completed-section",
                id: "completed-venue-compare",
                "aria-labelledby": "completed-venue-compare-title",
                children: [ 
                
                 (0, jsx_runtime.jsx)("h2", {
                    "data-text": "heading",
                    id: "completed-venue-compare-title",
                    children: "시설 비교"
                }), 
                
                 (0, jsx_runtime.jsx)("p", {
                    "data-text": "body",
                    children: "비교할 시설을 최대 3곳 선택하세요. 공개된 시설 정보를 나란히 확인할 수 있습니다."
                }), 
                
                 (0, jsx_runtime.jsxs /* default */)(SystemSurface.ZP, {
                    variant: "inset",
                    padding: "lg",
                    className: "completed-venue-picker",
                    children: [ 
                    
                     (0, jsx_runtime.jsxs)("fieldset", {
                        className: "completed-venue-options",
                        children: [ 
                        
                         (0, jsx_runtime.jsx)("legend", {
                            "data-text": "label",
                            children: "비교할 시설 선택"
                        }), catalog.venues.map((venue =>   (0, jsx_runtime.jsx /* SystemCheckbox */)(SystemPrimitives.U1, {
                            checked: selected.includes(venue.id),
                            disabled: selected.length >= 3 && !selected.includes(venue.id),
                            onChange: event => {
                                const checked = event.currentTarget.checked;
                                setSelected((current => checked ? current.length < 3 && !current.includes(venue.id) ? [ ...current, venue.id ] : current : current.filter((id => id !== venue.id))));
                            },
                            label:   (0, jsx_runtime.jsxs)(jsx_runtime.Fragment, {
                                children: [ 
                                
                                 (0, jsx_runtime.jsx)("strong", {
                                    "data-text": "label",
                                    children: venue.name
                                }), 
                                
                                 (0, jsx_runtime.jsx)("span", {
                                    "data-text": "meta",
                                    children: capacity(venue.capacity)
                                }) ]
                            })
                        }, venue.id))) ]
                    }), 
                    
                     (0, jsx_runtime.jsxs)("div", {
                        className: "completed-compare-controls",
                        children: [ 
                        
                         (0, jsx_runtime.jsxs)("p", {
                            "data-text": "meta",
                            role: "status",
                            "aria-live": "polite",
                            children: [ venues.length, " / 3곳 선택", venues.length >= 3 ? " · 3곳을 모두 선택했습니다." : "" ]
                        }), 
                        
                         (0, jsx_runtime.jsx /* SystemButton */)(SystemPrimitives.kR, {
                            variant: "secondary",
                            disabled: !selected.length,
                            onClick: () => setSelected([]),
                            children: "선택 초기화"
                        }) ]
                    }) ]
                }), venues.length ?   (0, jsx_runtime.jsx)("div", {
                    className: "completed-table-scroll",
                    role: "region",
                    "aria-label": "선택한 시설 비교 표, 좌우로 스크롤할 수 있습니다",
                    tabIndex: 0,
                    children:   (0, jsx_runtime.jsxs)("table", {
                        className: "completed-table completed-compare-table",
                        children: [ 
                        
                         (0, jsx_runtime.jsx)("caption", {
                            "data-text": "caption",
                            className: "completed-sr-only",
                            children: "선택한 시설의 수용 규모, 위치와 특징"
                        }), 
                        
                         (0, jsx_runtime.jsx)("thead", {
                            children:   (0, jsx_runtime.jsxs)("tr", {
                                children: [ 
                                
                                 (0, jsx_runtime.jsx)("th", {
                                    scope: "col",
                                    "data-text": "label",
                                    children: "비교 항목"
                                }), venues.map((venue =>   (0, jsx_runtime.jsx)("th", {
                                    scope: "col",
                                    "data-text": "item-title",
                                    children: venue.name
                                }, venue.id))) ]
                            })
                        }), 
                        
                         (0, jsx_runtime.jsxs)("tbody", {
                            children: [ 
                            
                             (0, jsx_runtime.jsxs)("tr", {
                                children: [ 
                                
                                 (0, jsx_runtime.jsx)("th", {
                                    scope: "row",
                                    "data-text": "label",
                                    children: "수용 규모"
                                }), venues.map((venue =>   (0, jsx_runtime.jsx)("td", {
                                    "data-text": "body",
                                    children: capacity(venue.capacity)
                                }, venue.id))) ]
                            }), 
                            
                             (0, jsx_runtime.jsxs)("tr", {
                                children: [ 
                                
                                 (0, jsx_runtime.jsx)("th", {
                                    scope: "row",
                                    "data-text": "label",
                                    children: "위치"
                                }), venues.map((venue =>   (0, jsx_runtime.jsx)("td", {
                                    "data-text": "body",
                                    children: venue.location || "게시된 위치 정보 없음"
                                }, venue.id))) ]
                            }), 
                            
                             (0, jsx_runtime.jsxs)("tr", {
                                children: [ 
                                
                                 (0, jsx_runtime.jsx)("th", {
                                    scope: "row",
                                    "data-text": "label",
                                    children: "공간 소개"
                                }), venues.map((venue =>   (0, jsx_runtime.jsx)("td", {
                                    "data-text": "body",
                                    children: venue.description
                                }, venue.id))) ]
                            }), 
                            
                             (0, jsx_runtime.jsxs)("tr", {
                                children: [ 
                                
                                 (0, jsx_runtime.jsx)("th", {
                                    scope: "row",
                                    "data-text": "label",
                                    children: "시설 특징"
                                }), venues.map((venue => {
                                    var _venue_features;
                                     
                                    return (0, jsx_runtime.jsx)("td", {
                                        "data-text": "body",
                                        children: ((_venue_features = venue.features) === null || _venue_features === void 0 ? void 0 : _venue_features.length) ?   (0, 
                                        jsx_runtime.jsx)("ul", {
                                            className: "completed-feature-list",
                                            children: venue.features.map((feature =>   (0, jsx_runtime.jsx)("li", {
                                                "data-text": "body",
                                                children: feature
                                            }, feature)))
                                        }) : "등록된 시설 특징 없음"
                                    }, venue.id);
                                })) ]
                            }), 
                            
                             (0, jsx_runtime.jsxs)("tr", {
                                children: [ 
                                
                                 (0, jsx_runtime.jsx)("th", {
                                    scope: "row",
                                    "data-text": "label",
                                    children: "상세·신청"
                                }), venues.map((venue =>   (0, jsx_runtime.jsx)("td", {
                                    children:   (0, jsx_runtime.jsxs)("div", {
                                        className: "completed-compare-actions",
                                        children: [ 
                                        
                                         (0, jsx_runtime.jsx)(SystemPrimitives.SystemLink, {
                                            variant: "secondary",
                                            href: "/rental/venues/".concat(venue.id),
                                            children: "시설 상세"
                                        }), 
                                        
                                         (0, jsx_runtime.jsx)(SystemPrimitives.SystemLink, {
                                            href: "/rental/apply?venue=".concat(encodeURIComponent(venue.id)),
                                            children: "이 시설로 신청"
                                        }) ]
                                    })
                                }, venue.id))) ]
                            }) ]
                        }) ]
                    })
                }) :   (0, jsx_runtime.jsx)("p", {
                    "data-text": "body",
                    className: "completed-empty",
                    children: catalog.venues.length ? "시설을 선택하면 비교표가 표시됩니다." : "현재 공개된 대관시설 정보가 없습니다."
                }) ]
            });
        }
        // [대관 공고 게시 월별 목록 / Rental notices grouped by their actual publication month]
                function RentalCalendar(param) {
            let {catalog: catalog, resolve: resolve} = param;
            const [month, setMonth] = (0, react.useState)("");
            const notices = catalog.notices.filter((notice => /대관/.test("".concat(notice.title, " ").concat(notice.category, " ").concat(notice.content || notice.body || "")))).sort(((a, b) => b.date.localeCompare(a.date)));
            const publicationMonth = date => /^\d{4}-\d{2}-\d{2}$/.test(date) ? date.slice(0, 7) : "unknown";
            const months = Array.from(new Set(notices.map((notice => publicationMonth(notice.date)))));
            const monthLabel = value => value === "unknown" ? "게시일 미등록" : "".concat(value.slice(0, 4), "년 ").concat(Number(value.slice(5)), "월");
             
            return (0, jsx_runtime.jsxs)("section", {
                className: "completed-section",
                id: "completed-rental-calendar",
                "aria-labelledby": "completed-rental-calendar-title",
                children: [ 
                
                 (0, jsx_runtime.jsx)("h2", {
                    "data-text": "heading",
                    id: "completed-rental-calendar-title",
                    children: "대관 공고 일정"
                }), 
                
                 (0, jsx_runtime.jsx)("p", {
                    "data-text": "body",
                    children: "카탈로그에 공개된 대관 공고를 게시 월별로 모았습니다. 아래 날짜는 공고 게시일이며, 시설 사용 가능일과 접수 기간은 각 공고에서 확인하세요."
                }), months.length > 0 &&   (0, jsx_runtime.jsxs /* SystemField */)(SystemPrimitives.RK, {
                    as: "select",
                    label: "공고 게시 월",
                    value: month,
                    onChange: event => setMonth(event.currentTarget.value),
                    children: [ 
                    
                     (0, jsx_runtime.jsx)("option", {
                        "data-text": "body",
                        value: "",
                        children: "전체 게시 월"
                    }), months.map((value =>   (0, jsx_runtime.jsx)("option", {
                        "data-text": "body",
                        value: value,
                        children: monthLabel(value)
                    }, value))) ]
                }), notices.length ? months.filter((value => !month || value === month)).map((value =>   (0, 
                jsx_runtime.jsxs)("div", {
                    className: "completed-notice-month",
                    children: [ 
                    
                     (0, jsx_runtime.jsx)("h3", {
                        "data-text": "subheading",
                        children: monthLabel(value)
                    }), 
                    
                     (0, jsx_runtime.jsx)("ul", {
                        className: "completed-notice-list",
                        children: notices.filter((notice => publicationMonth(notice.date) === value)).map((notice =>   (0, 
                        jsx_runtime.jsxs)("li", {
                            children: [ 
                            
                             (0, jsx_runtime.jsxs)("p", {
                                "data-text": "meta",
                                children: [ "공고 게시일 ", value === "unknown" ? "미등록" :   (0, jsx_runtime.jsx)("time", {
                                    "data-text": "meta",
                                    dateTime: notice.date,
                                    children: notice.date.replaceAll("-", ".")
                                }) ]
                            }), 
                            
                             (0, jsx_runtime.jsx)(ContentLink, {
                                href: "/news/notices/".concat(notice.id),
                                resolve: resolve,
                                children: notice.title
                            }), (notice.content || notice.body) &&   (0, jsx_runtime.jsx)("p", {
                                "data-text": "body",
                                children: notice.content || notice.body
                            }) ]
                        }, notice.id)))
                    }) ]
                }, value))) :   (0, jsx_runtime.jsx)("p", {
                    "data-text": "body",
                    className: "completed-empty",
                    children: "현재 카탈로그에 공개된 대관 공고가 없습니다. 대관 안내의 공식 공고 경로에서 최신 접수를 확인하세요."
                }) ]
            });
        }
        // [등록된 페이지 전체의 계층 / The complete hierarchy of registered pages]
                function siteTree(catalog) {
            const pages = new Map(data_catalog /* PAGES */ .q5.map((page => [ page.path, {
                path: page.path,
                title: page.title
            } ])));
            catalog.pages.forEach((page => pages.set(page.path, {
                path: page.path,
                title: page.title
            })));
            const nodes = new Map;
            const roots = [];
            const ensure = path => {
                var _NAV_find;
                const existing = nodes.get(path);
                if (existing) return existing;
                const page = pages.get(path);
                const groupTitle = path === "/policy" ? "정책 및 안내" : (_NAV_find = data_catalog /* NAV */ .w$.find((group => group.path === path))) === null || _NAV_find === void 0 ? void 0 : _NAV_find.title;
                const node = {
                    path: path,
                    title: (page === null || page === void 0 ? void 0 : page.title) || groupTitle || path.split("/").filter(Boolean).at(-1) || "홈",
                    href: page ? path : undefined,
                    children: []
                };
                nodes.set(path, node);
                const parentPath = path.substring(0, path.lastIndexOf("/"));
                if (parentPath && parentPath !== path) ensure(parentPath).children.push(node); else roots.push(node);
                return node;
            };
            pages.forEach((page => ensure(page.path)));
            return roots;
        }
        function filterSiteTree(nodes, query) {
            return nodes.flatMap((node => {
                if (!query || "".concat(node.title, " ").concat(node.path).toLocaleLowerCase().includes(query)) return [ node ];
                const children = filterSiteTree(node.children, query);
                return children.length ? [ {
                    ...node,
                    children: children
                } ] : [];
            }));
        }
        function SiteBranch(param) {
            let {node: node, resolve: resolve} = param;
             
            return (0, jsx_runtime.jsxs)("li", {
                children: [ node.href ?   (0, jsx_runtime.jsx)(ContentLink, {
                    href: node.href,
                    resolve: resolve,
                    children: node.title
                }) :   (0, jsx_runtime.jsx)("span", {
                    "data-text": "label",
                    children: node.title
                }), node.children.length > 0 &&   (0, jsx_runtime.jsx)("ul", {
                    children: node.children.map((child =>   (0, jsx_runtime.jsx)(SiteBranch, {
                        node: child,
                        resolve: resolve
                    }, child.path)))
                }) ]
            });
        }
        function SiteMap(param) {
            let {catalog: catalog, resolve: resolve} = param;
            const [query, setQuery] = (0, react.useState)("");
            const tree = (0, react.useMemo)((() => siteTree(catalog)), [ catalog ]);
            const results = filterSiteTree(tree, query.trim().toLocaleLowerCase());
             
            return (0, jsx_runtime.jsxs)("section", {
                className: "completed-section",
                id: "completed-sitemap",
                "aria-labelledby": "completed-sitemap-title",
                children: [ 
                
                 (0, jsx_runtime.jsx)("h2", {
                    "data-text": "heading",
                    id: "completed-sitemap-title",
                    children: "전체 메뉴"
                }), 
                
                 (0, jsx_runtime.jsx /* SystemField */)(SystemPrimitives.RK, {
                    type: "search",
                    label: "메뉴 찾기",
                    value: query,
                    onChange: event => setQuery(event.currentTarget.value),
                    placeholder: "메뉴 이름으로 검색"
                }), results.length ?   (0, jsx_runtime.jsx)("nav", {
                    "aria-label": "전체 사이트 메뉴",
                    children:   (0, jsx_runtime.jsx)("ul", {
                        className: "completed-sitemap-tree",
                        children: results.map((node =>   (0, jsx_runtime.jsx)(SiteBranch, {
                            node: node,
                            resolve: resolve
                        }, node.path)))
                    })
                }) :   (0, jsx_runtime.jsx)("p", {
                    "data-text": "body",
                    className: "completed-empty",
                    role: "status",
                    children: "검색어와 일치하는 메뉴가 없습니다."
                }) ]
            });
        }
        // [실제 프로그램과 연결된 목록 / Related programs from the published catalog]
                function RelatedPrograms(param) {
            let {page: page, catalog: catalog} = param;
            var _filter_query;
            const filter = page.relatedPrograms;
            if (!filter) return null;
            const query = (_filter_query = filter.query) === null || _filter_query === void 0 ? void 0 : _filter_query.trim().toLocaleLowerCase();
            const programs = catalog.programs.filter((program => {
                var _program_tags;
                return (!filter.category || program.category === filter.category) && (!filter.tag || ((_program_tags = program.tags) === null || _program_tags === void 0 ? void 0 : _program_tags.includes(filter.tag))) && (!query || "".concat(program.title, " ").concat(program.description || "", " ").concat(program.genre || "", " ").concat((program.tags || []).join(" ")).toLocaleLowerCase().includes(query));
            }));
             
            return (0, jsx_runtime.jsxs)("section", {
                className: "completed-section",
                id: "completed-related-programs",
                "aria-labelledby": "completed-related-programs-title",
                children: [ 
                
                 (0, jsx_runtime.jsx)("h2", {
                    "data-text": "heading",
                    id: "completed-related-programs-title",
                    children: filter.title
                }), 
                
                 (0, jsx_runtime.jsxs)("p", {
                    "data-text": "meta",
                    children: [ "공개된 프로그램 ", programs.length, "개" ]
                }), programs.length ?   (0, jsx_runtime.jsx)("div", {
                    className: "completed-program-grid",
                    children: programs.map((program =>   (0, jsx_runtime.jsx /* default */)(ProgramCard.Z, {
                        program: program
                    }, program.id)))
                }) :   (0, jsx_runtime.jsx)("p", {
                    "data-text": "body",
                    className: "completed-empty",
                    children: "현재 이 주제에 연결된 공개 프로그램이 없습니다. 프로그램 전체 목록에서 다른 공연·전시·교육을 살펴보세요."
                }), 
                
                 (0, jsx_runtime.jsx)(SystemPrimitives.SystemLink, {
                    variant: "secondary",
                    href: "/programs",
                    children: "프로그램 전체 보기"
                }) ]
            });
        }
        // [새 완성 페이지의 독립 진입점 / Independent entry point for the newly completed pages]
                function CompletedPage(param) {
            let {path: path} = param;
            var _PAGES_find;
            const {catalog: catalog, error: error, loading: loading, refresh: refresh} = (0, 
            CatalogProvider /* useCatalog */ .r)();
            const record = catalog.pages.find((item => item.path === path));
            const page = record === null || record === void 0 ? void 0 : record.completion;
            const group = data_catalog /* NAV */ .w$.find((item => path === item.path || path.startsWith("".concat(item.path, "/"))));
            const parent = [ ...data_catalog /* PAGES */ .q5 ].filter((item => item.path !== path && item.path !== "/" && path.startsWith("".concat(item.path, "/")))).sort(((a, b) => b.path.length - a.path.length))[0];
            const paths = (0, react.useMemo)((() => publishedPaths(catalog)), [ catalog ]);
            const title = (page === null || page === void 0 ? void 0 : page.title) || (record === null || record === void 0 ? void 0 : record.title) || ((_PAGES_find = data_catalog /* PAGES */ .q5.find((item => item.path === path))) === null || _PAGES_find === void 0 ? void 0 : _PAGES_find.title) || "페이지 안내";
            const isEnglish = path === "/english";
            const goodsMode = (page === null || page === void 0 ? void 0 : page.special) === "goods" || (page === null || page === void 0 ? void 0 : page.special) === "cart" || (page === null || page === void 0 ? void 0 : page.special) === "orders" ? page.special : undefined;
            const sectionLinks = (page === null || page === void 0 ? void 0 : page.sections.map(((section, index) => ({
                id: "completed-section-".concat(index),
                title: section.title
            })))) || [];
            if ((page === null || page === void 0 ? void 0 : page.special) === "venue-compare") sectionLinks.push({
                id: "completed-venue-compare",
                title: "시설 비교"
            });
            if ((page === null || page === void 0 ? void 0 : page.special) === "rental-calendar") sectionLinks.push({
                id: "completed-rental-calendar",
                title: "대관 공고 일정"
            });
            if ((page === null || page === void 0 ? void 0 : page.special) === "sitemap") sectionLinks.push({
                id: "completed-sitemap",
                title: "전체 메뉴"
            });
            if (goodsMode) sectionLinks.push({
                id: "completed-goods-service",
                title: goodsMode === "goods" ? "굿즈 목록" : goodsMode === "cart" ? "장바구니" : "구매 요청 내역"
            });
            if (page === null || page === void 0 ? void 0 : page.relatedPrograms) sectionLinks.push({
                id: "completed-related-programs",
                title: page.relatedPrograms.title
            });
            if ((page === null || page === void 0 ? void 0 : page.form) && page.special !== "cart") sectionLinks.push({
                id: "completed-request",
                title: page.form.title
            });
            const anchors = new Set(sectionLinks.map((section => section.id)));
            const resolve = href => destination(href, paths, anchors);
             
            return (0, jsx_runtime.jsxs)("div", {
                className: "container completed-page",
                "data-component-id": "completed-page",
                lang: isEnglish ? "en" : undefined,
                children: [ 
                
                 (0, jsx_runtime.jsxs)("nav", {
                    className: "completed-breadcrumbs",
                    "aria-label": "현재 위치",
                    children: [ 
                    
                     (0, jsx_runtime.jsx)(api_link["default"], {
                        "data-text": "action",
                        href: "/",
                        children: "홈"
                    }), group && group.path !== path &&   (0, jsx_runtime.jsxs)(jsx_runtime.Fragment, {
                        children: [ 
                        
                         (0, jsx_runtime.jsx)("span", {
                            "aria-hidden": "true",
                            children: "/"
                        }), 
                        
                         (0, jsx_runtime.jsx)(api_link["default"], {
                            "data-text": "action",
                            href: group.path,
                            children: group.title
                        }) ]
                    }), parent && parent.path !== (group === null || group === void 0 ? void 0 : group.path) &&   (0, 
                    jsx_runtime.jsxs)(jsx_runtime.Fragment, {
                        children: [ 
                        
                         (0, jsx_runtime.jsx)("span", {
                            "aria-hidden": "true",
                            children: "/"
                        }), 
                        
                         (0, jsx_runtime.jsx)(api_link["default"], {
                            "data-text": "action",
                            href: parent.path,
                            children: parent.title
                        }) ]
                    }), 
                    
                     (0, jsx_runtime.jsx)("span", {
                        "aria-hidden": "true",
                        children: "/"
                    }), 
                    
                     (0, jsx_runtime.jsx)("span", {
                        "data-text": "label",
                        "aria-current": "page",
                        children: title
                    }) ]
                }), 
                
                 (0, jsx_runtime.jsxs)("header", {
                    className: "completed-heading",
                    children: [ 
                    
                     (0, jsx_runtime.jsx /* SystemText */)(SystemText.J, {
                        as: "h1",
                        variant: "title",
                        children: title
                    }), (page === null || page === void 0 ? void 0 : page.summary) &&   (0, jsx_runtime.jsx /* SystemText */)(SystemText.J, {
                        as: "p",
                        variant: "lead",
                        children: page.summary
                    }) ]
                }), group &&   (0, jsx_runtime.jsx /* SystemControlGroup */)(SystemControlGroup.L, {
                    as: "nav",
                    className: "completed-group-navigation",
                    "aria-label": "".concat(group.title, " 메뉴"),
                    columns: {
                        compact: 2,
                        medium: 3,
                        wide: 6
                    },
                    children: group.items.map((param => {
                        let [label, href] = param;
                         
                        return (0, jsx_runtime.jsx)(SystemPrimitives.SystemLink, {
                            variant: path === href || path.startsWith("".concat(href, "/")) ? "primary" : "secondary",
                            href: href,
                            "aria-current": path === href ? "page" : undefined,
                            children: label
                        }, href);
                    }))
                }), page ?   (0, jsx_runtime.jsxs)(jsx_runtime.Fragment, {
                    children: [ page.image &&   (0, jsx_runtime.jsx)(ContentImage, {
                        image: page.image,
                        hero: true
                    }), 
                    
                     (0, jsx_runtime.jsxs)("div", {
                        className: "completed-body-layout",
                        children: [ sectionLinks.length > 1 &&   (0, jsx_runtime.jsx)("aside", {
                            className: "completed-outline",
                            children:   (0, jsx_runtime.jsxs)("nav", {
                                "aria-label": isEnglish ? "On this page" : "이 페이지에서",
                                children: [ 
                                
                                 (0, jsx_runtime.jsx /* SystemText */)(SystemText.J, {
                                    as: "p",
                                    variant: "label",
                                    children: isEnglish ? "On this page" : "이 페이지에서"
                                }), 
                                
                                 (0, jsx_runtime.jsx)("ol", {
                                    children: sectionLinks.map((section =>   (0, jsx_runtime.jsx)("li", {
                                        children:   (0, jsx_runtime.jsx)("a", {
                                            "data-text": "action",
                                            href: "#".concat(section.id),
                                            children: section.title
                                        })
                                    }, section.id)))
                                }) ]
                            })
                        }), 
                        
                         (0, jsx_runtime.jsxs)("div", {
                            className: "completed-main",
                            children: [ page.sections.map(((section, index) =>   (0, jsx_runtime.jsxs)("section", {
                                className: "completed-section completed-section-".concat(section.type),
                                id: "completed-section-".concat(index),
                                "aria-labelledby": "completed-section-title-".concat(index),
                                children: [ 
                                
                                 (0, jsx_runtime.jsx)("h2", {
                                    "data-text": "heading",
                                    id: "completed-section-title-".concat(index),
                                    children: section.title
                                }), 
                                
                                 (0, jsx_runtime.jsx)(SectionBody, {
                                    section: section,
                                    resolve: resolve
                                }) ]
                            }, index))), page.special === "venue-compare" &&   (0, jsx_runtime.jsx)(VenueComparison, {
                                catalog: catalog
                            }), page.special === "rental-calendar" &&   (0, jsx_runtime.jsx)(RentalCalendar, {
                                catalog: catalog,
                                resolve: resolve
                            }), page.special === "sitemap" &&   (0, jsx_runtime.jsx)(SiteMap, {
                                catalog: catalog,
                                resolve: resolve
                            }), goodsMode &&   (0, jsx_runtime.jsx)("div", {
                                className: "completed-service",
                                id: "completed-goods-service",
                                children:   (0, jsx_runtime.jsx)(ServiceGoods, {
                                    mode: goodsMode,
                                    page: page
                                })
                            }), 
                            
                             (0, jsx_runtime.jsx)(RelatedPrograms, {
                                page: page,
                                catalog: catalog
                            }), page.form && goodsMode !== "cart" &&   (0, jsx_runtime.jsx)("section", {
                                className: "completed-section",
                                id: "completed-request",
                                "aria-label": page.form.title,
                                children:   (0, jsx_runtime.jsx)(ServiceRequestForm, {
                                    page: page
                                })
                            }), page.sources.length > 0 &&   (0, jsx_runtime.jsxs)("footer", {
                                className: "completed-sources",
                                children: [ 
                                
                                 (0, jsx_runtime.jsx)("h2", {
                                    "data-text": "item-title",
                                    children: isEnglish ? "Sources and official information" : "자료 출처와 최신 안내"
                                }), 
                                
                                 (0, jsx_runtime.jsx)("ul", {
                                    children: page.sources.map(((source, index) =>   (0, jsx_runtime.jsx)("li", {
                                        children:   (0, jsx_runtime.jsx)(ContentLink, {
                                            href: source.url,
                                            resolve: resolve,
                                            children: source.label
                                        })
                                    }, "".concat(source.url, "-").concat(index))))
                                }) ]
                            }) ]
                        }, path) ]
                    }) ]
                }) :   (0, jsx_runtime.jsxs /* default */)(SystemSurface.ZP, {
                    variant: "inset",
                    padding: "lg",
                    className: "completed-load-state",
                    children: [ 
                    
                     (0, jsx_runtime.jsx)("p", {
                        "data-text": "body",
                        role: "status",
                        children: loading ? "페이지 내용을 불러오는 중입니다." : error || "현재 페이지 내용을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."
                    }), 
                    
                     (0, jsx_runtime.jsx /* SystemButton */)(SystemPrimitives.kR, {
                        variant: "secondary",
                        disabled: loading,
                        onClick: () => {
                            void refresh();
                        },
                        children: "다시 불러오기"
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
    /***/ 8127: 
    /***/ function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        "use strict";
        /* harmony export */        __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ L: function() {
                /* binding */ return SystemControlGroup;
            }
            /* harmony export */        });
        /* harmony import */        var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(2265);
        // [프래그먼트와 배열을 같은 항목으로 해석 / Treat fragments and arrays as the same item sequence]
        // 각 경로의 key를 보존해 이름 있는 조작의 순서가 바뀌어도 상태를 유지합니다.
        // Preserve keyed ancestry so reordering named controls does not replace their state.
                function controlItems(children) {
            let parentKeys = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : [];
            return react__WEBPACK_IMPORTED_MODULE_0__.Children.toArray(children).flatMap(((child, index) => {
                const keys = [ ...parentKeys
                 , (0, react__WEBPACK_IMPORTED_MODULE_0__.isValidElement)(child) && child.key !== null ? String(child.key) : String(index) ];
                if (  (0, react__WEBPACK_IMPORTED_MODULE_0__.isValidElement)(child) && child.type === react__WEBPACK_IMPORTED_MODULE_0__.Fragment) {
                    return controlItems(child.props.children, keys);
                }
                return [ {
                    child: child,
                    key: JSON.stringify(keys)
                } ];
            }));
        }
        // [내용 수와 화면 너비에 맞는 열 / Columns limited by content and viewport]
        // 간격을 뺀 너비를 균등 분배하며 마지막 줄도 남는 폭을 채웁니다.
        // Share the width after gaps; let the last row fill its remaining space.
                function SystemControlGroup(param) {
            let {as: as, columns: columns, maxColumns: maxColumns = 6, children: children, className: className = "", style: style, ...props} = param;
            const items = controlItems(children);
            const columnLimit = Math.max(1, Math.min(items.length, maxColumns));
            const limit = value => Math.min(value, columnLimit);
            var _columns_compact, _columns_medium, _columns_wide;
            const groupStyle = {
                ...style,
                "--control-group-columns-compact": limit((_columns_compact = columns === null || columns === void 0 ? void 0 : columns.compact) !== null && _columns_compact !== void 0 ? _columns_compact : 2),
                "--control-group-columns-medium": limit((_columns_medium = columns === null || columns === void 0 ? void 0 : columns.medium) !== null && _columns_medium !== void 0 ? _columns_medium : 3),
                "--control-group-columns-wide": limit((_columns_wide = columns === null || columns === void 0 ? void 0 : columns.wide) !== null && _columns_wide !== void 0 ? _columns_wide : 6)
            };
            const tag = as || "div";
            const itemTag = tag === "ul" || tag === "ol" ? "li" : "div";
             
            return (0, react__WEBPACK_IMPORTED_MODULE_0__.createElement)(tag, {
                ...props,
                className: "system-control-group ".concat(className).trim(),
                style: groupStyle,
                "data-component": "control-group",
                "data-component-id": "control-group",
                "data-control-count": items.length
            }, items.map((param => {
                let {child: child, key: key} = param;
                 
                return (0, react__WEBPACK_IMPORTED_MODULE_0__.createElement)(itemTag, {
                    key: key,
                    className: "system-control-group-item"
                }, child);
            })));
        }
        /* unused harmony default export */        var __WEBPACK_DEFAULT_EXPORT__ = /* unused pure expression or super */ null && SystemControlGroup;
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
    /***/ 9366: 
    /***/ function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        "use strict";
        /* harmony export */        __webpack_require__.d(__webpack_exports__, {
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
        /***/    },
    /***/ 5976: 
    /***/ function() {
        // extracted by mini-css-extract-plugin
        /***/},
    /***/ 5063: 
    /***/ function() {
        // extracted by mini-css-extract-plugin
        /***/}
} ]);
//# sourceMappingURL=CatalogPage_1.js.map