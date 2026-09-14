// ======================================================
// FILTRO DOS PRODUTOS
// ======================================================

const botoesFiltro = document.querySelectorAll(".filtro");
const produtos = document.querySelectorAll(".produto-card");
const parametrosBusca = new URLSearchParams(window.location.search);
let termoBuscaProduto = parametrosBusca.get("busca") || "";
let categoriaSelecionada = "todos";

function normalizarBusca(texto) {
    return String(texto || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function filtrarProdutos() {
    const termo = normalizarBusca(termoBuscaProduto);
    let encontrados = 0;

    produtos.forEach(function (produto) {
        const correspondeCategoria = categoriaSelecionada === "todos" || produto.dataset.categoria === categoriaSelecionada;
        const correspondeBusca = !termo || normalizarBusca(produto.textContent).includes(termo);
        const visivel = correspondeCategoria && correspondeBusca;
        produto.style.display = visivel ? "flex" : "none";
        if (visivel) encontrados++;
    });

    let resultado = document.querySelector("#resultadoBuscaProdutos");
    if (termoBuscaProduto && produtos.length) {
        if (!resultado) {
            resultado = document.createElement("p");
            resultado.id = "resultadoBuscaProdutos";
            resultado.className = "resultado-busca-produtos";
            document.querySelector(".catalogo-filtros")?.after(resultado);
        }
        resultado.textContent = encontrados
            ? `${encontrados} produto(s) encontrado(s) para “${termoBuscaProduto}”.`
            : `Nenhum produto encontrado para “${termoBuscaProduto}”.`;
    } else if (resultado) {
        resultado.remove();
    }
}

botoesFiltro.forEach(function (botao) {
    botao.addEventListener("click", function () {
        categoriaSelecionada = botao.dataset.filtro;

        botoesFiltro.forEach(function (outroBotao) {
            outroBotao.classList.remove("ativo");
        });

        botao.classList.add("ativo");

        filtrarProdutos();
    });
});

filtrarProdutos();

const formularioBuscaCatalogo = document.querySelector("#buscaCatalogo");
const campoBuscaCatalogo = document.querySelector("#buscaProdutoCatalogo");
if (formularioBuscaCatalogo && campoBuscaCatalogo) {
    campoBuscaCatalogo.value = termoBuscaProduto;
    formularioBuscaCatalogo.addEventListener("submit", function (evento) {
        evento.preventDefault();
        termoBuscaProduto = campoBuscaCatalogo.value.trim();
        filtrarProdutos();
    });
    campoBuscaCatalogo.addEventListener("input", function () {
        if (!campoBuscaCatalogo.value) {
            termoBuscaProduto = "";
            filtrarProdutos();
        }
    });
}


// ======================================================
// CARRINHO
// ======================================================

// Recupera o carrinho salvo no navegador.
// Se ainda não existir carrinho, começa com um array vazio.
let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
const estoquePadrao = [
    { id: 1, codigo: "CHA-001", nome: "Chá de Camomila", categoria: "Chás", custo: 14, margem: 35, preco: 18.9, estoque: 18, status: "ativo" },
    { id: 2, codigo: "CHA-002", nome: "Chá de Hibisco", categoria: "Chás", custo: 16.2, margem: 35, preco: 21.9, estoque: 14, status: "ativo" },
    { id: 3, codigo: "INF-001", nome: "Infusor de Inox", categoria: "Infusores", custo: 23.9, margem: 25, preco: 29.9, estoque: 3, status: "ativo" },
    { id: 4, codigo: "INF-002", nome: "Infusor Folha", categoria: "Infusores", custo: 19.9, margem: 25, preco: 24.9, estoque: 14, status: "ativo" }
];
if (!localStorage.getItem("acalma_produtos")) localStorage.setItem("acalma_produtos", JSON.stringify(estoquePadrao));
function produtoEstoque(nome) { return (JSON.parse(localStorage.getItem("acalma_produtos")) || []).find(p => p.nome === nome); }


// ======================================================
// CONVERTER PREÇO
// ======================================================

function converterPreco(precoTexto) {
    return Number(
        precoTexto
            .replace("R$", "")
            .replace(".", "")
            .replace(",", ".")
            .trim()
    );
}


// ======================================================
// SALVAR CARRINHO
// ======================================================

function salvarCarrinho() {
    localStorage.setItem("carrinho", JSON.stringify(carrinho));
    window.dispatchEvent(new Event("acalma:cart-updated"));
}


// ======================================================
// ADICIONAR PRODUTO AO CARRINHO
// ======================================================

const botoesAdicionar = document.querySelectorAll(".produto-botao");

botoesAdicionar.forEach(function (botao) {
    const seletorQuantidade = document.createElement("div");
    seletorQuantidade.className = "produto-quantidade";
    seletorQuantidade.setAttribute("aria-label", "Selecionar quantidade");
    seletorQuantidade.innerHTML = `
        <button type="button" class="produto-quantidade-botao" data-quantidade-acao="diminuir" aria-label="Diminuir quantidade">−</button>
        <input class="produto-quantidade-input" type="number" min="1" step="1" value="1" aria-label="Quantidade do produto">
        <button type="button" class="produto-quantidade-botao" data-quantidade-acao="aumentar" aria-label="Aumentar quantidade">+</button>
    `;
    botao.before(seletorQuantidade);

    const campoQuantidade = seletorQuantidade.querySelector(".produto-quantidade-input");
    seletorQuantidade.addEventListener("click", function (evento) {
        const acao = evento.target.dataset.quantidadeAcao;
        if (!acao) return;
        const atual = Number(campoQuantidade.value) || 1;
        campoQuantidade.value = acao === "aumentar" ? atual + 1 : Math.max(1, atual - 1);
    });

    botao.addEventListener("click", function () {

        const cardProduto = botao.closest(".produto-card");

        const nomeProduto =
            cardProduto.querySelector("h3").textContent;

        const precoTexto =
            cardProduto.querySelector(".produto-preco").textContent;

        const precoProduto =
            converterPreco(precoTexto);

        const imagemProduto =
            cardProduto.querySelector("img").getAttribute("src");

        const cadastroProduto = produtoEstoque(nomeProduto);
        const quantidadeAtual = (carrinho.find(p => p.nome === nomeProduto) || {}).quantidade || 0;
        const quantidadeAdicionar = Number(campoQuantidade.value);
        if (!Number.isInteger(quantidadeAdicionar) || quantidadeAdicionar < 1) {
            alert("Informe uma quantidade inteira maior que zero.");
            campoQuantidade.value = 1;
            return;
        }
        if (!cadastroProduto || cadastroProduto.status !== "ativo" || quantidadeAtual + quantidadeAdicionar > cadastroProduto.estoque) {
            alert("Este produto não possui estoque disponível para a quantidade solicitada.");
            return;
        }


        // Procura se esse produto já está no carrinho.
        const produtoExistente = carrinho.find(function (produto) {
            return produto.nome === nomeProduto;
        });


        // Se já existir, aumenta a quantidade.
        if (produtoExistente) {

            produtoExistente.quantidade += quantidadeAdicionar;

        } else {

            // Caso contrário, cria um novo produto.
            const produto = {
                nome: nomeProduto,
                preco: precoProduto,
                imagem: imagemProduto,
                quantidade: quantidadeAdicionar
            };

            carrinho.push(produto);
        }


        salvarCarrinho();
        localStorage.setItem("acalma_cart_expiry", String(Date.now() + 30 * 60 * 1000));

        campoQuantidade.value = 1;
        alert(quantidadeAdicionar + " unidade(s) de " + nomeProduto + " foram adicionadas ao carrinho!");
    });
});

// ======================================================
// EXIBIR PRODUTOS NA PÁGINA DO CARRINHO
// ======================================================

const listaCarrinho = document.querySelector("#lista-carrinho");
const subtotalCarrinho = document.querySelector("#subtotal-carrinho");
const totalCarrinho = document.querySelector("#total-carrinho");

function exibirCarrinho() {

    // Se não estivermos na página do carrinho,
    // a função para por aqui.
    if (!listaCarrinho) {
        return;
    }

    // Limpa a lista antes de montar o carrinho.
    listaCarrinho.innerHTML = "";

    // Se o carrinho estiver vazio.
    if (carrinho.length === 0) {
        const expirados = JSON.parse(localStorage.getItem("acalma_itens_expirados") || "[]");
        listaCarrinho.innerHTML = `
            <p class="carrinho-vazio">
                Seu carrinho está vazio.
            </p>
            ${expirados.length ? `<div class="itens-expirados"><strong>Itens retirados após expiração:</strong><p>${expirados.join(", ")}</p><span>Adicione-os novamente para continuar.</span></div>` : ""}
        `;

        subtotalCarrinho.textContent = "R$ 0,00";
        totalCarrinho.textContent = "R$ 0,00";

        return;
    }


    let total = 0;


    // Percorre todos os produtos salvos no carrinho.
    carrinho.forEach(function (produto, indice) {

        const subtotalProduto =
            produto.preco * produto.quantidade;

        total += subtotalProduto;


        // Cria um elemento para representar o produto.
        const itemCarrinho = document.createElement("div");

        itemCarrinho.classList.add("item-carrinho");


        // Monta o conteúdo do produto.
        itemCarrinho.innerHTML = `
            <img
                src="${produto.imagem}"
                alt="${produto.nome}"
                class="carrinho-imagem"
            >

            <div class="carrinho-item-info">

                <h3>${produto.nome}</h3>

                <p>
                    R$ ${produto.preco.toFixed(2).replace(".", ",")}
                </p>

            </div>

            <div class="carrinho-quantidade">

                <button
                    type="button"
                    class="quantidade-botao"
                    data-acao="diminuir"
                    data-indice="${indice}"
                >
                    -
                </button>

                <span>
                    ${produto.quantidade}
                </span>

                <button
                    type="button"
                    class="quantidade-botao"
                    data-acao="aumentar"
                    data-indice="${indice}"
                >
                    +
                </button>

            </div>

            <p class="carrinho-item-subtotal">
                R$ ${subtotalProduto.toFixed(2).replace(".", ",")}
            </p>

            <button
                type="button"
                class="remover-produto"
                data-acao="remover"
                data-indice="${indice}"
            >
                Remover
            </button>
        `;


        listaCarrinho.appendChild(itemCarrinho);

    });


    // Atualiza os valores do resumo.
    subtotalCarrinho.textContent =
        "R$ " + total.toFixed(2).replace(".", ",");

    totalCarrinho.textContent =
        "R$ " + total.toFixed(2).replace(".", ",");
}


// Exibe o carrinho quando a página carregar.
exibirCarrinho();

// ======================================================
// ALTERAR QUANTIDADE E REMOVER PRODUTOS DO CARRINHO
// ======================================================

if (listaCarrinho) {

    listaCarrinho.addEventListener("click", function (evento) {

        const botaoClicado = evento.target;

        const acao = botaoClicado.dataset.acao;
        const indice = Number(botaoClicado.dataset.indice);

        // Se o elemento clicado não tiver uma ação,
        // não fazemos nada.
        if (!acao) {
            return;
        }


        // AUMENTAR QUANTIDADE
        if (acao === "aumentar") {
            const cadastroProduto = produtoEstoque(carrinho[indice].nome);
            if (!cadastroProduto || carrinho[indice].quantidade >= cadastroProduto.estoque) {
                alert("Quantidade máxima disponível em estoque atingida.");
                return;
            }
            carrinho[indice].quantidade++;

        }


        // DIMINUIR QUANTIDADE
        if (acao === "diminuir") {

            if (carrinho[indice].quantidade > 1) {

                carrinho[indice].quantidade--;

            } else {

                carrinho.splice(indice, 1);

            }

        }


        // REMOVER PRODUTO
        if (acao === "remover") {

            carrinho.splice(indice, 1);

        }


        // Salva as alterações.
        salvarCarrinho();


        // Atualiza a tela.
        exibirCarrinho();

    });

}

// ======================================================
// BOTÃO FINALIZAR COMPRA
// ======================================================

const botaoFinalizarCompra =
    document.querySelector("#botao-seguir");

if (botaoFinalizarCompra) {

    botaoFinalizarCompra.addEventListener(
        "click",
        function () {

            if (carrinho.length === 0) {

                alert(
                    "Seu carrinho está vazio."
                );

                return;
            }


            window.location.href =
                "checkout.html";

        }
    );

}

// ======================================================
// EXIBIR RESUMO NO CHECKOUT
// ======================================================

const checkoutProdutos =
    document.querySelector("#checkout-produtos");

const checkoutTotal =
    document.querySelector("#checkout-total");


function exibirResumoCheckout() {

    if (!checkoutProdutos) {
        return;
    }

    checkoutProdutos.innerHTML = "";

    let total = 0;


    carrinho.forEach(function (produto) {

        const subtotalProduto =
            produto.preco * produto.quantidade;

        total += subtotalProduto;


        const item =
            document.createElement("div");

        item.classList.add("checkout-item");


        item.innerHTML = `

            <span>
                ${produto.nome}
                x ${produto.quantidade}
            </span>

            <span>
                R$ ${subtotalProduto
                    .toFixed(2)
                    .replace(".", ",")}
            </span>

        `;


        checkoutProdutos.appendChild(item);

    });


    checkoutTotal.textContent =
        "R$ " + total
            .toFixed(2)
            .replace(".", ",");

}


exibirResumoCheckout();

// ======================================================
// CONFIRMAR PEDIDO
// ======================================================

const formularioCheckout =
    document.querySelector("#form-checkout");


if (formularioCheckout) {

    formularioCheckout.addEventListener(
        "submit",
        function (evento) {

            evento.preventDefault();


            // Impede finalizar sem produtos.
            if (carrinho.length === 0) {

                alert(
                    "Seu carrinho está vazio."
                );

                return;
            }


            // Pega os dados preenchidos.
            const nome =
                document.querySelector("#nome").value;

            const email =
                document.querySelector("#email").value;

            const pagamento =
                document.querySelector(
                    'input[name="pagamento"]:checked'
                ).value;


            // Cria um pedido.
            const pedido = {

                cliente: nome,

                email: email,

                pagamento: pagamento,

                produtos: carrinho,

                total: carrinho.reduce(
                    function (soma, produto) {

                        return soma +
                            produto.preco *
                            produto.quantidade;

                    },
                    0
                )

            };


            // Salva o pedido no navegador.
            localStorage.setItem(
                "ultimoPedido",
                JSON.stringify(pedido)
            );


            // Limpa o carrinho.
            carrinho = [];

            salvarCarrinho();


            alert(
                "Pedido realizado com sucesso!"
            );


            // Volta para a página inicial.
            window.location.href =
                "index.html";

        }
    );

}

// Reserva local demonstrativa: 30 minutos a partir do último item incluído.
if (listaCarrinho && carrinho.length) {
    let aviso = document.querySelector("#aviso-reserva");
    if (!aviso) { aviso = document.createElement("p"); aviso.id = "aviso-reserva"; aviso.className = "aviso-reserva"; listaCarrinho.before(aviso); }
    function atualizarReserva() {
        const fim = Number(localStorage.getItem("acalma_cart_expiry") || 0);
        const restante = fim - Date.now();
        if (restante <= 0) {
            const removidos = carrinho.map(p => p.nome);
            localStorage.setItem("acalma_itens_expirados", JSON.stringify(removidos));
            carrinho = []; salvarCarrinho(); localStorage.removeItem("acalma_cart_expiry"); exibirCarrinho();
            aviso.textContent = "A reserva expirou. Os itens foram liberados e devem ser adicionados novamente.";
            return;
        }
        const min = Math.floor(restante / 60000), seg = Math.floor((restante % 60000) / 1000);
        aviso.textContent = `Reserva local: ${min}:${String(seg).padStart(2,"0")} restantes${restante <= 300000 ? " — finalize em até 5 minutos" : ""}.`;
        setTimeout(atualizarReserva, 1000);
    }
    atualizarReserva();
}
