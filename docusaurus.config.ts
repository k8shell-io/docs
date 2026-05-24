import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import remarkDirective from 'remark-directive';
import numberedList from './plugins/remark-numberedlist.mjs';
import excalidrawGen from './plugins/remark-excalidraw-gen.mjs';
import rehypeRaw from 'rehype-raw';

const config: Config = {
    title: 'k8Shell Documentation',
    tagline: 'Cloud-native workspaces on Kubernetes',
    favicon: 'img/favicon.ico',
    url: 'https://docs.k8shell.io',
    baseUrl: '/',
    organizationName: 'k8shell-io',
    projectName: 'k8shell',
    onBrokenLinks: 'warn',
    i18n: {
        defaultLocale: 'en',
        locales: ['en'],
    },

    presets: [
        [
            'classic',
            {
                docs: {
                    remarkPlugins: [
                        remarkDirective,   // must come first
                        numberedList,      // your transformer
                        [excalidrawGen, {
                            // optional overrides:
                            // srcDir: 'drawings',
                            // outDir: 'static/img/gen-svg',
                            // extractScript: 'extract-by-boundary.js',
                            // color: '#ff0000',
                            // pad: 0,
                            // prefer: 'stroke',
                        }],
                    ],
                    rehypePlugins: [
                        [rehypeRaw, {
                            passThrough: [
                                'mdxJsxFlowElement',
                                'mdxJsxTextElement',
                                'mdxjsEsm',
                                'mdxFlowExpression',
                                'mdxTextExpression',
                            ],
                        }],
                    ],
                    routeBasePath: '/',
                    sidebarPath: './sidebars.ts',
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

    // Add Mermaid theme
    themes: ['@docusaurus/theme-mermaid'],

    // Configure Mermaid
    markdown: {
        mermaid: true,
        hooks: {
            onBrokenMarkdownLinks: 'warn',
        },
    },

    themeConfig: {
        navbar: {
            logo: {
                alt: 'k8shell logo',
                src: 'img/k8shell-logo-black.svg',
                srcDark: 'img/k8shell-logo-white.svg',
            },
            title: 'Docs',
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
        // Optional: Configure Mermaid theme
        mermaid: {
            theme: {
                light: 'neutral',
                dark: 'dark',
            },
        },
    } satisfies Preset.ThemeConfig,
};

export default config;
