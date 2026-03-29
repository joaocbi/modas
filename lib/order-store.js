import { promises as fs } from "node:fs";
import path from "node:path";
import { prisma } from "./prisma";
import { isAdminMutationEnabled } from "./product-store";

const ordersFilePath = path.join(process.cwd(), "data", "orders.json");

function hasDatabaseUrl() {
    return Boolean(process.env.DATABASE_URL);
}

function normalizeOrder(order, id) {
    return {
        id,
        customer: String(order.customer || "").trim(),
        total: Number(order.total || 0),
        status: String(order.status || "").trim(),
        channel: String(order.channel || "").trim(),
        itemCount: Number(order.itemCount || 0),
    };
}

function mapDatabaseOrder(order) {
    return {
        id: order.id,
        customer: order.customer,
        total: Number(order.total),
        status: order.status,
        channel: order.channel,
        itemCount: order.itemCount,
    };
}

export async function getAllOrders() {
    if (hasDatabaseUrl()) {
        const orders = await prisma.order.findMany({
            orderBy: {
                id: "asc",
            },
        });
        console.log("[OrderStore] Loaded orders from database.", { count: orders.length });
        return orders.map(mapDatabaseOrder);
    }

    const fileContents = await fs.readFile(ordersFilePath, "utf8");
    const parsedOrders = JSON.parse(fileContents);
    console.log("[OrderStore] Loaded orders from file fallback.", { count: parsedOrders.length });
    return parsedOrders;
}

async function saveOrders(orders) {
    await fs.writeFile(ordersFilePath, JSON.stringify(orders, null, 2), "utf8");
    console.log("[OrderStore] Saved orders.", { count: orders.length });
}

export async function createOrder(input) {
    if (!isAdminMutationEnabled()) {
        throw new Error("DATABASE_URL is required for admin writes in production.");
    }

    if (hasDatabaseUrl()) {
        const order = normalizeOrder(input, undefined);
        const createdOrder = await prisma.order.create({
            data: {
                customer: order.customer,
                total: order.total,
                status: order.status,
                channel: order.channel,
                itemCount: order.itemCount,
            },
        });
        return mapDatabaseOrder(createdOrder);
    }

    const orders = await getAllOrders();
    const nextId = orders.reduce((largestId, order) => Math.max(largestId, Number(order.id) || 0), 0) + 1;
    const order = normalizeOrder(input, nextId);
    const nextOrders = [...orders, order];
    await saveOrders(nextOrders);
    return order;
}

export async function updateOrder(id, input) {
    if (!isAdminMutationEnabled()) {
        throw new Error("DATABASE_URL is required for admin writes in production.");
    }

    if (hasDatabaseUrl()) {
        const normalizedId = Number(id);
        const order = normalizeOrder(input, normalizedId);
        const updatedOrder = await prisma.order.update({
            where: {
                id: normalizedId,
            },
            data: {
                customer: order.customer,
                total: order.total,
                status: order.status,
                channel: order.channel,
                itemCount: order.itemCount,
            },
        });
        return mapDatabaseOrder(updatedOrder);
    }

    const orders = await getAllOrders();
    const normalizedId = Number(id);
    const orderIndex = orders.findIndex((order) => Number(order.id) === normalizedId);

    if (orderIndex < 0) {
        throw new Error("Order not found.");
    }

    const updatedOrder = normalizeOrder({ ...orders[orderIndex], ...input }, normalizedId);
    const nextOrders = [...orders];
    nextOrders[orderIndex] = updatedOrder;
    await saveOrders(nextOrders);
    return updatedOrder;
}

export async function deleteOrder(id) {
    if (!isAdminMutationEnabled()) {
        throw new Error("DATABASE_URL is required for admin writes in production.");
    }

    if (hasDatabaseUrl()) {
        const normalizedId = Number(id);
        await prisma.order.delete({
            where: {
                id: normalizedId,
            },
        });
        return;
    }

    const orders = await getAllOrders();
    const normalizedId = Number(id);
    const nextOrders = orders.filter((order) => Number(order.id) !== normalizedId);

    if (nextOrders.length === orders.length) {
        throw new Error("Order not found.");
    }

    await saveOrders(nextOrders);
}
