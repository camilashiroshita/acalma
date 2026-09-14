const produtosPadrao = [
  { id: 1, codigo: "CHA-001", nome: "Chá de Camomila", categoria: "Chás", custo: 14, margem: 35, preco: 18.9, estoque: 18, status: "ativo", descricao: "Infusão suave e aromática." },
  { id: 2, codigo: "CHA-002", nome: "Chá de Hibisco", categoria: "Chás", custo: 16.2, margem: 35, preco: 21.9, estoque: 14, status: "ativo", descricao: "Infusão frutada e marcante." },
  { id: 3, codigo: "INF-001", nome: "Infusor de Inox", categoria: "Infusores", custo: 23.9, margem: 25, preco: 29.9, estoque: 3, status: "ativo", descricao: "Infusor reutilizável em aço inox." },
  { id: 4, codigo: "INF-002", nome: "Infusor Folha", categoria: "Infusores", custo: 19.9, margem: 25, preco: 24.9, estoque: 14, status: "ativo", descricao: "Infusor de silicone em forma de folha." }
];

const obter = (chave, fallback) => JSON.parse(localStorage.getItem(chave) || JSON.stringify(fallback));
const salvar = (chave, valor) => localStorage.setItem(chave, JSON.stringify(valor));
const moeda = valor => Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const toast = mensagem => { const el = document.querySelector("#toast"); if (!el) return; el.textContent = mensagem; el.classList.add("visivel"); setTimeout(() => el.classList.remove("visivel"), 2600); };
let produtosAdmin = obter("acalma_produtos", produtosPadrao);

function renderProdutosAdmin() {
  const tbody = document.querySelector("#tabelaProdutosAdmin");
  if (!tbody) return;
  const termo = document.querySelector("#buscaProdutoAdmin").value.toLowerCase();
  const status = document.querySelector("#filtroStatusProduto").value;
  produtosAdmin.forEach(p => { if (p.estoque <= 0 && p.status === "ativo") { p.status = "inativo"; p.motivoStatus = "FORA DE MERCADO — inativação automática por estoque zerado"; } });
  salvar("acalma_produtos", produtosAdmin);
  const filtrados = produtosAdmin.filter(p => (`${p.nome} ${p.codigo} ${p.categoria}`).toLowerCase().includes(termo) && (status === "todos" || p.status === status));
  tbody.innerHTML = filtrados.map(p => `<tr><td><strong>${p.codigo}</strong></td><td>${p.nome}</td><td>${p.categoria}</td><td>${moeda(p.preco)}</td><td><span class="estoque-numero ${p.estoque < 5 ? "baixo" : ""}">${p.estoque}</span></td><td><span class="status-pill ${p.status}">${p.status}</span></td><td><div class="acoes-tabela"><button data-editar="${p.id}">Editar</button><button data-status="${p.id}">${p.status === "ativo" ? "Inativar" : "Ativar"}</button></div></td></tr>`).join("");
  document.querySelector("#contagemProdutos").textContent = `${filtrados.length} produto(s) encontrado(s)`;
}

const modal = document.querySelector("#modalProduto");
function exibirAbaProduto(aba) {
  document.querySelectorAll("[data-produto-aba]").forEach(botao => botao.classList.toggle("ativa", botao.dataset.produtoAba === aba));
  document.querySelectorAll("[data-produto-painel]").forEach(painel => painel.classList.toggle("ativo", painel.dataset.produtoPainel === aba));
  document.querySelector("[data-acoes-produto]").hidden = aba !== "dados";
}
function abrirProduto(produto = null) {
  document.querySelector("#formProduto").reset();
  document.querySelector("#produtoId").value = produto?.id || "";
  document.querySelector("#tituloModalProduto").textContent = produto ? "Editar produto" : "Novo produto";
  document.querySelector("#produtoModalAbas").hidden = !produto;
  document.querySelector("#campoEstoqueInicial").hidden = Boolean(produto);
  document.querySelector("#produtoEstoque").required = !produto;
  exibirAbaProduto("dados");
  if (produto) {
    document.querySelector("#produtoNome").value = produto.nome; document.querySelector("#produtoCategoria").value = produto.categoria;
    document.querySelector("#produtoCodigo").value = produto.codigo; document.querySelector("#produtoCusto").value = produto.custo;
    document.querySelector("#produtoGrupo").value = produto.margem; document.querySelector("#produtoEstoque").value = produto.estoque; document.querySelector("#produtoDescricao").value = produto.descricao;
    document.querySelector("#produtoEstoqueAtual").textContent = `${produto.estoque} unidade(s)`;
  }
  calcularPreco(); modal.showModal();
}
function calcularPreco() { const custo = Number(document.querySelector("#produtoCusto")?.value || 0); const margem = Number(document.querySelector("#produtoGrupo")?.value || 0); const campo = document.querySelector("#produtoPreco"); if (campo) campo.value = moeda(custo * (1 + margem / 100)); }

