(() => {
  const thread = document.querySelector("#chatThread"), controls = document.querySelector("#chatControls"), progress = document.querySelector("#progressBar"), stepLabel = document.querySelector("#stepLabel");
  const storageKey = "jamra-intake-v1";
  const TEAM_EMAIL = "ibrheamshady@gmail.com";
  const state = { name: "", source: "", ideaType: "", goal: "", service: "", contact: "", contactMethod: "site", meetingTime: "", step: 0, history: [], ticket: "", token: "" };
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  function save() { try { localStorage.setItem(storageKey, JSON.stringify({ ticket: state.ticket, token: state.token, history: state.history, name: state.name })); } catch {} }
  function addMessage(who, text, time = new Date().toISOString()) {
    state.history.push({ who, text, time });
    const el = document.createElement("div"); el.className = `intake-message ${who}`; el.textContent = text;
    if (who === "user" || who === "team") { const t = document.createElement("time"); t.textContent = new Intl.DateTimeFormat("ar", { hour: "numeric", minute: "2-digit" }).format(new Date(time)); el.append(t); }
    thread.append(el); thread.scrollTop = thread.scrollHeight; save();
  }
  function renderHistory(items) { thread.replaceChildren(); state.history = items || []; for (const item of state.history) { const el = document.createElement("div"); el.className = `intake-message ${item.who}`; el.textContent = item.text; if (item.who === "user" || item.who === "team") { const t = document.createElement("time"); try { t.textContent = new Intl.DateTimeFormat("ar", { hour: "numeric", minute: "2-digit" }).format(new Date(item.time)); } catch {} el.append(t); } thread.append(el); } thread.scrollTop = thread.scrollHeight; }
  function setProgress(n, label) { state.step = n; progress.style.width = `${Math.min(100, Math.round(n / 6 * 100))}%`; stepLabel.textContent = label; }
  function say(text, delay = 360) { controls.innerHTML = '<small>جاري تجهيز السؤال التالي…</small>'; setTimeout(() => { addMessage("bot", text); }, delay); }
  function inputControl({ placeholder, multiline = false, button = "التالي ↙", hint = "" }, submit) {
    controls.innerHTML = `<form id="stepForm">${multiline ? `<textarea class="intake-input" name="answer" maxlength="2000" required placeholder="${esc(placeholder)}"></textarea>` : `<input class="intake-input" name="answer" maxlength="160" required placeholder="${esc(placeholder)}" autocomplete="off">`}${hint ? `<small>${esc(hint)}</small>` : ""}<div class="intake-actions"><button class="intake-button primary" type="submit">${esc(button)}</button></div><div class="intake-error" role="status"></div></form>`;
    const field = controls.querySelector("[name=answer]"); field.focus();
    controls.querySelector("form").addEventListener("submit", (event) => { event.preventDefault(); const value = field.value.trim(); if (value) submit(value, controls.querySelector(".intake-error")); });
  }
  function choiceControl(choices, submit) {
    controls.innerHTML = `<div class="intake-choice-list">${choices.map((choice) => `<button class="intake-button choice" type="button" data-choice="${esc(choice)}">${esc(choice)}</button>`).join("")}</div><div class="intake-error" role="status"></div>`;
    controls.querySelectorAll("[data-choice]").forEach((button) => button.addEventListener("click", () => submit(button.dataset.choice, controls.querySelector(".intake-error"))));
  }
  function nextQuestion() {
    setProgress(1, "بداية الحكاية");
    addMessage("bot", "أهلًا فيك! بنمشي سوا خطوة خطوة. شو الاسم اللي بنناديك فيه؟");
    inputControl({ placeholder: "اسمك أو اسم مشروعك" }, (v) => {
      state.name = v; addMessage("user", v); setProgress(2, "كيف عرفتنا؟");
      say(`تشرفنا يا ${v} 🔥\nمن وين عرفت عن جَمْرَة؟`);
      setTimeout(() => choiceControl(["إنستغرام", "فيسبوك", "تيك توك", "صديق أو زميل", "بحث على الإنترنت", "مكان ثاني"], chooseSource), 390);
    });
  }
  function chooseSource(value) {
    state.source = value; addMessage("user", value); setProgress(3, "نوع الفكرة");
    say("أي نوع من الأفكار أو المشاريع ببالك؟ اختار الأقرب، حتى لو لسا مش متأكد.", 180);
    setTimeout(() => choiceControl(["موقع أو متجر إلكتروني", "تطبيق أو نظام", "هوية أو تصميم", "فيديو أو موشن جرافيك", "حملة تسويقية", "فكرة ثانية", "لسا ببحث عن فكرة"], chooseIdeaType), 390);
  }
  function chooseIdeaType(value) {
    state.ideaType = value; addMessage("user", value); setProgress(4, "هدفك وفكرتك");
    say("حلو. شو الفكرة أو النتيجة اللي حاب توصلها؟", 180);
    setTimeout(() => inputControl({ placeholder: "احكيلنا عن فكرتك أو المنتج أو الرسالة…", multiline: true, hint: "اكتب براحتك، حتى لو الفكرة لسا ببدايتها." }, (v) => {
      state.goal = v; addMessage("user", v); setProgress(5, "الخدمة المناسبة");
      say("فهمنا عليك. أي خدمة حاسس إنها بتساعد فكرتك؟", 180);
      setTimeout(() => choiceControl(["موقع أو متجر إلكتروني", "تطبيق أو نظام", "تصميم وهوية بصرية", "فيديو أو موشن جرافيك", "حملة تسويقية", "مش متأكد، ساعدوني أختار"], chooseService), 390);
    }), 390);
  }
  function chooseService(value) {
    state.service = value; addMessage("user", value); setProgress(6, "طريقة المتابعة");
    say("كيف بتحب نكمل معك؟ اختار مكالمة، اجتماع، بريد، أو محادثة الموقع.", 180);
    setTimeout(() => choiceControl(["مكالمة صوتية على واتساب", "اجتماع عبر Zoom", "إرسال بالبريد الإلكتروني", "متابعة داخل الموقع"], chooseContactMethod), 390);
  }
  function chooseContactMethod(label) {
    const methods = { "مكالمة صوتية على واتساب": "whatsapp", "اجتماع عبر Zoom": "zoom", "إرسال بالبريد الإلكتروني": "email", "متابعة داخل الموقع": "site" };
    state.contactMethod = methods[label] || "site"; addMessage("user", label);
    const prompts = {
      whatsapp: "اكتب رقم واتسابك مع مفتاح الدولة. الفريق رح يشوف طلبك ويتواصل معك لمكالمة صوتية.",
      zoom: "اكتب بريدك أو رقم واتسابك، وحدد وقتًا مناسبًا لاجتماع Zoom. الفريق رح ينسق معك ويرسل رابط اللقاء.",
      email: "اكتب بريدك الإلكتروني. رح نحفظ الطلب بالموقع، وتقدر كمان تفتح رسالة جاهزة بالبريد لفريق جَمْرَة.",
      site: "طلبك ومحادثتك رح يظلوا محفوظين هون بالموقع. ما في داعي تترك رقمك إذا بتفضل نكمل هون."
    };
    say(prompts[state.contactMethod], 180); setTimeout(showContact, 390);
  }
  function buildRequestDetails() {
    return [`نوع الفكرة: ${state.ideaType}`, `تفاصيل الفكرة والهدف: ${state.goal}`, `الخدمة المطلوبة: ${state.service}`, `طريقة المتابعة: ${({ whatsapp: "مكالمة صوتية على واتساب", zoom: "اجتماع عبر Zoom", email: "البريد الإلكتروني", site: "محادثة الموقع" })[state.contactMethod] || state.contactMethod}`, state.meetingTime ? `الوقت المناسب لاجتماع Zoom: ${state.meetingTime}` : ""].filter(Boolean).join("\n");
  }
  function teamEmailDraft() {
    const subject = encodeURIComponent(`طلب جديد من ${state.name} — جَمْرَة`);
    const body = encodeURIComponent(`أهلًا فريق جَمْرَة،\n\n${buildRequestDetails()}\n\nوسيلة التواصل: ${state.contact}\nكيف عرفنا: ${state.source}\n`);
    return `mailto:${TEAM_EMAIL}?subject=${subject}&body=${body}`;
  }
  function showContact() {
    const needsContact = state.contactMethod !== "site";
    const contactLabel = state.contactMethod === "email" ? "بريدك الإلكتروني" : state.contactMethod === "zoom" ? "بريدك أو رقم واتسابك" : "رقم واتسابك مع مفتاح الدولة";
    const placeholder = state.contactMethod === "email" ? "name@example.com" : state.contactMethod === "zoom" ? "رقم الهاتف أو البريد" : "+970…";
    const type = state.contactMethod === "email" ? "email" : "text";
    controls.innerHTML = `<form id="contactForm">${needsContact ? `<label class="field-label">${esc(contactLabel)}<input class="intake-input" name="contact" type="${type}" ${state.contactMethod !== "zoom" ? "required" : ""} maxlength="160" placeholder="${placeholder}" autocomplete="${state.contactMethod === "email" ? "email" : "tel"}"></label>` : '<div class="intake-note-card">رح نفتحلك محادثة خاصة مع فريق جَمْرَة بعد إرسال الطلب.</div>'}${state.contactMethod === "zoom" ? '<label class="field-label">وقت مناسب للقاء <input class="intake-input" name="meetingTime" maxlength="120" placeholder="مثال: الثلاثاء بعد الساعة 4" required></label>' : ""}<label class="intake-honeypot" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label><div class="intake-actions"><button class="intake-button primary" type="submit">إرسال الطلب وفتح المحادثة ↙</button></div><div class="intake-error" role="status"></div><small>${state.contactMethod === "site" ? "طلبك بينحفظ بلوحة الفريق، وبتقدر تكملوا هون برسائل خاصة." : "تفاصيل الطلب بتوصل للفريق داخل لوحة جَمْرَة، وبننسق معك حسب طريقة التواصل اللي اخترتها."}</small></form>`;
    const field = controls.querySelector('[name="contact"]'); field?.focus();
    controls.querySelector("form").addEventListener("submit", async (event) => {
      event.preventDefault(); const data = new FormData(event.currentTarget); state.contact = String(data.get("contact") || "محادثة الموقع").trim(); state.meetingTime = String(data.get("meetingTime") || "").trim();
      if (state.contactMethod === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.contact)) { controls.querySelector(".intake-error").textContent = "اكتب بريدًا إلكترونيًا صحيحًا."; return; }
      if (state.contactMethod === "whatsapp" && state.contact.replace(/\D/g, "").length < 8) { controls.querySelector(".intake-error").textContent = "اكتب رقم واتساب مع مفتاح الدولة."; return; }
      if (state.contactMethod === "zoom" && state.contact.length < 5) { controls.querySelector(".intake-error").textContent = "اكتب بريدك أو رقم واتسابك عشان ننسق اللقاء."; return; }
      const requestDetails = buildRequestDetails();
      addMessage("user", state.contactMethod === "site" ? "أفضل المتابعة داخل الموقع" : `بيانات التواصل: ${state.contact}`); controls.innerHTML = '<small>بنرسل التفاصيل لفريق جَمْرَة…</small>';
      try {
        const response = await fetch("/api/intake", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: state.name, source: state.source, goal: requestDetails, service: state.service, contact: state.contact, contactMethod: state.contactMethod, website: data.get("website") }) });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || "ما قدرنا نرسل الطلب. جرّب مرة ثانية.");
        if (!result.ticket || !result.token) { addMessage("bot", "وصلتنا رسالتك، شكرًا لثقتك بجَمْرَة. رح نراجعها ونتابع معك."); controls.innerHTML = ""; return; }
        state.ticket = result.ticket; state.token = result.token; save();
        history.replaceState(null, "", `#ticket=${encodeURIComponent(state.ticket)}&key=${encodeURIComponent(state.token)}`);
        addMessage("bot", "وصل طلبك لفريق جَمْرَة 🔥\nتقدر تتابع معنا من المحادثة هون. وإذا اخترت البريد، بتقدر تفتح رسالة جاهزة وتبعتها كمان.");
        await openChat(true);
      } catch (error) { controls.innerHTML = `<div class="intake-error">${esc(error.message)}</div><button class="intake-button" id="retryContact">حاول مرة ثانية</button>`; controls.querySelector("#retryContact").onclick = showContact; }
    });
  }

  function authHeader() { return { authorization: `Bearer ${state.token}` }; }
  async function syncChat(initial = false) {
    if (!state.ticket || !state.token) return;
    const response = await fetch(`/api/intake/${encodeURIComponent(state.ticket)}`, { headers: authHeader(), cache: "no-store" });
    if (!response.ok) throw new Error("ما قدرنا نفتح المحادثة. استخدم رابط المتابعة اللي حفظته.");
    const data = await response.json();
    if (initial) {
      const seen = new Set(state.history.filter((m) => m.who !== "bot").map((m) => m.text));
      for (const m of data.messages || []) if (!seen.has(m.body)) { const who = m.author === "team" ? "team" : "user"; const item = { who, text: m.body, time: m.createdAt }; state.history.push(item); }
      renderHistory(state.history); save();
    } else {
      const seen = new Set(state.history.map((m) => m.text));
      for (const m of data.messages || []) if (!seen.has(m.body)) addMessage(m.author === "team" ? "team" : "user", m.body, m.createdAt);
    }
    if (data.inquiry.status === "closed") setProgress(5, "انتهت المحادثة");
  }
  async function openChat(initial = false) {
    try { await syncChat(initial); } catch (error) { addMessage("note", error.message); }
    controls.innerHTML = `<div class="intake-wait">${initial ? "طلبك وصل للفريق. احفظ رابط المحادثة عشان ترجع إلها وتقرأ الردود." : "محادثة طلبك مفتوحة. ابعت أي تفاصيل إضافية، ورح تظهر للفريق."}</div>${state.contactMethod === "email" ? `<a class="intake-button email-draft" href="${esc(teamEmailDraft())}">فتح رسالة جاهزة لفريق جَمْرَة بالبريد ↗</a>` : ""}<div class="intake-share"><input id="followLink" readonly aria-label="رابط متابعة المحادثة"><button class="intake-button" id="copyFollowLink" type="button">نسخ رابط المتابعة</button></div><form id="chatReply"><textarea class="intake-input" name="message" rows="2" maxlength="1200" placeholder="اكتب رسالة للفريق…" required></textarea><div class="intake-actions"><button class="intake-button primary" type="submit">إرسال الرسالة ↙</button></div><div class="intake-error" role="status"></div></form>`;
    $("#followLink").value = `${location.origin}${location.pathname}#ticket=${encodeURIComponent(state.ticket)}&key=${encodeURIComponent(state.token)}`;
    $("#copyFollowLink").addEventListener("click", async () => { try { await navigator.clipboard.writeText($("#followLink").value); $("#copyFollowLink").textContent = "اننسخ الرابط ✓"; } catch { $("#followLink").select(); document.execCommand("copy"); } });
    $("#chatReply").addEventListener("submit", async (event) => { event.preventDefault(); const f = event.currentTarget.elements.message; const message = f.value.trim(); if (!message) return; const error = event.currentTarget.querySelector(".intake-error"); f.disabled = true; try { const res = await fetch(`/api/intake/${encodeURIComponent(state.ticket)}`, { method: "POST", headers: { ...authHeader(), "content-type": "application/json" }, body: JSON.stringify({ message }) }); const data = await res.json().catch(() => ({})); if (!res.ok) throw new Error(data.error || "تعذّر إرسال الرسالة."); addMessage("user", message); f.value = ""; } catch (err) { error.textContent = err.message; } finally { f.disabled = false; f.focus(); } });
    if (!window.__jamraChatPoll) window.__jamraChatPoll = setInterval(() => syncChat(false).catch(() => {}), 7000);
  }

  async function resume() {
    const hash = new URLSearchParams(location.hash.slice(1));
    let saved = null; try { saved = JSON.parse(localStorage.getItem(storageKey) || "null"); } catch {}
    if (hash.get("ticket") && hash.get("key")) { state.ticket = hash.get("ticket"); state.token = hash.get("key"); if (saved?.ticket === state.ticket) state.history = saved.history || []; }
    else if (saved?.ticket && saved?.token) { state.ticket = saved.ticket; state.token = saved.token; state.history = saved.history || []; history.replaceState(null, "", `#ticket=${encodeURIComponent(state.ticket)}&key=${encodeURIComponent(state.token)}`); }
    if (state.ticket && state.token) { setProgress(6, "المحادثة مع الفريق"); renderHistory(state.history); await openChat(false); return; }
    addMessage("bot", "أهلًا فيك بجَمْرَة 👋\nاحكيلنا عن فكرتك، وبنمشي فيها سؤال سؤال لحتى نعرف كيف نساعدك."); setProgress(0, "بداية الحكاية"); nextQuestion();
  }
  function $(selector) { return document.querySelector(selector); }
  resume();
})();
