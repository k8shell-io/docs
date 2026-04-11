import React from 'react';
import DocSidebarItemLink from '@theme-original/DocSidebarItem/Link';
import type DocSidebarItemLinkType from '@theme/DocSidebarItem/Link';
import type { WrapperProps } from '@docusaurus/types';

type Props = WrapperProps<typeof DocSidebarItemLinkType>;

export default function DocSidebarItemLinkWrapper(props: Props): React.ReactElement {
    const isEarlyAccess = props.item?.customProps?.earlyAccess === true;
    if (!isEarlyAccess) {
        return <DocSidebarItemLink {...props} />;
    }
    const modifiedProps = {
        ...props,
        item: {
            ...props.item,
            label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
                    <span>{props.item.label}</span>
                    <span className="early-access-badge early-access-badge--sidebar"><img src="/img/early-access.svg" alt="Early Access" /></span>
                </span>
            ) as unknown as string,
        },
    };
    return <DocSidebarItemLink {...modifiedProps} />;
}
