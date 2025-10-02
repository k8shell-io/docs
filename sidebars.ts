import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
    docsSidebar: [
        'index',
        {
            type: 'category',
            label: 'Getting Started',
            collapsible: false,
            items: [
                'getting-started',
                'installation',
            ],
        },
        {
            type: 'category',
            label: 'Reference',
            collapsible: false,
            items: [
                'cli-reference',
                'configuration',
            ],
        },
        {
            type: 'category',
            label: 'Examples & Tutorials',
            collapsible: false,
            items: [
                'examples',
            ],
        },
    ],
};

export default sidebars;