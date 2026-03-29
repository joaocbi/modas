const { PrismaClient } = require("@prisma/client");
const products = require("../data/products.json");

async function main() {
    if (!process.env.DATABASE_URL) {
        console.log("[PrismaSeed] DATABASE_URL is not configured. Skipping seed.");
        return;
    }

    const prisma = new PrismaClient();

    try {
        await prisma.product.deleteMany();

        for (const product of products) {
            await prisma.product.create({
                data: {
                    name: product.name,
                    description: product.description,
                    category: product.category,
                    sizes: product.sizes,
                    colors: product.colors,
                    price: product.price,
                    oldPrice: product.oldPrice,
                    badge: product.badge,
                    image: product.image,
                    featured: product.featured,
                },
            });
        }

        console.log("[PrismaSeed] Products seeded successfully.", { count: products.length });
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((error) => {
    console.error("[PrismaSeed] Failed to seed database.", error);
    process.exit(1);
});
