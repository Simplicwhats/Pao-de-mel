/* =========================
   CONFIGURAÇÃO SUPABASE
   =========================
   1. Crie um projeto em https://supabase.com
   2. Vá em Project Settings > API.
   3. Cole a URL e a chave ANON/PUBLISHABLE abaixo.
   4. Rode o arquivo supabase.sql no SQL Editor.
*/
const SUPABASE_URL = "COLE_SUA_SUPABASE_URL_AQUI";
const SUPABASE_ANON_KEY = "COLE_SUA_SUPABASE_ANON_KEY_AQUI";

const isConfigured = !SUPABASE_URL.includes("COLE_SUA") && !SUPABASE_ANON_KEY.includes("COLE_SUA");
const sb = isConfigured ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const state = {
  settings: {
    business_name: "Pão de Mel Artesanal",
    whatsapp: "5511999999999",
    hero_badge: "ARTESANAL • FRESQUINHO • DELICIOSO",
    hero_title: "Pão de Mel Artesanal",
    hero_subtitle: "Uma explosão de sabor em cada mordida!",
    why_text: "Cada pão de mel é preparado com cuidado para chegar até você macio, recheado e cheio de sabor.",
    delivery_fee: 0,
    hours: "Segunda a sábado, das 9h às 18h",
    description: "Delícias artesanais feitas com carinho."
  },
  products: [],
  cart: {},
  orders: [],
  reviews: [],
  adminUser: null
};

const fallbackProducts = [
  {id:"demo-1",name:"Tradicional",description:"Massa de chocolate, recheio cremoso e cobertura de chocolate.",price:8.5,image_url:"",active:true},
  {id:"demo-2",name:"Doce de Leite",description:"Massa de chocolate com recheio generoso de doce de leite.",price:9.5,image_url:"",active:true},
  {id:"demo-3",name:"Brigadeiro",description:"Recheio cremoso de brigadeiro e cobertura especial.",price:10.0,image_url:"",active:true},
  {id:"demo-4",name:"Ninho com Nutella",description:"Combinação cremosa de leite em pó e creme de avelã.",price:11.0,image_url:"",active:true}
];

const $ = id => document.getElementById(id);
const money = value => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(value)||0);
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const formatDate = value => value ? new Date(value).toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"}) : "—";
const todayStart = days => new Date(Date.now() - days*86400000);

function toast(message,type="success"){
  const el=$("toast"); el.textContent=message; el.className=`toast show ${type}`;
  clearTimeout(window.__toastTimer); window.__toastTimer=setTimeout(()=>el.className="toast",3000);
}
function showLoading(show){$("loadingScreen").classList.toggle("hidden",!show)}
function openModal(id){$(id).classList.add("open")}
function closeModal(id){$(id).classList.remove("open")}

async function loadPublicData(){
  if(!sb){
    state.products=fallbackProducts;
    renderAll();
    return;
  }
  const [{data:settings,error:sErr},{data:products,error:pErr},{data:reviews,error:rErr}] = await Promise.all([
    sb.from("site_settings").select("*").eq("id",1).maybeSingle(),
    sb.from("products").select("*").eq("active",true).order("sort_order"),
    sb.from("reviews").select("*").eq("approved",true).order("created_at",{ascending:false}).limit(20)
  ]);
  if(sErr) console.warn(sErr); if(pErr) console.warn(pErr); if(rErr) console.warn(rErr);
  if(settings) state.settings={...state.settings,...settings};
  state.products=products?.length ? products : fallbackProducts;
  state.reviews=reviews||[];
  renderAll();
}

