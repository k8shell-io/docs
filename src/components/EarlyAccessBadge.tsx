import React from 'react';
import Link from '@docusaurus/Link';

export default function EarlyAccessBadge(): React.ReactElement {
    return (
        <Link
            to="/early-access"
            className="early-access-badge early-access-badge--page"
            title="This feature is in early access — click to learn more"
        >
            <img src="/img/early-access.svg" alt="Early Access" />
            <svg className="early-access-anchor" aria-hidden="true">
                <use href="#anchor-link-icon" />
            </svg>
        </Link>
    );
}
