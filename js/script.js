// ======================================================
// FILTRO DOS PRODUTOS
// ======================================================

const botoesFiltro = document.querySelectorAll(".filtro");
const produtos = document.querySelectorAll(".produto-card");

botoesFiltro.forEach(function (botao) {
    botao.addEventListener("click", function () {
        const filtroSelecionado = botao.dataset.filtro;

        botoesFiltro.forEach(function (outroBotao) {
            outroBotao.classList.remove("ativo");
        });

        botao.classList.add("ativo");

        produtos.forEach(function (produto) {
            const categoriaProduto = produto.dataset.categoria;

            if (
                filtroSelecionado === "todos" ||
                categoriaProduto === filtroSelecionado
            ) {
                produto.style.display = "flex";
            } else {
                produto.style.display = "none";
            }
        });
    });
});


// ======================================================
// CARRINHO
// ======================================================

// Recupera o carrinho salvo no navegador.
// Se ainda não existir carrinho, começa com um array vazio.
let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];


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
}


// ======================================================
// ADICIONAR PRODUTO AO CARRINHO
// ======================================================

const botoesAdicionar = document.querySelectorAll(".produto-botao");

botoesAdicionar.forEach(function (botao) {
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


        // Procura se esse produto já está no carrinho.
        const produtoExistente = carrinho.find(function (produto) {
            return produto.nome === nomeProduto;
        });


        // Se já existir, aumenta a quantidade.
        if (produtoExistente) {

            produtoExistente.quantidade++;

        } else {

            // Caso contrário, cria um novo produto.
            const produto = {
                nome: nomeProduto,
                preco: precoProduto,
                imagem: imagemProduto,
                quantidade: 1
            };

            carrinho.push(produto);
        }


        salvarCarrinho();

        alert(nomeProduto + " foi adicionado ao carrinho!");
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

        listaCarrinho.innerHTML = `
            <p class="carrinho-vazio">
                Seu carrinho está vazio.
            </p>
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
                src="../${produto.imagem}"
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