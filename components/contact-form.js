"use client";

import { useMemo, useState } from "react";
import { buildFieldLines, buildMailtoUrl, buildWhatsAppUrl } from "../lib/contact";

function getInitialState(fields) {
    return Object.fromEntries(fields.map((field) => [field.name, ""]));
}

export function ContactForm({ title, description, subject, fields, compact = false }) {
    const [formValues, setFormValues] = useState(() => getInitialState(fields));

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

    function handleWhatsApp() {
        const message = buildMessage();
        console.log("[ContactForm] Redirecting to WhatsApp.", { subject, formValues });
        window.open(buildWhatsAppUrl(message), "_blank", "noopener,noreferrer");
    }

    function handleEmail() {
        const message = buildMessage();
        console.log("[ContactForm] Redirecting to e-mail.", { subject, formValues });
        window.location.href = buildMailtoUrl({ subject, body: message });
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
                <button type="button" className="secondary-button" onClick={handleEmail}>
                    Enviar por e-mail
                </button>
            </div>
        </section>
    );
}
