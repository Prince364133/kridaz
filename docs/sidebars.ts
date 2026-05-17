import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';
// @ts-ignore
import apiSidebar from './docs/api/sidebar.ts';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Backend (Project Bible)',
      items: [
        'backend/onboarding',
        'backend/architecture',
        'backend/module-guide',
        'backend/security',
      ],
    },
    {
      type: 'category',
      label: 'Frontend',
      items: [
        'frontend/ARCHITECTURE',
        'frontend/STATE_MANAGEMENT',
        'frontend/COMPONENT_DESIGN',
        'frontend/API_INTEGRATION',
      ],
    },
  ],
  apiSidebar: [
    {
      type: "category",
      label: "Kridaz API",
      link: {
        type: "generated-index",
        title: "Kridaz API Reference",
        description: "Complete API documentation for the Kridaz platform.",
        slug: "/api"
      },
      items: apiSidebar
    }
  ]
};

export default sidebars;
