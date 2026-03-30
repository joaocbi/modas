export default function manifest() {
    return {
        name: "DeVille Fashion",
        short_name: "DeVille",
        description: "Moda feminina com curadoria elegante e atendimento por WhatsApp.",
        start_url: "/",
        display: "standalone",
        background_color: "#111111",
        theme_color: "#111111",
        icons: [
            {
                src: "/icon.svg",
                sizes: "any",
                type: "image/svg+xml",
            },
            {
                src: "/apple-icon",
                sizes: "180x180",
                type: "image/png",
            },
        ],
    };
}
