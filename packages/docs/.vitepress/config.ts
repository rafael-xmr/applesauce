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
          { text: "EventStore", link: "/core/event-store" },
          { text: "QueryStore", link: "/core/query-store" },
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
          { text: "Providers", link: "/react/providers" },
          { text: "Hooks", link: "/react/hooks" },
          { text: "Content", link: "/react/content" },
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

    socialLinks: [{ icon: "github", link: "https://github.com/vuejs/vitepress" }],
  },
});