if (document.querySelector("#tabelaProdutosAdmin")) {
  renderProdutosAdmin();
  document.querySelector("#buscaProdutoAdmin").addEventListener("input", renderProdutosAdmin);
  document.querySelector("#filtroStatusProduto").addEventListener("change", renderProdutosAdmin);
  document.querySelector("#novoProduto").addEventListener("click", () => abrirProduto());
  document.querySelector("#produtoCusto").addEventListener("input", calcularPreco);
  document.querySelector("#produtoGrupo").addEventListener("change", calcularPreco);
  document.querySelectorAll("[data-fechar-produto]").forEach(botao => botao.addEventListener("click", () => modal.close()));
  document.querySelectorAll("[data-produto-aba]").forEach(botao => botao.addEventListener("click", () => exibirAbaProduto(botao.dataset.produtoAba)));
  document.querySelector("#registrarMovimentoEstoque").addEventListener("click", () => {
    const id = Number(document.querySelector("#produtoId").value), produto = produtosAdmin.find(p => p.id === id);
    const tipo = document.querySelector("#produtoMovimentoTipo").value, quantidade = Number(document.querySelector("#produtoMovimentoQuantidade").value);
    const justificativa = document.querySelector("#produtoMovimentoJustificativa").value.trim();
    if (!produto) return toast("Salve o produto antes de movimentar o estoque.");
    if (!Number.isInteger(quantidade) || quantidade < 1) return toast("Informe uma quantidade inteira maior que zero.");
    if (!justificativa) return toast("A justificativa da movimentação é obrigatória.");
    if (tipo === "saida" && quantidade > produto.estoque) return toast("A saída não pode ser maior que o estoque atual.");
    const saldoAnterior = produto.estoque; produto.estoque += tipo === "entrada" ? quantidade : -quantidade;
    if (produto.estoque === 0) { produto.status = "inativo"; produto.motivoStatus = "FORA DE MERCADO — inativação automática por estoque zerado"; }
    else if (produto.status === "inativo" && produto.motivoStatus?.includes("FORA DE MERCADO")) { produto.status = "ativo"; produto.motivoStatus = "Reativação automática após movimentação de estoque"; }
    salvar("acalma_produtos", produtosAdmin);
    const movimentos = obter("acalma_movimentacoes_estoque", []); movimentos.unshift({ id: Date.now(), produtoId: produto.id, produto: produto.nome, tipo, quantidade, saldoAnterior, saldoAtual: produto.estoque, justificativa, data: new Date().toISOString() }); salvar("acalma_movimentacoes_estoque", movimentos);
    document.querySelector("#produtoEstoqueAtual").textContent = `${produto.estoque} unidade(s)`; document.querySelector("#produtoMovimentoQuantidade").value = ""; document.querySelector("#produtoMovimentoJustificativa").value = "";
    renderProdutosAdmin(); toast("Movimentação de estoque registrada.");
  });
  document.querySelector("#tabelaProdutosAdmin").addEventListener("click", e => {
    const editar = e.target.dataset.editar, status = e.target.dataset.status;
    if (editar) abrirProduto(produtosAdmin.find(p => p.id === Number(editar)));
    if (status) { const p = produtosAdmin.find(item => item.id === Number(status)); const motivo = prompt(`Informe a justificativa para ${p.status === "ativo" ? "inativar" : "ativar"} ${p.nome}:`); if (!motivo?.trim()) return toast("A justificativa é obrigatória."); p.status = p.status === "ativo" ? "inativo" : "ativo"; p.motivoStatus = motivo.trim(); salvar("acalma_produtos", produtosAdmin); renderProdutosAdmin(); toast(`Produto ${p.status === "ativo" ? "ativado" : "inativado"}.`); }
  });
  document.querySelector("#formProduto").addEventListener("submit", e => {
    e.preventDefault(); const id = Number(document.querySelector("#produtoId").value); const custo = Number(document.querySelector("#produtoCusto").value); const margem = Number(document.querySelector("#produtoGrupo").value); const estoque = Number(document.querySelector("#produtoEstoque").value);
    const produtoAtual = id ? produtosAdmin.find(p => p.id === id) : null; const saldoEstoque = produtoAtual ? produtoAtual.estoque : estoque; const dados = { id: id || Date.now(), nome: document.querySelector("#produtoNome").value, categoria: document.querySelector("#produtoCategoria").value, codigo: document.querySelector("#produtoCodigo").value.toUpperCase(), custo, margem, preco: custo * (1 + margem / 100), descricao: document.querySelector("#produtoDescricao").value, estoque: saldoEstoque, status: produtoAtual?.status || (saldoEstoque > 0 ? "ativo" : "inativo"), motivoStatus: produtoAtual?.motivoStatus || "" };
    if (saldoEstoque === 0) { dados.status = "inativo"; dados.motivoStatus = "FORA DE MERCADO — inativação automática por estoque zerado"; } else if (dados.status === "inativo" && dados.motivoStatus.includes("FORA DE MERCADO")) { dados.status = "ativo"; dados.motivoStatus = "Reativação automática após atualização do estoque"; }
    const duplicado = produtosAdmin.some(p => p.codigo === dados.codigo && p.id !== dados.id); if (duplicado) return toast("Já existe um produto com esse código.");
    produtosAdmin = id ? produtosAdmin.map(p => p.id === id ? dados : p) : [...produtosAdmin, dados]; salvar("acalma_produtos", produtosAdmin); modal.close(); renderProdutosAdmin(); toast("Produto salvo com sucesso.");
  });
}

