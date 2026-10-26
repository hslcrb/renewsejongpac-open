(self["webpackChunk_N_E"] = self["webpackChunk_N_E"] || []).push([ [ 638 ], {
    /***/ 8884: 
    /***/ function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {
        Promise.resolve().then(__webpack_require__.bind(__webpack_require__, 1913));
        /***/    },
    /***/ 1913: 
    /***/ function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        "use strict";
        // ESM COMPAT FLAG
                __webpack_require__.r(__webpack_exports__);
        // EXPORTS
                __webpack_require__.d(__webpack_exports__, {
            default: function() {
                /* binding */ return DesignRulesPage;
            }
        });
        // EXTERNAL MODULE: ./node_modules/next/dist/compiled/react/jsx-runtime.js
                var jsx_runtime = __webpack_require__(7437);
        // EXTERNAL MODULE: ./node_modules/next/dist/compiled/react/index.js
                var react = __webpack_require__(2265);
        // EXTERNAL MODULE: ./node_modules/next/dist/api/link.js
                var api_link = __webpack_require__(7648);
        // EXTERNAL MODULE: ./components/Icon.tsx
                var Icon = __webpack_require__(9140);
        // EXTERNAL MODULE: ./components/ProgramCard.tsx
                var ProgramCard = __webpack_require__(563);
        // EXTERNAL MODULE: ./components/FloatingMenu.tsx
                var FloatingMenu = __webpack_require__(9378);
        // EXTERNAL MODULE: ./components/LiquidGlass.tsx + 1 modules
                var LiquidGlass = __webpack_require__(8948);
        // EXTERNAL MODULE: ./components/SystemPrimitives.tsx
                var SystemPrimitives = __webpack_require__(6983);
        // EXTERNAL MODULE: ./src/lib/liquid-glass.ts
                var liquid_glass = __webpack_require__(9174);
        // CONCATENATED MODULE: ./app/design-rules/_documentation/LiquidGlassDemo.tsx
        /* __next_internal_client_entry_do_not_use__ default auto */
        // [같은 컴포넌트의 재질 비교 / Compare material settings on the actual component]
        function LiquidGlassDemo(param) {
            let {onCopy: onCopy, copied: copied} = param;
            const [variant, setVariant] = (0, react.useState)("surface");
            const [opacity, setOpacity] = (0, react.useState /* GLASS_DEFAULTS */)(liquid_glass.Fp.opacity);
            const [refraction, setRefraction] = (0, react.useState /* GLASS_DEFAULTS */)(liquid_glass.Fp.refraction);
            const material = liquid_glass /* GLASS_VARIANTS */ .GD[variant];
            const code = 'import LiquidGlass from "@/components/LiquidGlass";\n\n<LiquidGlass variant="'.concat(variant, '">\n    <h2 data-text="heading">세종문화회관</h2>\n    <p data-text="body">유리 위의 콘텐츠는 선명하게 유지됩니다.</p>\n</LiquidGlass>');
            // [문서에서만 사용하는 재질 실험 코드 / Material experiment code for documentation only]
                        const documentationOnlyCode = '// DOCUMENTATION_ONLY: LiquidGlassDemo 안에서만 사용\n<LiquidGlass variant="'.concat(variant, '" opacity={').concat(opacity.toFixed(2), "} refraction={").concat(refraction, "} blur={").concat(material.blur, "} thickness={").concat(material.thickness, '}>\n    <p data-text="body">문서 전용 재질 실험</p>\n</LiquidGlass>');
             
            return (0, jsx_runtime.jsxs)("div", {
                "data-documentation-tool": "glass-demo",
                "data-component-owner": "glass",
                children: [ 
                
                 (0, jsx_runtime.jsxs)("div", {
                    className: "ds-glass-variant",
                    children: [ 
                    
                     (0, jsx_runtime.jsx)("label", {
                        "data-text": "label",
                        htmlFor: "glass-variant",
                        children: "재질 베리언트"
                    }), 
                    
                     (0, jsx_runtime.jsxs)("select", {
                        id: "glass-variant",
                        value: variant,
                        onChange: event => {
                            const next = event.target.value;
                            setVariant(next);
                            setOpacity(liquid_glass /* GLASS_VARIANTS */ .GD[next].opacity);
                            setRefraction(liquid_glass /* GLASS_VARIANTS */ .GD[next].refraction);
                        },
                        children: [ 
                        
                         (0, jsx_runtime.jsx)("option", {
                            "data-text": "label",
                            value: "surface",
                            children: "Surface · 기본 표면"
                        }), 
                        
                         (0, jsx_runtime.jsx)("option", {
                            "data-text": "label",
                            value: "drawer",
                            children: "Drawer · 모바일 서랍"
                        }), 
                        
                         (0, jsx_runtime.jsx)("option", {
                            "data-text": "label",
                            value: "hero",
                            children: "Hero · 히어로 안내"
                        }), 
                        
                         (0, jsx_runtime.jsx)("option", {
                            "data-text": "label",
                            value: "white",
                            children: "White · 밝은 알림"
                        }), 
                        
                         (0, jsx_runtime.jsx)("option", {
                            "data-text": "label",
                            value: "black",
                            children: "Black · 알림 캡슐"
                        }) ]
                    }) ]
                }), 
                
                 (0, jsx_runtime.jsxs)("div", {
                    className: "ds-glass-stage",
                    children: [ 
                    
                     (0, jsx_runtime.jsx)("img", {
                        src: "/v5/assets/images/sejong-grand-interior.png",
                        alt: "",
                        className: "ds-glass-backdrop"
                    }), 
                    
                     (0, jsx_runtime.jsxs /* default */)(LiquidGlass.Z, {
                        variant: variant,
                        className: "ds-glass-example",
                        opacity: opacity,
                        refraction: refraction,
                        children: [ 
                        
                         (0, jsx_runtime.jsx)("code", {
                            "data-text": "caption",
                            className: "ds-glass-component-name",
                            children: "LiquidGlass"
                        }), 
                        
                         (0, jsx_runtime.jsx)("h3", {
                            "data-text": "heading",
                            children: "빛을 머금은 유리"
                        }), 
                        
                         (0, jsx_runtime.jsx)("p", {
                            "data-text": "body",
                            children: "배경은 가장자리에서 꺾이고, 글자는 선명하게 남습니다."
                        }) ]
                    }) ]
                }), 
                
                 (0, jsx_runtime.jsxs)("div", {
                    className: "ds-glass-controls",
                    children: [ 
                    
                     (0, jsx_runtime.jsxs)("div", {
                        children: [ 
                        
                         (0, jsx_runtime.jsxs)("label", {
                            "data-text": "label",
                            htmlFor: "glass-opacity",
                            children: [ "불투명도", " ", 
                            
                             (0, jsx_runtime.jsxs)("output", {
                                "data-text": "meta",
                                htmlFor: "glass-opacity",
                                children: [ Math.round(opacity * 100), "%" ]
                            }) ]
                        }), 
                        
                         (0, jsx_runtime.jsx)("input", {
                            id: "glass-opacity",
                            type: "range",
                            min: "0.4",
                            max: "0.96",
                            step: "0.01",
                            value: opacity,
                            "aria-valuetext": "".concat(Math.round(opacity * 100), "%"),
                            onChange: event => setOpacity(Number(event.target.value))
                        }) ]
                    }), 
                    
                     (0, jsx_runtime.jsxs)("div", {
                        children: [ 
                        
                         (0, jsx_runtime.jsxs)("label", {
                            "data-text": "label",
                            htmlFor: "glass-refraction",
                            children: [ "굴절 강도 ", 
                            
                             (0, jsx_runtime.jsx)("output", {
                                "data-text": "meta",
                                htmlFor: "glass-refraction",
                                children: refraction
                            }) ]
                        }), 
                        
                         (0, jsx_runtime.jsx)("input", {
                            id: "glass-refraction",
                            type: "range",
                            min: "0",
                            max: "120",
                            step: "1",
                            value: refraction,
                            onChange: event => setRefraction(Number(event.target.value))
                        }) ]
                    }) ]
                }), 
                
                 (0, jsx_runtime.jsxs)("div", {
                    className: "ds-demo-actions",
                    children: [ 
                    
                     (0, jsx_runtime.jsx /* SystemButton */)(SystemPrimitives.kR, {
                        variant: "quiet",
                        onClick: () => {
                            setOpacity(material.opacity);
                            setRefraction(material.refraction);
                        },
                        children: "기본값으로"
                    }), 
                    
                     (0, jsx_runtime.jsx /* SystemButton */)(SystemPrimitives.kR, {
                        variant: "secondary",
                        onClick: () => onCopy(code),
                        children: copied ? "복사됨" : "제품 코드 복사"
                    }) ]
                }), 
                
                 (0, jsx_runtime.jsx)("pre", {
                    className: "ds-code-block",
                    children:   (0, jsx_runtime.jsx)("code", {
                        "data-text": "body",
                        children: code
                    })
                }), 
                
                 (0, jsx_runtime.jsx)("p", {
                    "data-text": "caption",
                    children: "제품에서는 variant로 재질을 선택합니다. 아래 조절값 코드는 가이드 안의 재질 실험 전용입니다."
                }), 
                
                 (0, jsx_runtime.jsxs)("details", {
                    children: [ 
                    
                     (0, jsx_runtime.jsx)("summary", {
                        "data-text": "label",
                        children: "문서 전용 실험 코드"
                    }), 
                    
                     (0, jsx_runtime.jsx)("pre", {
                        className: "ds-code-block",
                        children:   (0, jsx_runtime.jsx)("code", {
                            "data-text": "body",
                            children: documentationOnlyCode
                        })
                    }), 
                    
                     (0, jsx_runtime.jsx /* SystemButton */)(SystemPrimitives.kR, {
                        variant: "secondary",
                        onClick: () => onCopy(documentationOnlyCode),
                        children: "문서 전용 코드 복사"
                    }) ]
                }) ]
            });
        }
        // EXTERNAL MODULE: ./src/system/component-contracts.ts
                var component_contracts = __webpack_require__(1666);
        // EXTERNAL MODULE: ./src/data/design-tokens.ts
                var design_tokens = __webpack_require__(1788);
        // CONCATENATED MODULE: ./src/data/component-registry.ts
        // [실제 구현과 가이드의 등록부 / Registry connecting implementation and documentation]
        // 사용 횟수는 직접 적지 않고 소스 분석으로 생성합니다.
        // Usage is generated by source analysis, never maintained as a manual count.
        const definitions = [ {
            id: "completed-page",
            name: "CompletedPage",
            source: "components/CompletedPage.tsx",
            exportName: "default",
            kind: "structure",
            guide: "components/registry",
            purpose: "명시한 미구현 경로의 본문·자료·목록·시설 비교·일정과 신청을 기존 부품으로 조합",
            previewRoute: "/v5/about/esg/"
        }, {
            id: "service-request",
            name: "ServiceRequestForm",
            source: "components/ServiceRequestForm.tsx",
            exportName: "default",
            kind: "ui",
            guide: "components/registry",
            purpose: "서버 검증과 본인 신청 기록 조회·취소를 연결하는 공통 신청 양식",
            parent: "completed-page",
            previewRoute: "/v5/rental/apply/"
        }, {
            id: "service-goods",
            name: "ServiceGoods",
            source: "components/ServiceGoods.tsx",
            exportName: "default",
            kind: "ui",
            guide: "components/registry",
            purpose: "공개 상품·본인 장바구니·서버 금액의 미결제 구매 요청",
            parent: "completed-page",
            previewRoute: "/v5/news/goods/"
        }, {
            id: "text",
            name: "SystemText",
            source: "components/SystemText.tsx",
            exportName: "SystemText",
            kind: "ui",
            guide: "typography/family",
            purpose: "모든 글자의 위계 속성과 데스크톱 최소 16px를 공유"
        }, {
            id: "surface",
            name: "SystemSurface",
            source: "components/SystemSurface.tsx",
            exportName: "SystemSurface",
            kind: "ui",
            guide: "layout/shape",
            purpose: "부드러운 스트로크와 공통 곡률의 재사용 표면"
        }, {
            id: "button",
            name: "SystemButton",
            source: "components/SystemPrimitives.tsx",
            exportName: "SystemButton",
            kind: "ui",
            guide: "components/buttons",
            purpose: "동작을 실행하는 공통 버튼",
            nativeControls: [ "button" ]
        }, {
            id: "button-link",
            name: "SystemLink",
            source: "components/SystemPrimitives.tsx",
            exportName: "SystemLink",
            kind: "ui",
            guide: "components/registry",
            purpose: "버튼과 규격을 공유하는 이동 링크"
        }, {
            id: "control-group",
            name: "SystemControlGroup",
            source: "components/SystemControlGroup.tsx",
            exportName: "SystemControlGroup",
            kind: "structure",
            guide: "components/navigation",
            purpose: "버튼과 링크의 폭을 퍼센트로 나누고 줄바꿈과 같은 행의 높이를 공유"
        }, {
            id: "icon-button",
            name: "SystemIconButton",
            source: "components/SystemPrimitives.tsx",
            exportName: "SystemIconButton",
            kind: "ui",
            guide: "components/registry",
            purpose: "원형 48px 아이콘 조작"
        }, {
            id: "filter-button",
            name: "SystemFilterButton",
            source: "components/SystemPrimitives.tsx",
            exportName: "SystemFilterButton",
            kind: "ui",
            guide: "components/navigation",
            purpose: "같은 목록에 조건을 적용하는 선택 버튼"
        }, {
            id: "field",
            name: "SystemField",
            source: "components/SystemPrimitives.tsx",
            exportName: "SystemField",
            kind: "ui",
            guide: "components/fields",
            purpose: "레이블·도움말·오류를 연결하는 입력",
            nativeControls: [ "input", "select", "textarea" ]
        }, {
            id: "checkbox",
            name: "SystemCheckbox",
            source: "components/SystemPrimitives.tsx",
            exportName: "SystemCheckbox",
            kind: "ui",
            guide: "components/registry",
            purpose: "동의와 복수 선택을 위한 네이티브 체크박스",
            nativeControls: [ "input" ]
        }, {
            id: "badge",
            name: "SystemBadge",
            source: "components/SystemPrimitives.tsx",
            exportName: "SystemBadge",
            kind: "ui",
            guide: "components/feedback",
            purpose: "분류와 상태 표시"
        }, {
            id: "notice",
            name: "SystemNotice",
            source: "components/SystemPrimitives.tsx",
            exportName: "SystemNotice",
            kind: "ui",
            guide: "components/feedback",
            purpose: "입력 오류와 처리 결과"
        }, {
            id: "tabs",
            name: "SystemTabs",
            source: "components/SystemNavigation.tsx",
            exportName: "SystemTabs",
            kind: "ui",
            guide: "components/navigation",
            purpose: "방향키·Home·End로 탐색하는 실제 탭",
            nativeControls: [ "button" ]
        }, {
            id: "disclosure",
            name: "SystemDisclosure",
            source: "components/SystemNavigation.tsx",
            exportName: "SystemDisclosure",
            kind: "ui",
            guide: "components/navigation",
            purpose: "브라우저 기본 동작을 유지하는 펼침"
        }, {
            id: "dialog",
            name: "SystemDialog",
            source: "components/SystemDialog.tsx",
            exportName: "default",
            kind: "ui",
            guide: "components/feedback",
            purpose: "검색과 확인 창의 초점·스크롤·닫기 수명 주기"
        }, {
            id: "icon",
            name: "Icon",
            source: "components/Icon.tsx",
            exportName: "default",
            kind: "ui",
            guide: "brand/icons",
            purpose: "Material Rounded의 윤곽·채움 아이콘"
        }, {
            id: "poster",
            name: "ProgramCard",
            source: "components/ProgramCard.tsx",
            exportName: "default",
            kind: "ui",
            guide: "components/cards",
            purpose: "프로그램 포스터·메타·관심 저장"
        }, {
            id: "hero-carousel",
            name: "HeroCarousel",
            source: "components/HeroCarousel.tsx",
            exportName: "default",
            kind: "structure",
            guide: "components/registry",
            purpose: "대표 작품·양옆 제목·정보 레일·드래그와 재생 조작을 묶는 히어로",
            previewRoute: "/v5/#featured-season"
        }, {
            id: "hero-slide",
            name: "HeroSlide",
            source: "components/HeroSlide.tsx",
            exportName: "default",
            kind: "ui",
            guide: "components/registry",
            purpose: "대표 이미지·소개·상세와 예매 행동 및 인접 작품 미리보기",
            parent: "hero-carousel"
        }, {
            id: "season-banner",
            name: "SeasonBanner",
            source: "components/SeasonBanner.tsx",
            exportName: "default",
            kind: "ui",
            guide: "components/registry",
            purpose: "기획 시즌으로 이어지는 편집형 배너"
        }, {
            id: "hero-companion",
            name: "HeroCompanion",
            source: "components/HeroCompanion.tsx",
            exportName: "default",
            kind: "ui",
            guide: "components/registry",
            purpose: "공식 티켓오픈 목록·서울 시계·다음 오픈"
        }, {
            id: "booking-calendar",
            name: "BookingCalendar",
            source: "components/HomeBookingControls.tsx",
            exportName: "BookingCalendar",
            kind: "ui",
            guide: "components/registry",
            purpose: "일곱 열을 유지하는 일정 선택 달력"
        }, {
            id: "booking-date-preview",
            name: "BookingDatePreview",
            source: "components/BookingDatePreview.tsx",
            exportName: "default",
            kind: "internal",
            guide: "components/registry",
            purpose: "커서·키보드 초점 옆에서 날짜별 프로그램을 보여주는 비차단 미리보기",
            parent: "booking-calendar"
        }, {
            id: "booking-choice",
            name: "BookingProgramChoice",
            source: "components/HomeBookingControls.tsx",
            exportName: "BookingProgramChoice",
            kind: "ui",
            guide: "components/registry",
            purpose: "포스터와 회차를 포함한 프로그램 선택 타일"
        }, {
            id: "account-mini-room",
            name: "AccountMiniRoom",
            source: "components/AccountMiniRoom.tsx",
            exportName: "default",
            kind: "ui",
            guide: "components/registry",
            purpose: "실제 관심 공연 포스터와 조명·세 가지 빛깔을 조합한 개인 공연장"
        }, {
            id: "account-membership",
            name: "AccountMembershipCard",
            source: "components/AccountPanels.tsx",
            exportName: "AccountMembershipCard",
            kind: "ui",
            guide: "components/registry",
            purpose: "프로필·관람 통계와 공식 멤버십 안내"
        }, {
            id: "account-ticket",
            name: "AccountTicket",
            source: "components/AccountPanels.tsx",
            exportName: "AccountTicket",
            kind: "ui",
            guide: "components/registry",
            purpose: "저장한 관람 일정과 좌석을 담는 공통 티켓"
        }, {
            id: "account-diary",
            name: "AccountDiary",
            source: "components/AccountPanels.tsx",
            exportName: "AccountDiary",
            kind: "ui",
            guide: "components/registry",
            purpose: "공연·날짜·감상을 묶어 남기는 개인 관람노트"
        }, {
            id: "account-experience",
            name: "AccountExperience",
            source: "components/AccountExperience.tsx",
            exportName: "default",
            kind: "structure",
            guide: "components/registry",
            purpose: "인증 상태와 공통 컴포넌트를 조합한 마이페이지",
            previewRoute: "/v5/account/"
        }, {
            id: "glass",
            name: "LiquidGlass",
            source: "components/LiquidGlass.tsx",
            exportName: "default",
            kind: "ui",
            guide: "components/liquid-glass",
            purpose: "굴절·흐림·반사를 공유하는 유리 표면"
        }, {
            id: "floating-panel",
            name: "FloatingPanel",
            source: "components/FloatingPanel.tsx",
            exportName: "default",
            kind: "ui",
            guide: "components/floating-menu",
            purpose: "초점·위치·WebGL 모션을 관리하는 비차단 창"
        }, {
            id: "floating-menu",
            name: "FloatingMenu",
            source: "components/FloatingMenu.tsx",
            exportName: "default",
            kind: "ui",
            guide: "components/floating-menu",
            purpose: "FloatingPanel을 사용하는 실제 전체 메뉴",
            parent: "floating-panel"
        }, {
            id: "small-notification",
            name: "알림소형모달",
            source: "components/SmallNotificationModal.tsx",
            exportName: "default",
            kind: "ui",
            guide: "components/small-notification",
            purpose: "하단 캡슐과 부드러운 등장·퇴장"
        }, {
            id: "quick-menu",
            name: "VioletQuickMenu",
            source: "components/VioletQuickMenu.tsx",
            exportName: "default",
            kind: "ui",
            guide: "motion/quick-menu",
            purpose: "노랑·초록의 유동 표면을 돌려 탐색하는 원형 퀵메뉴"
        }, {
            id: "context-menu",
            name: "ContextMenu",
            source: "components/ContextMenu.tsx",
            exportName: "default",
            kind: "ui",
            guide: "components/registry",
            purpose: "현재 영역의 주소와 이동을 돕는 문맥 메뉴",
            previewRoute: "/v5/"
        }, {
            id: "return-top",
            name: "ReturnTop",
            source: "components/ReturnTop.tsx",
            exportName: "default",
            kind: "ui",
            guide: "components/registry",
            purpose: "스크롤 위치에 따라 나타나는 위로 가기",
            previewRoute: "/v5/#discover-programs"
        }, {
            id: "header",
            name: "Header",
            source: "components/Header.tsx",
            exportName: "default",
            kind: "ui",
            guide: "components/registry",
            purpose: "주 메뉴·회원 경로·검색과 전체 메뉴",
            previewRoute: "/v5/#header"
        }, {
            id: "footer",
            name: "Footer",
            source: "components/Footer.tsx",
            exportName: "default",
            kind: "ui",
            guide: "components/registry",
            purpose: "기관·정책·관련 서비스 탐색",
            previewRoute: "/v5/#footer"
        }, {
            id: "introduction",
            name: "IntroductionExperience",
            source: "components/IntroductionExperience.tsx",
            exportName: "default",
            kind: "ui",
            guide: "components/registry",
            purpose: "기관 소개의 독립적인 전체 페이지 경험",
            previewRoute: "/v5/about/introduction/"
        }, {
            id: "site-shell",
            name: "SiteShell",
            source: "components/SiteShell.tsx",
            exportName: "default",
            kind: "structure",
            guide: "components/registry",
            purpose: "제품·문서의 레이아웃과 공통 알림 호스트",
            parent: "catalog-provider"
        }, {
            id: "home-anchors",
            name: "HomeAnchorNavigation",
            source: "components/HomeAnchorNavigation.tsx",
            exportName: "default",
            kind: "structure",
            guide: "components/registry",
            purpose: "필터·일정·슬라이드를 먼저 펼치는 홈 앵커 탐색"
        }, {
            id: "glass-refraction",
            name: "GlassRefraction",
            source: "components/GlassRefraction.tsx",
            exportName: "default",
            kind: "internal",
            guide: "components/liquid-glass",
            purpose: "LiquidGlass의 가장자리 굴절 지도",
            parent: "glass"
        }, {
            id: "notification-host",
            name: "SmallNotificationModalHost",
            source: "components/SmallNotificationModal.tsx",
            exportName: "SmallNotificationModalHost",
            kind: "internal",
            guide: "components/small-notification",
            purpose: "3.5초 갱신과 이벤트 구독을 관리하는 알림 호스트",
            parent: "small-notification"
        }, {
            id: "quick-menu-fluid",
            name: "QuickMenuFluid",
            source: "components/QuickMenuFluid.tsx",
            exportName: "default",
            kind: "internal",
            guide: "motion/quick-menu",
            purpose: "퀵메뉴 내부의 물결·포인터 반응과 화면 밖 렌더링 중지를 담당하는 유동 재질",
            parent: "quick-menu"
        }, {
            id: "booking-client",
            name: "BookingClient",
            source: "app/booking/[id]/BookingClient.tsx",
            exportName: "default",
            kind: "structure",
            guide: "components/registry",
            purpose: "좌석 지도를 포함한 페이지 전용 예매 흐름",
            previewRoute: "/v5/booking/dance/"
        }, {
            id: "program-detail",
            name: "ProgramDetailClient",
            source: "app/programs/[id]/ProgramDetailClient.tsx",
            exportName: "default",
            kind: "structure",
            guide: "components/registry",
            purpose: "프로그램 정보와 실제 예매 경로의 페이지 전용 연결",
            previewRoute: "/v5/programs/dance/"
        }, {
            id: "catalog-page",
            name: "CatalogPage",
            source: "components/CatalogPage.tsx",
            exportName: "default",
            kind: "structure",
            guide: "components/registry",
            purpose: "게시된 본문·사실표·FAQ·연혁·지도·다운로드·행동과 장소·공지 상세, 분류별 프로그램 및 검색의 조합",
            previewRoute: "/v5/visit/directions/"
        }, {
            id: "catalog-provider",
            name: "CatalogProvider",
            source: "src/catalog/CatalogProvider.tsx",
            exportName: "CatalogProvider",
            kind: "structure",
            guide: "components/registry",
            purpose: "RootLayout에서 SiteShell과 전체 페이지에 게시된 카탈로그와 갱신 상태를 공급",
            layoutOwner: "app/layout.tsx"
        } ];
        // [일반 컨트롤로 바꾸지 않는 공간 조작 / Explicit spatial-control exceptions]
        // [실제 속성 이름과 동일한 독립 축 / Independent axes using actual prop names]
                const enumAxis = () => values => values;
        const liveContracts = {
            text: {
                axes: {
                    variant: Object.keys(design_tokens /* TEXT_VARIANTS */ .Sv),
                    size: Object.keys(design_tokens /* TEXT_SIZES */ .H3)
                },
                states: []
            },
            icon: {
                axes: {
                    group: enumAxis()([ ...component_contracts /* ICON_GROUPS */ .U$ ])
                },
                states: []
            },
            surface: {
                axes: {
                    variant: component_contracts /* SURFACE_VARIANTS */ .J4,
                    padding: component_contracts /* SURFACE_PADDINGS */ .nV,
                    radius: component_contracts /* SURFACE_RADII */ .BF
                },
                states: []
            },
            button: {
                axes: {
                    variant: component_contracts /* CONTROL_VARIANTS */ ._X,
                    context: component_contracts /* CONTROL_CONTEXTS */ .Pd,
                    shape: component_contracts /* CONTROL_SHAPES */ .Ec
                },
                states: [ "default", "disabled", "pressed" ]
            },
            "button-link": {
                axes: {
                    variant: component_contracts /* CONTROL_VARIANTS */ ._X,
                    context: component_contracts /* CONTROL_CONTEXTS */ .Pd,
                    shape: component_contracts /* CONTROL_SHAPES */ .Ec
                },
                states: []
            },
            "icon-button": {
                axes: {
                    variant: component_contracts /* CONTROL_VARIANTS */ ._X,
                    context: component_contracts /* CONTROL_CONTEXTS */ .Pd,
                    shape: component_contracts /* CONTROL_SHAPES */ .Ec
                },
                states: [ "disabled", "pressed" ]
            },
            "filter-button": {
                axes: {
                    variant: component_contracts /* CONTROL_VARIANTS */ ._X,
                    context: component_contracts /* CONTROL_CONTEXTS */ .Pd,
                    shape: component_contracts /* CONTROL_SHAPES */ .Ec,
                    selected: [ "false", "true" ]
                },
                states: [ "disabled" ]
            },
            field: {
                axes: {
                    as: enumAxis()([ ...component_contracts /* FIELD_ELEMENTS */ .Xk ]),
                    variant: component_contracts /* CONTROL_CONTEXTS */ .Pd
                },
                states: [ "default", "disabled", "error", "required", "readonly" ]
            },
            checkbox: {
                axes: {},
                states: [ "unchecked", "checked", "disabled" ]
            },
            badge: {
                axes: {
                    tone: component_contracts /* BADGE_TONES */ .Nq,
                    appearance: component_contracts /* APPEARANCES */ .Gi
                },
                states: []
            },
            notice: {
                axes: {
                    variant: component_contracts /* CONTROL_CONTEXTS */ .Pd
                },
                states: [ "status", "error" ]
            },
            tabs: {
                axes: {
                    orientation: component_contracts /* TAB_ORIENTATIONS */ .xj
                },
                states: [ "selected", "disabled" ]
            },
            disclosure: {
                axes: {
                    appearance: component_contracts /* APPEARANCES */ .Gi
                },
                states: [ "closed", "open" ]
            },
            "hero-slide": {
                axes: {
                    layout: enumAxis()([ ...component_contracts /* HERO_SLIDE_LAYOUTS */ .bN ]),
                    preview: enumAxis()([ ...component_contracts /* HERO_SLIDE_PREVIEWS */ .RV ])
                },
                states: [ "active", "entering" ]
            },
            "account-mini-room": {
                axes: {
                    theme: enumAxis()([ ...component_contracts /* ROOM_THEMES */ .Ax ])
                },
                states: [ "light-on", "light-off" ]
            },
            "account-membership": {
                axes: {
                    mode: enumAxis()([ ...component_contracts /* MEMBERSHIP_MODES */ .VD ])
                },
                states: []
            },
            "account-ticket": {
                axes: {
                    variant: enumAxis()([ ...component_contracts /* TICKET_VARIANTS */ .Pz ])
                },
                states: [ "cancelled" ]
            },
            glass: {
                axes: {
                    variant: Object.keys(design_tokens /* GLASS_MATERIALS */ .ot)
                },
                states: []
            },
            "floating-panel": {
                axes: {
                    variant: enumAxis()([ ...component_contracts /* PANEL_PRESENTATIONS */ .p4 ])
                },
                states: []
            },
            header: {
                axes: {
                    variant: enumAxis()([ "default", "inverse" ])
                },
                states: []
            }
        };
        const COMPONENT_REGISTRY = definitions.map((record => {
            const contract = liveContracts[record.id];
            return contract ? {
                ...record,
                ...contract,
                examples: (0, component_contracts /* contractExamples */ .F9)(record.id, contract.axes, contract.states)
            } : record;
        }));
        const CONTROL_EXCEPTIONS = [ {
            source: "components/HomeBookingControls.tsx",
            tag: "button",
            part: "calendar-day",
            owner: "BookingCalendar",
            reason: "320px 화면에서도 일곱 열과 날짜의 공간 관계를 유지하는 달력 셀"
        }, {
            source: "components/HomeBookingControls.tsx",
            tag: "button",
            part: "program-choice",
            owner: "BookingProgramChoice",
            reason: "포스터·공연명·장소·회차를 포함하는 프로그램 선택 타일"
        }, {
            source: "components/VioletQuickMenu.tsx",
            tag: "button",
            part: "violet-toggle",
            owner: "VioletQuickMenu",
            reason: "회전·포인터 캡처와 유동 재질을 공유하는 퀵메뉴의 전용 원형 조작"
        } ];
        // CONCATENATED MODULE: ./src/data/component-usage.ts
        // [컴포넌트 사용처의 생성 자료 / Generated component usage]
        // scripts/audit-component-system.ts --write로 갱신합니다. / Regenerate with scripts/audit-component-system.ts --write.
        const COMPONENT_USAGE = {
            "account-diary": {
                status: "product",
                productUses: [ "components/AccountExperience.tsx#AccountExperience" ],
                guideUses: [ "app/design-rules/_documentation/ComponentCatalog.tsx#ComponentCatalog" ]
            },
            "account-experience": {
                status: "product",
                productUses: [ "app/account/applications/page.tsx#AccountApplicationsPage", "app/account/bookings/page.tsx#AccountBookingsPage", "app/account/favorites/page.tsx#AccountFavoritesPage", "app/account/page.tsx#AccountPage", "app/account/profile/page.tsx#AccountProfilePage" ],
                guideUses: []
            },
            "account-membership": {
                status: "product",
                productUses: [ "components/AccountExperience.tsx#AccountExperience" ],
                guideUses: [ "app/design-rules/_documentation/ComponentCatalog.tsx#ComponentCatalog", "app/design-rules/_documentation/ComponentCatalog.tsx#renderExample" ]
            },
            "account-mini-room": {
                status: "product",
                productUses: [ "components/AccountExperience.tsx#spacePanel" ],
                guideUses: [ "app/design-rules/_documentation/ComponentCatalog.tsx#ComponentCatalog", "app/design-rules/_documentation/ComponentCatalog.tsx#renderExample" ]
            },
            "account-ticket": {
                status: "product",
                productUses: [ "components/AccountExperience.tsx#bookingsPanel", "components/AccountExperience.tsx#spacePanel" ],
                guideUses: [ "app/design-rules/_documentation/ComponentCatalog.tsx#ComponentCatalog", "app/design-rules/_documentation/ComponentCatalog.tsx#renderExample" ]
            },
            badge: {
                status: "product",
                productUses: [ "app/page.tsx#HomePage", "app/programs/[id]/ProgramDetailClient.tsx#ProgramDetailClient", "components/AccountPanels.tsx#AccountMembershipCard", "components/AccountPanels.tsx#AccountTicket", "components/ProgramCard.tsx#ProgramCard" ],
                guideUses: [ "app/design-rules/_documentation/ComponentCatalog.tsx#renderExample", "app/design-rules/page.tsx#renderChapter", "components/AccountPanels.tsx#AccountMembershipCard", "components/AccountPanels.tsx#AccountTicket", "components/ProgramCard.tsx#ProgramCard" ]
            },
            "booking-calendar": {
                status: "product",
                productUses: [ "app/page.tsx#HomePage" ],
                guideUses: [ "app/design-rules/_documentation/ComponentCatalog.tsx#ComponentCatalog" ]
            },
            "booking-choice": {
                status: "product",
                productUses: [ "app/page.tsx#HomePage" ],
                guideUses: [ "app/design-rules/_documentation/ComponentCatalog.tsx#ComponentCatalog" ]
            },
            "booking-client": {
                status: "product",
                productUses: [ "app/booking/[id]/page.tsx#BookingPage" ],
                guideUses: []
            },
            "booking-date-preview": {
                status: "product",
                productUses: [ "components/HomeBookingControls.tsx#BookingCalendar" ],
                guideUses: [ "components/HomeBookingControls.tsx#BookingCalendar" ]
            },
            button: {
                status: "product",
                productUses: [ "app/account/login/page.tsx#LoginPage", "app/account/recovery/page.tsx#RecoveryPage", "app/account/signup/page.tsx#SignupPage", "app/booking/[id]/BookingClient.tsx#BookingClient", "app/page.tsx#HomePage", "components/AccountExperience.tsx#AccountExperience", "components/AccountExperience.tsx#profilePanel", "components/AccountMiniRoom.tsx#AccountMiniRoom", "components/AccountPanels.tsx#AccountDiary", "components/AccountPanels.tsx#AccountMembershipCard", "components/AccountPanels.tsx#AccountTicket", "components/CompletedPage.tsx#CardsSection", "components/CompletedPage.tsx#CompletedPage", "components/CompletedPage.tsx#VenueComparison", "components/ContextMenu.tsx#ContextMenu", "components/FloatingPanel.tsx#PanelSurface", "components/HeroCarousel.tsx#HeroCarousel", "components/HeroSlide.tsx#HeroSlide", "components/HomeBookingControls.tsx#BookingCalendar", "components/IntroductionExperience.tsx#IntroductionExperience", "components/ServiceGoods.tsx#ServiceGoods", "components/ServiceRequestForm.tsx#ServiceRequestForm", "components/SystemPrimitives.tsx#SystemFilterButton", "components/SystemPrimitives.tsx#SystemIconButton" ],
                guideUses: [ "app/design-rules/_documentation/ComponentCatalog.tsx#ComponentCatalog", "app/design-rules/_documentation/ComponentCatalog.tsx#renderExample", "app/design-rules/_documentation/LiquidGlassDemo.tsx#LiquidGlassDemo", "app/design-rules/page.tsx#DesignRulesPage", "app/design-rules/page.tsx#renderChapter", "components/AccountMiniRoom.tsx#AccountMiniRoom", "components/AccountPanels.tsx#AccountDiary", "components/AccountPanels.tsx#AccountMembershipCard", "components/AccountPanels.tsx#AccountTicket", "components/ContextMenu.tsx#ContextMenu", "components/FloatingPanel.tsx#PanelSurface", "components/HeroSlide.tsx#HeroSlide", "components/HomeBookingControls.tsx#BookingCalendar", "components/SystemPrimitives.tsx#SystemFilterButton", "components/SystemPrimitives.tsx#SystemIconButton" ]
            },
            "button-link": {
                status: "product",
                productUses: [ "app/account/callback/page.tsx#AccountCallbackPage", "app/booking/[id]/BookingClient.tsx#BookingClient", "app/not-found.tsx#NotFound", "app/page.tsx#HomePage", "app/programs/[id]/ProgramDetailClient.tsx#ProgramDetailClient", "components/AccountExperience.tsx#bookingsPanel", "components/AccountExperience.tsx#favoritesPanel", "components/AccountExperience.tsx#profilePanel", "components/AccountExperience.tsx#servicesPanel", "components/AccountExperience.tsx#spacePanel", "components/AccountPanels.tsx#AccountMembershipCard", "components/AccountPanels.tsx#AccountTicket", "components/CatalogPage.tsx#CatalogPage", "components/CatalogPage.tsx#blocks", "components/CompletedPage.tsx#CompletedPage", "components/CompletedPage.tsx#RelatedPrograms", "components/CompletedPage.tsx#VenueComparison", "components/HeroSlide.tsx#HeroSlide", "components/IntroductionExperience.tsx#IntroductionExperience", "components/ServiceGoods.tsx#ServiceGoods", "components/ServiceRequestForm.tsx#ServiceRequestForm" ],
                guideUses: [ "app/design-rules/_documentation/ComponentCatalog.tsx#ComponentCatalog", "app/design-rules/_documentation/ComponentCatalog.tsx#renderExample", "app/design-rules/page.tsx#renderChapter", "components/AccountPanels.tsx#AccountMembershipCard", "components/AccountPanels.tsx#AccountTicket", "components/HeroSlide.tsx#HeroSlide" ]
            },
            "catalog-page": {
                status: "product",
                productUses: [ "app/[...slug]/page.tsx#CatalogDynamicPage" ],
                guideUses: []
            },
            "catalog-provider": {
                status: "product",
                productUses: [ "app/layout.tsx#RootLayout" ],
                guideUses: [ "app/layout.tsx#RootLayout" ]
            },
            checkbox: {
                status: "product",
                productUses: [ "app/account/signup/page.tsx#SignupPage", "components/CompletedPage.tsx#VenueComparison", "components/ServiceRequestForm.tsx#ServiceRequestForm" ],
                guideUses: [ "app/design-rules/_documentation/ComponentCatalog.tsx#ComponentCatalog", "app/design-rules/_documentation/ComponentCatalog.tsx#renderExample", "app/design-rules/page.tsx#renderChapter" ]
            },
            "completed-page": {
                status: "product",
                productUses: [ "app/[...slug]/page.tsx#CatalogDynamicPage" ],
                guideUses: []
            },
            "context-menu": {
                status: "product",
                productUses: [ "components/SiteShell.tsx#SiteShell" ],
                guideUses: [ "components/SiteShell.tsx#SiteShell" ]
            },
            "control-group": {
                status: "product",
                productUses: [ "components/CatalogPage.tsx#CatalogPage", "components/CompletedPage.tsx#CompletedPage" ],
                guideUses: [ "app/design-rules/page.tsx#renderChapter" ]
            },
            dialog: {
                status: "product",
                productUses: [ "components/AccountExperience.tsx#AccountExperience", "components/Header.tsx#Header" ],
                guideUses: [ "app/design-rules/page.tsx#DesignRulesPage", "components/Header.tsx#Header" ]
            },
            disclosure: {
                status: "product",
                productUses: [ "components/CatalogPage.tsx#blocks", "components/CompletedPage.tsx#SectionBody", "components/FloatingMenu.tsx#FloatingMenu", "components/ServiceGoods.tsx#ServiceGoods", "components/ServiceRequestForm.tsx#ServiceRequestForm" ],
                guideUses: [ "app/design-rules/_documentation/ComponentCatalog.tsx#renderExample", "app/design-rules/page.tsx#renderChapter", "components/FloatingMenu.tsx#FloatingMenu" ]
            },
            field: {
                status: "product",
                productUses: [ "app/account/login/page.tsx#LoginPage", "app/account/recovery/page.tsx#RecoveryPage", "app/account/signup/page.tsx#SignupPage", "app/booking/[id]/BookingClient.tsx#BookingClient", "app/page.tsx#HomePage", "app/programs/page.tsx#ProgramsPage", "components/AccountExperience.tsx#AccountExperience", "components/AccountExperience.tsx#profilePanel", "components/AccountPanels.tsx#AccountDiary", "components/CatalogPage.tsx#CatalogPage", "components/CompletedPage.tsx#CardsSection", "components/CompletedPage.tsx#RentalCalendar", "components/CompletedPage.tsx#SiteMap", "components/Footer.tsx#Footer", "components/Header.tsx#Header", "components/HomeBookingControls.tsx#BookingCalendar", "components/ServiceGoods.tsx#ServiceGoods", "components/ServiceRequestForm.tsx#ServiceRequestForm" ],
                guideUses: [ "app/design-rules/_documentation/ComponentCatalog.tsx#ComponentCatalog", "app/design-rules/_documentation/ComponentCatalog.tsx#renderExample", "app/design-rules/page.tsx#DesignRulesPage", "app/design-rules/page.tsx#renderChapter", "components/AccountPanels.tsx#AccountDiary", "components/Footer.tsx#Footer", "components/Header.tsx#Header", "components/HomeBookingControls.tsx#BookingCalendar" ]
            },
            "filter-button": {
                status: "product",
                productUses: [ "app/page.tsx#HomePage", "app/programs/page.tsx#ProgramsPage", "components/AccountExperience.tsx#AccountExperience", "components/AccountExperience.tsx#bookingsPanel", "components/CompletedPage.tsx#CardsSection" ],
                guideUses: [ "app/design-rules/_documentation/ComponentCatalog.tsx#renderExample" ]
            },
            "floating-menu": {
                status: "product",
                productUses: [ "components/Header.tsx#Header" ],
                guideUses: [ "app/design-rules/page.tsx#renderChapter", "components/Header.tsx#Header" ]
            },
            "floating-panel": {
                status: "product",
                productUses: [ "components/FloatingMenu.tsx#FloatingMenu" ],
                guideUses: [ "app/design-rules/_documentation/ComponentCatalog.tsx#renderExample", "components/FloatingMenu.tsx#FloatingMenu" ]
            },
            footer: {
                status: "product",
                productUses: [ "components/SiteShell.tsx#SiteShell" ],
                guideUses: [ "components/SiteShell.tsx#SiteShell" ]
            },
            glass: {
                status: "product",
                productUses: [ "components/FloatingPanel.tsx#PanelSurface", "components/HeroCompanion.tsx#HeroCompanion", "components/SmallNotificationModal.tsx#SmallNotificationModal", "components/SystemPrimitives.tsx#SystemNotice" ],
                guideUses: [ "app/design-rules/_documentation/ComponentCatalog.tsx#renderExample", "app/design-rules/_documentation/LiquidGlassDemo.tsx#LiquidGlassDemo", "components/FloatingPanel.tsx#PanelSurface", "components/HeroCompanion.tsx#HeroCompanion", "components/SmallNotificationModal.tsx#SmallNotificationModal", "components/SystemPrimitives.tsx#SystemNotice" ]
            },
            "glass-refraction": {
                status: "product",
                productUses: [ "components/LiquidGlass.tsx#LiquidGlass" ],
                guideUses: [ "components/LiquidGlass.tsx#LiquidGlass" ]
            },
            header: {
                status: "product",
                productUses: [ "components/SiteShell.tsx#SiteShell" ],
                guideUses: [ "components/SiteShell.tsx#SiteShell" ]
            },
            "hero-carousel": {
                status: "product",
                productUses: [ "app/page.tsx#HomePage" ],
                guideUses: []
            },
            "hero-companion": {
                status: "product",
                productUses: [ "components/HeroCarousel.tsx#HeroCarousel" ],
                guideUses: [ "app/design-rules/_documentation/ComponentCatalog.tsx#ComponentCatalog" ]
            },
            "hero-slide": {
                status: "product",
                productUses: [ "components/HeroCarousel.tsx#HeroCarousel" ],
                guideUses: [ "app/design-rules/_documentation/ComponentCatalog.tsx#ComponentCatalog", "app/design-rules/_documentation/ComponentCatalog.tsx#renderExample" ]
            },
            "home-anchors": {
                status: "product",
                productUses: [ "app/page.tsx#HomePage" ],
                guideUses: []
            },
            icon: {
                status: "product",
                productUses: [ "app/account/login/page.tsx#LoginPage", "app/account/signup/page.tsx#SignupPage", "app/page.tsx#HomePage", "components/AccountExperience.tsx#bookingsPanel", "components/AccountExperience.tsx#favoritesPanel", "components/AccountExperience.tsx#profilePanel", "components/AccountExperience.tsx#servicesPanel", "components/AccountExperience.tsx#spacePanel", "components/AccountMiniRoom.tsx#AccountMiniRoom", "components/AccountPanels.tsx#AccountDiary", "components/AccountPanels.tsx#AccountMembershipCard", "components/AccountPanels.tsx#AccountTicket", "components/ContextMenu.tsx#ContextMenu", "components/FloatingMenu.tsx#FloatingMenu", "components/FloatingPanel.tsx#PanelSurface", "components/Header.tsx#Header", "components/HeroCarousel.tsx#HeroCarousel", "components/HeroCompanion.tsx#HeroCompanion", "components/HeroSlide.tsx#HeroSlide", "components/HomeBookingControls.tsx#BookingCalendar", "components/ProgramCard.tsx#ProgramCard", "components/ReturnTop.tsx#ReturnTop", "components/SeasonBanner.tsx#SeasonBanner", "components/SystemPrimitives.tsx#SystemField", "components/SystemPrimitives.tsx#SystemNotice", "components/VioletQuickMenu.tsx#VioletQuickMenu", "components/VioletQuickMenu.tsx#renderLink" ],
                guideUses: [ "app/design-rules/_documentation/ComponentCatalog.tsx#ComponentCatalog", "app/design-rules/_documentation/ComponentCatalog.tsx#renderExample", "app/design-rules/page.tsx#DesignRulesPage", "app/design-rules/page.tsx#renderChapter", "components/AccountMiniRoom.tsx#AccountMiniRoom", "components/AccountPanels.tsx#AccountDiary", "components/AccountPanels.tsx#AccountMembershipCard", "components/AccountPanels.tsx#AccountTicket", "components/ContextMenu.tsx#ContextMenu", "components/FloatingMenu.tsx#FloatingMenu", "components/FloatingPanel.tsx#PanelSurface", "components/Header.tsx#Header", "components/HeroCompanion.tsx#HeroCompanion", "components/HeroSlide.tsx#HeroSlide", "components/HomeBookingControls.tsx#BookingCalendar", "components/ProgramCard.tsx#ProgramCard", "components/ReturnTop.tsx#ReturnTop", "components/SeasonBanner.tsx#SeasonBanner", "components/SystemPrimitives.tsx#SystemField", "components/SystemPrimitives.tsx#SystemNotice", "components/VioletQuickMenu.tsx#VioletQuickMenu", "components/VioletQuickMenu.tsx#renderLink" ]
            },
            "icon-button": {
                status: "product",
                productUses: [ "components/AccountMiniRoom.tsx#AccountMiniRoom", "components/AccountPanels.tsx#AccountDiary", "components/FloatingPanel.tsx#PanelSurface", "components/Header.tsx#Header", "components/HeroCarousel.tsx#HeroCarousel", "components/HomeBookingControls.tsx#BookingCalendar", "components/ProgramCard.tsx#ProgramCard", "components/ReturnTop.tsx#ReturnTop" ],
                guideUses: [ "app/design-rules/_documentation/ComponentCatalog.tsx#ComponentCatalog", "app/design-rules/_documentation/ComponentCatalog.tsx#renderExample", "components/AccountMiniRoom.tsx#AccountMiniRoom", "components/AccountPanels.tsx#AccountDiary", "components/FloatingPanel.tsx#PanelSurface", "components/Header.tsx#Header", "components/HomeBookingControls.tsx#BookingCalendar", "components/ProgramCard.tsx#ProgramCard", "components/ReturnTop.tsx#ReturnTop" ]
            },
            introduction: {
                status: "product",
                productUses: [ "app/about/introduction/page.tsx#Page" ],
                guideUses: []
            },
            notice: {
                status: "product",
                productUses: [ "app/account/callback/page.tsx#AccountCallbackPage", "app/account/login/page.tsx#LoginPage", "app/account/recovery/page.tsx#RecoveryPage", "app/account/signup/page.tsx#SignupPage", "app/booking/[id]/BookingClient.tsx#BookingClient", "app/programs/[id]/ProgramDetailClient.tsx#ProgramDetailClient", "components/AccountExperience.tsx#AccountExperience", "components/AccountExperience.tsx#profilePanel", "components/AccountPanels.tsx#AccountDiary", "components/CatalogPage.tsx#CatalogPage", "components/ServiceGoods.tsx#ServiceGoods", "components/ServiceRequestForm.tsx#ServiceRequestForm" ],
                guideUses: [ "app/design-rules/_documentation/ComponentCatalog.tsx#renderExample", "app/design-rules/page.tsx#DesignRulesPage", "app/design-rules/page.tsx#renderChapter", "components/AccountPanels.tsx#AccountDiary" ]
            },
            "notification-host": {
                status: "product",
                productUses: [ "components/SiteShell.tsx#SiteShell" ],
                guideUses: [ "components/SiteShell.tsx#SiteShell" ]
            },
            poster: {
                status: "product",
                productUses: [ "app/page.tsx#HomePage", "app/programs/page.tsx#ProgramsPage", "components/AccountExperience.tsx#favoritesPanel", "components/AccountExperience.tsx#spacePanel", "components/CatalogPage.tsx#CatalogPage", "components/CompletedPage.tsx#RelatedPrograms" ],
                guideUses: [ "app/design-rules/page.tsx#renderChapter" ]
            },
            "program-detail": {
                status: "product",
                productUses: [ "app/programs/[id]/page.tsx#ProgramDetailPage" ],
                guideUses: []
            },
            "quick-menu": {
                status: "product",
                productUses: [ "app/page.tsx#HomePage" ],
                guideUses: [ "app/design-rules/page.tsx#renderChapter" ]
            },
            "quick-menu-fluid": {
                status: "product",
                productUses: [ "components/VioletQuickMenu.tsx#VioletQuickMenu" ],
                guideUses: [ "components/VioletQuickMenu.tsx#VioletQuickMenu" ]
            },
            "return-top": {
                status: "product",
                productUses: [ "components/SiteShell.tsx#SiteShell" ],
                guideUses: [ "components/SiteShell.tsx#SiteShell" ]
            },
            "season-banner": {
                status: "product",
                productUses: [ "app/page.tsx#HomePage" ],
                guideUses: [ "app/design-rules/_documentation/ComponentCatalog.tsx#ComponentCatalog" ]
            },
            "service-goods": {
                status: "product",
                productUses: [ "components/CompletedPage.tsx#CompletedPage" ],
                guideUses: []
            },
            "service-request": {
                status: "product",
                productUses: [ "components/CompletedPage.tsx#CompletedPage", "components/ServiceGoods.tsx#ServiceGoods" ],
                guideUses: []
            },
            "site-shell": {
                status: "product",
                productUses: [ "app/layout.tsx#RootLayout" ],
                guideUses: [ "app/layout.tsx#RootLayout" ]
            },
            "small-notification": {
                status: "product",
                productUses: [ "components/SmallNotificationModal.tsx#SmallNotificationModalHost" ],
                guideUses: [ "components/SmallNotificationModal.tsx#SmallNotificationModalHost" ]
            },
            surface: {
                status: "product",
                productUses: [ "app/account/login/page.tsx#LoginPage", "app/account/recovery/page.tsx#RecoveryPage", "app/account/signup/page.tsx#SignupPage", "app/booking/[id]/BookingClient.tsx#BookingClient", "app/not-found.tsx#NotFound", "app/page.tsx#HomePage", "components/AccountExperience.tsx#AccountExperience", "components/BookingDatePreview.tsx#BookingDatePreview", "components/CatalogPage.tsx#CatalogPage", "components/CatalogPage.tsx#blocks", "components/CompletedPage.tsx#CompletedPage", "components/CompletedPage.tsx#VenueComparison", "components/IntroductionExperience.tsx#IntroductionExperience", "components/ServiceGoods.tsx#ServiceGoods", "components/ServiceRequestForm.tsx#ServiceRequestForm" ],
                guideUses: [ "app/design-rules/_documentation/ComponentCatalog.tsx#renderExample", "app/design-rules/page.tsx#renderChapter", "components/BookingDatePreview.tsx#BookingDatePreview" ]
            },
            tabs: {
                status: "product",
                productUses: [ "components/AccountExperience.tsx#AccountExperience" ],
                guideUses: [ "app/design-rules/_documentation/ComponentCatalog.tsx#renderExample", "app/design-rules/page.tsx#renderChapter" ]
            },
            text: {
                status: "product",
                productUses: [ "app/not-found.tsx#NotFound", "app/page.tsx#HomePage", "components/CompletedPage.tsx#CompletedPage" ],
                guideUses: [ "app/design-rules/_documentation/ComponentCatalog.tsx#renderExample", "app/design-rules/page.tsx#renderChapter" ]
            }
        };
        const COMPONENT_COUNTS = {
            total: 50,
            product: 50,
            documentationOnly: 0,
            unused: 0
        };
        // EXTERNAL MODULE: ./src/catalog/snapshot.ts + 1 modules
                var snapshot = __webpack_require__(2554);
        // CONCATENATED MODULE: ./src/data/home-features.ts
        const HOME_FEATURES = snapshot.CATALOG_SNAPSHOT.homeFeatures;
        // EXTERNAL MODULE: ./src/data/catalog.ts
                var catalog = __webpack_require__(9366);
        // EXTERNAL MODULE: ./src/lib/media.ts
                var media = __webpack_require__(2110);
        // EXTERNAL MODULE: ./components/HeroSlide.tsx
                var HeroSlide = __webpack_require__(9391);
        // EXTERNAL MODULE: ./components/FloatingPanel.tsx + 3 modules
                var FloatingPanel = __webpack_require__(3936);
        // EXTERNAL MODULE: ./components/HeroCompanion.tsx + 2 modules
                var HeroCompanion = __webpack_require__(8954);
        // EXTERNAL MODULE: ./components/SeasonBanner.tsx
                var SeasonBanner = __webpack_require__(3429);
        // EXTERNAL MODULE: ./components/HomeBookingControls.tsx + 2 modules
                var HomeBookingControls = __webpack_require__(1378);
        // EXTERNAL MODULE: ./components/AccountMiniRoom.tsx
                var AccountMiniRoom = __webpack_require__(6342);
        // EXTERNAL MODULE: ./components/AccountPanels.tsx
                var AccountPanels = __webpack_require__(2335);
        // EXTERNAL MODULE: ./src/lib/account-space.ts
                var account_space = __webpack_require__(440);
        // EXTERNAL MODULE: ./components/SmallNotificationModal.tsx
                var SmallNotificationModal = __webpack_require__(7281);
        // EXTERNAL MODULE: ./components/SystemText.tsx
                var SystemText = __webpack_require__(8519);
        // EXTERNAL MODULE: ./components/SystemSurface.tsx
                var SystemSurface = __webpack_require__(820);
        // EXTERNAL MODULE: ./components/SystemNavigation.tsx
                var SystemNavigation = __webpack_require__(7291);
        // CONCATENATED MODULE: ./app/design-rules/_documentation/ComponentCatalog.tsx
        /* __next_internal_client_entry_do_not_use__ default auto */
        const kinds = {
            ui: "재사용 UI",
            structure: "구조·페이지 연결",
            internal: "내부 지원",
            demo: "문서 도구"
        };
        const statuses = {
            product: "제품 연결",
            "guide-only": "가이드 전용",
            unused: "미사용"
        };
        // [등록된 실제 컴포넌트 / The registered production components]
        // 샘플 마크업을 다시 만들지 않고 제품과 같은 구현을 렌더링합니다.
        // Render the production implementation instead of copying sample markup.
                function ComponentCatalog() {
            const floatingAnchor = (0, react.useRef)(null);
            const drawerAnchor = (0, react.useRef)(null);
            const [query, setQuery] = (0, react.useState)("");
            const [exampleValues, setExampleValues] = (0, react.useState)({});
            const updateExample = (id, value) => setExampleValues((current => ({
                ...current,
                [id]: value
            })));
            const [preview, setPreview] = (0, react.useState)("");
            const [month, setMonth] = (0, react.useState)("2026-10");
            const [date, setDate] = (0, react.useState)("2026-10-21");
            const [selected, setSelected] = (0, react.useState)(false);
            const [consent, setConsent] = (0, react.useState)(false);
            const [roomLight, setRoomLight] = (0, react.useState)(true);
            const [roomTheme, setRoomTheme] = (0, react.useState)("paper");
            const [accountNotes, setAccountNotes] = (0, react.useState)([]);
            const entries = COMPONENT_REGISTRY.filter((entry => "".concat(entry.name, " ").concat(entry.purpose, " ").concat(entry.source).toLocaleLowerCase().includes(query.toLocaleLowerCase())));
            const previewEntry = COMPONENT_REGISTRY.find((entry => entry.id === preview));
            // [열거값마다 실제 구현을 렌더링 / Render the actual implementation for each allowed value]
                        function renderExample(component, example) {
                const value = example.value;
                if (component === "icon") return value === "header-action" ?   (0, jsx_runtime.jsxs)(jsx_runtime.Fragment, {
                    children: [ 
                    
                     (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                        name: "search",
                        group: "header-action"
                    }), 
                    
                     (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                        name: "menu",
                        group: "header-action"
                    }) ]
                }) :   (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                    name: "search"
                });
                const state = example.state;
                const styles = {
                    ...example.axis === "variant" ? {
                        variant: value
                    } : {},
                    ...example.axis === "context" ? {
                        context: value
                    } : {},
                    ...example.axis === "shape" ? {
                        shape: value
                    } : {}
                };
                const text = "".concat(component, " · ").concat(example.axis || "state", ": ").concat(value || state);
                if (component === "text")   return (0, jsx_runtime.jsx /* SystemText */)(SystemText.J, {
                    ref: element => element === null || element === void 0 ? void 0 : element.setAttribute("data-ref-forwarded", "true"),
                    variant: example.axis === "variant" ? value : "body",
                    size: example.axis === "size" ? value : undefined,
                    children: "예술을 만나는 날"
                });
                if (component === "surface")   return (0, jsx_runtime.jsx /* SystemSurface */)(SystemSurface.eM, {
                    ref: element => element === null || element === void 0 ? void 0 : element.setAttribute("data-ref-forwarded", "true"),
                    variant: example.axis === "variant" ? value : "panel",
                    padding: example.axis === "padding" ? value : "md",
                    radius: example.axis === "radius" ? value : "panel",
                    children:   (0, jsx_runtime.jsx)("p", {
                        "data-text": "body",
                        children: "콘텐츠를 담는 공통 표면"
                    })
                });
                if (component === "button-link")   return (0, jsx_runtime.jsx)(SystemPrimitives.SystemLink, {
                    ...styles,
                    href: "/programs/",
                    "aria-label": styles.shape === "circle" ? "프로그램 이동" : undefined,
                    children: styles.shape === "circle" ?   (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                        name: "arrow"
                    }) : "프로그램 이동"
                });
                if (component === "button")   return (0, jsx_runtime.jsx /* SystemButton */)(SystemPrimitives.kR, {
                    ...styles,
                    disabled: state === "disabled",
                    "aria-label": styles.shape === "circle" ? "가이드 버튼 실행" : undefined,
                    "aria-pressed": state === "pressed" ? exampleValues[example.id] !== "false" : undefined,
                    onClick: () => state === "pressed" ? updateExample(example.id, exampleValues[example.id] === "false" ? "true" : "false") : (0, 
                    SmallNotificationModal /* showSmallNotification */ .VX)("가이드 버튼을 실행했어요."),
                    children: styles.shape === "circle" ?   (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                        name: "plus"
                    }) : "공통 버튼"
                });
                if (component === "icon-button")   return (0, jsx_runtime.jsx /* SystemIconButton */)(SystemPrimitives.MW, {
                    ...styles,
                    disabled: state === "disabled",
                    "aria-label": text,
                    "aria-pressed": state === "pressed" ? exampleValues[example.id] !== "false" : undefined,
                    onClick: () => state === "pressed" ? updateExample(example.id, exampleValues[example.id] === "false" ? "true" : "false") : (0, 
                    SmallNotificationModal /* showSmallNotification */ .VX)("가이드 버튼을 실행했어요."),
                    children:   (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                        name: "plus"
                    })
                });
                if (component === "filter-button")   return (0, jsx_runtime.jsx /* SystemFilterButton */)(SystemPrimitives.BV, {
                    ...styles,
                    "aria-label": styles.shape === "circle" ? "공연 필터" : undefined,
                    selected: exampleValues[example.id] ? exampleValues[example.id] === "true" : value === "true",
                    disabled: state === "disabled",
                    onClick: () => updateExample(example.id, (exampleValues[example.id] ? exampleValues[example.id] === "true" : value === "true") ? "false" : "true"),
                    children: styles.shape === "circle" ?   (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                        name: "check"
                    }) : "공연 필터"
                });
                if (component === "field") {
                    const common = {
                        label: text,
                        disabled: state === "disabled",
                        required: state === "required",
                        error: state === "error" ? "입력한 값을 확인해 주세요." : undefined,
                        variant: example.axis === "variant" ? value : "default"
                    };
                    if (value === "select")   return (0, jsx_runtime.jsxs /* SystemField */)(SystemPrimitives.RK, {
                        ...common,
                        as: "select",
                        defaultValue: "performance",
                        children: [ 
                        
                         (0, jsx_runtime.jsx)("option", {
                            "data-text": "label",
                            value: "performance",
                            children: "공연"
                        }), 
                        
                         (0, jsx_runtime.jsx)("option", {
                            "data-text": "label",
                            value: "exhibition",
                            children: "전시"
                        }) ]
                    });
                    if (value === "textarea")   return (0, jsx_runtime.jsx /* SystemField */)(SystemPrimitives.RK, {
                        ...common,
                        as: "textarea",
                        defaultValue: "관람 후 감상을 남겨 주세요."
                    });
                     
                    return (0, jsx_runtime.jsx /* SystemField */)(SystemPrimitives.RK, {
                        ...common,
                        readOnly: state === "readonly",
                        defaultValue: state === "readonly" ? "읽기 전용" : undefined,
                        placeholder: "내용을 입력하세요"
                    });
                }
                if (component === "checkbox")   return (0, jsx_runtime.jsx /* SystemCheckbox */)(SystemPrimitives.U1, {
                    label: text,
                    disabled: state === "disabled",
                    defaultChecked: state === "checked"
                });
                if (component === "badge")   return (0, jsx_runtime.jsx /* SystemBadge */)(SystemPrimitives.WT, {
                    tone: example.axis === "tone" ? value : "neutral",
                    appearance: example.axis === "appearance" ? value : "default",
                    children: "공연 안내"
                });
                if (component === "notice")   return (0, jsx_runtime.jsx /* SystemNotice */)(SystemPrimitives.F0, {
                    ref: element => element === null || element === void 0 ? void 0 : element.setAttribute("data-ref-forwarded", "true"),
                    variant: example.axis === "variant" ? value : "default",
                    error: state === "error",
                    title: "처리 결과",
                    children: state === "error" ? "입력값을 확인해 주세요." : "요청을 확인했어요."
                });
                if (component === "tabs")   return (0, jsx_runtime.jsx /* SystemTabs */)(SystemNavigation.T, {
                    "aria-label": text,
                    orientation: example.axis === "orientation" ? value : "horizontal",
                    value: exampleValues[example.id] || "performance",
                    onValueChange: next => updateExample(example.id, next),
                    items: [ {
                        id: "performance",
                        label: "공연",
                        content:   (0, jsx_runtime.jsx)("p", {
                            "data-text": "body",
                            children: "프로그램 일정"
                        })
                    }, {
                        id: "exhibition",
                        label: "전시",
                        content:   (0, jsx_runtime.jsx)("p", {
                            "data-text": "body",
                            children: "전시 일정"
                        })
                    }, {
                        id: "disabled",
                        label: "준비 중",
                        content: null,
                        disabled: true
                    } ]
                });
                if (component === "disclosure")   return (0, jsx_runtime.jsx /* SystemDisclosure */)(SystemNavigation.f, {
                    summary: "관람 안내 펼치기",
                    appearance: example.axis === "appearance" ? value : "default",
                    open: exampleValues[example.id] ? exampleValues[example.id] === "true" : state === "open",
                    onToggle: event => updateExample(example.id, String(event.currentTarget.open)),
                    children:   (0, jsx_runtime.jsx)("p", {
                        "data-text": "body",
                        children: "공연 시작 전에 입장해 주세요."
                    })
                });
                if (component === "hero-slide")   return (0, jsx_runtime.jsx)("div", {
                    className: "home-v4-wrap component-hero-preview",
                    children:   (0, jsx_runtime.jsx /* default */)(HeroSlide.Z, {
                        idPrefix: example.id,
                        feature: HOME_FEATURES[0],
                        active: example.axis !== "preview",
                        preview: example.axis === "preview" ? value : undefined,
                        entering: state === "entering",
                        layout: example.axis === "layout" ? value : "standalone",
                        onSelect: () => (0, SmallNotificationModal /* showSmallNotification */ .VX)("히어로 미리보기입니다.")
                    })
                });
                if (component === "account-mini-room")   return (0, jsx_runtime.jsx /* default */)(AccountMiniRoom.Z, {
                    name: "관람객",
                    message: "가이드 예시 공간",
                    theme: example.axis === "theme" ? value : "paper",
                    lightOn: exampleValues[example.id] ? exampleValues[example.id] === "true" : state !== "light-off",
                    programs: catalog /* PROGRAMS */ .Lr.slice(0, 3),
                    hasFavorites: false,
                    onToggleLight: () => updateExample(example.id, (exampleValues[example.id] ? exampleValues[example.id] === "true" : state !== "light-off") ? "false" : "true")
                });
                if (component === "account-membership")   return (0, jsx_runtime.jsx /* AccountMembershipCard */)(AccountPanels.pS, {
                    name: "가이드 관람객",
                    message: "인증 상태별 표시 예시",
                    mode: value,
                    counts: {
                        upcoming: 0,
                        favorites: 0,
                        notes: 0
                    },
                    onEdit: () => (0, SmallNotificationModal /* showSmallNotification */ .VX)("프로필 편집 예시입니다."),
                    onLogout: () => (0, SmallNotificationModal /* showSmallNotification */ .VX)("로그아웃 예시입니다. 인증은 변경하지 않아요.")
                });
                if (component === "account-ticket")   return (0, jsx_runtime.jsx /* AccountTicket */)(AccountPanels.pN, {
                    variant: example.axis === "variant" ? value : "full",
                    program: catalog /* PROGRAMS */ .Lr[0],
                    booking: {
                        id: example.id,
                        programId: catalog /* PROGRAMS */ .Lr[0].id,
                        title: catalog /* PROGRAMS */ .Lr[0].title,
                        date: "2026-11-20",
                        time: "19:30",
                        venue: catalog /* PROGRAMS */ .Lr[0].venue || "세종문화회관",
                        seats: [ "A1" ],
                        total: 7e4,
                        reference: "GUIDE",
                        status: state === "cancelled" ? "cancelled" : "reserved_unpaid"
                    },
                    onCancel: () => (0, SmallNotificationModal /* showSmallNotification */ .VX)("가이드 예시입니다. 실제 예매 기록은 변경되지 않아요.")
                });
                if (component === "glass")   return (0, jsx_runtime.jsxs)("div", {
                    className: "ds-glass-stage",
                    children: [ 
                    
                     (0, jsx_runtime.jsx)("img", {
                        src: "/v5/assets/images/sejong-grand-interior.png",
                        alt: "",
                        className: "ds-glass-backdrop"
                    }), 
                    
                     (0, jsx_runtime.jsxs /* default */)(LiquidGlass.Z, {
                        variant: value,
                        className: "ds-glass-example",
                        children: [ 
                        
                         (0, jsx_runtime.jsx)("h4", {
                            "data-text": "item-title",
                            children: "공통 유리 재질"
                        }), 
                        
                         (0, jsx_runtime.jsxs)("p", {
                            "data-text": "body",
                            children: [ "variant: ", value ]
                        }) ]
                    }) ]
                });
                if (component === "header") {
                    const route = value === "inverse" ? "/v5/about/introduction/" : "/v5/";
                     
                    return (0, jsx_runtime.jsxs)("div", {
                        className: "component-route-preview",
                        children: [ 
                        
                         (0, jsx_runtime.jsx /* SystemButton */)(SystemPrimitives.kR, {
                            variant: "secondary",
                            onClick: () => updateExample(example.id, exampleValues[example.id] === "true" ? "false" : "true"),
                            children: value === "inverse" ? "반전 헤더 확인" : "기본 헤더 확인"
                        }), 
                        
                         (0, jsx_runtime.jsx)(SystemPrimitives.SystemLink, {
                            variant: "quiet",
                            href: route,
                            target: "_blank",
                            children: "실제 화면 열기"
                        }), exampleValues[example.id] === "true" &&   (0, jsx_runtime.jsx)("iframe", {
                            title: "Header " + value,
                            src: route,
                            loading: "lazy"
                        }) ]
                    });
                }
                if (component === "floating-panel") {
                    const anchor = value === "drawer" ? drawerAnchor : floatingAnchor;
                     
                    return (0, jsx_runtime.jsxs)(jsx_runtime.Fragment, {
                        children: [ 
                        
                         (0, jsx_runtime.jsx /* SystemButton */)(SystemPrimitives.kR, {
                            ref: anchor,
                            variant: "secondary",
                            onClick: () => updateExample(example.id, "true"),
                            children: value === "drawer" ? "서랍 열기" : "플로팅 창 열기"
                        }), 
                        
                         (0, jsx_runtime.jsx /* default */)(FloatingPanel.Z, {
                            open: exampleValues[example.id] === "true",
                            variant: value,
                            anchorRef: anchor,
                            onClose: () => updateExample(example.id, "false"),
                            title: "가이드 플로팅 창",
                            children:   (0, jsx_runtime.jsx)("p", {
                                "data-text": "body",
                                children: "Escape 또는 닫기 버튼으로 닫습니다."
                            })
                        }) ]
                    });
                }
                return null;
            }
             
            return (0, jsx_runtime.jsxs)("div", {
                "data-text": "body",
                className: "component-catalog",
                "data-documentation-tool": "component-catalog",
                children: [ 
                
                 (0, jsx_runtime.jsx)("p", {
                    "data-text": "body",
                    children: "제품 등록부와 실제 import·렌더 경로를 대조한 목록입니다. 등록된 모든 구현은 제품에 연결되어야 합니다. 별칭은 같은 구현으로 묶고, 가이드의 목록·재질 실험 도구와 퇴역 구현은 제품 수에 포함하지 않습니다."
                }), 
                
                 (0, jsx_runtime.jsxs)("dl", {
                    className: "component-counts",
                    "aria-label": "컴포넌트 연결 현황",
                    children: [ 
                    
                     (0, jsx_runtime.jsxs)("div", {
                        children: [ 
                        
                         (0, jsx_runtime.jsx)("dt", {
                            "data-text": "label",
                            children: "등록된 구현"
                        }), 
                        
                         (0, jsx_runtime.jsx)("dd", {
                            "data-text": "body",
                            "data-count": "total",
                            children: COMPONENT_COUNTS.total
                        }) ]
                    }), 
                    
                     (0, jsx_runtime.jsxs)("div", {
                        children: [ 
                        
                         (0, jsx_runtime.jsx)("dt", {
                            "data-text": "label",
                            children: "제품 연결"
                        }), 
                        
                         (0, jsx_runtime.jsx)("dd", {
                            "data-text": "body",
                            "data-count": "product",
                            children: COMPONENT_COUNTS.product
                        }) ]
                    }), 
                    
                     (0, jsx_runtime.jsxs)("div", {
                        children: [ 
                        
                         (0, jsx_runtime.jsx)("dt", {
                            "data-text": "label",
                            children: "가이드 전용"
                        }), 
                        
                         (0, jsx_runtime.jsx)("dd", {
                            "data-text": "body",
                            "data-count": "guide-only",
                            children: COMPONENT_COUNTS.documentationOnly
                        }) ]
                    }), 
                    
                     (0, jsx_runtime.jsxs)("div", {
                        children: [ 
                        
                         (0, jsx_runtime.jsx)("dt", {
                            "data-text": "label",
                            children: "미사용"
                        }), 
                        
                         (0, jsx_runtime.jsx)("dd", {
                            "data-text": "body",
                            "data-count": "unused",
                            children: COMPONENT_COUNTS.unused
                        }) ]
                    }) ]
                }), 
                
                 (0, jsx_runtime.jsx /* SystemField */)(SystemPrimitives.RK, {
                    "data-text": "body",
                    type: "search",
                    label: "컴포넌트 검색",
                    value: query,
                    onChange: event => setQuery(event.target.value),
                    placeholder: "이름, 용도, 소스 파일"
                }), 
                
                 (0, jsx_runtime.jsx)("div", {
                    className: "component-table-scroll",
                    role: "region",
                    "aria-label": "전체 컴포넌트 등록부",
                    tabIndex: 0,
                    children:   (0, jsx_runtime.jsxs)("table", {
                        className: "component-table",
                        children: [ 
                        
                         (0, jsx_runtime.jsx)("thead", {
                            children:   (0, jsx_runtime.jsxs)("tr", {
                                children: [ 
                                
                                 (0, jsx_runtime.jsx)("th", {
                                    "data-text": "label",
                                    scope: "col",
                                    children: "컴포넌트"
                                }), 
                                
                                 (0, jsx_runtime.jsx)("th", {
                                    "data-text": "label",
                                    scope: "col",
                                    children: "구분·사용"
                                }), 
                                
                                 (0, jsx_runtime.jsx)("th", {
                                    "data-text": "label",
                                    scope: "col",
                                    children: "규격과 역할"
                                }) ]
                            })
                        }), 
                        
                         (0, jsx_runtime.jsx)("tbody", {
                            children: entries.map((entry => {
                                var _COMPONENT_REGISTRY_find, _entry_states, _entry_examples;
                                const usage = COMPONENT_USAGE[entry.id];
                                 
                                return (0, jsx_runtime.jsxs)("tr", {
                                    "data-component-record": entry.id,
                                    children: [ 
                                    
                                     (0, jsx_runtime.jsxs)("th", {
                                        "data-text": "label",
                                        scope: "row",
                                        children: [ 
                                        
                                         (0, jsx_runtime.jsx)("a", {
                                            "data-text": "action",
                                            href: "#".concat(entry.guide),
                                            children: entry.name
                                        }), entry.lifecycle === "deprecated" &&   (0, jsx_runtime.jsx)("span", {
                                            "data-text": "label",
                                            children: "Deprecated"
                                        }), 
                                        
                                         (0, jsx_runtime.jsx)("code", {
                                            "data-text": "meta",
                                            children: entry.source
                                        }) ]
                                    }), 
                                    
                                     (0, jsx_runtime.jsxs)("td", {
                                        "data-text": "body",
                                        children: [ kinds[entry.kind], 
                                        
                                         (0, jsx_runtime.jsx)("br", {}), 
                                        
                                         (0, jsx_runtime.jsx)("strong", {
                                            "data-text": "item-title",
                                            children: usage ? statuses[usage.status] : "분석 필요"
                                        }), entry.parent &&   (0, jsx_runtime.jsxs)("span", {
                                            "data-text": "body",
                                            children: [ "상위: ", (_COMPONENT_REGISTRY_find = COMPONENT_REGISTRY.find((parent => parent.id === entry.parent))) === null || _COMPONENT_REGISTRY_find === void 0 ? void 0 : _COMPONENT_REGISTRY_find.name ]
                                        }) ]
                                    }), 
                                    
                                     (0, jsx_runtime.jsxs)("td", {
                                        "data-text": "body",
                                        children: [ 
                                        
                                         (0, jsx_runtime.jsx)("p", {
                                            "data-text": "body",
                                            children: entry.purpose
                                        }), Object.entries(entry.axes || {}).map((param => {
                                            let [axis, values] = param;
                                             
                                            return (0, jsx_runtime.jsxs)("p", {
                                                "data-text": "body",
                                                children: [ axis, ": ", values.join(" · ") ]
                                            }, axis);
                                        })), ((_entry_states = entry.states) === null || _entry_states === void 0 ? void 0 : _entry_states.length) ?   (0, 
                                        jsx_runtime.jsxs)("p", {
                                            "data-text": "body",
                                            children: [ "상태: ", entry.states.join(" · ") ]
                                        }) : null, ((_entry_examples = entry.examples) === null || _entry_examples === void 0 ? void 0 : _entry_examples.length) ?   (0, 
                                        jsx_runtime.jsxs)("a", {
                                            "data-text": "action",
                                            "data-text-size": "control",
                                            href: "#components/registry/".concat(entry.examples[0].id),
                                            children: [ "실제 예시 ", entry.examples.length, "개 보기" ]
                                        }) : null, 
                                        
                                         (0, jsx_runtime.jsxs)("details", {
                                            children: [ 
                                            
                                             (0, jsx_runtime.jsx)("summary", {
                                                "data-text": "label",
                                                children: "실제 연결 경로"
                                            }), 
                                            
                                             (0, jsx_runtime.jsx)("ul", {
                                                children: [ ...new Set([ ...(usage === null || usage === void 0 ? void 0 : usage.productUses) || [], ...(usage === null || usage === void 0 ? void 0 : usage.guideUses) || [] ]) ].map((source =>   (0, 
                                                jsx_runtime.jsx)("li", {
                                                    "data-text": "body",
                                                    children:   (0, jsx_runtime.jsx)("code", {
                                                        "data-text": "meta",
                                                        children: source
                                                    })
                                                }, source)))
                                            }) ]
                                        }) ]
                                    }) ]
                                }, entry.id);
                            }))
                        }) ]
                    })
                }), 
                
                 (0, jsx_runtime.jsx)("h3", {
                    "data-text": "subheading",
                    children: "속성 축과 상태의 실제 예시"
                }), 
                
                 (0, jsx_runtime.jsx)("p", {
                    "data-text": "body",
                    children: "각 예시는 제품 컴포넌트의 공식 열거값에서 생성됩니다. 선택·입력·펼침은 직접 조작할 수 있습니다."
                }), 
                
                 (0, jsx_runtime.jsx)("p", {
                    "data-text": "body",
                    children: "circle은 이름이 있는 아이콘 조작에 사용합니다. 기본 지름은 48px, flow는 50px입니다. 선택·hover·누름·비활성 상태는 배경과 전경을 함께 결정하며, 비활성이 우선합니다. 중립색 토글은 밝고 어두운 면을 반전하고 브랜드색 토글은 브랜드 채움과 아이콘 상태를 유지합니다."
                }), 
                
                 (0, jsx_runtime.jsx)("div", {
                    className: "component-contract-examples",
                    children: COMPONENT_REGISTRY.filter((entry => {
                        var _entry_examples;
                        return (_entry_examples = entry.examples) === null || _entry_examples === void 0 ? void 0 : _entry_examples.length;
                    })).map((entry =>   (0, jsx_runtime.jsxs)("section", {
                        "aria-label": entry.name,
                        className: "component-contract-group",
                        children: [ 
                        
                         (0, jsx_runtime.jsx)("h4", {
                            "data-text": "item-title",
                            children: entry.name
                        }), entry.examples.map((example => {
                            var _example_value;
                             
                            return (0, jsx_runtime.jsxs)("div", {
                                "data-text": "body",
                                id: example.id,
                                "data-component-example": entry.id,
                                "data-example-axis": example.axis,
                                "data-example-value": example.value,
                                "data-example-state": example.state,
                                className: "component-contract-example" + (((_example_value = example.value) === null || _example_value === void 0 ? void 0 : _example_value.startsWith("inverse")) ? " is-inverse" : ""),
                                children: [ 
                                
                                 (0, jsx_runtime.jsxs)("p", {
                                    "data-text": "caption",
                                    children: [ example.axis || "state", ": ", example.value || example.state ]
                                }), renderExample(entry.id, example) ]
                            }, example.id);
                        })) ]
                    }, entry.id)))
                }), 
                
                 (0, jsx_runtime.jsx)("h3", {
                    "data-text": "subheading",
                    children: "같은 컨트롤, 서로 다른 역할"
                }), 
                
                 (0, jsx_runtime.jsxs)("div", {
                    className: "component-actions",
                    children: [ 
                    
                     (0, jsx_runtime.jsxs)(SystemPrimitives.SystemLink, {
                        "data-text": "action",
                        href: "/programs",
                        children: [ "프로그램으로 이동 ", 
                        
                         (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                            name: "arrow",
                            size: 20
                        }) ]
                    }), 
                    
                     (0, jsx_runtime.jsx /* SystemIconButton */)(SystemPrimitives.MW, {
                        "data-text": "action",
                        "aria-label": "공통 아이콘 버튼 확인",
                        onClick: () => (0, SmallNotificationModal /* showSmallNotification */ .VX)("공통 아이콘 버튼으로 실행했어요."),
                        children:   (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                            name: "plus"
                        })
                    }) ]
                }), 
                
                 (0, jsx_runtime.jsx /* SystemCheckbox */)(SystemPrimitives.U1, {
                    "data-text": "label",
                    checked: consent,
                    onChange: event => setConsent(event.target.checked),
                    label: "실제 화면과 같은 체크박스입니다"
                }), 
                
                 (0, jsx_runtime.jsx)("h3", {
                    "data-text": "subheading",
                    children: "대표 콘텐츠와 시즌 배너"
                }), 
                
                 (0, jsx_runtime.jsx)("div", {
                    className: "home-v4-wrap component-hero-preview",
                    children:   (0, jsx_runtime.jsx /* default */)(HeroSlide.Z, {
                        idPrefix: "guide-feature",
                        feature: HOME_FEATURES[0],
                        active: true,
                        layout: "standalone"
                    })
                }), 
                
                 (0, jsx_runtime.jsx /* default */)(SeasonBanner.Z, {
                    id: "design-season-banner"
                }), 
                
                 (0, jsx_runtime.jsx)("h3", {
                    "data-text": "subheading",
                    children: "티켓오픈과 유리 시계"
                }), 
                
                 (0, jsx_runtime.jsxs)("div", {
                    className: "component-companion-preview",
                    children: [ 
                    
                     (0, jsx_runtime.jsx)("img", {
                        className: "component-preview-background",
                        src: (0, media /* mediaPath */ .e)("assets/images/".concat(HOME_FEATURES[0].image)),
                        alt: "",
                        width: 1672,
                        height: 941,
                        loading: "lazy"
                    }), 
                    
                     (0, jsx_runtime.jsx /* default */)(HeroCompanion.Z, {}) ]
                }), 
                
                 (0, jsx_runtime.jsx)("h3", {
                    "data-text": "subheading",
                    children: "공간 관계를 유지하는 선택 조작"
                }), 
                
                 (0, jsx_runtime.jsxs)("div", {
                    className: "component-booking-preview",
                    children: [ 
                    
                     (0, jsx_runtime.jsx /* BookingCalendar */)(HomeBookingControls.w, {
                        month: month,
                        selectedDate: date,
                        today: "2026-10-21",
                        programs: catalog /* PROGRAMS */ .Lr,
                        dateLabel: value => value.replaceAll("-", "."),
                        onMonthChange: setMonth,
                        onDateChange: setDate
                    }), 
                    
                     (0, jsx_runtime.jsx /* BookingProgramChoice */)(HomeBookingControls.J, {
                        program: catalog /* PROGRAMS */ .Lr[0],
                        selected: selected,
                        available: true,
                        past: false,
                        onSelect: () => setSelected((value => !value))
                    }) ]
                }), 
                
                 (0, jsx_runtime.jsx)("p", {
                    "data-text": "body",
                    children: "달력의 날짜에 마우스를 올리거나 키보드 초점을 맞추면 그날의 프로그램을 미리 볼 수 있습니다. 미리보기는 날짜 선택을 바꾸지 않으며 Escape로 닫습니다. 좁은 화면에서는 날짜 입력을 사용합니다."
                }), 
                
                 (0, jsx_runtime.jsx)("p", {
                    "data-text": "caption",
                    className: "ds-caption",
                    children: "일반 버튼의 규격을 좌석·달력·복합 선택 타일에 강제로 적용하지 않습니다. 아래 예외는 소유 구현과 이유를 검사하며, 파일 전체를 예외로 두지 않습니다."
                }), 
                
                 (0, jsx_runtime.jsx)("ul", {
                    className: "component-exceptions",
                    children: CONTROL_EXCEPTIONS.map((exception =>   (0, jsx_runtime.jsxs)("li", {
                        "data-text": "body",
                        children: [ 
                        
                         (0, jsx_runtime.jsxs)("strong", {
                            "data-text": "item-title",
                            children: [ exception.owner, " · ", exception.part ]
                        }), 
                        
                         (0, jsx_runtime.jsx)("span", {
                            "data-text": "body",
                            children: exception.reason
                        }) ]
                    }, "".concat(exception.source, "-").concat(exception.part))))
                }), 
                
                 (0, jsx_runtime.jsx)("h3", {
                    "data-text": "subheading",
                    children: "개인 공간과 관람 기록"
                }), 
                
                 (0, jsx_runtime.jsx)("p", {
                    "data-text": "body",
                    children: "마이페이지에서 사용하는 동일한 구현입니다. 미리보기에는 예시 데이터를 사용하며, 노트는 페이지를 떠나면 초기화됩니다."
                }), 
                
                 (0, jsx_runtime.jsx)("div", {
                    "data-text": "body",
                    className: "component-actions",
                    children: [ {
                        id: "paper",
                        label: "종이빛"
                    }, {
                        id: "sky",
                        label: "하늘빛"
                    }, {
                        id: "sun",
                        label: "햇살빛"
                    } ].map((theme =>   (0, jsx_runtime.jsx /* SystemButton */)(SystemPrimitives.kR, {
                        "data-text": "action",
                        variant: "secondary",
                        "aria-pressed": roomTheme === theme.id,
                        onClick: () => setRoomTheme(theme.id),
                        children: theme.label
                    }, theme.id)))
                }), 
                
                 (0, jsx_runtime.jsx /* default */)(AccountMiniRoom.Z, {
                    name: "관람객",
                    message: "관람의 기록과 좋아하는 것들을 모아요.",
                    theme: roomTheme,
                    lightOn: roomLight,
                    programs: catalog /* PROGRAMS */ .Lr.slice(0, 3),
                    hasFavorites: false,
                    onToggleLight: () => setRoomLight((value => !value))
                }), 
                
                 (0, jsx_runtime.jsx /* AccountMembershipCard */)(AccountPanels.pS, {
                    name: "관람객",
                    message: "나의 취향을 발견하는 중",
                    mode: "guest",
                    counts: {
                        upcoming: 0,
                        favorites: 0,
                        notes: accountNotes.length
                    },
                    onEdit: () => setPreview("account-experience"),
                    onLogout: () => {}
                }), 
                
                 (0, jsx_runtime.jsx /* AccountTicket */)(AccountPanels.pN, {
                    variant: "compact",
                    program: catalog /* PROGRAMS */ .Lr[0],
                    booking: {
                        id: "GUIDE-SAMPLE",
                        programId: catalog /* PROGRAMS */ .Lr[0].id,
                        title: catalog /* PROGRAMS */ .Lr[0].title,
                        date: "2026-11-20",
                        time: "19:30",
                        venue: catalog /* PROGRAMS */ .Lr[0].venue || "세종문화회관",
                        seats: [ "A1" ],
                        total: 7e4,
                        reference: "GUIDE"
                    }
                }), 
                
                 (0, jsx_runtime.jsx /* AccountDiary */)(AccountPanels.Lh, {
                    programs: catalog /* PROGRAMS */ .Lr,
                    notes: accountNotes,
                    today: "2026-10-21",
                    onSave: draft => {
                        const value = (0, account_space /* validateAccountNote */ .MU)(draft, new Set(catalog /* PROGRAMS */ .Lr.map((program => program.id))), "2026-10-21");
                        if (!value) return false;
                        setAccountNotes((current => [ {
                            ...value,
                            id: crypto.randomUUID()
                        }, ...current ]));
                        return true;
                    },
                    onDelete: id => setAccountNotes((current => current.filter((note => note.id !== id))))
                }), 
                
                 (0, jsx_runtime.jsx)("h3", {
                    "data-text": "subheading",
                    children: "구조와 전체 페이지 경험"
                }), 
                
                 (0, jsx_runtime.jsx)("p", {
                    "data-text": "body",
                    children: "헤더·푸터·문맥 메뉴·위로 가기·기관 소개는 실제 경로에서 확인합니다. 선택하면 같은 제품 화면을 미리 불러옵니다."
                }), 
                
                 (0, jsx_runtime.jsx)("div", {
                    "data-text": "body",
                    className: "component-actions",
                    children: COMPONENT_REGISTRY.filter((entry => entry.previewRoute)).map((entry =>   (0, 
                    jsx_runtime.jsx /* SystemButton */)(SystemPrimitives.kR, {
                        "data-text": "action",
                        variant: "secondary",
                        "aria-pressed": preview === entry.id,
                        onClick: () => setPreview(entry.id),
                        children: entry.name
                    }, entry.id)))
                }), (previewEntry === null || previewEntry === void 0 ? void 0 : previewEntry.previewRoute) &&   (0, 
                jsx_runtime.jsxs)("div", {
                    className: "component-route-preview",
                    children: [ 
                    
                     (0, jsx_runtime.jsxs)(SystemPrimitives.SystemLink, {
                        "data-text": "action",
                        variant: "quiet",
                        href: previewEntry.previewRoute,
                        target: "_blank",
                        children: [ previewEntry.name, " 원본 화면 열기 ", 
                        
                         (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                            name: "diagonal",
                            size: 20
                        }) ]
                    }), 
                    
                     (0, jsx_runtime.jsx)("iframe", {
                        title: "".concat(previewEntry.name, " 실제 화면 미리보기"),
                        src: previewEntry.previewRoute,
                        loading: "lazy"
                    }) ]
                }) ]
            });
        }
        // EXTERNAL MODULE: ./components/SystemDialog.tsx
                var SystemDialog = __webpack_require__(1914);
        // EXTERNAL MODULE: ./components/SystemControlGroup.tsx
                var SystemControlGroup = __webpack_require__(8127);
        // EXTERNAL MODULE: ./components/VioletQuickMenu.tsx + 2 modules
                var VioletQuickMenu = __webpack_require__(9037);
        // CONCATENATED MODULE: ./src/data/design-system.ts
        // [공통 토큰의 공개 진입점 / Public entry point for shared design tokens]
        const CHAPTERS = [ {
            id: "overview",
            label: "디자인 시스템 소개",
            group: "시작하기",
            description: "세종의 브랜드를 일관된 화면으로 이어가는 기준",
            sections: [ [ "principles", "설계 원칙" ], [ "structure", "시스템의 구성" ] ]
        }, {
            id: "brand",
            label: "브랜드와 로고",
            group: "기초 원칙",
            description: "원형을 보존하는 로고와 디지털 사용 기준",
            sections: [ [ "signature", "기본형" ], [ "clearspace", "보호 공간과 최소 크기" ], [ "usage", "올바른 사용" ], [ "icons", "아이콘" ] ]
        }, {
            id: "color",
            label: "컬러",
            group: "기초 원칙",
            description: "기존 팔레트와 역할별 사용법",
            sections: [ [ "palette", "기본 팔레트" ], [ "semantic", "역할별 컬러" ], [ "contrast", "명도 대비" ] ]
        }, {
            id: "typography",
            label: "타이포그래피",
            group: "기초 원칙",
            description: "16px에서 시작하는 한글 중심의 읽기 체계",
            sections: [ [ "family", "기본 서체" ], [ "scale", "크기와 위계" ], [ "specimen", "직접 조합하기" ] ]
        }, {
            id: "layout",
            label: "레이아웃과 간격",
            group: "기초 원칙",
            description: "4px 단위의 간격과 반응형 구성",
            sections: [ [ "grid", "그리드와 화면" ], [ "spacing", "간격" ], [ "shape", "형태와 경계" ] ]
        }, {
            id: "components",
            label: "컴포넌트",
            group: "화면 만들기",
            description: "같은 역할에 같은 형태와 상태를 사용합니다",
            sections: [ [ "registry", "전체 컴포넌트" ], [ "buttons", "버튼" ], [ "cards", "콘텐츠 카드" ], [ "fields", "입력" ], [ "navigation", "탭과 펼침" ], [ "liquid-glass", "리퀴드 글래스" ], [ "floating-menu", "떠 있는 유리 메뉴" ], [ "small-notification", "알림소형모달" ], [ "feedback", "상태와 대화상자" ] ]
        }, {
            id: "motion",
            label: "모션",
            group: "화면 만들기",
            description: "읽기와 조작을 돕는 속도, 종료된 모션의 보존 예제",
            sections: [ [ "timing", "시간과 이징" ], [ "scroll", "글자별 스크롤 등장 · Deprecated" ], [ "quick-menu", "보라빛 퀵메뉴" ] ]
        }, {
            id: "accessibility",
            label: "접근성과 문장",
            group: "화면 만들기",
            description: "색·크기·입력 방식과 관계없이 전달하는 정보",
            sections: [ [ "reading", "읽기" ], [ "interaction", "조작" ], [ "writing", "문장과 상태 표현" ] ]
        }, {
            id: "resources",
            label: "토큰과 자료",
            group: "적용하기",
            description: "실제 코드와 연결된 토큰과 원본 자료",
            sections: [ [ "tokens", "토큰 내보내기" ], [ "assets", "브랜드 자료" ], [ "references", "참고 기준" ] ]
        } ];
        // [명도 대비 계산 / Relative luminance contrast]
        // WCAG의 sRGB 상대 명도 공식으로 실제 팔레트 조합을 계산합니다.
        // Calculate palette pairs from the WCAG sRGB relative luminance formula.
                function contrastRatio(first, second) {
            const luminance = hex => {
                if (!/^#[0-9a-f]{6}$/i.test(hex)) throw new Error("Expected a six-digit hex color");
                const channels = [ 1, 3, 5 ].map((offset => {
                    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
                    return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
                }));
                return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
            };
            const a = luminance(first);
            const b = luminance(second);
            return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
        }
        // [기존 문서 내보내기 API / Existing guide export API]
                function designTokensCss() {
            return (0, design_tokens /* renderDesignTokensCss */ .CB)();
        }
        // CONCATENATED MODULE: ./app/design-rules/page.tsx
        /* __next_internal_client_entry_do_not_use__ default auto */
        const groups = [ ...new Set(CHAPTERS.map((chapter => chapter.group))) ];
        const searchEntries = [ ...CHAPTERS.flatMap((chapter => [ {
            chapter: chapter.id,
            anchor: "",
            title: chapter.label,
            description: chapter.description
        }, ...chapter.sections.map((param => {
            let [anchor, title] = param;
            return {
                chapter: chapter.id,
                anchor: anchor,
                title: title,
                description: chapter.label + " · " + chapter.description
            };
        })) ])), ...design_tokens /* DESIGN_COLORS */ .Xv.map((color => ({
            chapter: "color",
            anchor: "palette",
            title: color.name,
            description: "--".concat(color.token, " · ").concat(color.hex)
        }))), ...design_tokens /* TYPE_SCALE */ .gk.map((type => ({
            chapter: "typography",
            anchor: "scale",
            title: type.role,
            description: "--".concat(type.token, " · ").concat(type.size, "px")
        }))) ];
        const inlineMenuItems = VioletQuickMenu /* SEJONG_QUICK_MENU_ITEMS */ .J.map(((item, index) => index === 0 ? {
            ...item,
            href: "/#quick-booking"
        } : item));
        const sampleTabs = [ "공연", "전시", "교육" ];
        // [팔레트 글자색도 중앙 토큰에 연결 / Bind palette specimen ink to central tokens]
                const paletteInkVariable = hex => {
            var _Object_entries_find;
            const token = (_Object_entries_find = Object.entries(design_tokens /* DESIGN_TOKEN_VALUES */ .gR).find((param => {
                let [name, value] = param;
                return name.startsWith("--color-") && value.toUpperCase() === hex.toUpperCase();
            }))) === null || _Object_entries_find === void 0 ? void 0 : _Object_entries_find[0];
            if (!token) throw new Error("팔레트 글자색의 공통 토큰을 찾지 못했습니다.");
            return "var(".concat(token, ")");
        };
        // [원본 토큰으로 표시하는 규격 / Display dimensions from canonical tokens]
                const tokenPixels = token => {
            let value = design_tokens /* DESIGN_TOKEN_VALUES */ .gR[token];
            const visited = new Set([ token ]);
            let reference = value.match(/^var\((--[\w-]+)\)$/);
            while (reference && !visited.has(reference[1])) {
                const next = reference[1];
                if (!design_tokens /* DESIGN_TOKEN_VALUES */ .gR[next]) break;
                visited.add(next);
                value = design_tokens /* DESIGN_TOKEN_VALUES */ .gR[next];
                reference = value.match(/^var\((--[\w-]+)\)$/);
            }
            return value.endsWith("rem") ? "".concat(Number.parseFloat(value) * 16, "px") : value;
        };
        function Section(param) {
            let {chapter: chapter, id: id, title: title, children: children} = param;
             
            return (0, jsx_runtime.jsxs)("section", {
                "data-text": "body",
                className: "ds-section",
                id: "".concat(chapter, "-").concat(id),
                "data-doc-section": true,
                children: [ 
                
                 (0, jsx_runtime.jsx)("h2", {
                    "data-text": "heading",
                    tabIndex: -1,
                    children: title
                }), children ]
            });
        }
        function DataTable(param) {
            let {label: label, headings: headings, rows: rows} = param;
             
            return (0, jsx_runtime.jsx)("div", {
                className: "ds-table-wrap",
                tabIndex: 0,
                role: "region",
                "aria-label": label,
                children:   (0, jsx_runtime.jsxs)("table", {
                    className: "ds-table",
                    children: [ 
                    
                     (0, jsx_runtime.jsx)("thead", {
                        children:   (0, jsx_runtime.jsx)("tr", {
                            children: headings.map((heading =>   (0, jsx_runtime.jsx)("th", {
                                "data-text": "label",
                                scope: "col",
                                children: heading
                            }, heading)))
                        })
                    }), 
                    
                     (0, jsx_runtime.jsx)("tbody", {
                        children: rows.map(((row, index) =>   (0, jsx_runtime.jsx)("tr", {
                            children: row.map(((cell, cellIndex) =>   (0, jsx_runtime.jsx)("td", {
                                "data-text": "body",
                                children: cell
                            }, cellIndex)))
                        }, index)))
                    }) ]
                })
            });
        }
        // [문서의 탐색·검색·이력 / Document navigation, search and history]
        // 각 장과 목차를 URL로 공유하고 키보드·모바일에서도 같은 문서를 탐색합니다.
        // Share chapter and section URLs while keeping keyboard and mobile navigation equivalent.
                function DesignRulesPage() {
            const [chapterId, setChapterId] = (0, react.useState)("overview");
            const [navigation, setNavigation] = (0, react.useState)(0);
            const [activeSection, setActiveSection] = (0, react.useState)("");
            const [query, setQuery] = (0, react.useState)("");
            const [message, setMessage] = (0, react.useState)("");
            const [copied, setCopied] = (0, react.useState)("");
            const [specimen, setSpecimen] = (0, react.useState)("공연이 있는 날, 세종에서 만나요.");
            const [specimenSize, setSpecimenSize] = (0, react.useState)(32);
            const [specimenWeight, setSpecimenWeight] = (0, react.useState)(600);
            const [demoTab, setDemoTab] = (0, react.useState)(0);
            const [demoDate, setDemoDate] = (0, react.useState)("2026-10-23");
            const [floatingMenuOpen, setFloatingMenuOpen] = (0, react.useState)(false);
            const floatingMenuTrigger = (0, react.useRef)(null);
            const floatingMenuPosition = (0, react.useRef)(null);
            const closeFloatingMenu = (0, react.useCallback)((() => setFloatingMenuOpen(false)), []);
            const searchDialog = (0, react.useRef)(null);
            const navigationDialog = (0, react.useRef)(null);
            const demoDialog = (0, react.useRef)(null);
            const copyTimer = (0, react.useRef)(null);
            const pendingTarget = (0, react.useRef)(null);
            const chapter = CHAPTERS.find((item => item.id === chapterId));
            const chapterIndex = CHAPTERS.findIndex((item => item.id === chapterId));
            const normalizedQuery = query.toLocaleLowerCase().replace(/\s/g, "");
            const results = searchEntries.filter((entry => !normalizedQuery || (entry.title + entry.description).toLocaleLowerCase().replace(/\s/g, "").includes(normalizedQuery))).slice(0, 10);
            const navigate = (0, react.useCallback)((function(next) {
                let anchor = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "", event = arguments.length > 2 ? arguments[2] : void 0;
                var _searchDialog_current, _navigationDialog_current;
                if (event && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)) return;
                event === null || event === void 0 ? void 0 : event.preventDefault();
                pendingTarget.current = {
                    chapter: next,
                    anchor: anchor
                };
                history.pushState(null, "", "#".concat(next).concat(anchor ? "/" + anchor : ""));
                setChapterId(next);
                setNavigation((value => value + 1));
                setMessage("");
                (_searchDialog_current = searchDialog.current) === null || _searchDialog_current === void 0 ? void 0 : _searchDialog_current.close();
                (_navigationDialog_current = navigationDialog.current) === null || _navigationDialog_current === void 0 ? void 0 : _navigationDialog_current.close();
            }), []);
            (0, react.useEffect)((() => {
                const previousTitle = document.title;
                const readLocation = () => {
                    let parts;
                    try {
                        parts = decodeURIComponent(location.hash.slice(1)).split("/");
                    } catch (e) {
                        parts = [];
                    }
                    if (parts[0] === "violet-quick-menu") parts = [ "motion", "quick-menu" ];
                    const next = CHAPTERS.find((item => item.id === parts[0])) || CHAPTERS[0];
                    const anchor = next.sections.some((section => section[0] === parts[1])) ? parts[1] : "";
                    pendingTarget.current = {
                        chapter: next.id,
                        anchor: anchor,
                        example: next.id === "components" && anchor === "registry" && /^example-[a-z0-9-]+$/.test(parts[2] || "") ? parts[2] : undefined
                    };
                    setMessage("");
                    setCopied("");
                    setChapterId(next.id);
                    setNavigation((value => value + 1));
                };
                const keyboard = event => {
                    if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === "k") {
                        var _searchDialog_current;
                        event.preventDefault();
                        if (!document.querySelector(".design-system-page dialog[open]")) (_searchDialog_current = searchDialog.current) === null || _searchDialog_current === void 0 ? void 0 : _searchDialog_current.showModal();
                    }
                };
                readLocation();
                window.addEventListener("hashchange", readLocation);
                window.addEventListener("popstate", readLocation);
                window.addEventListener("keydown", keyboard);
                return () => {
                    window.removeEventListener("hashchange", readLocation);
                    window.removeEventListener("popstate", readLocation);
                    window.removeEventListener("keydown", keyboard);
                    if (copyTimer.current) clearTimeout(copyTimer.current);
                    document.title = previousTitle;
                };
            }), []);
            (0, react.useEffect)((() => {
                document.title = "".concat(chapter.label, " · 세종문화회관 디자인 시스템");
                setActiveSection("".concat(chapter.id, "-").concat(chapter.sections[0][0]));
                let frame = 0;
                const pending = pendingTarget.current;
                if ((pending === null || pending === void 0 ? void 0 : pending.chapter) === chapter.id) {
                    pendingTarget.current = null;
                    frame = requestAnimationFrame((() => {
                        const target = pending.example ? document.getElementById(pending.example) : pending.anchor ? document.getElementById("".concat(chapter.id, "-").concat(pending.anchor)) : document.getElementById("doc-page-title");
                        if (pending.anchor && target) {
                            var _target_querySelector;
                            target.scrollIntoView({
                                block: "start",
                                behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
                            });
                            (_target_querySelector = target.querySelector("h2")) === null || _target_querySelector === void 0 ? void 0 : _target_querySelector.focus({
                                preventScroll: true
                            });
                        } else {
                            window.scrollTo({
                                top: 0,
                                behavior: "instant"
                            });
                            target === null || target === void 0 ? void 0 : target.focus({
                                preventScroll: true
                            });
                        }
                    }));
                }
                const observer = new IntersectionObserver((entries => {
                    for (const entry of entries) if (entry.isIntersecting) setActiveSection(entry.target.id);
                }), {
                    rootMargin: "-96px 0px -55% 0px",
                    threshold: 0
                });
                document.querySelectorAll("[data-doc-section]").forEach((section => observer.observe(section)));
                return () => {
                    if (frame) cancelAnimationFrame(frame);
                    observer.disconnect();
                };
            }), [ chapter, navigation ]);
            const copyValue = async (value, label) => {
                try {
                    await navigator.clipboard.writeText(value);
                    setCopied(label);
                    setMessage("".concat(label, "을 복사했습니다."));
                    if (copyTimer.current) clearTimeout(copyTimer.current);
                    copyTimer.current = setTimeout((() => setCopied("")), 1800);
                } catch (e) {
                    setMessage("복사 권한을 확인하거나 아래 코드에서 직접 복사해 주세요.");
                }
            };
            const downloadTokens = () => {
                const url = URL.createObjectURL(new Blob([ designTokensCss() ], {
                    type: "text/css;charset=utf-8"
                }));
                const anchor = document.createElement("a");
                anchor.href = url;
                anchor.download = "sejong-v5-tokens.css";
                anchor.click();
                setTimeout((() => URL.revokeObjectURL(url)), 1e3);
                setMessage("디자인 토큰 CSS 파일을 내려받았습니다.");
            };
            const navigationLinks = function() {
                let mobile = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : false;
                 
                return (0, jsx_runtime.jsx)("nav", {
                    "data-text": "body",
                    "aria-label": mobile ? "모바일 디자인 시스템 분류" : "디자인 시스템 분류",
                    children: groups.map((group =>   (0, jsx_runtime.jsxs)("div", {
                        "data-text": "body",
                        className: "ds-nav-group",
                        children: [ 
                        
                         (0, jsx_runtime.jsx)("p", {
                            "data-text": "body",
                            children: group
                        }), CHAPTERS.filter((item => item.group === group)).map((item =>   (0, jsx_runtime.jsx)("a", {
                            "data-text": "action",
                            href: "#".concat(item.id),
                            "aria-current": chapterId === item.id ? "page" : undefined,
                            onClick: event => navigate(item.id, "", event),
                            children: item.label
                        }, item.id))) ]
                    }, group)))
                });
            };
            const section = (id, title, children) =>   (0, jsx_runtime.jsx)(Section, {
                chapter: chapterId,
                id: id,
                title: title,
                children: children
            }, id)
            // [실제 토큰과 컴포넌트의 문서 / Documentation of working tokens and components]
            // 컬러·서체·상태 예제는 제품 코드와 같은 원본을 사용합니다.
            // Color, typography and state specimens use the same sources as product code.
            ;
            const renderChapter = () => {
                switch (chapterId) {
                  case "overview":
                     
                    return (0, jsx_runtime.jsxs)(jsx_runtime.Fragment, {
                        children: [ section("principles", "설계 원칙",   (0, jsx_runtime.jsxs)(jsx_runtime.Fragment, {
                            children: [ 
                            
                             (0, jsx_runtime.jsx)("p", {
                                "data-text": "body",
                                children: "세종의 상징과 예술 콘텐츠가 먼저 보이도록, 인터페이스는 읽기 쉽고 예측 가능한 기준을 가집니다."
                            }), 
                            
                             (0, jsx_runtime.jsx)("div", {
                                "data-text": "body",
                                className: "ds-principles",
                                children: [ [ "01", "읽는 크기를 지킵니다", "본문·메뉴·도움말은 16px에서 시작합니다. 좁은 화면에서도 글자 대신 구성을 조정합니다." ], [ "02", "같은 역할은 같습니다", "버튼의 크기, 간격, 모서리와 상태를 같은 토큰으로 연결합니다." ], [ "03", "브랜드를 정확히 씁니다", "기존 컬러와 로고의 원형을 유지하고, 역할과 사용 범위를 분명하게 정합니다." ] ].map((param => {
                                    let [number, title, text] = param;
                                     
                                    return (0, jsx_runtime.jsxs)("div", {
                                        className: "ds-principle",
                                        children: [ 
                                        
                                         (0, jsx_runtime.jsx)("span", {
                                            "data-text": "body",
                                            children: number
                                        }), 
                                        
                                         (0, jsx_runtime.jsx)("h3", {
                                            "data-text": "subheading",
                                            children: title
                                        }), 
                                        
                                         (0, jsx_runtime.jsx)("p", {
                                            "data-text": "body",
                                            children: text
                                        }) ]
                                    }, number);
                                }))
                            }), 
                            
                             (0, jsx_runtime.jsx)("div", {
                                className: "ds-brand-stage",
                                style: {
                                    marginTop: 32
                                },
                                children:   (0, jsx_runtime.jsx)("img", {
                                    src: "/v5/assets/images/sejong-wordmark.png",
                                    width: 236,
                                    height: 43,
                                    alt: "세종문화회관 로고"
                                })
                            }), 
                            
                             (0, jsx_runtime.jsx)("p", {
                                "data-text": "caption",
                                className: "ds-caption",
                                children: "웹사이트에 사용하는 색상과 글자, 컴포넌트의 적용 기준입니다."
                            }) ]
                        })), section("structure", "시스템의 구성",   (0, jsx_runtime.jsx)("div", {
                            "data-text": "body",
                            className: "ds-chapter-list",
                            children: CHAPTERS.slice(1).map(((item, index) =>   (0, jsx_runtime.jsxs)("a", {
                                "data-text": "action",
                                href: "#".concat(item.id),
                                onClick: event => navigate(item.id, "", event),
                                children: [ 
                                
                                 (0, jsx_runtime.jsx)("span", {
                                    "data-text": "body",
                                    children: String(index + 1).padStart(2, "0")
                                }), 
                                
                                 (0, jsx_runtime.jsxs)("div", {
                                    children: [ 
                                    
                                     (0, jsx_runtime.jsx)("strong", {
                                        "data-text": "item-title",
                                        children: item.label
                                    }), 
                                    
                                     (0, jsx_runtime.jsx)("p", {
                                        "data-text": "body",
                                        children: item.description
                                    }) ]
                                }), 
                                
                                 (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                                    name: "arrow",
                                    size: 24
                                }) ]
                            }, item.id)))
                        })) ]
                    });

                  case "brand":
                     
                    return (0, jsx_runtime.jsxs)(jsx_runtime.Fragment, {
                        children: [ section("signature", "기본형",   (0, jsx_runtime.jsxs)(jsx_runtime.Fragment, {
                            children: [ 
                            
                             (0, jsx_runtime.jsx)("p", {
                                "data-text": "body",
                                children: "세종문화회관의 워드마크와 심벌은 원본 파일을 사용합니다. 화면에서 읽기 쉬운 크기와 바탕을 먼저 확보합니다."
                            }), 
                            
                             (0, jsx_runtime.jsxs)("div", {
                                className: "ds-two-columns",
                                children: [ 
                                
                                 (0, jsx_runtime.jsxs)("div", {
                                    children: [ 
                                    
                                     (0, jsx_runtime.jsx)("div", {
                                        className: "ds-brand-stage",
                                        children:   (0, jsx_runtime.jsx)("img", {
                                            src: "/v5/assets/images/sejong-wordmark.png",
                                            alt: "밝은 바탕의 세종문화회관 워드마크",
                                            width: 236,
                                            height: 43
                                        })
                                    }), 
                                    
                                     (0, jsx_runtime.jsx)("p", {
                                        "data-text": "caption",
                                        className: "ds-caption",
                                        children: "기본형 · 밝은 바탕"
                                    }) ]
                                }), 
                                
                                 (0, jsx_runtime.jsxs)("div", {
                                    children: [ 
                                    
                                     (0, jsx_runtime.jsx)("div", {
                                        className: "ds-brand-stage ds-brand-stage-inverse",
                                        children:   (0, jsx_runtime.jsx)("img", {
                                            src: "/v5/assets/images/sejong-wordmark.png",
                                            alt: "어두운 바탕의 반전 워드마크",
                                            width: 236,
                                            height: 43
                                        })
                                    }), 
                                    
                                     (0, jsx_runtime.jsx)("p", {
                                        "data-text": "caption",
                                        className: "ds-caption",
                                        children: "반전형 · 어두운 바탕"
                                    }) ]
                                }) ]
                            }), 
                            
                             (0, jsx_runtime.jsx)("h3", {
                                "data-text": "subheading",
                                children: "보와 기둥"
                            }), 
                            
                             (0, jsx_runtime.jsxs)("div", {
                                className: "ds-demo-row",
                                children: [ 
                                
                                 (0, jsx_runtime.jsx)("img", {
                                    src: "/v5/assets/images/sejong-official-symbol.png",
                                    width: 64,
                                    height: 66,
                                    alt: "보와 기둥으로 구성된 세종문화회관 심벌"
                                }), 
                                
                                 (0, jsx_runtime.jsx)("p", {
                                    "data-text": "body",
                                    children: "건축의 구조를 닮은 상징은 브랜드 영역에서 사용합니다. 일반 버튼과 안내 아이콘을 대신하지 않습니다."
                                }) ]
                            }) ]
                        })), section("clearspace", "보호 공간과 최소 크기",   (0, jsx_runtime.jsxs)(jsx_runtime.Fragment, {
                            children: [ 
                            
                             (0, jsx_runtime.jsx)("p", {
                                "data-text": "body",
                                children: "다른 글자나 경계가 로고에 붙지 않도록 여백을 확보합니다. 아래 값은 v5 화면에서의 권장 기준입니다."
                            }), 
                            
                             (0, jsx_runtime.jsx)("div", {
                                className: "ds-clearspace-stage",
                                children:   (0, jsx_runtime.jsxs)("div", {
                                    className: "ds-clearspace",
                                    children: [ 
                                    
                                     (0, jsx_runtime.jsx)("span", {
                                        "data-text": "body",
                                        children: "상하좌우 0.5x 이상"
                                    }), 
                                    
                                     (0, jsx_runtime.jsx)("img", {
                                        src: "/v5/assets/images/sejong-wordmark.png",
                                        width: 236,
                                        height: 43,
                                        alt: "보호 공간 안에 배치한 로고"
                                    }) ]
                                })
                            }), 
                            
                             (0, jsx_runtime.jsx)(DataTable, {
                                label: "로고의 디지털 사용 기준",
                                headings: [ "항목", "v5 기준", "적용" ],
                                rows: [ [ "기준 단위 x", "워드마크의 높이", "원본 가로세로 비율 유지" ], [ "최소 가로 폭", "데스크톱 160px · 모바일 128px", "헤더의 워드마크" ], [ "심벌 최소 크기", "32px", "식별이 필요한 단독 심벌" ], [ "보호 공간", "로고 높이의 0.5배 이상", "주변 글자·도형·경계와의 거리" ] ]
                            }) ]
                        })), section("usage", "올바른 사용",   (0, jsx_runtime.jsxs)("div", {
                            className: "ds-two-columns",
                            children: [ 
                            
                             (0, jsx_runtime.jsxs)("div", {
                                className: "ds-rule-example",
                                children: [ 
                                
                                 (0, jsx_runtime.jsxs)("strong", {
                                    "data-text": "item-title",
                                    children: [ 
                                    
                                     (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                                        name: "check",
                                        size: 24
                                    }), "사용" ]
                                }), 
                                
                                 (0, jsx_runtime.jsx)("img", {
                                    src: "/v5/assets/images/sejong-wordmark.png",
                                    width: 160,
                                    height: 29,
                                    alt: "원형을 유지한 로고"
                                }), 
                                
                                 (0, jsx_runtime.jsx)("p", {
                                    "data-text": "body",
                                    children: "비율과 색을 유지하고 단색의 충분한 여백 위에 놓습니다."
                                }) ]
                            }), 
                            
                             (0, jsx_runtime.jsxs)("div", {
                                className: "ds-rule-example",
                                "data-incorrect": true,
                                children: [ 
                                
                                 (0, jsx_runtime.jsxs)("strong", {
                                    "data-text": "item-title",
                                    children: [ 
                                    
                                     (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                                        name: "close",
                                        size: 24
                                    }), "피하기" ]
                                }), 
                                
                                 (0, jsx_runtime.jsx)("img", {
                                    src: "/v5/assets/images/sejong-wordmark.png",
                                    width: 160,
                                    height: 29,
                                    alt: "사용 금지 예: 가로로 늘어나고 흐릿해진 로고"
                                }), 
                                
                                 (0, jsx_runtime.jsx)("p", {
                                    "data-text": "body",
                                    children: "비율을 늘이거나 투명도를 낮추지 않습니다. 그림자·외곽선·임의 효과를 더하지 않습니다."
                                }) ]
                            }) ]
                        })), section("icons", "아이콘",   (0, jsx_runtime.jsxs)(jsx_runtime.Fragment, {
                            children: [ 
                            
                             (0, jsx_runtime.jsx)("p", {
                                "data-text": "body",
                                children: "로컬 Material Symbols Rounded SVG를 사용합니다. 기본 크기는 24px, 문장 안에서는 20px로 정하고 조작 영역은 48px를 확보합니다."
                            }), 
                            
                             (0, jsx_runtime.jsx)("div", {
                                "data-text": "body",
                                className: "ds-icon-grid",
                                children: [ [ "calendar", "일정" ], [ "ticket", "예매" ], [ "pin", "위치" ], [ "search", "검색" ], [ "heart", "관심" ], [ "user", "내 정보" ], [ "check", "완료" ], [ "close", "닫기" ] ].map((param => {
                                    let [name, label] = param;
                                     
                                    return (0, jsx_runtime.jsxs)("div", {
                                        children: [ 
                                        
                                         (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                                            name: name,
                                            size: 24
                                        }), 
                                        
                                         (0, jsx_runtime.jsx)("span", {
                                            "data-text": "body",
                                            children: label
                                        }) ]
                                    }, name);
                                }))
                            }), 
                            
                             (0, jsx_runtime.jsxs)("ul", {
                                className: "ds-rules-list",
                                children: [ 
                                
                                 (0, jsx_runtime.jsx)("li", {
                                    "data-text": "body",
                                    children: "아이콘의 색은 주변 글자의 currentColor를 따릅니다."
                                }), 
                                
                                 (0, jsx_runtime.jsx)("li", {
                                    "data-text": "body",
                                    children: "장식 아이콘은 읽기 순서에서 숨기고, 아이콘만 있는 버튼에는 행동 이름을 제공합니다."
                                }), 
                                
                                 (0, jsx_runtime.jsx)("li", {
                                    "data-text": "body",
                                    children: "라운드 아이콘과 다른 굵기·스타일을 임의로 섞지 않습니다."
                                }) ]
                            }), 
                            
                             (0, jsx_runtime.jsx)("h3", {
                                "data-text": "subheading",
                                children: "헤더 액션 그룹"
                            }), 
                            
                             (0, jsx_runtime.jsxs)("p", {
                                "data-text": "body",
                                children: [ "검색·전체 메뉴 두 아이콘은 ", 
                                
                                 (0, jsx_runtime.jsx)("code", {
                                    "data-text": "body",
                                    children: 'group="header-action"'
                                }), "으로 구분합니다. 내부 기호는 28px, 원형 조작 영역은 48px이며 중앙 정렬과 원래 비율을 유지합니다. 일반 아이콘은 기존 크기를 사용합니다." ]
                            }), 
                            
                             (0, jsx_runtime.jsx)("div", {
                                className: "ds-icon-grid",
                                children: component_contracts /* HEADER_ACTION_ICONS */ .Zd.map((name =>   (0, jsx_runtime.jsxs)("div", {
                                    children: [ 
                                    
                                     (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                                        name: name,
                                        group: "header-action"
                                    }), 
                                    
                                     (0, jsx_runtime.jsx)("span", {
                                        "data-text": "utility",
                                        children: name === "search" ? "헤더 검색" : "헤더 전체 메뉴"
                                    }) ]
                                }, name)))
                            }) ]
                        })) ]
                    });

                  case "color":
                     
                    return (0, jsx_runtime.jsxs)(jsx_runtime.Fragment, {
                        children: [ section("palette", "기본 팔레트",   (0, jsx_runtime.jsxs)(jsx_runtime.Fragment, {
                            children: [ 
                            
                             (0, jsx_runtime.jsx)("p", {
                                "data-text": "body",
                                children: "현재 v5의 여덟 가지 기본색을 유지합니다. 노랑은 실제 CSS 값인 #F7D549를 기준으로 문서와 코드를 일치시킵니다."
                            }), 
                            
                             (0, jsx_runtime.jsx)("div", {
                                "data-text": "body",
                                className: "ds-palette",
                                children: design_tokens /* DESIGN_COLORS */ .Xv.map((color =>   (0, jsx_runtime.jsxs)("div", {
                                    className: "ds-color-card",
                                    children: [ 
                                    
                                     (0, jsx_runtime.jsx)("div", {
                                        className: "ds-color-swatch",
                                        style: {
                                            background: "var(--".concat(color.token, ")"),
                                            color: paletteInkVariable(color.ink)
                                        },
                                        children:   (0, jsx_runtime.jsx)("span", {
                                            "data-text": "body",
                                            children: "Aa"
                                        })
                                    }), 
                                    
                                     (0, jsx_runtime.jsx)("h3", {
                                        "data-text": "subheading",
                                        children: color.name
                                    }), 
                                    
                                     (0, jsx_runtime.jsxs)("code", {
                                        "data-text": "caption",
                                        className: "ds-token",
                                        children: [ "--", color.token ]
                                    }), 
                                    
                                     (0, jsx_runtime.jsxs)("button", {
                                        "data-text": "action",
                                        className: "ds-copy-color",
                                        onClick: () => copyValue(color.hex, color.name),
                                        "aria-label": "".concat(color.name, " ").concat(color.hex, " 복사"),
                                        children: [ 
                                        
                                         (0, jsx_runtime.jsx)("span", {
                                            "data-text": "body",
                                            children: copied === color.name ? "복사됨" : color.hex
                                        }), 
                                        
                                         (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                                            name: copied === color.name ? "check" : "content_copy",
                                            size: 20
                                        }) ]
                                    }), 
                                    
                                     (0, jsx_runtime.jsx)("p", {
                                        "data-text": "body",
                                        children: color.use
                                    }) ]
                                }, color.token)))
                            }) ]
                        })), section("semantic", "역할별 컬러",   (0, jsx_runtime.jsxs)(jsx_runtime.Fragment, {
                            children: [ 
                            
                             (0, jsx_runtime.jsx)("p", {
                                "data-text": "body",
                                children: "컴포넌트에서는 색상 이름보다 역할 토큰을 사용합니다. 같은 종류의 정보가 페이지마다 다른 색을 갖지 않도록 합니다."
                            }), 
                            
                             (0, jsx_runtime.jsx)(DataTable, {
                                label: "역할별 컬러 토큰",
                                headings: [ "역할", "토큰", "원본", "사용" ],
                                rows: design_tokens /* SEMANTIC_COLORS */ .kg.map((param => {
                                    let [group, token, source, use] = param;
                                    return [ group, 
                                    
                                     (0, jsx_runtime.jsxs)("code", {
                                        "data-text": "caption",
                                        className: "ds-token",
                                        children: [ "--", token ]
                                    }, token), 
                                    
                                     (0, jsx_runtime.jsxs)("code", {
                                        "data-text": "caption",
                                        className: "ds-token",
                                        children: [ "--", source ]
                                    }, source), use ];
                                }))
                            }) ]
                        })), section("contrast", "명도 대비",   (0, jsx_runtime.jsxs)(jsx_runtime.Fragment, {
                            children: [ 
                            
                             (0, jsx_runtime.jsx)("p", {
                                "data-text": "body",
                                children: "일반 본문은 4.5:1 이상의 대비를 기준으로 확인합니다. 밝은 브랜드색 위의 글자는 검정으로 사용합니다."
                            }), 
                            
                             (0, jsx_runtime.jsx)(DataTable, {
                                label: "실제 컬러 조합의 명도 대비",
                                headings: [ "조합", "예시", "계산값", "일반 본문" ],
                                rows: [ [ "어스 블랙 / 웜 화이트", "--color-black", "--color-white" ], [ "어스 블랙 / 하늘", "--color-black", "--color-sky" ], [ "어스 블랙 / 노랑", "--color-black", "--color-yellow" ], [ "진한 글자 / 황토", "--color-ink-strong", "--color-ochre" ], [ "보조 글자 / 웜 화이트", "--color-gray-600", "--color-white" ], [ "웜 화이트 / 하늘", "--color-white", "--color-sky" ] ].map((param => {
                                    let [label, inkToken, backgroundToken] = param;
                                    const ink = design_tokens /* DESIGN_TOKEN_VALUES */ .gR[inkToken];
                                    const background = design_tokens /* DESIGN_TOKEN_VALUES */ .gR[backgroundToken];
                                    return [ label, 
                                    
                                     (0, jsx_runtime.jsx)("span", {
                                        "data-text": "body",
                                        className: "ds-contrast-sample",
                                        style: {
                                            color: "var(".concat(inkToken, ")"),
                                            background: "var(".concat(backgroundToken, ")")
                                        },
                                        children: "가독성"
                                    }, label), "".concat(contrastRatio(ink, background).toFixed(2), " : 1"), contrastRatio(ink, background) >= 4.5 ? "사용 가능" : "피하기" ];
                                }))
                            }), 
                            
                             (0, jsx_runtime.jsxs)("p", {
                                "data-text": "caption",
                                className: "ds-caption",
                                children: [ "색만으로 오류·선택·성공을 알리지 않습니다. 아이콘, 문장과 상태 속성을 함께 사용합니다.", " ", 
                                
                                 (0, jsx_runtime.jsx)("a", {
                                    "data-text": "action",
                                    href: "https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html",
                                    target: "_blank",
                                    rel: "noreferrer",
                                    children: "W3C 명도 대비 기준 (새 창)"
                                }) ]
                            }) ]
                        })) ]
                    });

                  case "typography":
                     
                    return (0, jsx_runtime.jsxs)(jsx_runtime.Fragment, {
                        children: [ section("family", "기본 서체",   (0, jsx_runtime.jsxs)(jsx_runtime.Fragment, {
                            children: [ 
                            
                             (0, jsx_runtime.jsx /* SystemText */)(SystemText.J, {
                                as: "p",
                                variant: "body",
                                children: "로컬 Wanted Sans Variable을 사용합니다. 기본 본문은 16px / 400 / 행간 1.7입니다. 메뉴·날짜·고지·도움말도 16px 아래로 줄이지 않습니다."
                            }), 
                            
                             (0, jsx_runtime.jsx)("p", {
                                ...(0, SystemText /* textAttributes */ .N)("caption"),
                                className: "ds-caption",
                                children: "새 텍스트는 SystemText의 variant로 역할을 고릅니다. 기존 제목·링크·레이블은 data-text 또는 textAttributes로 같은 역할에 연결하며, HTML의 의미와 조작은 유지합니다. size를 지정할 때도 역할 또는 control·hero-with-companion·hero-standalone·quick-action 크기를 사용합니다."
                            }), 
                            
                             (0, jsx_runtime.jsx)("pre", {
                                "data-text": "body",
                                children:   (0, jsx_runtime.jsx)("code", {
                                    "data-text": "meta",
                                    children: '<SystemText as="h2" variant="heading">관람 예약</SystemText>\n<p {...textAttributes("caption")}>날짜와 관람 안내</p>\n<SystemText variant="body" size="lead">예매한 일정을 확인하세요.</SystemText>'
                                })
                            }), 
                            
                             (0, jsx_runtime.jsxs)("div", {
                                className: "ds-type-intro",
                                children: [ 
                                
                                 (0, jsx_runtime.jsxs)("strong", {
                                    "data-text": "item-title",
                                    children: [ "가나다, 세종.", 
                                    
                                     (0, jsx_runtime.jsx)("br", {}), "Aa 0123456789" ]
                                }), 
                                
                                 (0, jsx_runtime.jsxs)("p", {
                                    "data-text": "body",
                                    children: [ "Wanted Sans Variable · 400 / 500 / 600 / 700", 
                                    
                                     (0, jsx_runtime.jsx)("br", {}), "한글과 숫자, 영문이 함께 놓이는 화면을 같은 글꼴로 정돈합니다." ]
                                }) ]
                            }) ]
                        })), section("scale", "크기와 위계",   (0, jsx_runtime.jsxs)(jsx_runtime.Fragment, {
                            children: [ 
                            
                             (0, jsx_runtime.jsx)("p", {
                                "data-text": "body",
                                children: "크기를 줄여 화면에 맞추기보다 줄바꿈과 배치를 조정합니다. 작은 화면에서도 본문 기준은 같습니다."
                            }), design_tokens /* TYPE_SCALE */ .gk.map((type =>   (0, jsx_runtime.jsxs)("div", {
                                className: "ds-type-row",
                                children: [ 
                                
                                 (0, jsx_runtime.jsxs)("div", {
                                    className: "ds-type-meta",
                                    children: [ 
                                    
                                     (0, jsx_runtime.jsx)("strong", {
                                        "data-text": "item-title",
                                        children: type.role
                                    }), 
                                    
                                     (0, jsx_runtime.jsxs)("span", {
                                        "data-text": "body",
                                        children: [ type.mobile === type.size ? type.size : "".concat(type.mobile, "–").concat(type.size), "px · ", type.weight ]
                                    }), 
                                    
                                     (0, jsx_runtime.jsxs)("code", {
                                        "data-text": "caption",
                                        className: "ds-token",
                                        children: [ "--", type.token ]
                                    }) ]
                                }), 
                                
                                 (0, jsx_runtime.jsxs)("div", {
                                    className: "ds-type-sample",
                                    children: [ 
                                    
                                     (0, jsx_runtime.jsx)("div", {
                                        "data-text": "body",
                                        style: {
                                            fontSize: "var(--".concat(type.token, ")"),
                                            fontWeight: type.weight,
                                            lineHeight: type.leading
                                        },
                                        children: "예술을 만나는 날"
                                    }), 
                                    
                                     (0, jsx_runtime.jsxs)("p", {
                                        "data-text": "caption",
                                        className: "ds-caption",
                                        children: [ type.use, " · 행간 ", type.leading ]
                                    }) ]
                                }) ]
                            }, type.token))), 
                            
                             (0, jsx_runtime.jsx)("p", {
                                "data-text": "caption",
                                className: "ds-caption",
                                children: "본문 자간 −0.015em, 제목 자간 −0.035em. 제목과 본문의 위계는 공유 텍스트 역할에서 관리하며, 보조 정보도 최소 16px를 유지합니다."
                            }) ]
                        })), section("specimen", "직접 조합하기",   (0, jsx_runtime.jsxs)(jsx_runtime.Fragment, {
                            children: [ 
                            
                             (0, jsx_runtime.jsx /* SystemField */)(SystemPrimitives.RK, {
                                "data-text": "body",
                                id: "type-specimen-text",
                                label: "확인할 문장",
                                value: specimen,
                                maxLength: 120,
                                onChange: event => setSpecimen(event.target.value),
                                hint: "한글·영문·숫자가 섞인 실제 문장으로 확인해 보세요."
                            }), 
                            
                             (0, jsx_runtime.jsxs)("div", {
                                className: "ds-specimen",
                                style: {
                                    marginTop: 24
                                },
                                children: [ 
                                
                                 (0, jsx_runtime.jsxs)("div", {
                                    className: "ds-specimen-controls",
                                    children: [ 
                                    
                                     (0, jsx_runtime.jsx /* SystemField */)(SystemPrimitives.RK, {
                                        "data-text": "body",
                                        as: "select",
                                        label: "크기",
                                        id: "type-size",
                                        value: specimenSize,
                                        onChange: event => setSpecimenSize(Number(event.target.value)),
                                        children: [ 16, 18, 20, 24, 32, 48, 64 ].map((size =>   (0, jsx_runtime.jsxs)("option", {
                                            "data-text": "label",
                                            value: size,
                                            children: [ size, "px" ]
                                        }, size)))
                                    }), 
                                    
                                     (0, jsx_runtime.jsx /* SystemField */)(SystemPrimitives.RK, {
                                        "data-text": "body",
                                        as: "select",
                                        label: "굵기",
                                        id: "type-weight",
                                        value: specimenWeight,
                                        onChange: event => setSpecimenWeight(Number(event.target.value)),
                                        children: [ 400, 500, 600, 700 ].map((weight =>   (0, jsx_runtime.jsx)("option", {
                                            "data-text": "label",
                                            children: weight
                                        }, weight)))
                                    }) ]
                                }), 
                                
                                 (0, jsx_runtime.jsx)("div", {
                                    "data-text": "body",
                                    className: "ds-live-type",
                                    "data-type-specimen": true,
                                    style: {
                                        fontSize: specimenSize,
                                        fontWeight: specimenWeight,
                                        lineHeight: 1.7
                                    },
                                    children: specimen || "문장을 입력해 주세요."
                                }) ]
                            }) ]
                        })) ]
                    });

                  case "layout":
                     
                    return (0, jsx_runtime.jsxs)(jsx_runtime.Fragment, {
                        children: [ section("grid", "그리드와 화면",   (0, jsx_runtime.jsxs)(jsx_runtime.Fragment, {
                            children: [ 
                            
                             (0, jsx_runtime.jsxs)("p", {
                                "data-text": "body",
                                children: [ "콘텐츠는 최대 ", tokenPixels("--container"), "까지 넓게 사용합니다. 문단은 ", design_tokens /* DESIGN_TOKEN_VALUES */ .gR["--content-reading-width"], ", 입력 양식은 용도에 맞는 읽기 폭을 따로 둡니다. 카드와 목록은 남는 너비를 채우고 버튼과 레이블은 내용에 맞춰 늘어납니다." ]
                            }), 
                            
                             (0, jsx_runtime.jsx)("div", {
                                "data-text": "body",
                                className: "ds-grid-sample",
                                "aria-label": "반응형 그리드 예제",
                                children: Array.from({
                                    length: 12
                                }, ((_, index) =>   (0, jsx_runtime.jsx)("span", {
                                    "data-text": "body",
                                    children: index + 1
                                }, index)))
                            }), 
                            
                             (0, jsx_runtime.jsx)(DataTable, {
                                label: "화면 크기별 레이아웃 기준",
                                headings: [ "화면", "분할", "권장 좌우 여백", "읽기" ],
                                rows: [ [ "1280px 이상", "12열", "32–48px", "넓은 목록과 별도 읽기 폭" ], [ "768–1279px", "8열", "20–32px", "본문 중심 배치" ], [ "767px 이하", "4열", "20px", "한 열, 문서 탐색은 메뉴로" ] ]
                            }), 
                            
                             (0, jsx_runtime.jsx)(DataTable, {
                                label: "내용과 공간에 따른 크기 결정",
                                headings: [ "요소", "크기 결정", "적용 원칙" ],
                                rows: [ [ "페이지와 목록", "남는 너비 채우기", "minmax(0, 1fr)와 반응형 열" ], [ "버튼과 상태", "내용에 맞추기", "높이는 최소 48px, 긴 글은 줄바꿈" ], [ "문단과 입력", "읽기 폭 안에서 채우기", "넓은 프레임과 본문의 폭을 분리" ], [ "아이콘과 좌석", "역할에 필요한 고정 크기", "아이콘 비례와 좌석의 공간 관계 유지" ] ]
                            }) ]
                        })), section("spacing", "간격",   (0, jsx_runtime.jsxs)(jsx_runtime.Fragment, {
                            children: [ 
                            
                             (0, jsx_runtime.jsx)("p", {
                                "data-text": "body",
                                children: "4px를 기본 단위로 사용합니다. 관련 정보는 가깝게, 다른 주제는 충분히 떨어뜨립니다."
                            }), design_tokens /* SPACE_SCALE */ .Zs.map((value =>   (0, jsx_runtime.jsxs)("div", {
                                className: "ds-space-row",
                                children: [ 
                                
                                 (0, jsx_runtime.jsxs)("strong", {
                                    "data-text": "item-title",
                                    children: [ value, "px" ]
                                }), 
                                
                                 (0, jsx_runtime.jsxs)("code", {
                                    "data-text": "caption",
                                    className: "ds-token",
                                    children: [ "space-", value / 4 ]
                                }), 
                                
                                 (0, jsx_runtime.jsx)("span", {
                                    className: "ds-space-bar",
                                    style: {
                                        width: value
                                    }
                                }) ]
                            }, value))) ]
                        })), section("shape", "형태와 경계",   (0, jsx_runtime.jsxs)(jsx_runtime.Fragment, {
                            children: [ 
                            
                             (0, jsx_runtime.jsx)("p", {
                                "data-text": "body",
                                children: "일반 경계는 옅은 1px 안쪽 선입니다. 버튼·입력·패널은 inset 표면을 공유하고, 초점선도 안쪽에 표시해 크기와 배치가 바뀌지 않습니다. 곡률과 선 색은 아래 토큰에서 함께 관리합니다."
                            }), 
                            
                             (0, jsx_runtime.jsx)("div", {
                                "data-text": "body",
                                className: "ds-shape-grid",
                                children: [ [ "--radius-control", "기본 조작", "버튼·입력·작은 패널" ], [ "--radius-flow", "신청·계정", "flow 버튼·입력" ], [ "--radius-media", "미디어", "포스터·사진" ], [ "--surface-radius-panel", "공통 패널", "안내·계정·예매 표면" ], [ "--radius-banner", "배너", "히어로·영상 프레임" ], [ "--radius-dialog", "대화상자", "모달·안내 패널" ] ].map((param => {
                                    let [token, label, text] = param;
                                     
                                    return (0, jsx_runtime.jsxs)("div", {
                                        children: [ 
                                        
                                         (0, jsx_runtime.jsx)("div", {
                                            "data-text": "body",
                                            className: "ds-shape-sample",
                                            style: {
                                                borderRadius: "var(".concat(token, ")")
                                            },
                                            children: tokenPixels(token)
                                        }), 
                                        
                                         (0, jsx_runtime.jsx)("strong", {
                                            "data-text": "item-title",
                                            children: label
                                        }), 
                                        
                                         (0, jsx_runtime.jsx)("p", {
                                            "data-text": "caption",
                                            className: "ds-caption",
                                            children: text
                                        }) ]
                                    }, token);
                                }))
                            }), 
                            
                             (0, jsx_runtime.jsxs)("ul", {
                                className: "ds-rules-list",
                                children: [ 
                                
                                 (0, jsx_runtime.jsx)("li", {
                                    "data-text": "body",
                                    children: "기본 경계는 1px입니다. 입력 경계는 장식용 구분선보다 진하게 표시합니다."
                                }), 
                                
                                 (0, jsx_runtime.jsxs)("li", {
                                    "data-text": "body",
                                    children: [ "상태 알림은 캡슐, 미디어는 ", tokenPixels("--radius-media"), ", 배너는 ", tokenPixels("--radius-banner"), " 모서리를 사용합니다." ]
                                }), 
                                
                                 (0, jsx_runtime.jsx)("li", {
                                    "data-text": "body",
                                    children: "그림자는 겹쳐진 모달처럼 높이 관계를 설명할 때만 사용합니다."
                                }) ]
                            }), 
                            
                             (0, jsx_runtime.jsxs /* SystemSurface */)(SystemSurface.eM, {
                                as: "section",
                                variant: "subtle",
                                padding: "lg",
                                radius: "panel",
                                "aria-labelledby": "surface-demo-heading",
                                children: [ 
                                
                                 (0, jsx_runtime.jsx /* SystemText */)(SystemText.J, {
                                    as: "h3",
                                    variant: "item-title",
                                    id: "surface-demo-heading",
                                    children: "공통 안내 패널"
                                }), 
                                
                                 (0, jsx_runtime.jsx)("p", {
                                    "data-text": "body",
                                    children: "SystemSurface는 기존 section·aside·form의 의미를 보존하며 배경과 경계를 공통 토큰에 연결합니다."
                                }), 
                                
                                 (0, jsx_runtime.jsx /* SystemSurface */)(SystemSurface.eM, {
                                    variant: "inset",
                                    padding: "sm",
                                    radius: "compact",
                                    children:   (0, jsx_runtime.jsx)("p", {
                                        "data-text": "caption",
                                        children: "안쪽의 관련 정보는 inset 표면으로 구분합니다. 여백과 모서리는 속성으로 선택합니다."
                                    })
                                }) ]
                            }), 
                            
                             (0, jsx_runtime.jsx)("pre", {
                                "data-text": "body",
                                children:   (0, jsx_runtime.jsx)("code", {
                                    "data-text": "meta",
                                    children: '<SystemSurface as="section" variant="subtle" padding="lg" radius="panel">\n    <SystemText as="h3" variant="item-title">공통 안내 패널</SystemText>\n</SystemSurface>'
                                })
                            }) ]
                        })) ]
                    });

                  case "components":
                    var _NAV_find_items, _NAV_find;
                     
                    return (0, jsx_runtime.jsxs)(jsx_runtime.Fragment, {
                        children: [ section("registry", "전체 컴포넌트",   (0, jsx_runtime.jsx)(ComponentCatalog, {})), section("buttons", "버튼",   (0, 
                        jsx_runtime.jsxs)(jsx_runtime.Fragment, {
                            children: [ 
                            
                             (0, jsx_runtime.jsxs)("p", {
                                "data-text": "body",
                                children: [ tokenPixels("--control-size"), " 높이와 ", tokenPixels("--radius-control"), " 모서리, 16px 레이블을 기본으로 합니다. 한 영역의 주요 행동은 하나로 정하고 나머지 행동은 우선순위를 낮춥니다." ]
                            }), 
                            
                             (0, jsx_runtime.jsxs)("div", {
                                className: "ds-demo ds-demo-stack",
                                children: [ 
                                
                                 (0, jsx_runtime.jsxs)("div", {
                                    className: "ds-demo-row",
                                    children: [ 
                                    
                                     (0, jsx_runtime.jsxs /* SystemButton */)(SystemPrimitives.kR, {
                                        "data-text": "action",
                                        onClick: () => setMessage("주요 행동 버튼을 눌렀습니다."),
                                        children: [ "예매하기", 
                                        
                                         (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                                            name: "arrow",
                                            size: 20
                                        }) ]
                                    }), 
                                    
                                     (0, jsx_runtime.jsx /* SystemButton */)(SystemPrimitives.kR, {
                                        "data-text": "action",
                                        variant: "secondary",
                                        onClick: () => setMessage("보조 행동 버튼을 눌렀습니다."),
                                        children: "상세 안내"
                                    }), 
                                    
                                     (0, jsx_runtime.jsx /* SystemButton */)(SystemPrimitives.kR, {
                                        "data-text": "action",
                                        variant: "accent",
                                        onClick: () => setMessage("탐색 버튼을 눌렀습니다."),
                                        children: "일정 찾기"
                                    }), 
                                    
                                     (0, jsx_runtime.jsx /* SystemButton */)(SystemPrimitives.kR, {
                                        "data-text": "action",
                                        variant: "highlight",
                                        onClick: () => setMessage("강조 버튼을 눌렀습니다."),
                                        children: "관심 일정 확인"
                                    }) ]
                                }), 
                                
                                 (0, jsx_runtime.jsxs)("div", {
                                    className: "ds-demo-row",
                                    children: [ 
                                    
                                     (0, jsx_runtime.jsx /* SystemButton */)(SystemPrimitives.kR, {
                                        "data-text": "action",
                                        disabled: true,
                                        children: "예매 준비 중"
                                    }), 
                                    
                                     (0, jsx_runtime.jsx /* SystemButton */)(SystemPrimitives.kR, {
                                        "data-text": "action",
                                        variant: "quiet",
                                        onClick: () => setMessage("취소 버튼을 눌렀습니다."),
                                        children: "취소"
                                    }), 
                                    
                                     (0, jsx_runtime.jsx /* SystemButton */)(SystemPrimitives.kR, {
                                        "data-text": "action",
                                        context: "flow",
                                        "aria-label": "flow 버튼 규격",
                                        onClick: () => setMessage("flow 버튼의 조작을 확인했습니다."),
                                        children: "flow 버튼 규격"
                                    }) ]
                                }), 
                                
                                 (0, jsx_runtime.jsxs)("p", {
                                    "data-text": "caption",
                                    className: "ds-caption",
                                    children: [ "flow 버튼은 ", tokenPixels("--control-flow-button-size"), " 높이와", " ", tokenPixels("--radius-flow"), " 모서리를 사용합니다." ]
                                }), 
                                
                                 (0, jsx_runtime.jsxs)("div", {
                                    className: "ds-demo-row ds-overlay-controls",
                                    children: [ 
                                    
                                     (0, jsx_runtime.jsx /* SystemButton */)(SystemPrimitives.kR, {
                                        "data-text": "action",
                                        variant: "inverse",
                                        onClick: () => setMessage("이미지 위의 주요 행동입니다."),
                                        children: "상세보기"
                                    }), 
                                    
                                     (0, jsx_runtime.jsx /* SystemButton */)(SystemPrimitives.kR, {
                                        "data-text": "action",
                                        variant: "inverse-outline",
                                        onClick: () => setMessage("이미지 위의 보조 행동입니다."),
                                        children: "예매하기"
                                    }), 
                                    
                                     (0, jsx_runtime.jsxs /* SystemButton */)(SystemPrimitives.kR, {
                                        "data-text": "action",
                                        variant: "inverse-quiet",
                                        onClick: () => setMessage("히어로의 양옆 작품을 선택하는 같은 버튼입니다."),
                                        children: [ "다음 작품 ", 
                                        
                                         (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                                            name: "arrow",
                                            size: 20
                                        }) ]
                                    }) ]
                                }), 
                                
                                 (0, jsx_runtime.jsx)("p", {
                                    "data-text": "caption",
                                    className: "ds-caption",
                                    children: "inverse-quiet는 사진 위에서 테두리 없이 사용하는 반전 버튼입니다. 히어로의 인접 작품 제목에 같은 구현을 사용합니다."
                                }) ]
                            }), 
                            
                             (0, jsx_runtime.jsx)(DataTable, {
                                label: "버튼의 조작 상태",
                                headings: [ "상태", "표현", "동작" ],
                                rows: [ [ "기본", "역할에 맞는 면과 레이블", "고정된 위치" ], [ "호버", "배경·경계의 명도 변화", design_tokens /* DESIGN_TOKEN_VALUES */ .gR["--duration-feedback"] ], [ "눌림", "면의 명도 변화", "실제 누르고 있는 동안" ], [ "초점", "".concat(design_tokens /* DESIGN_TOKEN_VALUES */ .gR["--focus-width"], " 안쪽 초점선 · offset ").concat(design_tokens /* DESIGN_TOKEN_VALUES */ .gR["--focus-offset"]), "키보드에서 분명하게 · 배치 변화 없음" ], [ "비활성", "비활성 면 + 상태 문구", "실제 disabled 속성" ] ]
                            }) ]
                        })), section("cards", "콘텐츠 카드",   (0, jsx_runtime.jsxs)(jsx_runtime.Fragment, {
                            children: [ 
                            
                             (0, jsx_runtime.jsx)("p", {
                                "data-text": "body",
                                children: "포스터·제목·일정·장소는 하나의 목적지로 연결합니다. 관심 버튼은 별도의 형제 버튼으로 두고 키보드와 터치에서도 사용할 수 있게 합니다."
                            }), 
                            
                             (0, jsx_runtime.jsxs)("div", {
                                className: "ds-two-columns",
                                children: [ 
                                
                                 (0, jsx_runtime.jsx)("div", {
                                    className: "ds-card-example",
                                    children:   (0, jsx_runtime.jsx /* default */)(ProgramCard.Z, {
                                        program: catalog /* PROGRAMS */ .Lr[0]
                                    })
                                }), 
                                
                                 (0, jsx_runtime.jsxs)("div", {
                                    children: [ 
                                    
                                     (0, jsx_runtime.jsx)("h3", {
                                        "data-text": "subheading",
                                        children: "정보의 순서"
                                    }), 
                                    
                                     (0, jsx_runtime.jsxs)("ol", {
                                        className: "ds-rules-list",
                                        children: [ 
                                        
                                         (0, jsx_runtime.jsx)("li", {
                                            "data-text": "body",
                                            children: "3:4 포스터, 여백 없이 비율 유지 크롭"
                                        }), 
                                        
                                         (0, jsx_runtime.jsx)("li", {
                                            "data-text": "body",
                                            children: "분류와 상태"
                                        }), 
                                        
                                         (0, jsx_runtime.jsx)("li", {
                                            "data-text": "body",
                                            children: "20px 제목"
                                        }), 
                                        
                                         (0, jsx_runtime.jsx)("li", {
                                            "data-text": "body",
                                            children: "16px 일정과 장소"
                                        }) ]
                                    }), 
                                    
                                     (0, jsx_runtime.jsx)("h3", {
                                        "data-text": "subheading",
                                        children: "조작의 구분"
                                    }), 
                                    
                                     (0, jsx_runtime.jsx)("p", {
                                        "data-text": "caption",
                                        className: "ds-caption",
                                        children: "카드 전체는 상세 안내로 이동합니다. 관심 버튼은 저장 상태만 변경하며 저장 결과를 알림으로 안내합니다. 호버로 카드를 들어 올리지 않습니다."
                                    }) ]
                                }) ]
                            }) ]
                        })), section("fields", "입력",   (0, jsx_runtime.jsxs)(jsx_runtime.Fragment, {
                            children: [ 
                            
                             (0, jsx_runtime.jsx)("p", {
                                "data-text": "body",
                                children: "레이블은 입력값이 생겨도 사라지지 않습니다. 도움말과 오류는 필드에 연결해 이유와 다음 행동을 알려줍니다."
                            }), 
                            
                             (0, jsx_runtime.jsxs)("div", {
                                className: "ds-demo ds-demo-stack",
                                children: [ 
                                
                                 (0, jsx_runtime.jsxs)("div", {
                                    className: "ds-two-columns",
                                    children: [ 
                                    
                                     (0, jsx_runtime.jsx /* SystemField */)(SystemPrimitives.RK, {
                                        "data-text": "body",
                                        id: "demo-field-default",
                                        label: "기본 입력 규격",
                                        placeholder: "기본 조작",
                                        hint: "".concat(tokenPixels("--control-size"), " 높이 · ").concat(tokenPixels("--radius-control"), " 모서리")
                                    }), 
                                    
                                     (0, jsx_runtime.jsx /* SystemField */)(SystemPrimitives.RK, {
                                        "data-text": "body",
                                        id: "demo-field-flow",
                                        variant: "flow",
                                        label: "flow 입력 규격",
                                        placeholder: "신청·계정 조작",
                                        hint: "".concat(tokenPixels("--control-flow-field-size"), " 높이 · ").concat(tokenPixels("--radius-flow"), " 모서리")
                                    }) ]
                                }), 
                                
                                 (0, jsx_runtime.jsxs)("div", {
                                    className: "ds-two-columns",
                                    children: [ 
                                    
                                     (0, jsx_runtime.jsx /* SystemField */)(SystemPrimitives.RK, {
                                        "data-text": "body",
                                        id: "demo-name",
                                        label: "이름",
                                        placeholder: "관람하실 분의 이름",
                                        hint: "공백을 포함해 입력할 수 있습니다."
                                    }), 
                                    
                                     (0, jsx_runtime.jsx /* SystemField */)(SystemPrimitives.RK, {
                                        "data-text": "body",
                                        id: "demo-error",
                                        label: "이메일",
                                        type: "email",
                                        defaultValue: "sejong@",
                                        error: "이메일 주소를 끝까지 입력해 주세요."
                                    }) ]
                                }), 
                                
                                 (0, jsx_runtime.jsx /* SystemField */)(SystemPrimitives.RK, {
                                    "data-text": "body",
                                    id: "demo-disabled",
                                    label: "예매 번호",
                                    value: "예매 후 확인할 수 있습니다",
                                    disabled: true,
                                    readOnly: true
                                }), 
                                
                                 (0, jsx_runtime.jsx /* SystemCheckbox */)(SystemPrimitives.U1, {
                                    "data-text": "label",
                                    label: "선택한 관람 정보를 확인했습니다."
                                }) ]
                            }) ]
                        })), section("navigation", "탭과 펼침",   (0, jsx_runtime.jsxs)(jsx_runtime.Fragment, {
                            children: [ 
                            
                             (0, jsx_runtime.jsx)("p", {
                                "data-text": "body",
                                children: "같은 수준의 콘텐츠는 탭으로, 선택해서 읽는 상세 설명은 펼침으로 묶습니다. 탭은 방향키와 Home·End로 이동할 수 있습니다."
                            }), 
                            
                             (0, jsx_runtime.jsxs)("div", {
                                className: "ds-demo",
                                children: [ 
                                
                                 (0, jsx_runtime.jsx /* SystemTabs */)(SystemNavigation.T, {
                                    idPrefix: "sample",
                                    "aria-label": "프로그램 분류 예제",
                                    value: String(demoTab),
                                    onValueChange: value => setDemoTab(Number(value)),
                                    items: sampleTabs.map(((label, index) => ({
                                        id: String(index),
                                        label: label,
                                        content: [ "공연명, 날짜와 장소를 같은 순서로 안내합니다.", "전시 기간과 운영 시간을 함께 안내합니다.", "수강 대상, 교육 일시와 신청 기간을 함께 안내합니다." ][index]
                                    })))
                                }), 
                                
                                 (0, jsx_runtime.jsx /* SystemDisclosure */)(SystemNavigation.f, {
                                    summary: "관람 안내는 어떻게 표현하나요?",
                                    children:   (0, jsx_runtime.jsx)("p", {
                                        "data-text": "body",
                                        children: "제한 사항과 준비할 내용을 짧은 문장으로 먼저 안내하고, 필요한 상세 내용만 펼쳐서 읽도록 합니다."
                                    })
                                }) ]
                            }), 
                            
                             (0, jsx_runtime.jsx)("h3", {
                                "data-text": "subheading",
                                children: "메뉴 폭과 줄바꿈"
                            }), 
                            
                             (0, jsx_runtime.jsx)("p", {
                                "data-text": "body",
                                children: "SystemControlGroup은 항목의 픽셀 폭을 정하지 않고 전체 너비에서 간격을 뺀 나머지를 퍼센트로 나눕니다. 기본값은 768px 미만 2열, 768px부터 3열, 1024px부터 6열입니다. 항목이 적으면 실제 개수까지만 나누고 마지막 줄도 남는 폭을 채웁니다. 같은 행의 높이는 가장 긴 문구에 맞추며, 글자는 16px 이상과 조작 높이 48px 이상을 유지합니다."
                            }), 
                            
                             (0, jsx_runtime.jsx)("div", {
                                className: "ds-demo",
                                children:   (0, jsx_runtime.jsx /* SystemControlGroup */)(SystemControlGroup.L, {
                                    as: "nav",
                                    id: "demo-visit-navigation",
                                    "aria-label": "반응형 이용안내 메뉴 예제",
                                    children: (_NAV_find = catalog /* NAV */ .w$.find((group => group.id === "visit"))) === null || _NAV_find === void 0 ? void 0 : (_NAV_find_items = _NAV_find.items) === null || _NAV_find_items === void 0 ? void 0 : _NAV_find_items.map((param => {
                                        let [label, href] = param;
                                         
                                        return (0, jsx_runtime.jsx)(SystemPrimitives.SystemLink, {
                                            href: href,
                                            variant: "secondary",
                                            children: label
                                        }, href);
                                    }))
                                })
                            }), 
                            
                             (0, jsx_runtime.jsx)(DataTable, {
                                label: "SystemControlGroup 비율 규격",
                                headings: [ "속성", "기본값", "역할" ],
                                rows: [ [ "as", "div", "nav · div · section · ul · ol의 의미 보존" ], [ "columns", "compact: 2 / medium: 3 / wide: 6", "화면 구간마다 1–6열 지정" ], [ "maxColumns", "6", "항목 수와 함께 최대 열 수 제한" ], [ "항목 너비", "(100% − 간격 × (열 수 − 1)) ÷ 열 수", "부모 너비에 반응하며 줄바꿈" ] ]
                            }) ]
                        })), section("liquid-glass", "리퀴드 글래스",   (0, jsx_runtime.jsxs)(jsx_runtime.Fragment, {
                            children: [ 
                            
                             (0, jsx_runtime.jsxs)("p", {
                                "data-text": "body",
                                children: [ 
                                
                                 (0, jsx_runtime.jsx)("code", {
                                    "data-text": "caption",
                                    className: "ds-token",
                                    children: "LiquidGlass"
                                }), "는 실제 배경을 굴절시키는 공통 표면 컴포넌트입니다. 불투명한 중심과 맑게 굴절되는 가장자리를 나누고, 반사광과 안쪽 음영으로 유리의 두께를 표현합니다. 안에 넣은 글자와 버튼은 선명하게 유지합니다." ]
                            }), 
                            
                             (0, jsx_runtime.jsx)(LiquidGlassDemo, {
                                onCopy: code => copyValue(code, "리퀴드 글래스 코드"),
                                copied: copied === "리퀴드 글래스 코드"
                            }), 
                            
                             (0, jsx_runtime.jsx)(DataTable, {
                                label: "LiquidGlass 컴포넌트 속성",
                                headings: [ "속성", "기본값", "역할" ],
                                rows: [ [ "variant", "surface", "surface · 기본 표면 / drawer · 서랍 / hero · 히어로 / white · 밝은 알림 / black · 어두운 알림" ], [ "opacity", design_tokens /* GLASS_MATERIALS */ .ot.surface.opacity, "흰 유리의 불투명도 · 0–1" ], [ "refraction", design_tokens /* GLASS_MATERIALS */ .ot.surface.refraction, "굴절 강도 · 0–120" ], [ "blur", design_tokens /* GLASS_MATERIALS */ .ot.surface.blur, "중심부 배경 흐림 · 0–40px" ], [ "thickness", design_tokens /* GLASS_MATERIALS */ .ot.surface.thickness, "굴절되는 가장자리의 두께 · 1–64px" ], [ "children / ref / HTML 속성", "기본 div와 동일", "콘텐츠·초점·위치·이벤트 연결" ] ]
                            }), 
                            
                             (0, jsx_runtime.jsx)(DataTable, {
                                label: "리퀴드 글래스 재질 베리언트",
                                headings: [ "베리언트", "불투명도", "굴절", "흐림", "두께" ],
                                rows: Object.entries(design_tokens /* GLASS_MATERIALS */ .ot).map((param => {
                                    let [variant, material] = param;
                                    return [ variant, "".concat(Math.round(material.opacity * 100), "%"), material.refraction, "".concat(material.blur, "px"), "".concat(material.thickness, "px") ];
                                }))
                            }), 
                            
                             (0, jsx_runtime.jsx)("p", {
                                "data-text": "caption",
                                className: "ds-caption",
                                children: "기본값은 디자인 토큰을 따릅니다. 속성을 지정하면 해당 표면만 바뀌며, 전체 메뉴도 같은 컴포넌트를 사용합니다. 고대비·투명도 감소 설정에서는 불투명한 흰 표면으로 전환합니다."
                            }) ]
                        })), section("floating-menu", "떠 있는 유리 메뉴",   (0, jsx_runtime.jsxs)(jsx_runtime.Fragment, {
                            children: [ 
                            
                             (0, jsx_runtime.jsxs)("p", {
                                "data-text": "body",
                                children: [ 
                                
                                 (0, jsx_runtime.jsx)("code", {
                                    "data-text": "caption",
                                    className: "ds-token",
                                    children: "FloatingPanel"
                                }), "은", " ", 
                                
                                 (0, jsx_runtime.jsx)("code", {
                                    "data-text": "caption",
                                    className: "ds-token",
                                    children: "LiquidGlass"
                                }), "를 사용하는 공통 목록 창입니다. 위치·드래그·초점·등장과 퇴장을 담당하며,", " ", 
                                
                                 (0, jsx_runtime.jsx)("code", {
                                    "data-text": "caption",
                                    className: "ds-token",
                                    children: "FloatingMenu"
                                }), "는 그 안에 실제 사이트의 탐색 목록을 넣는 컴포넌트입니다." ]
                            }), 
                            
                             (0, jsx_runtime.jsx)("p", {
                                "data-text": "body",
                                children: "전체 메뉴는 페이지를 가리는 흰 덮개 없이 독립된 창으로 뜹니다. 기존 흰색과 검정의 투명도, 배경의 흐림, 둥근 가장자리의 굴절과 반사를 겹쳐 깊이를 표현합니다. 글자는 굴절시키지 않습니다."
                            }), 
                            
                             (0, jsx_runtime.jsxs)("div", {
                                className: "ds-demo",
                                children: [ 
                                
                                 (0, jsx_runtime.jsxs /* SystemButton */)(SystemPrimitives.kR, {
                                    "data-text": "action",
                                    ref: floatingMenuTrigger,
                                    "aria-haspopup": "dialog",
                                    "aria-expanded": floatingMenuOpen,
                                    "aria-controls": "menu-dialog",
                                    onClick: () => setFloatingMenuOpen(!floatingMenuOpen),
                                    children: [ "전체 메뉴 열기 ", 
                                    
                                     (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                                        name: "menu",
                                        size: 24
                                    }) ]
                                }), 
                                
                                 (0, jsx_runtime.jsx /* default */)(FloatingMenu.Z, {
                                    open: floatingMenuOpen,
                                    onClose: closeFloatingMenu,
                                    returnFocus: floatingMenuTrigger,
                                    position: floatingMenuPosition
                                }) ]
                            }), 
                            
                             (0, jsx_runtime.jsx)("h3", {
                                "data-text": "subheading",
                                children: "버튼에서 펼쳐지고, 버튼으로 돌아갑니다"
                            }), 
                            
                             (0, jsx_runtime.jsx)("p", {
                                "data-text": "body",
                                children: "WebGL의 32 × 22 메시가 실제 목록 텍스처를 휘며 펼쳐집니다. 버튼에서 먼 모서리가 조금 늦게 따라오고, 마지막에는 탄성으로 자리 잡습니다. 닫기는 현재 위치에서 실제 호출 버튼으로 되돌아가는 역방향 동작입니다. 도중에 다시 눌러도 위치와 속도를 이어갑니다."
                            }), 
                            
                             (0, jsx_runtime.jsx)("h3", {
                                "data-text": "subheading",
                                children: "작은 화면에서는 왼쪽 서랍으로"
                            }), 
                            
                             (0, jsx_runtime.jsx)("p", {
                                "data-text": "body",
                                children: "700px 이하에서 전체 메뉴는 왼쪽 벽에 붙는 세로 목록으로 바뀝니다. 그룹을 펼쳐 탐색하고, 창 안에서 스크롤합니다. 이동 버튼과 자유 드래그는 이 화면에서 제공하지 않습니다. 같은 WebGL 탄성이 왼쪽에서 펼쳐지고 다시 벽 안으로 들어가며, drawer 재질의 더 높은 불투명도와 강한 굴절로 목록의 가독성을 지킵니다."
                            }), 
                            
                             (0, jsx_runtime.jsx)(DataTable, {
                                label: "FloatingPanel 컴포넌트 속성",
                                headings: [ "속성", "역할" ],
                                rows: [ [ "variant", "floating · 자유 이동 / drawer · 왼쪽 고정 서랍" ], [ "open / onClose", "열림을 제어하며, 퇴장이 끝날 때까지 창을 유지합니다" ], [ "anchorRef", "등장과 복귀의 기준이 되는 버튼 ref" ], [ "title / eyebrow / closeLabel / moveLabel", "창 제목·맥락·닫기와 이동 버튼의 접근 가능한 이름" ], [ "position", "드래그한 위치를 닫았다 열어도 유지하는 ref · 선택" ], [ "children", "스크롤할 목록이나 상세 콘텐츠" ], [ "className / id", "표면 크기와 식별자" ] ]
                            }), 
                            
                             (0, jsx_runtime.jsx)("pre", {
                                "data-text": "body",
                                className: "ds-code-block",
                                children:   (0, jsx_runtime.jsx)("code", {
                                    "data-text": "meta",
                                    children: 'import FloatingPanel from "@/components/FloatingPanel";\n\n<FloatingPanel\n    open={open}\n    onClose={() => setOpen(false)}\n    anchorRef={buttonRef}\n    title="목록"\n>\n    <nav className="glass-menu-content" aria-label="목록">\n        <a href="/v5/programs/">프로그램</a>\n    </nav>\n</FloatingPanel>'
                                })
                            }), 
                            
                             (0, jsx_runtime.jsx)("p", {
                                "data-text": "caption",
                                className: "ds-caption",
                                children: "이동 중에는 WebGL이 시각적 전환을 담당하고, 정착하면 실제 HTML 링크와 버튼을 사용합니다. 모션 감소 설정에서는 짧은 페이드만 사용하며, WebGL을 사용할 수 없어도 창의 조작은 유지합니다."
                            }), 
                            
                             (0, jsx_runtime.jsx)(DataTable, {
                                label: "떠 있는 메뉴의 표면과 위계",
                                headings: [ "역할", "기준", "토큰" ],
                                rows: [ [ "창 제목", "".concat(design_tokens /* DESIGN_TOKEN_VALUES */ .gR["--text-title"], " · ").concat(design_tokens /* DESIGN_TOKEN_VALUES */ .gR["--weight-heading"]), "--text-title" ], [ "메뉴 그룹", "".concat(design_tokens /* DESIGN_TOKEN_VALUES */ .gR["--text-menu-group"], " · ").concat(design_tokens /* DESIGN_TOKEN_VALUES */ .gR["--weight-heading"]), "--text-menu-group" ], [ "탐색 링크", "".concat(tokenPixels("--text-menu-link"), " · ").concat(design_tokens /* DESIGN_TOKEN_VALUES */ .gR["--weight-label"], " · 조작 높이 ").concat(tokenPixels("--control-size")), "--text-menu-link" ], [ "설명·개인 서비스", "".concat(tokenPixels("--text-sm"), " · ").concat(design_tokens /* DESIGN_TOKEN_VALUES */ .gR["--weight-body"], "–").concat(design_tokens /* DESIGN_TOKEN_VALUES */ .gR["--weight-label"]), "--text-sm" ], [ "모서리", tokenPixels("--radius-dialog"), "--radius-dialog" ], [ "유리 바탕", "흰색 ".concat(Math.round(design_tokens /* GLASS_MATERIALS */ .ot.surface.opacity * 100), "% + 방향성 반사광"), "--glass-opacity / --glass-tint" ], [ "굴절·두께", "굴절 ".concat(design_tokens /* GLASS_MATERIALS */ .ot.surface.refraction, " · 가장자리 ").concat(design_tokens /* GLASS_MATERIALS */ .ot.surface.thickness, "px"), "--glass-refraction / --glass-thickness" ], [ "배경 흐림", "".concat(design_tokens /* GLASS_MATERIALS */ .ot.surface.blur, "px · 채도 ").concat(design_tokens /* DESIGN_TOKEN_VALUES */ .gR["--glass-saturation"], "배"), "--glass-blur / --glass-saturation" ], [ "테두리·그림자", design_tokens /* DESIGN_TOKEN_VALUES */ .gR["--glass-edge"], "--glass-edge / --glass-shadow" ] ]
                            }), 
                            
                             (0, jsx_runtime.jsxs)("ul", {
                                className: "ds-rules-list",
                                children: [ 
                                
                                 (0, jsx_runtime.jsx)("li", {
                                    "data-text": "body",
                                    children: "마우스로 글자와 여백을 잡아 옮깁니다. 드래그한 링크는 열리지 않습니다."
                                }), 
                                
                                 (0, jsx_runtime.jsx)("li", {
                                    "data-text": "body",
                                    children: "터치에서는 제목을 잡아 옮깁니다. 본문은 세로로 스크롤하며, 이동 버튼을 켜면 본문에서도 창을 옮길 수 있습니다."
                                }), 
                                
                                 (0, jsx_runtime.jsx)("li", {
                                    "data-text": "body",
                                    children: "이동 버튼에 초점을 두고 방향키로 16px, Shift와 함께 4px씩 옮깁니다. Home은 처음 위치, Escape는 닫기입니다."
                                }), 
                                
                                 (0, jsx_runtime.jsx)("li", {
                                    "data-text": "body",
                                    children: "배경 페이지도 사용할 수 있습니다. 화면 크기가 바뀌어도 닫기와 탐색을 화면 안에 유지합니다."
                                }), 
                                
                                 (0, jsx_runtime.jsx)("li", {
                                    "data-text": "body",
                                    children: "투명도 감소·고대비 설정에서는 흰 불투명 표면으로 전환합니다."
                                }) ]
                            }) ]
                        })), section("small-notification", "알림소형모달",   (0, jsx_runtime.jsxs)(jsx_runtime.Fragment, {
                            children: [ 
                            
                             (0, jsx_runtime.jsx)("p", {
                                "data-text": "body",
                                children: "v4의 둥근 하단 알림을 공통 컴포넌트로 등록했습니다. 관심 등록·해제처럼 짧은 결과를 전달하며, 배경을 가리거나 초점을 옮기지 않습니다. 3.5초 뒤 부드럽게 사라지고, 새 알림은 같은 캡슐 안에서 갱신됩니다."
                            }), 
                            
                             (0, jsx_runtime.jsxs)("div", {
                                className: "ds-demo-actions",
                                children: [ 
                                
                                 (0, jsx_runtime.jsx /* SystemButton */)(SystemPrimitives.kR, {
                                    "data-text": "action",
                                    onClick: () => (0, SmallNotificationModal /* showSmallNotification */ .VX)("관심 프로그램에 저장했어요."),
                                    children: "알림소형모달 보기"
                                }), 
                                
                                 (0, jsx_runtime.jsx /* SystemButton */)(SystemPrimitives.kR, {
                                    "data-text": "action",
                                    variant: "quiet",
                                    onClick: () => (0, SmallNotificationModal /* showSmallNotification */ .VX)("관심 프로그램에서 삭제했어요."),
                                    children: "다음 알림으로 교체"
                                }) ]
                            }), 
                            
                             (0, jsx_runtime.jsx)(DataTable, {
                                label: "알림소형모달 컴포넌트 속성",
                                headings: [ "속성", "역할" ],
                                rows: [ [ "open / message", "표시 상태와 안내 문장" ], [ "id", "여러 표면을 구분하는 식별자 · 선택" ], [ "SmallNotificationModalHost", "사이트에 한 번 등록하는 알림 호스트" ], [ "showSmallNotification(message)", "어느 화면에서든 알림을 표시" ], [ "duration", "호스트의 표시 시간 · 기본 3500ms" ] ]
                            }), 
                            
                             (0, jsx_runtime.jsx)("pre", {
                                "data-text": "body",
                                className: "ds-code-block",
                                children:   (0, jsx_runtime.jsx)("code", {
                                    "data-text": "meta",
                                    children: 'import SmallNotificationModal, {\n    showSmallNotification\n} from "@/components/SmallNotificationModal";\n\nshowSmallNotification("관심 프로그램에 저장했어요.");\n\n// 직접 상태를 제어하는 경우\n<SmallNotificationModal open={visible} message="저장했어요." />'
                                })
                            }), 
                            
                             (0, jsx_runtime.jsx)("p", {
                                "data-text": "caption",
                                className: "ds-caption",
                                children: "양끝은 완전한 캡슐이며, 글자는 최소 16px로 유지합니다. 모션 감소 설정에서는 위치 이동 없이 페이드만 사용합니다."
                            }) ]
                        })), section("feedback", "상태와 대화상자",   (0, jsx_runtime.jsxs)(jsx_runtime.Fragment, {
                            children: [ 
                            
                             (0, jsx_runtime.jsx)("p", {
                                "data-text": "body",
                                children: "SystemNotice는 LiquidGlass의 white 베리언트를 조합합니다. default·flow 레이아웃과 status·error 상태는 같은 흰 유리 재질을 사용합니다."
                            }), 
                            
                             (0, jsx_runtime.jsxs)("div", {
                                className: "ds-demo-stack",
                                children: [ 
                                
                                 (0, jsx_runtime.jsxs)("div", {
                                    className: "ds-demo-row",
                                    children: [ 
                                    
                                     (0, jsx_runtime.jsx /* SystemBadge */)(SystemPrimitives.WT, {
                                        "data-text": "meta",
                                        children: "안내"
                                    }), 
                                    
                                     (0, jsx_runtime.jsx /* SystemBadge */)(SystemPrimitives.WT, {
                                        "data-text": "meta",
                                        tone: "highlight",
                                        children: "추천"
                                    }), 
                                    
                                     (0, jsx_runtime.jsx /* SystemBadge */)(SystemPrimitives.WT, {
                                        "data-text": "meta",
                                        tone: "info",
                                        children: "접근성 제공"
                                    }) ]
                                }), 
                                
                                 (0, jsx_runtime.jsx /* SystemNotice */)(SystemPrimitives.F0, {
                                    "data-text": "body",
                                    title: "관심 프로그램에 저장했습니다.",
                                    children: "저장한 프로그램은 마이페이지에서 다시 확인할 수 있습니다."
                                }), 
                                
                                 (0, jsx_runtime.jsx /* SystemNotice */)(SystemPrimitives.F0, {
                                    "data-text": "body",
                                    title: "입력 내용을 확인해 주세요.",
                                    error: true,
                                    children: "이메일 주소를 입력하면 다음 단계로 이동할 수 있습니다."
                                }) ]
                            }), 
                            
                             (0, jsx_runtime.jsx)("h3", {
                                "data-text": "subheading",
                                children: "확인이 필요한 선택"
                            }), 
                            
                             (0, jsx_runtime.jsx)("p", {
                                "data-text": "caption",
                                className: "ds-caption",
                                children: "모달은 배경을 잠그고, Esc로 닫은 뒤 열었던 버튼으로 초점을 돌려줍니다."
                            }), 
                            
                             (0, jsx_runtime.jsx /* SystemButton */)(SystemPrimitives.kR, {
                                "data-text": "action",
                                variant: "secondary",
                                onClick: () => {
                                    var _demoDialog_current;
                                    return (_demoDialog_current = demoDialog.current) === null || _demoDialog_current === void 0 ? void 0 : _demoDialog_current.showModal();
                                },
                                children: "날짜 선택 대화상자 열기"
                            }) ]
                        })) ]
                    });

                  case "motion":
                     
                    return (0, jsx_runtime.jsxs)(jsx_runtime.Fragment, {
                        children: [ section("timing", "시간과 이징",   (0, jsx_runtime.jsxs)(jsx_runtime.Fragment, {
                            children: [ 
                            
                             (0, jsx_runtime.jsx)("p", {
                                "data-text": "body",
                                children: "조작의 결과는 짧게, 화면의 관계는 조금 여유 있게 보여줍니다. 일반 버튼은 위치를 움직이지 않고 색과 명도로 응답합니다."
                            }), 
                            
                             (0, jsx_runtime.jsx)(DataTable, {
                                label: "모션 시간과 역할",
                                headings: [ "역할", "토큰", "값", "사용" ],
                                rows: [ [ "즉각적인 반응", "--duration-fast", design_tokens /* DESIGN_TOKEN_VALUES */ .gR["--duration-fast"], "작은 상태 변화" ], [ "조작 피드백", "--duration-feedback", design_tokens /* DESIGN_TOKEN_VALUES */ .gR["--duration-feedback"], "버튼·레이블" ], [ "패널 전환", "--duration-panel", design_tokens /* DESIGN_TOKEN_VALUES */ .gR["--duration-panel"], "모달·펼침" ], [ "기본 곡선", "--ease-standard", design_tokens /* DESIGN_TOKEN_VALUES */ .gR["--ease-standard"], "빠르게 반응하고 부드럽게 종료" ] ]
                            }) ]
                        })), section("scroll", "글자별 스크롤 등장 · Deprecated",   (0, jsx_runtime.jsxs)(jsx_runtime.Fragment, {
                            children: [ 
                            
                             (0, jsx_runtime.jsx)("p", {
                                "data-text": "body",
                                children: "Deprecated — 홈에서 사용을 종료한 이전 글자 모션입니다. 실행 예제와 구현은 활성 컴포넌트에서 제거했습니다. 현재 홈의 ‘관람 예약’은 스크롤 위치와 관계없이 읽을 수 있는 정적 공통 제목을 사용합니다."
                            }), 
                            
                             (0, jsx_runtime.jsx /* SystemNotice */)(SystemPrimitives.F0, {
                                "data-lifecycle": "deprecated",
                                title: "BookingInvitation · Deprecated",
                                children: "이전 구현은 Git 이력에서 확인할 수 있습니다. 신규 화면은 SystemText의 정적 제목을 사용합니다."
                            }), 
                            
                             (0, jsx_runtime.jsx)("div", {
                                className: "ds-inline-links",
                                children:   (0, jsx_runtime.jsxs)(api_link["default"], {
                                    "data-text": "action",
                                    href: "/",
                                    children: [ "홈의 정적 관람 예약 제목 보기", 
                                    
                                     (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                                        name: "diagonal",
                                        size: 20
                                    }) ]
                                })
                            }) ]
                        })), section("quick-menu", "원형 퀵메뉴",   (0, jsx_runtime.jsxs)(jsx_runtime.Fragment, {
                            children: [ 
                            
                             (0, jsx_runtime.jsx)("p", {
                                "data-text": "body",
                                children: "브랜드 노랑과 전용 초록이 원 안에서 천천히 흐릅니다. 털이나 입자 없이 매끈한 표면으로 표현하고, 포인터와 회전 방향에 맞춰 물결이 부드럽게 반응합니다."
                            }), 
                            
                             (0, jsx_runtime.jsx)("div", {
                                className: "ds-quick-menu",
                                children:   (0, jsx_runtime.jsx /* default */)(VioletQuickMenu.Z, {
                                    placement: "inline",
                                    items: inlineMenuItems
                                })
                            }), 
                            
                             (0, jsx_runtime.jsxs)("ul", {
                                className: "ds-rules-list",
                                children: [ 
                                
                                 (0, jsx_runtime.jsx)("li", {
                                    "data-text": "body",
                                    children: "클릭·터치·키보드로 열고, 방향키로 항목을 고른 뒤 Enter로 이동합니다."
                                }), 
                                
                                 (0, jsx_runtime.jsx)("li", {
                                    "data-text": "body",
                                    children: "원을 돌려 놓으면 선택 위치에 정렬됩니다. 놓기만 해서는 이동하지 않습니다."
                                }), 
                                
                                 (0, jsx_runtime.jsx)("li", {
                                    "data-text": "body",
                                    children: "색상은 QUICK_MENU_MATERIAL의 노랑·레몬·초록·민트를 사용합니다. 기본 흐름은 14초 주기이며 화면 밖에서는 그리기를 멈춥니다."
                                }), 
                                
                                 (0, jsx_runtime.jsx)("li", {
                                    "data-text": "body",
                                    children: "동작 줄이기에서는 장식 움직임을 멈추고 탐색 기능은 유지합니다."
                                }) ]
                            }) ]
                        })) ]
                    });

                  case "accessibility":
                     
                    return (0, jsx_runtime.jsxs)(jsx_runtime.Fragment, {
                        children: [ section("reading", "읽기",   (0, jsx_runtime.jsxs)(jsx_runtime.Fragment, {
                            children: [ 
                            
                             (0, jsx_runtime.jsx)("p", {
                                "data-text": "body",
                                children: "일반 정보는 16px 이상으로 읽습니다. 이미지 안의 글자와 실제 UI 레이블을 구분하고, 중요한 안내를 작거나 흐리게 숨기지 않습니다."
                            }), 
                            
                             (0, jsx_runtime.jsxs)("ul", {
                                className: "ds-rules-list",
                                children: [ 
                                
                                 (0, jsx_runtime.jsx)("li", {
                                    "data-text": "body",
                                    children: "제목은 h1 → h2 → h3 순서로 구성합니다."
                                }), 
                                
                                 (0, jsx_runtime.jsx)("li", {
                                    "data-text": "body",
                                    children: "본문과 배경의 대비는 4.5:1 이상으로 확인합니다."
                                }), 
                                
                                 (0, jsx_runtime.jsx)("li", {
                                    "data-text": "body",
                                    children: "화면을 확대해도 본문은 줄바꿈하고, 표는 이름이 있는 내부 영역에서 스크롤합니다."
                                }), 
                                
                                 (0, jsx_runtime.jsx)("li", {
                                    "data-text": "body",
                                    children: "사진에는 목적에 맞는 대체 설명을 제공하고 장식 아이콘은 숨깁니다."
                                }) ]
                            }) ]
                        })), section("interaction", "조작",   (0, jsx_runtime.jsxs)(jsx_runtime.Fragment, {
                            children: [ 
                            
                             (0, jsx_runtime.jsxs)("div", {
                                className: "ds-demo-row",
                                children: [ 
                                
                                 (0, jsx_runtime.jsx /* SystemButton */)(SystemPrimitives.kR, {
                                    "data-text": "action",
                                    variant: "secondary",
                                    children: "Tab으로 초점 확인"
                                }), 
                                
                                 (0, jsx_runtime.jsx /* SystemButton */)(SystemPrimitives.kR, {
                                    "data-text": "action",
                                    variant: "primary",
                                    children: "Enter로 실행"
                                }) ]
                            }), 
                            
                             (0, jsx_runtime.jsxs)("ul", {
                                className: "ds-rules-list",
                                children: [ 
                                
                                 (0, jsx_runtime.jsx)("li", {
                                    "data-text": "body",
                                    children: "일반 조작 영역은 48px를 기본으로 확보합니다."
                                }), 
                                
                                 (0, jsx_runtime.jsx)("li", {
                                    "data-text": "body",
                                    children: "초점은 3px 안쪽 선과 -3px offset으로 표시합니다."
                                }), 
                                
                                 (0, jsx_runtime.jsx)("li", {
                                    "data-text": "body",
                                    children: "열리는 메뉴와 모달은 닫기·Esc·초점 복귀를 함께 제공합니다."
                                }), 
                                
                                 (0, jsx_runtime.jsx)("li", {
                                    "data-text": "body",
                                    children: "모션 감소 설정을 따르고, 스크롤 모션은 입력 없이 계속 재생하지 않습니다."
                                }), 
                                
                                 (0, jsx_runtime.jsx)("li", {
                                    "data-text": "body",
                                    children: "색만으로 상태를 표현하지 않고 텍스트·아이콘·aria 속성을 함께 갱신합니다."
                                }) ]
                            }) ]
                        })), section("writing", "문장과 상태 표현",   (0, jsx_runtime.jsx)(jsx_runtime.Fragment, {
                            children:   (0, jsx_runtime.jsx)(DataTable, {
                                label: "안내 문장과 상태 표현 기준",
                                headings: [ "상황", "사용할 문장", "기준" ],
                                rows: [ [ "행동", "예매하기 · 일정 찾기", "행동과 대상을 구체적으로" ], [ "입력 오류", "이메일 주소를 끝까지 입력해 주세요.", "원인과 해결 행동을 함께" ], [ "빈 결과", "조건에 맞는 공연이 없습니다. 날짜를 바꿔보세요.", "현재 상황과 다음 선택" ], [ "저장 완료", "예매 내용을 저장했습니다. 마이페이지에서 확인할 수 있습니다.", "실제 처리 범위를 정확하게" ] ]
                            })
                        })) ]
                    });

                  case "resources":
                     
                    return (0, jsx_runtime.jsxs)(jsx_runtime.Fragment, {
                        children: [ section("tokens", "토큰 내보내기",   (0, jsx_runtime.jsxs)(jsx_runtime.Fragment, {
                            children: [ 
                            
                             (0, jsx_runtime.jsx)("p", {
                                "data-text": "body",
                                children: "컬러·타이포그래피·조작 크기·모션의 기준을 CSS 변수로 적용합니다. 실제 제품의 원본은 tokens.css와 defaults.css입니다."
                            }), 
                            
                             (0, jsx_runtime.jsxs)("div", {
                                className: "ds-demo-row ds-no-print",
                                children: [ 
                                
                                 (0, jsx_runtime.jsxs /* SystemButton */)(SystemPrimitives.kR, {
                                    "data-text": "action",
                                    onClick: downloadTokens,
                                    children: [ 
                                    
                                     (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                                        name: "download",
                                        size: 20
                                    }), "토큰 CSS 다운로드" ]
                                }), 
                                
                                 (0, jsx_runtime.jsx /* SystemButton */)(SystemPrimitives.kR, {
                                    "data-text": "action",
                                    variant: "secondary",
                                    onClick: () => copyValue(designTokensCss(), "디자인 토큰"),
                                    children: copied === "디자인 토큰" ? "복사됨" : "전체 코드 복사"
                                }) ]
                            }), 
                            
                             (0, jsx_runtime.jsx)("pre", {
                                "data-text": "body",
                                className: "ds-code-block",
                                children:   (0, jsx_runtime.jsx)("code", {
                                    "data-text": "meta",
                                    children: designTokensCss()
                                })
                            }) ]
                        })), section("assets", "브랜드 자료",   (0, jsx_runtime.jsxs)(jsx_runtime.Fragment, {
                            children: [ 
                            
                             (0, jsx_runtime.jsx)("p", {
                                "data-text": "body",
                                children: "원본 로고와 설치된 서체를 사용합니다. 로고는 생성하거나 비율을 바꾸지 않습니다."
                            }), 
                            
                             (0, jsx_runtime.jsxs)("div", {
                                className: "ds-inline-links",
                                children: [ 
                                
                                 (0, jsx_runtime.jsxs)("a", {
                                    "data-text": "action",
                                    href: "/v5/assets/images/sejong-wordmark.png",
                                    download: true,
                                    children: [ "워드마크 PNG", 
                                    
                                     (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                                        name: "download",
                                        size: 20
                                    }) ]
                                }), 
                                
                                 (0, jsx_runtime.jsxs)("a", {
                                    "data-text": "action",
                                    href: "/v5/assets/images/sejong-official-symbol.png",
                                    download: true,
                                    children: [ "심벌 PNG", 
                                    
                                     (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                                        name: "download",
                                        size: 20
                                    }) ]
                                }), 
                                
                                 (0, jsx_runtime.jsxs)("a", {
                                    "data-text": "action",
                                    href: "/v5/assets/fonts/README.md",
                                    children: [ "서체와 라이선스 안내", 
                                    
                                     (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                                        name: "diagonal",
                                        size: 20
                                    }) ]
                                }) ]
                            }), 
                            
                             (0, jsx_runtime.jsx)("p", {
                                "data-text": "caption",
                                className: "ds-caption",
                                children: "워드마크는 세종문화회관의 기존 공식 소스에서 추출한 파일입니다. 재사용 시 원 권리자의 사용 조건을 확인합니다."
                            }), 
                            
                             (0, jsx_runtime.jsx /* SystemButton */)(SystemPrimitives.kR, {
                                "data-text": "action",
                                variant: "secondary",
                                className: "ds-no-print",
                                onClick: () => window.print(),
                                children: "현재 문서 인쇄"
                            }) ]
                        })), section("references", "참고 기준",   (0, jsx_runtime.jsx)(jsx_runtime.Fragment, {
                            children:   (0, jsx_runtime.jsxs)("ul", {
                                className: "ds-rules-list",
                                children: [ 
                                
                                 (0, jsx_runtime.jsx)("li", {
                                    "data-text": "body",
                                    children:   (0, jsx_runtime.jsx)("a", {
                                        "data-text": "action",
                                        href: "https://www.sejongpac.or.kr/portal/main/main.do",
                                        target: "_blank",
                                        rel: "noreferrer",
                                        children: "세종문화회관 원본 브랜드와 서비스 (새 창)"
                                    })
                                }), 
                                
                                 (0, jsx_runtime.jsx)("li", {
                                    "data-text": "body",
                                    children:   (0, jsx_runtime.jsx)("a", {
                                        "data-text": "action",
                                        href: "https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html",
                                        target: "_blank",
                                        rel: "noreferrer",
                                        children: "W3C WCAG 2.2 명도 대비 기준 (새 창)"
                                    })
                                }), 
                                
                                 (0, jsx_runtime.jsx)("li", {
                                    "data-text": "body",
                                    children: "사용자가 제시한 문서형 가이드의 분류·본문·목차 구조를 v5의 정보와 컬러로 구성했습니다."
                                }) ]
                            })
                        })) ]
                    });
                }
            };
             
            return (0, jsx_runtime.jsxs)("div", {
                className: "design-system-page",
                children: [ 
                
                 (0, jsx_runtime.jsxs)("header", {
                    className: "ds-doc-header",
                    children: [ 
                    
                     (0, jsx_runtime.jsxs)(api_link["default"], {
                        "data-text": "action",
                        className: "ds-doc-brand",
                        href: "/",
                        "aria-label": "세종문화회관 홈",
                        children: [ 
                        
                         (0, jsx_runtime.jsx)("img", {
                            src: "/v5/assets/images/sejong-wordmark.png",
                            width: 158,
                            height: 29,
                            alt: "세종문화회관"
                        }), 
                        
                         (0, jsx_runtime.jsx)("span", {
                            "data-text": "body",
                            children: "디자인 시스템"
                        }) ]
                    }), 
                    
                     (0, jsx_runtime.jsxs)("div", {
                        className: "ds-doc-actions",
                        children: [ 
                        
                         (0, jsx_runtime.jsxs)("button", {
                            "data-text": "action",
                            type: "button",
                            className: "ds-search-trigger",
                            "aria-label": "디자인 가이드 검색",
                            "aria-haspopup": "dialog",
                            onClick: () => {
                                var _searchDialog_current;
                                return (_searchDialog_current = searchDialog.current) === null || _searchDialog_current === void 0 ? void 0 : _searchDialog_current.showModal();
                            },
                            children: [ 
                            
                             (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                                name: "search",
                                size: 20
                            }), 
                            
                             (0, jsx_runtime.jsx)("span", {
                                "data-text": "body",
                                children: "가이드 검색"
                            }), 
                            
                             (0, jsx_runtime.jsx)("kbd", {
                                "data-text": "meta",
                                children: "Ctrl K"
                            }) ]
                        }), 
                        
                         (0, jsx_runtime.jsxs)(api_link["default"], {
                            "data-text": "action",
                            className: "ds-site-link",
                            href: "/",
                            children: [ "사이트 보기", 
                            
                             (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                                name: "diagonal",
                                size: 20
                            }) ]
                        }), 
                        
                         (0, jsx_runtime.jsx /* SystemButton */)(SystemPrimitives.kR, {
                            "data-text": "action",
                            className: "ds-menu-trigger",
                            variant: "quiet",
                            "aria-label": "디자인 시스템 목차 열기",
                            "aria-haspopup": "dialog",
                            onClick: () => {
                                var _navigationDialog_current;
                                return (_navigationDialog_current = navigationDialog.current) === null || _navigationDialog_current === void 0 ? void 0 : _navigationDialog_current.showModal();
                            },
                            children:   (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                                name: "menu",
                                size: 24
                            })
                        }) ]
                    }) ]
                }), 
                
                 (0, jsx_runtime.jsxs)("aside", {
                    "data-text": "body",
                    className: "ds-sidebar",
                    children: [ navigationLinks(), 
                    
                     (0, jsx_runtime.jsxs)("p", {
                        "data-text": "body",
                        className: "ds-sidebar-note",
                        children: [ "v5 · 디지털 사용 기준", 
                        
                         (0, jsx_runtime.jsx)("br", {}), "본문 16px · 기존 컬러 유지" ]
                    }) ]
                }), 
                
                 (0, jsx_runtime.jsx)("div", {
                    className: "ds-content-area",
                    children:   (0, jsx_runtime.jsxs)("div", {
                        className: "ds-doc-layout",
                        children: [ 
                        
                         (0, jsx_runtime.jsxs)("main", {
                            "data-text": "body",
                            id: "main",
                            tabIndex: -1,
                            className: "ds-document",
                            children: [ 
                            
                             (0, jsx_runtime.jsxs)("nav", {
                                className: "ds-breadcrumbs",
                                "aria-label": "문서 위치",
                                children: [ 
                                
                                 (0, jsx_runtime.jsx)("a", {
                                    "data-text": "action",
                                    href: "#overview",
                                    onClick: event => navigate("overview", "", event),
                                    children: "가이드"
                                }), 
                                
                                 (0, jsx_runtime.jsx)("span", {
                                    "data-text": "body",
                                    "aria-hidden": "true",
                                    children: "/"
                                }), 
                                
                                 (0, jsx_runtime.jsx)("span", {
                                    "data-text": "body",
                                    children: chapter.label
                                }) ]
                            }), 
                            
                             (0, jsx_runtime.jsxs)("div", {
                                className: "ds-page-heading",
                                children: [ 
                                
                                 (0, jsx_runtime.jsx)("p", {
                                    "data-text": "body",
                                    className: "ds-version",
                                    children: "v5 · 2026.10"
                                }), 
                                
                                 (0, jsx_runtime.jsx)("h1", {
                                    "data-text": "title",
                                    id: "doc-page-title",
                                    tabIndex: -1,
                                    children: chapterId === "overview" ? "세종문화회관 디자인 시스템" : chapter.label
                                }), 
                                
                                 (0, jsx_runtime.jsx)("p", {
                                    "data-text": "body",
                                    children: chapterId === "overview" ? "브랜드 컬러부터 한 글자의 간격까지. v5 화면을 만들고 확인할 때 사용하는 기준입니다." : chapter.description
                                }) ]
                            }), 
                            
                             (0, jsx_runtime.jsx)("p", {
                                "data-text": "body",
                                className: "ds-feedback-line",
                                role: "status",
                                "aria-live": "polite",
                                children: message
                            }), renderChapter(), 
                            
                             (0, jsx_runtime.jsxs)("nav", {
                                "data-text": "body",
                                className: "ds-chapter-footer",
                                "aria-label": "이전 다음 문서",
                                children: [ chapterIndex > 0 &&   (0, jsx_runtime.jsxs)("a", {
                                    "data-text": "action",
                                    href: "#".concat(CHAPTERS[chapterIndex - 1].id),
                                    onClick: event => navigate(CHAPTERS[chapterIndex - 1].id, "", event),
                                    children: [ 
                                    
                                     (0, jsx_runtime.jsx)("span", {
                                        "data-text": "body",
                                        children: "이전"
                                    }), 
                                    
                                     (0, jsx_runtime.jsx)("strong", {
                                        "data-text": "item-title",
                                        children: CHAPTERS[chapterIndex - 1].label
                                    }) ]
                                }), chapterIndex < CHAPTERS.length - 1 &&   (0, jsx_runtime.jsxs)("a", {
                                    "data-text": "action",
                                    href: "#".concat(CHAPTERS[chapterIndex + 1].id),
                                    onClick: event => navigate(CHAPTERS[chapterIndex + 1].id, "", event),
                                    children: [ 
                                    
                                     (0, jsx_runtime.jsx)("span", {
                                        "data-text": "body",
                                        children: "다음"
                                    }), 
                                    
                                     (0, jsx_runtime.jsx)("strong", {
                                        "data-text": "item-title",
                                        children: CHAPTERS[chapterIndex + 1].label
                                    }) ]
                                }) ]
                            }) ]
                        }), 
                        
                         (0, jsx_runtime.jsxs)("nav", {
                            "data-text": "body",
                            className: "ds-outline",
                            "aria-label": "현재 문서 목차",
                            children: [ 
                            
                             (0, jsx_runtime.jsx)("p", {
                                "data-text": "body",
                                children: "이 문서의 내용"
                            }), chapter.sections.map((param => {
                                let [id, label] = param;
                                 
                                return (0, jsx_runtime.jsx)("a", {
                                    "data-text": "action",
                                    href: "#".concat(chapterId, "/").concat(id),
                                    "aria-current": activeSection === "".concat(chapterId, "-").concat(id) ? "location" : undefined,
                                    onClick: event => navigate(chapterId, id, event),
                                    children: label
                                }, id);
                            })) ]
                        }) ]
                    })
                }), 
                
                 (0, jsx_runtime.jsxs /* default */)(SystemDialog.Z, {
                    ref: searchDialog,
                    className: "ds-search-dialog",
                    "aria-labelledby": "doc-search-title",
                    closeOnBackdrop: false,
                    children: [ 
                    
                     (0, jsx_runtime.jsxs)("div", {
                        className: "ds-dialog-heading",
                        children: [ 
                        
                         (0, jsx_runtime.jsx)("h2", {
                            "data-text": "heading",
                            id: "doc-search-title",
                            children: "가이드 검색"
                        }), 
                        
                         (0, jsx_runtime.jsx /* SystemButton */)(SystemPrimitives.kR, {
                            "data-text": "action",
                            variant: "quiet",
                            className: "ds-dialog-close",
                            "aria-label": "검색 닫기",
                            onClick: () => {
                                var _searchDialog_current;
                                return (_searchDialog_current = searchDialog.current) === null || _searchDialog_current === void 0 ? void 0 : _searchDialog_current.close();
                            },
                            children:   (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                                name: "close",
                                size: 24
                            })
                        }) ]
                    }), 
                    
                     (0, jsx_runtime.jsx /* SystemField */)(SystemPrimitives.RK, {
                        "data-text": "body",
                        id: "doc-search",
                        label: "찾을 기준",
                        placeholder: "예: 컬러, 16px, 모션",
                        value: query,
                        onChange: event => setQuery(event.target.value),
                        autoFocus: true
                    }), 
                    
                     (0, jsx_runtime.jsx)("div", {
                        "data-text": "body",
                        className: "ds-search-results",
                        children: results.length ? results.map((result =>   (0, jsx_runtime.jsxs)("a", {
                            "data-text": "action",
                            href: "#".concat(result.chapter).concat(result.anchor ? "/" + result.anchor : ""),
                            onClick: event => navigate(result.chapter, result.anchor, event),
                            children: [ 
                            
                             (0, jsx_runtime.jsxs)("div", {
                                children: [ 
                                
                                 (0, jsx_runtime.jsx)("strong", {
                                    "data-text": "item-title",
                                    children: result.title
                                }), 
                                
                                 (0, jsx_runtime.jsx)("span", {
                                    "data-text": "body",
                                    children: result.description
                                }) ]
                            }), 
                            
                             (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                                name: "chevron",
                                size: 20
                            }) ]
                        }, result.chapter + result.anchor + result.title))) :   (0, jsx_runtime.jsx /* SystemNotice */)(SystemPrimitives.F0, {
                            "data-text": "body",
                            title: "찾는 기준이 없습니다.",
                            children: "검색어를 짧게 바꾸거나 왼쪽 분류에서 확인해 주세요."
                        })
                    }) ]
                }), 
                
                 (0, jsx_runtime.jsxs /* default */)(SystemDialog.Z, {
                    ref: navigationDialog,
                    className: "ds-navigation-dialog",
                    "aria-labelledby": "doc-navigation-title",
                    closeOnBackdrop: false,
                    children: [ 
                    
                     (0, jsx_runtime.jsxs)("div", {
                        className: "ds-dialog-heading",
                        children: [ 
                        
                         (0, jsx_runtime.jsx)("h2", {
                            "data-text": "heading",
                            id: "doc-navigation-title",
                            children: "디자인 시스템"
                        }), 
                        
                         (0, jsx_runtime.jsx /* SystemButton */)(SystemPrimitives.kR, {
                            "data-text": "action",
                            variant: "quiet",
                            className: "ds-dialog-close",
                            "aria-label": "목차 닫기",
                            onClick: () => {
                                var _navigationDialog_current;
                                return (_navigationDialog_current = navigationDialog.current) === null || _navigationDialog_current === void 0 ? void 0 : _navigationDialog_current.close();
                            },
                            children:   (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                                name: "close",
                                size: 24
                            })
                        }) ]
                    }), navigationLinks(true) ]
                }), 
                
                 (0, jsx_runtime.jsxs /* default */)(SystemDialog.Z, {
                    ref: demoDialog,
                    "aria-labelledby": "sample-dialog-title",
                    closeOnBackdrop: false,
                    children: [ 
                    
                     (0, jsx_runtime.jsxs)("div", {
                        className: "ds-dialog-heading",
                        children: [ 
                        
                         (0, jsx_runtime.jsx)("h2", {
                            "data-text": "heading",
                            id: "sample-dialog-title",
                            children: "관람할 날짜를 선택해 주세요"
                        }), 
                        
                         (0, jsx_runtime.jsx /* SystemButton */)(SystemPrimitives.kR, {
                            "data-text": "action",
                            variant: "quiet",
                            className: "ds-dialog-close",
                            "aria-label": "날짜 선택 닫기",
                            onClick: () => {
                                var _demoDialog_current;
                                return (_demoDialog_current = demoDialog.current) === null || _demoDialog_current === void 0 ? void 0 : _demoDialog_current.close();
                            },
                            children:   (0, jsx_runtime.jsx /* default */)(Icon.Z, {
                                name: "close",
                                size: 24
                            })
                        }) ]
                    }), 
                    
                     (0, jsx_runtime.jsx /* SystemField */)(SystemPrimitives.RK, {
                        "data-text": "body",
                        id: "sample-date",
                        label: "관람일",
                        type: "date",
                        value: demoDate,
                        onChange: event => setDemoDate(event.target.value)
                    }), 
                    
                     (0, jsx_runtime.jsx)("p", {
                        "data-text": "body",
                        children: "디자인 컴포넌트를 확인하는 예제입니다. 실제 예매에는 반영되지 않습니다."
                    }), 
                    
                     (0, jsx_runtime.jsxs)("div", {
                        className: "ds-dialog-actions",
                        children: [ 
                        
                         (0, jsx_runtime.jsx /* SystemButton */)(SystemPrimitives.kR, {
                            "data-text": "action",
                            variant: "secondary",
                            onClick: () => {
                                var _demoDialog_current;
                                return (_demoDialog_current = demoDialog.current) === null || _demoDialog_current === void 0 ? void 0 : _demoDialog_current.close();
                            },
                            children: "취소"
                        }), 
                        
                         (0, jsx_runtime.jsx /* SystemButton */)(SystemPrimitives.kR, {
                            "data-text": "action",
                            onClick: () => {
                                var _demoDialog_current;
                                setMessage(demoDate ? "".concat(demoDate, "을 선택했습니다.") : "관람일을 선택해 주세요.");
                                if (demoDate) (_demoDialog_current = demoDialog.current) === null || _demoDialog_current === void 0 ? void 0 : _demoDialog_current.close();
                            },
                            children: "선택 적용"
                        }) ]
                    }) ]
                }) ]
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
        /***/    }
}, 
/******/ function(__webpack_require__) {
    // webpackRuntimeModules
    /******/ var __webpack_exec__ = function(moduleId) {
        return __webpack_require__(__webpack_require__.s = moduleId);
    }
    /******/;
    __webpack_require__.O(0, [ 0, 762, 648, 369, 498, 663, 564, 854, 378, 971, 117, 744 ], (function() {
        return __webpack_exec__(8884);
    }));
    /******/    var __webpack_exports__ = __webpack_require__.O();
    /******/    _N_E = __webpack_exports__;
    /******/} ]);
//# sourceMappingURL=page_1.js.map