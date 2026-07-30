import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'react-native-nitro-speech',
  tagline: 'React Native real-time Speech Recognition powered by Nitro Modules',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://NotGeorgeMessier.github.io',
  baseUrl: '/nitro-speech/',

  organizationName: 'NotGeorgeMessier',
  projectName: 'nitro-speech',
  trailingSlash: false,

  onBrokenLinks: 'throw',

  // Existing docs use CommonMark (`iOS <26`, XML snippets). Keep .md as Markdown, not MDX.
  markdown: {
    format: 'detect',
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          path: '../docs',
          routeBasePath: 'docs',
          sidebarPath: './sidebars.ts',
          editUrl:
            'https://github.com/NotGeorgeMessier/nitro-speech/tree/main/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'nitro-speech',
      logo: {
        alt: 'nitro-speech',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          href: 'https://www.npmjs.com/package/react-native-nitro-speech',
          label: 'npm',
          position: 'right',
        },
        {
          href: 'https://github.com/NotGeorgeMessier/nitro-speech',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Getting Started',
              to: '/docs/',
            },
            {
              label: 'Examples',
              to: '/docs/category/examples',
            },
            {
              label: 'Features',
              to: '/docs/category/features',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/NotGeorgeMessier/nitro-speech',
            },
            {
              label: 'npm',
              href: 'https://www.npmjs.com/package/react-native-nitro-speech',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} George Messier. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'swift', 'kotlin', 'java', 'groovy'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
