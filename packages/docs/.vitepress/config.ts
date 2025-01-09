import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "applesauce",
  description: "Utilities for nostr apps",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "Home", link: "/" },
      { text: "Reference", link: "https://hzrd149.github.io/applesauce/typedoc/modules/applesauce_core.html" },
    ],

    sidebar: [
      {
        text: "Introduction",
        items: [
          { text: "Why applesauce", link: "/introduction/why-applesauce" },
          { text: "Installation", link: "/introduction/installation" },
          { text: "Getting Started", link: "/introduction/getting-started" },
        ],
      },
      {
        text: "Core",
        items: [
          { text: "Helpers", link: "/core/helpers" },
          { text: "EventStore", link: "/core/event-store" },
          { text: "QueryStore", link: "/core/query-store" },
          { text: "Queries", link: "/core/queries" },
          { text: "Custom Queries", link: "/core/custom-queries" },
        ],
      },
      {
        text: "Signers",
        items: [
          { text: "Installation", link: "/signers/installation" },
          { text: "Signers", link: "/signers/signers" },
          { text: "Nostr Connect", link: "/signers/nostr-connect" },
        ],
      },
      {
        text: "React",
        items: [
          { text: "Installation", link: "/react/installation" },
          { text: "Provider", link: "/react/provider" },
          { text: "Hooks", link: "/react/hooks" },
          { text: "Content", link: "/react/content" },
        ],
      },
      {
        text: "Content",
        items: [
          { text: "Installation", link: "/content/installation" },
          { text: "Text Notes", link: "/content/text" },
          { text: "Markdown", link: "/content/markdown" },
        ],
      },
      {
        text: "Factory",
        items: [
          { text: "Installation", link: "/factory/installation" },
          { text: "Event Factory", link: "/factory/factory" },
          { text: "Blueprints", link: "/factory/blueprints" },
          { text: "Operations", link: "/factory/operations" },
          { text: "Helpers", link: "/factory/helpers" },
        ],
      },
      {
        text: "Loaders",
        items: [
          { text: "Installation", link: "/loaders/installation" },
          { text: "Replaceable Loader", link: "/loaders/replaceable-loader" },
        ],
      },
      {
        text: "Lists",
        items: [{ text: "Installation", link: "/lists/installation" }],
      },
      {
        text: "Channels",
        items: [
          { text: "Installation", link: "/channels/installation" },
          { text: "Queries", link: "/channels/queries" },
        ],
      },
    ],

    socialLinks: [{ icon: "github", link: "https://github.com/hzrd149/applesauce" }],
  },
});