function renderSettings(){
  const s=state.settings;
  $("topBarInfo").textContent=`${s.hours || "Pedidos pelo WhatsApp"}`;
  $("heroBadge").textContent=s.hero_badge;
  $("heroTitle").textContent=s.hero_title;
  $("heroSubtitle").textContent=s.hero_subtitle;
  $("whyText").textContent=s.why_text;
  $("footerBusinessName").textContent=s.business_name;
  $("footerBusinessName2").textContent=s.business_name;
  $("footerDescription").textContent=s.description;
  $("footerWhatsapp").textContent=`WhatsApp: ${formatPhone(s.whatsapp)}`;
  $("footerHours").textContent=`Horário: ${s.hours}`;
  $("footerDelivery").textContent=Number(s.delivery_fee)>0 ? `Entrega: ${money(s.delivery_fee)}` : "Entrega: consulte disponibilidade";
  $("footerYear").textContent=new Date().getFullYear();
  const wa=s.whatsapp?.replace(/\D/g,"");
  $("whatsappFloat").href=wa ? `https://wa.me/${wa}` : "#";
  document.title=`${s.business_name} | ${s.hero_subtitle}`;
}
function formatPhone(v){
  const n=String(v||"").replace(/\D/g,"");
  if(n.length===13) return `+${n.slice(0,2)} (${n.slice(2,4)}) ${n.slice(4,9)}-${n.slice(9)}`;
  if(n.length===12) return `+${n.slice(0,2)} (${n.slice(2,4)}) ${n.slice(4,8)}-${n.slice(8)}`;
  if(n.length===11) return `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`;
  return v||"—";
}

function productImage(p){
  return p.image_url
    ? `<img src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.name)}" loading="lazy">`
    : `<div class="product-placeholder">🍫</div>`;
}
function renderProducts(){
  $("productsGrid").innerHTML=state.products.map(p=>`
    <article class="product-card">
      <div class="product-image">${productImage(p)}</div>
      <div class="product-info">
        <h3>${escapeHtml(p.name)}</h3>
        <p>${escapeHtml(p.description||"Delicioso pão de mel artesanal.")}</p>
        <div class="price">${money(p.price)}</div>
        <div class="quantity-control">
          <button type="button" onclick="changeQty('${p.id}',-1)" aria-label="Diminuir">−</button>
          <strong id="qty-${p.id}">${state.cart[p.id]||0}</strong>
          <button type="button" onclick="changeQty('${p.id}',1)" aria-label="Aumentar">+</button>
        </div>
      </div>
    </article>`).join("");
  $("orderProducts").innerHTML=state.products.map(p=>`
    <div class="order-product-row">
      <div><strong>${escapeHtml(p.name)}</strong><small>${money(p.price)} cada</small></div>
      <div class="mini-quantity"><button type="button" onclick="changeQty('${p.id}',-1)">−</button><span id="mini-${p.id}">${state.cart[p.id]||0}</span><button type="button" onclick="changeQty('${p.id}',1)">+</button></div>
      <strong class="price-line">${money((state.cart[p.id]||0)*Number(p.price))}</strong>
    </div>`).join("");
}
function changeQty(id,delta){
  const next=Math.max(0,(state.cart[id]||0)+delta);
  if(next) state.cart[id]=next; else delete state.cart[id];
  renderProducts(); renderCart();
}
function getCartLines(){
  return state.products.filter(p=>state.cart[p.id]>0).map(p=>({...p,quantity:state.cart[p.id],lineTotal:Number(p.price)*state.cart[p.id]}));
}
function getDeliveryFee(){
  return document.querySelector('input[name="deliveryType"]:checked')?.value==="delivery" ? Number(state.settings.delivery_fee||0) : 0;
}
function renderCart(){
  const lines=getCartLines(), subtotal=lines.reduce((a,b)=>a+b.lineTotal,0), delivery=getDeliveryFee(), total=subtotal+delivery;
  $("cartCount").textContent=`${lines.reduce((a,b)=>a+b.quantity,0)} ${lines.length===1?"item":"itens"}`;
  $("cartSubtotal").textContent=money(subtotal); $("cartDelivery").textContent=delivery?money(delivery):"Grátis"; $("cartTotal").textContent=money(total);
  $("cartItems").innerHTML=lines.length ? lines.map(p=>`<div class="cart-item"><div><strong>${escapeHtml(p.name)}</strong><small>${p.quantity} × ${money(p.price)}</small></div><strong>${money(p.lineTotal)}</strong></div>`).join("") : `<div class="empty-cart">Seu carrinho está vazio.<br>Escolha seus sabores acima.</div>`;
}
function renderBestSellers(){
  const counts={};
  state.orders.forEach(o=>(o.items||[]).forEach(i=>counts[i.name]=(counts[i.name]||0)+Number(i.quantity||0)));
  const source=Object.keys(counts).length ? Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,3) : state.products.slice(0,3).map((p,i)=>[p.name,0]);
  $("bestSellersGrid").innerHTML=source.map((x,i)=>`<div class="best-card"><div class="best-rank">${i+1}</div><div><h3>${escapeHtml(x[0])}</h3><p>${x[1]?`${x[1]} unidades pedidas`:"Destaque do nosso catálogo"}</p></div></div>`).join("");
}
function renderReviews(){
  $("reviewsGrid").innerHTML=state.reviews.length ? state.reviews.map(r=>`<article class="review-card"><div class="stars">${"★".repeat(Number(r.rating))}${"☆".repeat(5-Number(r.rating))}</div><p>“${escapeHtml(r.comment)}”</p><strong>${escapeHtml(r.name)}</strong><span class="review-date">${formatDate(r.created_at)}</span></article>`).join("") : `<div class="review-card"><p>Ainda não há avaliações publicadas. Seja o primeiro!</p></div>`;
}
function renderAll(){renderSettings();renderProducts();renderCart();renderBestSellers();renderReviews()}

