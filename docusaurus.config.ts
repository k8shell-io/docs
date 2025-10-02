import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
    title: 'k8shell.io Docs',
    tagline: 'Cloud-Native Development Environment',
    favicon: 'img/favicon.ico',

    // Set the production url of your site here
    url: 'https://k8shell-io',
    // Set the /<baseUrl>/ pathname under which your site is served
    // For GitHub pages deployment, it is often '/<projectName>/'
    baseUrl: '/docs/',

    // GitHub pages deployment config.
    // If you aren't using GitHub pages, you don't need these.
    organizationName: 'k8shell-io', // Usually your GitHub org/user name.
    projectName: 'docs', // Usually your repo name.

    onBrokenLinks: 'throw',
    onBrokenMarkdownLinks: 'warn',

    // Even if you don't use internationalization, you can use this field to set
    // useful metadata like html lang. For example, if your site is Chinese, you
    // may want to replace "en" with "zh-Hans".
    i18n: {
        defaultLocale: 'en',
        locales: ['en'],
    },

    presets: [
        [
            'classic',
            {
                docs: {
                    sidebarPath: './sidebars.ts',
                    routeBasePath: '/',
                    editUrl:
                        'https://github.com/k8shell-io/docs/tree/main/',
                },
                blog: false,
                theme: {
                    customCss: './src/css/custom.css',
                },
            } satisfies Preset.Options,
        ],
    ],

    themeConfig: {
        navbar: {
            title: 'k8shell.io Docs',
            hideOnScroll: false,
            items: [
                {
                    to: 'https://k8shell.io',
                    label: 'k8shell.io',
                    position: 'right',
                },
                {
                    to: 'https://k8shell.io/examples',
                    label: 'Examples',
                    position: 'right',
                },
                {
                    to: 'https://github.com/k8shell-io',
                    label: 'GitHub',
                    position: 'right',
                },
                {
                    to: 'https://slack.k8shell.io',
                    label: 'Slack',
                    position: 'right',
                },
                {
                    to: 'https://twitter.com/k8shell',
                    label: 'Twitter',
                    position: 'right',
                },
                {
                    type: 'search',
                    position: 'right',
                },
            ],
        },
        prism: {
            theme: prismThemes.github,
            darkTheme: prismThemes.dracula,
        },
    } satisfies Preset.ThemeConfig,
};

export default config;