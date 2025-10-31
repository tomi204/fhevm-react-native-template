import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Getting Started',
      items: ['getting-started/quickstart', 'getting-started/configuration'],
    },
    {
      type: 'category',
      label: 'Core Concepts',
      items: [
        'core/overview',
        'core/client',
        'core/encryption',
        'core/decryption',
        'core/permissions',
      ],
    },
    {
      type: 'category',
      label: 'React Hooks',
      items: [
        'hooks/overview',
        'hooks/use-contract',
        'hooks/use-read-contract',
        'hooks/use-write-contract',
        'hooks/use-decrypted-value',
        'hooks/use-token-balance',
        'hooks/use-token-transfer',
        'hooks/use-operator',
        'hooks/use-batch-transactions',
      ],
    },
    {
      type: 'category',
      label: 'Examples',
      items: [
        'examples/basic-usage',
        'examples/encrypted-erc20',
        'examples/confidential-voting',
        'examples/react-native',
      ],
    },
    {
      type: 'category',
      label: 'Storage',
      items: ['storage/overview', 'storage/indexeddb', 'storage/custom'],
    },
    {
      type: 'category',
      label: 'API Reference',
      items: [
        'api/overview',
        'api/client',
        'api/types',
        'api/hooks',
        'api/storage',
      ],
    },
  ],
};

export default sidebars;
