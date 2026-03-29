import { NextResponse } from "next/server";
import { deleteLead, getAllLeads, updateLead } from "../../../../lib/lead-store";

export async function GET() {
    const leads = await getAllLeads();
    return NextResponse.json({
        ok: true,
        leads,
    });
}

export async function PATCH(request) {
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