async function submitOrder(e){
  e.preventDefault();
  const lines=getCartLines();
  if(!lines.length){toast("Adicione pelo menos um produto ao pedido.","error");return}
  const name=$("customerName").value.trim(), phone=$("customerWhatsapp").value.trim();
  const deliveryType=document.querySelector('input[name="deliveryType"]:checked').value;
  const address=$("customerAddress").value.trim(), deliveryDate=$("deliveryDate").value, note=$("orderNote").value.trim();
  if(deliveryType==="delivery" && !address){toast("Informe o endereço para entrega.","error");$("customerAddress").focus();return}
  const subtotal=lines.reduce((a,b)=>a+b.lineTotal,0), delivery=getDeliveryFee(), total=subtotal+delivery;
  const items=lines.map(p=>({product_id:p.id,name:p.name,quantity:p.quantity,unit_price:Number(p.price),total:p.lineTotal}));
  const order={
    customer_name:name,customer_whatsapp:phone,items,subtotal,delivery_fee:delivery,total,
    delivery_type:deliveryType,address:deliveryType==="delivery"?address:null,delivery_date:deliveryDate||null,note,status:"pending"
  };
  if(sb){
    const {error}=await sb.from("orders").insert(order);
    if(error){console.error(error);toast("Não foi possível registrar o pedido. Tente novamente.","error");return}
  }
  const msg=buildWhatsappMessage(order);
  const wa=String(state.settings.whatsapp||"").replace(/\D/g,"");
  if(wa) window.open(`https://wa.me/${wa}?text=${encodeURIComponent(msg)}`,"_blank","noopener");
  else toast("Pedido registrado, mas o WhatsApp do negócio não está configurado.","error");
  toast("Pedido registrado com sucesso!");
  state.cart={}; renderAll(); $("orderForm").reset(); document.querySelector('input[name="deliveryType"][value="delivery"]').checked=true; toggleDeliveryFields();
}
function buildWhatsappMessage(o){
  const lines=o.items.map(i=>`• ${i.quantity}x ${i.name} — ${money(i.total)}`).join("\n");
  return `Olá! Quero fazer um pedido.\n\n*Cliente:* ${o.customer_name}\n*WhatsApp:* ${o.customer_whatsapp}\n\n*Itens:*\n${lines}\n\nSubtotal: ${money(o.subtotal)}\nEntrega: ${o.delivery_fee?money(o.delivery_fee):"Grátis"}\n*Total: ${money(o.total)}*\n\n*Forma:* ${o.delivery_type==="delivery"?"Entrega":"Retirada"}${o.address?`\n*Endereço:* ${o.address}`:""}${o.delivery_date?`\n*Data desejada:* ${new Date(o.delivery_date+"T12:00:00").toLocaleDateString("pt-BR")}`:""}${o.note?`\n*Observação:* ${o.note}`:""}`;
}
function toggleDeliveryFields(){
  const delivery=document.querySelector('input[name="deliveryType"]:checked')?.value==="delivery";
  $("deliveryFields").style.display=delivery?"grid":"none";
  renderCart();
}

