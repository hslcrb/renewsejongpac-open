"use strict";

(self["webpackChunk_N_E"] = self["webpackChunk_N_E"] || []).push([ [ 498 ], {
    /***/ 9140: 
    /***/ function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ Z: function() {
                /* binding */ return Icon;
            }
            /* harmony export */        });
        /* harmony import */        var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7437);
        /* harmony import */        var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(2265);
        /* harmony import */        var _src_system_component_contracts__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(1666);
        /* __next_internal_client_entry_do_not_use__ default auto */        const names = {
            arrow: "arrow_forward",
            back: "arrow_back",
            diagonal: "arrow_outward",
            up: "arrow_upward",
            search: "search",
            menu: "menu",
            close: "close",
            calendar: "calendar_month",
            pin: "location_on",
            ticket: "confirmation_number",
            user: "person",
            heart: "favorite",
            chevron: "chevron_right",
            clock: "schedule",
            plus: "add",
            check: "check",
            wheelchair: "accessible",
            car: "directions_car",
            building: "apartment",
            coffee: "local_cafe",
            mail: "mail",
            download: "download",
            play: "play_arrow",
            pause: "pause"
        };
        function Icon(param) {
            let {name: name, size: size = 24, group: group = "general", className: className = "", filled: filled = false} = param;
            const symbol = names[name] || name || "arrow_forward";
            const hasFilledVariant = symbol === "favorite" || symbol === "lightbulb";
             
            return (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("svg", {
                "data-component-id": "icon",
                "data-icon-group": group === "header-action" && (0, _src_system_component_contracts__WEBPACK_IMPORTED_MODULE_2__ /* .isHeaderActionIcon */ .fC)(name) ? "header-action" : "general",
                className: "material-icon ".concat(className).trim(),
                width: size,
                height: size,
                viewBox: "0 0 24 24",
                preserveAspectRatio: "xMidYMid meet",
                fill: "currentColor",
                "aria-hidden": "true",
                focusable: "false",
                children:   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("use", {
                    href: "/v5/assets/icons/material-symbols-rounded.svg#".concat(hasFilledVariant && filled ? "".concat(symbol, "-fill") : symbol)
                })
            });
        }
        /***/    },
    /***/ 8948: 
    /***/ function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        // EXPORTS
        __webpack_require__.d(__webpack_exports__, {
            Z: function() {
                /* binding */ return components_LiquidGlass;
            }
        });
        // EXTERNAL MODULE: ./node_modules/next/dist/compiled/react/jsx-runtime.js
                var jsx_runtime = __webpack_require__(7437);
        // EXTERNAL MODULE: ./node_modules/next/dist/compiled/react/index.js
                var react = __webpack_require__(2265);
        // EXTERNAL MODULE: ./src/lib/liquid-glass.ts
                var liquid_glass = __webpack_require__(9174);
        // CONCATENATED MODULE: ./components/GlassRefraction.tsx
        /* __next_internal_client_entry_do_not_use__ default auto */
        // [배경을 실제로 굴절시키는 렌즈 / A lens that displaces the actual backdrop]
        // 크기·곡률이 바뀔 때 지도를 만들고 굴절 강도 조절에는 재사용합니다.
        // Regenerate the map for geometry changes; strength changes reuse it.
        function GlassRefraction(param) {
            let {surfaceRef: surfaceRef, blur: blur, refraction: refraction, thickness: thickness} = param;
            const id = "glass-lens-" + (0, react.useId)().replace(/:/g, "");
            const image = (0, react.useRef)(null);
            const previousSize = (0, react.useRef)("");
            const [filterOptions, setFilterOptions] = (0, react.useState /* GLASS_DEFAULTS */)(liquid_glass.Fp);
            (0, react.useEffect)((() => {
                const panel = surfaceRef.current;
                if (!panel) return;
                const update = () => {
                    var // 숨긴 SVG의 비율 크기 대신 실제 픽셀 크기를 사용합니다.
                    // The hidden SVG has no viewport; the lens needs explicit pixel dimensions.
                    _image_current, _image_current1, _image_current2;
                    const width = Math.ceil(panel.offsetWidth);
                    const height = Math.ceil(panel.offsetHeight);
                    if (!width || !height) return;
                    const computed = getComputedStyle(panel);
                    const options = (0, liquid_glass /* resolveGlassOptions */ .Cv)({
                        blur: parseFloat(computed.getPropertyValue("--glass-blur")),
                        refraction: parseFloat(computed.getPropertyValue("--glass-refraction")),
                        thickness: parseFloat(computed.getPropertyValue("--glass-thickness"))
                    });
                    setFilterOptions((previous => previous.blur === options.blur && previous.refraction === options.refraction ? previous : options));
                    const radius = Math.max(0, Math.min(Math.max(parseFloat(computed.borderTopLeftRadius) || 0, parseFloat(computed.borderTopRightRadius) || 0, parseFloat(computed.borderBottomRightRadius) || 0, parseFloat(computed.borderBottomLeftRadius) || 0), width / 2, height / 2));
                    const sizeKey = "".concat(width, "x").concat(height, ":").concat(radius, ":").concat(options.thickness);
                    if (previousSize.current === sizeKey) return;
                    previousSize.current = sizeKey;
                    const canvas = document.createElement("canvas");
                    canvas.width = width;
                    canvas.height = height;
                    const context = canvas.getContext("2d");
                    if (!context) return;
                    const map = context.createImageData(width, height);
                    map.data.set((0, liquid_glass /* createGlassMap */ .t6)(width, height, radius, options.thickness));
                    context.putImageData(map, 0, 0);
                    (_image_current = image.current) === null || _image_current === void 0 ? void 0 : _image_current.setAttribute("width", String(width));
                    (_image_current1 = image.current) === null || _image_current1 === void 0 ? void 0 : _image_current1.setAttribute("height", String(height));
                    (_image_current2 = image.current) === null || _image_current2 === void 0 ? void 0 : _image_current2.setAttribute("href", canvas.toDataURL());
                    panel.style.setProperty("--glass-filter", 'url("#'.concat(id, '")'));
                };
                update();
                const observer = new ResizeObserver(update);
                observer.observe(panel);
                return () => observer.disconnect();
            }), [ id, surfaceRef, blur, refraction, thickness ]);
             
            return (0, jsx_runtime.jsx)("svg", {
                className: "glass-lens-definitions",
                "data-component-part": "glass-refraction",
                "data-component-owner": "glass",
                width: "0",
                height: "0",
                "aria-hidden": "true",
                focusable: "false",
                children:   (0, jsx_runtime.jsx)("defs", {
                    children:   (0, jsx_runtime.jsxs)("filter", {
                        id: id,
                        x: "0",
                        y: "0",
                        width: "100%",
                        height: "100%",
                        colorInterpolationFilters: "sRGB",
                        children: [ 
                        
                         (0, jsx_runtime.jsx)("feImage", {
                            ref: image,
                            x: "0",
                            y: "0",
                            preserveAspectRatio: "none",
                            result: "lens"
                        }), 
                        
                         (0, jsx_runtime.jsx)("feDisplacementMap", {
                            in: "SourceGraphic",
                            in2: "lens",
                            scale: filterOptions.refraction,
                            xChannelSelector: "R",
                            yChannelSelector: "G",
                            result: "refracted"
                        }), 
                        
                         (0, jsx_runtime.jsx)("feGaussianBlur", {
                            in: "SourceGraphic",
                            stdDeviation: filterOptions.blur,
                            result: "frosted"
                        }), 
                        
                         (0, jsx_runtime.jsx)("feColorMatrix", {
                            in: "lens",
                            type: "matrix",
                            values: "0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 1 0 0",
                            result: "rim-mask"
                        }), 
                        
                         (0, jsx_runtime.jsx)("feComposite", {
                            in: "refracted",
                            in2: "rim-mask",
                            operator: "in",
                            result: "clear-rim"
                        }), 
                        
                         (0, jsx_runtime.jsx)("feComposite", {
                            in: "frosted",
                            in2: "rim-mask",
                            operator: "out",
                            result: "soft-center"
                        }), 
                        
                         (0, jsx_runtime.jsx)("feComposite", {
                            in: "clear-rim",
                            in2: "soft-center",
                            operator: "arithmetic",
                            k1: "0",
                            k2: "1",
                            k3: "1",
                            k4: "0"
                        }) ]
                    })
                })
            });
        }
        // CONCATENATED MODULE: ./components/LiquidGlass.tsx
        /* __next_internal_client_entry_do_not_use__ default auto */
        // [콘텐츠와 분리된 공통 유리 표면 / Reusable glass without altering its content]
        // 기본값은 디자인 토큰을 따르며 개별 표면만 props로 조정할 수 있습니다.
        // Defaults inherit design tokens; props override only this particular surface.
        const LiquidGlass =   (0, react.forwardRef)((function LiquidGlass(param, forwardedRef) {
            let {children: children, className: className = "", style: style, variant: variant = "surface", opacity: opacity, refraction: refraction, blur: blur, thickness: thickness, ...props} = param;
            const surfaceRef = (0, react.useRef)(null);
            (0, react.useImperativeHandle)(forwardedRef, (() => surfaceRef.current), []);
            const options = (0, liquid_glass /* resolveGlassOptions */ .Cv)({
                opacity: opacity,
                refraction: refraction,
                blur: blur,
                thickness: thickness
            }, variant);
            const surfaceStyle = {};
            if (opacity !== undefined) surfaceStyle["--glass-opacity"] = options.opacity;
            if (refraction !== undefined) surfaceStyle["--glass-refraction"] = options.refraction;
            if (blur !== undefined) surfaceStyle["--glass-blur"] = "".concat(options.blur, "px");
            if (thickness !== undefined) surfaceStyle["--glass-thickness"] = "".concat(options.thickness, "px");
             
            return (0, jsx_runtime.jsxs)("div", {
                "data-component-id": "glass",
                ...props,
                ref: surfaceRef,
                "data-text": "body",
                "data-glass-variant": variant,
                className: "liquid-glass ".concat(className).trim(),
                style: {
                    ...surfaceStyle,
                    ...style
                },
                children: [ 
                
                 (0, jsx_runtime.jsx)(GlassRefraction, {
                    surfaceRef: surfaceRef,
                    blur: blur !== null && blur !== void 0 ? blur : variant !== "surface" ? options.blur : undefined,
                    refraction: refraction !== null && refraction !== void 0 ? refraction : variant !== "surface" ? options.refraction : undefined,
                    thickness: thickness !== null && thickness !== void 0 ? thickness : variant !== "surface" ? options.thickness : undefined
                }), 
                
                 (0, jsx_runtime.jsx)("div", {
                    className: "liquid-glass-optics",
                    "aria-hidden": "true"
                }), children ]
            });
        }));
        /* harmony default export */        var components_LiquidGlass = LiquidGlass;
        /***/    },
    /***/ 6983: 
    /***/ function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ BV: function() {
                /* binding */ return SystemFilterButton;
            },
            /* harmony export */ F0: function() {
                /* binding */ return SystemNotice;
            },
            /* harmony export */ MW: function() {
                /* binding */ return SystemIconButton;
            },
            /* harmony export */ RK: function() {
                /* binding */ return SystemField;
            },
            /* harmony export */ SystemLink: function() {
                /* binding */ return SystemLink;
            },
            /* harmony export */ U1: function() {
                /* binding */ return SystemCheckbox;
            },
            /* harmony export */ WT: function() {
                /* binding */ return SystemBadge;
            },
            /* harmony export */ kR: function() {
                /* binding */ return SystemButton;
            }
            /* harmony export */        });
        /* harmony import */        var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7437);
        /* harmony import */        var next_link__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(7648);
        /* harmony import */        var react__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(2265);
        /* harmony import */        var _Icon__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(9140);
        /* harmony import */        var _LiquidGlass__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(8948);
        /* __next_internal_client_entry_do_not_use__ SystemButton,SystemLink,SystemIconButton,SystemFilterButton,SystemField,SystemCheckbox,SystemBadge,SystemNotice auto */        const SystemButton =   (0, 
        react__WEBPACK_IMPORTED_MODULE_2__.forwardRef)((function SystemButton(param, ref) {
            let {variant: variant = "primary", context: context = "default", shape: shape = "rounded", className: className = "", type: type = "button", "data-component": component = "button", "data-component-id": componentId = "button", ...props} = param;
             
            return (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", {
                "data-text": "action",
                "data-text-size": "control",
                ...props,
                ref: ref,
                type: type,
                "data-component": component,
                "data-component-id": componentId,
                "data-variant": variant,
                "data-context": context,
                "data-shape": shape,
                "data-stroke": "inner",
                "data-autofocus": props.autoFocus || undefined,
                className: "ds-button ds-button-".concat(variant, " ").concat(className).trim()
            });
        }));
        const SystemLink =   (0, react__WEBPACK_IMPORTED_MODULE_2__.forwardRef)((function SystemLink(param, ref) {
            let {variant: variant = "primary", context: context = "default", shape: shape = "rounded", className: className = "", href: href, rel: rel, target: target, ...props} = param;
            const safeRel = target === "_blank" ? [ ...new Set([ ...(rel || "").split(/\s+/).filter(Boolean), "noopener", "noreferrer" ]) ].join(" ") : rel;
            const shared = {
                ref: ref,
                rel: safeRel,
                target: target,
                "data-component": "link",
                "data-component-id": "button-link",
                "data-variant": variant,
                "data-context": context,
                "data-shape": shape,
                "data-stroke": "inner",
                className: "ds-button ds-button-".concat(variant, " ").concat(className).trim()
            };
            if (typeof href === "string" && /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href)) {
                const {prefetch: _prefetch, replace: _replace, scroll: _scroll, shallow: _shallow, locale: _locale, ...anchorProps} = props;
                 
                return (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("a", {
                    "data-text": "action",
                    "data-text-size": "control",
                    ...anchorProps,
                    ...shared,
                    href: href
                });
            }
             
            return (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(next_link__WEBPACK_IMPORTED_MODULE_1__["default"], {
                "data-text": "action",
                "data-text-size": "control",
                ...props,
                ...shared,
                href: href
            });
        }));
        const SystemIconButton =   (0, react__WEBPACK_IMPORTED_MODULE_2__.forwardRef)((function SystemIconButton(param, ref) {
            let {variant: variant = "quiet", className: className = "", shape: shape = "circle", ...props} = param;
             
            return (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(SystemButton, {
                "data-component-id": "icon-button",
                "data-text": "action",
                "data-text-size": "control",
                ...props,
                ref: ref,
                variant: variant,
                shape: shape,
                className: "ds-icon-button ".concat(className).trim(),
                "data-component": "icon-button"
            });
        }));
        const SystemFilterButton =   (0, react__WEBPACK_IMPORTED_MODULE_2__.forwardRef)((function SystemFilterButton(param, ref) {
            let {selected: selected, className: className = "", variant: variant = "quiet", ...props} = param;
             
            return (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(SystemButton, {
                "data-text": "action",
                "data-text-size": "control",
                ...props,
                ref: ref,
                variant: variant,
                "aria-pressed": selected,
                className: "ds-filter-button ".concat(selected ? "is-active " : "").concat(className).trim(),
                "data-component": "filter-button",
                "data-component-id": "filter-button"
            });
        }));
        const SystemField =   (0, react__WEBPACK_IMPORTED_MODULE_2__.forwardRef)((function SystemField(param, ref) {
            let {id: suppliedId, label: label, hint: hint, error: error, variant: variant = "default", labelHidden: labelHidden = false, outerClassName: outerClassName = "", as: as = "input", ...props} = param;
            const generatedId = (0, react__WEBPACK_IMPORTED_MODULE_2__.useId)();
            const id = suppliedId || "field-".concat(generatedId);
            const message = error || hint;
            const describedBy = [ props["aria-describedby"], message ? "".concat(id, "-message") : undefined ].filter(Boolean).join(" ") || undefined;
            const controlProps = {
                ...props,
                id: id,
                "aria-invalid": error ? true : props["aria-invalid"],
                "aria-describedby": describedBy,
                "data-component": "field-control",
                "data-component-part": "control",
                "data-component-owner": "field",
                "data-text-size": "control",
                "data-stroke": "inner",
                "data-autofocus": props.autoFocus || undefined
            };
             
            return (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                "data-text": "body",
                className: "ds-field ".concat(outerClassName).trim(),
                "data-component": "field",
                "data-component-id": "field",
                "data-variant": variant,
                children: [ label != null &&   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("label", {
                    "data-text": "label",
                    "data-component-part": "label",
                    "data-component-owner": "field",
                    htmlFor: id,
                    className: labelHidden ? "ds-visually-hidden" : undefined,
                    children: [ label, props.required && typeof label === "string" &&   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", {
                        "data-text": "body",
                        children: " (필수)"
                    }) ]
                }), as === "select" ?   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("select", {
                    "data-text": "body",
                    ...controlProps,
                    ref: ref
                }) : as === "textarea" ?   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("textarea", {
                    "data-text": "body",
                    ...controlProps,
                    ref: ref
                }) :   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("input", {
                    "data-text": "body",
                    ...controlProps,
                    ref: ref
                }), message &&   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("p", {
                    "data-text": "caption",
                    id: "".concat(id, "-message"),
                    className: error ? "ds-field-error" : "ds-field-hint",
                    children: [ error &&   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* ["default"] */)(_Icon__WEBPACK_IMPORTED_MODULE_3__.Z, {
                        name: "close",
                        size: 20
                    }), message ]
                }) ]
            });
        }));
        const SystemCheckbox =   (0, react__WEBPACK_IMPORTED_MODULE_2__.forwardRef)((function SystemCheckbox(param, ref) {
            let {label: label, id: suppliedId, outerClassName: outerClassName = "", className: className = "", ...props} = param;
            const generatedId = (0, react__WEBPACK_IMPORTED_MODULE_2__.useId)();
            const id = suppliedId || "check-".concat(generatedId);
             
            return (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("label", {
                "data-text": "label",
                className: "ds-check ".concat(outerClassName, " ").concat(className).trim(),
                htmlFor: id,
                "data-component": "checkbox",
                "data-component-id": "checkbox",
                children: [ 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("input", {
                    "data-text": "body",
                    ...props,
                    ref: ref,
                    id: id,
                    type: "checkbox"
                }), label != null &&   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", {
                    "data-text": "body",
                    children: label
                }) ]
            });
        }));
        // [상태 배지와 안내 / Status badges and notices]
                const SystemBadge =   (0, react__WEBPACK_IMPORTED_MODULE_2__.forwardRef)((function SystemBadge(param, ref) {
            let {tone: tone = "neutral", appearance: appearance = "default", className: className = "", ...props} = param;
             
            return (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", {
                "data-text": "meta",
                ...props,
                ref: ref,
                "data-component": "badge",
                "data-component-id": "badge",
                "data-tone": tone,
                "data-appearance": appearance,
                className: "ds-badge ds-badge-".concat(tone, " ").concat(className).trim()
            });
        }));
        const SystemNotice =   (0, react__WEBPACK_IMPORTED_MODULE_2__.forwardRef)((function SystemNotice(param, ref) {
            let {title: title, children: children, error: error = false, variant: variant = "default", className: className = "", role: role, ...props} = param;
             
            return (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs /* ["default"] */)(_LiquidGlass__WEBPACK_IMPORTED_MODULE_4__.Z, {
                ...props,
                ref: ref,
                variant: "white",
                className: "ds-notice ".concat(className).trim(),
                role: role || (error ? "alert" : "status"),
                "data-component": "notice",
                "data-component-id": "notice",
                "data-variant": variant,
                "data-stroke": "inner",
                "data-error": error || undefined,
                children: [ variant !== "flow" &&   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* ["default"] */)(_Icon__WEBPACK_IMPORTED_MODULE_3__.Z, {
                    name: error ? "close" : "check",
                    size: 24
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                    "data-text": "body",
                    children: [ title != null &&   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("strong", {
                        "data-text": "item-title",
                        children: title
                    }), 
                    
                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", {
                        "data-text": "body",
                        className: "ds-notice-content",
                        children: children
                    }) ]
                }) ]
            });
        }));
        /***/    },
    /***/ 1788: 
    /***/ function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ CB: function() {
                /* binding */ return renderDesignTokensCss;
            },
            /* harmony export */ D3: function() {
                /* binding */ return HERO_MOTION;
            },
            /* harmony export */ H3: function() {
                /* binding */ return TEXT_SIZES;
            },
            /* harmony export */ QUICK_MENU_MATERIAL: function() {
                /* binding */ return QUICK_MENU_MATERIAL;
            },
            /* harmony export */ Sv: function() {
                /* binding */ return TEXT_VARIANTS;
            },
            /* harmony export */ Xv: function() {
                /* binding */ return DESIGN_COLORS;
            },
            /* harmony export */ Zs: function() {
                /* binding */ return SPACE_SCALE;
            },
            /* harmony export */ gR: function() {
                /* binding */ return DESIGN_TOKEN_VALUES;
            },
            /* harmony export */ gk: function() {
                /* binding */ return TYPE_SCALE;
            },
            /* harmony export */ kg: function() {
                /* binding */ return SEMANTIC_COLORS;
            },
            /* harmony export */ ot: function() {
                /* binding */ return GLASS_MATERIALS;
            }
            /* harmony export */        });
        /* unused harmony exports COMPONENT_TEXT_SIZES, SEMANTIC_COLOR_VALUES, EXTENDED_COLOR_VALUES, renderTypographyCss */
        // [v5 토큰의 단일 원본 / Single source of truth for v5 design tokens]
        // 브랜드색과 읽기 위계를 유지하며 문서와 CSS를 함께 생성합니다.
        // Preserve brand colors and reading hierarchy in both documentation and CSS.
                const DESIGN_COLORS = [ {
            name: "어스 블랙",
            token: "color-black",
            hex: "#211F1C",
            use: "제목·본문·주요 행동",
            ink: "#FFFEFA"
        }, {
            name: "하늘",
            token: "color-sky",
            hex: "#54C8E8",
            use: "탐색·안내·보조 행동",
            ink: "#211F1C"
        }, {
            name: "노랑",
            token: "color-yellow",
            hex: "#F7D549",
            use: "추천·강조·선택의 포인트",
            ink: "#211F1C"
        }, {
            name: "황토",
            token: "color-ochre",
            hex: "#C36D15",
            use: "문화·브랜드 이야기",
            ink: "#171512"
        }, {
            name: "웜 화이트",
            token: "color-white",
            hex: "#FFFEFA",
            use: "기본 표면·반전 글자",
            ink: "#211F1C"
        }, {
            name: "그레이 050",
            token: "color-gray-050",
            hex: "#F7F7F5",
            use: "보조 표면·예시 배경",
            ink: "#211F1C"
        }, {
            name: "그레이 300",
            token: "color-gray-300",
            hex: "#D9D9D4",
            use: "구분선·장식 경계",
            ink: "#211F1C"
        }, {
            name: "그레이 600",
            token: "color-gray-600",
            hex: "#626262",
            use: "보조 본문·입력 경계",
            ink: "#FFFEFA"
        } ];
        const SEMANTIC_COLORS = [ [ "표면", "background-page", "color-gray-050", "페이지의 보조 바탕" ], [ "표면", "surface-default", "color-white", "페이지와 기본 패널" ], [ "표면", "surface-subtle", "color-gray-050", "보조 영역과 예시 배경" ], [ "표면", "surface-inverse", "color-black", "반전 영역" ], [ "표면", "surface-panel", "color-white", "공통 패널" ], [ "표면", "surface-inset", "color-gray-050", "입력·내부 영역" ], [ "표면", "surface-banner", "color-yellow-subtle", "안내 배너" ], [ "경계", "surface-border", "color-line-gentle", "패널의 부드러운 경계" ], [ "경계", "surface-border-subtle", "color-line-subtle", "안쪽 영역의 경계" ], [ "글자", "text-primary", "color-black", "제목과 본문" ], [ "글자", "text-secondary", "color-gray-600", "설명과 부가 정보" ], [ "글자", "text-inverse", "color-white", "어두운 표면 위 글자" ], [ "글자", "text-on-brand", "color-black", "브랜드색 위 글자" ], [ "경계", "border-default", "color-line-gentle", "부드러운 장식 구분선" ], [ "경계", "border-strong", "color-line-control", "컨트롤의 옅은 안쪽 경계" ], [ "경계", "border-focus", "color-focus", "키보드 조작의 안쪽 초점선" ], [ "행동", "action-primary", "color-black", "예매·확인·신청" ], [ "행동", "action-primary-hover", "color-gray-600", "주요 버튼의 호버" ], [ "행동", "action-secondary", "color-sky", "보조 탐색" ], [ "행동", "action-tertiary", "color-white", "외곽선 행동" ], [ "행동", "action-disabled", "color-disabled-surface", "사용할 수 없는 행동" ], [ "행동", "action-disabled-text", "color-disabled-text", "비활성 행동의 레이블" ], [ "강조", "accent-highlight", "color-yellow", "추천과 짧은 강조" ], [ "강조", "accent-heritage", "color-ochre", "문화 콘텐츠" ], [ "강조", "accent-information", "color-sky", "안내와 탐색 영역" ] ];
        const TYPE_SCALE = [ {
            role: "디스플레이",
            token: "text-display",
            size: 64,
            mobile: 40,
            weight: 700,
            leading: 1.15,
            use: "홈의 핵심 메시지"
        }, {
            role: "페이지 제목",
            token: "text-title",
            size: 48,
            mobile: 36,
            weight: 700,
            leading: 1.25,
            use: "페이지의 유일한 h1"
        }, {
            role: "섹션 제목",
            token: "text-heading",
            size: 32,
            mobile: 28,
            weight: 700,
            leading: 1.25,
            use: "콘텐츠의 큰 구분"
        }, {
            role: "그룹 제목",
            token: "text-subheading",
            size: 24,
            mobile: 24,
            weight: 700,
            leading: 1.4,
            use: "모달·컴포넌트 그룹"
        }, {
            role: "소제목",
            token: "text-item-title",
            size: 20,
            mobile: 20,
            weight: 700,
            leading: 1.5,
            use: "카드·항목의 제목"
        }, {
            role: "리드 문장",
            token: "text-lead",
            size: 18,
            mobile: 18,
            weight: 400,
            leading: 1.7,
            use: "짧은 도입과 요약"
        }, {
            role: "본문",
            token: "text-body",
            size: 16,
            mobile: 16,
            weight: 400,
            leading: 1.7,
            use: "모든 설명의 시작점"
        }, {
            role: "레이블·보조",
            token: "text-sm",
            size: 16,
            mobile: 16,
            weight: 500,
            leading: 1.5,
            use: "날짜·고지·도움말"
        }, {
            role: "주 탐색",
            token: "text-navigation",
            size: 18,
            mobile: 18,
            weight: 500,
            leading: 1.5,
            use: "GNB 메뉴와 푸터 정책·안내 링크"
        }, {
            role: "보조 탐색",
            token: "text-utility",
            size: 16,
            mobile: 16,
            weight: 500,
            leading: 1.5,
            use: "헤더 로그인·프로필·EN 링크"
        } ];
        // [문서 서체 스케일에서 파생한 공유 텍스트 역할 / Shared text roles derived from the documented scale]
                const textVariant = function(type) {
            let tracking = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "-0.015em";
            return {
                token: type.token,
                weight: type.weight,
                leading: type.leading,
                tracking: tracking,
                minimum: type.mobile
            };
        };
        const TEXT_VARIANTS = {
            display: textVariant(TYPE_SCALE[0], "-0.035em"),
            title: textVariant(TYPE_SCALE[1], "-0.035em"),
            heading: textVariant(TYPE_SCALE[2], "-0.035em"),
            subheading: textVariant(TYPE_SCALE[3], "-0.025em"),
            "item-title": textVariant(TYPE_SCALE[4], "-0.025em"),
            lead: textVariant(TYPE_SCALE[5]),
            body: textVariant(TYPE_SCALE[6]),
            label: textVariant(TYPE_SCALE[7]),
            caption: {
                ...textVariant(TYPE_SCALE[7]),
                weight: 400
            },
            action: {
                ...textVariant(TYPE_SCALE[4]),
                token: "text-action",
                weight: 600
            },
            meta: {
                ...textVariant(TYPE_SCALE[7]),
                token: "text-meta"
            },
            navigation: textVariant(TYPE_SCALE[8]),
            utility: textVariant(TYPE_SCALE[9])
        };
        // [역할과 독립적인 글자 크기 축 / Text sizes independent from semantic roles]
                const COMPONENT_TEXT_SIZES = {
            "hero-with-companion": {
                token: "--text-hero-with-companion",
                base: "clamp(2.5rem, 3.7vw, 3.5rem)",
                responsive: [ {
                    maxWidth: 600,
                    value: "clamp(1.875rem, 7vw, 2.5rem)"
                } ]
            },
            "hero-standalone": {
                token: "--text-hero-standalone",
                base: "clamp(2.625rem, 4.3vw, 4.125rem)",
                responsive: [ {
                    maxWidth: 800,
                    value: "2.875rem"
                }, {
                    maxWidth: 600,
                    value: "clamp(2.125rem, 8.5vw, 2.75rem)"
                } ]
            },
            "quick-action": {
                token: "--text-quick-action",
                base: "1rem",
                responsive: []
            }
        };
        const TEXT_SIZES = {
            ...Object.fromEntries(Object.entries(TEXT_VARIANTS).map((param => {
                let [name, definition] = param;
                return [ name, "var(--".concat(definition.token, ")") ];
            }))),
            control: "1rem",
            ...Object.fromEntries(Object.entries(COMPONENT_TEXT_SIZES).map((param => {
                let [name, definition] = param;
                return [ name, "var(".concat(definition.token, ")") ];
            })))
        };
        const SPACE_SCALE = [ 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96 ];
        // [밝고 어두운 알림이 공유하는 렌즈 / One lens for light and dark notifications]
                const NOTIFICATION_GLASS_MATERIAL = Object.freeze({
            opacity: .82,
            refraction: 70,
            blur: 18,
            thickness: 24
        });
        const GLASS_MATERIALS = Object.freeze({
            surface: Object.freeze({
                opacity: .82,
                refraction: 64,
                blur: 18,
                thickness: 32
            }),
            drawer: Object.freeze({
                opacity: .94,
                refraction: 96,
                blur: 24,
                thickness: 40
            }),
            hero: Object.freeze({
                opacity: .84,
                refraction: 72,
                blur: 20,
                thickness: 28
            }),
            white: NOTIFICATION_GLASS_MATERIAL,
            black: NOTIFICATION_GLASS_MATERIAL
        });
        // [퀵메뉴의 유동 재질 / Fluid material confined to the quick menu]
                const QUICK_MENU_MATERIAL = Object.freeze({
            colors: Object.freeze({
                yellow: "--color-yellow",
                lemon: "--color-quick-lemon",
                green: "--color-quick-green",
                mint: "--color-quick-mint",
                ink: "--color-black",
                light: "--color-white",
                clear: "--color-transparent"
            }),
            motion: Object.freeze({
                period: 14,
                desktopFps: 30,
                mobileFps: 24,
                response: 5,
                maxInput: .16
            })
        });
        const rem = pixels => "".concat(pixels / 16, "rem");
        const reference = token => "var(--".concat(token, ")")
        // [의미 기반 중립색과 재질 / Semantic neutrals and materials]
        ;
        const SEMANTIC_COLOR_VALUES = {
            "--color-paper": "#FFFEFA",
            "--color-ink-strong": "#171512",
            "--color-yellow-subtle": "#FCF7DF",
            "--color-line-gentle": "#DFDED7",
            "--color-line-control": "#D9D7CF",
            "--color-line-subtle": "#ECEBE5",
            "--color-disabled-surface": "#E7E6DF",
            "--color-disabled-text": "#706D66",
            "--color-transparent": "rgb(33 31 28 / 0)",
            "--color-overlay-image": "rgb(33 31 28 / 45%)",
            "--color-overlay-image-strong": "rgb(33 31 28 / 75%)",
            "--color-overlay-scrim": "rgb(33 31 28 / 55%)",
            "--color-glass-ink": "#211F1C",
            "--color-glass-edge": "rgb(255 254 250 / 24%)",
            "--color-focus": "#4699AF",
            "--color-state-hover": "#F0F2F4",
            "--color-state-pressed": "#E1E5E9",
            "--color-quick-lemon": "#F5EEA3",
            "--color-quick-green": "#64BC7F",
            "--color-quick-mint": "#B6DF96"
        };
        // [보존된 삽화와 세부 색상의 중앙 팔레트 / Central palette for preserved illustration and detail colors]
        // migrate-visual-contract.ts가 안정된 이름으로 갱신합니다. / Updated deterministically by migrate-visual-contract.ts.
                const EXTENDED_COLOR_VALUES = {
            "--color-detail-00000044": "#00000044",
            "--color-detail-00000077": "#00000077",
            "--color-detail-00000088": "#00000088",
            "--color-detail-000000ee": "#000000EE",
            "--color-detail-054e66": "#054E66",
            "--color-detail-071d1b": "#071D1B",
            "--color-detail-075f7b": "#075F7B",
            "--color-detail-080808": "#080808",
            "--color-detail-08627b": "#08627B",
            "--color-detail-087895": "#087895",
            "--color-detail-0c0c0c": "#0C0C0C",
            "--color-detail-0f2524": "#0F2524",
            "--color-detail-10100e": "#10100E",
            "--color-detail-101011": "#101011",
            "--color-detail-110f16": "#110F16",
            "--color-detail-111111": "#111111",
            "--color-detail-11111133": "#11111133",
            "--color-detail-11111144": "#11111144",
            "--color-detail-11111188": "#11111188",
            "--color-detail-121a9c": "#121A9C",
            "--color-detail-126279": "#126279",
            "--color-detail-12x6dkg": "rgb(255 254 250 / 18%)",
            "--color-detail-139beaa": "rgb(33 31 28 / 30%)",
            "--color-detail-13k7abg": "rgb(239 216 255 / 35%)",
            "--color-detail-14lw51r": "rgb(255 254 250 / 60%)",
            "--color-detail-14wtfau": "rgb(255 254 250 / 23%)",
            "--color-detail-15oygyo": "rgb(255 254 250 / 25%)",
            "--color-detail-161616": "#161616",
            "--color-detail-161a21": "#161A21",
            "--color-detail-163phft": "rgb(255 254 250 / 6%)",
            "--color-detail-171717": "#171717",
            "--color-detail-171b22": "#171B22",
            "--color-detail-172329": "#172329",
            "--color-detail-172b29": "#172B29",
            "--color-detail-173dd1": "#173DD1",
            "--color-detail-174d5c": "#174D5C",
            "--color-detail-179bjkg": "rgb(33 31 28 / 50%)",
            "--color-detail-17idmp2": "rgb(255 254 250 / 30%)",
            "--color-detail-17liqi2": "rgb(232 218 255 / 30%)",
            "--color-detail-181818": "#181818",
            "--color-detail-182c2a": "#182C2A",
            "--color-detail-1836c8": "#1836C8",
            "--color-detail-191918": "#191918",
            "--color-detail-191919": "#191919",
            "--color-detail-191a17": "#191A17",
            "--color-detail-192d2b": "#192D2B",
            "--color-detail-1a1a1a": "#1A1A1A",
            "--color-detail-1b1b16": "#1B1B16",
            "--color-detail-1b1b18": "#1B1B18",
            "--color-detail-1b1b1b": "#1B1B1B",
            "--color-detail-1b1d1b": "#1B1D1B",
            "--color-detail-1b1d1bf2": "#1B1D1BF2",
            "--color-detail-1bdslle": "rgb(238 193 255 / 21%)",
            "--color-detail-1c97p8o": "rgb(182 141 229 / 16%)",
            "--color-detail-1ch9bqq": "rgb(33 31 28 / 16%)",
            "--color-detail-1de21dl": "rgb(236 204 255 / 9%)",
            "--color-detail-1e1e1b": "#1E1E1B",
            "--color-detail-1e2819": "#1E2819",
            "--color-detail-1f2219": "#1F2219",
            "--color-detail-1fsp9pu": "rgb(40 8 77 / 76%)",
            "--color-detail-1iq0iqd": "rgb(33 31 28 / 40%)",
            "--color-detail-1j5u0jr": "rgb(33 31 28 / 20%)",
            "--color-detail-1jm8av": "rgb(17 20 38 / 10%)",
            "--color-detail-1js7397": "rgb(61 9 114 / 64%)",
            "--color-detail-1jw7hzj": "rgb(33 31 28 / 8%)",
            "--color-detail-1lavb2t": "rgb(33 31 28 / 35%)",
            "--color-detail-1omifaq": "rgb(240 200 255 / 16%)",
            "--color-detail-1pw2alg": "rgb(231 190 255 / 43%)",
            "--color-detail-1rqvsa": "rgb(255 254 250 / 12%)",
            "--color-detail-1siqyrm": "rgb(81 20 155 / 65%)",
            "--color-detail-1t09jtc": "rgb(179 117 226 / 34%)",
            "--color-detail-1t95uc2": "rgb(156 76 221 / 58%)",
            "--color-detail-1tk4v13": "rgb(204 128 248 / 76%)",
            "--color-detail-1u8jjjy": "rgb(33 31 28 / 70%)",
            "--color-detail-1vsgs5b": "rgb(47 0 89 / 20%)",
            "--color-detail-1wg1peq": "rgb(178 151 239 / 24%)",
            "--color-detail-20201c": "#20201C",
            "--color-detail-202220": "#202220",
            "--color-detail-202419": "#202419",
            "--color-detail-202919": "#202919",
            "--color-detail-21211b": "#21211B",
            "--color-detail-21211c": "#21211C",
            "--color-detail-21211d": "#21211D",
            "--color-detail-222222": "#222222",
            "--color-detail-22231f": "#22231F",
            "--color-detail-22241c": "#22241C",
            "--color-detail-22251a": "#22251A",
            "--color-detail-22261b": "#22261B",
            "--color-detail-22291b": "#22291B",
            "--color-detail-222a15": "#222A15",
            "--color-detail-222b1a": "#222B1A",
            "--color-detail-222d18": "#222D18",
            "--color-detail-23231c": "#23231C",
            "--color-detail-23231d": "#23231D",
            "--color-detail-23231e": "#23231E",
            "--color-detail-23849a": "#23849A",
            "--color-detail-24241d": "#24241D",
            "--color-detail-242420": "#242420",
            "--color-detail-242424": "#242424",
            "--color-detail-24251e": "#24251E",
            "--color-detail-24291a": "#24291A",
            "--color-detail-25251f": "#25251F",
            "--color-detail-252a25": "#252A25",
            "--color-detail-252b1c": "#252B1C",
            "--color-detail-252c25": "#252C25",
            "--color-detail-25849b": "#25849B",
            "--color-detail-262621": "#262621",
            "--color-detail-262623": "#262623",
            "--color-detail-262b27": "#262B27",
            "--color-detail-27271f": "#27271F",
            "--color-detail-272922": "#272922",
            "--color-detail-27311d": "#27311D",
            "--color-detail-273735": "#273735",
            "--color-detail-282d28": "#282D28",
            "--color-detail-283d48": "#283D48",
            "--color-detail-29291f": "#29291F",
            "--color-detail-292d29": "#292D29",
            "--color-detail-293f59": "#293F59",
            "--color-detail-2br9yp": "rgb(17 20 38 / 12%)",
            "--color-detail-2c302b": "#2C302B",
            "--color-detail-2d321f": "#2D321F",
            "--color-detail-2d3d1d": "#2D3D1D",
            "--color-detail-2d97ae": "#2D97AE",
            "--color-detail-2f372f": "#2F372F",
            "--color-detail-30343a": "#30343A",
            "--color-detail-303925": "#303925",
            "--color-detail-303a31": "#303A31",
            "--color-detail-303a47": "#303A47",
            "--color-detail-303c39": "#303C39",
            "--color-detail-322b43": "#322B43",
            "--color-detail-33332f": "#33332F",
            "--color-detail-333333": "#333333",
            "--color-detail-33352d": "#33352D",
            "--color-detail-33362b": "#33362B",
            "--color-detail-334b5a": "#334B5A",
            "--color-detail-34342f": "#34342F",
            "--color-detail-343530": "#343530",
            "--color-detail-350777": "#350777",
            "--color-detail-353b2c": "#353B2C",
            "--color-detail-36482c": "#36482C",
            "--color-detail-374957": "#374957",
            "--color-detail-37ggme": "rgb(39 4 80 / 96%)",
            "--color-detail-383b32": "#383B32",
            "--color-detail-39443e": "#39443E",
            "--color-detail-3caac0": "#3CAAC0",
            "--color-detail-3f6xa6": "rgb(255 235 255 / 21%)",
            "--color-detail-464646": "#464646",
            "--color-detail-46552b": "#46552B",
            "--color-detail-4a4323": "#4A4323",
            "--color-detail-4a5963": "#4A5963",
            "--color-detail-4c6894": "#4C6894",
            "--color-detail-4d5c65": "#4D5C65",
            "--color-detail-4dcefa": "#4DCEFA",
            "--color-detail-4f4435": "#4F4435",
            "--color-detail-50635b": "#50635B",
            "--color-detail-525c50": "#525C50",
            "--color-detail-52613a": "#52613A",
            "--color-detail-527c7d": "#527C7D",
            "--color-detail-53534b": "#53534B",
            "--color-detail-535a64": "#535A64",
            "--color-detail-53616b": "#53616B",
            "--color-detail-53626d": "#53626D",
            "--color-detail-553a2b": "#553A2B",
            "--color-detail-55554f": "#55554F",
            "--color-detail-555555": "#555555",
            "--color-detail-555e69": "#555E69",
            "--color-detail-556a70": "#556A70",
            "--color-detail-5804a6": "#5804A6",
            "--color-detail-5b5b4f": "#5B5B4F",
            "--color-detail-5c4723": "#5C4723",
            "--color-detail-5c503d": "#5C503D",
            "--color-detail-5c635b": "#5C635B",
            "--color-detail-5c685c": "#5C685C",
            "--color-detail-5d625c": "#5D625C",
            "--color-detail-5d6c58": "#5D6C58",
            "--color-detail-5e3931": "#5E3931",
            "--color-detail-5e4935": "#5E4935",
            "--color-detail-5e5e52": "#5E5E52",
            "--color-detail-5f39f9": "#5F39F9",
            "--color-detail-5f5316": "#5F5316",
            "--color-detail-5f602f": "#5F602F",
            "--color-detail-60605b": "#60605B",
            "--color-detail-61685e": "#61685E",
            "--color-detail-61685f": "#61685F",
            "--color-detail-626256": "#626256",
            "--color-detail-62685c": "#62685C",
            "--color-detail-626872": "#626872",
            "--color-detail-627d76": "#627D76",
            "--color-detail-6309da": "#6309DA",
            "--color-detail-633c26": "#633C26",
            "--color-detail-63655e": "#63655E",
            "--color-detail-63695f": "#63695F",
            "--color-detail-646052": "#646052",
            "--color-detail-646961": "#646961",
            "--color-detail-6509b3": "#6509B3",
            "--color-detail-65675d": "#65675D",
            "--color-detail-656a61": "#656A61",
            "--color-detail-657055": "#657055",
            "--color-detail-657142": "#657142",
            "--color-detail-66573f": "#66573F",
            "--color-detail-665840": "#665840",
            "--color-detail-665c42": "#665C42",
            "--color-detail-66665c": "#66665C",
            "--color-detail-666d62": "#666D62",
            "--color-detail-66727a": "#66727A",
            "--color-detail-667d53": "#667D53",
            "--color-detail-676552": "#676552",
            "--color-detail-67675e": "#67675E",
            "--color-detail-686962": "#686962",
            "--color-detail-686b5e": "#686B5E",
            "--color-detail-696b60": "#696B60",
            "--color-detail-697064": "#697064",
            "--color-detail-69767e": "#69767E",
            "--color-detail-69865c": "#69865C",
            "--color-detail-6a7657": "#6A7657",
            "--color-detail-6b5037": "#6B5037",
            "--color-detail-6b6750": "#6B6750",
            "--color-detail-6b7666": "#6B7666",
            "--color-detail-6c6f67": "#6C6F67",
            "--color-detail-6c7363": "#6C7363",
            "--color-detail-6e0758": "#6E0758",
            "--color-detail-6e6e64": "#6E6E64",
            "--color-detail-6e765c": "#6E765C",
            "--color-detail-6f7868": "#6F7868",
            "--color-detail-704329": "#704329",
            "--color-detail-707569": "#707569",
            "--color-detail-714e38": "#714E38",
            "--color-detail-715640": "#715640",
            "--color-detail-717165": "#717165",
            "--color-detail-717466": "#717466",
            "--color-detail-718b65": "#718B65",
            "--color-detail-718c62": "#718C62",
            "--color-detail-72563b": "#72563B",
            "--color-detail-726348": "#726348",
            "--color-detail-727268": "#727268",
            "--color-detail-727269": "#727269",
            "--color-detail-72726b": "#72726B",
            "--color-detail-727764": "#727764",
            "--color-detail-72d6f1": "#72D6F1",
            "--color-detail-73736d": "#73736D",
            "--color-detail-73766f": "#73766F",
            "--color-detail-73776e": "#73776E",
            "--color-detail-737a84": "#737A84",
            "--color-detail-737e6e": "#737E6E",
            "--color-detail-73s3tq": "rgb(170 111 231 / 24%)",
            "--color-detail-74746c": "#74746C",
            "--color-detail-74746d": "#74746D",
            "--color-detail-74746e": "#74746E",
            "--color-detail-74786d": "#74786D",
            "--color-detail-755336": "#755336",
            "--color-detail-756044": "#756044",
            "--color-detail-757569": "#757569",
            "--color-detail-75756b": "#75756B",
            "--color-detail-757570": "#757570",
            "--color-detail-766401": "#766401",
            "--color-detail-767670": "#767670",
            "--color-detail-776a2f": "#776A2F",
            "--color-detail-77776a": "#77776A",
            "--color-detail-77776b": "#77776B",
            "--color-detail-77776d": "#77776D",
            "--color-detail-77776e": "#77776E",
            "--color-detail-77776f": "#77776F",
            "--color-detail-777777": "#777777",
            "--color-detail-77786e": "#77786E",
            "--color-detail-77786f": "#77786F",
            "--color-detail-77796c": "#77796C",
            "--color-detail-777a70": "#777A70",
            "--color-detail-78786b": "#78786B",
            "--color-detail-796516": "#796516",
            "--color-detail-79796d": "#79796D",
            "--color-detail-79d0dc": "#79D0DC",
            "--color-detail-7a7a70": "#7A7A70",
            "--color-detail-7a806a": "#7A806A",
            "--color-detail-7b7763": "#7B7763",
            "--color-detail-7c7041": "#7C7041",
            "--color-detail-7c7c76": "#7C7C76",
            "--color-detail-7c806e": "#7C806E",
            "--color-detail-7c976b": "#7C976B",
            "--color-detail-7d816e": "#7D816E",
            "--color-detail-7d846c": "#7D846C",
            "--color-detail-7e7e70": "#7E7E70",
            "--color-detail-7e836f": "#7E836F",
            "--color-detail-7f826f": "#7F826F",
            "--color-detail-7qpf9v": "rgb(106 43 173 / 96%)",
            "--color-detail-805e3d": "#805E3D",
            "--color-detail-808074": "#808074",
            "--color-detail-818173": "#818173",
            "--color-detail-818174": "#818174",
            "--color-detail-81837e": "#81837E",
            "--color-detail-818976": "#818976",
            "--color-detail-828274": "#828274",
            "--color-detail-838773": "#838773",
            "--color-detail-838b75": "#838B75",
            "--color-detail-839d6b": "#839D6B",
            "--color-detail-858579": "#858579",
            "--color-detail-85857d": "#85857D",
            "--color-detail-858975": "#858975",
            "--color-detail-86867e": "#86867E",
            "--color-detail-88887e": "#88887E",
            "--color-detail-889486": "#889486",
            "--color-detail-89897d": "#89897D",
            "--color-detail-89897e": "#89897E",
            "--color-detail-898e7a": "#898E7A",
            "--color-detail-8a8a7c": "#8A8A7C",
            "--color-detail-8a8a83": "#8A8A83",
            "--color-detail-8a8a84": "#8A8A84",
            "--color-detail-8a8b7f": "#8A8B7F",
            "--color-detail-8b7657": "#8B7657",
            "--color-detail-8b7714": "#8B7714",
            "--color-detail-8c7c58": "#8C7C58",
            "--color-detail-8d683f": "#8D683F",
            "--color-detail-8d9988": "#8D9988",
            "--color-detail-8e603c": "#8E603C",
            "--color-detail-8e7a02": "#8E7A02",
            "--color-detail-8e9d8c": "#8E9D8C",
            "--color-detail-8mqyna": "rgb(96 44 175 / 32%)",
            "--color-detail-8pxgz2": "rgb(48 0 102 / 26%)",
            "--color-detail-8r0uv5": "rgb(255 254 250 / 40%)",
            "--color-detail-91a778": "#91A778",
            "--color-detail-929284": "#929284",
            "--color-detail-929879": "#929879",
            "--color-detail-93938a": "#93938A",
            "--color-detail-93ac91": "#93AC91",
            "--color-detail-947450": "#947450",
            "--color-detail-97978a": "#97978A",
            "--color-detail-99480b": "#99480B",
            "--color-detail-999999": "#999999",
            "--color-detail-99g6h2": "rgb(39 1 78 / 32%)",
            "--color-detail-9a8256": "#9A8256",
            "--color-detail-9a998d": "#9A998D",
            "--color-detail-9a9a8b": "#9A9A8B",
            "--color-detail-9ae0e8": "#9AE0E8",
            "--color-detail-9d693c": "#9D693C",
            "--color-detail-9d774a": "#9D774A",
            "--color-detail-9e7c50": "#9E7C50",
            "--color-detail-9e8767": "#9E8767",
            "--color-detail-9f3326": "#9F3326",
            "--color-detail-9mf0a5": "rgb(129 64 188 / 25%)",
            "--color-detail-a08200": "#A08200",
            "--color-detail-a09377": "#A09377",
            "--color-detail-a0b188": "#A0B188",
            "--color-detail-a29476": "#A29476",
            "--color-detail-a38055": "#A38055",
            "--color-detail-a39983": "#A39983",
            "--color-detail-a42bfa": "#A42BFA",
            "--color-detail-a47245": "#A47245",
            "--color-detail-a48b08": "#A48B08",
            "--color-detail-a59570": "#A59570",
            "--color-detail-a6a08c": "#A6A08C",
            "--color-detail-a71910": "#A71910",
            "--color-detail-a77f53": "#A77F53",
            "--color-detail-a8adb4": "#A8ADB4",
            "--color-detail-a97748": "#A97748",
            "--color-detail-a9b3a6": "#A9B3A6",
            "--color-detail-aa9d79": "#AA9D79",
            "--color-detail-ae3327": "#AE3327",
            "--color-detail-ae9465": "#AE9465",
            "--color-detail-aea00c": "#AEA00C",
            "--color-detail-b09165": "#B09165",
            "--color-detail-b0b5a4": "#B0B5A4",
            "--color-detail-b0b7a0": "#B0B7A0",
            "--color-detail-b1aa85": "#B1AA85",
            "--color-detail-b1c39c": "#B1C39C",
            "--color-detail-b28323": "#B28323",
            "--color-detail-b29961": "#B29961",
            "--color-detail-b29b10": "#B29B10",
            "--color-detail-b2a780": "#B2A780",
            "--color-detail-b42318": "#B42318",
            "--color-detail-b4b4a8": "#B4B4A8",
            "--color-detail-b4c3d3": "#B4C3D3",
            "--color-detail-b4c8aa": "#B4C8AA",
            "--color-detail-b59365": "#B59365",
            "--color-detail-b5b5ab": "#B5B5AB",
            "--color-detail-b5d9e9": "#B5D9E9",
            "--color-detail-b69002": "#B69002",
            "--color-detail-b6a620": "#B6A620",
            "--color-detail-b6a9d7": "#B6A9D7",
            "--color-detail-b6b6b6": "#B6B6B6",
            "--color-detail-b7ab8a": "#B7AB8A",
            "--color-detail-b84432": "#B84432",
            "--color-detail-b86939": "#B86939",
            "--color-detail-b8ae92": "#B8AE92",
            "--color-detail-b8dadd": "#B8DADD",
            "--color-detail-b95749": "#B95749",
            "--color-detail-b98d5c": "#B98D5C",
            "--color-detail-b99a70": "#B99A70",
            "--color-detail-b9a47c": "#B9A47C",
            "--color-detail-b9ac82": "#B9AC82",
            "--color-detail-b9ad91": "#B9AD91",
            "--color-detail-b9bbae": "#B9BBAE",
            "--color-detail-ba8c62": "#BA8C62",
            "--color-detail-ba976a": "#BA976A",
            "--color-detail-ba9860": "#BA9860",
            "--color-detail-bac7ce": "#BAC7CE",
            "--color-detail-bcc4b6": "#BCC4B6",
            "--color-detail-bcc5a8": "#BCC5A8",
            "--color-detail-bcd3ed": "#BCD3ED",
            "--color-detail-bd5445": "#BD5445",
            "--color-detail-bd8852": "#BD8852",
            "--color-detail-bd8954": "#BD8954",
            "--color-detail-bda876": "#BDA876",
            "--color-detail-bdbeb5": "#BDBEB5",
            "--color-detail-bdc5a8": "#BDC5A8",
            "--color-detail-bea06c": "#BEA06C",
            "--color-detail-bf7250": "#BF7250",
            "--color-detail-bfbfba": "#BFBFBA",
            "--color-detail-bfc4ca": "#BFC4CA",
            "--color-detail-c1ad85": "#C1AD85",
            "--color-detail-c1c6b5": "#C1C6B5",
            "--color-detail-c1c8d0": "#C1C8D0",
            "--color-detail-c27r9n": "rgb(234 200 252 / 44%)",
            "--color-detail-c3c8ad": "#C3C8AD",
            "--color-detail-c3ced3": "#C3CED3",
            "--color-detail-c5a16e": "#C5A16E",
            "--color-detail-c5a271": "#C5A271",
            "--color-detail-c5ab7d": "#C5AB7D",
            "--color-detail-c64c3d": "#C64C3D",
            "--color-detail-c6c6bf": "#C6C6BF",
            "--color-detail-c7ad7d": "#C7AD7D",
            "--color-detail-c7b951": "#C7B951",
            "--color-detail-c7b98e": "#C7B98E",
            "--color-detail-c7b991": "#C7B991",
            "--color-detail-c7c7bb": "#C7C7BB",
            "--color-detail-c7c9bd": "#C7C9BD",
            "--color-detail-c7cac0": "#C7CAC0",
            "--color-detail-c7cbd1": "#C7CBD1",
            "--color-detail-c8a568": "#C8A568",
            "--color-detail-c8b37f": "#C8B37F",
            "--color-detail-c98151": "#C98151",
            "--color-detail-c9af82": "#C9AF82",
            "--color-detail-c9c9b8": "#C9C9B8",
            "--color-detail-c9ccd0": "#C9CCD0",
            "--color-detail-cacfc0": "#CACFC0",
            "--color-detail-caoojg": "rgb(188 154 242 / 24%)",
            "--color-detail-cbd0c0": "#CBD0C0",
            "--color-detail-cbdcde": "#CBDCDE",
            "--color-detail-cbf0e8": "#CBF0E8",
            "--color-detail-ccb276": "#CCB276",
            "--color-detail-ccc6ad": "#CCC6AD",
            "--color-detail-cccccc": "#CCCCCC",
            "--color-detail-cdddac": "#CDDDAC",
            "--color-detail-cdddce": "#CDDDCE",
            "--color-detail-cebd91": "#CEBD91",
            "--color-detail-cedfe0": "#CEDFE0",
            "--color-detail-cfa778": "#CFA778",
            "--color-detail-cfcfc6": "#CFCFC6",
            "--color-detail-cfd3be": "#CFD3BE",
            "--color-detail-d0b924": "#D0B924",
            "--color-detail-d0b925": "#D0B925",
            "--color-detail-d0cdba": "#D0CDBA",
            "--color-detail-d19972": "#D19972",
            "--color-detail-d1aaa0": "#D1AAA0",
            "--color-detail-d1d1c8": "#D1D1C8",
            "--color-detail-d2d6c0": "#D2D6C0",
            "--color-detail-d3d7c6": "#D3D7C6",
            "--color-detail-d3ff35": "#D3FF35",
            "--color-detail-d4c9a8": "#D4C9A8",
            "--color-detail-d4cdba": "#D4CDBA",
            "--color-detail-d4d9de": "#D4D9DE",
            "--color-detail-d4dfe3": "#D4DFE3",
            "--color-detail-d5ab5d": "#D5AB5D",
            "--color-detail-d5b786": "#D5B786",
            "--color-detail-d5b88d": "#D5B88D",
            "--color-detail-d5d3ce": "#D5D3CE",
            "--color-detail-d5d5cd": "#D5D5CD",
            "--color-detail-d5d9d0": "#D5D9D0",
            "--color-detail-d6b585": "#D6B585",
            "--color-detail-d6c2ec": "#D6C2EC",
            "--color-detail-d6d6d0": "#D6D6D0",
            "--color-detail-d6d9dc": "#D6D9DC",
            "--color-detail-d6dadd": "#D6DADD",
            "--color-detail-d6f83f": "#D6F83F",
            "--color-detail-d7d0b8": "#D7D0B8",
            "--color-detail-d7d7cd": "#D7D7CD",
            "--color-detail-d7dadd": "#D7DADD",
            "--color-detail-d7dbc9": "#D7DBC9",
            "--color-detail-d7ddc3": "#D7DDC3",
            "--color-detail-d8b68a": "#D8B68A",
            "--color-detail-d8d8d0": "#D8D8D0",
            "--color-detail-d8d8d2": "#D8D8D2",
            "--color-detail-d8dacd": "#D8DACD",
            "--color-detail-d9be81": "#D9BE81",
            "--color-detail-d9cfb7": "#D9CFB7",
            "--color-detail-d9d6c5": "#D9D6C5",
            "--color-detail-d9d9d1": "#D9D9D1",
            "--color-detail-d9dcd1": "#D9DCD1",
            "--color-detail-d9dcd4": "#D9DCD4",
            "--color-detail-d9ddcb": "#D9DDCB",
            "--color-detail-d9gs3q": "rgb(33 31 28 / 85%)",
            "--color-detail-d9usyp": "rgb(255 236 255 / 50%)",
            "--color-detail-dadad4": "#DADAD4",
            "--color-detail-dadcc8": "#DADCC8",
            "--color-detail-dbcfb5": "#DBCFB5",
            "--color-detail-dbdbd3": "#DBDBD3",
            "--color-detail-dcdcd3": "#DCDCD3",
            "--color-detail-dcdcd4": "#DCDCD4",
            "--color-detail-dcdcd5": "#DCDCD5",
            "--color-detail-dcded1": "#DCDED1",
            "--color-detail-dcded2": "#DCDED2",
            "--color-detail-dcded3": "#DCDED3",
            "--color-detail-dce0d5": "#DCE0D5",
            "--color-detail-dce3e6": "#DCE3E6",
            "--color-detail-ddc398": "#DDC398",
            "--color-detail-dddddd": "#DDDDDD",
            "--color-detail-ddded3": "#DDDED3",
            "--color-detail-ddded6": "#DDDED6",
            "--color-detail-dde0c6": "#DDE0C6",
            "--color-detail-dde1d7": "#DDE1D7",
            "--color-detail-dec237": "#DEC237",
            "--color-detail-ded6c2": "#DED6C2",
            "--color-detail-deded6": "#DEDED6",
            "--color-detail-deded7": "#DEDED7",
            "--color-detail-deded8": "#DEDED8",
            "--color-detail-deded9": "#DEDED9",
            "--color-detail-dedfd4": "#DEDFD4",
            "--color-detail-dedfd5": "#DEDFD5",
            "--color-detail-dfdfd6": "#DFDFD6",
            "--color-detail-dfdfd7": "#DFDFD7",
            "--color-detail-dfdfd8": "#DFDFD8",
            "--color-detail-dfe1d5": "#DFE1D5",
            "--color-detail-dfe5d4": "#DFE5D4",
            "--color-detail-dfe6c6": "#DFE6C6",
            "--color-detail-e0cb38": "#E0CB38",
            "--color-detail-e0e0d8": "#E0E0D8",
            "--color-detail-e0e2e5": "#E0E2E5",
            "--color-detail-e1c69d": "#E1C69D",
            "--color-detail-e1e1da": "#E1E1DA",
            "--color-detail-e1e3d6": "#E1E3D6",
            "--color-detail-e1e3dc": "#E1E3DC",
            "--color-detail-e1e7e9": "#E1E7E9",
            "--color-detail-e2c59a": "#E2C59A",
            "--color-detail-e2cea0": "#E2CEA0",
            "--color-detail-e2e2d9": "#E2E2D9",
            "--color-detail-e2e4d6": "#E2E4D6",
            "--color-detail-e2eef0": "#E2EEF0",
            "--color-detail-e3c799": "#E3C799",
            "--color-detail-e3e8d6": "#E3E8D6",
            "--color-detail-e4b257": "#E4B257",
            "--color-detail-e4bcff": "#E4BCFF",
            "--color-detail-e4d17y": "rgb(155 96 224 / 38%)",
            "--color-detail-e4d9bf": "#E4D9BF",
            "--color-detail-e4e3db": "#E4E3DB",
            "--color-detail-e4e4de": "#E4E4DE",
            "--color-detail-e4e5df": "#E4E5DF",
            "--color-detail-e4e8df": "#E4E8DF",
            "--color-detail-e4f6fc": "#E4F6FC",
            "--color-detail-e5bf92": "#E5BF92",
            "--color-detail-e5ce37": "#E5CE37",
            "--color-detail-e5d4a8": "#E5D4A8",
            "--color-detail-e5e4db": "#E5E4DB",
            "--color-detail-e5e5de": "#E5E5DE",
            "--color-detail-e5e8ec": "#E5E8EC",
            "--color-detail-e5e9ec": "#E5E9EC",
            "--color-detail-e6b7ad": "#E6B7AD",
            "--color-detail-e6e6e0": "#E6E6E0",
            "--color-detail-e6f3f8": "#E6F3F8",
            "--color-detail-e72a65": "#E72A65",
            "--color-detail-e7bf26": "#E7BF26",
            "--color-detail-e7cda1": "#E7CDA1",
            "--color-detail-e7d7b0": "#E7D7B0",
            "--color-detail-e7f7fc": "#E7F7FC",
            "--color-detail-e8c982": "#E8C982",
            "--color-detail-e8d9ac": "#E8D9AC",
            "--color-detail-e8dd9c": "#E8DD9C",
            "--color-detail-e8e3d1": "#E8E3D1",
            "--color-detail-e8e8e1": "#E8E8E1",
            "--color-detail-e9e2d3": "#E9E2D3",
            "--color-detail-e9e9e2": "#E9E9E2",
            "--color-detail-e9edf0": "#E9EDF0",
            "--color-detail-ead3ff": "#EAD3FF",
            "--color-detail-ead7a5": "#EAD7A5",
            "--color-detail-eaf2de": "#EAF2DE",
            "--color-detail-eaff54": "#EAFF54",
            "--color-detail-ebe0c2": "#EBE0C2",
            "--color-detail-ece3c5": "#ECE3C5",
            "--color-detail-ece4a7": "#ECE4A7",
            "--color-detail-ece9df": "#ECE9DF",
            "--color-detail-ececdb": "#ECECDB",
            "--color-detail-ecece6": "#ECECE6",
            "--color-detail-eceee8": "#ECEEE8",
            "--color-detail-edeede": "#EDEEDE",
            "--color-detail-edefe1": "#EDEFE1",
            "--color-detail-edf0f2": "#EDF0F2",
            "--color-detail-eeede7": "#EEEDE7",
            "--color-detail-eeeeda": "#EEEEDA",
            "--color-detail-eeeee7": "#EEEEE7",
            "--color-detail-eeefe7": "#EEEFE7",
            "--color-detail-eef0f2": "#EEF0F2",
            "--color-detail-eef3f5": "#EEF3F5",
            "--color-detail-efe9d6": "#EFE9D6",
            "--color-detail-efeee8": "#EFEEE8",
            "--color-detail-eff5f3": "#EFF5F3",
            "--color-detail-eff8fa": "#EFF8FA",
            "--color-detail-eqxzkj": "rgb(163 101 229 / 27%)",
            "--color-detail-f0bc74": "#F0BC74",
            "--color-detail-f0d5aa": "#F0D5AA",
            "--color-detail-f0db00": "#F0DB00",
            "--color-detail-f0f0e7": "#F0F0E7",
            "--color-detail-f0f0eb": "#F0F0EB",
            "--color-detail-f0f0ec": "#F0F0EC",
            "--color-detail-f0f1ef": "#F0F1EF",
            "--color-detail-f1e1d0": "#F1E1D0",
            "--color-detail-f1e8cf": "#F1E8CF",
            "--color-detail-f1f1e9": "#F1F1E9",
            "--color-detail-f1f4f5": "#F1F4F5",
            "--color-detail-f1f5e6": "#F1F5E6",
            "--color-detail-f2ccca": "#F2CCCA",
            "--color-detail-f2d8ff": "#F2D8FF",
            "--color-detail-f2dc45": "#F2DC45",
            "--color-detail-f2f1e9": "#F2F1E9",
            "--color-detail-f2f4f6": "#F2F4F6",
            "--color-detail-f3de4e": "#F3DE4E",
            "--color-detail-f3e577": "#F3E577",
            "--color-detail-f3ecd8": "#F3ECD8",
            "--color-detail-f3edd9": "#F3EDD9",
            "--color-detail-f3f2ed": "#F3F2ED",
            "--color-detail-f3f4ea": "#F3F4EA",
            "--color-detail-f3f4f4": "#F3F4F4",
            "--color-detail-f3f5f7": "#F3F5F7",
            "--color-detail-f3f7f8": "#F3F7F8",
            "--color-detail-f4e1bb": "#F4E1BB",
            "--color-detail-f4f3eb": "#F4F3EB",
            "--color-detail-f4f3ed": "#F4F3ED",
            "--color-detail-f4f4eb": "#F4F4EB",
            "--color-detail-f4f4ed": "#F4F4ED",
            "--color-detail-f4f5ef": "#F4F5EF",
            "--color-detail-f5be38": "#F5BE38",
            "--color-detail-f5e4c7": "#F5E4C7",
            "--color-detail-f5e6bb": "#F5E6BB",
            "--color-detail-f5e8c7": "#F5E8C7",
            "--color-detail-f5edd8": "#F5EDD8",
            "--color-detail-f5f2da": "#F5F2DA",
            "--color-detail-f5f4eb": "#F5F4EB",
            "--color-detail-f5f4ef": "#F5F4EF",
            "--color-detail-f5f5e9": "#F5F5E9",
            "--color-detail-f5f5ef": "#F5F5EF",
            "--color-detail-f5f5f0": "#F5F5F0",
            "--color-detail-f5f5f1": "#F5F5F1",
            "--color-detail-f5f6f8": "#F5F6F8",
            "--color-detail-f6db55": "#F6DB55",
            "--color-detail-f6e45d": "#F6E45D",
            "--color-detail-f6e7ca": "#F6E7CA",
            "--color-detail-f6edcb": "#F6EDCB",
            "--color-detail-f6f6e7": "#F6F6E7",
            "--color-detail-f6f6f0": "#F6F6F0",
            "--color-detail-f6f6f1": "#F6F6F1",
            "--color-detail-f6f6f2": "#F6F6F2",
            "--color-detail-f6f7f8": "#F6F7F8",
            "--color-detail-f75d89": "#F75D89",
            "--color-detail-f7be39": "#F7BE39",
            "--color-detail-f7e7b2": "#F7E7B2",
            "--color-detail-f7ead4": "#F7EAD4",
            "--color-detail-f7ed9d": "#F7ED9D",
            "--color-detail-f7eedb": "#F7EEDB",
            "--color-detail-f7f1c1": "#F7F1C1",
            "--color-detail-f7f1ff": "#F7F1FF",
            "--color-detail-f7f2de": "#F7F2DE",
            "--color-detail-f7f5e9": "#F7F5E9",
            "--color-detail-f7f6ed": "#F7F6ED",
            "--color-detail-f7f6ee": "#F7F6EE",
            "--color-detail-f7f6f3": "#F7F6F3",
            "--color-detail-f7f7f3": "#F7F7F3",
            "--color-detail-f7f9ec": "#F7F9EC",
            "--color-detail-f8f2e4": "#F8F2E4",
            "--color-detail-f8f3ca": "#F8F3CA",
            "--color-detail-f8f4dd": "#F8F4DD",
            "--color-detail-f9ed93": "#F9ED93",
            "--color-detail-f9f5e8": "#F9F5E8",
            "--color-detail-f9f7e9": "#F9F7E9",
            "--color-detail-fa4388": "#FA4388",
            "--color-detail-faf6e6": "#FAF6E6",
            "--color-detail-faf6e8": "#FAF6E8",
            "--color-detail-faf7e4": "#FAF7E4",
            "--color-detail-faf8e9": "#FAF8E9",
            "--color-detail-faf8ea": "#FAF8EA",
            "--color-detail-fafaf7": "#FAFAF7",
            "--color-detail-fce7ae": "#FCE7AE",
            "--color-detail-fdf8e8": "#FDF8E8",
            "--color-detail-ff477a": "#FF477A",
            "--color-detail-ffdf36": "#FFDF36",
            "--color-detail-ffdf58": "#FFDF58",
            "--color-detail-ffe26b": "#FFE26B",
            "--color-detail-ffe2a1": "#FFE2A1",
            "--color-detail-ffe2a6": "#FFE2A6",
            "--color-detail-ffe3a4": "#FFE3A4",
            "--color-detail-ffe6a5": "#FFE6A5",
            "--color-detail-ffe7a3": "#FFE7A3",
            "--color-detail-fff0e4": "#FFF0E4",
            "--color-detail-fff1ed": "#FFF1ED",
            "--color-detail-fff1ee": "#FFF1EE",
            "--color-detail-fff2ba": "#FFF2BA",
            "--color-detail-fff3a2": "#FFF3A2",
            "--color-detail-fff5cb": "#FFF5CB",
            "--color-detail-fff7df": "#FFF7DF",
            "--color-detail-fff8ca": "#FFF8CA",
            "--color-detail-fff8dc": "#FFF8DC",
            "--color-detail-fff8e9": "#FFF8E9",
            "--color-detail-fff9da": "#FFF9DA",
            "--color-detail-fff9ec": "#FFF9EC",
            "--color-detail-fffbea": "#FFFBEA",
            "--color-detail-fffced": "#FFFCED",
            "--color-detail-fffdf2": "#FFFDF2",
            "--color-detail-ffffee": "#FFFFEE",
            "--color-detail-ffffff22": "#FFFFFF22",
            "--color-detail-ffffff26": "#FFFFFF26",
            "--color-detail-ffffff28": "#FFFFFF28",
            "--color-detail-ffffff30": "#FFFFFF30",
            "--color-detail-ffffff33": "#FFFFFF33",
            "--color-detail-ffffff40": "#FFFFFF40",
            "--color-detail-ffffff65": "#FFFFFF65",
            "--color-detail-ffffff80": "#FFFFFF80",
            "--color-detail-ffffff99": "#FFFFFF99",
            "--color-detail-ffffffdc": "#FFFFFFDC",
            "--color-detail-fffffff0": "#FFFFFFF0",
            "--color-detail-g7n4k3": "rgb(31 0 61 / 65%)",
            "--color-detail-gjyglo": "rgb(47 0 89 / 25%)",
            "--color-detail-ib91mg": "rgb(216 187 247 / 5%)",
            "--color-detail-iotdbu": "rgb(203 175 250 / 28%)",
            "--color-detail-j5afio": "rgb(33 31 28 / 0)",
            "--color-detail-mjz8r2": "rgb(255 254 250 / 16%)",
            "--color-detail-n7n144": "rgb(36 0 75 / 13%)",
            "--color-detail-prp61c": "rgb(150 113 217 / 8%)",
            "--color-detail-q2jxzr": "rgb(255 254 250 / 42%)",
            "--color-detail-q2uykl": "rgb(181 136 236 / 16%)",
            "--color-detail-ry75lp": "rgb(142 87 207 / 9%)",
            "--color-detail-setddf": "rgb(37 0 82 / 60%)",
            "--color-detail-vgt87r": "rgb(33 31 28 / 15%)",
            "--color-detail-vtqr3w": "rgb(222 189 255 / 34%)",
            "--color-detail-xl0sze": "rgb(255 254 250 / 70%)",
            "--color-detail-xx4fx2": "rgb(33 31 28 / 12%)",
            "--color-detail-y9l2zu": "rgb(119 66 186 / 36%)",
            "--color-detail-ycvx6o": "rgb(33 31 28 / 14%)",
            "--color-detail-zcuhjm": "rgb(245 210 255 / 43%)"
        };
        // [기존 컴포넌트의 호환 이름 / Compatibility aliases for existing components]
                const COMPATIBILITY_TOKENS = {
            "--paper": reference("surface-default"),
            "--paper-subtle": reference("surface-subtle"),
            "--soft": reference("background-page"),
            "--ink": reference("text-primary"),
            "--ink-secondary": reference("text-secondary"),
            "--muted": reference("text-secondary"),
            "--line": reference("border-default"),
            "--line-subtle": reference("border-default"),
            "--primary": reference("action-primary"),
            "--primary-foreground": reference("text-inverse"),
            "--accent": reference("accent-highlight"),
            "--accent-foreground": reference("text-on-brand"),
            "--sky": reference("color-sky"),
            "--earth": reference("color-ochre"),
            "--human": reference("color-yellow"),
            "--yellow": reference("human"),
            "--yellow-dark": "color-mix(in srgb, var(--human) 90%, var(--color-black))",
            "--semantic-success": reference("text-primary"),
            "--semantic-success-subtle": reference("surface-subtle"),
            "--semantic-success-border": reference("border-strong"),
            "--semantic-error": reference("color-black"),
            "--semantic-error-subtle": reference("surface-subtle"),
            "--semantic-error-border": reference("border-strong"),
            "--semantic-warning": reference("color-ochre"),
            "--semantic-warning-subtle": reference("surface-subtle"),
            "--semantic-warning-border": reference("border-default"),
            "--semantic-info": reference("color-sky"),
            "--semantic-info-subtle": reference("surface-subtle"),
            "--semantic-info-border": reference("border-default")
        };
        // [읽기 위계와 로컬 서체 / Reading hierarchy and local font]
                const FLUID_TYPE_VIEWPORTS = {
            "text-display": "5vw",
            "text-title": "3.5vw",
            "text-heading": "2.5vw"
        };
        const TYPOGRAPHY_TOKENS = {
            "--text-min": rem(16),
            ...Object.fromEntries(Object.values(COMPONENT_TEXT_SIZES).map((definition => [ definition.token, definition.base ]))),
            ...Object.fromEntries(TYPE_SCALE.map((type => [ "--".concat(type.token), FLUID_TYPE_VIEWPORTS[type.token] ? "clamp(".concat(rem(type.mobile), ", ").concat(FLUID_TYPE_VIEWPORTS[type.token], ", ").concat(rem(type.size), ")") : rem(type.size) ]))),
            "--text-action": rem(20),
            "--text-card-title": rem(20),
            "--text-meta": rem(16),
            "--text-menu-link": reference("text-lead"),
            "--text-menu-group": reference("text-subheading"),
            "--weight-body": "400",
            "--weight-label": "500",
            "--weight-action": "600",
            "--weight-title": "700",
            "--weight-heading": "700",
            "--leading-body": "1.7",
            "--leading-label": "1.5",
            "--leading-heading": "1.25",
            "--tracking-body": "-0.015em",
            "--tracking-heading": "-0.035em",
            "--font": '"Wanted Sans Variable", "Wanted Sans", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif',
            "--font-sans": reference("font"),
            "--display-font": reference("font")
        };
        // [배치와 조작 크기 / Layout and interaction dimensions]
        // refinement에서 실제 적용되던 곡률과 섹션 간격을 보존합니다.
        // Preserve the radius and section spacing previously supplied by refinements.
                const GEOMETRY_TOKENS = {
            ...Object.fromEntries(SPACE_SCALE.map((value => [ "--space-".concat(value / 4), rem(value) ]))),
            "--container": "108rem",
            "--page-gutter": "clamp(1.25rem, 2.5vw, 3rem)",
            "--content-reading-width": "72ch",
            "--content-form-width": "40rem",
            "--hero-card-width": "90rem",
            "--hero-peek": "clamp(1rem, 7vw, 10rem)",
            "--hero-gap": "clamp(0.75rem, 1.4vw, 1.5rem)",
            "--section-gap": "clamp(5rem, 7vw, 7rem)",
            "--control-size": rem(48),
            "--icon-header-action-size": rem(28),
            "--shortcut-size": rem(64),
            "--control-flow-button-size": "50px",
            "--control-flow-field-size": "54px",
            "--radius": "0.875rem",
            "--radius-media": "1rem",
            "--radius-banner": "1.25rem",
            "--radius-sm": "8px",
            "--radius-md": "12px",
            "--radius-lg": "20px",
            "--radius-control": "12px",
            "--radius-flow": "14px",
            "--radius-dialog": "28px",
            "--radius-pill": "9999px",
            "--surface-radius-panel": "1.25rem",
            "--surface-radius-compact": "1rem",
            "--surface-radius-dialog": reference("radius-dialog"),
            "--stroke-width": "1px",
            "--stroke-control": reference("color-line-control"),
            "--stroke-selected": "color-mix(in srgb, var(--color-sky) 45%, var(--color-line-gentle))",
            "--stroke-inverse": "color-mix(in srgb, var(--color-white) 36%, var(--color-transparent))",
            "--surface-shadow-elevated": "0 12px 36px color-mix(in srgb, var(--color-black) 8%, var(--color-transparent))"
        };
        // [히어로의 공유 시간 규격 / Shared hero timing contract]
                const HERO_MOTION = Object.freeze({
            interval: 3500,
            transition: 750,
            copy: 650,
            settle: 240
        });
        // [색으로 표현하는 상태와 전환 / Color feedback and transition timing]
                const MOTION_AND_STATE_TOKENS = {
            "--state-hover": reference("color-state-hover"),
            "--state-pressed": reference("color-state-pressed"),
            "--focus-color": reference("color-focus"),
            "--focus-on-brand": "color-mix(in srgb, var(--color-sky) 25%, var(--color-black))",
            "--focus-on-dark": "color-mix(in srgb, var(--color-white) 76%, var(--color-transparent))",
            "--focus-width": "3px",
            "--focus-offset": "-3px",
            "--feedback-duration": "160ms",
            "--duration-fast": "120ms",
            "--duration-feedback": "180ms",
            "--duration-panel": "320ms",
            "--duration-carousel": "".concat(HERO_MOTION.transition, "ms"),
            "--duration-hero-copy": "".concat(HERO_MOTION.copy, "ms"),
            "--duration-hero-settle": "".concat(HERO_MOTION.settle, "ms"),
            "--ease-carousel": "cubic-bezier(0.22, 0.61, 0.36, 1)",
            "--ease-standard": "cubic-bezier(0.2, 0, 0, 1)",
            "--ease-out": "cubic-bezier(0.22, 1, 0.36, 1)"
        };
        const GLASS_TOKENS = {
            ...Object.fromEntries(Object.entries(GLASS_MATERIALS).flatMap((param => {
                let [variant, material] = param;
                const prefix = variant === "surface" ? "--glass" : "--glass-".concat(variant);
                return Object.entries(material).map((param => {
                    let [property, value] = param;
                    return [ "".concat(prefix, "-").concat(property), "".concat(value).concat(property === "blur" || property === "thickness" ? "px" : "") ];
                }));
            }))),
            "--glass-tint": "color-mix(in srgb, var(--color-white) calc(var(--glass-opacity) * 100%), var(--color-transparent))",
            "--glass-saturation": "1.4",
            "--glass-edge": "color-mix(in srgb, var(--color-white) 88%, var(--color-transparent))",
            "--glass-shadow": "0 24px 80px color-mix(in srgb, var(--color-black) 18%, var(--color-transparent)), 0 4px 16px color-mix(in srgb, var(--color-black) 9%, var(--color-transparent))"
        };
        // [문서와 배포 CSS가 공유하는 값 / Values shared by the guide and production CSS]
                const DESIGN_TOKEN_VALUES = Object.freeze({
            ...Object.fromEntries(DESIGN_COLORS.map((color => [ "--".concat(color.token), color.hex ]))),
            ...SEMANTIC_COLOR_VALUES,
            ...EXTENDED_COLOR_VALUES,
            ...Object.fromEntries(SEMANTIC_COLORS.map((param => {
                let [, token, source] = param;
                return [ "--".concat(token), reference(source) ];
            }))),
            ...COMPATIBILITY_TOKENS,
            ...TYPOGRAPHY_TOKENS,
            ...GEOMETRY_TOKENS,
            ...MOTION_AND_STATE_TOKENS,
            ...GLASS_TOKENS
        });
        // [원본 로컬 폰트 선언을 보존하는 결정적 CSS 생성 / Deterministic CSS preserving the local font face]
                function renderDesignTokensCss() {
            let extraColors = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
            const componentSizes = Object.values(COMPONENT_TEXT_SIZES);
            const breakpoints = [ ...new Set(componentSizes.flatMap((definition => definition.responsive.map((rule => rule.maxWidth))))) ].sort(((first, second) => second - first));
            const responsive = breakpoints.map((maxWidth => {
                const declarations = componentSizes.flatMap((definition => definition.responsive.filter((rule => rule.maxWidth === maxWidth)).map((rule => "        ".concat(definition.token, ": ").concat(rule.value, ";")))));
                return "@media (max-width: ".concat(maxWidth, "px) {\n    :root {\n").concat(declarations.join("\n"), "\n    }\n}");
            })).join("\n\n");
            const declarations = Object.entries({
                ...DESIGN_TOKEN_VALUES,
                ...extraColors
            }).map((param => {
                let [token, value] = param;
                return "    ".concat(token, ": ").concat(value, ";");
            })).join("\n");
            return '/* [v5 디자인 토큰 / v5 design tokens]\n   src/data/design-tokens.ts에서 생성됩니다. / Generated from src/data/design-tokens.ts.\n   node scripts/sync-design-tokens.ts --check */\n@font-face {\n    font-family: "Wanted Sans Variable";\n    src: url("/v5/assets/fonts/woff2/WantedSansVariable.woff2") format("woff2-variations"),\n         url("/assets/fonts/woff2/WantedSansVariable.woff2") format("woff2-variations"),\n         url("/v5/assets/fonts/woff2/WantedSansVariable.woff2") format("woff2"),\n         url("/assets/fonts/woff2/WantedSansVariable.woff2") format("woff2");\n    font-weight: 400 1000;\n    font-style: normal;\n    font-display: swap;\n}\n\n:root {\n'.concat(declarations, "\n}\n\n").concat(responsive, "\n");
        }
        // [공유 컴포넌트의 역할별 CSS 생성 / Generate role styles for the shared text component]
                function renderTypographyCss() {
            const variants = Object.entries(TEXT_VARIANTS).map((param => {
                let [variant, definition] = param;
                return '[data-text="'.concat(variant, '"] {\n    font-size: max(var(--text-min), var(--').concat(definition.token, "));\n    font-weight: ").concat(definition.weight, ";\n    line-height: ").concat(definition.leading, ";\n    letter-spacing: ").concat(definition.tracking, ";\n}");
            })).join("\n\n");
            const sizes = Object.entries(TEXT_SIZES).map((param => {
                let [size, value] = param;
                return '[data-text][data-text-size="'.concat(size, '"] {\n    font-size: max(var(--text-min), ').concat(value, ");\n}");
            })).join("\n\n");
            return "/* [공유 텍스트 역할과 최소 가독성 / Shared text roles and minimum readability]\n   src/data/design-tokens.ts에서 생성됩니다. / Generated from src/data/design-tokens.ts.\n   data-text는 기존 요소의 위계를 보존합니다. / Native data-text annotations preserve existing hierarchy. */\n:where(h5, h6, small, sub, sup) {\n    font-size: max(var(--text-min), 1em);\n}\n\n".concat(variants, "\n\n").concat(sizes, "\n");
        }
        /***/    },
    /***/ 9174: 
    /***/ function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ Cv: function() {
                /* binding */ return resolveGlassOptions;
            },
            /* harmony export */ Fp: function() {
                /* binding */ return GLASS_DEFAULTS;
            },
            /* harmony export */ GD: function() {
                /* binding */ return GLASS_VARIANTS;
            },
            /* harmony export */ t6: function() {
                /* binding */ return createGlassMap;
            }
            /* harmony export */        });
        /* unused harmony export glassDisplacement */
        /* harmony import */        var _data_design_tokens_ts__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(1788);
        // [공통 유리의 재질 / Shared glass material]
                const GLASS_DEFAULTS = _data_design_tokens_ts__WEBPACK_IMPORTED_MODULE_0__ /* .GLASS_MATERIALS */ .ot.surface;
        // [용도에 따른 재질 베리언트 / Material variants by purpose]
                const GLASS_VARIANTS = _data_design_tokens_ts__WEBPACK_IMPORTED_MODULE_0__ /* .GLASS_MATERIALS */ .ot;
        function resolveGlassOptions(options) {
            let variant = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "surface";
            const defaults = GLASS_VARIANTS[variant];
            const bounded = (value, fallback, min, max) => Math.max(min, Math.min(Number.isFinite(value) ? value : fallback, max));
            return {
                opacity: bounded(options.opacity, defaults.opacity, 0, 1),
                refraction: bounded(options.refraction, defaults.refraction, 0, 120),
                blur: bounded(options.blur, defaults.blur, 0, 40),
                thickness: bounded(options.thickness, defaults.thickness, 1, 64)
            };
        }
        // [굴절은 가장자리에만 / Refraction at the rim, an undistorted reading area]
                function glassDisplacement(x, y, width, height, radius, rim) {
            const cx = x - width / 2;
            const cy = y - height / 2;
            const qx = Math.abs(cx) - (width / 2 - radius);
            const qy = Math.abs(cy) - (height / 2 - radius);
            const ox = Math.max(qx, 0);
            const oy = Math.max(qy, 0);
            const length = Math.hypot(ox, oy);
            const depth = -(length + Math.min(Math.max(qx, qy), 0) - radius);
            if (depth < 0 || depth >= rim) return {
                x: 0,
                y: 0
            };
            const strength = Math.cos(depth / rim * Math.PI / 2) ** 2;
            const nx = length > 0 ? ox / length : qx > qy ? 1 : 0;
            const ny = length > 0 ? oy / length : qy >= qx ? 1 : 0;
            return {
                x: Math.sign(cx) * nx * strength,
                y: Math.sign(cy) * ny * strength
            };
        }
        // [굴절 방향과 투명한 테두리의 지도 / Displacement vectors and a clear-rim mask]
        // R/G는 굴절 방향, B는 맑은 가장자리의 혼합 비율입니다.
        // R/G encode displacement; B blends the clear rim with the frosted center.
                function createGlassMap(width, height, radius, thickness) {
            const map = new Uint8ClampedArray(width * height * 4);
            const rim = Math.min(thickness, width / 3, height / 3);
            const reach = Math.ceil(Math.max(radius, rim));
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const index = (y * width + x) * 4;
                    let dx = 0;
                    let dy = 0;
                    if (x < reach || x > width - reach || y < reach || y > height - reach) {
                        const normal = glassDisplacement(x, y, width, height, radius, rim);
                        dx = normal.x;
                        dy = normal.y;
                    }
                    map[index] = Math.round(128 + dx * 127);
                    map[index + 1] = Math.round(128 + dy * 127);
                    map[index + 2] = Math.round(Math.hypot(dx, dy) * 255);
                    map[index + 3] = 255;
                }
            }
            return map;
        }
        /***/    },
    /***/ 1666: 
    /***/ function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ Ax: function() {
                /* binding */ return ROOM_THEMES;
            },
            /* harmony export */ BF: function() {
                /* binding */ return SURFACE_RADII;
            },
            /* harmony export */ Ec: function() {
                /* binding */ return CONTROL_SHAPES;
            },
            /* harmony export */ F9: function() {
                /* binding */ return contractExamples;
            },
            /* harmony export */ Gi: function() {
                /* binding */ return APPEARANCES;
            },
            /* harmony export */ J4: function() {
                /* binding */ return SURFACE_VARIANTS;
            },
            /* harmony export */ Nq: function() {
                /* binding */ return BADGE_TONES;
            },
            /* harmony export */ Pd: function() {
                /* binding */ return CONTROL_CONTEXTS;
            },
            /* harmony export */ Pz: function() {
                /* binding */ return TICKET_VARIANTS;
            },
            /* harmony export */ RV: function() {
                /* binding */ return HERO_SLIDE_PREVIEWS;
            },
            /* harmony export */ U$: function() {
                /* binding */ return ICON_GROUPS;
            },
            /* harmony export */ VD: function() {
                /* binding */ return MEMBERSHIP_MODES;
            },
            /* harmony export */ Xk: function() {
                /* binding */ return FIELD_ELEMENTS;
            },
            /* harmony export */ Zd: function() {
                /* binding */ return HEADER_ACTION_ICONS;
            },
            /* harmony export */ _X: function() {
                /* binding */ return CONTROL_VARIANTS;
            },
            /* harmony export */ bN: function() {
                /* binding */ return HERO_SLIDE_LAYOUTS;
            },
            /* harmony export */ fC: function() {
                /* binding */ return isHeaderActionIcon;
            },
            /* harmony export */ nV: function() {
                /* binding */ return SURFACE_PADDINGS;
            },
            /* harmony export */ p4: function() {
                /* binding */ return PANEL_PRESENTATIONS;
            },
            /* harmony export */ xj: function() {
                /* binding */ return TAB_ORIENTATIONS;
            }
            /* harmony export */        });
        // [실제 속성과 문서가 함께 사용하는 축 / Axes shared by implementation props and documentation]
                const CONTROL_VARIANTS = [ "primary", "secondary", "accent", "highlight", "quiet", "inverse", "inverse-outline", "inverse-quiet" ];
        const CONTROL_CONTEXTS = [ "default", "flow" ];
        const CONTROL_SHAPES = [ "rounded", "circle", "pill" ];
        const FIELD_ELEMENTS = [ "input", "select", "textarea" ];
        const BADGE_TONES = [ "neutral", "highlight", "info" ];
        const APPEARANCES = [ "default", "plain" ];
        const TAB_ORIENTATIONS = [ "horizontal", "vertical" ];
        const SURFACE_VARIANTS = [ "panel", "subtle", "inset", "banner", "elevated" ];
        const SURFACE_PADDINGS = [ "none", "sm", "md", "lg" ];
        const SURFACE_RADII = [ "panel", "compact", "dialog" ];
        const HERO_SLIDE_LAYOUTS = [ "standalone", "with-companion" ];
        const HERO_SLIDE_PREVIEWS = [ "previous", "next" ];
        const ROOM_THEMES = [ "paper", "sky", "sun" ];
        const MEMBERSHIP_MODES = [ "loading", "guest", "demo", "oauth" ];
        const TICKET_VARIANTS = [ "compact", "full" ];
        const PANEL_PRESENTATIONS = [ "floating", "drawer" ];
        // [헤더 핵심 조작만 확대 / Enlarge only the two primary header actions]
                const ICON_GROUPS = [ "general", "header-action" ];
        const HEADER_ACTION_ICONS = [ "search", "menu" ];
        function isHeaderActionIcon(name) {
            return HEADER_ACTION_ICONS.includes(name);
        }
        // [안정적인 실물 예시 앵커 / Stable anchors for live implementation examples]
                function contractExamples(id) {
            let axes = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, states = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : [];
            return [ ...Object.entries(axes).flatMap((param => {
                let [axis, values] = param;
                return values.map((value => ({
                    id: "example-".concat(id, "-").concat(axis, "-").concat(value),
                    axis: axis,
                    value: value
                })));
            })), ...states.map((state => ({
                id: "example-".concat(id, "-state-").concat(state),
                state: state
            }))) ];
        }
        /***/    }
} ]);
//# sourceMappingURL=GlassRefraction_1.js.map