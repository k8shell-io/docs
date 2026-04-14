import React from 'react';
import featuresData, { LEVEL_LABELS, type FeaturesData, type FeatureTable, type Level } from '../data/features';

function Table({ table }: { table: FeatureTable }) {
    const levels = table.levels.map((entry) => {
        const [name, available] = Object.entries(entry)[0] as [Level, boolean];
        return { name, available };
    });
    return (
        <table className="comparison-table">
            <thead>
                <tr>
                    <th>{table.name}</th>
                    {levels.map(({ name }) => (
                        <th key={name} className="col-check">{LEVEL_LABELS[name]}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {table.items.map((item) => (
                    <tr key={item}>
                        <td>{item}</td>
                        {levels.map(({ name, available }) => (
                            <td key={name} className="col-check">
                                <span className={available ? 'check-yes' : 'check-no'}>
                                    {available ? '\u2713' : '\u2014'}
                                </span>
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

export default function FeatureComparisonTable({ id }: { id?: string } = {}): React.JSX.Element {
    const data = featuresData as FeaturesData;
    const tables = id ? data.tables.filter((t) => t.id === id) : data.tables;
    return (
        <div className="comparison-table-wrapper">
            {tables.map((table) => (
                <Table key={table.id} table={table} />
            ))}
        </div>
    );
}
