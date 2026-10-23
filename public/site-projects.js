(() => {
  const section = document.querySelector("#managed-work"), grid = document.querySelector("#managedProjects");
  if (!section || !grid) return;
  const escape = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const labels = { website: "موقع إلكتروني", app: "تطبيق / نظام", video: "فيديو وموشن", design: "تصميم وهوية", campaign: "حملة تسويقية" };
  fetch("/api/projects", { cache: "no-store" }).then((r) => r.ok ? r.json() : Promise.reject()).then(({ projects = [] }) => {
    if (!projects.length) return;
    grid.innerHTML = projects.map((p) => {
      let media = p.coverUrl ? `<img src="${escape(p.coverUrl)}" alt="${escape(p.title)}" loading="lazy">` : "";
      if (!media && p.videoUrl) {
        let isFile = false; try { const u = new URL(p.videoUrl, location.origin); isFile = /\.(mp4|webm)$/i.test(u.searchParams.get("key") || u.pathname); } catch {}
        media = isFile ? `<video src="${escape(p.videoUrl)}" controls preload="metadata" playsinline aria-label="${escape(p.title)}"></video>` : `<a href="${escape(p.videoUrl)}" target="_blank" rel="noopener noreferrer">شاهد العمل ↗</a>`;
      }
      const links = `${p.projectUrl ? `<a href="${escape(p.projectUrl)}" target="_blank" rel="noopener noreferrer">شوف المشروع ↗</a>` : ""}${p.videoUrl && !media.includes("<video") ? `<a href="${escape(p.videoUrl)}" target="_blank" rel="noopener noreferrer">شاهد الفيديو ▶</a>` : ""}`;
      return `<article class="managed-card"><div class="managed-card-media">${media || "<span>جَمْرَة / مشروع جديد</span>"}</div><div class="managed-card-body"><span class="managed-card-kicker">${escape(labels[p.category] || "من أعمال جَمْرَة")}</span><h3>${escape(p.title)}</h3><p>${escape(p.summary || p.description || "")}</p><div class="managed-card-links"><a href="/project.html?project=${encodeURIComponent(p.id)}">تفاصيل المشروع ↙</a>${links}</div></div></article>`;
    }).join("");
    section.hidden = false;
  }).catch(() => {});
})();
