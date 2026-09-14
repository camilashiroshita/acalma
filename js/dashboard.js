let seriesVendas = { "Chás": [], "Infusores": [] };
const cores = { "Chás": "#a85f62", "Infusores": "#6f7f58" };
let meses = [];
const brl = n => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
function categoriasSelecionadas(){ return [...document.querySelectorAll(".categoriaGrafico:checked")].map(i => i.value); }
function renderizarLogs(){
  const main=document.querySelector("main"),logs=JSON.parse(localStorage.getItem("acalma_logs")||"[]");let sec=document.querySelector("#logsLocais");
  if(!sec){sec=document.createElement("section");sec.id="logsLocais";sec.className="admin-card";main.append(sec)}
  sec.innerHTML=`<div class="dashboard-card-topo"><div><h3>Registro local de operações</h3><p>Histórico demonstrativo deste navegador.</p></div></div>${logs.length?`<div class="tabela-responsiva"><table class="admin-tabela"><thead><tr><th>Data e hora</th><th>Usuário</th><th>Operação</th></tr></thead><tbody>${logs.slice(0,10).map(l=>`<tr><td>${new Date(l.date).toLocaleString("pt-BR")}</td><td>${l.user}</td><td>${l.action}</td></tr>`).join("")}</tbody></table></div>`:'<p>Nenhuma operação local registrada.</p>'}`;
}
function atualizarDados(){
  const ini=new Date(document.querySelector("#dataInicio").value+"T00:00:00"),fim=new Date(document.querySelector("#dataFim").value+"T23:59:59"),nomes=["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  const clientesSalvos=JSON.parse(localStorage.getItem("acalma_clientes")||"null"),clientes=Array.isArray(clientesSalvos)?clientesSalvos:[{status:"ativo"}];
  document.querySelector("#totalClientesAtivos").textContent=clientes.filter(c=>c.status!=="inativo").length;
  meses=[]; const chaves=[]; let d=new Date(ini.getFullYear(),ini.getMonth(),1);
  while(d<=fim){meses.push(`${nomes[d.getMonth()]}/${String(d.getFullYear()).slice(-2)}`);chaves.push(`${d.getFullYear()}-${d.getMonth()}`);d.setMonth(d.getMonth()+1)}
  seriesVendas={"Chás":chaves.map(()=>0),"Infusores":chaves.map(()=>0)};
  const pedidosSalvos=JSON.parse(localStorage.getItem("acalma_pedidos")||"[]"),mapaStatus={"PAGAMENTO REALIZADO":"APROVADA","EM TRÂNSITO":"EM TRANSPORTE","EM TRANSITO":"EM TRANSPORTE"},pedidos=pedidosSalvos.map(p=>mapaStatus[p.status]?{...p,status:mapaStatus[p.status]}:p),produtos=JSON.parse(localStorage.getItem("acalma_produtos")||"[]"),validos=["APROVADA","EM TRANSPORTE","ENTREGUE"];
  if(pedidos.some((p,i)=>p.status!==pedidosSalvos[i].status))localStorage.setItem("acalma_pedidos",JSON.stringify(pedidos));
  pedidos.filter(p=>validos.includes(p.status)&&new Date(p.date)>=ini&&new Date(p.date)<=fim).forEach(p=>p.items.forEach(i=>{const produto=produtos.find(x=>x.nome===i.nome),cat=produto?.categoria||"Chás",idx=chaves.indexOf(`${new Date(p.date).getFullYear()}-${new Date(p.date).getMonth()}`);if(seriesVendas[cat]&&idx>=0)seriesVendas[cat][idx]+=i.preco*i.quantidade}));
  // Dados ilustrativos apenas para deixar o gráfico navegável enquanto não há vendas reais.
  if (true) {
    const baseChas=[78,142,96,188,126,214,154,232,174,248,192,268];
    const baseInfusores=[42,68,51,92,64,118,83,106,76,132,98,145];
    seriesVendas["Chás"]=seriesVendas["Chás"].map((valor,i)=>valor>0?valor:baseChas[i%baseChas.length]);
    seriesVendas["Infusores"]=seriesVendas["Infusores"].map((valor,i)=>valor>0?valor:baseInfusores[i%baseInfusores.length]);
  }
}
function desenharGrafico(){
  const alvo = document.querySelector("#graficoVendas"); const categorias = categoriasSelecionadas();
  if (!categorias.length) { alvo.innerHTML = '<p class="grafico-vazio">Selecione ao menos uma categoria.</p>'; return; }
  const w=820,h=310,margemEsquerda=112,margemDireita=28,margemTopo=40,margemInferior=52,max=Math.max(1,...categorias.flatMap(c=>seriesVendas[c]))*1.12;
  const x=i=>margemEsquerda+i*((w-margemEsquerda-margemDireita)/(meses.length-1));
  const y=v=>h-margemInferior-v*((h-margemTopo-margemInferior)/max);
  const grades=[0,.25,.5,.75,1].map(f=>`<g><line x1="${margemEsquerda}" y1="${y(max*f)}" x2="${w-margemDireita}" y2="${y(max*f)}"/><text x="${margemEsquerda-12}" y="${y(max*f)+4}" text-anchor="end">${brl(max*f).replace(/,00/,"")}</text></g>`).join("");
  const linhas=categorias.map(c=>{ const pontos=seriesVendas[c].map((v,i)=>`${x(i)},${y(v)}`).join(" "); const dots=seriesVendas[c].map((v,i)=>`<circle cx="${x(i)}" cy="${y(v)}" r="5"><title>${c} · ${meses[i]}: ${brl(v)}</title></circle>`).join(""); return `<g class="serie" style="--cor:${cores[c]}"><polyline points="${pontos}"/>${dots}</g>`}).join("");
  alvo.innerHTML=`<svg viewBox="0 0 ${w} ${h}" role="img"><g class="grid-grafico">${grades}</g>${meses.map((m,i)=>`<text class="eixo-x" x="${x(i)}" y="${h-18}" text-anchor="middle">${m}</text>`).join("")}${linhas}</svg><div class="grafico-tooltip" role="status" aria-hidden="true"></div>`;
  const tooltip=alvo.querySelector(".grafico-tooltip");
  alvo.querySelectorAll(".serie circle").forEach((dot,index)=>{const serie=dot.closest(".serie"),categoria=serie.style.getPropertyValue("--cor")==cores["Chás"]?"Chás":"Infusores",i=index%meses.length;dot.addEventListener("mouseenter",()=>{tooltip.textContent=`${meses[i]} · ${categoria}: ${brl(seriesVendas[categoria][i])}`;tooltip.classList.add("visivel");tooltip.setAttribute("aria-hidden","false")});dot.addEventListener("mousemove",event=>{const rect=alvo.getBoundingClientRect();tooltip.style.left=`${event.clientX-rect.left+12}px`;tooltip.style.top=`${event.clientY-rect.top-42}px`});dot.addEventListener("mouseleave",()=>{tooltip.classList.remove("visivel");tooltip.setAttribute("aria-hidden","true")})});
  document.querySelector("#legendaGrafico").innerHTML=categorias.map(c=>`<span><i style="background:${cores[c]}"></i>${c}</span>`).join("");
}
document.querySelectorAll(".categoriaGrafico").forEach(i=>i.addEventListener("change",desenharGrafico));
document.querySelector("#aplicarAnalise").addEventListener("click",()=>{ const ini=new Date(document.querySelector("#dataInicio").value),fim=new Date(document.querySelector("#dataFim").value); const mesesDif=(fim.getFullYear()-ini.getFullYear())*12+fim.getMonth()-ini.getMonth(); if(fim<ini||mesesDif<1||mesesDif>24){ alert("Informe um período entre 1 e 24 meses, com a data final posterior à inicial."); return; } atualizarDados(); desenharGrafico(); });
document.querySelector("#exportarAnalise").addEventListener("click",()=>{ const cs=categoriasSelecionadas(); if(!cs.length)return; const linhas=[["Período","Categoria","Valor de venda"],...cs.flatMap(c=>meses.map((m,i)=>[m,c,seriesVendas[c][i].toFixed(2).replace(".",",")]))]; const csv=linhas.map(r=>r.map(v=>`"${v}"`).join(";")).join("\n"); const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob(["\ufeff"+csv],{type:"text/csv"})); a.download="vendas-acalma.csv"; a.click(); URL.revokeObjectURL(a.href); });
atualizarDados(); desenharGrafico(); renderizarLogs();
