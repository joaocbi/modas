"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

export function FaqList({ items }) {
    const [activeIndex, setActiveIndex] = useState(0);

    return (
        <div className="faq-list">
            {items.map((item, index) => {
                const isOpen = activeIndex === index;

                return (
                    <article key={item.question} className={`faq-item ${isOpen ? "is-open" : ""}`}>
                        <button type="button" className="faq-trigger" onClick={() => setActiveIndex(isOpen ? -1 : index)}>
                            <span>{item.question}</span>
                            <ChevronDown size={18} />
                        </button>
                        <div className="faq-answer">
                            <p>{item.answer}</p>
                        </div>
                    </article>
                );
            })}
        </div>
    );
}
