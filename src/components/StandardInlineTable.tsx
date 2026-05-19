import React from 'react';
import { parse } from 'yaml';
import EarlyAccessBadge from './EarlyAccessBadge';

interface Column {
    header: string;
    width?: string;
}

interface TableData {
    columns: Column[];
    rows: string[][];
}

function renderInline(content: string): React.ReactNode[] {
    const parts = content.split(/(`[^`]*`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\)|<EarlyAccessBadge\s*\/>)/);
    return parts.map((part, i) => {
        if (i % 2 === 1) {
            if (part.startsWith('<EarlyAccessBadge')) return <EarlyAccessBadge key={i} inline />;
            if (part.startsWith('`')) return <code key={i}>{part.slice(1, -1)}</code>;
            if (part.startsWith('**')) {
                const inner = renderInline(part.slice(2, -2));
                return <strong key={i}>{inner}</strong>;
            }
            if (part.startsWith('*')) {
                const inner = renderInline(part.slice(1, -1));
                return <em key={i}>{inner}</em>;
            }
            const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
            if (linkMatch) return <a key={i} href={linkMatch[2]}>{linkMatch[1]}</a>;
        }
        return part || null;
    });
}

function renderCell(content: string): React.ReactNode {
    const nodes = renderInline(content);
    if (nodes.length === 1 && typeof nodes[0] === 'string') return nodes[0];
    return nodes;
}

export default function StandardInlineTable({ data }: { data: string }): React.JSX.Element {
    const parsed = parse(data) as TableData;
    const { columns, rows } = parsed;
    return (
        <div className="comparison-table-wrapper">
            <table className="comparison-table">
                <colgroup>
                    {columns.map((col, i) => (
                        <col key={i} style={col.width ? { width: col.width } : undefined} />
                    ))}
                </colgroup>
                <thead>
                    <tr>
                        {columns.map((col, i) => (
                            <th key={i}>{col.header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, ri) => (
                        <tr key={ri}>
                            {row.map((cell, ci) => (
                                <td key={ci}>{renderCell(String(cell))}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
