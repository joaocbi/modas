"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminLoginForm({ isConfigured }) {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");

    async function handleSubmit(event) {
        event.preventDefault();
        setIsLoading(true);
        setStatusMessage("");

        try {
            const response = await fetch("/api/admin/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    password,
                }),
            });

            const data = await response.json();
            console.log("[AdminLogin] Login response received.", data);

            if (!response.ok) {
                setStatusMessage(data.message || "Não foi possível entrar.");
                return;
            }

            router.push("/admin");
            router.refresh();
        } catch (error) {
            console.log("[AdminLogin] Failed to submit login.", error);
            setStatusMessage("Ocorreu um erro ao tentar entrar.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="admin-auth-shell">
            <div className="admin-auth-card">
                <p className="section-kicker">Admin</p>
                <h1>Painel administrativo</h1>
                <p>Faça login para gerenciar produtos e atualizar a vitrine da loja.</p>

                {!isConfigured ? (
                    <div className="admin-warning-card">
                        <strong>Configuração pendente</strong>
                        <p>Defina `ADMIN_EMAIL`, `ADMIN_PASSWORD` e `ADMIN_SESSION_SECRET` no ambiente para liberar o acesso.</p>
                    </div>
                ) : null}

                <form className="admin-form" onSubmit={handleSubmit}>
                    <label className="field">
                        <span>E-mail</span>
                        <input
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="admin@empresa.com"
                            disabled={!isConfigured || isLoading}
                            required
                        />
                    </label>

                    <label className="field">
                        <span>Senha</span>
                        <input
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="Sua senha"
                            disabled={!isConfigured || isLoading}
                            required
                        />
                    </label>

                    <button type="submit" className="primary-button" disabled={!isConfigured || isLoading}>
                        {isLoading ? "Entrando..." : "Entrar no painel"}
                    </button>
                </form>

                {statusMessage ? <p className="form-status form-status-warning">{statusMessage}</p> : null}
            </div>
        </div>
    );
}
