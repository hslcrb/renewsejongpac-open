"use strict";

(self["webpackChunk_N_E"] = self["webpackChunk_N_E"] || []).push([ [ 564 ], {
    /***/ 6342: 
    /***/ function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ Z: function() {
                /* binding */ return AccountMiniRoom;
            }
            /* harmony export */        });
        /* harmony import */        var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7437);
        /* harmony import */        var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(2265);
        /* harmony import */        var _src_lib_media__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(2110);
        /* harmony import */        var _SystemPrimitives__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(6983);
        /* harmony import */        var _Icon__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(9140);
        /* __next_internal_client_entry_do_not_use__ default auto */
        // [직접 구성한 미니어처와 실제 관심 공연 / An authored miniature with live favourite posters]
                function MiniRoomArtwork(param) {
            let {instanceId: instanceId, programs: programs, lightOn: lightOn} = param;
            const paint = name => "url(#mini-room-".concat(name, "-").concat(instanceId, ")");
            const id = name => "mini-room-".concat(name, "-").concat(instanceId);
             
            return (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("svg", {
                className: "mini-room-art",
                viewBox: "0 0 960 710",
                role: "img",
                "aria-label": "벨벳 커튼의 작은 무대, 아치 창문, 파란 안락의자와 턴테이블, 책과 식물을 손수 배치한 나만의 공연장.".concat(programs.length ? " 벽에 걸린 공연 포스터: ".concat(programs.map((program => program.title)).join(", "), ".") : "", " 조명 ").concat(lightOn ? "켜짐" : "꺼짐", "."),
                children: [ 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("defs", {
                    children: [ 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("linearGradient", {
                        id: id("floor"),
                        x1: "0",
                        y1: "0",
                        x2: "0.8",
                        y2: "1",
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("stop", {
                            stopColor: "var(--color-detail-f5e4c7)"
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("stop", {
                            offset: "1",
                            stopColor: "var(--color-detail-ddc398)"
                        }) ]
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("linearGradient", {
                        id: id("edge"),
                        x2: "0",
                        y2: "1",
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("stop", {
                            stopColor: "var(--color-detail-d5b88d)"
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("stop", {
                            offset: "1",
                            stopColor: "var(--color-detail-b59365)"
                        }) ]
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("linearGradient", {
                        id: id("wall"),
                        x2: "0.9",
                        y2: "1",
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("stop", {
                            stopColor: "var(--color-white)",
                            stopOpacity: "0.34"
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("stop", {
                            offset: "0.65",
                            stopColor: "var(--color-white)",
                            stopOpacity: "0"
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("stop", {
                            offset: "1",
                            stopColor: "var(--color-detail-6f7868)",
                            stopOpacity: "0.13"
                        }) ]
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("linearGradient", {
                        id: id("velvet"),
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("stop", {
                            stopColor: "var(--color-detail-633c26)"
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("stop", {
                            offset: "0.2",
                            stopColor: "var(--mini-room-curtain)"
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("stop", {
                            offset: "0.52",
                            stopColor: "var(--color-detail-f0bc74)"
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("stop", {
                            offset: "0.74",
                            stopColor: "var(--mini-room-curtain)"
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("stop", {
                            offset: "1",
                            stopColor: "var(--color-detail-704329)"
                        }) ]
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("linearGradient", {
                        id: id("backstage"),
                        x2: "0",
                        y2: "1",
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("stop", {
                            stopColor: "var(--color-detail-303c39)"
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("stop", {
                            offset: "1",
                            stopColor: "var(--color-detail-172b29)"
                        }) ]
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("linearGradient", {
                        id: id("chair"),
                        x1: "0.1",
                        y1: "0",
                        x2: "0.8",
                        y2: "1",
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("stop", {
                            stopColor: "var(--color-detail-9ae0e8)"
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("stop", {
                            offset: "0.35",
                            stopColor: "var(--mini-room-chair)"
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("stop", {
                            offset: "1",
                            stopColor: "var(--color-detail-23849a)"
                        }) ]
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("linearGradient", {
                        id: id("ceramic"),
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("stop", {
                            stopColor: "var(--color-detail-d4cdba)"
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("stop", {
                            offset: "0.35",
                            stopColor: "var(--color-detail-faf6e8)"
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("stop", {
                            offset: "1",
                            stopColor: "var(--color-detail-ded6c2)"
                        }) ]
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("linearGradient", {
                        id: id("cabinet"),
                        x2: "0",
                        y2: "1",
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("stop", {
                            stopColor: "var(--color-detail-bd8852)"
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("stop", {
                            offset: "1",
                            stopColor: "var(--color-detail-9d693c)"
                        }) ]
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("linearGradient", {
                        id: id("window"),
                        x2: "0",
                        y2: "1",
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("stop", {
                            stopColor: "var(--color-detail-b8dadd)"
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("stop", {
                            offset: "1",
                            stopColor: "var(--color-detail-eaf2de)"
                        }) ]
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("radialGradient", {
                        id: id("light"),
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("stop", {
                            stopColor: "var(--color-detail-ffe7a3)",
                            stopOpacity: "0.8"
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("stop", {
                            offset: "0.52",
                            stopColor: "var(--color-detail-ffe2a1)",
                            stopOpacity: "0.25"
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("stop", {
                            offset: "1",
                            stopColor: "var(--color-detail-ffe2a1)",
                            stopOpacity: "0"
                        }) ]
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("radialGradient", {
                        id: id("stage-light"),
                        cx: "0.5",
                        cy: "0.8",
                        r: "0.85",
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("stop", {
                            stopColor: "var(--color-detail-fce7ae)",
                            stopOpacity: "0.5"
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("stop", {
                            offset: "1",
                            stopColor: "var(--color-detail-fce7ae)",
                            stopOpacity: "0"
                        }) ]
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("filter", {
                        id: id("shadow"),
                        x: "-25%",
                        y: "-50%",
                        width: "150%",
                        height: "200%",
                        children:   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("feGaussianBlur", {
                            stdDeviation: "9"
                        })
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("filter", {
                        id: id("contact"),
                        x: "-25%",
                        y: "-60%",
                        width: "150%",
                        height: "220%",
                        children:   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("feGaussianBlur", {
                            stdDeviation: "3"
                        })
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("clipPath", {
                        id: id("window-clip"),
                        children:   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                            d: "M279 158V67a31 31 0 0 1 62 0v91Z"
                        })
                    }) ]
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("ellipse", {
                    cx: "484",
                    cy: "646",
                    rx: "313",
                    ry: "38",
                    fill: "var(--color-detail-5c503d)",
                    opacity: "0.14",
                    filter: paint("shadow")
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "M101 490 480 305 859 490 480 679Z",
                    fill: paint("floor")
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "M101 490 480 679v15L101 507Z",
                    fill: paint("edge")
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "m480 679 379-189v17L480 694Z",
                    fill: "var(--color-detail-ba976a)"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "M101 490 480 679 859 490",
                    fill: "none",
                    stroke: "var(--color-detail-f7ead4)",
                    strokeWidth: "3"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("g", {
                    fill: "none",
                    stroke: "var(--color-detail-b99a70)",
                    strokeWidth: "1.2",
                    opacity: "0.45",
                    children: [ 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "m142 510 379-185m-328 210 379-185m-328 210 379-185m-328 210 379-185m-328 210 379-185m-328 210 379-185m-328 210 379-185"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "m206 458 51 25m132-115 51 25m-132 15 51 25m130-17 51 25m-130 17 51 25m131-16 51 25m-130 16 51 25m-388-27 51 25m132-116 51 25m-131 16 51 25m131-16 51 25m-131 16 51 25"
                    }) ]
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("g", {
                    fill: "none",
                    stroke: "var(--color-detail-fff8e9)",
                    strokeLinecap: "round",
                    opacity: "0.37",
                    children:   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "m241 513 112-55m-16 102 86-42m126-19 117-57m-171-23 76-37m-148 234 87-43m60-1 117-57"
                    })
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "M101 239 480 54v253L101 493Z",
                    fill: "var(--color-detail-c9c9b8)"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "M480 54 859 239v254L480 307Z",
                    fill: "var(--color-detail-d0cdba)"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "M108 246 480 64v244L108 490Z",
                    className: "mini-room-wall-left"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "M480 64 852 246v244L480 308Z",
                    className: "mini-room-wall-right"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "M108 246 480 64v244L108 490Z",
                    fill: paint("wall")
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "M480 64 852 246v244L480 308Z",
                    fill: paint("wall")
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "M101 239 480 54 859 239l-7 7L480 64 108 246Z",
                    fill: "var(--color-detail-fffdf2)"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "M101 239v251l7 7V246m744 0v251l7-7V239",
                    fill: "var(--color-detail-e8e3d1)"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "M113 471 480 292 847 471v15L480 307 113 486Z",
                    fill: "var(--color-detail-d9d6c5)"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "m113 471 367-179 367 179",
                    fill: "none",
                    stroke: "var(--color-detail-faf8e9)",
                    strokeWidth: "4"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "M480 66v225",
                    stroke: "var(--color-detail-8d9988)",
                    strokeOpacity: "0.2",
                    strokeWidth: "3"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("g", {
                    transform: "matrix(1 -.49 0 1 108 246)",
                    children: [ 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "M269 170V67a41 41 0 0 1 82 0v103Z",
                        fill: "var(--color-detail-8e9d8c)",
                        opacity: "0.2"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "M273 163V67a37 37 0 0 1 74 0v96Z",
                        fill: "var(--color-detail-b8ae92)"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "M279 158V67a31 31 0 0 1 62 0v91Z",
                        fill: paint("window")
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("g", {
                        clipPath: paint("window-clip"),
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                            d: "M275 136c18-23 30-14 39-29 10-14 22-5 32-16v72h-71Z",
                            fill: "var(--color-detail-b4c8aa)"
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                            d: "M275 150c22-17 42-7 70-27v40h-70Z",
                            fill: "var(--color-detail-93ac91)"
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                            d: "M292 73c8-8 14-4 18 0 4-2 10-1 12 4h-33Z",
                            fill: "var(--color-white)",
                            opacity: "0.7"
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                            d: "M283 53v106m27-121v121m28-106v106M279 92h63",
                            fill: "none",
                            stroke: "var(--color-detail-faf8ea)",
                            strokeWidth: "5"
                        }) ]
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "M276 160V67a34 34 0 0 1 68 0v93Z",
                        fill: "none",
                        stroke: "var(--color-detail-f9f7e9)",
                        strokeWidth: "5"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "M268 162h84l-5 8h-84Z",
                        fill: "var(--color-detail-fffbea)"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "M263 170h84v6h-84Z",
                        fill: "var(--color-detail-ccc6ad)"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "M265 44c-4 31 1 70-5 114l16 3c-2-35 4-80 1-117Zm79 0c-2 40 5 80 0 117l15-3c-6-44 1-89-4-114Z",
                        fill: "var(--color-detail-f5edd8)"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "M268 47c-2 32 2 72-3 107m83-107c-1 39 5 71 1 107",
                        fill: "none",
                        stroke: "var(--color-detail-d9cfb7)",
                        strokeWidth: "3"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "M260 42h100",
                        stroke: "var(--color-detail-9e7c50)",
                        strokeWidth: "4",
                        strokeLinecap: "round"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("circle", {
                        cx: "259",
                        cy: "42",
                        r: "4",
                        fill: "var(--color-detail-c8a568)"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("circle", {
                        cx: "361",
                        cy: "42",
                        r: "4",
                        fill: "var(--color-detail-c8a568)"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "m283 164 6-20h12l6 20Z",
                        fill: "var(--color-detail-d19972)"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "M295 145v-25m0 17c-13-1-14-12-14-12 11-1 15 3 14 12Zm1-9c13 1 17-10 17-10-11-3-16 2-17 10Z",
                        fill: "var(--color-detail-718c62)"
                    }) ]
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "m400 379 60-30 129 61-61 30Z",
                    fill: "var(--color-detail-f8f3ca)",
                    opacity: "0.25"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "m409 382 22-11 129 62-22 11m-98-77 19-9 129 62-19 9",
                    fill: "var(--color-detail-fff9da)",
                    opacity: "0.22"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "m134 474 221-108 73 36-221 109Z",
                    fill: "var(--color-detail-cfa778)"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "m134 474 73 37v14l-73-37Z",
                    fill: "var(--color-detail-a97748)"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "m207 511 221-109v14L207 525Z",
                    fill: "var(--color-detail-b98d5c)"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "m146 474 209-102 60 30-208 102Z",
                    fill: "var(--color-detail-e2c59a)"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "m166 478 187-91m-166 102 188-92",
                    stroke: "var(--color-detail-c5a271)",
                    strokeWidth: "1.5"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("g", {
                    transform: "matrix(1 -.49 0 1 108 246)",
                    children: [ 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "M25 242V86C25 28 251 28 251 86v156Z",
                        fill: "var(--color-detail-a77f53)"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "M32 242V87C32 36 244 36 244 87v155Z",
                        fill: "var(--color-detail-e1c69d)"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "M43 241V89C43 49 233 49 233 89v152Z",
                        fill: paint("backstage")
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "M46 238V93C46 57 230 57 230 93v145Z",
                        fill: "none",
                        stroke: "var(--color-detail-805e3d)",
                        strokeWidth: "4"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "M52 100c35 8 57-1 86-13 29 12 53 21 86 13V82c-42-20-130-20-172 0Z",
                        fill: paint("velvet")
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "M52 91c35 22 38 64 5 120l-5 27Zm172 0c-35 22-38 64-5 120l5 27Z",
                        fill: paint("velvet")
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "M59 104c18 31 13 60 1 88m11-83c14 27 11 52-3 81m149-86c-18 31-13 60-1 88m-11-83c-14 27-11 52 3 81",
                        fill: "none",
                        stroke: "var(--color-detail-553a2b)",
                        strokeWidth: "3",
                        strokeOpacity: "0.32"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "M58 86c21 9 52 7 80-3 28 10 58 12 80 3",
                        fill: "none",
                        stroke: "var(--color-detail-ffe2a6)",
                        strokeWidth: "2",
                        strokeOpacity: "0.5"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "m53 196 21 5m128 0 21-5",
                        stroke: "var(--color-detail-e8c982)",
                        strokeWidth: "5"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "m58 199 6 13m152-13-6 13",
                        stroke: "var(--color-detail-d5ab5d)",
                        strokeWidth: "2"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "M42 70c33-31 160-31 193 0",
                        fill: "none",
                        stroke: "var(--color-detail-f6e7ca)",
                        strokeWidth: "3"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "M37 94v143m202-143v143",
                        stroke: "var(--color-detail-b09165)",
                        strokeWidth: "3"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("g", {
                        className: "mini-room-glow",
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                            d: "m94 84-28 155h144L183 84Z",
                            fill: paint("stage-light")
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("ellipse", {
                            cx: "138",
                            cy: "227",
                            rx: "71",
                            ry: "13",
                            fill: "var(--color-detail-ffe3a4)",
                            opacity: "0.18"
                        }) ]
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "M91 65v13m95-13v13",
                        stroke: "var(--color-detail-665840)",
                        strokeWidth: "3"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("rect", {
                        x: "80",
                        y: "75",
                        width: "23",
                        height: "11",
                        rx: "4",
                        fill: "var(--color-detail-39443e)"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("rect", {
                        x: "174",
                        y: "75",
                        width: "23",
                        height: "11",
                        rx: "4",
                        fill: "var(--color-detail-39443e)"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "M84 86h15m79 0h15",
                        className: "mini-room-light-strip",
                        strokeWidth: "3"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("ellipse", {
                        cx: "144",
                        cy: "229",
                        rx: "56",
                        ry: "9",
                        fill: "var(--color-detail-071d1b)",
                        opacity: "0.4"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "m112 206-3 24m68-24 4 24m-43-28v24",
                        stroke: "var(--color-detail-ba9860)",
                        strokeWidth: "4",
                        strokeLinecap: "round"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "M108 171c-2-14 6-22 20-23 25-2 37 16 52 20v36h-72Z",
                        fill: "var(--color-detail-182c2a)"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "M108 171c-2-14 6-22 20-23 25-2 37 16 52 20v10h-72Z",
                        fill: "var(--color-detail-50635b)"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "M111 169c3-15 16-15 28-9 13 7 21 11 35 11",
                        fill: "none",
                        stroke: "var(--color-detail-889486)",
                        strokeWidth: "2"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "M108 179h75v8h-75Z",
                        fill: "var(--color-detail-0f2524)"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "M109 180h72v5h-72Z",
                        fill: "var(--color-detail-f1e8cf)"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "M115 180v4m8-4v4m8-4v4m8-4v4m8-4v4m8-4v4m8-4v4m8-4v4",
                        stroke: "var(--color-detail-192d2b)",
                        strokeWidth: "3"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "M128 167v-15h24v15Z",
                        fill: "var(--color-detail-a59570)"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "M130 165v-11l10 2 10-2v11l-10 2Z",
                        fill: "var(--color-detail-f3ecd8)"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "M140 156v11",
                        stroke: "var(--color-detail-c7b98e)"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("rect", {
                        x: "121",
                        y: "209",
                        width: "32",
                        height: "8",
                        rx: "3",
                        fill: "var(--color-detail-714e38)"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "M125 216v12m24-12v12",
                        stroke: "var(--color-detail-bea06c)",
                        strokeWidth: "3"
                    }) ]
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("g", {
                    transform: "matrix(1 .49 0 1 480 64)",
                    children: [ 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "M29 45h301",
                        stroke: "var(--color-detail-a09377)",
                        strokeWidth: "3",
                        strokeLinecap: "round"
                    }), programs.map(((program, index) => {
                        const x = 35 + index * 99;
                         
                        return (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("g", {
                            children: [ 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                                d: "M".concat(x + 37, " 46v18"),
                                stroke: "var(--color-detail-a39983)",
                                strokeWidth: "1.5"
                            }), 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("rect", {
                                x: x + 3,
                                y: "71",
                                width: "82",
                                height: "122",
                                rx: "3",
                                fill: "var(--color-detail-6c7363)",
                                opacity: "0.15"
                            }), 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("rect", {
                                x: x - 4,
                                y: "64",
                                width: "82",
                                height: "122",
                                rx: "3",
                                fill: "var(--color-detail-72563b)"
                            }), 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("rect", {
                                x: x - 1,
                                y: "67",
                                width: "76",
                                height: "116",
                                fill: "var(--color-detail-f7eedb)"
                            }), 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("image", {
                                href: (0, _src_lib_media__WEBPACK_IMPORTED_MODULE_4__ /* .mediaPath */ .e)(program.image),
                                x: x + 3,
                                y: "71",
                                width: "68",
                                height: "108",
                                preserveAspectRatio: "xMidYMid slice"
                            }), 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                                d: "M".concat(x - 2, " 65h78M").concat(x - 2, " 65v119"),
                                fill: "none",
                                stroke: "var(--color-detail-d5b786)",
                                strokeWidth: "1.5"
                            }), 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                                d: "m".concat(x + 60, " 72-56 96v-17l47-79Z"),
                                fill: "var(--color-white)",
                                opacity: "0.08"
                            }) ]
                        }, program.id);
                    })), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "M94 40v11m99-11v11m99-11v11",
                        stroke: "var(--color-detail-8c7c58)",
                        strokeWidth: "3"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "M83 51h22m77 0h22m77 0h22",
                        stroke: "var(--color-detail-b29961)",
                        strokeWidth: "6",
                        strokeLinecap: "round"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "M85 55h18m81 0h18m81 0h18",
                        className: "mini-room-light-strip",
                        strokeWidth: "2"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("g", {
                        className: "mini-room-glow",
                        opacity: "0.45",
                        children:   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                            d: "m88 58-26 109h63L100 58Zm99 0-26 109h63L199 58Zm99 0-26 109h63L298 58Z",
                            fill: paint("stage-light")
                        })
                    }) ]
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "m461 382 285 139 39-18-287-140Z",
                    fill: "var(--color-detail-756044)",
                    opacity: "0.13",
                    filter: paint("contact")
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("g", {
                    transform: "matrix(1 .49 0 1 480 64)",
                    children: [ 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "m-19 314-2 18m275-18 3 18m-242-36 1 13m236-13v13",
                        stroke: "var(--color-detail-755336)",
                        strokeWidth: "6",
                        strokeLinecap: "round"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "M22 223h291l-45 45H-23Z",
                        fill: "var(--color-detail-d6b585)"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "m-23 268 291 0v52H-23Z",
                        fill: paint("cabinet")
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "m268 268 45-45v52l-45 45Z",
                        fill: "var(--color-detail-8e603c)"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "M-23 268h291v5H-23Z",
                        fill: "var(--color-detail-e3c799)"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "M-13 281h91v31h-91Z",
                        fill: "var(--color-detail-6b5037)"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "M89 280h83v34H89Zm92 0h76v34h-76Z",
                        fill: "var(--color-detail-bd8954)",
                        stroke: "var(--color-detail-a47245)"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "M128 286v6m91-6v6",
                        stroke: "var(--color-detail-d9be81)",
                        strokeWidth: "3",
                        strokeLinecap: "round"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "M-7 285h10v26H-7Z",
                        fill: "var(--color-detail-ead7a5)"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "M5 283h8v28H5Z",
                        fill: "var(--color-detail-627d76)"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "M15 286h8v25h-8Z",
                        fill: "var(--color-detail-c98151)"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "M26 282h10v29H26Z",
                        fill: "var(--color-detail-dbcfb5)"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "m40 286 8-2 7 26-8 2Z",
                        fill: "var(--color-detail-556a70)"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "M58 304h14v7H58Z",
                        fill: "var(--color-detail-c1ad85)"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "M-9 290H1m6 14h5m5-10h5m6 10h7",
                        stroke: "var(--color-detail-f5e6bb)",
                        strokeWidth: "1.5"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "m52 219 86 0-27 28H25Z",
                        fill: "var(--color-detail-715640)"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "m25 247 86 0v7H25Z",
                        fill: "var(--color-detail-4f4435)"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "m111 247 27-28v7l-27 28Z",
                        fill: "var(--color-detail-5e4935)"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "m55 222 74 0-20 21H35Z",
                        fill: "var(--color-detail-c5ab7d)"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("ellipse", {
                        cx: "77",
                        cy: "232",
                        rx: "28",
                        ry: "9",
                        fill: "var(--color-detail-273735)"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("ellipse", {
                        cx: "77",
                        cy: "232",
                        rx: "21",
                        ry: "6",
                        fill: "none",
                        stroke: "var(--color-detail-6b7666)",
                        strokeWidth: "1"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("ellipse", {
                        cx: "77",
                        cy: "232",
                        rx: "8",
                        ry: "3",
                        fill: "var(--color-detail-e4b257)"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "m120 225-15 7-6 9",
                        fill: "none",
                        stroke: "var(--color-detail-ece3c5)",
                        strokeWidth: "3",
                        strokeLinecap: "round"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("circle", {
                        cx: "124",
                        cy: "225",
                        r: "3",
                        fill: "var(--color-detail-6b6750)"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "m40 214 19-18 83 0-4 23H52Z",
                        fill: "var(--color-detail-cdddce)",
                        opacity: "0.3",
                        stroke: "var(--color-detail-f8f4dd)",
                        strokeWidth: "1.5"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "m167 228 40 0-13 13h-40Z",
                        fill: "var(--color-detail-e4d9bf)"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "m154 241 40 0v5h-40Z",
                        fill: "var(--color-detail-a9b3a6)"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "m161 223 37 0-12 12h-37Z",
                        fill: "var(--color-detail-bf7250)"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "m149 235 37 0v5h-37Z",
                        fill: "var(--color-detail-e5bf92)"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "M241 220h22l-3 19h-16Z",
                        fill: paint("ceramic")
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("ellipse", {
                        cx: "252",
                        cy: "220",
                        rx: "11",
                        ry: "4",
                        fill: "var(--color-detail-b9ad91)"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "M252 220v-28m0 16c-14 0-18-13-18-13 13-3 18 4 18 13Zm0-9c12 0 18-11 18-11-12-4-18 2-18 11Z",
                        fill: "var(--color-detail-718b65)"
                    }) ]
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "M357 465c49-24 85-31 120-14l152 74c34 17 34 37-5 56l-69 34c-29 15-64 15-96-1l-157-77c-28-13-20-34 10-49Z",
                    fill: "var(--color-detail-9e8767)",
                    opacity: "0.13"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "M354 457c49-24 85-31 120-14l152 74c34 17 34 37-5 56l-69 34c-29 15-64 15-96-1l-157-77c-28-13-20-34 10-49Z",
                    fill: "var(--color-detail-f3edd9)"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "M359 467c44-22 78-27 108-12l146 71c27 13 27 26-5 42l-62 31c-26 12-54 12-81-1l-150-73c-20-10-16-22 10-35Z",
                    fill: "none",
                    stroke: "var(--color-detail-d7d0b8)",
                    strokeWidth: "3"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "m323 509 275 38m-245-54 218 86m-242-66 254 49",
                    fill: "none",
                    stroke: "var(--color-detail-fffbea)",
                    strokeWidth: "2",
                    opacity: "0.45"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("ellipse", {
                    cx: "432",
                    cy: "517",
                    rx: "78",
                    ry: "24",
                    fill: "var(--color-detail-5c685c)",
                    opacity: "0.16",
                    filter: paint("contact")
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "m371 486-4 31m97-1 8 26m-14-72 9 26",
                    stroke: "var(--color-detail-8d683f)",
                    strokeWidth: "7",
                    strokeLinecap: "round"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "M355 427c-5-40 26-56 63-40l48 24c16 8 21 20 17 40l-9 49c-2 15-13 21-29 15l-72-35c-13-6-20-19-18-34Z",
                    fill: "var(--color-detail-25849b)"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "M362 425c-3-27 19-39 48-26l48 24c12 6 14 14 11 27l-8 37c-2 8-8 10-17 6l-66-32c-11-5-17-11-16-22Z",
                    fill: paint("chair")
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "M373 406c14-4 25-1 39 6l38 19c7 3 11 8 11 14",
                    fill: "none",
                    stroke: "var(--color-detail-cbf0e8)",
                    strokeWidth: "2",
                    opacity: "0.6"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "m371 465 48-23 57 28-45 26Z",
                    fill: "var(--color-detail-79d0dc)"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "m371 465 60 31v15l-60-30Z",
                    fill: "var(--color-detail-3caac0)"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "m431 496 45-26-2 17-43 24Z",
                    fill: "var(--color-detail-2d97ae)"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "M353 442c0-9 8-12 16-8l13 7c5 2 8 8 7 14l-3 23c-1 9-8 13-16 8l-9-5c-6-3-9-8-9-15Z",
                    fill: paint("chair")
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "M449 488c0-10 7-15 15-11l14 7c6 3 8 8 6 15l-3 12c-2 9-9 12-16 8l-10-5c-5-3-7-8-7-14Z",
                    fill: paint("chair")
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "m402 429 19-8c4-2 7-1 10 2l13 20c3 4 2 8-2 10l-20 9c-4 2-7 0-9-3l-15-20c-2-4-1-7 4-10Z",
                    fill: "var(--color-detail-f5e8c7)"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "m408 432 25 21m-15-25 13 30",
                    stroke: "var(--color-detail-c7b991)",
                    strokeWidth: "1.5"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("ellipse", {
                    cx: "546",
                    cy: "551",
                    rx: "55",
                    ry: "18",
                    fill: "var(--color-detail-726348)",
                    opacity: "0.14",
                    filter: paint("contact")
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "m513 517-9 39m68-34 9 35m-37-55v31",
                    stroke: "var(--color-detail-9d774a)",
                    strokeWidth: "6",
                    strokeLinecap: "round"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "M492 506c0-17 26-28 54-28s54 11 54 28v9c0 17-26 28-54 28s-54-11-54-28Z",
                    fill: "var(--color-detail-c5a16e)"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("ellipse", {
                    cx: "546",
                    cy: "506",
                    rx: "54",
                    ry: "27",
                    fill: "var(--color-detail-e7cda1)"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("ellipse", {
                    cx: "546",
                    cy: "504",
                    rx: "48",
                    ry: "22",
                    fill: "none",
                    stroke: "var(--color-detail-f4e1bb)",
                    strokeWidth: "1.5"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "m512 507 17-9 23 10 19-6-4 15-17 8-23-11-17 5Z",
                    fill: "var(--color-detail-c7ad7d)"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "m512 502 17-8 23 10 19-6-3 15-17 8-23-11-17 5Z",
                    fill: "var(--color-detail-fff7df)"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "m529 494-1 16 23 11 1-17",
                    fill: "var(--color-detail-ebe0c2)"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "m533 500 14 6m-15-1 14 6m-15-1 14 6m12-9 9-4m-10 9 9-4",
                    stroke: "var(--color-detail-b7ab8a)",
                    strokeWidth: "1"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("ellipse", {
                    cx: "567",
                    cy: "491",
                    rx: "15",
                    ry: "6",
                    fill: "var(--color-detail-c9af82)"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "M557 479h18v10c0 7-18 7-18 0Z",
                    fill: "var(--color-detail-f7f2de)"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "M575 481c11-2 10 10 0 9",
                    fill: "none",
                    stroke: "var(--color-detail-f7f2de)",
                    strokeWidth: "3"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("ellipse", {
                    cx: "566",
                    cy: "479",
                    rx: "9",
                    ry: "4",
                    fill: "var(--color-detail-fdf8e8)"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("ellipse", {
                    cx: "566",
                    cy: "479",
                    rx: "6.5",
                    ry: "2.5",
                    fill: "var(--color-detail-947450)"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "M563 470c-5-7 5-9 1-16m6 18c-4-5 4-8 1-13",
                    fill: "none",
                    stroke: "var(--color-detail-ffffee)",
                    strokeWidth: "2",
                    strokeLinecap: "round",
                    opacity: "0.7"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("ellipse", {
                    cx: "677",
                    cy: "495",
                    rx: "29",
                    ry: "12",
                    fill: "var(--color-detail-665c42)",
                    opacity: "0.12",
                    filter: paint("contact")
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("ellipse", {
                    cx: "677",
                    cy: "485",
                    rx: "25",
                    ry: "11",
                    fill: "var(--color-detail-9a8256)"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("ellipse", {
                    cx: "677",
                    cy: "482",
                    rx: "24",
                    ry: "9",
                    fill: "var(--color-detail-b9a47c)"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "M677 480V345c0-13-10-22-23-22h-16",
                    fill: "none",
                    stroke: "var(--color-detail-ae9465)",
                    strokeWidth: "5"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "M677 479V345c0-13-10-22-23-22",
                    fill: "none",
                    stroke: "var(--color-detail-e2cea0)",
                    strokeWidth: "1.5"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("g", {
                    className: "mini-room-glow",
                    children: [ 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("ellipse", {
                        cx: "637",
                        cy: "430",
                        rx: "114",
                        ry: "101",
                        fill: paint("light")
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                        d: "m615 345-60 155c40 24 113 26 154 7l-49-162Z",
                        fill: "var(--color-detail-ffe6a5)",
                        opacity: "0.09"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("ellipse", {
                        cx: "633",
                        cy: "506",
                        rx: "81",
                        ry: "27",
                        fill: paint("light")
                    }) ]
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "M617 311h34l17 42c-13 12-54 12-68 0Z",
                    fill: "var(--color-detail-ccb276)"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "M619 311h30l15 40c-16 8-47 8-60 0Z",
                    className: "mini-room-lampshade"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "m620 315-9 34m15-35-4 38m11-38v39m7-39 5 38m1-38 11 35",
                    stroke: "var(--color-detail-bda876)",
                    strokeWidth: "1.6",
                    opacity: "0.65"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("ellipse", {
                    cx: "634",
                    cy: "311",
                    rx: "17",
                    ry: "5",
                    fill: "var(--color-detail-e5d4a8)"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("ellipse", {
                    cx: "634",
                    cy: "354",
                    rx: "33",
                    ry: "8",
                    fill: "var(--color-detail-c8b37f)"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("ellipse", {
                    cx: "634",
                    cy: "354",
                    rx: "27",
                    ry: "5",
                    className: "mini-room-bulb"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "M632 303v4",
                    stroke: "var(--color-detail-ae9465)",
                    strokeWidth: "4",
                    strokeLinecap: "round"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("ellipse", {
                    cx: "755",
                    cy: "533",
                    rx: "35",
                    ry: "13",
                    fill: "var(--color-detail-66573f)",
                    opacity: "0.15",
                    filter: paint("contact")
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "M728 478h51l-6 48c-2 16-38 16-40 0Z",
                    fill: paint("ceramic")
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("ellipse", {
                    cx: "753.5",
                    cy: "478",
                    rx: "25.5",
                    ry: "11",
                    fill: "var(--color-detail-faf6e6)"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("ellipse", {
                    cx: "753.5",
                    cy: "478",
                    rx: "20",
                    ry: "7",
                    fill: "var(--color-detail-a29476)"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "M754 478v-97m0 72-25-33m25 15 28-36m-28 3-13-36",
                    fill: "none",
                    stroke: "var(--color-detail-667d53)",
                    strokeWidth: "4",
                    strokeLinecap: "round"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "M753 405c-30-1-45-29-39-45 28-1 43 16 39 45Z",
                    fill: "var(--color-detail-7c976b)"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "M754 393c-9-29 5-49 24-51 14 25 3 46-24 51Z",
                    fill: "var(--color-detail-91a778)"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "M774 420c-4-31 18-50 38-45 2 27-12 45-38 45Z",
                    fill: "var(--color-detail-69865c)"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "M742 439c-29 4-47-17-44-38 28-3 45 13 44 38Z",
                    fill: "var(--color-detail-a0b188)"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "M755 462c16-28 38-29 54-15-10 23-30 30-54 15Z",
                    fill: "var(--color-detail-839d6b)"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "m719 366 27 30m29-47-18 39m49-8-25 32m-78-6 31 26m66 16-38 12",
                    fill: "none",
                    stroke: "var(--color-detail-dfe6c6)",
                    strokeWidth: "1.5",
                    strokeOpacity: "0.4"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("ellipse", {
                    cx: "440",
                    cy: "592",
                    rx: "36",
                    ry: "12",
                    fill: "var(--color-detail-8b7657)",
                    opacity: "0.12",
                    filter: paint("contact")
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "m412 575-2 17m54-15 2 16",
                    stroke: "var(--color-detail-a38055)",
                    strokeWidth: "5",
                    strokeLinecap: "round"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "M404 555c0-11 16-19 36-19s36 8 36 19v17c0 11-16 19-36 19s-36-8-36-19Z",
                    fill: "var(--color-detail-ba8c62)"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("ellipse", {
                    cx: "440",
                    cy: "555",
                    rx: "36",
                    ry: "19",
                    fill: "var(--color-detail-d8b68a)"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("ellipse", {
                    cx: "440",
                    cy: "553",
                    rx: "30",
                    ry: "14",
                    fill: "none",
                    stroke: "var(--color-detail-f0d5aa)",
                    strokeWidth: "1.5"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "m417 542 16-8 31 16-16 10v24l-13-6v-23Z",
                    fill: "var(--color-detail-e7d7b0)"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "m424 540 28 16v21m-21-40 28 16m-24 4 13 7m-13-1 13 7",
                    fill: "none",
                    stroke: "var(--color-detail-b9ac82)",
                    strokeWidth: "1.5"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "m437 578-1 6m5-4v6m5-3v6",
                    stroke: "var(--color-detail-e7d7b0)",
                    strokeWidth: "2"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
                    d: "M108 246 480 64 852 246v244L480 679 108 490Z",
                    className: "mini-room-dusk"
                }) ]
            });
        }
        // [취향이 걸린 작은 공연장 / A little theatre for personal favourites]
                function AccountMiniRoom(param) {
            let {name: name, message: message, theme: theme, lightOn: lightOn, programs: programs, hasFavorites: hasFavorites, onEdit: onEdit, onToggleLight: onToggleLight} = param;
            const instanceId = (0, react__WEBPACK_IMPORTED_MODULE_1__.useId)().replaceAll(":", "");
            const headingId = "mini-room-heading-".concat(instanceId);
            const posters = programs.slice(0, 3);
            const lightLabel = lightOn ? "공연장 조명이 켜져 있어요. 조명 끄기" : "공연장 조명이 꺼져 있어요. 조명 켜기";
             
            return (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("section", {
                className: "account-mini-room",
                "data-component": "AccountMiniRoom",
                "data-component-id": "account-mini-room",
                "data-theme": theme,
                "data-light": lightOn ? "on" : "off",
                "aria-labelledby": headingId,
                children: [ 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("header", {
                    className: "mini-room-header",
                    children: [ 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h2", {
                        "data-text": "heading",
                        id: headingId,
                        children: "나의 작은 공연장"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                        className: "mini-room-actions",
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .SystemIconButton */)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_2__.MW, {
                            "data-text": "action",
                            variant: "secondary",
                            "aria-label": lightLabel,
                            "aria-pressed": lightOn,
                            onClick: onToggleLight,
                            disabled: !onToggleLight,
                            title: lightOn ? "조명 끄기" : "조명 켜기",
                            children:   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* ["default"] */)(_Icon__WEBPACK_IMPORTED_MODULE_3__.Z, {
                                name: "lightbulb",
                                filled: lightOn
                            })
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .SystemButton */)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_2__.kR, {
                            "data-text": "action",
                            variant: "secondary",
                            onClick: onEdit,
                            disabled: !onEdit,
                            children: "공간 꾸미기"
                        }) ]
                    }) ]
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("figure", {
                    className: "mini-room-figure",
                    children: [ 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                        className: "mini-room-scene",
                        "data-note-layout": message.length > 40 || name.length > 16 ? "flow" : "overlay",
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("blockquote", {
                            "data-text": "body",
                            className: "mini-room-note",
                            children: [ 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                                "data-text": "body",
                                children: message
                            }), 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("cite", {
                                "data-text": "meta",
                                children: [ name, "의 공연장" ]
                            }) ]
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(MiniRoomArtwork, {
                            instanceId: instanceId,
                            programs: posters,
                            lightOn: lightOn
                        }) ]
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("figcaption", {
                        "data-text": "caption",
                        className: "mini-room-caption",
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                            "data-text": "body",
                            children: hasFavorites ? "관심 공연을 포스터로 걸어 두었어요." : "아직 관심 공연이 없어, 세종의 추천 공연을 걸어 두었어요."
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("span", {
                            "data-text": "body",
                            className: "mini-room-light-status",
                            children: [ "조명 ", lightOn ? "켜짐" : "꺼짐" ]
                        }) ]
                    }) ]
                }) ]
            });
        }
        /***/    },
    /***/ 2335: 
    /***/ function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ Lh: function() {
                /* binding */ return AccountDiary;
            },
            /* harmony export */ pN: function() {
                /* binding */ return AccountTicket;
            },
            /* harmony export */ pS: function() {
                /* binding */ return AccountMembershipCard;
            }
            /* harmony export */        });
        /* harmony import */        var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7437);
        /* harmony import */        var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(2265);
        /* harmony import */        var next_link__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(7648);
        /* harmony import */        var _src_lib_media__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(2110);
        /* harmony import */        var _src_lib_reservations_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(8962);
        /* harmony import */        var _SystemPrimitives__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(6983);
        /* harmony import */        var _Icon__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(9140);
        /* __next_internal_client_entry_do_not_use__ AccountMembershipCard,AccountTicket,AccountDiary auto */
        // [개인 프로필과 멤버십 길잡이 / Personal profile and membership navigation]
                function AccountMembershipCard(param) {
            let {name: name, message: message, mode: mode, counts: counts, onEdit: onEdit, onLogout: onLogout} = param;
            const signedIn = mode === "oauth";
             
            return (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("section", {
                className: "account-identity",
                "data-component": "AccountMembershipCard",
                "data-component-id": "account-membership",
                "aria-label": "나의 프로필",
                children: [ 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                    className: "account-identity-top",
                    children: [ 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", {
                        "data-text": "body",
                        className: "account-avatar",
                        "aria-hidden": "true",
                        children: Array.from(name)[0] || "나"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .SystemBadge */)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_4__.WT, {
                        "data-text": "meta",
                        tone: mode === "oauth" ? "info" : "neutral",
                        children: mode === "oauth" ? "로그인됨" : mode === "demo" ? "내 프로필" : "방문자 공간"
                    }) ]
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("h2", {
                    "data-text": "heading",
                    children: [ name, 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", {
                        "data-text": "body",
                        children: "님의 세종"
                    }) ]
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                    "data-text": "body",
                    className: "account-status-message",
                    children: message || "나만의 한 줄을 남겨 보세요."
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs /* .SystemButton */)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_4__.kR, {
                    "data-text": "action",
                    variant: "secondary",
                    shape: "pill",
                    onClick: onEdit,
                    children: [ "나의 공간 꾸미기 ", 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* ["default"] */)(_Icon__WEBPACK_IMPORTED_MODULE_5__.Z, {
                        name: "plus",
                        size: 20
                    }) ]
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("dl", {
                    className: "account-profile-counts",
                    children: [ 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("dt", {
                            "data-text": "label",
                            children: "다가올 관람"
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("dd", {
                            "data-text": "body",
                            children: [ counts.upcoming, 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", {
                                "data-text": "body",
                                children: "건"
                            }) ]
                        }) ]
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("dt", {
                            "data-text": "label",
                            children: "관심 프로그램"
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("dd", {
                            "data-text": "body",
                            children: [ counts.favorites, 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", {
                                "data-text": "body",
                                children: "편"
                            }) ]
                        }) ]
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("dt", {
                            "data-text": "label",
                            children: "남긴 관람노트"
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("dd", {
                            "data-text": "body",
                            children: [ counts.notes, 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", {
                                "data-text": "body",
                                children: "개"
                            }) ]
                        }) ]
                    }) ]
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                    className: "account-membership-guide",
                    children: [ 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h3", {
                        "data-text": "subheading",
                        children: "나의 멤버십"
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                        "data-text": "body",
                        children: "세종문화회관의 회원 등급·포인트·쿠폰을 확인하세요."
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_4__.SystemLink, {
                        "data-text": "action",
                        variant: "quiet",
                        href: "https://www.sejongpac.or.kr/portal/myPage/individual/list.do?menuNo=200479",
                        target: "_blank",
                        children: [ "멤버십 확인 ", 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* ["default"] */)(_Icon__WEBPACK_IMPORTED_MODULE_5__.Z, {
                            name: "diagonal",
                            size: 20
                        }) ]
                    }) ]
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", {
                    "data-text": "body",
                    className: "account-identity-session",
                    children: signedIn ?   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs /* .SystemButton */)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_4__.kR, {
                        "data-text": "action",
                        variant: "quiet",
                        onClick: onLogout,
                        children: [ "로그아웃 ", 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* ["default"] */)(_Icon__WEBPACK_IMPORTED_MODULE_5__.Z, {
                            name: "arrow",
                            size: 20
                        }) ]
                    }) :   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_4__.SystemLink, {
                        "data-text": "action",
                        href: "/account/login/",
                        variant: "quiet",
                        children: [ "로그인 / 프로필 만들기 ", 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* ["default"] */)(_Icon__WEBPACK_IMPORTED_MODULE_5__.Z, {
                            name: "arrow",
                            size: 20
                        }) ]
                    })
                }) ]
            });
        }
        // [같은 티켓의 요약형과 상세형 / Compact and detailed views of the same ticket]
                function AccountTicket(param) {
            let {booking: booking, program: program, variant: variant = "full", onCancel: onCancel} = param;
            const active = booking.status === "held" || booking.status === "reserved_unpaid";
            const closed = booking.status === "cancelled" || booking.status === "expired" || booking.status === "released";
            const expires = booking.expiresAt && Number.isFinite(Date.parse(booking.expiresAt)) ? new Intl.DateTimeFormat("ko-KR", {
                timeZone: "Asia/Seoul",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hourCycle: "h23"
            }).format(new Date(booking.expiresAt)) : "";
             
            return (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("article", {
                className: "account-ticket",
                "data-component": "AccountTicket",
                "data-component-id": "account-ticket",
                "data-variant": variant,
                "data-cancelled": closed || undefined,
                "data-reservation-status": booking.status,
                children: [ 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                    className: "account-ticket-date",
                    children: [ 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("strong", {
                        "data-text": "item-title",
                        children: booking.date.slice(5).replace("-", ".")
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", {
                        "data-text": "body",
                        children: booking.time
                    }) ]
                }), (program === null || program === void 0 ? void 0 : program.image) ?   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("img", {
                    className: "account-ticket-poster",
                    src: (0, _src_lib_media__WEBPACK_IMPORTED_MODULE_6__ /* .mediaPath */ .e)(program.image),
                    alt: program.imageAlt || booking.title,
                    width: 450,
                    height: 600,
                    loading: "lazy"
                }) :   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", {
                    className: "account-ticket-poster",
                    "data-text": "body",
                    role: "img",
                    "aria-label": "공식 이미지 준비 중",
                    children: "공식 이미지 준비 중"
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                    "data-text": "body",
                    className: "account-ticket-body",
                    children: [ 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .SystemBadge */)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_4__.WT, {
                        "data-text": "meta",
                        tone: active ? "info" : "neutral",
                        children: (0, _src_lib_reservations_ts__WEBPACK_IMPORTED_MODULE_3__ /* .reservationStatusLabel */ .Bd)(booking.status)
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h3", {
                        "data-text": "subheading",
                        children:   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(next_link__WEBPACK_IMPORTED_MODULE_2__["default"], {
                            "data-text": "action",
                            href: "/programs/".concat(booking.programId, "/"),
                            children: booking.title
                        })
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                        "data-text": "body",
                        children: booking.venue
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("p", {
                        "data-text": "body",
                        children: [ booking.seats.join(", "), " · ", booking.seats.length, "매" ]
                    }), variant === "full" &&   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("p", {
                        "data-text": "body",
                        className: "account-ticket-reference",
                        children: [ booking.id, " · ", booking.total.toLocaleString(), "원" ]
                    }), active && expires &&   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("p", {
                        "data-text": "body",
                        children: [ booking.status === "held" ? "좌석 보류" : "미결제 예약", " 기한: ", expires, " (서울)" ]
                    }) ]
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", {
                    "data-text": "body",
                    className: "account-ticket-action",
                    children: variant === "compact" ?   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_4__.SystemLink, {
                        "data-text": "action",
                        variant: "secondary",
                        href: "/programs/".concat(booking.programId, "/"),
                        children: [ "공연 상세 ", 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* ["default"] */)(_Icon__WEBPACK_IMPORTED_MODULE_5__.Z, {
                            name: "arrow",
                            size: 20
                        }) ]
                    }) : active && onCancel ?   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .SystemButton */)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_4__.kR, {
                        "data-text": "action",
                        variant: "quiet",
                        onClick: event => onCancel(booking, event.currentTarget),
                        children: "예약 취소"
                    }) : null
                }) ]
            });
        }
        // [관람 후 한 줄과 날짜를 보관하는 노트 / Dated personal performance notes]
                function AccountDiary(param) {
            let {programs: programs, notes: notes, today: today, onSave: onSave, onDelete: onDelete} = param;
            var _programs_;
            const [programId, setProgramId] = (0, react__WEBPACK_IMPORTED_MODULE_1__.useState)(((_programs_ = programs[0]) === null || _programs_ === void 0 ? void 0 : _programs_.id) || "");
            const [date, setDate] = (0, react__WEBPACK_IMPORTED_MODULE_1__.useState)(today);
            const [body, setBody] = (0, react__WEBPACK_IMPORTED_MODULE_1__.useState)("");
            const [error, setError] = (0, react__WEBPACK_IMPORTED_MODULE_1__.useState)("");
            const [saving, setSaving] = (0, react__WEBPACK_IMPORTED_MODULE_1__.useState)(false);
            async function submit(event) {
                event.preventDefault();
                if (saving) return;
                setSaving(true);
                try {
                    if (!await onSave({
                        programId: programId,
                        date: date,
                        body: body
                    })) {
                        setError("공연과 오늘 이전의 관람일, 1~500자의 감상을 확인해 주세요.");
                        return;
                    }
                    setError("");
                    setBody("");
                } catch (error) {
                    setError(error instanceof Error ? error.message : "관람노트를 저장하지 못했습니다.");
                } finally {
                    setSaving(false);
                }
            }
             
            return (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("section", {
                className: "account-diary",
                "data-component": "AccountDiary",
                "data-component-id": "account-diary",
                "aria-labelledby": "account-diary-heading",
                children: [ 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                    className: "account-section-heading",
                    children: [ 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                            "data-text": "body",
                            className: "account-section-kicker",
                            children: "공연이 끝난 뒤에도"
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h2", {
                            "data-text": "heading",
                            id: "account-diary-heading",
                            children: "나의 관람노트"
                        }) ]
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("span", {
                        "data-text": "body",
                        children: [ notes.length, "개의 기록" ]
                    }) ]
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("form", {
                    className: "account-note-form",
                    onSubmit: submit,
                    children: [ 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                        className: "account-form-pair",
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .SystemField */)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_4__.RK, {
                            "data-text": "body",
                            as: "select",
                            label: "기록할 프로그램",
                            id: "account-note-program",
                            value: programId,
                            onChange: event => setProgramId(event.target.value),
                            required: true,
                            children: programs.map((program =>   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("option", {
                                "data-text": "label",
                                value: program.id,
                                children: program.title
                            }, program.id)))
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .SystemField */)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_4__.RK, {
                            "data-text": "body",
                            label: "관람일",
                            type: "date",
                            id: "account-note-date",
                            value: date,
                            max: today,
                            onChange: event => setDate(event.target.value),
                            required: true
                        }) ]
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .SystemField */)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_4__.RK, {
                        "data-text": "body",
                        as: "textarea",
                        id: "account-note-body",
                        label: "오래 남기고 싶은 장면",
                        value: body,
                        onChange: event => setBody(event.target.value),
                        rows: 4,
                        maxLength: 500,
                        required: true,
                        placeholder: "오늘의 무대에서 마음에 남은 순간은 무엇인가요?"
                    }), error &&   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .SystemNotice */)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_4__.F0, {
                        "data-text": "body",
                        error: true,
                        title: "노트를 저장하지 못했어요",
                        children: error
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                        className: "account-note-form-footer",
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("p", {
                            "data-text": "body",
                            children: [ body.length, "/500" ]
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs /* .SystemButton */)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_4__.kR, {
                            "data-text": "action",
                            type: "submit",
                            disabled: saving,
                            children: [ saving ? "저장 중…" : "노트 남기기", " ", 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* ["default"] */)(_Icon__WEBPACK_IMPORTED_MODULE_5__.Z, {
                                name: "plus",
                                size: 20
                            }) ]
                        }) ]
                    }) ]
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", {
                    "data-text": "body",
                    className: "account-note-list",
                    children: notes.length ? notes.map((note => {
                        const program = programs.find((item => item.id === note.programId));
                         
                        return (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("article", {
                            className: "account-note",
                            children: [ 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                children: [ 
                                
                                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("time", {
                                    "data-text": "meta",
                                    dateTime: note.date,
                                    children: note.date.replaceAll("-", ".")
                                }), 
                                
                                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h3", {
                                    "data-text": "subheading",
                                    children: (program === null || program === void 0 ? void 0 : program.title) || "나의 관람 기록"
                                }), 
                                
                                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                                    "data-text": "body",
                                    children: note.body
                                }) ]
                            }), 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .SystemIconButton */)(_SystemPrimitives__WEBPACK_IMPORTED_MODULE_4__.MW, {
                                "data-text": "action",
                                "aria-label": "".concat((program === null || program === void 0 ? void 0 : program.title) || "관람", " 노트 삭제"),
                                onClick: () => onDelete(note.id),
                                children:   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* ["default"] */)(_Icon__WEBPACK_IMPORTED_MODULE_5__.Z, {
                                    name: "close",
                                    size: 20
                                })
                            }) ]
                        }, note.id);
                    })) :   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                        "data-text": "body",
                        className: "account-empty-note",
                        children: "첫 관람노트를 기다리고 있어요. 짧은 한 줄이어도 좋아요."
                    })
                }) ]
            });
        }
        /***/    },
    /***/ 563: 
    /***/ function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        /* harmony export */ __webpack_require__.d(__webpack_exports__, {
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
        /* harmony export */ __webpack_require__.d(__webpack_exports__, {
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
        /* unused harmony export SystemDialog */
        /* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7437);
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
        /* harmony export */ __webpack_require__.d(__webpack_exports__, {
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
        /* harmony export */ __webpack_require__.d(__webpack_exports__, {
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
        /* harmony export */ __webpack_require__.d(__webpack_exports__, {
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
        /* harmony export */ __webpack_require__.d(__webpack_exports__, {
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
        /* harmony export */ __webpack_require__.d(__webpack_exports__, {
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
        /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ e: function() {
                /* binding */ return mediaPath;
            }
            /* harmony export */        });
        // [중복 경로 없는 로컬 이미지 / One canonical path for local media]
                function mediaPath(source) {
            return "/v5/" + (source || "assets/images/sejong-grand-interior.png").replace(/^\/?(?:v5\/)?/, "");
        }
        /***/    }
} ]);
//# sourceMappingURL=AccountMiniRoom_1.js.map