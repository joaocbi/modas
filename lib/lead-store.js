import { promises as fs } from "node:fs";
import path from "node:path";
import { prisma } from "./prisma";
import { isAdminMutationEnabled } from "./product-store";

const leadsFilePath = path.join(process.cwd(), "data", "leads.json");

function hasDatabaseUrl() {
    return Boolean(process.env.DATABASE_URL);
}

function normalizeLead(lead, id) {
    return {
        id,
        name: String(lead.name || "").trim(),
        email: String(lead.email || "").trim(),
        phone: String(lead.phone || "").trim(),
        subject: String(lead.subject || "").trim(),
        message: String(lead.message || "").trim(),
        channel: String(lead.channel || "email").trim(),
        status: String(lead.status || "new").trim(),
    };
}

function mapDatabaseLead(lead) {
    return {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        subject: lead.subject,
        message: lead.message,
        channel: lead.channel,
        status: lead.status,
    };
}

export async function getAllLeads() {
    if (hasDatabaseUrl()) {
        const leads = await prisma.lead.findMany({
            orderBy: {
                id: "desc",
            },
        });
        console.log("[LeadStore] Loaded leads from database.", { count: leads.length });
        return leads.map(mapDatabaseLead);
    }

    const fileContents = await fs.readFile(leadsFilePath, "utf8");
    const parsedLeads = JSON.parse(fileContents);
    console.log("[LeadStore] Loaded leads from file fallback.", { count: parsedLeads.length });
    return parsedLeads;
}

async function saveLeads(leads) {
    await fs.writeFile(leadsFilePath, JSON.stringify(leads, null, 2), "utf8");
    console.log("[LeadStore] Saved leads.", { count: leads.length });
}

export async function createLead(input) {
    if (hasDatabaseUrl()) {
        const lead = normalizeLead(input, undefined);
        const createdLead = await prisma.lead.create({
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
        return mapDatabaseLead(createdLead);
    }

    const leads = await getAllLeads();
    const nextId = leads.reduce((largestId, lead) => Math.max(largestId, Number(lead.id) || 0), 0) + 1;
    const lead = normalizeLead(input, nextId);
    const nextLeads = [lead, ...leads];
    await saveLeads(nextLeads);
    return lead;
}

export async function updateLead(id, input) {
    if (!isAdminMutationEnabled()) {
        throw new Error("DATABASE_URL is required for admin writes in production.");
    }

    if (hasDatabaseUrl()) {
        const normalizedId = Number(id);
        const lead = normalizeLead(input, normalizedId);
        const updatedLead = await prisma.lead.update({
            where: {
                id: normalizedId,
            },
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
        return mapDatabaseLead(updatedLead);
    }

    const leads = await getAllLeads();
    const normalizedId = Number(id);
    const leadIndex = leads.findIndex((lead) => Number(lead.id) === normalizedId);

    if (leadIndex < 0) {
        throw new Error("Lead not found.");
    }

    const updatedLead = normalizeLead({ ...leads[leadIndex], ...input }, normalizedId);
    const nextLeads = [...leads];
    nextLeads[leadIndex] = updatedLead;
    await saveLeads(nextLeads);
    return updatedLead;
}

export async function deleteLead(id) {
    if (!isAdminMutationEnabled()) {
        throw new Error("DATABASE_URL is required for admin writes in production.");
    }

    if (hasDatabaseUrl()) {
        await prisma.lead.delete({
            where: {
                id: Number(id),
            },
        });
        return;
    }

    const leads = await getAllLeads();
    const normalizedId = Number(id);
    const nextLeads = leads.filter((lead) => Number(lead.id) !== normalizedId);

    if (nextLeads.length === leads.length) {
        throw new Error("Lead not found.");
    }

    await saveLeads(nextLeads);
}
