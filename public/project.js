(() => {
  const managedId = new URLSearchParams(location.search).get("project");
  if (managedId) { loadManagedProject(managedId); return; }
  const sites = {
    gymos: {
      id: "001", title: "GymOS / Digital Pulse — إدارة النوادي", english: "GYMOS · DIGITAL PULSE",
      url: "https://ibrheamkhalaf88-collab.github.io/GymOS/",
      summary: "تجربة ويب لإدارة النادي الرياضي ومتابعة تفاصيل التشغيل من واجهة واحدة.",
      description: "GymOS / Digital Pulse يجمع أدوات إدارة النادي في مكان رقمي واحد: العضويات، الأجهزة والصيانة، الدفتر المالي، وإعدادات الحساب والنسخ الاحتياطي.",
      features: ["إدارة العضويات", "الأجهزة والصيانة", "الدفتر المالي", "إعدادات الحساب والنسخ"],
    },
    splitease: {
      id: "002", title: "SplitEase — حساب الشلّة", english: "SPLITEASE · SHARED EXPENSES",
      url: "https://ibrheamkhalaf88-collab.github.io/SplitEase/",
      summary: "بدل ما تتقاتلوا مين دفع ومين ما دفع، اعرفوا الحساب واقسموه بدون دوشة راس.",
      description: "من المشاكل الدائمة بين الصحاب: مين دفع؟ ومين لسه عليه؟ SplitEase بيساعدكم تسجلوا المصاريف، تعرفوا مين إله ومين عليه، وتقسموا الحساب بدون وجعة راس.",
      features: ["تسجيل مصاريف المجموعة", "معرفة مين دفع ومين عليه", "تقسيم الحساب بوضوح"],
      mobileImage: "assets/splitease-home-mobile.png",
    },
    "beauty-zone": {
      id: "003", title: "Beauty Zone — متجر العناية", english: "BEAUTY ZONE · ONLINE STORE",
      url: "https://beauty-zone-sepia.vercel.app/",
      summary: "متجر إلكتروني عربي لمنتجات العناية والتجميل، بواجهة مرتبة للتصفح والاختيار.",
      description: "يعرض المتجر منتجات العناية والتجميل ضمن تجربة تسوّق عربية، مع تصنيفات تساعد الزائر على اكتشاف المنتجات والوصول لما يبحث عنه.",
      features: ["واجهة عربية", "تصنيفات للمنتجات", "تجربة تسوّق واضحة"],
    },
    "ibrahim-portfolio": {
      id: "004", title: "إبراهيم — خدمات رقمية", english: "IBRAHIM · DIGITAL SERVICES",
      url: "https://ibrheamkhalaf88-collab.github.io/ibrheam-freelance/",
      summary: "صفحة تعريفية تعرض خدمات إبراهيم الرقمية والعروض وطريقة بدء مشروع جديد.",
      description: "تعطي الصفحة الزائر صورة سريعة عن الخدمات المتاحة، وتشرح طريقة التواصل والبدء بخطوة جديدة للمشروع.",
      features: ["عرض الخدمات الرقمية", "تفاصيل العروض", "خطوة واضحة للبدء"],
    },
    wasla: {
      id: "005", title: "وصلة — بحثك له وكيل", english: "WASLA · JOB SEARCH EXPERIENCE",
      url: "https://wasla-agent-demo.mega12-kma12.chatgpt.site/",
      summary: "تجربة عربية تساعد الباحث عن عمل على تنظيم رحلة البحث عن الفرصة المناسبة.",
      description: "تقدّم وصلة واجهة تفاعلية لمتابعة رحلة البحث عن عمل؛ من فهم الفرصة وتحليلها إلى تجهيز خطوات التقديم عليها.",
      features: ["اكتشاف الفرص", "تحليل متطلبات الوظيفة", "تنظيم خطوات التقديم"],
    },
    "store-hub": {
      id: "006", title: "Store Hub — إدارة متجر الملابس", english: "STORE HUB · RETAIL MANAGEMENT",
      url: "https://ahmadmoh-911.github.io/my-store/#/dashboard",
      summary: "نظام ويب لإدارة متجر الملابس، من تسجيل البضاعة إلى البيع ومراجعة التقارير.",
      description: "Store Hub مساحة عمل يومية لإدارة متجر الملابس. تجمع المنتجات والمقاسات والكميات، نقطة البيع، الموردين وفواتير الشراء، مع تقارير للمبيعات والربح. أُنجز المشروع بواسطة أحمد المصري وإبراهيم خلف. يحفظ التطبيق بياناته محليًا على الجهاز، مع إمكانية تصدير نسخة احتياطية.",
      features: ["إدارة المنتجات والمقاسات والمخزون", "نقطة بيع وفواتير", "الموردون وفواتير الشراء", "تقارير المبيعات والأرباح", "تخزين محلي ونسخ احتياطي"],
      heroImage: "assets/store-hub/dashboard.jpg",
    },
    "sallaq-pharmacy": {
      id: "007", title: "صيدلية السلاق — رعاية دوائية", english: "SALLAQ PHARMACY · DIGITAL EXPERIENCE",
      url: "https://ibrheamkhalaf88-collab.github.io/sallaq-pharmacy/",
      summary: "موقع صيدلية عربي يعرّف بالخدمات والمنتجات والعروض من واجهة واحدة.",
      description: "تجربة رقمية لصيدلية السلاق، تنظم العروض والمنتجات والخدمات الصيدلانية ومعلومات الفروع والتواصل ضمن واجهة عربية متجاوبة.",
      features: ["واجهة عربية متجاوبة", "عروض ومنتجات مصنّفة", "عرض الخدمات الصيدلانية", "معلومات الفروع والتواصل"],
      heroImage: "assets/sallaq-pharmacy-home.png",
      desktopImage: "assets/sallaq-pharmacy-home.png",
    },
  };

  const qs = new URLSearchParams(location.search);
  const item = sites[qs.get("work")];
  if (!item) {
    document.querySelector(".project-page").innerHTML = '<section class="project-missing"><span class="section-kicker">المشروع مش موجود</span><h1>خلّينا نرجع للشغل.</h1><a class="project-primary" href="services.html#work-showcase">ارجع للمشاريع ↙</a></section>';
    return;
  }

  const screenshot = (width, height) => {
    const params = new URLSearchParams({url:item.url,screenshot:"true",meta:"false","embed":"screenshot.url","viewport.width":String(width),"viewport.height":String(height)});
    return `https://api.microlink.io/?${params.toString()}`;
  };
  const setText = (id, value) => { const node = document.getElementById(id); if (node) node.textContent = value; };
  document.title = `${item.title} — جَمْرَة`;
  setText("projectCrumb", item.title);
  setText("projectIndex", item.id);
  setText("projectKicker", `جَمْرَة / ${item.english}`);
  setText("projectTitle", item.title);
  setText("projectSummary", item.summary);
  setText("projectDescription", item.description);
  document.getElementById("projectVisit").href = item.url;
  const tags = document.getElementById("projectTags");
  item.features.forEach((feature) => { const tag=document.createElement("span"); tag.textContent=feature; tags.append(tag); });
  const features = document.getElementById("projectFeatures");
  item.features.forEach((feature,index) => { const row=document.createElement("div"); row.className="project-feature"; row.innerHTML=`<span>0${index+1}</span><b></b>`; row.querySelector("b").textContent=feature; features.append(row); });
  const desktop = item.desktopImage || screenshot(1440,1000), mobile = item.mobileImage || screenshot(390,844);
  document.getElementById("projectHeroImage").src = item.heroImage || desktop;
  document.getElementById("projectDesktopImage").src = desktop;
  document.getElementById("projectMobileImage").src = mobile;
  document.getElementById("projectHeroImage").alt = `لقطة من موقع ${item.title}`;
  document.getElementById("projectDesktopImage").alt = `لقطة من موقع ${item.title} على شاشة الكمبيوتر`;
  document.getElementById("projectMobileImage").alt = `لقطة من موقع ${item.title} على شاشة الهاتف`;
  if (qs.get("work") === "gymos") document.getElementById("gymosAppShowcase").hidden = false;
  if (qs.get("work") === "splitease") {
    document.getElementById("projectGallery").hidden = true;
    document.getElementById("splitEaseShowcase").hidden = false;
  }
  if (qs.get("work") === "store-hub") {
    document.getElementById("projectGallery").hidden = true;
    document.getElementById("storeHubShowcase").hidden = false;
  }

  async function loadManagedProject(id) {
    try {
      const response = await fetch("/api/projects", { cache: "no-store" });
      if (!response.ok) throw new Error("تعذّر تحميل المشروع");
      const data = await response.json();
      const item = (data.projects || []).find((project) => project.id === id);
      if (!item) return showMissing();
      document.title = `${item.title} — جَمْرَة`;
      const setText = (target, value) => { const node = document.getElementById(target); if (node) node.textContent = value || ""; };
      setText("projectCrumb", item.title); setText("projectIndex", "01");
      setText("projectKicker", `جَمْرَة / ${({website:"موقع إلكتروني",app:"تطبيق أو نظام",video:"فيديو وموشن جرافيك",design:"تصميم وهوية بصرية",campaign:"حملة تسويقية"})[item.category] || "مشروع"}`);
      setText("projectTitle", item.title); setText("projectSummary", item.summary); setText("projectDescription", item.description || item.summary);
      const visit = document.getElementById("projectVisit");
      if (item.projectUrl) visit.href = item.projectUrl; else visit.hidden = true;
      const tags = document.getElementById("projectTags"), features = item.features?.length ? item.features : [];
      tags.replaceChildren();
      features.forEach((feature) => { const tag = document.createElement("span"); tag.textContent = feature; tags.append(tag); });
      const list = document.getElementById("projectFeatures"); list.replaceChildren();
      features.forEach((feature, index) => { const row = document.createElement("div"); row.className = "project-feature"; const number = document.createElement("span"); number.textContent = String(index + 1).padStart(2, "0"); const text = document.createElement("b"); text.textContent = feature; row.append(number, text); list.append(row); });
      const shots = document.querySelector("#projectGallery .project-gallery-grid"); shots.replaceChildren();
      const assets = (item.gallery || []).map((asset) => ({ kind: "image", url: asset.url, alt: asset.alt || item.title }));
      if (!assets.length && item.coverUrl) assets.push({ kind: "image", url: item.coverUrl, alt: item.title });
      if (item.videoUrl) {
        let isFile = false; try { const url = new URL(item.videoUrl, location.origin); isFile = /\.(mp4|webm)$/i.test(url.searchParams.get("key") || url.pathname); } catch {}
        if (isFile) assets.unshift({ kind: "video", url: item.videoUrl, alt: item.title });
      }
      assets.forEach((asset, index) => {
        const figure = document.createElement("figure"); figure.className = `project-shot reveal ${index === 0 ? "project-shot-desktop" : ""}`;
        const top = document.createElement("div"); top.className = "project-shot-top"; top.innerHTML = `<span>جَمْرَة / ${String(index + 1).padStart(2, "0")}</span><span>من تفاصيل المشروع</span>`;
        const visual = asset.kind === "video" ? document.createElement("video") : document.createElement("img");
        visual.src = asset.url; visual.alt = asset.alt; if (asset.kind === "video") { visual.controls = true; visual.playsInline = true; visual.preload = "metadata"; } else { visual.loading = "lazy"; visual.decoding = "async"; }
        const caption = document.createElement("figcaption"); caption.textContent = asset.kind === "video" ? "فيديو من المشروع" : asset.alt;
        figure.append(top, visual, caption); shots.append(figure);
      });
      if (!assets.length) document.getElementById("projectGallery").hidden = true;
      const hero = document.getElementById("projectHeroImage");
      if (item.coverUrl) { hero.src = item.coverUrl; hero.alt = `غلاف مشروع ${item.title}`; }
      else hero.closest(".project-hero-preview").hidden = true;
      document.getElementById("splitEaseShowcase").hidden = true;
      document.getElementById("storeHubShowcase").hidden = true;
      document.getElementById("gymosAppShowcase").hidden = true;
      document.querySelector(".project-page")?.classList.add("managed-project-detail");
    } catch { showMissing(); }
  }

  function showMissing() {
    document.querySelector(".project-page").innerHTML = '<section class="project-missing"><span class="section-kicker">المشروع مش موجود</span><h1>خلّينا نرجع للشغل.</h1><a class="project-primary" href="services.html#work-showcase">ارجع للمشاريع ↙</a></section>';
  }
})();