async function submitReview(e){
  e.preventDefault();
  const review={name:$("reviewName").value.trim(),rating:Number($("reviewRating").value),comment:$("reviewText").value.trim(),approved:false};
  if(sb){
    const {error}=await sb.from("reviews").insert(review);
    if(error){console.error(error);toast("Não foi possível enviar sua avaliação.","error");return}
    toast("Avaliação enviada! Ela ficará visível após aprovação.");
  }else toast("No modo demonstração, a avaliação não é publicada no painel.","error");
  $("reviewForm").reset();
}

async function openAdmin(){
  if(!sb){toast("Configure o Supabase no app.js antes de acessar o painel.","error");return}
  const {data:{session}}=await sb.auth.getSession();
  if(session){await showAdmin(session.user);return}
  openModal("adminLoginModal");
}
async function showAdmin(user){
  state.adminUser=user;
  $("adminUserEmail").textContent=user.email||"";
  $("adminPanel").classList.add("open");
  closeModal("adminLoginModal");
  await loadAdminData();
}
async function loadAdminData(){
  if(!sb)return;
  const [{data:orders},{data:products},{data:reviews},{data:settings}]=await Promise.all([
    sb.from("orders").select("*").order("created_at",{ascending:false}),
    sb.from("products").select("*").order("sort_order"),
    sb.from("reviews").select("*").order("created_at",{ascending:false}),
    sb.from("site_settings").select("*").eq("id",1).maybeSingle()
  ]);
  state.orders=orders||[]; state.reviews=reviews||[];
  if(products) state.products=products;
  if(settings) state.settings={...state.settings,...settings};
  renderAdmin(); renderAll();
}
function statusLabel(s){return({pending:"Pendente",confirmed:"Confirmado",preparing:"Preparando",out_for_delivery:"Saiu para entrega",delivered:"Entregue",cancelled:"Cancelado"})[s]||s}
function renderAdmin(){
  const now=new Date(), today=new Date();today.setHours(0,0,0,0);
  const d7=todayStart(7), d30=todayStart(30);
  const valid=o=>o.status!=="cancelled";
  const sum=(arr)=>arr.filter(valid).reduce((a,o)=>a+Number(o.total||0),0);
  const n=(arr)=>arr.filter(valid).length;
  const todayOrders=state.orders.filter(o=>new Date(o.created_at)>=today);
  const weekOrders=state.orders.filter(o=>new Date(o.created_at)>=d7);
  const monthOrders=state.orders.filter(o=>new Date(o.created_at)>=d30);
  $("statToday").textContent=money(sum(todayOrders));$("statTodayOrders").textContent=`${n(todayOrders)} pedidos`;
  $("statWeek").textContent=money(sum(weekOrders));$("statWeekOrders").textContent=`${n(weekOrders)} pedidos`;
  $("statMonth").textContent=money(sum(monthOrders));$("statMonthOrders").textContent=`${n(monthOrders)} pedidos`;
  $("statOpen").textContent=state.orders.filter(o=>!["delivered","cancelled"].includes(o.status)).length;
  renderOrders();renderAdminProducts();renderAdminReviews();renderAdminBestSellers();fillSettingsForm();
}
function renderOrders(){
  const filter=$("orderStatusFilter").value;
  const list=state.orders.filter(o=>!filter||o.status===filter);
  $("ordersTableBody").innerHTML=list.length?list.map(o=>`
    <tr>
      <td>${formatDate(o.created_at)}</td>
      <td><strong>${escapeHtml(o.customer_name)}</strong><br><small>${escapeHtml(o.delivery_type==="delivery"?o.address||"Sem endereço":"Retirada")}</small></td>
      <td>${escapeHtml(o.customer_whatsapp)}</td>
      <td>${(o.items||[]).map(i=>`${i.quantity}x ${escapeHtml(i.name)}`).join("<br>")}</td>
      <td><strong>${money(o.total)}</strong></td>
      <td><select class="status-select" onchange="updateOrderStatus('${o.id}',this.value)">${["pending","confirmed","preparing","out_for_delivery","delivered","cancelled"].map(s=>`<option value="${s}" ${o.status===s?"selected":""}>${statusLabel(s)}</option>`).join("")}</select></td>
      <td><button class="btn btn-small" onclick="copyOrder('${o.id}')"><i class="fa-regular fa-copy"></i></button></td>
    </tr>`).join(""):`<tr><td colspan="7">Nenhum pedido encontrado.</td></tr>`;
}
function renderAdminBestSellers(){
  const c={};state.orders.forEach(o=>(o.items||[]).forEach(i=>c[i.name]=(c[i.name]||0)+Number(i.quantity||0)));
  const arr=Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,10);
  $("adminBestSellers").innerHTML=arr.length?arr.map(([name,q])=>`<div class="cart-item"><strong>${escapeHtml(name)}</strong><span>${q} unidades</span></div>`).join(""):"Ainda não há vendas.";
}
function renderAdminProducts(){
  $("adminProductsGrid").innerHTML=state.products.map(p=>`<article class="admin-product">${p.image_url?`<img src="${escapeHtml(p.image_url)}" alt="">`:"<div class='product-image'><div class='product-placeholder'>🍫</div></div>"}<div class="admin-product-body"><h3>${escapeHtml(p.name)}</h3><p>${money(p.price)} • ${p.active?"Ativo":"Inativo"}</p><p>${escapeHtml(p.description||"")}</p><div class="admin-product-actions"><button class="btn btn-small" onclick="editProduct('${p.id}')">Editar</button><button class="btn btn-small btn-danger" onclick="deleteProduct('${p.id}')">Excluir</button></div></div></article>`).join("");
}
function renderAdminReviews(){
  $("adminReviewsList").innerHTML=state.reviews.length?state.reviews.map(r=>`<article class="admin-review"><div><div class="stars">${"★".repeat(Number(r.rating))}${"☆".repeat(5-Number(r.rating))}</div><strong>${escapeHtml(r.name)}</strong><p>${escapeHtml(r.comment)}</p><small>${r.approved?"Publicada":"Pendente"} • ${formatDate(r.created_at)}</small></div><div class="review-actions">${!r.approved?`<button class="btn btn-small btn-primary" onclick="approveReview('${r.id}')">Aprovar</button>`:""}<button class="btn btn-small btn-danger" onclick="deleteReview('${r.id}')">Excluir</button></div></article>`).join(""):"Nenhuma avaliação.";
}
function fillSettingsForm(){
  const s=state.settings;
  $("setBusinessName").value=s.business_name||"";$("setWhatsapp").value=s.whatsapp||"";
  $("setHeroBadge").value=s.hero_badge||"";$("setHeroTitle").value=s.hero_title||"";
  $("setHeroSubtitle").value=s.hero_subtitle||"";$("setWhyText").value=s.why_text||"";
  $("setDeliveryFee").value=s.delivery_fee??0;$("setHours").value=s.hours||"";$("setDescription").value=s.description||"";
}
async function updateOrderStatus(id,status){
  const {error}=await sb.from("orders").update({status}).eq("id",id);
  if(error){toast("Erro ao atualizar pedido.","error");return}
  const order=state.orders.find(o=>o.id===id);if(order)order.status=status;renderAdmin();toast("Status atualizado.");
}
function copyOrder(id){
  const o=state.orders.find(x=>x.id===id);if(!o)return;
  navigator.clipboard?.writeText(buildWhatsappMessage(o));toast("Resumo copiado.");
}
function editProduct(id){
  const p=state.products.find(x=>String(x.id)===String(id));if(!p)return;
  $("productModalTitle").textContent="Editar produto";$("productId").value=p.id;$("productName").value=p.name;$("productPrice").value=p.price;$("productImage").value=p.image_url||"";$("productDescription").value=p.description||"";$("productActive").value=String(p.active);openModal("productModal");
}
async function saveProduct(e){
  e.preventDefault();
  const id=$("productId").value;
  const product={name:$("productName").value.trim(),price:Number($("productPrice").value),image_url:$("productImage").value.trim(),description:$("productDescription").value.trim(),active:$("productActive").value==="true"};
  let error;
  if(id){({error}=await sb.from("products").update(product).eq("id",id));}
  else{({error}=await sb.from("products").insert(product));}
  if(error){console.error(error);toast("Erro ao salvar produto.","error");return}
  closeModal("productModal");await loadAdminData();toast("Produto salvo.");
}
async function deleteProduct(id){
  if(!confirm("Excluir este produto?"))return;
  const {error}=await sb.from("products").delete().eq("id",id);
  if(error){toast("Não foi possível excluir.","error");return}
  await loadAdminData();toast("Produto excluído.");
}
async function approveReview(id){
  const {error}=await sb.from("reviews").update({approved:true}).eq("id",id);
  if(error){toast("Erro ao aprovar.","error");return} await loadAdminData();toast("Avaliação publicada.");
}
async function deleteReview(id){
  if(!confirm("Excluir esta avaliação?"))return;
  const {error}=await sb.from("reviews").delete().eq("id",id);
  if(error){toast("Erro ao excluir.","error");return} await loadAdminData();toast("Avaliação excluída.");
}
async function saveSettings(e){
  e.preventDefault();
  const settings={id:1,business_name:$("setBusinessName").value.trim(),whatsapp:$("setWhatsapp").value.trim(),hero_badge:$("setHeroBadge").value.trim(),hero_title:$("setHeroTitle").value.trim(),hero_subtitle:$("setHeroSubtitle").value.trim(),why_text:$("setWhyText").value.trim(),delivery_fee:Number($("setDeliveryFee").value||0),hours:$("setHours").value.trim(),description:$("setDescription").value.trim()};
  const {error}=await sb.from("site_settings").upsert(settings);
  if(error){console.error(error);toast("Erro ao salvar configurações.","error");return}
  state.settings={...state.settings,...settings};renderAll();toast("Configurações salvas.");
}

