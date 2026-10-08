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

---
Task ID: 2
Agent: Super Z (main agent)
Task: Upgrade Lumina Gifts to the Algerian COD market — remove all false information, integrate World Express (EcoTrack) live API, COD-optimized storefront (FR/AR RTL), full dashboard rework, reviews system, blocked phones, DZD pricing.

Work Log:
- Verified live carrier API first: fees (57 wilayas, id 50 unserved), communes (has_stop_desk as 0/1, exact carrier spelling), official 1–58 wilaya numbering confirmed (37=Tindouf, 55=Touggourt)
- Schema v2: Order gains wilayaId/wilayaName/commune/address(≤30)/deliveryType/stopDeskName/deliveryFee/carrierStatus/globalStatus/statusHistory/recipient name+phone; 8 COD statuses (NEW…CANCELLED); email optional; country/postal/shipping-table fields removed; Product.weightGrams; new models Review (unique per order, one-time token, approve/hide), BlockedPhone, CarrierCache
- DB force-reset + clean seed (team accounts only — zero demo data); deleted all AI demo images
- lib/carrier.ts: exactly the 5 documented endpoints (Bearer auth, query-param create, DELETE cancel), fallback host, CarrierCache TTL 6h, dup-safe create (existing-tracking short-circuit + pre-call pending marker), defensive status mapping (documented values + keywords, flagged for carrier confirmation)
- Token stored ONLY server-side (.env WORLDEXPRESS_API_TOKEN + optional dashboard setting); admin settings API masks secret keys both directions
- Storefront: FR/AR i18n (cookie + Cairo font + RTL logical properties), DZD money format ("7 490 DA"), COD checkout (05/06/07 validation, numeric keypad, wilaya→commune→home/stopdesk with live fee, address 30-char counter, email optional, gift box/message/recipient), quick-order form + sticky mobile bar on product page, thank-you page with WhatsApp (hidden until number set), track by phone+order-number with live carrier status, policies pages (hidden unless admin filled them), real approved reviews only on product pages, blocked phones + rate limiting (5/h/phone, 30/h/IP)
- Order API recomputes everything server-side: prices from DB, delivery fee live from carrier (no fallback — explicit error + WhatsApp hint), COD montant = products − promo + fee + gift box, stop-desk availability validated server-side
- Dashboard (French): orders list (search phone/name/number/tracking, filters status/wilaya/date, refused-warning badge, bulk send-to-carrier), order detail (call/WhatsApp buttons, status select, ship/cancel-with-carrier-delete/print label/review request, raw API response viewer), print label sheet, carrier page (connection status + test + clear cache + sync statuses + live sample fees), reviews moderation, blocked phones CRUD, product editor weight field + FR labels, settings (9 tabs: identity/colors/announcement FR+AR/hero FR+AR/gift box FR+AR/contact/socials/policies FR+AR/delivery prefs/footer/SEO), stats (new orders, to confirm, in delivery, delivered revenue, refusal rate, orders by wilaya)
- E2E against LIVE World Express: order LG-YWNYVY 4900+700(Alger home)=5600 DA COD → parcel EC6ACY2610086734405 created → re-ship returned existing tracking (dup-safe) → DELETE {"delete":"success"} → cleanup; stop-desk 400 DA verified; non-desk commune correctly rejected; track-by-phone verified; all test data deleted (store back to empty catalog)
- Browser-verified: home FR/AR RTL, product page (DZD, old price only when set, real stock, gift box option, quick order), live fee 700 DA in selector, order button "Confirmer — payer 7 190 DA à la livraison", thank-you page, admin overview/order detail/label/carrier page
- ESLint 0 errors, production build OK

Stage Summary:
- Deliverable: Algerian COD gift store at /home/z/my-project (dev :3000), empty catalog, everything editable from dashboard
- Admin: admin@luminagifts.com / Admin@123 (OWNER); sara@luminagifts.com / Staff@123 (STAFF)
- Carrier: connected live to world-express.ecotrack.dz via .env token; no hardcoded prices anywhere
- Pending for owner: real contact info/photos/policies/hero via dashboard settings; full status list confirmation from carrier; optionally set STORE_PUBLIC_URL env for absolute review links
