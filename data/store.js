import { buildWhatsAppUrl } from "../lib/contact";

export const store = {
    name: "DeVille Fashion",
    email: "devillefashions@gmail.com",
    whatsapp: "55042991628586",
    instagram: "#",
    supportHours: [
        "Segunda a sexta das 09h às 18h",
        "Sábado das 09h às 13h",
    ],
};

export const navigation = [
    { label: "Início", href: "/" },
    { label: "Produtos", href: "/produtos" },
    { label: "Contato", href: "/contato" },
    { label: "Políticas de trocas", href: "/politicas-de-trocas" },
    { label: "Perguntas frequentes", href: "/perguntas-frequentes" },
    { label: "Como comprar", href: "/como-comprar" },
];

export const benefits = [
    { title: "Frete grátis", description: "Para compras acima de 800,00" },
    { title: "Cartão de Crédito", description: "Até 4 vezes sem juros" },
    { title: "Pedido minimo", description: "O valor para Pedido Minino é de R$400,00" },
];

export const heroSlides = [
    {
        image: "/assets/hero01.png",
        eyebrow: "Coleção FAV'S Drop",
        title: "Moda feminina com presença, leveza e sofisticação.",
        description: "Peças selecionadas para valorizar o caimento e destacar o seu estilo em qualquer ocasião.",
    },
    {
        image: "/assets/hero2.png",
        eyebrow: "Nova coleção",
        title: "Looks pensados para o dia a dia e para momentos especiais.",
        description: "Explore combinações elegantes com acabamento premium e identidade marcante.",
    },
];

export const promotions = [
    { image: "/assets/promotion1.png", title: "Seleção especial", subtitle: "Peças com acabamento elegante e toque leve." },
    { image: "/assets/promotion03.png", title: "Essenciais da estação", subtitle: "Modelos versáteis para compor produções refinadas." },
];

export const howToBuySteps = [
    {
        title: "Curadoria exclusiva",
        description: "Explore peças com imagens de alta definição, descrições claras e informações de modelagem para uma escolha segura.",
    },
    {
        title: "Escolha sob medida",
        description: "Selecione o tamanho ideal, consulte as medidas e finalize seu interesse diretamente com a equipe.",
    },
    {
        title: "Revisão do pedido",
        description: "Confirme o produto, a cor, o tamanho e as condições de pagamento antes de concluir pelo canal de atendimento.",
    },
    {
        title: "Recebimento flexível",
        description: "Defina se prefere entrega no endereço e finalize o atendimento com a equipe.",
    },
];

export const exchangeSections = [
    {
        title: "Trocas por defeito",
        description: "O prazo para solicitar troca por defeito é de até 30 dias corridos após o recebimento do produto.",
        items: ["Troca pelo mesmo produto", "Crédito na loja", "Reembolso do valor pago"],
    },
    {
        title: "Condições que não permitem troca",
        description: "Não são aceitos produtos com sinais de uso, lavagem, odor ou danos por mau uso.",
        items: ["Sem etiqueta original", "Danificados pelo uso", "Itens promocionais sem defeito de fabricação"],
    },
];

export const faqItems = [
    {
        question: "Como faço para comprar?",
        answer: "Você pode navegar pela coleção, escolher a peça desejada e falar com a equipe pelo WhatsApp para concluir o atendimento de forma rápida.",
    },
    {
        question: "Entrega",
        answer: `CORREIOS

Nessa modalidade de entrega, não conseguimos alterar o valor do frete calculado no site. São duas opções de envio: Sedex e PAC para fretes gratis.

Não somos responsáveis pelo prazo de nenhuma das duas opções depois que despachado (o prazo fica disponível na hora da compra). O prazo de entrega começa a contar após a postagem da encomenda.

Endereço inválido, dados incompletos, local não encontrado, após a 2ª (segunda) tentativa de entrega, caso não haja alguém para receber, os Correios devolvem o pedido para o nosso Centro de distribuição.

Para que o pedido seja enviado novamente, será cobrada uma taxa com o mesmo valor do frete para envio do produto novamente. A mesma situação vale para frete grátis.
Obs: Entregas com frete grátis serão enviadas via PAC.`,
    },
    {
        question: "Quais formas de pagamento vocês aceitam?",
        answer: `CARTÃO DE CREDITO

Aceitamos os cartões de crédito Visa, MasterCard, Amex, Diners Club e Elo.
As compras podem ser parceladas nos cartões de crédito em até 4x sem juros.

PIX

O PIX é um modo de pagamento, disponível sete dias por semana, 24h por dia, de forma on-line e instantânea, no qual a transação ocorre em até 10 segundos.
Se a compra for feita utilizando o computador, basta escanear o QR Code usando o aplicativo do seu banco ou carteira digital.
Caso a compra esteja sendo feita pelo celular, copie o código gerado e cole no aplicativo do seu banco ou carteira digital (“Pagar” > “Pix Copia e Cola”).

A chave do PIX copia e cola expira em 60 minutos.
Caso deseje pagar metade no PIX e metade no cartão, entre em contato com o nosso suporte para te auxiliar.
Pagamentos no PIX possuem 3% de desconto.
Por medidas de segurança, é terminantemente proibido fazer qualquer outra forma de pagamento sem contactar nosso suporte.`,
    },
];

export const contactHighlights = [
    "Atendimento humanizado e rápido.",
    "Suporte por WhatsApp e e-mail real.",
    "Auxílio para pedidos, trocas e cadastro.",
];

export function getProductWhatsAppLink(product) {
    return buildWhatsAppUrl(
        `Olá, tenho interesse no produto ${product.name}.\nCategoria: ${product.category}\nValor: R$ ${product.price.toFixed(2).replace(".", ",")}`
    );
}