function initEvents(){
  $("orderForm").addEventListener("submit",submitOrder);
  $("reviewForm").addEventListener("submit",submitReview);
  $("adminLoginForm").addEventListener("submit",async e=>{
    e.preventDefault();$("adminLoginError").textContent="";
    const {data,error}=await sb.auth.signInWithPassword({email:$("adminEmail").value,password:$("adminPassword").value});
    if(error){$("adminLoginError").textContent=error.message;return}
    await showAdmin(data.user);
  });
  $("adminLogoutBtn").addEventListener("click",async()=>{await sb.auth.signOut();$("adminPanel").classList.remove("open");toast("Sessão encerrada.")});
  $("adminRefreshBtn").addEventListener("click",loadAdminData);
  $("orderStatusFilter").addEventListener("change",renderOrders);
  $("addProductBtn").addEventListener("click",()=>{ $("productForm").reset();$("productId").value="";$("productModalTitle").textContent="Novo produto";openModal("productModal")});
  $("productForm").addEventListener("submit",saveProduct);
  $("settingsForm").addEventListener("submit",saveSettings);
  document.querySelectorAll(".admin-tabs button").forEach(btn=>btn.addEventListener("click",()=>{
    document.querySelectorAll(".admin-tabs button").forEach(b=>b.classList.remove("active"));btn.classList.add("active");
    document.querySelectorAll(".admin-tab").forEach(t=>t.classList.remove("active"));$(btn.dataset.tab).classList.add("active");
  }));
  document.querySelectorAll("[data-close]").forEach(btn=>btn.addEventListener("click",()=>closeModal(btn.dataset.close)));
  document.querySelectorAll('input[name="deliveryType"]').forEach(r=>r.addEventListener("change",toggleDeliveryFields));
  $("customerWhatsapp").addEventListener("input",e=>{let v=e.target.value.replace(/\D/g,"").slice(0,11);if(v.length>10)e.target.value=`(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"){document.querySelectorAll(".modal.open").forEach(m=>m.classList.remove("open"))}});
  $("whatsappFloat").addEventListener("click",e=>{if($("whatsappFloat").getAttribute("href")==="#"){e.preventDefault();toast("Configure o WhatsApp no painel administrativo.","error")}});
}

async function init(){
  initEvents();
  $("footerYear").textContent=new Date().getFullYear();
  await loadPublicData();
  if(sb){
    const {data:{session}}=await sb.auth.getSession();
    if(session) console.info("Administrador autenticado.");
    sb.auth.onAuthStateChange((_event,session)=>{state.adminUser=session?.user||null});
  } else {
    toast("Modo demonstração: configure o Supabase no app.js.","error");
  }
  const params=new URLSearchParams(location.search);
  if(params.get("admin")==="true") openAdmin();
  showLoading(false);
  toggleDeliveryFields();
}
document.addEventListener("DOMContentLoaded",init);
