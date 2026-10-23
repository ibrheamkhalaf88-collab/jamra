(() => {
  const $ = (q, root = document) => root.querySelector(q);
  const gate = $("#adminGate"), app = $("#adminApp"), signIn = $("#adminSignIn"), toast = $("#adminToast");
  const form = $("#projectForm"), media = $("#projectMedia"), videoFile = $("#projectVideo"), galleryInput = $("#projectGallery"), preview = $("#mediaPreview"), galleryPreview = $("#galleryPreview");
  const statusLabels = { new: "جديد", in_progress: "قيد المتابعة", waiting_client: "بانتظار رد العميل", closed: "مغلق" };
  let projects = [], leads = [], portfolioCatalog = [], selectedLead = "", currentProjectMedia = "", galleryAssets = [];

  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const date = (value) => { try { return new Intl.DateTimeFormat("ar", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); } catch { return ""; } };
  const notify = (message) => { toast.textContent = message; toast.classList.add("show"); setTimeout(() => toast.classList.remove("show"), 3000); };
  async function api(url, options = {}) {
    const response = await fetch(url, { ...options, headers: { ...(options.body instanceof FormData ? {} : { "content-type": "application/json" }), ...(options.headers || {}) } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401 && data.signInUrl) { signIn.href = data.signInUrl; signIn.hidden = false; gate.hidden = false; app.hidden = true; }
      throw new Error(data.error || "تعذّر تنفيذ العملية. جرّب مرة ثانية.");
    }
    return data;
  }

  async function start() {
    try {
      const session = await api("/api/admin/session");
      if (session.authMode === "password") $("#adminLogout").hidden = false;
      if (!session.signedIn) { $("#gateCopy").textContent = "سجّل دخولك بحساب الفريق المصرّح له لإدارة المشاريع والطلبات."; signIn.href = session.signInUrl; signIn.hidden = false; return; }
      if (!session.allowed) { $("#gateCopy").textContent = "هذا الحساب غير مخوّل لإدارة الموقع. استخدم حساب جَمْرَة المصرّح له."; return; }
      gate.hidden = true; app.hidden = false;
      await Promise.all([loadProjects(), loadLeads(), loadPortfolioCatalog()]);
      setInterval(() => Promise.all([loadLeads(true), loadProjects(true)]), 30000);
    } catch (error) { $("#gateCopy").textContent = error.message; }
  }

  async function loadProjects(silent = false) {
    try {
      const data = await api("/api/admin/projects"); projects = data.projects || [];
      $("#projectCount").textContent = projects.length; renderProjects(); renderPortfolioCatalog(); renderOverview();
    } catch (error) { if (!silent) notify(error.message); }
  }
  async function loadPortfolioCatalog() {
    const target = $("#portfolioCatalog");
    try {
      const response = await fetch(`/services.html?catalog=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error("catalog unavailable");
      const doc = new DOMParser().parseFromString(await response.text(), "text/html");
      const absolute = (value) => { try { return new URL(value, location.origin).href; } catch { return ""; } };
      portfolioCatalog = [...doc.querySelectorAll(".showcase-card[data-kind]")].map((card, index) => {
        const video = card.querySelector("video source[src]");
        const preview = card.querySelector("video[poster], img[src]");
        const link = card.querySelector(".showcase-open[href], .site-preview[href]");
        return { id: `showcase-${index}`, title: card.querySelector("h3")?.textContent?.trim() || "عمل من معرض جَمْرَة", category: card.dataset.kind === "website" ? "website" : card.dataset.kind, summary: card.querySelector(".showcase-card-copy p")?.textContent?.trim() || "", imageUrl: absolute(preview?.getAttribute("poster") || preview?.getAttribute("src") || ""), videoUrl: absolute(video?.getAttribute("src") || ""), projectUrl: absolute(link?.getAttribute("href") || ""), source: "site" };
      });
      const caseCard = doc.querySelector(".case-caption");
      if (caseCard) {
        const caseLink = doc.querySelector(".case-link[href]");
        portfolioCatalog.unshift({ id: "case-taqat", title: caseCard.querySelector("h2")?.textContent?.replace(/—.*$/, "").trim() || "طاقات", category: "campaign", summary: doc.querySelector(".case-story p")?.textContent?.trim() || "", imageUrl: "", videoUrl: "", projectUrl: absolute(caseLink?.getAttribute("href") || "taqat.html"), source: "site" });
      }
      renderPortfolioCatalog(); renderOverview();
    } catch {
      target.innerHTML = '<div class="admin-empty">تعذّر تحميل الأعمال الموجودة على الموقع. جرّب تحديث الصفحة.</div>';
      renderOverview();
    }
  }
  function renderPortfolioCatalog() {
    const target = $("#portfolioCatalog");
    if (!target) return;
    const managedTitles = new Set(projects.map((p) => p.title.trim().toLocaleLowerCase("ar")));
    const items = portfolioCatalog.filter((p) => !managedTitles.has(p.title.trim().toLocaleLowerCase("ar")));
    target.innerHTML = items.length ? items.map((p) => {
      const media = p.imageUrl ? `<img src="${esc(p.imageUrl)}" alt="${esc(p.title)}" loading="lazy">` : p.videoUrl ? `<video src="${esc(p.videoUrl)}" muted playsinline preload="metadata"></video>` : `<span>${esc((p.title || "ج").trim().slice(0, 1))}</span>`;
      const url = p.projectUrl || p.videoUrl || "/services.html#work-showcase";
      return `<article class="catalog-card"><a class="catalog-media" href="${esc(url)}" target="_blank" rel="noopener">${media}</a><div class="catalog-copy"><span>${esc(({website:"موقع أو تطبيق",video:"فيديو وموشن",design:"تصميم وهوية",campaign:"حملة تسويقية"})[p.category] || "من أعمالنا")}</span><h3>${esc(p.title)}</h3><p>${esc(p.summary)}</p><a href="${esc(url)}" target="_blank" rel="noopener">مشاهدة العمل ↗</a></div></article>`;
    }).join("") : '<div class="admin-empty">كل أعمال الموقع موجودة في قائمة مشاريع الإدارة.</div>';
  }
  function renderProjects() {
    const target = $("#projectList");
    if (!projects.length) { target.innerHTML = '<div class="admin-empty">المشاريع القابلة للتعديل تظهر هون بعد إضافتها. أعمال الموقع الحالية موجودة بالمعرض أسفل هذه القائمة. <a href="#portfolioCatalog" class="catalog-jump">عرض الأعمال الموجودة ↓</a></div>'; return; }
    const query = $("#projectSearch").value.trim().toLowerCase(), category = $("#projectFilter").value;
    const filtered = projects.filter((p) => (category === "all" || p.category === category) && `${p.title} ${p.summary} ${p.description}`.toLowerCase().includes(query));
    $("#projectSummary").textContent = `ظاهر للزوار: ${projects.filter((p) => p.published).length} · مخفي: ${projects.filter((p) => !p.published).length} · المعروض: ${filtered.length}`;
    if (!filtered.length) { target.innerHTML = '<div class="admin-empty">ما لقينا مشاريع بهالبحث. جرّبوا كلمة ثانية أو أضيفوا مشروعًا جديدًا.</div>'; return; }
    target.innerHTML = filtered.map((p) => {
      let storedVideo = false; try { const url = new URL(p.videoUrl, location.origin); storedVideo = /\.(mp4|webm)$/i.test(url.searchParams.get("key") || url.pathname); } catch {}
      const preview = p.coverUrl ? `<img src="${esc(p.coverUrl)}" alt="" loading="lazy">` : (storedVideo ? `<video src="${esc(p.videoUrl)}" muted playsinline></video>` : '<div class="admin-empty">بدون صورة غلاف</div>');
      return `<article class="project-card">${preview}<div class="project-card-copy"><h3>${esc(p.title)}</h3><p>${esc(p.summary || p.description || "")}</p><div class="project-card-meta"><span>${esc(({website:"موقع",app:"تطبيق / نظام",video:"فيديو وموشن",design:"تصميم وهوية",campaign:"حملة"})[p.category] || "مشروع")}</span><span>${(p.gallery || []).length} صور داخلية</span></div><div class="project-card-actions"><span class="status-pill">${p.published ? "ظاهر للزوار" : "مخفي"}</span><span class="project-actions"><a href="/project.html?project=${encodeURIComponent(p.id)}" target="_blank" rel="noopener">معاينة ↗</a><button type="button" data-edit="${esc(p.id)}">تعديل</button><button type="button" data-toggle="${esc(p.id)}">${p.published ? "إخفاء" : "إظهار"}</button></span></div></div></article>`;
    }).join("");
  }

  async function loadLeads(silent = false) {
    try {
      const data = await api("/api/admin/leads"); leads = data.leads || [];
      $("#leadCount").textContent = leads.filter((l) => l.status !== "closed").length; renderLeads(); renderOverview();
      if (selectedLead) await openLead(selectedLead, true);
    } catch (error) { if (!silent) notify(error.message); }
  }
  function renderLeads() {
    const target = $("#leadList");
    if (!leads.length) { target.innerHTML = '<div class="admin-empty">ما في طلبات جديدة لحد الآن.</div>'; return; }
    const query = $("#leadSearch").value.trim().toLocaleLowerCase("ar"), status = $("#leadFilter").value;
    const filtered = leads.filter((l) => (status === "all" || l.status === status) && `${l.name} ${l.service} ${l.goal} ${l.contact}`.toLocaleLowerCase("ar").includes(query));
    $("#leadSummary").textContent = `المعروض ${filtered.length} من ${leads.length} · جديد ${leads.filter((l) => l.status === "new").length}`;
    if (!filtered.length) { target.innerHTML = '<div class="admin-empty">ما لقينا طلبات مطابقة. غيّر البحث أو فلتر الحالة.</div>'; return; }
    target.innerHTML = filtered.map((l) => `<button class="lead-row ${l.id === selectedLead ? "selected" : ""}" type="button" data-lead="${esc(l.id)}"><div class="lead-row-meta"><b>${esc(l.name)}</b><span class="status-pill status-${esc(l.status)}">${esc(statusLabels[l.status] || l.status)}</span></div><span>${esc(l.service)} · ${esc(date(l.updatedAt))}</span></button>`).join("");
  }
  function renderOverview() {
    const open = leads.filter((l) => l.status !== "closed").length;
    const newCount = leads.filter((l) => l.status === "new").length;
    const closed = leads.filter((l) => l.status === "closed").length;
    const managedTitles = new Set(projects.map((p) => p.title.trim().toLocaleLowerCase("ar")));
    const catalogItems = portfolioCatalog.filter((p) => !managedTitles.has(p.title.trim().toLocaleLowerCase("ar")));
    const visible = projects.filter((p) => p.published).length, hidden = projects.length - visible;
    const allCount = projects.length + catalogItems.length;
    $("#statProjects").textContent = allCount;
    $("#statPublished").textContent = `${visible + catalogItems.length} عمل ظاهر على الموقع`;
    $("#statVisibleProjects").textContent = visible + catalogItems.length;
    $("#statHiddenProjects").textContent = hidden;
    $("#statOpenLeads").textContent = open;
    $("#statNewLeads").textContent = newCount;
    $("#statClosedLeads").textContent = closed;
    const max = Math.max(1, leads.length);
    $("#pipelineBars").innerHTML = Object.entries(statusLabels).map(([key, label]) => {
      const count = leads.filter((l) => l.status === key).length;
      return `<div class="pipeline-row"><div><span>${esc(label)}</span><b>${count}</b></div><span class="pipeline-track"><i class="pipeline-${esc(key)}" style="width:${Math.round(count / max * 100)}%"></i></span></div>`;
    }).join("") || '<div class="admin-empty">ما في بيانات طلبات حتى الآن.</div>';
    const recent = leads.slice(0, 5);
    $("#recentLeads").innerHTML = recent.length ? recent.map((l) => `<button type="button" class="recent-lead" data-open-lead="${esc(l.id)}"><span class="recent-avatar">${esc((l.name || "؟").trim().slice(0, 1))}</span><span class="recent-main"><b>${esc(l.name)}</b><small>${esc(l.service)} · ${esc(date(l.updatedAt))}</small></span><span class="status-pill status-${esc(l.status)}">${esc(statusLabels[l.status] || l.status)}</span><span class="recent-arrow">←</span></button>`).join("") : '<div class="admin-empty">لما توصل أول رسالة من الموقع، رح تظهر هون.</div>';
    const categoryLabels = { website: "موقع إلكتروني", app: "تطبيق / نظام", video: "فيديو وموشن", design: "تصميم وهوية", campaign: "حملة تسويقية" };
    const dashboardItems = [...projects.map((p) => ({ ...p, source: "managed" })), ...catalogItems];
    $("#dashboardProjects").innerHTML = dashboardItems.length ? dashboardItems.map((p) => {
      const image = p.coverUrl || p.imageUrl || "";
      const media = image ? `<img src="${esc(image)}" alt="${esc(p.title)}" loading="lazy">` : p.videoUrl ? `<video src="${esc(p.videoUrl)}" muted playsinline preload="metadata"></video>` : `<span>${esc((p.title || "ج").trim().slice(0, 1))}</span>`;
      const label = p.source === "managed" ? (p.published ? "ظاهر للزوار" : "مخفي") : "موجود بالموقع";
      const action = p.source === "managed" ? `<button type="button" class="dashboard-project-edit" data-go-tab="projects">إدارة ↖</button>` : `<a class="dashboard-project-edit" href="${esc(p.projectUrl || p.videoUrl || "/services.html#work-showcase")}" target="_blank" rel="noopener">مشاهدة ↗</a>`;
      return `<article class="dashboard-project"><div class="dashboard-project-thumb">${media}</div><div class="dashboard-project-info"><div class="dashboard-project-meta"><span>${esc(categoryLabels[p.category] || "عمل إبداعي")}</span><span class="status-pill ${p.source === "managed" ? (p.published ? "status-live" : "status-closed") : "catalog-status"}">${label}</span></div><h4>${esc(p.title)}</h4><p>${esc(p.summary || p.description || "عمل من معرض جَمْرَة.")}</p></div>${action}</article>`;
    }).join("") : '<div class="admin-empty">ما في مشاريع محفوظة أو أعمال موجودة بالموقع.</div>';
    $("#dashboardUpdated").textContent = `آخر تحديث للبيانات: ${new Intl.DateTimeFormat("ar", { timeStyle: "short" }).format(new Date())} · تتحدث تلقائيًا كل 30 ثانية`;
  }
  async function openLead(id, silent = false) {
    selectedLead = id; renderLeads();
    try {
      const { inquiry: l, messages } = await api(`/api/admin/leads/${encodeURIComponent(id)}`);
      const methodLabel = { whatsapp: "مكالمة صوتية على واتساب", phone: "اتصال هاتفي", email: "بريد إلكتروني", zoom: "طلب اجتماع Zoom", site: "محادثة الموقع" }[l.contactMethod] || l.contactMethod;
      const digits = String(l.contact || "").replace(/\D/g, "");
      const contactLink = l.contactMethod === "email" ? `mailto:${encodeURIComponent(l.contact)}` : l.contactMethod === "phone" ? `tel:${encodeURIComponent(l.contact)}` : l.contactMethod === "site" ? "" : l.contactMethod === "zoom" && String(l.contact).includes("@") ? `mailto:${encodeURIComponent(l.contact)}` : `https://wa.me/${encodeURIComponent(digits)}`;
      $("#leadDetail").innerHTML = `<div class="lead-detail-head"><div><h3>${esc(l.name)}</h3><p>${esc(l.service)} · وصل ${esc(date(l.createdAt))}</p></div>${contactLink ? `<a class="admin-button" href="${contactLink}" target="_blank" rel="noopener">تواصل مباشر ↗</a>` : ""}</div>
      <div class="lead-meta"><div><b>طريقة التواصل</b>${esc(methodLabel)} · ${esc(l.contact)}</div><div><b>كيف عرفنا؟</b>${esc(l.source || "—")}</div><div><b>الخدمة المطلوبة</b>${esc(l.service)}</div><div><b>نوع الفكرة والهدف والوقت المناسب</b>${esc(l.goal)}</div></div>
      <div class="chat-thread" id="adminThread">${messages.map((m) => `<div class="chat-message ${m.author === "team" ? "team" : "client"}">${esc(m.body)}<time>${m.author === "team" ? "فريق جَمْرَة" : esc(l.name)} · ${esc(date(m.createdAt))}</time></div>`).join("")}</div>
      <form class="reply-form" id="replyForm"><textarea name="message" rows="2" maxlength="1200" placeholder="اكتب ردّك، ورح يظهر للعميل داخل المحادثة…" required></textarea><button class="admin-button primary" type="submit">إرسال الرد</button></form>
      <div class="lead-actions"><label class="section-kicker" for="leadStatus">حالة الطلب</label><select id="leadStatus"><option value="new">جديد</option><option value="in_progress">قيد المتابعة</option><option value="waiting_client">بانتظار رد العميل</option><option value="closed">مغلق</option></select></div>`;
      $("#leadStatus").value = l.status;
      const thread = $("#adminThread"); thread.scrollTop = thread.scrollHeight;
      $("#replyForm").addEventListener("submit", async (event) => {
        event.preventDefault(); const field = event.currentTarget.elements.message; const message = field.value.trim(); if (!message) return;
        field.disabled = true;
        try { await api(`/api/admin/leads/${encodeURIComponent(id)}`, { method: "POST", body: JSON.stringify({ message }) }); await loadLeads(true); notify("وصل ردّك للمحادثة."); }
        catch (error) { notify(error.message); field.disabled = false; }
      });
      $("#leadStatus").addEventListener("change", async (event) => { try { await api(`/api/admin/leads/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ status: event.target.value }) }); await loadLeads(true); notify("تحدّثت حالة الطلب."); } catch (error) { notify(error.message); } });
    } catch (error) { if (!silent) notify(error.message); }
  }

  function drawGallery() {
    galleryPreview.innerHTML = galleryAssets.map((item, index) => `<div class="gallery-preview-item"><img src="${esc(item.previewUrl || item.url)}" alt="${esc(item.alt || "لقطة من المشروع")}"><button type="button" data-remove-gallery="${index}" aria-label="إزالة الصورة">×</button></div>`).join("");
    galleryPreview.hidden = galleryAssets.length === 0;
  }
  function resetProject() { form.reset(); form.elements.id.value = ""; form.elements.coverKey.value = ""; form.elements.published.checked = true; currentProjectMedia = ""; galleryAssets = []; preview.hidden = true; preview.innerHTML = ""; galleryPreview.innerHTML = ""; galleryPreview.hidden = true; $("#formTitle").textContent = "إضافة مشروع"; $("#projectFeedback").textContent = ""; }
  $("#newProject").addEventListener("click", () => { resetProject(); form.hidden = false; form.scrollIntoView({ behavior: "smooth", block: "start" }); });
  $("#cancelProject").addEventListener("click", () => { form.hidden = true; resetProject(); });
  media.addEventListener("change", () => { const file = media.files?.[0]; if (!file) return; currentProjectMedia = URL.createObjectURL(file); preview.hidden = false; preview.innerHTML = `<img src="${currentProjectMedia}" alt="معاينة الغلاف"><span>${esc(file.name)}</span>`; });
  videoFile.addEventListener("change", () => { const file = videoFile.files?.[0]; if (!file) return; currentProjectMedia = URL.createObjectURL(file); preview.hidden = false; preview.innerHTML = `<video src="${currentProjectMedia}" controls></video><span>${esc(file.name)}</span>`; });
  galleryInput.addEventListener("change", () => {
    const picked = [...(galleryInput.files || [])];
    if (galleryAssets.length + picked.length > 8) { $("#projectFeedback").textContent = "اختاروا 8 صور كحد أقصى."; galleryInput.value = ""; return; }
    picked.forEach((file) => galleryAssets.push({ file, alt: file.name, previewUrl: URL.createObjectURL(file) })); galleryInput.value = ""; drawGallery();
  });
  galleryPreview.addEventListener("click", (event) => { const button = event.target.closest("[data-remove-gallery]"); if (!button) return; galleryAssets.splice(Number(button.dataset.removeGallery), 1); drawGallery(); });
  form.addEventListener("submit", async (event) => {
    event.preventDefault(); const button = form.querySelector('button[type="submit"]'); button.disabled = true; $("#projectFeedback").textContent = "جاري الحفظ…";
    try {
      const data = new FormData(form); let coverKey = data.get("coverKey") || ""; let videoUrl = data.get("videoUrl") || "";
      const file = media.files?.[0];
      if (file) { const upload = new FormData(); upload.set("file", file); const uploaded = await api("/api/admin/upload", { method: "POST", body: upload }); if (file.type.startsWith("image/")) coverKey = uploaded.key; else videoUrl = uploaded.url; }
      const clip = videoFile.files?.[0];
      if (clip) { const upload = new FormData(); upload.set("file", clip); const uploaded = await api("/api/admin/upload", { method: "POST", body: upload }); videoUrl = uploaded.url; }
      for (const item of galleryAssets) if (item.file) { const upload = new FormData(); upload.set("file", item.file); const uploaded = await api("/api/admin/upload", { method: "POST", body: upload }); item.key = uploaded.key; delete item.file; delete item.previewUrl; }
      const payload = { title: data.get("title"), category: data.get("category"), summary: data.get("summary"), description: data.get("description"), features: String(data.get("features") || "").split(/\r?\n/).map((v) => v.trim()).filter(Boolean), projectUrl: data.get("projectUrl"), videoUrl, coverKey, gallery: galleryAssets.map((item) => ({ key: item.key, alt: item.alt })), published: data.has("published") };
      if (data.get("id")) await api(`/api/admin/projects/${encodeURIComponent(data.get("id"))}`, { method: "PATCH", body: JSON.stringify(payload) });
      else await api("/api/admin/projects", { method: "POST", body: JSON.stringify(payload) });
      form.hidden = true; resetProject(); await loadProjects(true); notify("انحفظ المشروع.");
    } catch (error) { $("#projectFeedback").textContent = error.message; }
    finally { button.disabled = false; }
  });

  $("#projectList").addEventListener("click", async (event) => {
    const edit = event.target.closest("[data-edit]");
    if (edit) { const p = projects.find((item) => item.id === edit.dataset.edit); if (!p) return; resetProject(); form.hidden = false; form.elements.id.value = p.id; form.elements.title.value = p.title; form.elements.category.value = p.category; form.elements.summary.value = p.summary; form.elements.description.value = p.description; form.elements.features.value = (p.features || []).join("\n"); form.elements.projectUrl.value = p.projectUrl; form.elements.videoUrl.value = p.videoUrl; form.elements.coverKey.value = p.coverKey; form.elements.published.checked = Boolean(p.published); galleryAssets = (p.gallery || []).map((item) => ({ key: item.key, url: item.url, alt: item.alt })); drawGallery(); $("#formTitle").textContent = "تعديل المشروع"; if (p.coverUrl) { preview.hidden = false; preview.innerHTML = `<img src="${esc(p.coverUrl)}" alt="غلاف المشروع"><span>الغلاف الحالي</span>`; } form.scrollIntoView({ behavior: "smooth", block: "start" }); }
    const toggle = event.target.closest("[data-toggle]");
    if (toggle) { const p = projects.find((item) => item.id === toggle.dataset.toggle); if (!p) return; try { await api(`/api/admin/projects/${encodeURIComponent(p.id)}`, { method: "PATCH", body: JSON.stringify({ published: !p.published }) }); await loadProjects(true); notify(p.published ? "أُخفي المشروع من الموقع مع الاحتفاظ به." : "صار المشروع ظاهرًا للزوار."); } catch (error) { notify(error.message); } }
  });

  $("#leadList").addEventListener("click", (event) => { const row = event.target.closest("[data-lead]"); if (row) openLead(row.dataset.lead); });
  $("#refreshLeads").addEventListener("click", () => Promise.all([loadLeads(), loadProjects()]));
  $("#refreshDashboard").addEventListener("click", async () => { await Promise.all([loadProjects(), loadLeads()]); notify("تحدّث ملخص لوحة التحكم."); });
  $("#leadSearch").addEventListener("input", renderLeads);
  $("#leadFilter").addEventListener("change", renderLeads);
  $("#exportLeads").addEventListener("click", () => {
    const safeCell = (value) => { const text = String(value ?? "").replace(/[\r\n]+/g, " "); return `"${(/^[=+@\-]/.test(text) ? "'" : "") + text.replace(/"/g, '""')}"`; };
    const rows = [["الاسم", "الخدمة", "الحالة", "طريقة التواصل", "التواصل", "المصدر", "الهدف", "تاريخ الإنشاء"], ...leads.map((l) => [l.name, l.service, statusLabels[l.status] || l.status, l.contactMethod, l.contact, l.source, l.goal, date(l.createdAt)])];
    const csv = "\uFEFF" + rows.map((row) => row.map(safeCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); const link = document.createElement("a"); link.href = url; link.download = `jamra-leads-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(url);
  });
  $("#recentLeads").addEventListener("click", (event) => { const row = event.target.closest("[data-open-lead]"); if (row) { switchTab("leads"); openLead(row.dataset.openLead); } });
  $("#dashboardProjects").addEventListener("click", (event) => { if (event.target.closest("[data-go-tab]")) switchTab("projects"); });
  $("#quickNewProject").addEventListener("click", () => { switchTab("projects"); $("#newProject").click(); });
  $("#projectSearch").addEventListener("input", renderProjects);
  $("#projectFilter").addEventListener("change", renderProjects);
  function switchTab(name) {
    document.querySelectorAll(".admin-tabs button").forEach((tab) => { const active = tab.dataset.tab === name; tab.classList.toggle("active", active); tab.setAttribute("aria-selected", String(active)); });
    $("#overviewPanel").hidden = name !== "overview"; $("#leadsPanel").hidden = name !== "leads"; $("#projectsPanel").hidden = name !== "projects";
  }
  document.querySelectorAll(".admin-tabs button").forEach((button) => button.addEventListener("click", () => switchTab(button.dataset.tab)));
  document.querySelectorAll("[data-go-tab]").forEach((button) => button.addEventListener("click", () => switchTab(button.dataset.goTab)));
  $("#adminLogout").addEventListener("click", async () => {
    try { await fetch("/api/admin/logout", { method: "POST" }); } finally { location.replace("/admin-login.html"); }
  });
  start();
})();
