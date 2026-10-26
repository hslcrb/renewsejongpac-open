(self["webpackChunk_N_E"] = self["webpackChunk_N_E"] || []).push([ [ 626 ], {
    /***/ 3257: 
    /***/ function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {
        Promise.resolve().then(__webpack_require__.bind(__webpack_require__, 6374));
        /***/    },
    /***/ 6374: 
    /***/ function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        "use strict";
        __webpack_require__.r(__webpack_exports__);
        /* harmony export */        __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ default: function() {
                /* binding */ return LoginRedirectPage;
            }
            /* harmony export */        });
        /* harmony import */        var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7437);
        /* harmony import */        var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(2265);
        /* harmony import */        var next_navigation__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(9376);
        /* __next_internal_client_entry_do_not_use__ default auto */        function LoginRedirectPage() {
            const router = (0, next_navigation__WEBPACK_IMPORTED_MODULE_2__.useRouter)();
            (0, react__WEBPACK_IMPORTED_MODULE_1__.useEffect)((() => {
                router.replace("/account/login");
            }), [ router ]);
             
            return (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", {
                style: {
                    padding: "4rem 1rem",
                    textAlign: "center"
                },
                children:   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                    "data-text": "body",
                    children: "로그인 페이지로 이동 중입니다..."
                })
            });
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
        /***/    }
}, 
/******/ function(__webpack_require__) {
    // webpackRuntimeModules
    /******/ var __webpack_exec__ = function(moduleId) {
        return __webpack_require__(__webpack_require__.s = moduleId);
    }
    /******/;
    __webpack_require__.O(0, [ 971, 117, 744 ], (function() {
        return __webpack_exec__(3257);
    }));
    /******/    var __webpack_exports__ = __webpack_require__.O();
    /******/    _N_E = __webpack_exports__;
    /******/} ]);
//# sourceMappingURL=page_1.js.map