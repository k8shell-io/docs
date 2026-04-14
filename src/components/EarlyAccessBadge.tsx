import React from 'react';
import Link from '@docusaurus/Link';

export default function EarlyAccessBadge({ inline, noLink }: { inline?: boolean; noLink?: boolean } = {}): React.ReactElement {
    const variant = inline ? 'early-access-badge--inline' : 'early-access-badge--page';
    const className = `early-access-badge ${variant}`;
    const img = <img src="/img/early-access.svg" alt="Early Access" />;
    if (noLink) {
        return <span className={className}>{img}</span>;
    }
    return (
        <Link
            to="/licensing#early-access"
            className={className}
            title="This feature is in early access — click to learn more"
        >
            {img}
        </Link>
    );
}
