import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "applesauce",
  description: "Utilities for nostr apps",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "Home", link: "/" },
      { text: "Examples", link: "https://hzrd149.github.io/applesauce/examples" },
      { text: "Reference", link: "https://hzrd149.github.io/applesauce/typedoc/modules/applesauce_core.html" },
    ],

    sidebar: [
      {
        text: "Introduction",
        items: [
          { text: "Why applesauce", link: "/introduction/why-applesauce" },
          { text: "Getting Started", link: "/introduction/getting-started" },
          { text: "Packages", link: "/introduction/packages" },
        ],
      },
      {
        text: "Core",
        items: [
          { text: "EventStore", link: "/core/event-store" },
          { text: "QueryStore", link: "/core/query-store" },
          { text: "Queries", link: "/core/queries" },
          { text: "Custom Queries", link: "/core/custom-queries" },
          { text: "Helpers", link: "/core/helpers" },
        ],
      },
      {
        text: "Content",
        items: [
          { text: "Text", link: "/content/text" },
          { text: "Markdown", link: "/content/markdown" },
        ],
      },
      {
        text: "Signers",
        items: [
          { text: "Signers", link: "/signers/signers" },
          { text: "Nostr Connect", link: "/signers/nostr-connect" },
        ],
      },
      {
        text: "Accounts",
        items: [
          { text: "Accounts", link: "/accounts/accounts" },
          { text: "Manager", link: "/accounts/manager" },
        ],
      },
      {
        text: "React",
        items: [
          { text: "Provider", link: "/react/provider" },
          { text: "Hooks", link: "/react/hooks" },
          { text: "Content", link: "/react/content" },
        ],
      },
      {
        text: "Factory",
        items: [
          { text: "Event Factory", link: "/factory/factory" },
          { text: "Blueprints", link: "/factory/blueprints" },
          { text: "Operations", link: "/factory/operations" },
          { text: "Helpers", link: "/factory/helpers" },
        ],
      },
      {
        text: "Loaders",
        items: [
          { text: "Loaders", link: "/loaders/loaders" },
          { text: "Replaceable Loader", link: "/loaders/replaceable-loader" },
        ],
      },
    ],

    socialLinks: [{ icon: "github", link: "https://github.com/hzrd149/applesauce" }],
  },
});
