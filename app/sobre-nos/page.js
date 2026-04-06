import { Breadcrumb } from "../../components/breadcrumb";

export const metadata = {
    title: "Sobre Nós | Do Santos Market",
};

export default function AboutPage() {
    return (
        <main className="page-shell">
            <Breadcrumb currentPage="Sobre Nós" />
            <section className="section narrow-section">
                <div className="section-heading align-center">
                    <p className="section-kicker">Nossa história</p>
                    <h1>Sobre Nós</h1>
                    <p>Conheça a Do Santos Market Moda e Acessórios e o propósito por trás da nossa curadoria.</p>
                </div>

                <div className="content-list">
                    <article className="content-card">
                        <h2>Sobre Nós - Do Santos Market Moda e Acessórios</h2>
                        <p>
                            A Do Santos Market Moda e Acessórios é uma loja online fundada em 2010, criada com o propósito de
                            levar estilo, elegância e praticidade até você, onde quer que esteja.
                        </p>
                        <p>
                            Com atuação digital e atendimento ágil, oferecemos uma curadoria especial de produtos que
                            acompanham as principais tendências da moda, sempre prezando pela qualidade e bom gosto.
                        </p>
                        <p>Nosso catálogo inclui:</p>
                        <ul className="styled-list">
                            <li>Moda masculina e feminina</li>
                            <li>Acessórios modernos e versáteis</li>
                            <li>Joias sofisticadas</li>
                            <li>Relógios elegantes para todas as ocasiões</li>
                        </ul>
                        <p>
                            Mesmo sendo uma loja online, nosso compromisso é proporcionar uma experiência de compra segura,
                            prática e confiável. Trabalhamos com transparência, atenção aos detalhes e foco total na
                            satisfação dos nossos clientes.
                        </p>
                        <p>
                            Desde o início, buscamos unir moda e acessibilidade, levando até você peças que valorizam seu
                            estilo e elevam sua autoestima.
                        </p>
                        <p>
                            Do Santos Market não é apenas uma loja - é um espaço digital pensado para quem ama se vestir bem
                            e expressar sua identidade com elegância.
                        </p>
                    </article>
                </div>
            </section>
        </main>
    );
}
