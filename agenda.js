/* ====== CONFIGURAÇÕES DA WH STUDIO — edite aqui ====== */
const CONFIG = {
  whatsapp: "5579900000000",   // número da empresa com DDI+DDD
  adminPin: "1234",            // senha do painel (troque!)
  open: "09:00",
  close: "18:00",
  step: 60,                    // intervalo entre horários (minutos)
  daysOff: [0],                // 0 = domingo, 6 = sábado
  services: [
    { id: 1, name: "Serviço 1", desc: "Descrição curta", min: 60, price: 80 },
    { id: 2, name: "Serviço 2", desc: "Descrição curta", min: 60, price: 120 },
    { id: 3, name: "Serviço 3", desc: "Descrição curta", min: 60, price: 200 }
  ]
};

const KEY = "wh-agenda-v1";
const $ = s => document.querySelector(s);
const brl = n => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
const save = list => { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch {} };

let state = { service: null, date: null, time: null };
let view = new Date(); view.setDate(1);

/* ---------- navegação entre etapas ---------- */
function go(n) {
  document.querySelectorAll(".panel").forEach(p => p.hidden = +p.dataset.step !== n);
  document.querySelectorAll("#steps li").forEach((li, i) => {
    li.classList.toggle("on", i === n - 1);
    li.classList.toggle("ok", i < n - 1);
  });
  $("#steps").hidden = n === 5;
}
document.querySelectorAll(".back").forEach(b => b.onclick = () => {
  go(+b.closest(".panel").dataset.step - 1);
});

/* ---------- 1. serviços ---------- */
$("#services").innerHTML = CONFIG.services.map(s =>
  `<button class="svc" data-id="${s.id}"><span><b>${s.name}</b><small>${s.desc} · ${s.min} min</small></span><span class="price">${brl(s.price)}</span></button>`
).join("");
$("#services").onclick = e => {
  const b = e.target.closest(".svc"); if (!b) return;
  state.service = CONFIG.services.find(s => s.id == b.dataset.id);
  renderCal(); go(2);
};

/* ---------- 2. calendário ---------- */
$("#week").innerHTML = ["D", "S", "T", "Q", "Q", "S", "S"].map(d => `<span>${d}</span>`).join("");
function renderCal() {
  $("#monthLabel").textContent = view.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const total = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  let html = '<span class="blank"></span>'.repeat(view.getDay());
  for (let d = 1; d <= total; d++) {
    const date = new Date(view.getFullYear(), view.getMonth(), d);
    const off = date < today || CONFIG.daysOff.includes(date.getDay());
    html += `<button class="day${+date === +today ? " today" : ""}" data-d="${iso(date)}" ${off ? "disabled" : ""}>${d}</button>`;
  }
  $("#days").innerHTML = html;
}
$("#prev").onclick = () => { view.setMonth(view.getMonth() - 1); renderCal(); };
$("#next").onclick = () => { view.setMonth(view.getMonth() + 1); renderCal(); };
$("#days").onclick = e => {
  const b = e.target.closest(".day"); if (!b || b.disabled) return;
  state.date = b.dataset.d; renderSlots(); go(3);
};
const fmtDate = s => new Date(s + "T12:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });

/* ---------- 3. horários ---------- */
function renderSlots() {
  $("#dateLabel").textContent = fmtDate(state.date);
  const taken = load().filter(a => a.date === state.date).map(a => a.time);
  const toMin = t => +t.slice(0, 2) * 60 + +t.slice(3);
  const now = new Date(), isToday = state.date === iso(now), nowMin = now.getHours() * 60 + now.getMinutes();
  let html = "";
  for (let m = toMin(CONFIG.open); m + state.service.min <= toMin(CONFIG.close); m += CONFIG.step) {
    const t = `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
    const busy = taken.includes(t) || (isToday && m <= nowMin);
    html += `<button class="slot" data-t="${t}" ${busy ? "disabled" : ""}>${t}</button>`;
  }
  $("#slots").innerHTML = html || '<p class="empty">Sem horários neste dia.</p>';
}
$("#slots").onclick = e => {
  const b = e.target.closest(".slot"); if (!b || b.disabled) return;
  state.time = b.dataset.t;
  $("#resume").innerHTML = `<b>${state.service.name}</b> · ${brl(state.service.price)}<br>${fmtDate(state.date)} às ${state.time}`;
  go(4);
};

/* ---------- 4. confirmar ---------- */
$("#confirm").onclick = () => {
  const name = $("#name").value.trim(), phone = $("#phone").value.replace(/\D/g, "");
  if (name.length < 3) return $("#err").textContent = "Digite seu nome completo.";
  if (phone.length < 10) return $("#err").textContent = "Digite um WhatsApp válido com DDD.";
  const list = load();
  if (list.some(a => a.date === state.date && a.time === state.time)) {
    $("#err").textContent = "Esse horário acabou de ser reservado. Escolha outro.";
    renderSlots(); return go(3);
  }
  $("#err").textContent = "";
  list.push({ id: Date.now(), name, phone, service: state.service.name, price: state.service.price, date: state.date, time: state.time });
  save(list);
  const msg = `Olá, WH Studio! Sou ${name} e agendei ${state.service.name} para ${fmtDate(state.date)} às ${state.time}.`;
  $("#wa").href = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`;
  $("#doneText").textContent = `${name}, seu horário de ${fmtDate(state.date)} às ${state.time} está reservado.`;
  go(5);
};
$("#again").onclick = () => { state = { service: null, date: null, time: null }; $("#name").value = $("#phone").value = ""; go(1); };

/* ---------- painel do administrador ---------- */
const dlg = $("#admin");
$("#btnAdmin").onclick = () => { $("#adminLogin").hidden = false; $("#adminList").hidden = true; $("#pin").value = ""; dlg.showModal(); };
$("#closeAdmin").onclick = () => dlg.close();
$("#enter").onclick = () => {
  if ($("#pin").value !== CONFIG.adminPin) return alert("Senha incorreta.");
  $("#adminLogin").hidden = true; $("#adminList").hidden = false; renderAdmin();
};
function renderAdmin() {
  const list = load().sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  $("#adminList").innerHTML = list.length ? list.map(a =>
    `<div class="item"><div><b>${a.name}</b><small>${a.service} · ${a.date.split("-").reverse().join("/")} às ${a.time}</small><small>${a.phone}</small></div><button data-id="${a.id}">Cancelar</button></div>`
  ).join("") : '<p class="empty">Nenhum agendamento ainda.</p>';
}
$("#adminList").onclick = e => {
  const b = e.target.closest("button"); if (!b) return;
  save(load().filter(a => a.id != b.dataset.id)); renderAdmin();
};

go(1);
