import { NextResponse } from "next/server";
import { createOrder, updateOrder } from "../../../../../lib/order-store";
import { getAllProducts } from "../../../../../lib/product-store";
import { createMercadoPagoPayment, getMercadoPagoPublicKey, isMercadoPagoConfigured } from "../../../../../lib/mercado-pago";
import { serializeMercadoPagoPayment, syncMercadoPagoOrderWithPayment } from "../../../../../lib/mercado-pago-sync";
import { calculateShippingAmount } from "../../../../../lib/shipping";

function sanitizeDocument(value) {
    return String(value || "").replace(/\D+/g, "");
}

function splitCustomerName(value) {
    const normalizedName = String(value || "").trim();

    if (!normalizedName) {
        return {
            firstName: "",
            lastName: "",
        };
    }

    const [firstName, ...restNames] = normalizedName.split(/\s+/);
    return {
        firstName,
        lastName: restNames.join(" ").trim(),
    };
}

function normalizeCartItems(items, products) {
    const productMap = new Map(products.map((product) => [Number(product.id), product]));

    return items
        .map((item) => {
            const productId = Number(item?.productId || 0);
            const quantity = Math.max(1, Number(item?.quantity || 1));
            const selectedProduct = productMap.get(productId);

            if (!selectedProduct) {
                return null;
            }

            return {
                productId,
                quantity,
                selectedSize: String(item?.selectedSize || selectedProduct.sizes?.[0] || "").trim(),
                selectedColor: String(item?.selectedColor || selectedProduct.colors?.[0] || "").trim(),
                product: selectedProduct,
            };
        })
        .filter(Boolean);
}

function buildPaymentDescription(items) {
    return items
        .map((item) => `${item.quantity}x ${item.product.name}`)
        .join(" | ")
        .slice(0, 240);
}

function calculateOrderTotal(items) {
    return Number(
        items
            .reduce((total, item) => total + Number(item.product.price || 0) * Number(item.quantity || 0), 0)
            .toFixed(2)
    );
}

function buildNotificationUrl(request) {
    return new URL("/api/payments/mercado-pago/webhook", request.url).toString();
}

function buildCustomerPayload(customer) {
    const normalizedDocument = sanitizeDocument(customer?.cpf);
    const { firstName, lastName } = splitCustomerName(customer?.name);

    return {
        email: String(customer?.email || "").trim(),
        first_name: firstName,
        last_name: lastName,
        identification: normalizedDocument
            ? {
                  type: "CPF",
                  number: normalizedDocument,
              }
            : undefined,
    };
}

function validateCheckoutPayload(payload) {
    const customerName = String(payload?.customer?.name || "").trim();
    const customerEmail = String(payload?.customer?.email || "").trim();
    const customerPhone = String(payload?.customer?.phone || "").trim();
    const customerCpf = sanitizeDocument(payload?.customer?.cpf);
    const paymentMethod = String(payload?.paymentMethod || "").trim();
    const items = Array.isArray(payload?.items) ? payload.items : [];

    if (!customerName || !customerEmail || !customerPhone || customerCpf.length !== 11) {
        return "Os dados do cliente estao incompletos.";
    }

    if (!items.length) {
        return "O carrinho esta vazio.";
    }

    if (!["pix", "card"].includes(paymentMethod)) {
        return "A forma de pagamento e invalida.";
    }

    return "";
}