function renderEstoque() {
  const select = document.querySelector("#estoqueProduto"); if (!select) return;
  select.innerHTML = produtosAdmin.filter(p => p.status === "ativo").map(p => `<option value="${p.id}">${p.codigo} — ${p.nome}</option>`).join("");
  document.querySelector("#listaEstoque").innerHTML = produtosAdmin.map(p => `<div class="estoque-item"><div><strong>${p.nome}</strong><span>${p.codigo}</span></div><div class="estoque-barra"><i style="width:${Math.min(p.estoque * 4, 100)}%"></i></div><strong class="${p.estoque < 5 ? "texto-alerta" : ""}">${p.estoque} un.</strong></div>`).join("");
  document.querySelector("#totalEstoque").textContent = produtosAdmin.reduce((s, p) => s + p.estoque, 0); document.querySelector("#estoqueBaixo").textContent = produtosAdmin.filter(p => p.estoque < 5).length;
  const mov = obter("acalma_estoque", []); document.querySelector("#entradasMes").textContent = 36 + mov.reduce((s, m) => s + m.quantidade, 0);
  document.querySelector("#historicoEstoque").innerHTML = mov.length ? mov.map(m => `<tr><td>${new Date(`${m.data}T12:00`).toLocaleDateString("pt-BR")}</td><td>${m.produto}</td><td>${m.fornecedor}</td><td>+${m.quantidade}</td><td>${moeda(m.custo)}</td></tr>`).join("") : `<tr><td colspan="5" class="tabela-vazia">Nenhuma entrada registrada nesta sessão.</td></tr>`;
}
if (document.querySelector("#formEstoque")) {
  document.querySelector("#estoqueData").value = new Date().toISOString().slice(0, 10); renderEstoque();
  document.querySelector("#formEstoque").addEventListener("submit", e => { e.preventDefault(); const id = Number(document.querySelector("#estoqueProduto").value); const quantidade = Number(document.querySelector("#estoqueQuantidade").value); if (quantidade < 1) return toast("A quantidade deve ser maior que zero."); const p = produtosAdmin.find(x => x.id === id); const novoCusto = Number(document.querySelector("#estoqueCusto").value); p.estoque += quantidade; p.custo = Math.max(Number(p.custo||0), novoCusto); p.preco = p.custo * (1 + p.margem / 100); if(p.status==="inativo"&&p.motivoStatus?.includes("FORA DE MERCADO")){p.status="ativo";p.motivoStatus="Reativação automática após entrada de estoque"} salvar("acalma_produtos", produtosAdmin); const mov = obter("acalma_estoque", []); mov.unshift({ produto: p.nome, quantidade, custo: novoCusto, fornecedor: document.querySelector("#estoqueFornecedor").value, data: document.querySelector("#estoqueData").value }); salvar("acalma_estoque", mov); e.target.reset(); document.querySelector("#estoqueData").value = new Date().toISOString().slice(0, 10); renderEstoque(); toast("Entrada registrada usando o maior custo para precificação."); });
}
