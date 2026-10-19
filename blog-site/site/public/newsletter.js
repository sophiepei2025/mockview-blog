// 订阅表单：配置了 action 就提交到订阅服务，没配置就提示“正在接入中”，不会假装成功。
(() => {
  for (const form of document.querySelectorAll("form.newsletter-form")) {
    const status = form.querySelector(".newsletter-status");
    const button = form.querySelector("button[type=submit]");
    form.elements.source.value = location.pathname;

    const say = (text, ok) => {
      status.textContent = text;
      status.dataset.state = ok ? "ok" : "error";
    };

    form.addEventListener("submit", async (event) => {
      const msg = form.dataset;
      if (!form.getAttribute("action")) {
        event.preventDefault();
        say(msg.pending, false);
        return;
      }
      event.preventDefault();
      button.disabled = true;
      say(msg.sending, true);
      try {
        const res = await fetch(form.action, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(String(res.status));
        form.reset();
        say(msg.done, true);
      } catch {
        say(msg.failed, false);
      } finally {
        button.disabled = false;
      }
    });
  }
})();
