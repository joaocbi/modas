const { PrismaClient } = require("@prisma/client");
const products = require("../data/products.json");
const orders = require("../data/orders.json");
const coupons = require("../data/coupons.json");

async function main() {
    if (!process.env.DATABASE_URL) {
        console.log("[PrismaSeed] DATABASE_URL is not configured. Skipping seed.");
        return;
    }

    const prisma = new PrismaClient();

    try {
        await prisma.product.deleteMany();
        await prisma.order.deleteMany();
        await prisma.coupon.deleteMany();

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

        for (const order of orders) {
            await prisma.order.create({
                data: {
                    customer: order.customer,
                    total: order.total,
                    status: order.status,
                    channel: order.channel,
                    itemCount: order.itemCount,
                },
            });
        }

        for (const coupon of coupons) {
            await prisma.coupon.create({
                data: {
                    code: coupon.code,
                    type: coupon.type,
                    value: coupon.value,
                    minOrder: coupon.minOrder,
                    active: coupon.active,
                    usageCount: coupon.usageCount,
                },
            });
        }

        console.log("[PrismaSeed] Store data seeded successfully.", {
            products: products.length,
            orders: orders.length,
            coupons: coupons.length,
        });
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((error) => {
    console.error("[PrismaSeed] Failed to seed database.", error);
    process.exit(1);
});
