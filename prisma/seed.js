const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const products = require("../data/products.json");
const orders = require("../data/orders.json");
const coupons = require("../data/coupons.json");
const leads = require("../data/leads.json");
const productCategories = require("../data/product-categories.json");

function normalizeDatabaseUrl(value) {
    if (!value) {
        return null;
    }

    try {
        const normalizedUrl = new URL(value);
        const sslMode = String(normalizedUrl.searchParams.get("sslmode") || "").toLowerCase();

        if (["prefer", "require", "verify-ca"].includes(sslMode)) {
            normalizedUrl.searchParams.set("sslmode", "verify-full");
            console.log("[PrismaSeed] Normalized DATABASE_URL sslmode.", {
                previousSslMode: sslMode,
                nextSslMode: "verify-full",
            });
        }

        return normalizedUrl.toString();
    } catch (error) {
        console.warn("[PrismaSeed] Failed to normalize DATABASE_URL. Using original value.", {
            errorMessage: error instanceof Error ? error.message : String(error),
        });
        return value;
    }
}

async function main() {
    const databaseUrl = normalizeDatabaseUrl(process.env.DATABASE_URL);

    if (!databaseUrl) {
        console.log("[PrismaSeed] DATABASE_URL is not configured. Skipping seed.");
        return;
    }

    const pool = new Pool({
        connectionString: databaseUrl,
    });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({
        adapter,
    });

    try {
        await prisma.productSubcategory.deleteMany();
        await prisma.productCategory.deleteMany();
        await prisma.product.deleteMany();
        await prisma.order.deleteMany();
        await prisma.coupon.deleteMany();
        await prisma.lead.deleteMany();

        for (const product of products) {
            await prisma.product.create({
                data: {
                    name: product.name,
                    description: product.description,
                    category: product.category,
                    subcategory: product.subcategory,
                    sizes: product.sizes,
                    colors: product.colors,
                    strapShoulderOptions: product.strapShoulderOptions || [],
                    fabricPatternOptions: product.fabricPatternOptions || [],
                    images: product.images || [product.image],
                    videos: product.videos || [],
                    paymentMethods: product.paymentMethods,
                    price: product.price,
                    oldPrice: product.oldPrice,
                    costPrice: product.costPrice,
                    salesFeePercentage: product.salesFeePercentage,
                    totalCost: product.totalCost,
                    mercadoPagoEnabled: product.mercadoPagoEnabled,
                    mercadoPagoLink: product.mercadoPagoLink,
                    badge: product.badge,
                    image: product.image,
                    featured: product.featured,
                    internalNotes: String(product.internalNotes || "").slice(0, 1500),
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

        for (const lead of leads) {
            await prisma.lead.create({
                data: {
                    name: lead.name,
                    email: lead.email,
                    phone: lead.phone,
                    subject: lead.subject,
                    message: lead.message,
                    channel: lead.channel,
                    status: lead.status,
                },
            });
        }

        for (const category of productCategories) {
            await prisma.productCategory.create({
                data: {
                    name: category.name,
                    image: category.image || "",
                    subcategories: {
                        create: (category.subcategories || []).map((subcategory) => ({
                            name: subcategory.name,
                        })),
                    },
                },
            });
        }

        console.log("[PrismaSeed] Store data seeded successfully.", {
            products: products.length,
            orders: orders.length,
            coupons: coupons.length,
            leads: leads.length,
            productCategories: productCategories.length,
        });
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

main().catch((error) => {
    console.error("[PrismaSeed] Failed to seed database.", error);
    process.exit(1);
});
