import Link from "next/link";

export function Breadcrumb({ currentPage }) {
    return (
        <div className="breadcrumb">
            <Link href="/">Início</Link>
            <span>/</span>
            <span>{currentPage}</span>
        </div>
    );
}
