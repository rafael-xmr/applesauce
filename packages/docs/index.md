---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "AppleSauce"
  text: "Utilities for nostr"
  tagline: Build reactive nostr UI with less code
  actions:
    - theme: alt
      text: Why?
      link: /introduction/why-applesauce
    - theme: brand
      text: Getting Started
      link: /introduction/getting-started

features:
  - title: Utilities
    details: At its core AppleSauce is packages of helper methods to help you parse and understand nostr events
  - title: Reactive
    details: AppleSauce is built on using rxjs observables, which makes subscribing to events and filters simple
  - title: Modular
    details: Every piece of the packages can be used independently, helpers, event store, and signers
  - title: No networking
    details: Batteries are not included, so use any other nostr library to talk to relays. nostr-tools, ndk, nostrify, rx-nostr, etc...
---
