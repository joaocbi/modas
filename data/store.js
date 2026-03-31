import { buildWhatsAppUrl } from "../lib/contact";

export const store = {
    name: "DeVille Fashion",
    email: "devillefashions@gmail.com",
    whatsapp: "551234567890",
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
    { title: "Frete grátis", description: "Condições especiais para pedidos selecionados." },
    { title: "Trocas grátis", description: "Atendimento rápido para ajustes e trocas." },
    { title: "Desconto no Pix", description: "Condições diferenciadas para pagamentos à vista." },
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
    { image: "/assets/promotion2.png", title: "Essenciais da estação", subtitle: "Modelos versáteis para compor produções refinadas." },
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
        title: "Trocas por tamanho ou preferência",
        description: "As solicitações podem ser feitas em até 7 dias corridos, com produto sem uso e com etiqueta original.",
        items: [
            "Produto sem sinais de uso",
            "Etiqueta original afixada",
            "Disponibilidade sujeita ao estoque",
        ],
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
        question: "Vocês fazem troca por tamanho?",
        answer: "Sim. Trocas por tamanho ou preferência podem ser solicitadas em até 7 dias corridos após o recebimento, com o produto sem uso.",
    },
    {
        question: "Quais formas de pagamento vocês aceitam?",
        answer: "Trabalhamos com Pix e cartão de crédito, com condições especiais para pagamentos à vista conforme a campanha vigente.",
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
