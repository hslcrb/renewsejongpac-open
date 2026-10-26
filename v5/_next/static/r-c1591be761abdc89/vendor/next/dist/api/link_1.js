"use strict";

(self["webpackChunk_N_E"] = self["webpackChunk_N_E"] || []).push([ [ 648 ], {
    /***/ 7648: 
    /***/ function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        /* harmony export */ __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ default: function() {
                /* reexport default from dynamic */ return _client_link__WEBPACK_IMPORTED_MODULE_0___default.a;
            }
            /* harmony export */        });
        /* harmony import */        var _client_link__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(2972);
        /* harmony import */        var _client_link__WEBPACK_IMPORTED_MODULE_0___default =  __webpack_require__.n(_client_link__WEBPACK_IMPORTED_MODULE_0__);
        //# sourceMappingURL=link.js.map
        /***/    },
    /***/ 5449: 
    /***/ function(module, exports, __webpack_require__) {
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
        Object.defineProperty(exports, "addLocale", {
            enumerable: true,
            get: function() {
                return addLocale;
            }
        });
        const _normalizetrailingslash = __webpack_require__(8521);
        const addLocale = function(path) {
            for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                args[_key - 1] = arguments[_key];
            }
            if (false) {}
            return path;
        };
        if ((typeof exports.default === "function" || typeof exports.default === "object" && exports.default !== null) && typeof exports.default.__esModule === "undefined") {
            Object.defineProperty(exports.default, "__esModule", {
                value: true
            });
            Object.assign(exports.default, exports);
            module.exports = exports.default;
        }
 //# sourceMappingURL=add-locale.js.map
        /***/    },
    /***/ 6958: 
    /***/ function(module, exports, __webpack_require__) {
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
        Object.defineProperty(exports, "getDomainLocale", {
            enumerable: true,
            get: function() {
                return getDomainLocale;
            }
        });
        const _normalizetrailingslash = __webpack_require__(8521);
        const basePath = /* unused pure expression or super */ null && ("/v5" || 0);
        function getDomainLocale(path, locale, locales, domainLocales) {
            if (false) {} else {
                return false;
            }
        }
        if ((typeof exports.default === "function" || typeof exports.default === "object" && exports.default !== null) && typeof exports.default.__esModule === "undefined") {
            Object.defineProperty(exports.default, "__esModule", {
                value: true
            });
            Object.assign(exports.default, exports);
            module.exports = exports.default;
        }
 //# sourceMappingURL=get-domain-locale.js.map
        /***/    },
    /***/ 2972: 
    /***/ function(module, exports, __webpack_require__) {
        /* __next_internal_client_entry_do_not_use__  cjs */
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
        Object.defineProperty(exports, "default", {
            enumerable: true,
            get: function() {
                return _default;
            }
        });
        const _interop_require_default = __webpack_require__(7043);
        const _jsxruntime = __webpack_require__(7437);
        const _react =  _interop_require_default._(__webpack_require__(2265));
        const _resolvehref = __webpack_require__(5246);
        const _islocalurl = __webpack_require__(3552);
        const _formaturl = __webpack_require__(7497);
        const _utils = __webpack_require__(3987);
        const _addlocale = __webpack_require__(5449);
        const _routercontextsharedruntime = __webpack_require__(5523);
        const _approutercontextsharedruntime = __webpack_require__(1956);
        const _useintersection = __webpack_require__(6081);
        const _getdomainlocale = __webpack_require__(6958);
        const _addbasepath = __webpack_require__(1634);
        const _routerreducertypes = __webpack_require__(4673);
        const prefetched = new Set;
        function prefetch(router, href, as, options, appOptions, isAppRouter) {
            if (typeof window === "undefined") {
                return;
            }
            // app-router supports external urls out of the box so it shouldn't short-circuit here as support for e.g. `replace` is added in the app-router.
                        if (!isAppRouter && !(0, _islocalurl.isLocalURL)(href)) {
                return;
            }
            // We should only dedupe requests when experimental.optimisticClientCache is
            // disabled.
                        if (!options.bypassPrefetchedCheck) {
                const locale = typeof options.locale !== "undefined" ? options.locale : "locale" in router ? router.locale : undefined;
                const prefetchedKey = href + "%" + as + "%" + locale;
                // If we've already fetched the key, then don't prefetch it again!
                                if (prefetched.has(prefetchedKey)) {
                    return;
                }
                // Mark this URL as prefetched.
                                prefetched.add(prefetchedKey);
            }
            const doPrefetch = async () => {
                if (isAppRouter) {
                    // note that `appRouter.prefetch()` is currently sync,
                    // so we have to wrap this call in an async function to be able to catch() errors below.
                    return router.prefetch(href, appOptions);
                } else {
                    return router.prefetch(href, as, options);
                }
            };
            // Prefetch the JSON page if asked (only in the client)
            // We need to handle a prefetch error here since we may be
            // loading with priority which can reject but we don't
            // want to force navigation since this is only a prefetch
                        doPrefetch().catch((err => {
                if (false) {}
            }));
        }
        function isModifiedEvent(event) {
            const eventTarget = event.currentTarget;
            const target = eventTarget.getAttribute("target");
            return target && target !== "_self" || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || // triggers resource download
            event.nativeEvent && event.nativeEvent.which === 2;
        }
        function linkClicked(e, router, href, as, replace, shallow, scroll, locale, isAppRouter) {
            const {nodeName: nodeName} = e.currentTarget;
            // anchors inside an svg have a lowercase nodeName
                        const isAnchorNodeName = nodeName.toUpperCase() === "A";
            if (isAnchorNodeName && (isModifiedEvent(e) || // app-router supports external urls out of the box so it shouldn't short-circuit here as support for e.g. `replace` is added in the app-router.
            !isAppRouter && !(0, _islocalurl.isLocalURL)(href))) {
                // ignore click for browser’s default behavior
                return;
            }
            e.preventDefault();
            const navigate = () => {
                // If the router is an NextRouter instance it will have `beforePopState`
                const routerScroll = scroll != null ? scroll : true;
                if ("beforePopState" in router) {
                    router[replace ? "replace" : "push"](href, as, {
                        shallow: shallow,
                        locale: locale,
                        scroll: routerScroll
                    });
                } else {
                    router[replace ? "replace" : "push"](as || href, {
                        scroll: routerScroll
                    });
                }
            };
            if (isAppRouter) {
                _react.default.startTransition(navigate);
            } else {
                navigate();
            }
        }
        function formatStringOrUrl(urlObjOrString) {
            if (typeof urlObjOrString === "string") {
                return urlObjOrString;
            }
            return (0, _formaturl.formatUrl)(urlObjOrString);
        }
        /**
 * A React component that extends the HTML `<a>` element to provide [prefetching](https://nextjs.org/docs/app/building-your-application/routing/linking-and-navigating#2-prefetching)
 * and client-side navigation between routes.
 *
 * It is the primary way to navigate between routes in Next.js.
 *
 * Read more: [Next.js docs: `<Link>`](https://nextjs.org/docs/app/api-reference/components/link)
 */        const Link =  _react.default.forwardRef((function LinkComponent(props, forwardedRef) {
            let children;
            const {href: hrefProp, as: asProp, children: childrenProp, prefetch: prefetchProp = null, passHref: passHref, replace: replace, shallow: shallow, scroll: scroll, locale: locale, onClick: onClick, onMouseEnter: onMouseEnterProp, onTouchStart: onTouchStartProp, legacyBehavior: legacyBehavior = false, ...restProps} = props;
            children = childrenProp;
            if (legacyBehavior && (typeof children === "string" || typeof children === "number")) {
                children =   (0, _jsxruntime.jsx)("a", {
                    children: children
                });
            }
            const pagesRouter = _react.default.useContext(_routercontextsharedruntime.RouterContext);
            const appRouter = _react.default.useContext(_approutercontextsharedruntime.AppRouterContext);
            const router = pagesRouter != null ? pagesRouter : appRouter;
            // We're in the app directory if there is no pages router.
                        const isAppRouter = !pagesRouter;
            const prefetchEnabled = prefetchProp !== false;
            /**
     * The possible states for prefetch are:
     * - null: this is the default "auto" mode, where we will prefetch partially if the link is in the viewport
     * - true: we will prefetch if the link is visible and prefetch the full page, not just partially
     * - false: we will not prefetch if in the viewport at all
     */            const appPrefetchKind = prefetchProp === null ? _routerreducertypes.PrefetchKind.AUTO : _routerreducertypes.PrefetchKind.FULL;
            if (false) {}
            if (false) {}
            const {href: href, as: as} = _react.default.useMemo((() => {
                if (!pagesRouter) {
                    const resolvedHref = formatStringOrUrl(hrefProp);
                    return {
                        href: resolvedHref,
                        as: asProp ? formatStringOrUrl(asProp) : resolvedHref
                    };
                }
                const [resolvedHref, resolvedAs] = (0, _resolvehref.resolveHref)(pagesRouter, hrefProp, true);
                return {
                    href: resolvedHref,
                    as: asProp ? (0, _resolvehref.resolveHref)(pagesRouter, asProp) : resolvedAs || resolvedHref
                };
            }), [ pagesRouter, hrefProp, asProp ]);
            const previousHref = _react.default.useRef(href);
            const previousAs = _react.default.useRef(as);
            // This will return the first child, if multiple are provided it will throw an error
                        let child;
            if (legacyBehavior) {
                if (false) {} else {
                    child = _react.default.Children.only(children);
                }
            } else {
                if (false) {}
            }
            const childRef = legacyBehavior ? child && typeof child === "object" && child.ref : forwardedRef;
            const [setIntersectionRef, isVisible, resetVisible] = (0, _useintersection.useIntersection)({
                rootMargin: "200px"
            });
            const setRef = _react.default.useCallback((el => {
                // Before the link getting observed, check if visible state need to be reset
                if (previousAs.current !== as || previousHref.current !== href) {
                    resetVisible();
                    previousAs.current = as;
                    previousHref.current = href;
                }
                setIntersectionRef(el);
                if (childRef) {
                    if (typeof childRef === "function") childRef(el); else if (typeof childRef === "object") {
                        childRef.current = el;
                    }
                }
            }), [ as, childRef, href, resetVisible, setIntersectionRef ]);
            // Prefetch the URL if we haven't already and it's visible.
                        _react.default.useEffect((() => {
                // in dev, we only prefetch on hover to avoid wasting resources as the prefetch will trigger compiling the page.
                if (false) {}
                if (!router) {
                    return;
                }
                // If we don't need to prefetch the URL, don't do prefetch.
                                if (!isVisible || !prefetchEnabled) {
                    return;
                }
                // Prefetch the URL.
                                prefetch(router, href, as, {
                    locale: locale
                }, {
                    kind: appPrefetchKind
                }, isAppRouter);
            }), [ as, href, isVisible, locale, prefetchEnabled, pagesRouter == null ? void 0 : pagesRouter.locale, router, isAppRouter, appPrefetchKind ]);
            const childProps = {
                ref: setRef,
                onClick(e) {
                    if (false) {}
                    if (!legacyBehavior && typeof onClick === "function") {
                        onClick(e);
                    }
                    if (legacyBehavior && child.props && typeof child.props.onClick === "function") {
                        child.props.onClick(e);
                    }
                    if (!router) {
                        return;
                    }
                    if (e.defaultPrevented) {
                        return;
                    }
                    linkClicked(e, router, href, as, replace, shallow, scroll, locale, isAppRouter);
                },
                onMouseEnter(e) {
                    if (!legacyBehavior && typeof onMouseEnterProp === "function") {
                        onMouseEnterProp(e);
                    }
                    if (legacyBehavior && child.props && typeof child.props.onMouseEnter === "function") {
                        child.props.onMouseEnter(e);
                    }
                    if (!router) {
                        return;
                    }
                    if ((!prefetchEnabled || "production" === "development") && isAppRouter) {
                        return;
                    }
                    prefetch(router, href, as, {
                        locale: locale,
                        priority: true,
                        // @see {https://github.com/vercel/next.js/discussions/40268?sort=top#discussioncomment-3572642}
                        bypassPrefetchedCheck: true
                    }, {
                        kind: appPrefetchKind
                    }, isAppRouter);
                },
                onTouchStart: false ? 0 : function onTouchStart(e) {
                    if (!legacyBehavior && typeof onTouchStartProp === "function") {
                        onTouchStartProp(e);
                    }
                    if (legacyBehavior && child.props && typeof child.props.onTouchStart === "function") {
                        child.props.onTouchStart(e);
                    }
                    if (!router) {
                        return;
                    }
                    if (!prefetchEnabled && isAppRouter) {
                        return;
                    }
                    prefetch(router, href, as, {
                        locale: locale,
                        priority: true,
                        // @see {https://github.com/vercel/next.js/discussions/40268?sort=top#discussioncomment-3572642}
                        bypassPrefetchedCheck: true
                    }, {
                        kind: appPrefetchKind
                    }, isAppRouter);
                }
            };
            // If child is an <a> tag and doesn't have a href attribute, or if the 'passHref' property is
            // defined, we specify the current 'href', so that repetition is not needed by the user.
            // If the url is absolute, we can bypass the logic to prepend the domain and locale.
                        if ((0, _utils.isAbsoluteUrl)(as)) {
                childProps.href = as;
            } else if (!legacyBehavior || passHref || child.type === "a" && !("href" in child.props)) {
                const curLocale = typeof locale !== "undefined" ? locale : pagesRouter == null ? void 0 : pagesRouter.locale;
                // we only render domain locales if we are currently on a domain locale
                // so that locale links are still visitable in development/preview envs
                                const localeDomain = (pagesRouter == null ? void 0 : pagesRouter.isLocaleDomain) && (0, 
                _getdomainlocale.getDomainLocale)(as, curLocale, pagesRouter == null ? void 0 : pagesRouter.locales, pagesRouter == null ? void 0 : pagesRouter.domainLocales);
                childProps.href = localeDomain || (0, _addbasepath.addBasePath)((0, _addlocale.addLocale)(as, curLocale, pagesRouter == null ? void 0 : pagesRouter.defaultLocale));
            }
            return legacyBehavior ?  _react.default.cloneElement(child, childProps) :   (0, 
            _jsxruntime.jsx)("a", {
                ...restProps,
                ...childProps,
                children: children
            });
        }));
        const _default = Link;
        if ((typeof exports.default === "function" || typeof exports.default === "object" && exports.default !== null) && typeof exports.default.__esModule === "undefined") {
            Object.defineProperty(exports.default, "__esModule", {
                value: true
            });
            Object.assign(exports.default, exports);
            module.exports = exports.default;
        }
 //# sourceMappingURL=link.js.map
        /***/    },
    /***/ 3515: 
    /***/ function(module, exports) {
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
        0 && 0;
        function _export(target, all) {
            for (var name in all) Object.defineProperty(target, name, {
                enumerable: true,
                get: all[name]
            });
        }
        _export(exports, {
            cancelIdleCallback: function() {
                return cancelIdleCallback;
            },
            requestIdleCallback: function() {
                return requestIdleCallback;
            }
        });
        const requestIdleCallback = typeof self !== "undefined" && self.requestIdleCallback && self.requestIdleCallback.bind(window) || function(cb) {
            let start = Date.now();
            return self.setTimeout((function() {
                cb({
                    didTimeout: false,
                    timeRemaining: function() {
                        return Math.max(0, 50 - (Date.now() - start));
                    }
                });
            }), 1);
        };
        const cancelIdleCallback = typeof self !== "undefined" && self.cancelIdleCallback && self.cancelIdleCallback.bind(window) || function(id) {
            return clearTimeout(id);
        };
        if ((typeof exports.default === "function" || typeof exports.default === "object" && exports.default !== null) && typeof exports.default.__esModule === "undefined") {
            Object.defineProperty(exports.default, "__esModule", {
                value: true
            });
            Object.assign(exports.default, exports);
            module.exports = exports.default;
        }
 //# sourceMappingURL=request-idle-callback.js.map
        /***/    },
    /***/ 5246: 
    /***/ function(module, exports, __webpack_require__) {
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
        Object.defineProperty(exports, "resolveHref", {
            enumerable: true,
            get: function() {
                return resolveHref;
            }
        });
        const _querystring = __webpack_require__(8637);
        const _formaturl = __webpack_require__(7497);
        const _omit = __webpack_require__(7053);
        const _utils = __webpack_require__(3987);
        const _normalizetrailingslash = __webpack_require__(8521);
        const _islocalurl = __webpack_require__(3552);
        const _utils1 = __webpack_require__(6279);
        const _interpolateas = __webpack_require__(7205);
        function resolveHref(router, href, resolveAs) {
            // we use a dummy base url for relative urls
            let base;
            let urlAsString = typeof href === "string" ? href : (0, _formaturl.formatWithValidation)(href);
            // repeated slashes and backslashes in the URL are considered
            // invalid and will never match a Next.js page/file
                        const urlProtoMatch = urlAsString.match(/^[a-zA-Z]{1,}:\/\//);
            const urlAsStringNoProto = urlProtoMatch ? urlAsString.slice(urlProtoMatch[0].length) : urlAsString;
            const urlParts = urlAsStringNoProto.split("?", 1);
            if ((urlParts[0] || "").match(/(\/\/|\\)/)) {
                console.error("Invalid href '" + urlAsString + "' passed to next/router in page: '" + router.pathname + "'. Repeated forward-slashes (//) or backslashes \\ are not valid in the href.");
                const normalizedUrl = (0, _utils.normalizeRepeatedSlashes)(urlAsStringNoProto);
                urlAsString = (urlProtoMatch ? urlProtoMatch[0] : "") + normalizedUrl;
            }
            // Return because it cannot be routed by the Next.js router
                        if (!(0, _islocalurl.isLocalURL)(urlAsString)) {
                return resolveAs ? [ urlAsString ] : urlAsString;
            }
            try {
                base = new URL(urlAsString.startsWith("#") ? router.asPath : router.pathname, "http://n");
            } catch (_) {
                // fallback to / for invalid asPath values e.g. //
                base = new URL("/", "http://n");
            }
            try {
                const finalUrl = new URL(urlAsString, base);
                finalUrl.pathname = (0, _normalizetrailingslash.normalizePathTrailingSlash)(finalUrl.pathname);
                let interpolatedAs = "";
                if ((0, _utils1.isDynamicRoute)(finalUrl.pathname) && finalUrl.searchParams && resolveAs) {
                    const query = (0, _querystring.searchParamsToUrlQuery)(finalUrl.searchParams);
                    const {result: result, params: params} = (0, _interpolateas.interpolateAs)(finalUrl.pathname, finalUrl.pathname, query);
                    if (result) {
                        interpolatedAs = (0, _formaturl.formatWithValidation)({
                            pathname: result,
                            hash: finalUrl.hash,
                            query: (0, _omit.omit)(query, params)
                        });
                    }
                }
                // if the origin didn't change, it means we received a relative href
                                const resolvedHref = finalUrl.origin === base.origin ? finalUrl.href.slice(finalUrl.origin.length) : finalUrl.href;
                return resolveAs ? [ resolvedHref, interpolatedAs || resolvedHref ] : resolvedHref;
            } catch (_) {
                return resolveAs ? [ urlAsString ] : urlAsString;
            }
        }
        if ((typeof exports.default === "function" || typeof exports.default === "object" && exports.default !== null) && typeof exports.default.__esModule === "undefined") {
            Object.defineProperty(exports.default, "__esModule", {
                value: true
            });
            Object.assign(exports.default, exports);
            module.exports = exports.default;
        }
 //# sourceMappingURL=resolve-href.js.map
        /***/    },
    /***/ 6081: 
    /***/ function(module, exports, __webpack_require__) {
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
        Object.defineProperty(exports, "useIntersection", {
            enumerable: true,
            get: function() {
                return useIntersection;
            }
        });
        const _react = __webpack_require__(2265);
        const _requestidlecallback = __webpack_require__(3515);
        const hasIntersectionObserver = typeof IntersectionObserver === "function";
        const observers = new Map;
        const idList = [];
        function createObserver(options) {
            const id = {
                root: options.root || null,
                margin: options.rootMargin || ""
            };
            const existing = idList.find((obj => obj.root === id.root && obj.margin === id.margin));
            let instance;
            if (existing) {
                instance = observers.get(existing);
                if (instance) {
                    return instance;
                }
            }
            const elements = new Map;
            const observer = new IntersectionObserver((entries => {
                entries.forEach((entry => {
                    const callback = elements.get(entry.target);
                    const isVisible = entry.isIntersecting || entry.intersectionRatio > 0;
                    if (callback && isVisible) {
                        callback(isVisible);
                    }
                }));
            }), options);
            instance = {
                id: id,
                observer: observer,
                elements: elements
            };
            idList.push(id);
            observers.set(id, instance);
            return instance;
        }
        function observe(element, callback, options) {
            const {id: id, observer: observer, elements: elements} = createObserver(options);
            elements.set(element, callback);
            observer.observe(element);
            return function unobserve() {
                elements.delete(element);
                observer.unobserve(element);
                // Destroy observer when there's nothing left to watch:
                                if (elements.size === 0) {
                    observer.disconnect();
                    observers.delete(id);
                    const index = idList.findIndex((obj => obj.root === id.root && obj.margin === id.margin));
                    if (index > -1) {
                        idList.splice(index, 1);
                    }
                }
            };
        }
        function useIntersection(param) {
            let {rootRef: rootRef, rootMargin: rootMargin, disabled: disabled} = param;
            const isDisabled = disabled || !hasIntersectionObserver;
            const [visible, setVisible] = (0, _react.useState)(false);
            const elementRef = (0, _react.useRef)(null);
            const setElement = (0, _react.useCallback)((element => {
                elementRef.current = element;
            }), []);
            (0, _react.useEffect)((() => {
                if (hasIntersectionObserver) {
                    if (isDisabled || visible) return;
                    const element = elementRef.current;
                    if (element && element.tagName) {
                        const unobserve = observe(element, (isVisible => isVisible && setVisible(isVisible)), {
                            root: rootRef == null ? void 0 : rootRef.current,
                            rootMargin: rootMargin
                        });
                        return unobserve;
                    }
                } else {
                    if (!visible) {
                        const idleCallback = (0, _requestidlecallback.requestIdleCallback)((() => setVisible(true)));
                        return () => (0, _requestidlecallback.cancelIdleCallback)(idleCallback);
                    }
                }
                // eslint-disable-next-line react-hooks/exhaustive-deps
                        }), [ isDisabled, rootMargin, rootRef, visible, elementRef.current ]);
            const resetVisible = (0, _react.useCallback)((() => {
                setVisible(false);
            }), []);
            return [ setElement, visible, resetVisible ];
        }
        if ((typeof exports.default === "function" || typeof exports.default === "object" && exports.default !== null) && typeof exports.default.__esModule === "undefined") {
            Object.defineProperty(exports.default, "__esModule", {
                value: true
            });
            Object.assign(exports.default, exports);
            module.exports = exports.default;
        }
 //# sourceMappingURL=use-intersection.js.map
        /***/    },
    /***/ 9259: 
    /***/ function(__unused_webpack_module, exports) {
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
        0 && 0;
        function _export(target, all) {
            for (var name in all) Object.defineProperty(target, name, {
                enumerable: true,
                get: all[name]
            });
        }
        _export(exports, {
            ACTION_SUFFIX: function() {
                return ACTION_SUFFIX;
            },
            APP_DIR_ALIAS: function() {
                return APP_DIR_ALIAS;
            },
            CACHE_ONE_YEAR: function() {
                return CACHE_ONE_YEAR;
            },
            DOT_NEXT_ALIAS: function() {
                return DOT_NEXT_ALIAS;
            },
            ESLINT_DEFAULT_DIRS: function() {
                return ESLINT_DEFAULT_DIRS;
            },
            GSP_NO_RETURNED_VALUE: function() {
                return GSP_NO_RETURNED_VALUE;
            },
            GSSP_COMPONENT_MEMBER_ERROR: function() {
                return GSSP_COMPONENT_MEMBER_ERROR;
            },
            GSSP_NO_RETURNED_VALUE: function() {
                return GSSP_NO_RETURNED_VALUE;
            },
            INSTRUMENTATION_HOOK_FILENAME: function() {
                return INSTRUMENTATION_HOOK_FILENAME;
            },
            MIDDLEWARE_FILENAME: function() {
                return MIDDLEWARE_FILENAME;
            },
            MIDDLEWARE_LOCATION_REGEXP: function() {
                return MIDDLEWARE_LOCATION_REGEXP;
            },
            NEXT_BODY_SUFFIX: function() {
                return NEXT_BODY_SUFFIX;
            },
            NEXT_CACHE_IMPLICIT_TAG_ID: function() {
                return NEXT_CACHE_IMPLICIT_TAG_ID;
            },
            NEXT_CACHE_REVALIDATED_TAGS_HEADER: function() {
                return NEXT_CACHE_REVALIDATED_TAGS_HEADER;
            },
            NEXT_CACHE_REVALIDATE_TAG_TOKEN_HEADER: function() {
                return NEXT_CACHE_REVALIDATE_TAG_TOKEN_HEADER;
            },
            NEXT_CACHE_SOFT_TAGS_HEADER: function() {
                return NEXT_CACHE_SOFT_TAGS_HEADER;
            },
            NEXT_CACHE_SOFT_TAG_MAX_LENGTH: function() {
                return NEXT_CACHE_SOFT_TAG_MAX_LENGTH;
            },
            NEXT_CACHE_TAGS_HEADER: function() {
                return NEXT_CACHE_TAGS_HEADER;
            },
            NEXT_CACHE_TAG_MAX_ITEMS: function() {
                return NEXT_CACHE_TAG_MAX_ITEMS;
            },
            NEXT_CACHE_TAG_MAX_LENGTH: function() {
                return NEXT_CACHE_TAG_MAX_LENGTH;
            },
            NEXT_DATA_SUFFIX: function() {
                return NEXT_DATA_SUFFIX;
            },
            NEXT_INTERCEPTION_MARKER_PREFIX: function() {
                return NEXT_INTERCEPTION_MARKER_PREFIX;
            },
            NEXT_META_SUFFIX: function() {
                return NEXT_META_SUFFIX;
            },
            NEXT_QUERY_PARAM_PREFIX: function() {
                return NEXT_QUERY_PARAM_PREFIX;
            },
            NON_STANDARD_NODE_ENV: function() {
                return NON_STANDARD_NODE_ENV;
            },
            PAGES_DIR_ALIAS: function() {
                return PAGES_DIR_ALIAS;
            },
            PRERENDER_REVALIDATE_HEADER: function() {
                return PRERENDER_REVALIDATE_HEADER;
            },
            PRERENDER_REVALIDATE_ONLY_GENERATED_HEADER: function() {
                return PRERENDER_REVALIDATE_ONLY_GENERATED_HEADER;
            },
            PUBLIC_DIR_MIDDLEWARE_CONFLICT: function() {
                return PUBLIC_DIR_MIDDLEWARE_CONFLICT;
            },
            ROOT_DIR_ALIAS: function() {
                return ROOT_DIR_ALIAS;
            },
            RSC_ACTION_CLIENT_WRAPPER_ALIAS: function() {
                return RSC_ACTION_CLIENT_WRAPPER_ALIAS;
            },
            RSC_ACTION_ENCRYPTION_ALIAS: function() {
                return RSC_ACTION_ENCRYPTION_ALIAS;
            },
            RSC_ACTION_PROXY_ALIAS: function() {
                return RSC_ACTION_PROXY_ALIAS;
            },
            RSC_ACTION_VALIDATE_ALIAS: function() {
                return RSC_ACTION_VALIDATE_ALIAS;
            },
            RSC_MOD_REF_PROXY_ALIAS: function() {
                return RSC_MOD_REF_PROXY_ALIAS;
            },
            RSC_PREFETCH_SUFFIX: function() {
                return RSC_PREFETCH_SUFFIX;
            },
            RSC_SUFFIX: function() {
                return RSC_SUFFIX;
            },
            SERVER_PROPS_EXPORT_ERROR: function() {
                return SERVER_PROPS_EXPORT_ERROR;
            },
            SERVER_PROPS_GET_INIT_PROPS_CONFLICT: function() {
                return SERVER_PROPS_GET_INIT_PROPS_CONFLICT;
            },
            SERVER_PROPS_SSG_CONFLICT: function() {
                return SERVER_PROPS_SSG_CONFLICT;
            },
            SERVER_RUNTIME: function() {
                return SERVER_RUNTIME;
            },
            SSG_FALLBACK_EXPORT_ERROR: function() {
                return SSG_FALLBACK_EXPORT_ERROR;
            },
            SSG_GET_INITIAL_PROPS_CONFLICT: function() {
                return SSG_GET_INITIAL_PROPS_CONFLICT;
            },
            STATIC_STATUS_PAGE_GET_INITIAL_PROPS_ERROR: function() {
                return STATIC_STATUS_PAGE_GET_INITIAL_PROPS_ERROR;
            },
            UNSTABLE_REVALIDATE_RENAME_ERROR: function() {
                return UNSTABLE_REVALIDATE_RENAME_ERROR;
            },
            WEBPACK_LAYERS: function() {
                return WEBPACK_LAYERS;
            },
            WEBPACK_RESOURCE_QUERIES: function() {
                return WEBPACK_RESOURCE_QUERIES;
            }
        });
        const NEXT_QUERY_PARAM_PREFIX = "nxtP";
        const NEXT_INTERCEPTION_MARKER_PREFIX = "nxtI";
        const PRERENDER_REVALIDATE_HEADER = "x-prerender-revalidate";
        const PRERENDER_REVALIDATE_ONLY_GENERATED_HEADER = "x-prerender-revalidate-if-generated";
        const RSC_PREFETCH_SUFFIX = ".prefetch.rsc";
        const RSC_SUFFIX = ".rsc";
        const ACTION_SUFFIX = ".action";
        const NEXT_DATA_SUFFIX = ".json";
        const NEXT_META_SUFFIX = ".meta";
        const NEXT_BODY_SUFFIX = ".body";
        const NEXT_CACHE_TAGS_HEADER = "x-next-cache-tags";
        const NEXT_CACHE_SOFT_TAGS_HEADER = "x-next-cache-soft-tags";
        const NEXT_CACHE_REVALIDATED_TAGS_HEADER = "x-next-revalidated-tags";
        const NEXT_CACHE_REVALIDATE_TAG_TOKEN_HEADER = "x-next-revalidate-tag-token";
        const NEXT_CACHE_TAG_MAX_ITEMS = 128;
        const NEXT_CACHE_TAG_MAX_LENGTH = 256;
        const NEXT_CACHE_SOFT_TAG_MAX_LENGTH = 1024;
        const NEXT_CACHE_IMPLICIT_TAG_ID = "_N_T_";
        const CACHE_ONE_YEAR = 31536e3;
        const MIDDLEWARE_FILENAME = "middleware";
        const MIDDLEWARE_LOCATION_REGEXP = `(?:src/)?${MIDDLEWARE_FILENAME}`;
        const INSTRUMENTATION_HOOK_FILENAME = "instrumentation";
        const PAGES_DIR_ALIAS = "private-next-pages";
        const DOT_NEXT_ALIAS = "private-dot-next";
        const ROOT_DIR_ALIAS = "private-next-root-dir";
        const APP_DIR_ALIAS = "private-next-app-dir";
        const RSC_MOD_REF_PROXY_ALIAS = "private-next-rsc-mod-ref-proxy";
        const RSC_ACTION_VALIDATE_ALIAS = "private-next-rsc-action-validate";
        const RSC_ACTION_PROXY_ALIAS = "private-next-rsc-server-reference";
        const RSC_ACTION_ENCRYPTION_ALIAS = "private-next-rsc-action-encryption";
        const RSC_ACTION_CLIENT_WRAPPER_ALIAS = "private-next-rsc-action-client-wrapper";
        const PUBLIC_DIR_MIDDLEWARE_CONFLICT = `You can not have a '_next' folder inside of your public folder. This conflicts with the internal '/_next' route. https://nextjs.org/docs/messages/public-next-folder-conflict`;
        const SSG_GET_INITIAL_PROPS_CONFLICT = `You can not use getInitialProps with getStaticProps. To use SSG, please remove your getInitialProps`;
        const SERVER_PROPS_GET_INIT_PROPS_CONFLICT = `You can not use getInitialProps with getServerSideProps. Please remove getInitialProps.`;
        const SERVER_PROPS_SSG_CONFLICT = `You can not use getStaticProps or getStaticPaths with getServerSideProps. To use SSG, please remove getServerSideProps`;
        const STATIC_STATUS_PAGE_GET_INITIAL_PROPS_ERROR = `can not have getInitialProps/getServerSideProps, https://nextjs.org/docs/messages/404-get-initial-props`;
        const SERVER_PROPS_EXPORT_ERROR = `pages with \`getServerSideProps\` can not be exported. See more info here: https://nextjs.org/docs/messages/gssp-export`;
        const GSP_NO_RETURNED_VALUE = "Your `getStaticProps` function did not return an object. Did you forget to add a `return`?";
        const GSSP_NO_RETURNED_VALUE = "Your `getServerSideProps` function did not return an object. Did you forget to add a `return`?";
        const UNSTABLE_REVALIDATE_RENAME_ERROR = "The `unstable_revalidate` property is available for general use.\n" + "Please use `revalidate` instead.";
        const GSSP_COMPONENT_MEMBER_ERROR = `can not be attached to a page's component and must be exported from the page. See more info here: https://nextjs.org/docs/messages/gssp-component-member`;
        const NON_STANDARD_NODE_ENV = `You are using a non-standard "NODE_ENV" value in your environment. This creates inconsistencies in the project and is strongly advised against. Read more: https://nextjs.org/docs/messages/non-standard-node-env`;
        const SSG_FALLBACK_EXPORT_ERROR = `Pages with \`fallback\` enabled in \`getStaticPaths\` can not be exported. See more info here: https://nextjs.org/docs/messages/ssg-fallback-true-export`;
        const ESLINT_DEFAULT_DIRS = [ "app", "pages", "components", "lib", "src" ];
        const SERVER_RUNTIME = {
            edge: "edge",
            experimentalEdge: "experimental-edge",
            nodejs: "nodejs"
        };
        /**
 * The names of the webpack layers. These layers are the primitives for the
 * webpack chunks.
 */        const WEBPACK_LAYERS_NAMES = {
            /**
   * The layer for the shared code between the client and server bundles.
   */
            shared: "shared",
            /**
   * React Server Components layer (rsc).
   */
            reactServerComponents: "rsc",
            /**
   * Server Side Rendering layer for app (ssr).
   */
            serverSideRendering: "ssr",
            /**
   * The browser client bundle layer for actions.
   */
            actionBrowser: "action-browser",
            /**
   * The layer for the API routes.
   */
            api: "api",
            /**
   * The layer for the middleware code.
   */
            middleware: "middleware",
            /**
   * The layer for the instrumentation hooks.
   */
            instrument: "instrument",
            /**
   * The layer for assets on the edge.
   */
            edgeAsset: "edge-asset",
            /**
   * The browser client bundle layer for App directory.
   */
            appPagesBrowser: "app-pages-browser",
            /**
   * The server bundle layer for metadata routes.
   */
            appMetadataRoute: "app-metadata-route",
            /**
   * The layer for the server bundle for App Route handlers.
   */
            appRouteHandler: "app-route-handler"
        };
        const WEBPACK_LAYERS = {
            ...WEBPACK_LAYERS_NAMES,
            GROUP: {
                serverOnly: [ WEBPACK_LAYERS_NAMES.reactServerComponents, WEBPACK_LAYERS_NAMES.actionBrowser, WEBPACK_LAYERS_NAMES.appMetadataRoute, WEBPACK_LAYERS_NAMES.appRouteHandler, WEBPACK_LAYERS_NAMES.instrument ],
                clientOnly: [ WEBPACK_LAYERS_NAMES.serverSideRendering, WEBPACK_LAYERS_NAMES.appPagesBrowser ],
                nonClientServerTarget: [ 
                // middleware and pages api
                WEBPACK_LAYERS_NAMES.middleware, WEBPACK_LAYERS_NAMES.api ],
                app: [ WEBPACK_LAYERS_NAMES.reactServerComponents, WEBPACK_LAYERS_NAMES.actionBrowser, WEBPACK_LAYERS_NAMES.appMetadataRoute, WEBPACK_LAYERS_NAMES.appRouteHandler, WEBPACK_LAYERS_NAMES.serverSideRendering, WEBPACK_LAYERS_NAMES.appPagesBrowser, WEBPACK_LAYERS_NAMES.shared, WEBPACK_LAYERS_NAMES.instrument ]
            }
        };
        const WEBPACK_RESOURCE_QUERIES = {
            edgeSSREntry: "__next_edge_ssr_entry__",
            metadata: "__next_metadata__",
            metadataRoute: "__next_metadata_route__",
            metadataImageMeta: "__next_metadata_image_meta__"
        };
        //# sourceMappingURL=constants.js.map
        /***/    },
    /***/ 42: 
    /***/ function(__unused_webpack_module, exports) {
        // regexp is based on https://github.com/sindresorhus/escape-string-regexp
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
        Object.defineProperty(exports, "escapeStringRegexp", {
            enumerable: true,
            get: function() {
                return escapeStringRegexp;
            }
        });
        const reHasRegExp = /[|\\{}()[\]^$+*?.-]/;
        const reReplaceRegExp = /[|\\{}()[\]^$+*?.-]/g;
        function escapeStringRegexp(str) {
            // see also: https://github.com/lodash/lodash/blob/2da024c3b4f9947a48517639de7560457cd4ec6c/escapeRegExp.js#L23
            if (reHasRegExp.test(str)) {
                return str.replace(reReplaceRegExp, "\\$&");
            }
            return str;
        }
 //# sourceMappingURL=escape-regexp.js.map
        /***/    },
    /***/ 5523: 
    /***/ function(__unused_webpack_module, exports, __webpack_require__) {
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
        Object.defineProperty(exports, "RouterContext", {
            enumerable: true,
            get: function() {
                return RouterContext;
            }
        });
        const _interop_require_default = __webpack_require__(7043);
        const _react =  _interop_require_default._(__webpack_require__(2265));
        const RouterContext = _react.default.createContext(null);
        if (false) {}
 //# sourceMappingURL=router-context.shared-runtime.js.map
        /***/    },
    /***/ 7497: 
    /***/ function(__unused_webpack_module, exports, __webpack_require__) {
        // Format function modified from nodejs
        // Copyright Joyent, Inc. and other Node contributors.
        // Permission is hereby granted, free of charge, to any person obtaining a
        // copy of this software and associated documentation files (the
        // "Software"), to deal in the Software without restriction, including
        // without limitation the rights to use, copy, modify, merge, publish,
        // distribute, sublicense, and/or sell copies of the Software, and to permit
        // persons to whom the Software is furnished to do so, subject to the
        // following conditions:
        // The above copyright notice and this permission notice shall be included
        // in all copies or substantial portions of the Software.
        // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
        // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
        // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
        // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
        // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
        // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
        // USE OR OTHER DEALINGS IN THE SOFTWARE.
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
        0 && 0;
        function _export(target, all) {
            for (var name in all) Object.defineProperty(target, name, {
                enumerable: true,
                get: all[name]
            });
        }
        _export(exports, {
            formatUrl: function() {
                return formatUrl;
            },
            formatWithValidation: function() {
                return formatWithValidation;
            },
            urlObjectKeys: function() {
                return urlObjectKeys;
            }
        });
        const _interop_require_wildcard = __webpack_require__(3099);
        const _querystring =  _interop_require_wildcard._(__webpack_require__(8637));
        const slashedProtocols = /https?|ftp|gopher|file/;
        function formatUrl(urlObj) {
            let {auth: auth, hostname: hostname} = urlObj;
            let protocol = urlObj.protocol || "";
            let pathname = urlObj.pathname || "";
            let hash = urlObj.hash || "";
            let query = urlObj.query || "";
            let host = false;
            auth = auth ? encodeURIComponent(auth).replace(/%3A/i, ":") + "@" : "";
            if (urlObj.host) {
                host = auth + urlObj.host;
            } else if (hostname) {
                host = auth + (~hostname.indexOf(":") ? "[" + hostname + "]" : hostname);
                if (urlObj.port) {
                    host += ":" + urlObj.port;
                }
            }
            if (query && typeof query === "object") {
                query = String(_querystring.urlQueryToSearchParams(query));
            }
            let search = urlObj.search || query && "?" + query || "";
            if (protocol && !protocol.endsWith(":")) protocol += ":";
            if (urlObj.slashes || (!protocol || slashedProtocols.test(protocol)) && host !== false) {
                host = "//" + (host || "");
                if (pathname && pathname[0] !== "/") pathname = "/" + pathname;
            } else if (!host) {
                host = "";
            }
            if (hash && hash[0] !== "#") hash = "#" + hash;
            if (search && search[0] !== "?") search = "?" + search;
            pathname = pathname.replace(/[?#]/g, encodeURIComponent);
            search = search.replace("#", "%23");
            return "" + protocol + host + pathname + search + hash;
        }
        const urlObjectKeys = [ "auth", "hash", "host", "hostname", "href", "path", "pathname", "port", "protocol", "query", "search", "slashes" ];
        function formatWithValidation(url) {
            if (false) {}
            return formatUrl(url);
        }
 //# sourceMappingURL=format-url.js.map
        /***/    },
    /***/ 6279: 
    /***/ function(__unused_webpack_module, exports, __webpack_require__) {
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
        0 && 0;
        function _export(target, all) {
            for (var name in all) Object.defineProperty(target, name, {
                enumerable: true,
                get: all[name]
            });
        }
        _export(exports, {
            getSortedRoutes: function() {
                return _sortedroutes.getSortedRoutes;
            },
            isDynamicRoute: function() {
                return _isdynamic.isDynamicRoute;
            }
        });
        const _sortedroutes = __webpack_require__(4777);
        const _isdynamic = __webpack_require__(8104);
 //# sourceMappingURL=index.js.map
        /***/    },
    /***/ 7205: 
    /***/ function(__unused_webpack_module, exports, __webpack_require__) {
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
        Object.defineProperty(exports, "interpolateAs", {
            enumerable: true,
            get: function() {
                return interpolateAs;
            }
        });
        const _routematcher = __webpack_require__(4199);
        const _routeregex = __webpack_require__(9964);
        function interpolateAs(route, asPathname, query) {
            let interpolatedRoute = "";
            const dynamicRegex = (0, _routeregex.getRouteRegex)(route);
            const dynamicGroups = dynamicRegex.groups;
            const dynamicMatches = (asPathname !== route ? (0, _routematcher.getRouteMatcher)(dynamicRegex)(asPathname) : "") || // Fall back to reading the values from the href
            // TODO: should this take priority; also need to change in the router.
            query;
            interpolatedRoute = route;
            const params = Object.keys(dynamicGroups);
            if (!params.every((param => {
                let value = dynamicMatches[param] || "";
                const {repeat: repeat, optional: optional} = dynamicGroups[param];
                // support single-level catch-all
                // TODO: more robust handling for user-error (passing `/`)
                                let replaced = "[" + (repeat ? "..." : "") + param + "]";
                if (optional) {
                    replaced = (!value ? "/" : "") + "[" + replaced + "]";
                }
                if (repeat && !Array.isArray(value)) value = [ value ];
                return (optional || param in dynamicMatches) && (// Interpolate group into data URL if present
                interpolatedRoute = interpolatedRoute.replace(replaced, repeat ? value.map((// path delimiter escaped since they are being inserted
                // into the URL and we expect URL encoded segments
                // when parsing dynamic route params
                segment => encodeURIComponent(segment))).join("/") : encodeURIComponent(value)) || "/");
            }))) {
                interpolatedRoute = "";
                // n.b. We ignore this error because we handle warning for this case in
                // development in the `<Link>` component directly.
                        }
            return {
                params: params,
                result: interpolatedRoute
            };
        }
 //# sourceMappingURL=interpolate-as.js.map
        /***/    },
    /***/ 8104: 
    /***/ function(__unused_webpack_module, exports, __webpack_require__) {
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
        Object.defineProperty(exports, "isDynamicRoute", {
            enumerable: true,
            get: function() {
                return isDynamicRoute;
            }
        });
        const _interceptionroutes = __webpack_require__(1182);
        // Identify /[param]/ in route string
                const TEST_ROUTE = /\/\[[^/]+?\](?=\/|$)/;
        function isDynamicRoute(route) {
            if ((0, _interceptionroutes.isInterceptionRouteAppPath)(route)) {
                route = (0, _interceptionroutes.extractInterceptionRouteInformation)(route).interceptedRoute;
            }
            return TEST_ROUTE.test(route);
        }
 //# sourceMappingURL=is-dynamic.js.map
        /***/    },
    /***/ 3552: 
    /***/ function(__unused_webpack_module, exports, __webpack_require__) {
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
        Object.defineProperty(exports, "isLocalURL", {
            enumerable: true,
            get: function() {
                return isLocalURL;
            }
        });
        const _utils = __webpack_require__(3987);
        const _hasbasepath = __webpack_require__(1283);
        function isLocalURL(url) {
            // prevent a hydration mismatch on href for url with anchor refs
            if (!(0, _utils.isAbsoluteUrl)(url)) return true;
            try {
                // absolute urls can be local if they are on the same origin
                const locationOrigin = (0, _utils.getLocationOrigin)();
                const resolved = new URL(url, locationOrigin);
                return resolved.origin === locationOrigin && (0, _hasbasepath.hasBasePath)(resolved.pathname);
            } catch (_) {
                return false;
            }
        }
 //# sourceMappingURL=is-local-url.js.map
        /***/    },
    /***/ 7053: 
    /***/ function(__unused_webpack_module, exports) {
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
        Object.defineProperty(exports, "omit", {
            enumerable: true,
            get: function() {
                return omit;
            }
        });
        function omit(object, keys) {
            const omitted = {};
            Object.keys(object).forEach((key => {
                if (!keys.includes(key)) {
                    omitted[key] = object[key];
                }
            }));
            return omitted;
        }
 //# sourceMappingURL=omit.js.map
        /***/    },
    /***/ 8637: 
    /***/ function(__unused_webpack_module, exports) {
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
        0 && 0;
        function _export(target, all) {
            for (var name in all) Object.defineProperty(target, name, {
                enumerable: true,
                get: all[name]
            });
        }
        _export(exports, {
            assign: function() {
                return assign;
            },
            searchParamsToUrlQuery: function() {
                return searchParamsToUrlQuery;
            },
            urlQueryToSearchParams: function() {
                return urlQueryToSearchParams;
            }
        });
        function searchParamsToUrlQuery(searchParams) {
            const query = {};
            searchParams.forEach(((value, key) => {
                if (typeof query[key] === "undefined") {
                    query[key] = value;
                } else if (Array.isArray(query[key])) {
                    query[key].push(value);
                } else {
                    query[key] = [ query[key], value ];
                }
            }));
            return query;
        }
        function stringifyUrlQueryParam(param) {
            if (typeof param === "string" || typeof param === "number" && !isNaN(param) || typeof param === "boolean") {
                return String(param);
            } else {
                return "";
            }
        }
        function urlQueryToSearchParams(urlQuery) {
            const result = new URLSearchParams;
            Object.entries(urlQuery).forEach((param => {
                let [key, value] = param;
                if (Array.isArray(value)) {
                    value.forEach((item => result.append(key, stringifyUrlQueryParam(item))));
                } else {
                    result.set(key, stringifyUrlQueryParam(value));
                }
            }));
            return result;
        }
        function assign(target) {
            for (var _len = arguments.length, searchParamsList = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                searchParamsList[_key - 1] = arguments[_key];
            }
            searchParamsList.forEach((searchParams => {
                Array.from(searchParams.keys()).forEach((key => target.delete(key)));
                searchParams.forEach(((value, key) => target.append(key, value)));
            }));
            return target;
        }
 //# sourceMappingURL=querystring.js.map
        /***/    },
    /***/ 4199: 
    /***/ function(__unused_webpack_module, exports, __webpack_require__) {
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
        Object.defineProperty(exports, "getRouteMatcher", {
            enumerable: true,
            get: function() {
                return getRouteMatcher;
            }
        });
        const _utils = __webpack_require__(3987);
        function getRouteMatcher(param) {
            let {re: re, groups: groups} = param;
            return pathname => {
                const routeMatch = re.exec(pathname);
                if (!routeMatch) {
                    return false;
                }
                const decode = param => {
                    try {
                        return decodeURIComponent(param);
                    } catch (_) {
                        throw new _utils.DecodeError("failed to decode param");
                    }
                };
                const params = {};
                Object.keys(groups).forEach((slugName => {
                    const g = groups[slugName];
                    const m = routeMatch[g.pos];
                    if (m !== undefined) {
                        params[slugName] = ~m.indexOf("/") ? m.split("/").map((entry => decode(entry))) : g.repeat ? [ decode(m) ] : decode(m);
                    }
                }));
                return params;
            };
        }
 //# sourceMappingURL=route-matcher.js.map
        /***/    },
    /***/ 9964: 
    /***/ function(__unused_webpack_module, exports, __webpack_require__) {
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
        0 && 0;
        function _export(target, all) {
            for (var name in all) Object.defineProperty(target, name, {
                enumerable: true,
                get: all[name]
            });
        }
        _export(exports, {
            getNamedMiddlewareRegex: function() {
                return getNamedMiddlewareRegex;
            },
            getNamedRouteRegex: function() {
                return getNamedRouteRegex;
            },
            getRouteRegex: function() {
                return getRouteRegex;
            },
            parseParameter: function() {
                return parseParameter;
            }
        });
        const _constants = __webpack_require__(9259);
        const _interceptionroutes = __webpack_require__(1182);
        const _escaperegexp = __webpack_require__(42);
        const _removetrailingslash = __webpack_require__(6674);
        function parseParameter(param) {
            const optional = param.startsWith("[") && param.endsWith("]");
            if (optional) {
                param = param.slice(1, -1);
            }
            const repeat = param.startsWith("...");
            if (repeat) {
                param = param.slice(3);
            }
            return {
                key: param,
                repeat: repeat,
                optional: optional
            };
        }
        function getParametrizedRoute(route) {
            const segments = (0, _removetrailingslash.removeTrailingSlash)(route).slice(1).split("/");
            const groups = {};
            let groupIndex = 1;
            return {
                parameterizedRoute: segments.map((segment => {
                    const markerMatch = _interceptionroutes.INTERCEPTION_ROUTE_MARKERS.find((m => segment.startsWith(m)));
                    const paramMatches = segment.match(/\[((?:\[.*\])|.+)\]/);
                    if (markerMatch && paramMatches) {
                        const {key: key, optional: optional, repeat: repeat} = parseParameter(paramMatches[1]);
                        groups[key] = {
                            pos: groupIndex++,
                            repeat: repeat,
                            optional: optional
                        };
                        return "/" + (0, _escaperegexp.escapeStringRegexp)(markerMatch) + "([^/]+?)";
                    } else if (paramMatches) {
                        const {key: key, repeat: repeat, optional: optional} = parseParameter(paramMatches[1]);
                        groups[key] = {
                            pos: groupIndex++,
                            repeat: repeat,
                            optional: optional
                        };
                        return repeat ? optional ? "(?:/(.+?))?" : "/(.+?)" : "/([^/]+?)";
                    } else {
                        return "/" + (0, _escaperegexp.escapeStringRegexp)(segment);
                    }
                })).join(""),
                groups: groups
            };
        }
        function getRouteRegex(normalizedRoute) {
            const {parameterizedRoute: parameterizedRoute, groups: groups} = getParametrizedRoute(normalizedRoute);
            return {
                re: new RegExp("^" + parameterizedRoute + "(?:/)?$"),
                groups: groups
            };
        }
        /**
 * Builds a function to generate a minimal routeKey using only a-z and minimal
 * number of characters.
 */        function buildGetSafeRouteKey() {
            let i = 0;
            return () => {
                let routeKey = "";
                let j = ++i;
                while (j > 0) {
                    routeKey += String.fromCharCode(97 + (j - 1) % 26);
                    j = Math.floor((j - 1) / 26);
                }
                return routeKey;
            };
        }
        function getSafeKeyFromSegment(param) {
            let {interceptionMarker: interceptionMarker, getSafeRouteKey: getSafeRouteKey, segment: segment, routeKeys: routeKeys, keyPrefix: keyPrefix} = param;
            const {key: key, optional: optional, repeat: repeat} = parseParameter(segment);
            // replace any non-word characters since they can break
            // the named regex
                        let cleanedKey = key.replace(/\W/g, "");
            if (keyPrefix) {
                cleanedKey = "" + keyPrefix + cleanedKey;
            }
            let invalidKey = false;
            // check if the key is still invalid and fallback to using a known
            // safe key
                        if (cleanedKey.length === 0 || cleanedKey.length > 30) {
                invalidKey = true;
            }
            if (!isNaN(parseInt(cleanedKey.slice(0, 1)))) {
                invalidKey = true;
            }
            if (invalidKey) {
                cleanedKey = getSafeRouteKey();
            }
            if (keyPrefix) {
                routeKeys[cleanedKey] = "" + keyPrefix + key;
            } else {
                routeKeys[cleanedKey] = key;
            }
            // if the segment has an interception marker, make sure that's part of the regex pattern
            // this is to ensure that the route with the interception marker doesn't incorrectly match
            // the non-intercepted route (ie /app/(.)[username] should not match /app/[username])
                        const interceptionPrefix = interceptionMarker ? (0, _escaperegexp.escapeStringRegexp)(interceptionMarker) : "";
            return repeat ? optional ? "(?:/" + interceptionPrefix + "(?<" + cleanedKey + ">.+?))?" : "/" + interceptionPrefix + "(?<" + cleanedKey + ">.+?)" : "/" + interceptionPrefix + "(?<" + cleanedKey + ">[^/]+?)";
        }
        function getNamedParametrizedRoute(route, prefixRouteKeys) {
            const segments = (0, _removetrailingslash.removeTrailingSlash)(route).slice(1).split("/");
            const getSafeRouteKey = buildGetSafeRouteKey();
            const routeKeys = {};
            return {
                namedParameterizedRoute: segments.map((segment => {
                    const hasInterceptionMarker = _interceptionroutes.INTERCEPTION_ROUTE_MARKERS.some((m => segment.startsWith(m)));
                    const paramMatches = segment.match(/\[((?:\[.*\])|.+)\]/);
                    if (hasInterceptionMarker && paramMatches) {
                        const [usedMarker] = segment.split(paramMatches[0]);
                        return getSafeKeyFromSegment({
                            getSafeRouteKey: getSafeRouteKey,
                            interceptionMarker: usedMarker,
                            segment: paramMatches[1],
                            routeKeys: routeKeys,
                            keyPrefix: prefixRouteKeys ? _constants.NEXT_INTERCEPTION_MARKER_PREFIX : undefined
                        });
                    } else if (paramMatches) {
                        return getSafeKeyFromSegment({
                            getSafeRouteKey: getSafeRouteKey,
                            segment: paramMatches[1],
                            routeKeys: routeKeys,
                            keyPrefix: prefixRouteKeys ? _constants.NEXT_QUERY_PARAM_PREFIX : undefined
                        });
                    } else {
                        return "/" + (0, _escaperegexp.escapeStringRegexp)(segment);
                    }
                })).join(""),
                routeKeys: routeKeys
            };
        }
        function getNamedRouteRegex(normalizedRoute, prefixRouteKey) {
            const result = getNamedParametrizedRoute(normalizedRoute, prefixRouteKey);
            return {
                ...getRouteRegex(normalizedRoute),
                namedRegex: "^" + result.namedParameterizedRoute + "(?:/)?$",
                routeKeys: result.routeKeys
            };
        }
        function getNamedMiddlewareRegex(normalizedRoute, options) {
            const {parameterizedRoute: parameterizedRoute} = getParametrizedRoute(normalizedRoute);
            const {catchAll: catchAll = true} = options;
            if (parameterizedRoute === "/") {
                let catchAllRegex = catchAll ? ".*" : "";
                return {
                    namedRegex: "^/" + catchAllRegex + "$"
                };
            }
            const {namedParameterizedRoute: namedParameterizedRoute} = getNamedParametrizedRoute(normalizedRoute, false);
            let catchAllGroupedRegex = catchAll ? "(?:(/.*)?)" : "";
            return {
                namedRegex: "^" + namedParameterizedRoute + catchAllGroupedRegex + "$"
            };
        }
 //# sourceMappingURL=route-regex.js.map
        /***/    },
    /***/ 4777: 
    /***/ function(__unused_webpack_module, exports) {
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
        Object.defineProperty(exports, "getSortedRoutes", {
            enumerable: true,
            get: function() {
                return getSortedRoutes;
            }
        });
        class UrlNode {
            insert(urlPath) {
                this._insert(urlPath.split("/").filter(Boolean), [], false);
            }
            smoosh() {
                return this._smoosh();
            }
            _smoosh(prefix) {
                if (prefix === void 0) prefix = "/";
                const childrenPaths = [ ...this.children.keys() ].sort();
                if (this.slugName !== null) {
                    childrenPaths.splice(childrenPaths.indexOf("[]"), 1);
                }
                if (this.restSlugName !== null) {
                    childrenPaths.splice(childrenPaths.indexOf("[...]"), 1);
                }
                if (this.optionalRestSlugName !== null) {
                    childrenPaths.splice(childrenPaths.indexOf("[[...]]"), 1);
                }
                const routes = childrenPaths.map((c => this.children.get(c)._smoosh("" + prefix + c + "/"))).reduce(((prev, curr) => [ ...prev, ...curr ]), []);
                if (this.slugName !== null) {
                    routes.push(...this.children.get("[]")._smoosh(prefix + "[" + this.slugName + "]/"));
                }
                if (!this.placeholder) {
                    const r = prefix === "/" ? "/" : prefix.slice(0, -1);
                    if (this.optionalRestSlugName != null) {
                        throw new Error('You cannot define a route with the same specificity as a optional catch-all route ("' + r + '" and "' + r + "[[..." + this.optionalRestSlugName + ']]").');
                    }
                    routes.unshift(r);
                }
                if (this.restSlugName !== null) {
                    routes.push(...this.children.get("[...]")._smoosh(prefix + "[..." + this.restSlugName + "]/"));
                }
                if (this.optionalRestSlugName !== null) {
                    routes.push(...this.children.get("[[...]]")._smoosh(prefix + "[[..." + this.optionalRestSlugName + "]]/"));
                }
                return routes;
            }
            _insert(urlPaths, slugNames, isCatchAll) {
                if (urlPaths.length === 0) {
                    this.placeholder = false;
                    return;
                }
                if (isCatchAll) {
                    throw new Error("Catch-all must be the last part of the URL.");
                }
                // The next segment in the urlPaths list
                                let nextSegment = urlPaths[0];
                // Check if the segment matches `[something]`
                                if (nextSegment.startsWith("[") && nextSegment.endsWith("]")) {
                    // Strip `[` and `]`, leaving only `something`
                    let segmentName = nextSegment.slice(1, -1);
                    let isOptional = false;
                    if (segmentName.startsWith("[") && segmentName.endsWith("]")) {
                        // Strip optional `[` and `]`, leaving only `something`
                        segmentName = segmentName.slice(1, -1);
                        isOptional = true;
                    }
                    if (segmentName.startsWith("...")) {
                        // Strip `...`, leaving only `something`
                        segmentName = segmentName.substring(3);
                        isCatchAll = true;
                    }
                    if (segmentName.startsWith("[") || segmentName.endsWith("]")) {
                        throw new Error("Segment names may not start or end with extra brackets ('" + segmentName + "').");
                    }
                    if (segmentName.startsWith(".")) {
                        throw new Error("Segment names may not start with erroneous periods ('" + segmentName + "').");
                    }
                    function handleSlug(previousSlug, nextSlug) {
                        if (previousSlug !== null) {
                            // If the specific segment already has a slug but the slug is not `something`
                            // This prevents collisions like:
                            // pages/[post]/index.js
                            // pages/[id]/index.js
                            // Because currently multiple dynamic params on the same segment level are not supported
                            if (previousSlug !== nextSlug) {
                                // TODO: This error seems to be confusing for users, needs an error link, the description can be based on above comment.
                                throw new Error("You cannot use different slug names for the same dynamic path ('" + previousSlug + "' !== '" + nextSlug + "').");
                            }
                        }
                        slugNames.forEach((slug => {
                            if (slug === nextSlug) {
                                throw new Error('You cannot have the same slug name "' + nextSlug + '" repeat within a single dynamic path');
                            }
                            if (slug.replace(/\W/g, "") === nextSegment.replace(/\W/g, "")) {
                                throw new Error('You cannot have the slug names "' + slug + '" and "' + nextSlug + '" differ only by non-word symbols within a single dynamic path');
                            }
                        }));
                        slugNames.push(nextSlug);
                    }
                    if (isCatchAll) {
                        if (isOptional) {
                            if (this.restSlugName != null) {
                                throw new Error('You cannot use both an required and optional catch-all route at the same level ("[...' + this.restSlugName + ']" and "' + urlPaths[0] + '" ).');
                            }
                            handleSlug(this.optionalRestSlugName, segmentName);
                            // slugName is kept as it can only be one particular slugName
                                                        this.optionalRestSlugName = segmentName;
                            // nextSegment is overwritten to [[...]] so that it can later be sorted specifically
                                                        nextSegment = "[[...]]";
                        } else {
                            if (this.optionalRestSlugName != null) {
                                throw new Error('You cannot use both an optional and required catch-all route at the same level ("[[...' + this.optionalRestSlugName + ']]" and "' + urlPaths[0] + '").');
                            }
                            handleSlug(this.restSlugName, segmentName);
                            // slugName is kept as it can only be one particular slugName
                                                        this.restSlugName = segmentName;
                            // nextSegment is overwritten to [...] so that it can later be sorted specifically
                                                        nextSegment = "[...]";
                        }
                    } else {
                        if (isOptional) {
                            throw new Error('Optional route parameters are not yet supported ("' + urlPaths[0] + '").');
                        }
                        handleSlug(this.slugName, segmentName);
                        // slugName is kept as it can only be one particular slugName
                                                this.slugName = segmentName;
                        // nextSegment is overwritten to [] so that it can later be sorted specifically
                                                nextSegment = "[]";
                    }
                }
                // If this UrlNode doesn't have the nextSegment yet we create a new child UrlNode
                                if (!this.children.has(nextSegment)) {
                    this.children.set(nextSegment, new UrlNode);
                }
                this.children.get(nextSegment)._insert(urlPaths.slice(1), slugNames, isCatchAll);
            }
            constructor() {
                this.placeholder = true;
                this.children = new Map;
                this.slugName = null;
                this.restSlugName = null;
                this.optionalRestSlugName = null;
            }
        }
        function getSortedRoutes(normalizedPages) {
            // First the UrlNode is created, and every UrlNode can have only 1 dynamic segment
            // Eg you can't have pages/[post]/abc.js and pages/[hello]/something-else.js
            // Only 1 dynamic segment per nesting level
            // So in the case that is test/integration/dynamic-routing it'll be this:
            // pages/[post]/comments.js
            // pages/blog/[post]/comment/[id].js
            // Both are fine because `pages/[post]` and `pages/blog` are on the same level
            // So in this case `UrlNode` created here has `this.slugName === 'post'`
            // And since your PR passed through `slugName` as an array basically it'd including it in too many possibilities
            // Instead what has to be passed through is the upwards path's dynamic names
            const root = new UrlNode;
            // Here the `root` gets injected multiple paths, and insert will break them up into sublevels
                        normalizedPages.forEach((pagePath => root.insert(pagePath)));
            // Smoosh will then sort those sublevels up to the point where you get the correct route definition priority
                        return root.smoosh();
        }
 //# sourceMappingURL=sorted-routes.js.map
        /***/    },
    /***/ 3987: 
    /***/ function(__unused_webpack_module, exports) {
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
        0 && 0;
        function _export(target, all) {
            for (var name in all) Object.defineProperty(target, name, {
                enumerable: true,
                get: all[name]
            });
        }
        _export(exports, {
            DecodeError: function() {
                return DecodeError;
            },
            MiddlewareNotFoundError: function() {
                return MiddlewareNotFoundError;
            },
            MissingStaticPage: function() {
                return MissingStaticPage;
            },
            NormalizeError: function() {
                return NormalizeError;
            },
            PageNotFoundError: function() {
                return PageNotFoundError;
            },
            SP: function() {
                return SP;
            },
            ST: function() {
                return ST;
            },
            WEB_VITALS: function() {
                return WEB_VITALS;
            },
            execOnce: function() {
                return execOnce;
            },
            getDisplayName: function() {
                return getDisplayName;
            },
            getLocationOrigin: function() {
                return getLocationOrigin;
            },
            getURL: function() {
                return getURL;
            },
            isAbsoluteUrl: function() {
                return isAbsoluteUrl;
            },
            isResSent: function() {
                return isResSent;
            },
            loadGetInitialProps: function() {
                return loadGetInitialProps;
            },
            normalizeRepeatedSlashes: function() {
                return normalizeRepeatedSlashes;
            },
            stringifyError: function() {
                return stringifyError;
            }
        });
        const WEB_VITALS = [ "CLS", "FCP", "FID", "INP", "LCP", "TTFB" ];
        function execOnce(fn) {
            let used = false;
            let result;
            return function() {
                for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
                    args[_key] = arguments[_key];
                }
                if (!used) {
                    used = true;
                    result = fn(...args);
                }
                return result;
            };
        }
        // Scheme: https://tools.ietf.org/html/rfc3986#section-3.1
        // Absolute URL: https://tools.ietf.org/html/rfc3986#section-4.3
                const ABSOLUTE_URL_REGEX = /^[a-zA-Z][a-zA-Z\d+\-.]*?:/;
        const isAbsoluteUrl = url => ABSOLUTE_URL_REGEX.test(url);
        function getLocationOrigin() {
            const {protocol: protocol, hostname: hostname, port: port} = window.location;
            return protocol + "//" + hostname + (port ? ":" + port : "");
        }
        function getURL() {
            const {href: href} = window.location;
            const origin = getLocationOrigin();
            return href.substring(origin.length);
        }
        function getDisplayName(Component) {
            return typeof Component === "string" ? Component : Component.displayName || Component.name || "Unknown";
        }
        function isResSent(res) {
            return res.finished || res.headersSent;
        }
        function normalizeRepeatedSlashes(url) {
            const urlParts = url.split("?");
            const urlNoQuery = urlParts[0];
            return urlNoQuery.replace(/\\/g, "/").replace(/\/\/+/g, "/") + (urlParts[1] ? "?" + urlParts.slice(1).join("?") : "");
        }
        async function loadGetInitialProps(App, ctx) {
            if (false) {
                var _App_prototype;
            }
            // when called from _app `ctx` is nested in `ctx`
                        const res = ctx.res || ctx.ctx && ctx.ctx.res;
            if (!App.getInitialProps) {
                if (ctx.ctx && ctx.Component) {
                    // @ts-ignore pageProps default
                    return {
                        pageProps: await loadGetInitialProps(ctx.Component, ctx.ctx)
                    };
                }
                return {};
            }
            const props = await App.getInitialProps(ctx);
            if (res && isResSent(res)) {
                return props;
            }
            if (!props) {
                const message = '"' + getDisplayName(App) + '.getInitialProps()" should resolve to an object. But found "' + props + '" instead.';
                throw new Error(message);
            }
            if (false) {}
            return props;
        }
        const SP = typeof performance !== "undefined";
        const ST = SP && [ "mark", "measure", "getEntriesByName" ].every((method => typeof performance[method] === "function"));
        class DecodeError extends Error {}
        class NormalizeError extends Error {}
        class PageNotFoundError extends Error {
            constructor(page) {
                super();
                this.code = "ENOENT";
                this.name = "PageNotFoundError";
                this.message = "Cannot find module for page: " + page;
            }
        }
        class MissingStaticPage extends Error {
            constructor(page, message) {
                super();
                this.message = "Failed to load static file for page: " + page + " " + message;
            }
        }
        class MiddlewareNotFoundError extends Error {
            constructor() {
                super();
                this.code = "ENOENT";
                this.message = "Cannot find the middleware module";
            }
        }
        function stringifyError(error) {
            return JSON.stringify({
                message: error.message,
                stack: error.stack
            });
        }
 //# sourceMappingURL=utils.js.map
        /***/    }
} ]);
//# sourceMappingURL=link_1.js.map