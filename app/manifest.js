export default function manifest() {
    return {
        name: "Do Santos Market",
        short_name: "Do Santos",
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
