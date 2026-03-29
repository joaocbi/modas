import { promises as fs } from "node:fs";
import path from "node:path";
import { prisma } from "./prisma";
import { isAdminMutationEnabled } from "./product-store";

const couponsFilePath = path.join(process.cwd(), "data", "coupons.json");

function hasDatabaseUrl() {
    return Boolean(process.env.DATABASE_URL);
}

function normalizeCoupon(coupon, id) {
    return {
        id,
        code: String(coupon.code || "").trim().toUpperCase(),
        type: String(coupon.type || "").trim(),
        value: Number(coupon.value || 0),
        minOrder: Number(coupon.minOrder || 0),
        active: Boolean(coupon.active),
        usageCount: Number(coupon.usageCount || 0),
    };
}

function mapDatabaseCoupon(coupon) {
    return {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: Number(coupon.value),
        minOrder: Number(coupon.minOrder),
        active: coupon.active,
        usageCount: coupon.usageCount,
    };
}

export async function getAllCoupons() {
    if (hasDatabaseUrl()) {
        const coupons = await prisma.coupon.findMany({
            orderBy: {
                id: "asc",
            },
        });
        console.log("[CouponStore] Loaded coupons from database.", { count: coupons.length });
        return coupons.map(mapDatabaseCoupon);
    }

    const fileContents = await fs.readFile(couponsFilePath, "utf8");
    const parsedCoupons = JSON.parse(fileContents);
    console.log("[CouponStore] Loaded coupons from file fallback.", { count: parsedCoupons.length });
    return parsedCoupons;
}

async function saveCoupons(coupons) {
    await fs.writeFile(couponsFilePath, JSON.stringify(coupons, null, 2), "utf8");
    console.log("[CouponStore] Saved coupons.", { count: coupons.length });
}

export async function createCoupon(input) {
    if (!isAdminMutationEnabled()) {
        throw new Error("DATABASE_URL is required for admin writes in production.");
    }

    if (hasDatabaseUrl()) {
        const coupon = normalizeCoupon(input, undefined);
        const createdCoupon = await prisma.coupon.create({
            data: {
                code: coupon.code,
                type: coupon.type,
                value: coupon.value,
                minOrder: coupon.minOrder,
                active: coupon.active,
                usageCount: coupon.usageCount,
            },
        });
        return mapDatabaseCoupon(createdCoupon);
    }

    const coupons = await getAllCoupons();
    const nextId = coupons.reduce((largestId, coupon) => Math.max(largestId, Number(coupon.id) || 0), 0) + 1;
    const coupon = normalizeCoupon(input, nextId);
    const nextCoupons = [...coupons, coupon];
    await saveCoupons(nextCoupons);
    return coupon;
}

export async function updateCoupon(id, input) {
    if (!isAdminMutationEnabled()) {
        throw new Error("DATABASE_URL is required for admin writes in production.");
    }

    if (hasDatabaseUrl()) {
        const normalizedId = Number(id);
        const coupon = normalizeCoupon(input, normalizedId);
        const updatedCoupon = await prisma.coupon.update({
            where: {
                id: normalizedId,
            },
            data: {
                code: coupon.code,
                type: coupon.type,
                value: coupon.value,
                minOrder: coupon.minOrder,
                active: coupon.active,
                usageCount: coupon.usageCount,
            },
        });
        return mapDatabaseCoupon(updatedCoupon);
    }

    const coupons = await getAllCoupons();
    const normalizedId = Number(id);
    const couponIndex = coupons.findIndex((coupon) => Number(coupon.id) === normalizedId);

    if (couponIndex < 0) {
        throw new Error("Coupon not found.");
    }

    const updatedCoupon = normalizeCoupon({ ...coupons[couponIndex], ...input }, normalizedId);
    const nextCoupons = [...coupons];
    nextCoupons[couponIndex] = updatedCoupon;
    await saveCoupons(nextCoupons);
    return updatedCoupon;
}

export async function deleteCoupon(id) {
    if (!isAdminMutationEnabled()) {
        throw new Error("DATABASE_URL is required for admin writes in production.");
    }

    if (hasDatabaseUrl()) {
        const normalizedId = Number(id);
        await prisma.coupon.delete({
            where: {
                id: normalizedId,
            },
        });
        return;
    }

    const coupons = await getAllCoupons();
    const normalizedId = Number(id);
    const nextCoupons = coupons.filter((coupon) => Number(coupon.id) !== normalizedId);

    if (nextCoupons.length === coupons.length) {
        throw new Error("Coupon not found.");
    }

    await saveCoupons(nextCoupons);
}
