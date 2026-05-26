# Kridaz Platform Guide

Welcome to the **Kridaz Platform Guide**. This section provides a comprehensive look at the core interfaces, architecture, and user flows of the Kridaz Sports Platform.

## Overview

Kridaz is a production-grade sports management platform built to bridge the gap between athletes, venue owners, and sports professionals. It offers a unified web application where different actors access specialized portals based on their roles.

### Actor Segregation

The platform is designed around strict Role-Based Access Control (RBAC), providing unique experiences for:

- **Users (Players):** Can discover venues, book slots, join tournaments, find nearby players, and manage their wallets.
- **Venue Owners:** Get a dedicated dashboard to manage turf listings, track bookings, view financial analytics, and handle customer reviews.
- **Coaches, Umpires & Scorers:** Professional partners who can list their services, accept bookings, and manage their schedules.
- **Administrators:** Oversee the entire ecosystem, approve partner registrations, handle disputes, and manage marketing banners.

### Core Technologies

The platform leverages a modern tech stack to ensure performance, scalability, and an exceptional user experience:

- **Frontend:** React (Vite), Redux Toolkit, Tailwind CSS, Axios.
- **Backend:** Node.js, Express, MongoDB (Mongoose), Zod validation.
- **Integrations:** Razorpay for secure payments, Cloudinary for asset management.
- **Design System:** A premium dark-mode aesthetic with vibrant cyan-to-lime (`#55DEE8` to `#BFF367`) gradients and accents, glassmorphism elements, and smooth micro-animations.

### Guide Structure

In the following pages, we dive deep into the specific implementations of key user flows, including the code structure, component design, and visual references:

- **[Homepage](./homepage.md):** The main discovery hub for users.
- **[Bookings](./bookings.md):** Managing active schedules and digital passes.
- **[Wallet](./wallet.md):** The digital coin ecosystem and top-ups.
- **[Ground Details](./ground.md):** In-depth venue information and slot picking.
- **[Venues Search](./venues.md):** Location-based discovery and filtering.
- **[Checkout](./checkout.md):** The final payment and confirmation flow.

Explore the sections on the sidebar to understand how Kridaz delivers a seamless sports booking experience.
