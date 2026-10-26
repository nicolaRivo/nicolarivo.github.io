(function () {
  // Header: bordo quando la pagina scorre
  var top = document.querySelector(".top");
  function onScroll() { top.classList.toggle("stuck", window.scrollY > 8); }
  onScroll(); window.addEventListener("scroll", onScroll, { passive: true });

  // Menu mobile: si chiude dopo un tap su un link
  var menu = document.querySelector(".menu");
  if (menu) menu.addEventListener("click", function (e) { if (e.target.closest("a")) menu.removeAttribute("open"); });

  // Il pulsante fisso su mobile sparisce quando si è al modulo di contatto
  var contact = document.getElementById("contact");
  if (contact && "IntersectionObserver" in window) {
    new IntersectionObserver(function (en) {
      document.body.classList.toggle("at-contact", en[0].isIntersecting);
    }, { threshold: 0.15 }).observe(contact);
  }

  // Link "workshop": precompila il modulo
  document.querySelectorAll("[data-interest]").forEach(function (a) {
    a.addEventListener("click", function () {
      var sel = document.getElementById("interest");
      if (sel) sel.value = a.getAttribute("data-interest");
    });
  });

  // Modulo: l'email (web3forms) è il canale principale e resta la traccia scritta della richiesta.
  // WhatsApp è un secondo canale, mai l'unico. La chiave web3forms è pubblica per progettazione (lato client).
  var form = document.getElementById("form"), status = document.getElementById("status");
  var after = document.getElementById("after"), send = form.querySelector(".send");
  var NUMBER = "447438779924", KEY = "39085a5d-a84a-45ab-90dc-8f846734ca47", DRAFT = "enquiry-draft";

  function text(f) {
    return [
      "Hello Nico, I'd like to book a trial lesson.",
      "Name: " + f.name.value.trim(),
      "Contact: " + f.contact.value.trim(),
      f.interest.value ? "Interested in: " + f.interest.value : "",
      f.who.value.trim() ? "Playing: " + f.who.value.trim() : "",
      f.area.value.trim() ? "Area: " + f.area.value.trim() : "",
      f.message.value.trim() ? "Notes: " + f.message.value.trim() : ""
    ].filter(Boolean).join("\n");
  }
  function showAfter(msg, lead) {
    var wa = "https://wa.me/" + NUMBER + "?text=" + encodeURIComponent(text(form.elements));
    after.hidden = false;
    after.innerHTML = "";
    var p = document.createElement("p"); p.textContent = msg; after.appendChild(p);
    var a = document.createElement("a"); a.className = "wa"; a.href = wa; a.target = "_blank"; a.rel = "noopener";
    a.textContent = lead; after.appendChild(a);
    var t = document.createElement("a"); t.className = "tel"; t.href = "tel:+" + NUMBER; t.textContent = "Or call +44 7438 779924";
    after.appendChild(t);
    after.focus();
  }
  function save() {
    try {
      var o = {}; ["name", "contact", "interest", "who", "area", "message"].forEach(function (k) { o[k] = form.elements[k].value; });
      localStorage.setItem(DRAFT, JSON.stringify(o));
    } catch (e) {}
  }
  try {
    var d = JSON.parse(localStorage.getItem(DRAFT) || "null");
    if (d) Object.keys(d).forEach(function (k) { if (form.elements[k] && !form.elements[k].value) form.elements[k].value = d[k]; });
  } catch (e) {}
  form.addEventListener("input", save);

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = form.elements;
    if (!f.name.value.trim() || !f.contact.value.trim()) {
      status.textContent = "Please add your name and an email or phone number.";
      (f.name.value.trim() ? f.contact : f.name).focus();
      return;
    }
    if (f.botcheck.checked) return;
    save();
    send.disabled = true; send.textContent = "Sending…"; status.textContent = "";
    var contact = f.contact.value.trim();
    var body = {
      access_key: KEY,
      subject: "Trial lesson enquiry: " + f.name.value.trim() + (f.interest.value ? " (" + f.interest.value + ")" : ""),
      from_name: "nicolarivo.co.uk lessons",
      name: f.name.value.trim(),
      contact: contact,
      interest: f.interest.value,
      who: f.who.value.trim(),
      area: f.area.value.trim(),
      message: f.message.value.trim(),
      botcheck: ""
    };
    if (contact.indexOf("@") > 0) body.email = contact;
    var ctl = new AbortController(), timer = setTimeout(function () { ctl.abort(); }, 15000);
    fetch("https://api.web3forms.com/submit", {
      method: "POST", signal: ctl.signal,
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(body)
    }).then(function (r) { return r.json().then(function (j) { if (!r.ok || !j.success) throw new Error("send"); }); })
      .then(function () {
        try { localStorage.removeItem(DRAFT); } catch (e) {}
        if (window.gtag) gtag("event", "generate_lead", { method: "form" });
        form.hidden = true; status.textContent = "";
        showAfter("Thanks, " + f.name.value.trim() + ". Your message is with me and I’ll reply with a day and time for your free trial. Want a faster reply? Send it on WhatsApp too.", "Also message me on WhatsApp");
      })
      .catch(function () {
        showAfter("Sorry, that didn’t go through, and your details are still saved here. Please send it on WhatsApp instead, or try again in a moment.", "Send it on WhatsApp");
        send.disabled = false; send.textContent = "Try again";
      })
      .then(function () { clearTimeout(timer); });
  });
})();