export async function POST(request) {
    if (!isMercadoPagoConfigured()) {
        return NextResponse.json(
            {
                ok: false,
                    message: "Mercado Pago nao esta configurado.",
                requiresPublicKey: !Boolean(getMercadoPagoPublicKey()),
            },
            { status: 503 }
        );
    }

    let createdOrder = null;

    try {
        const payload = await request.json();
        const validationMessage = validateCheckoutPayload(payload);

        if (validationMessage) {
            return NextResponse.json(
                {
                    ok: false,
                    message: validationMessage,
                },
                { status: 400 }
            );
        }

        const products = await getAllProducts();
        const normalizedItems = normalizeCartItems(payload.items, products);

        if (!normalizedItems.length) {
            return NextResponse.json(
                {
                    ok: false,
                    message: "Nenhum produto valido foi encontrado para este carrinho.",
                },
                { status: 400 }
            );
        }

        const subtotalAmount = calculateOrderTotal(normalizedItems);
        const shippingAmount = calculateShippingAmount(subtotalAmount);
        const totalAmount = Number((subtotalAmount + shippingAmount).toFixed(2));
        const itemCount = normalizedItems.reduce((total, item) => total + item.quantity, 0);
        const paymentMethod = String(payload.paymentMethod).trim();
        const customer = {
            name: String(payload.customer.name || "").trim(),
            email: String(payload.customer.email || "").trim(),
            phone: String(payload.customer.phone || "").trim(),
            cpf: sanitizeDocument(payload.customer.cpf),
        };

        if (paymentMethod === "card" && (!payload.card?.token || !payload.card?.paymentMethodId)) {
            return NextResponse.json(
                {
                    ok: false,
                    message: "Os dados do cartao estao incompletos.",
                },
                { status: 400 }
            );
        }

        createdOrder = await createOrder({
            customer: customer.name,
            total: totalAmount,
            status: "pending_payment",
            channel: `mercado_pago_${paymentMethod}`,
            itemCount,
        });

        console.log("[MercadoPagoPayment] Order created for checkout.", {
            orderId: createdOrder.id,
            paymentMethod,
            subtotalAmount,
            shippingAmount,
            totalAmount,
            itemCount,
        });

        const paymentPayload = {
            transaction_amount: totalAmount,
            description: buildPaymentDescription(normalizedItems),
            external_reference: String(createdOrder.id),
            notification_url: buildNotificationUrl(request),
            statement_descriptor: "DEVILLE",
            payer: buildCustomerPayload(customer),
            metadata: {
                customerName: customer.name,
                customerEmail: customer.email,
                customerPhone: customer.phone,
                orderId: String(createdOrder.id),
                paymentMethod,
                subtotalAmount: subtotalAmount.toFixed(2),
                shippingAmount: shippingAmount.toFixed(2),
            },
        };

        if (paymentMethod === "pix") {
            paymentPayload.payment_method_id = "pix";
        } else {
            const installments = Math.max(1, Number(payload.card?.installments || 1));

            paymentPayload.token = String(payload.card.token || "").trim();
            paymentPayload.installments = installments;
            paymentPayload.payment_method_id = String(payload.card.paymentMethodId || "").trim();

            if (payload.card?.issuerId) {
                paymentPayload.issuer_id = Number(payload.card.issuerId);
            }
        }

        const payment = await createMercadoPagoPayment(paymentPayload, {
            idempotencyKey: crypto.randomUUID(),
        });
        const syncResult = await syncMercadoPagoOrderWithPayment(payment);

        console.log("[MercadoPagoPayment] Payment created successfully.", {
            orderId: createdOrder.id,
            paymentId: payment.id,
            status: payment.status,
            paymentMethod,
            notification: syncResult.notification,
        });

        return NextResponse.json({
            ok: true,
            order: {
                ...(syncResult.order || createdOrder),
            },
            payment: serializeMercadoPagoPayment(payment),
        });
    } catch (error) {
        console.log("[MercadoPagoPayment] Failed to create payment.", error);

        if (createdOrder?.id) {
            try {
                await updateOrder(createdOrder.id, {
                    status: "payment_error",
                });
            } catch (updateError) {
                console.log("[MercadoPagoPayment] Failed to flag order as payment_error.", updateError);
            }
        }

        return NextResponse.json(
            {
                ok: false,
                message: "Nao foi possivel processar o pagamento agora.",
            },
            { status: 500 }
        );
    }
}
