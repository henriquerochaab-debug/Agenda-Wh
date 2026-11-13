/* ====== CONFIGURAÇÃO ====== */
// Cole aqui o link de pagamento criado na plataforma (Kiwify, Hotmart, Mercado Pago, Stripe...)
const CHECKOUT_URL = "";

document.querySelectorAll("[data-open]").forEach(b => b.onclick = () => {
  if (!CHECKOUT_URL) return alert("O link de pagamento ainda não foi configurado.");
  window.location.href = CHECKOUT_URL;
});
document.querySelector("#year").textContent = new Date().getFullYear();
