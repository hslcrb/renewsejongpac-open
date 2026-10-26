import { PROGRAMS, NOTICES } from "./data.js";
import {
  esc,
  href,
  icon,
  todayISO,
  filterPrograms,
  formatDate,
} from "./core.js";
import { programCard, button } from "./components.js";
const slides = [
  {
    kicker: "2026 SEJONG SEASON",
    title: "가을의 깊이,<br>예술의 온도.",
    name: "서울시무용단 〈일무〉",
    date: "2026.10.20 — 10.25",
    place: "세종대극장",
    id: "dance",
    image: "assets/images/hero-dance.png",
    className: "dance",
  },
  {
    kicker: "SEOUL METROPOLITAN OPERA",
    title: "자유를 노래하는<br>뜨거운 이름.",
    name: "서울시오페라단 〈카르멘〉",
    date: "2026.10.15 — 10.18",
    place: "세종대극장",
    id: "carmen",
    image: "assets/images/carmen-opera-concept.png",
    className: "opera",
  },
  {
    kicker: "ART, IN EVERY MOMENT",
    title: "빛을 따라,<br>새로운 감각으로.",
    name: "기획전시 〈빛이 머무는 자리〉",
    date: "2026.10.01 — 11.15",
    place: "세종미술관",
    id: "light",
    image: "assets/images/poster-light.svg",
    className: "light",
  },
];
let slideIndex = 0;
let selectedDate = todayISO();
let calendarDate = new Date(selectedDate + "T12:00:00");
let activeCategory = "전체";
const dateString = (y, m, d) =>
  `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const HERO_DURATION = 3000;
const HERO_TRANSITION = 700;
function heroCard(index, position) {
  const s = slides[index];
  const active = position === 1;
  return `<article class="hero-card ${active ? "is-active is-copy-visible" : position < 1 ? "is-before" : "is-after"}" data-hero-position="${position}" data-hero-card="${index}" role="group" aria-roledescription="슬라이드" aria-label="${index + 1} / ${slides.length}, ${s.name}" aria-hidden="${!active}">
    <div class="hero-bg hero-bg--${s.className}" style="background-image:url('${s.image}')"></div>
    <div class="hero-shade"></div>
    <div class="hero-inner"><div class="hero-copy"${active ? "" : " inert"}>
      <div class="hero-kicker"><span></span>${s.kicker}</div>
      <h1>${s.title}</h1><p class="hero-program">${s.name}</p>
      <p class="hero-meta">${s.date}<span></span>${s.place}</p>
      <div class="hero-cta">${button(s.id === "light" ? "전시 자세히 보기" : "공연 자세히 보기", "/programs/" + s.id, "yellow")}<a class="hero-book" href="${href("/booking/" + s.id)}">예매하기 ${icon("diagonal", 19)}</a></div>
    </div></div>
  </article>`;
}
function heroContent() {
  const order = [(slideIndex + 1) % slides.length, slideIndex, (slideIndex + slides.length - 1) % slides.length];
  return `<div class="hero-track" style="--hero-position:1;--hero-transition:${HERO_TRANSITION}ms">${order.map(heroCard).join("")}</div>
    <div class="hero-overlay"><div class="hero-controls">
      <div class="hero-progress" aria-hidden="true"><i style="transform:scaleX(0)"></i></div>
      <button data-slide="-1" aria-label="이전 대표 프로그램">${icon("chevron", 16)}</button><button data-slide="1" aria-label="다음 대표 프로그램">${icon("chevron", 16)}</button>
      <button id="hero-pause" aria-label="자동 재생 일시정지" aria-pressed="false">${icon("pause", 18)}</button>
    </div><aside class="hero-ticket-note"><span class="hero-ticket-label">티켓 오픈 안내</span><a href="#/news/notices/season-open"><strong>10.15 <span>THU</span> 14:00</strong><p>11월 세종시즌 ${icon("diagonal", 15)}</p></a></aside></div>`;
}
function calendarHTML() {
  const y = calendarDate.getFullYear(),
    m = calendarDate.getMonth();
  const first = new Date(y, m, 1).getDay(),
    days = new Date(y, m + 1, 0).getDate();
  return `<div class="calendar-top"><button class="icon-button" data-month="-1" aria-label="이전 달">${icon("chevron", 16)}</button><h3>${y}<span>.</span>${String(m + 1).padStart(2, "0")}</h3><button class="icon-button" data-month="1" aria-label="다음 달">${icon("chevron", 16)}</button></div><div class="mini-calendar" role="group" aria-label="${y}년 ${m + 1}월 공연일 선택">${["일", "월", "화", "수", "목", "금", "토"].map((d) => `<span class="weekday">${d}</span>`).join("")}${Array.from({ length: first }, () => "<span></span>").join("")}${Array.from(
    { length: days },
    (_, i) => {
      const d = dateString(y, m, i + 1),
        events = filterPrograms(PROGRAMS, { date: d });
      return `<button class="calendar-day ${d === selectedDate ? "selected" : ""} ${d === todayISO() ? "is-today" : ""} ${events.length ? "has-events" : ""}" data-date="${d}" aria-pressed="${d === selectedDate}" aria-label="${m + 1}월 ${i + 1}일, 프로그램 ${events.length}개">${i + 1}${events.length ? `<span class="day-dot"></span><span class="date-tooltip"><img src="${events[0].image}" alt=""><span>${esc(events[0].title)}<small>외 ${events.length - 1}개 프로그램</small></span></span>` : ""}</button>`;
    },
  ).join("")}</div>`;
}
function dailyHTML() {
  const programs = filterPrograms(PROGRAMS, { date: selectedDate });
  const weekday = new Intl.DateTimeFormat("ko-KR", { weekday: "short" }).format(
    new Date(selectedDate + "T12:00:00"),
  );
  return `<div class="daily-heading"><h3>${formatDate(selectedDate)} <span>${weekday}</span></h3><span>${programs.length}개의 프로그램</span></div><div class="daily-programs">${
    programs.length
      ? programs
          .slice(0, 2)
          .map(
            (p) =>
              `<article class="daily-program"><a href="${href("/programs/" + p.id)}"><img src="${p.image}" alt="${esc(p.title)} 포스터" width="80" height="105"></a><div><span class="daily-category">${p.genre}</span><h4><a href="${href("/programs/" + p.id)}">${esc(p.title)}</a></h4><p>${p.venue} <span>${esc(p.times[0])}</span></p><a class="daily-book" href="${href(p.category === "교육" ? "/apply/education?program=" + p.id : "/booking/" + p.id + "?date=" + selectedDate)}">${p.category === "교육" ? "신청하기" : "예매하기"} ${icon("arrow", 16)}</a></div></article>`,
          )
          .join("")
      : `<div class="daily-empty">선택한 날짜에 예정된 프로그램이 없습니다.<br>다른 날짜의 예술을 만나보세요.</div>`
  }</div><a class="daily-all" href="${href("/programs?date=" + selectedDate)}">이 날짜의 모든 프로그램 ${icon("arrow", 17)}</a>`;
}
function discoveryHTML() {
  return `<section class="discovery-section section" aria-labelledby="discovery-title"><div class="container">
    <div class="section-heading discovery-heading"><div class="discovery-title-row"><h2 id="discovery-title">모든 프로그램</h2><p>공연·전시·교육을 분류별로 살펴보세요.</p></div><a href="#/programs" class="text-link">전체 일정 보기 ${icon("diagonal", 18)}</a></div>
    <div class="discovery-layout">
      <div class="discover-tabs" role="group" aria-label="프로그램 종류">${["전체", "공연", "전시", "교육", "기획·시즌"].map((c) => `<button class="${c === activeCategory ? "active" : ""}" data-category="${c}" aria-pressed="${c === activeCategory}" aria-controls="home-programs">${c}</button>`).join("")}</div>
      <div class="discovery-programs"><div class="program-grid" id="home-programs" aria-live="polite">${homePrograms()}</div><p class="home-data-note">공연 일정 및 요금은 리뉴얼 체험을 위한 예시입니다.</p></div>
      <aside class="discovery-event" aria-label="추천 이벤트"><a class="discovery-event-link" href="#/news/events/autumn-walk"><div class="discovery-event-top"><span class="eyebrow">이벤트</span>${icon("diagonal", 20)}</div><div class="discovery-event-copy"><span class="discovery-event-label">예술이 있는 가을</span><h3>가을의 취향을<br>나누다</h3><p>광화문에서 발견한<br>나만의 예술, 나만의 순간.</p></div><img class="discovery-event-image" src="assets/images/sejong-grand-facade.png" alt="저녁빛이 비치는 세종문화회관" width="1160" height="680" loading="lazy"><div class="discovery-event-bottom"><span>2026.10.01 — 10.31</span><span class="discovery-event-cta">이벤트 살펴보기 ${icon("arrow", 18)}</span></div></a></aside>
    </div>
  </div></section>`;
}
function visitHTML() {
  const guides = [
    {
      theme: "first", label: "첫 방문 안내", image: "sejong-grand-facade.png",
      title: "첫 방문을 위한<br>이용안내",
      description: "예매 방법과 공연장 위치, 좌석 정보를 확인하세요.",
      links: [["이용안내", "/visit"], ["공간·좌석", "/visit/spaces"], ["예매안내", "/programs/booking-guide"]],
    },
    {
      theme: "access", label: "모두를 위한 회관", image: "sejong-grand-interior.png",
      title: "모두를 위한<br>관람 지원",
      description: "접근성 서비스와 편의시설 정보를 안내합니다.",
      links: [["접근성 안내", "/visit/accessibility"], ["편의시설", "/visit/amenities"]],
    },
    {
      theme: "etiquette", label: "함께 만드는 관람 문화", image: "sejong-grand-auditorium.png",
      title: "함께 지키는<br>관람 예절",
      description: "입장 시간, 촬영과 녹음 등 관람 유의사항을 확인하세요.",
      links: [["관람 유의사항", "/visit/etiquette"]],
    },
    {
      theme: "help", label: "오시는 길·고객지원", image: "sejong-grand-exterior.png",
      title: "오시는 길과<br>고객지원",
      description: "교통·주차 정보와 자주 묻는 질문, 문의 방법을 안내합니다.",
      links: [["오시는 길", "/visit/directions"], ["주차안내", "/visit/directions/parking"], ["고객지원", "/visit/support"]],
    },
  ];
  return `<section class="visit-section section" aria-labelledby="visit-title"><div class="container">
    <div class="section-heading visit-heading"><div class="visit-title-row"><h2 id="visit-title">이용안내</h2><p>방문 전에 확인할 관람·시설 정보를 모았습니다.</p></div><a href="#/visit" class="text-link">이용안내 전체 보기 ${icon("diagonal", 18)}</a></div>
    <div class="visit-guide-grid">${guides.map((guide) => `<article class="visit-guide-card visit-guide-card--${guide.theme}"><div class="visit-guide-content"><div class="visit-guide-copy"><h3>${guide.title}</h3><p>${guide.description}</p></div><img class="visit-guide-image" src="assets/images/${guide.image}" alt="" loading="lazy" decoding="async"></div><nav class="visit-guide-links" aria-label="${guide.label}">${guide.links.map(([label, path]) => `<a href="${href(path)}">${label}${icon("arrow", 16)}</a>`).join("")}</nav></article>`).join("")}</div>
  </div></section>`;
}
const HOME_VIDEO_ID = "RS4-0RRdVc0";
const newsEntries = [
  { title: "주말 광화문 교통·주차 안내", description: "광화문에서 만나는 예술, 여유롭게 도착하는 방법을 확인하세요.", tag: "공지사항", path: "/news/notices/parking", image: "sejong-grand-facade.png", theme: "notice" },
  { title: "예술로 이어지는 서울의 이야기", description: "서울시 공식 문화 소식에서 공연과 예술 현장을 만나보세요.", tag: "보도·문화소식", path: "https://mediahub.seoul.go.kr/news/category/categoryNewsList.do?category=06", image: "sejong-grand-exterior.png", theme: "press", external: true },
  { title: NOTICES.find((n) => n.id === "season-open").title, description: "새로운 계절을 함께할 무대. 프로그램별 예매 일정을 확인하세요.", tag: "티켓오픈", path: "/news/notices/season-open", image: "sejong-ilmu-video.jpg", theme: "ticket" },
  { title: "세종 멤버십 안내와 혜택", description: "가입 방법, 회원 혜택과 이용 조건을 살펴보세요.", tag: "혜택정보", path: "/news/membership", image: "sejong-grand-interior.png", theme: "benefit" },
  { title: "세종 뉴스레터", description: "지난 뉴스레터와 구독 안내를 확인하세요.", tag: "뉴스레터", path: "/news/newsletter", image: "sejong-grand-interior.png", theme: "letter" },
  { title: NOTICES.find((n) => n.id === "rental-2027").title, description: "당신의 다음 무대가 시작되는 곳. 대관 일정과 신청 안내를 확인하세요.", tag: "대관공고", path: "/news/notices/rental-2027", image: "venue-grand.svg", theme: "rental" },
  { title: "가을의 취향을 나누다", description: "광화문에서 발견한 나만의 예술, 마음에 남은 장면을 함께 나누세요.", tag: "이벤트", path: "/news/events/autumn-walk", image: "sejong-grand-facade.png", theme: "event" },
  { title: NOTICES.find((n) => n.id === "academy-notice").title, description: "음악과 미술, 예술을 알아가는 즐거움. 가을학기 강좌를 살펴보세요.", tag: "교육소식", path: "/news/notices/academy-notice", image: "sejong-grand-auditorium.png", theme: "education" },
];
function newsHTML() {
  return `<section class="news-section section" aria-labelledby="news-title"><div class="container">
    <div class="section-heading news-heading"><div class="news-title-row"><h2 id="news-title">소식과 혜택</h2><p>공지, 티켓 오픈, 이벤트와 뉴스레터.</p></div><div class="news-heading-actions"><a href="#/news" class="text-link">소식 전체 보기 ${icon("diagonal", 18)}</a><div class="news-controls"><button data-news-step="-1" aria-label="이전 소식" aria-controls="home-news-carousel" disabled>${icon("arrow", 19)}</button><button data-news-step="1" aria-label="다음 소식" aria-controls="home-news-carousel">${icon("arrow", 19)}</button></div></div></div>
    <div class="news-carousel" id="home-news-carousel" role="region" aria-label="세종 소식 카드"><div class="news-track">${newsEntries.map((item) => `<article class="news-card news-card--${item.theme}"><a href="${item.external ? esc(item.path) : href(item.path)}"${item.external ? ' target="_blank" rel="noopener noreferrer"' : ""}><div class="news-card-image"><img src="assets/images/${item.image}" alt="" loading="lazy" decoding="async"></div><h3>${esc(item.title)}</h3><p>${item.description}</p><div class="news-card-bottom"><span class="news-card-tag">${item.tag}</span>${icon(item.external ? "diagonal" : "arrow", 18)}${item.external ? '<span class="sr-only">새 창에서 서울시 문화 소식 보기</span>' : ""}</div></a></article>`).join("")}</div></div><p class="sr-only" id="news-position" aria-live="polite"></p>
  </div></section>`;
}
function aboutHTML() {
  return `<section class="brand-section section" aria-labelledby="about-title"><div class="container">
    <div class="about-heading"><h2 id="about-title">세종문화회관 소개</h2></div>
    <div class="about-grid"><a class="about-esg" href="#/about/esg"><h3>ESG</h3><p>환경경영, 사회공헌, 윤리경영.<br>세종문화회관의 ESG 운영 방향과<br>활동을 확인하세요.</p><span class="about-card-cta">ESG 경영 살펴보기 ${icon("arrow", 19)}</span></a>
      <div class="about-story"><span class="about-story-year">SEOUL · SINCE 1978</span><h3>수도의,<br>예술.</h3><p>서울의 중심에서<br>예술로 이어지는 우리.</p><a href="#/about/introduction" class="about-story-link">세종 이야기 ${icon("diagonal", 18)}</a></div>
      <div class="about-video"><div class="about-video-frame" id="about-video-frame"><button type="button" data-about-play aria-label="서울시무용단 일무 공식 영상 재생"><img src="assets/images/sejong-ilmu-video.jpg" alt="" width="640" height="480" loading="lazy"><span class="about-play-label">영상 재생 ${icon("arrow", 20)}</span></button></div><div class="about-video-caption"><div><span>영상으로 만나는 세종</span><h3>서울시무용단 〈일무〉</h3></div><a href="https://www.youtube.com/watch?v=${HOME_VIDEO_ID}" target="_blank" rel="noopener noreferrer" aria-label="일무 영상을 유튜브에서 보기, 새 창">YouTube ${icon("diagonal", 16)}</a></div></div>
    </div>
    <nav class="about-links" aria-label="기관 주요 안내"><a href="#/about/disclosure"><div><h3>정보공개</h3><p>경영정보와 공시, 투명한 세종의 운영</p></div>${icon("arrow", 24)}</a><a href="#/about/partners"><div><h3>협력 및 협찬</h3><p>예술의 내일을 함께 만드는 만남</p></div>${icon("arrow", 24)}</a></nav>
  </div></section>`;
}
export function renderHome() {
  return `<section class="home-hero" aria-label="이달의 대표 프로그램">${heroContent()}</section><div class="purpose-bar"><div class="container"><p>오늘, 어떤 예술을 만나볼까요?</p><a href="#/programs">개인 예매 ${icon("arrow", 20)}</a><a href="#/visit/group">단체 관람 ${icon("arrow", 20)}</a><a href="#/rental">대관 안내·신청 ${icon("diagonal", 20)}</a></div></div><section class="quick-section section"><div class="container"><div class="quick-intro"><h2>관람일을<br>선택하세요.</h2><p>선택한 날짜의 공연·전시·교육<br>일정을 확인하세요.</p><a href="#/programs" class="text-link">전체 일정 보기 ${icon("arrow", 18)}</a></div><div id="quick-calendar">${calendarHTML()}</div><div id="daily-programs">${dailyHTML()}</div></div></section>${discoveryHTML()}${visitHTML()}${newsHTML()}${aboutHTML()}`;
}
function homePrograms() {
  let rows;
  if (activeCategory === "기획·시즌")
    rows = [PROGRAMS[2], PROGRAMS[5], PROGRAMS[12], PROGRAMS[0]];
  else
    rows = filterPrograms(PROGRAMS, { category: activeCategory }).sort(
      (a, b) =>
        Number(b.start <= todayISO() && b.end >= todayISO()) -
        Number(a.start <= todayISO() && a.end >= todayISO()),
    );
  return rows.slice(0, 4).map(programCard).join("");
}
export function bindHome(root) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const newsTrack = root.querySelector(".news-track");
  const newsCards = [...newsTrack.querySelectorAll(".news-card")];
  const newsCarousel = root.querySelector(".news-carousel");
  let newsIndex = 0;
  const updateNews = (animate = false) => {
    const visible = Number(getComputedStyle(newsCarousel).getPropertyValue("--news-visible")) || 4;
    const gap = parseFloat(getComputedStyle(newsTrack).columnGap) || 0;
    newsIndex = Math.max(0, Math.min(newsIndex, newsCards.length - visible));
    newsTrack.classList.toggle("is-resetting", !animate);
    newsTrack.style.setProperty("--news-offset", `${newsIndex * (newsCards[0].getBoundingClientRect().width + gap)}px`);
    newsCards.forEach((card, index) => {
      const shown = index >= newsIndex && index < newsIndex + visible;
      card.inert = !shown;
      card.setAttribute("aria-hidden", String(!shown));
    });
    root.querySelector('[data-news-step="-1"]').disabled = newsIndex === 0;
    root.querySelector('[data-news-step="1"]').disabled = newsIndex >= newsCards.length - visible;
    root.querySelector("#news-position").textContent = `${newsIndex + 1}–${newsIndex + visible}, 전체 ${newsCards.length}개의 소식`;
    if (!animate) {
      void newsTrack.offsetWidth;
      newsTrack.classList.remove("is-resetting");
    }
  };
  updateNews();
  const newsResizeObserver = new ResizeObserver(() => updateNews());
  newsResizeObserver.observe(newsCarousel);
  let paused = reduce;
  const hero = root.querySelector(".home-hero");
  const track = hero.querySelector(".hero-track");
  const cards = [...hero.querySelectorAll(".hero-card")];
  const progress = hero.querySelector(".hero-progress i");
  let position = 1, elapsed = 0, lastTick = null;
  let transitioning = false, frame, transitionFallback;
  const updateProgress = (fraction) => {
    progress.style.transform = `scaleX(${fraction})`;
  };
  const updatePause = () => {
    const control = hero.querySelector("#hero-pause");
    control.setAttribute("aria-pressed", String(paused));
    control.setAttribute("aria-label", paused ? "자동 재생 시작" : "자동 재생 일시정지");
    control.innerHTML = icon(paused ? "play" : "pause", 18);
  };
  const updateActive = () => {
    cards.forEach((card, index) => {
      const active = index === position;
      card.dataset.heroPosition = String(index);
      card.classList.toggle("is-active", active);
      card.classList.toggle("is-before", index < position);
      card.classList.toggle("is-after", index > position);
      card.setAttribute("aria-hidden", String(!active));
      card.querySelector(".hero-copy").inert = !active;
    });
  };
  const finishTransition = () => {
    if (!transitioning) return;
    clearTimeout(transitionFallback);
    track.classList.add("is-resetting");
    cards.pop().remove();
    track.insertAdjacentHTML("afterbegin", heroCard((slideIndex + 1) % slides.length, 0));
    cards.unshift(track.firstElementChild);
    position = 1;
    track.style.setProperty("--hero-position", position);
    updateActive();
    // Recycling keeps the visible incoming and outgoing cards in place.
    void track.offsetWidth;
    track.classList.remove("is-resetting");
    transitioning = false;
    lastTick = null;
  };
  const transitionEnd = (event) => {
    if (event.target === track && event.propertyName === "transform") finishTransition();
  };
  const changeSlide = (offset) => {
    if (transitioning || !offset) return;
    transitioning = true;
    elapsed = 0;
    lastTick = null;
    slideIndex = (slideIndex + offset + slides.length) % slides.length;
    // Every selected banner enters through the left slot, including previous.
    if (Number(cards[0].dataset.heroCard) !== slideIndex) {
      cards[0].outerHTML = heroCard(slideIndex, 0);
      cards[0] = track.firstElementChild;
      void cards[0].offsetWidth;
    }
    position = 0;
    cards[0].classList.add("is-entering", "is-copy-visible");
    updateActive();
    updateProgress(0);
    track.style.setProperty("--hero-position", position);
    if (reduce) finishTransition();
    else transitionFallback = setTimeout(finishTransition, HERO_TRANSITION + 100);
  };
  const selectSlide = (index) => {
    const offset = (index - slideIndex + slides.length) % slides.length;
    changeSlide(offset > slides.length / 2 ? offset - slides.length : offset);
  };
  const click = (e) => {
    const slider = e.target.closest("[data-slide]");
    if (slider) { changeSlide(Number(slider.dataset.slide)); return; }
    const neighbor = e.target.closest(".hero-card:not(.is-active)");
    if (neighbor) { selectSlide(Number(neighbor.dataset.heroCard)); return; }
    if (e.target.closest("#hero-pause")) {
      paused = !paused;
      lastTick = null;
      updatePause();
    }
    const month = e.target.closest("[data-month]");
    if (month) {
      calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + Number(month.dataset.month), 1);
      root.querySelector("#quick-calendar").innerHTML = calendarHTML();
    }
    const day = e.target.closest("[data-date]");
    if (day) {
      selectedDate = day.dataset.date;
      root.querySelector("#quick-calendar").innerHTML = calendarHTML();
      root.querySelector("#daily-programs").innerHTML = dailyHTML();
      root.querySelector(`[data-date="${selectedDate}"]`)?.focus({ preventScroll: true });
    }
    const cat = e.target.closest("[data-category]");
    if (cat) {
      activeCategory = cat.dataset.category;
      root.querySelectorAll("[data-category]").forEach((b) => {
        const on = b.dataset.category === activeCategory;
        b.classList.toggle("active", on);
        b.setAttribute("aria-pressed", String(on));
      });
      root.querySelector("#home-programs").innerHTML = homePrograms();
    }
    const news = e.target.closest("[data-news-step]");
    if (news) {
      newsIndex += Number(news.dataset.newsStep);
      updateNews(true);
    }
    if (e.target.closest("[data-about-play]")) {
      const video = root.querySelector("#about-video-frame");
      video.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${HOME_VIDEO_ID}?autoplay=1&rel=0" title="서울시무용단 일무 공식 영상" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
      video.querySelector("iframe").focus();
    }
  };
  const visibilityChange = () => { lastTick = null; };
  const resizeObserver = new ResizeObserver(() => {
    finishTransition();
    track.classList.add("is-resetting");
    void track.offsetWidth;
    track.classList.remove("is-resetting");
  });
  const tick = (timestamp) => {
    const delta = lastTick === null ? 0 : timestamp - lastTick;
    lastTick = timestamp;
    const focus = document.activeElement;
    const keyboardFocus = hero.contains(focus) && focus?.matches(":focus-visible");
    if (!paused && !document.hidden && !transitioning && !keyboardFocus) {
      elapsed = Math.min(elapsed + delta, HERO_DURATION);
      updateProgress(elapsed / HERO_DURATION);
      if (elapsed >= HERO_DURATION) changeSlide(1);
    }
    frame = requestAnimationFrame(tick);
  };
  root.addEventListener("click", click);
  track.addEventListener("transitionend", transitionEnd);
  document.addEventListener("visibilitychange", visibilityChange);
  resizeObserver.observe(hero);
  updatePause();
  updateProgress(0);
  frame = requestAnimationFrame(tick);
  return () => {
    root.removeEventListener("click", click);
    track.removeEventListener("transitionend", transitionEnd);
    document.removeEventListener("visibilitychange", visibilityChange);
    resizeObserver.disconnect();
    newsResizeObserver.disconnect();
    clearTimeout(transitionFallback);
    cancelAnimationFrame(frame);
  };
}
