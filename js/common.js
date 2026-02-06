// =========================================
// 画面内に入ったらclass付与（inview）
// =========================================
$(function () {
  $(".inview").on("inview", function () {
    $(this).addClass("show");
  });
});

// =========================================
// トップ遷移ボタン：表示制御＋フッター直前で停止（余白あり）
//  - bottomは固定のまま、CSS変数(--lift)で押し上げる（カクつき防止）
//  - スクロール中はtransitionを切る（ドリブル防止）
//  - 最初のスクロール1回目だけ「表示判定のみ」にして負荷を分散
// =========================================
const $topBtn = $(".top-btn");
const $footer = $("footer");

// 通常時の下余白（px）※CSSの bottom(2rem=32px想定) と合わせる
const baseBottom = 32;

// フッターとボタンの間に空けたい余白（px）
const footerMarginPC = 16;
const footerMarginSP = 24;

// showの閾値
const showThreshold = 300;

let topBtnTicking = false;

// 計測キャッシュ
let footerTopCached = 0;
let footerDirty = true;

// スクロール追従判定
let followStopTimer = null;

// 最初のスクロールだけ軽くする
let topBtnWarm = false;

function getViewportHeight() {
  return window.innerHeight || $(window).height();
}

function getMargin() {
  return window.innerWidth < 768 ? footerMarginSP : footerMarginPC;
}

function refreshFooterTop() {
  const footerEl = $footer.get(0);
  if (!footerEl) return;

  // getBoundingClientRect は viewport基準なので scrollY を足す
  footerTopCached = footerEl.getBoundingClientRect().top + window.scrollY;
  footerDirty = false;
}

function updateTopBtnVisibility(scrollTop) {
  if (!$topBtn.length) return;

  if (scrollTop > showThreshold) $topBtn.addClass("is-show");
  else $topBtn.removeClass("is-show");
}

function updateTopBtnLift(scrollTop) {
  if (!$topBtn.length || !$footer.length) return;

  if (footerDirty) refreshFooterTop();

  const winH = getViewportHeight();
  const viewportBottom = scrollTop + winH;
  const margin = getMargin();

  let overlap = viewportBottom - footerTopCached - baseBottom + margin;
  overlap = Math.max(0, overlap);

  // 1pxデッドゾーン（細かい揺れ防止）
  if (overlap < 2) overlap = 0;

  // CSS変数で押し上げる
  $topBtn.css("--lift", `${-overlap}px`);
}

function updateTopBtnAll() {
  const scrollTop = $(window).scrollTop();
  updateTopBtnVisibility(scrollTop);
  updateTopBtnLift(scrollTop);
}

function setFollowingState() {
  if (!$topBtn.length) return;

  $topBtn.addClass("is-following");
  clearTimeout(followStopTimer);
  followStopTimer = setTimeout(() => {
    $topBtn.removeClass("is-following");
  }, 120);
}

// 最初のスクロール1回目は「表示/非表示」のみ実施、位置計算を次フレームへ分散
function requestTopBtnUpdate() {
  if (topBtnTicking) return;
  topBtnTicking = true;

  requestAnimationFrame(() => {
    const scrollTop = $(window).scrollTop();

    if (!topBtnWarm) {
      // 1回目は軽く：表示判定だけ
      updateTopBtnVisibility(scrollTop);
      topBtnWarm = true;

      // 次フレームで位置計算（負荷を分散）
      requestAnimationFrame(() => {
        footerDirty = true;
        updateTopBtnAll();
      });
    } else {
      updateTopBtnVisibility(scrollTop);
      updateTopBtnLift(scrollTop);
    }

    topBtnTicking = false;
  });
}

// スクロール中：追従のtransitionを切る + 更新
window.addEventListener(
  "scroll",
  () => {
    setFollowingState();
    requestTopBtnUpdate();
  },
  { passive: true }
);

// レイアウト変化が起きるときだけフッター位置を更新
$(window).on("resize orientationchange", () => {
  footerDirty = true;
  requestTopBtnUpdate();
});

// 読み込み後（画像/フォント反映）
window.addEventListener("load", () => {
  footerDirty = true;
});

// 外部から呼べるように（ドロワー開閉/タブ切替などで使用）
function markFooterDirtyAndUpdate() {
  footerDirty = true;
  requestTopBtnUpdate();
}

updateTopBtnVisibility($(window).scrollTop());

// クリックでトップへ移動
$(".top-btn-scroll").on("click", function () {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// =========================================
// マウスストーカー
// =========================================
$(function () {
  const $stalker = $("#js-stalker");
  if (!$stalker.length) return;

  $stalker.css("opacity", "1");

  $(document).on("mousemove", function (e) {
    $stalker.css("transform", `translate(${e.clientX}px, ${e.clientY}px)`);
  });
});

// =========================================
// メイン画像の切り替え（title点滅）
// =========================================
$(function () {
  const CLASSNAME = "-visible";
  const INTERVAL = 1500;
  const $title = $(".title");
  if (!$title.length) return;

  setInterval(() => {
    $title.addClass(CLASSNAME);
    setTimeout(() => {
      $title.removeClass(CLASSNAME);
    }, INTERVAL);
  }, INTERVAL * 2);
});

// =========================================
// Swiper
// =========================================
$(function () {
  if (!$(".swiper1").length) return;

  new Swiper(".swiper1", {
    loop: true,
    effect: "fade",
    fadeEffect: { crossFade: true },
    autoplay: {
      delay: 5000,
      disableOnInteraction: false,
    },
    speed: 1000,
  });
});

// =========================================
// ドロワーメニュー
// =========================================
$(function () {
  $(".drawer_button").on("click", function () {
    $(this).toggleClass("active");
    $(".drawer_nav_wrapper").toggleClass("open");
    $(".drawer_bg").fadeToggle(150);
    markFooterDirtyAndUpdate();
  });

  $(".drawer_bg").on("click", function () {
    $(".drawer_button").removeClass("active");
    $(".drawer_nav_wrapper").removeClass("open");
    $(this).hide();
    markFooterDirtyAndUpdate();
  });
});

// =========================================
// 採用情報：タブ切り替え
// =========================================
$(function () {
  const $tabs = $(".tab");
  if (!$tabs.length) return;

  $tabs.on("click", function () {
    $(".tab.active").removeClass("active");
    $(this).addClass("active");

    const index = $tabs.index(this);
    $(".content").removeClass("show").eq(index).addClass("show");

    markFooterDirtyAndUpdate();
  });
});

// =========================================
// ページ内アンカー（#）のスムーススクロール
// =========================================
$(function () {
  $('a[href^="#"]').on("click", function () {
    const adjust = 90;
    const speed = 400;

    const href = $(this).attr("href");
    const $target = $(href === "#" || href === "" ? "html" : href);
    if (!$target.length) return false;

    const position = $target.offset().top - adjust;

    $("html,body").animate({ scrollTop: position }, speed, "swing", function () {
      requestTopBtnUpdate();
    });

    return false;
  });
});
