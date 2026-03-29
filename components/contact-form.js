"use client";

import { useMemo, useState } from "react";
import { buildFieldLines, buildMailtoUrl, buildWhatsAppUrl } from "../lib/contact";

function getInitialState(fields) {
    return Object.fromEntries(fields.map((field) => [field.name, ""]));
}

export function ContactForm({ title, description, subject, fields, compact = false }) {
    const [formValues, setFormValues] = useState(() => getInitialState(fields));
    const [statusMessage, setStatusMessage] = useState("");
    const [statusType, setStatusType] = useState("idle");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const filledFields = useMemo(
        () =>
            fields.map((field) => ({
                label: field.label,
                value: formValues[field.name],
            })),
        [fields, formValues]
    );

    function updateValue(name, value) {
        setFormValues((currentValues) => ({
            ...currentValues,
            [name]: value,
        }));
    }

    function buildMessage() {
        return `${subject}\n\n${buildFieldLines(filledFields)}`;
    }

    function getReplyTo() {
        const emailField = fields.find((field) => field.type === "email");
        return emailField ? formValues[emailField.name] : "";
    }

    function handleWhatsApp() {
        const message = buildMessage();
        console.log("[ContactForm] Redirecting to WhatsApp.", { subject, formValues });
        window.open(buildWhatsAppUrl(message), "_blank", "noopener,noreferrer");
    }

    async function handleEmail() {
        const message = buildMessage();
        const replyTo = getReplyTo();

        setIsSubmitting(true);
        setStatusMessage("");
        setStatusType("idle");

        try {
            console.log("[ContactForm] Sending e-mail using API.", { subject, formValues });

            const response = await fetch("/api/contact", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    subject,
                    body: message,
                    replyTo,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                console.log("[ContactForm] API e-mail failed. Falling back to mailto.", data);
                window.location.href = buildMailtoUrl({ subject, body: message });
                setStatusType("warning");
                setStatusMessage("O envio direto não está configurado ainda. Abrimos seu aplicativo de e-mail como alternativa.");
                return;
            }

            setStatusType("success");
            setStatusMessage("Mensagem enviada com sucesso.");
            setFormValues(getInitialState(fields));
        } catch (error) {
            console.log("[ContactForm] Unexpected error during e-mail send. Falling back to mailto.", error);
            window.location.href = buildMailtoUrl({ subject, body: message });
            setStatusType("warning");
            setStatusMessage("Ocorreu um erro no envio direto. Abrimos seu aplicativo de e-mail como alternativa.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <section className={`contact-card ${compact ? "contact-card-compact" : ""}`}>
            <div className="section-heading">
                <h2>{title}</h2>
                <p>{description}</p>
            </div>

            <div className={`form-grid ${compact ? "is-compact" : ""}`}>
                {fields.map((field) => (
                    <label key={field.name} className={`field ${field.fullWidth ? "field-full" : ""}`}>
                        <span>{field.label}</span>
                        {field.type === "textarea" ? (
                            <textarea
                                rows={5}
                                placeholder={field.placeholder}
                                value={formValues[field.name]}
                                onChange={(event) => updateValue(field.name, event.target.value)}
                            />
                        ) : (
                            <input
                                type={field.type}
                                placeholder={field.placeholder}
                                value={formValues[field.name]}
                                onChange={(event) => updateValue(field.name, event.target.value)}
                            />
                        )}
                    </label>
                ))}
            </div>

            <div className="form-actions">
                <button type="button" className="primary-button" onClick={handleWhatsApp}>
                    Enviar por WhatsApp
                </button>
                <button type="button" className="secondary-button" onClick={handleEmail} disabled={isSubmitting}>
                    {isSubmitting ? "Enviando..." : "Enviar por e-mail"}
                </button>
            </div>

            {statusMessage ? <p className={`form-status form-status-${statusType}`}>{statusMessage}</p> : null}
        </section>
    );
}
