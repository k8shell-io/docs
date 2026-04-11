import React from 'react';
import DocSidebarItemCategory from '@theme-original/DocSidebarItem/Category';
import type DocSidebarItemCategoryType from '@theme/DocSidebarItem/Category';
import type { WrapperProps } from '@docusaurus/types';

type Props = WrapperProps<typeof DocSidebarItemCategoryType>;

export default function DocSidebarItemCategoryWrapper(props: Props): React.ReactElement {
    const isEarlyAccess = props.item?.customProps?.earlyAccess === true;
    if (!isEarlyAccess) {
        return <DocSidebarItemCategory {...props} />;
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
    return <DocSidebarItemCategory {...modifiedProps} />;
}
