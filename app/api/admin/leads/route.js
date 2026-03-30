import { NextResponse } from "next/server";
import { getAdminSession, getAdminUnauthorizedResponse } from "../../../../lib/admin-session";
import { deleteLead, getAllLeads, updateLead } from "../../../../lib/lead-store";

export async function GET() {
    const session = await getAdminSession();
    if (!session) {
        return getAdminUnauthorizedResponse();
    }

    const leads = await getAllLeads();
    return NextResponse.json({
        ok: true,
        leads,
    });
}

export async function PATCH(request) {
    const session = await getAdminSession();
    if (!session) {
        return getAdminUnauthorizedResponse();
    }

    try {
        const payload = await request.json();
        const lead = await updateLead(payload.id, payload);
        return NextResponse.json({
            ok: true,
            lead,
        });
    } catch (error) {
        console.log("[AdminLeads] Failed to update lead.", error);
        return NextResponse.json(
            {
                ok: false,
                message: "Nao foi possivel atualizar o lead.",
            },
            { status: 500 }
        );
    }
}

export async function DELETE(request) {
    const session = await getAdminSession();
    if (!session) {
        return getAdminUnauthorizedResponse();
    }

    try {
        const { searchParams } = new URL(request.url);
        await deleteLead(searchParams.get("id"));
        return NextResponse.json({
            ok: true,
        });
    } catch (error) {
        console.log("[AdminLeads] Failed to delete lead.", error);
        return NextResponse.json(
            {
                ok: false,
                message: "Nao foi possivel remover o lead.",
            },
            { status: 500 }
        );
    }
}
