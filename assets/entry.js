function redirectLegacyRoute() {
    if (!window.location.hash.startsWith("#/")) return false;
    window.location.replace("legacy.html" + window.location.search + window.location.hash);
    return true;
}

window.addEventListener("hashchange", redirectLegacyRoute);

if (!redirectLegacyRoute()) {
    window.alert("이것은 공식 페이지가 아닙니다.\nThis is not an official website.");
}

// 디자인 찾기 & 필터링 인터랙션 / Design discovery search & filter
document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById("design-search-input");
    const filterBtns = document.querySelectorAll(".design-filter-btn");
    const cards = document.querySelectorAll(".design-hub-card");
    const emptyMsg = document.getElementById("design-empty-message");

    if (!cards.length) return;

    let currentFilter = "all";
    let currentQuery = "";

    function updateCards() {
        let visibleCount = 0;
        const normalizedQuery = currentQuery.trim().toLowerCase();

        cards.forEach(function (card) {
            const category = card.getAttribute("data-category") || "";
            const tags = (card.getAttribute("data-tags") || "").toLowerCase();
            const text = (card.textContent || "").toLowerCase();

            const matchesCategory = currentFilter === "all" || category === currentFilter;
            const matchesQuery = !normalizedQuery || tags.includes(normalizedQuery) || text.includes(normalizedQuery);

            if (matchesCategory && matchesQuery) {
                card.classList.remove("is-hidden");
                visibleCount++;
            } else {
                card.classList.add("is-hidden");
            }
        });

        if (emptyMsg) {
            emptyMsg.style.display = visibleCount === 0 ? "block" : "none";
        }
    }

    if (searchInput) {
        searchInput.addEventListener("input", function (e) {
            currentQuery = e.target.value;
            updateCards();
        });
    }

    filterBtns.forEach(function (btn) {
        btn.addEventListener("click", function () {
            filterBtns.forEach(function (b) { b.classList.remove("is-active"); });
            btn.classList.add("is-active");
            currentFilter = btn.getAttribute("data-filter") || "all";
            updateCards();
        });
    });
    // 기존 디자인 카드 색인을 Deep Chat에 연결합니다. 스크립트는 사용자 요청 시 로드합니다.
    const chatDetails = document.getElementById("design-conversational-search");
    const chatTarget = document.getElementById("design-deep-search");
    let chatLoadingStarted = false;
    function createDesignChat() {
        if (!chatTarget || chatTarget.querySelector("deep-chat")) return;
        const chat = document.createElement("deep-chat");
        chat.style.display = "block";
        chat.style.width = "100%";
        chat.style.height = "min(380px, 60vh)";
        chat.introMessage = { text: "디자인 토큰, 인터랙션, 검증 문서를 찾아보세요." };
        chat.requestBodyLimits = { maxMessages: 1 };
        chat.connect = { handler: function (body, signals) {
            const messages = Array.isArray(body.messages) ? body.messages : [];
            const last = messages.slice().reverse().find(item => item.role === "user" && typeof item.text === "string");
            const query = String(last && last.text || "").trim().toLocaleLowerCase("ko-KR").slice(0, 100);
            if (!query) { void signals.onResponse({ text: "검색할 문서 키워드를 입력해 주세요." }); return; }
            const safe = text => ["[", "]", "(", ")", "<", ">", "*", "_"].reduce((s, char) => s.split(char).join(" "), String(text || "")).slice(0, 80);
            const matches = Array.from(cards).filter(card => {
                const fullText = [card.textContent || "", card.getAttribute("data-tags") || ""].join(" ").toLocaleLowerCase("ko-KR");
                return query.split(" ").filter(Boolean).every(term => fullText.includes(term));
            }).slice(0, 8);
            const resultLines = matches.map(card => {
                const title = safe(card.querySelector("h3")?.textContent || card.textContent || "문서");
                const href = card.getAttribute("href") || "";
                return href.startsWith("v5/") || href.startsWith("docs/")
                    ? "- [" + title + "](" + href + ")" : "- " + title;
            });
            const linebreak = String.fromCharCode(10);
            const answer = resultLines.length
                ? "**문서 검색 결과 (" + resultLines.length + "개)**" + linebreak + linebreak + resultLines.join(linebreak)
                : "조건에 맞는 문서를 찾지 못했어요. 위쪽의 기본 검색에서 다른 키워드를 시도해 주세요.";
            void signals.onResponse({ text: answer });
        } };
        chatTarget.replaceChildren(chat);
    }
    if (chatDetails && chatTarget) chatDetails.addEventListener("toggle", function () {
        if (!chatDetails.open || chatLoadingStarted) return;
        chatLoadingStarted = true;
        if (customElements.get("deep-chat")) { createDesignChat(); return; }
        const script = document.createElement("script");
        script.src = "https://unpkg.com/deep-chat@2.5.1/dist/deepChat.bundle.js";
        script.async = true;
        script.onload = createDesignChat;
        script.onerror = function () {
            chatTarget.textContent = "대화형 검색을 불러오지 못했습니다. 위쪽의 기본 문서 검색을 이용해 주세요.";
        };
        document.head.appendChild(script);
    });

});

