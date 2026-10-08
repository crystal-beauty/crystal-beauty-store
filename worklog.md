# Project Worklog

---
Task ID: 1
Agent: Super Z (main agent)
Task: Build a complete gift-store e-commerce platform (storefront + admin dashboard) for a client selling gifts (crystal balls, decor). Dark blue theme, boxfox.com-inspired design, single-piece gifts by default with optional gift box add-on, World Express delivery integration, strong Meta Pixel structure, fully editable from dashboard.

Work Log:
- Initialized fullstack environment (Next.js 16 + Prisma/SQLite + Tailwind 4 + shadcn/ui)
- Designed Prisma schema: TeamMember, Category, Product, Variant, VariantOption, PromoCode, Order, OrderItem, ShippingRate, Setting, PixelEvent
- Built core libs: auth (scrypt hashing + HMAC session cookies + role permissions OWNER/ADMIN/STAFF), settings engine (50+ editable keys with defaults), Meta Pixel tracker (browser + CAPI relay with event_id dedup), zustand cart with persist, money/slug utils
- Middleware protects /admin/*; API guards check role per section
- API routes: auth login/logout, public orders (server-side price recompute, stock decrement, promo usage, gift box fees, Purchase CAPI event), promo validate, shipping rates (city > country > worldwide fallback + free-shipping threshold), order tracking, media upload (public/uploads), Meta /api/track relay with SHA-256 hashing, and full admin CRUD (products incl. variants replace-in-transaction, categories, orders incl. World Express booking endpoint, promo codes, team with owner-protections, shipping rates, settings, pixel-events, stats)
- Storefront (route group (store)): home (announcement bar, centered-logo header, hero, trust bar, category cards, bestsellers, gift promise, testimonial carousel, CTA, navy footer), shop with category pills/search/sort, product page (multi-media gallery w/ video support, variant pills with price modifiers + color swatches, gift-box add-on, quantity, ViewContent/AddToCart/InitiateCheckout/GiftBoxSelected events, accordions, related products), cart (per-item gift box toggle, free-shipping nudge), checkout (contact/address, World Express rate selection by country+city, COD/Bank transfer, promo apply, gift message, live totals), order confirmation (Purchase event dedup via eventID query param), order tracking page with progress timeline
- Admin (route group (dashboard) + separate login): overview stats (revenue, orders, low-stock alerts, top sellers, recent orders), products list (search/toggle/delete w/ archive fallback), product editor (media manager with upload/URL/reorder/main badge, variant builder with per-option price/stock/swatch, pricing w/ compare-at + margin, inventory, featured/active), categories, orders manager (status pills, search) + order detail (items, gift message, World Express booking + raw API response viewer, manual tracking, status select), promo codes (percent/fixed, min order, max uses, expiry), team (roles with owner-only deletion + self-protection), shipping (World Express API config + rate CRUD), Meta Pixel center (pixel ID, CAPI token, test event code, advanced matching, event log w/ counts), store settings (7 tabs: general/appearance with live color override/homepage/gift box/payments/contact/SEO)
- Generated 11 AI product/hero images (navy + gold art direction) into public/uploads
- Seeded: owner + staff accounts, 4 categories, 8 products (2 with size variants), WELCOME10 + GIFT20 promos, 6 World Express rates (Dubai same-day, UAE, US, UK, worldwide fallback)
- Fixed: server-to-self fetch in order route (extracted CAPI lib), function-props across server/client boundary in admin layout (passed allowedSections array), removed duplicate hashPassword, invalid image sizes (must be 32px multiples)
- Verified via agent-browser: home/shop/product/cart/checkout/confirmation/track + all 8 admin pages; full purchase flow (variant + gift box + promo WELCOME10 -$7.50 + Dubai shipping $4.99 → order LG-NDRKBD), manual tracking WE-DXB-8847201 + SHIPPED status reflected on customer tracking page, World Express graceful no-API fallback, 43 pixel events logged (PageView/ViewContent/AddToCart/InitiateCheckout/AddPaymentInfo/Purchase browser+server), settings save, mobile viewport render
- ESLint: 0 errors

Stage Summary:
- Deliverable: complete runnable Next.js 16 gift-store platform at /home/z/my-project (dev server on :3000)
- Storefront: / (home), /products, /product/[slug], /cart, /checkout, /order-confirmation/[orderNumber], /track
- Dashboard: /admin (login: admin@luminagifts.com / Admin@123 — OWNER; sara@luminagifts.com / Staff@123 — STAFF)
- Test orders: LG-VN94YQ ($92.48), LG-NDRKBD ($81.48, SHIPPED w/ tracking)
- Key decisions: single-piece gifts by default + order-time gift box add-on (matches client's no-box-unless-asked policy); server-side price recomputation so client totals can't be tampered; Meta Pixel with eventID dedup + optional CAPI token; product deletion falls back to archive when order history exists
