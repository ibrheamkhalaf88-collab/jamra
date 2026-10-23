(() => {
  const form = document.querySelector("#loginForm");
  const password = document.querySelector("#adminPassword");
  const feedback = document.querySelector("#loginFeedback");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = form.querySelector("button[type=submit]");
    button.disabled = true;
    feedback.textContent = "جاري التحقق…";
    try {
      const response = await fetch("/api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password: password.value }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "تعذّر تسجيل الدخول.");
      location.replace("/admin.html");
    } catch (error) {
      feedback.textContent = error.message;
      password.select();
    } finally { button.disabled = false; }
  });
})();
