(self["webpackChunk_N_E"] = self["webpackChunk_N_E"] || []).push([ [ 845 ], {
    /***/ 8924: 
    /***/ function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {
        Promise.resolve().then(__webpack_require__.bind(__webpack_require__, 9767));
        /***/    },
    /***/ 9767: 
    /***/ function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        "use strict";
        __webpack_require__.r(__webpack_exports__);
        /* harmony export */        __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ default: function() {
                /* binding */ return SignupPage;
            }
            /* harmony export */        });
        /* harmony import */        var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7437);
        /* harmony import */        var _components_Icon__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(9140);
        /* harmony import */        var react__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(2265);
        /* harmony import */        var next_link__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(7648);
        /* harmony import */        var _components_SystemPrimitives__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(6983);
        /* harmony import */        var _components_SystemSurface__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(820);
        /* harmony import */        var _src_lib_supabase_ts__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(5526);
        /* __next_internal_client_entry_do_not_use__ default auto */        function SignupPage() {
            const [name, setName] = (0, react__WEBPACK_IMPORTED_MODULE_2__.useState)("");
            const [email, setEmail] = (0, react__WEBPACK_IMPORTED_MODULE_2__.useState)("");
            const [phone, setPhone] = (0, react__WEBPACK_IMPORTED_MODULE_2__.useState)("");
            const [consent, setConsent] = (0, react__WEBPACK_IMPORTED_MODULE_2__.useState)(false);
            const [errorMessage, setErrorMessage] = (0, react__WEBPACK_IMPORTED_MODULE_2__.useState)("");
            const [successMessage, setSuccessMessage] = (0, react__WEBPACK_IMPORTED_MODULE_2__.useState)("");
            const [pending, setPending] = (0, react__WEBPACK_IMPORTED_MODULE_2__.useState)(false);
            const [continuedFromLogin, setContinuedFromLogin] = (0, react__WEBPACK_IMPORTED_MODULE_2__.useState)(false);
            const nameField = (0, react__WEBPACK_IMPORTED_MODULE_2__.useRef)(null);
            // [로그인에서 이어받은 이메일 / Continue with the email entered at login]
                        (0, react__WEBPACK_IMPORTED_MODULE_2__.useEffect)((() => {
                var _get;
                const loginEmail = (_get = new URLSearchParams(window.location.search).get("email")) === null || _get === void 0 ? void 0 : _get.trim();
                if (loginEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail)) {
                    var _nameField_current;
                    setEmail(loginEmail);
                    setContinuedFromLogin(true);
                    (_nameField_current = nameField.current) === null || _nameField_current === void 0 ? void 0 : _nameField_current.focus();
                }
            }), []);
            // [이메일 인증으로 만드는 계정 / Create an account through email verification]
                        const handleSubmit = async e => {
                e.preventDefault();
                if (pending) return;
                setErrorMessage("");
                setSuccessMessage("");
                if (!name.trim()) {
                    setErrorMessage("이름을 입력해 주세요.");
                    return;
                }
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
                    setErrorMessage("유효한 이메일을 입력해 주세요.");
                    return;
                }
                if (!consent) {
                    setErrorMessage("개인정보 수집 및 이용에 동의해 주세요.");
                    return;
                }
                setPending(true);
                try {
                    await (0, _src_lib_supabase_ts__WEBPACK_IMPORTED_MODULE_6__ /* .requestEmailSignIn */ .uX)(email.trim(), {
                        createUser: true,
                        name: name.trim(),
                        phone: phone.trim()
                    });
                    setSuccessMessage("이메일로 로그인 링크를 보냈습니다.");
                } catch (e) {
                    setErrorMessage("가입 링크를 보내지 못했습니다. 이메일을 확인하고 잠시 후 다시 시도해 주세요.");
                } finally {
                    setPending(false);
                }
            };
            // [계정 공통 조작 / Shared account form controls]
                         
            return (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                className: "flow-page account-page",
                children: [ 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("section", {
                    className: "page-heading",
                    id: "page-heading",
                    children:   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                        className: "container",
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("nav", {
                            className: "breadcrumbs",
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
                                href: "/account",
                                children: "마이페이지"
                            }), 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", {
                                "data-text": "body",
                                "aria-hidden": "true",
                                children: "/"
                            }), 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", {
                                "data-text": "body",
                                "aria-current": "page",
                                children: "회원가입"
                            }) ]
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", {
                            className: "page-title-row",
                            children:   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                children: [ 
                                
                                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h1", {
                                    "data-text": "title",
                                    children: "회원가입"
                                }), 
                                
                                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                                    "data-text": "body",
                                    className: "page-description",
                                    children: "이메일을 확인하고 나의 공간과 관람노트를 이용하세요."
                                }) ]
                            })
                        }) ]
                    })
                }), 
                
                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", {
                    className: "container page-content flow-content",
                    children:   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                        className: "account-auth-layout",
                        children: [ 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("section", {
                            className: "account-auth-intro",
                            "aria-labelledby": "account-intro-title",
                            children: [ 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("h2", {
                                "data-text": "heading",
                                id: "account-intro-title",
                                children: [ "나만의 공간에서", 
                                
                                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("br", {}), "다음 관람을 준비해요." ]
                            }), 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                                "data-text": "body",
                                children: "관심 가는 프로그램을 모으고, 다음 관람을 준비해 보세요."
                            }), 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("img", {
                                className: "account-auth-photo",
                                src: "/v5/assets/images/sejong-grand-auditorium.png",
                                width: 1160,
                                height: 680,
                                alt: "세종대극장의 객석"
                            }) ]
                        }), 
                        
                         (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs /* .SystemSurface */)(_components_SystemSurface__WEBPACK_IMPORTED_MODULE_5__.eM, {
                            as: "form",
                            variant: "panel",
                            padding: "lg",
                            className: "flow-panel",
                            "data-account-auth": "signup",
                            onSubmit: handleSubmit,
                            noValidate: true,
                            children: [ 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h2", {
                                "data-text": "heading",
                                children: "회원가입"
                            }), 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                                "data-text": "body",
                                className: "flow-fineprint",
                                children: "가입할 이메일로 보낸 링크를 열면 계정을 사용할 수 있습니다."
                            }), 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("p", {
                                "data-text": "body",
                                className: "flow-fineprint",
                                children: [ "이미 가입했다면 ", 
                                
                                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(next_link__WEBPACK_IMPORTED_MODULE_3__["default"], {
                                    "data-text": "action",
                                    href: "/account/login",
                                    children: "로그인"
                                }), "을 이용하세요." ]
                            }), continuedFromLogin &&   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .SystemNotice */)(_components_SystemPrimitives__WEBPACK_IMPORTED_MODULE_4__.F0, {
                                "data-text": "body",
                                variant: "flow",
                                children: "입력한 이메일로 회원가입을 이어갑니다. 이름을 입력하고 필수 동의를 확인해 주세요."
                            }), errorMessage &&   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .SystemNotice */)(_components_SystemPrimitives__WEBPACK_IMPORTED_MODULE_4__.F0, {
                                "data-text": "body",
                                variant: "flow",
                                error: true,
                                className: "flow-error",
                                id: "flow-error",
                                tabIndex: -1,
                                children: errorMessage
                            }), 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .SystemField */)(_components_SystemPrimitives__WEBPACK_IMPORTED_MODULE_4__.RK, {
                                "data-text": "body",
                                ref: nameField,
                                variant: "flow",
                                outerClassName: "form-field",
                                label:   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.Fragment, {
                                    children: [ "이름 ", 
                                    
                                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", {
                                        "data-text": "body",
                                        className: "flow-required",
                                        "aria-hidden": "true",
                                        children: "*"
                                    }), 
                                    
                                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", {
                                        "data-text": "body",
                                        className: "sr-only",
                                        children: "필수"
                                    }) ]
                                }),
                                id: "flow-name",
                                name: "name",
                                required: true,
                                autoComplete: "name",
                                maxLength: 40,
                                type: "text",
                                placeholder: "이름을 입력해 주세요",
                                value: name,
                                onChange: e => setName(e.target.value),
                                disabled: pending
                            }), 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .SystemField */)(_components_SystemPrimitives__WEBPACK_IMPORTED_MODULE_4__.RK, {
                                "data-text": "body",
                                variant: "flow",
                                outerClassName: "form-field",
                                label:   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.Fragment, {
                                    children: [ "이메일 ", 
                                    
                                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", {
                                        "data-text": "body",
                                        className: "flow-required",
                                        "aria-hidden": "true",
                                        children: "*"
                                    }), 
                                    
                                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", {
                                        "data-text": "body",
                                        className: "sr-only",
                                        children: "필수"
                                    }) ]
                                }),
                                id: "flow-email",
                                name: "email",
                                required: true,
                                autoComplete: "email",
                                type: "email",
                                placeholder: "name@example.com",
                                value: email,
                                onChange: e => setEmail(e.target.value),
                                disabled: pending
                            }), 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .SystemField */)(_components_SystemPrimitives__WEBPACK_IMPORTED_MODULE_4__.RK, {
                                "data-text": "body",
                                variant: "flow",
                                outerClassName: "form-field",
                                label:   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.Fragment, {
                                    children: [ "연락처 ", 
                                    
                                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", {
                                        "data-text": "body",
                                        className: "flow-optional",
                                        children: "(선택)"
                                    }) ]
                                }),
                                id: "flow-phone",
                                name: "phone",
                                autoComplete: "tel",
                                type: "tel",
                                placeholder: "010-0000-0000",
                                value: phone,
                                onChange: e => setPhone(e.target.value),
                                disabled: pending
                            }), 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* .SystemCheckbox */)(_components_SystemPrimitives__WEBPACK_IMPORTED_MODULE_4__.U1, {
                                "data-text": "label",
                                className: "flow-consent",
                                label:   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("span", {
                                    "data-text": "body",
                                    children: [ "회원가입을 위한 개인정보 수집 및 이용에 동의합니다. ", 
                                    
                                     (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("strong", {
                                        "data-text": "item-title",
                                        children: "(필수)"
                                    }) ]
                                }),
                                name: "consent",
                                required: true,
                                checked: consent,
                                onChange: e => setConsent(e.target.checked),
                                disabled: pending
                            }), 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs /* .SystemButton */)(_components_SystemPrimitives__WEBPACK_IMPORTED_MODULE_4__.kR, {
                                "data-text": "action",
                                context: "flow",
                                className: "flow-button-full",
                                type: "submit",
                                disabled: pending,
                                "aria-busy": pending,
                                children: [ pending ? "가입 링크 전송 중…" : "이메일로 가입 링크 받기", 
                                
                                 (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx /* ["default"] */)(_components_Icon__WEBPACK_IMPORTED_MODULE_1__.Z, {
                                    name: "arrow",
                                    size: 20
                                }) ]
                            }), successMessage &&   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs /* .SystemNotice */)(_components_SystemPrimitives__WEBPACK_IMPORTED_MODULE_4__.F0, {
                                "data-text": "body",
                                variant: "flow",
                                className: "flow-info-box",
                                children: [ successMessage, " 받은 이메일의 링크를 열어 가입을 완료해 주세요." ]
                            }), 
                            
                             (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", {
                                className: "account-auth-links",
                                children:   (0, react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(next_link__WEBPACK_IMPORTED_MODULE_3__["default"], {
                                    "data-text": "action",
                                    href: "/account/login",
                                    children: "로그인으로 돌아가기"
                                })
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
    /***/ 5526: 
    /***/ function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        "use strict";
        /* harmony export */        __webpack_require__.d(__webpack_exports__, {
            /* harmony export */ LU: function() {
                /* binding */ return getGoogleOAuthAvailability;
            },
            /* harmony export */ OQ: function() {
                /* binding */ return supabase;
            },
            /* harmony export */ je: function() {
                /* binding */ return EmailSignupRequiredError;
            },
            /* harmony export */ jv: function() {
                /* binding */ return isSupabaseConfigured;
            },
            /* harmony export */ qj: function() {
                /* binding */ return signInWithGoogle;
            },
            /* harmony export */ uX: function() {
                /* binding */ return requestEmailSignIn;
            },
            /* harmony export */ vU: function() {
                /* binding */ return resolveAccountIdentity;
            }
            /* harmony export */        });
        /* unused harmony exports createDemoProfile, isPublicSupabaseKey, getAccountCallbackUrl, isGoogleOAuthEnabled, signInWithOAuthProvider, signOut, getCurrentUser, onAuthStateChange */
        /* harmony import */        var _supabase_supabase_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(897);
        function resolveAccountIdentity(user) {
            let _storage = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
            const text = value => typeof value === "string" ? value.trim() : "";
            if (user === null || user === void 0 ? void 0 : user.id) {
                var _user_email;
                const metadata = user.user_metadata || {};
                return {
                    profile: {
                        name: text(metadata.full_name) || text(metadata.name) || text((_user_email = user.email) === null || _user_email === void 0 ? void 0 : _user_email.split("@")[0]) || "관람객",
                        email: text(user.email),
                        phone: text(metadata.phone) || text(user.phone)
                    },
                    isLoggedIn: true,
                    mode: "oauth",
                    ready: true,
                    identityId: user.id
                };
            }
            return {
                profile: {
                    name: "",
                    email: "",
                    phone: ""
                },
                isLoggedIn: false,
                mode: "guest",
                ready: true,
                identityId: "guest"
            };
        }
        // [체험 계정의 안정적인 식별자 / Stable local demo identity]
                function createDemoProfile(profile) {
            let previousRaw = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
            var _globalThis_crypto_randomUUID, _globalThis_crypto;
            let previous = null;
            try {
                previous = JSON.parse(previousRaw || "null");
            } catch (e) {}
            const previousEmail = typeof (previous === null || previous === void 0 ? void 0 : previous.email) === "string" ? previous.email.trim().toLowerCase() : "";
            const previousId = typeof (previous === null || previous === void 0 ? void 0 : previous.localId) === "string" ? previous.localId.trim() : "";
            const localId = previousEmail && previousEmail === profile.email.trim().toLowerCase() ? previousId || previousEmail : ((_globalThis_crypto = globalThis.crypto) === null || _globalThis_crypto === void 0 ? void 0 : (_globalThis_crypto_randomUUID = _globalThis_crypto.randomUUID) === null || _globalThis_crypto_randomUUID === void 0 ? void 0 : _globalThis_crypto_randomUUID.call(_globalThis_crypto)) || "local-".concat(Date.now().toString(36), "-").concat(Math.random().toString(36).slice(2));
            return {
                ...profile,
                localId: localId
            };
        }
        // [브라우저 공개 설정 검증 / Browser public configuration validation]
                function isPublicSupabaseKey(key) {
            if (key.startsWith("sb_publishable_")) return true;
            if (key.startsWith("sb_secret_")) return false;
            try {
                const payload = key.split(".")[1];
                return JSON.parse(globalThis.atob(payload.replace(/-/g, "+").replace(/_/g, "/"))).role === "anon";
            } catch (e) {
                return false;
            }
        }
        const supabaseUrl = "https://cowalyqaoqoclrfmxszp.supabase.co" || 0;
        const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvd2FseXFhb3FvY2xyZm14c3pwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzNDU2OTAsImV4cCI6MjEwNzkyMTY5MH0.AURrQwk9gjkfb6teqGVa8OWJ3YWs7gCS9AYwTvHNnyQ" || 0;
        const isSupabaseConfigured = Boolean(supabaseUrl && isPublicSupabaseKey(supabaseAnonKey) && supabaseUrl !== "https://your-project-id.supabase.co");
        // Supabase 클라이언트 싱글톤 인스턴스 (설정값이 있을 때만 활성화)
                const supabase = isSupabaseConfigured ? (0, _supabase_supabase_js__WEBPACK_IMPORTED_MODULE_0__ /* .createClient */ .eI)(supabaseUrl, supabaseAnonKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: false,
                flowType: "pkce"
            }
        }) : null;
        // [고정 OAuth 복귀 경로와 제공자 상태 / Fixed OAuth callback and provider availability]
                function getAccountCallbackUrl(origin) {
            const url = new URL(origin);
            const local = [ "localhost", "127.0.0.1", "[::1]" ].includes(url.hostname);
            if (url.protocol !== "https:" && !(local && url.protocol === "http:") || url.username || url.password || url.search || url.hash || url.pathname !== "/") {
                throw new Error("로그인을 시작한 사이트 주소를 확인해 주세요.");
            }
            return new URL("/v5/account/callback/", url.origin).href;
        }
        function isGoogleOAuthEnabled(settings) {
            return Boolean(settings && typeof settings === "object" && "external" in settings && settings.external && typeof settings.external === "object" && "google" in settings.external && settings.external.google === true);
        }
        async function getGoogleOAuthAvailability(signal) {
            if (!isSupabaseConfigured) return false;
            const response = await fetch("".concat(supabaseUrl, "/auth/v1/settings"), {
                headers: {
                    apikey: supabaseAnonKey
                },
                signal: signal,
                cache: "no-store"
            });
            if (!response.ok) throw new Error("로그인 서비스 연결을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.");
            return isGoogleOAuthEnabled(await response.json());
        }
        // [소셜 로그인과 세션 / Social sign-in and sessions]
                async function signInWithOAuthProvider() {
            let provider = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "google", redirectTo = arguments.length > 1 ? arguments[1] : void 0;
            if (!supabase) {
                throw new Error("Supabase 환경 변수가 설정되지 않았습니다. .env.local을 확인해 주세요.");
            }
            const origin = true ? window.location.origin : 0;
            const callbackUrl = getAccountCallbackUrl(origin);
            // A caller-supplied URL cannot turn this helper into an open redirect.
                        if (redirectTo && new URL(redirectTo, origin).origin !== origin) {
                throw new Error("다른 사이트로 이동하는 로그인 요청은 사용할 수 없습니다.");
            }
            const targetUrl = callbackUrl;
            const {data: data, error: error} = await supabase.auth.signInWithOAuth({
                provider: provider,
                options: {
                    redirectTo: targetUrl
                }
            });
            if (error) throw error;
            return data;
        }
        async function signInWithGoogle(redirectTo) {
            return signInWithOAuthProvider("google", redirectTo);
        }
        // [이메일 소유 확인을 거친 실제 로그인 / Real sign-in after verifying email ownership]
                class EmailSignupRequiredError extends Error {
            constructor() {
                super("입력한 이메일로 회원가입을 이어가 주세요.");
                this.name = "EmailSignupRequiredError";
            }
        }
        async function requestEmailSignIn(email) {
            let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
            var _options_name, _options_name1, _options_phone;
            if (!supabase) throw new Error("로그인 서비스에 연결하지 못했습니다.");
            const {error: error} = await supabase.auth.signInWithOtp({
                email: email.trim(),
                options: {
                    shouldCreateUser: options.createUser === true,
                    emailRedirectTo: getAccountCallbackUrl(window.location.origin),
                    ...options.createUser ? {
                        data: {
                            name: (_options_name = options.name) === null || _options_name === void 0 ? void 0 : _options_name.trim(),
                            full_name: (_options_name1 = options.name) === null || _options_name1 === void 0 ? void 0 : _options_name1.trim(),
                            phone: (_options_phone = options.phone) === null || _options_phone === void 0 ? void 0 : _options_phone.trim()
                        }
                    } : {}
                }
            });
            if (error) {
                // 다른 전송 오류를 미등록 계정으로 해석하지 않음 / Do not treat other delivery errors as missing accounts.
                if (options.createUser !== true && error.code === "otp_disabled" && error.message === "Signups not allowed for otp") {
                    throw new EmailSignupRequiredError;
                }
                throw new Error("로그인 링크를 보내지 못했습니다. 이메일 주소를 확인하고 잠시 후 다시 시도해 주세요.");
            }
        }
        /**
 * 로그아웃
 */        async function signOut() {
            if (!supabase) return;
            const {error: error} = await supabase.auth.signOut();
            if (error) throw error;
        }
        /**
 * 현재 로그인된 사용자 정보 취득
 */        async function getCurrentUser() {
            if (!supabase) return null;
            const {data: {user: user}} = await supabase.auth.getUser();
            return user;
        }
        /**
 * 인증 상태 변경 리스너
 */        function onAuthStateChange(callback) {
            if (!supabase) return () => {};
            const {data: {subscription: subscription}} = supabase.auth.onAuthStateChange(((event, session) => {
                callback(event, session);
            }));
            return () => subscription.unsubscribe();
        }
        /***/    }
}, 
/******/ function(__webpack_require__) {
    // webpackRuntimeModules
    /******/ var __webpack_exec__ = function(moduleId) {
        return __webpack_require__(__webpack_require__.s = moduleId);
    }
    /******/;
    __webpack_require__.O(0, [ 762, 648, 369, 498, 971, 117, 744 ], (function() {
        return __webpack_exec__(8924);
    }));
    /******/    var __webpack_exports__ = __webpack_require__.O();
    /******/    _N_E = __webpack_exports__;
    /******/} ]);
//# sourceMappingURL=page_1.js.map