# Pricing Catalog

## Purpose

Admin-editable, DB-backed catalog of coin prices and packages, served via a cached public read API and a cache-invalidating admin write API, consumed by the frontend through a tagged data cache.

## Requirements

### Requirement: Price catalog

The system SHALL store coin prices as `PriceItem` records, each with a unique `key`, a `label`, a `category`, an integer `amount`, and an `active` flag. The catalog SHALL be seeded with the current costs and coin packages: `BOOK_UNIQUE` (500), `BOOK_TEMPLATE` (300), `PAGE_16` (150), `PAGE_20` (300), `PAGE_24` (450), `HERO_TOPUP` (100), `COMPANION` (100), and coin packages `PACK_300`, `PACK_800`, `PACK_2000`, `PACK_5000`.

#### Scenario: Catalog is seeded

- **WHEN** the database seed runs
- **THEN** a `PriceItem` exists for each defined key with its amount and is `active`

### Requirement: Public pricing read is cached

The system SHALL expose `GET /pricing` returning the active price items. The response SHALL be served from a Redis cache; on a cache miss it SHALL read from the database and populate the cache.

#### Scenario: First read populates cache

- **WHEN** `GET /pricing` is called and the cache is empty
- **THEN** items are read from the database, returned, and stored in the cache

#### Scenario: Subsequent read hits cache

- **WHEN** `GET /pricing` is called and the cache is populated
- **THEN** the response is served from the cache without a database read

### Requirement: Admin price update invalidates cache

The system SHALL expose admin-only `PATCH /pricing/:key` to update a price item's `amount`. The update SHALL persist to the database and invalidate the pricing cache so the next read reflects the new amount. A non-admin caller SHALL receive `403 Forbidden`.

#### Scenario: Admin updates a price

- **WHEN** an admin calls `PATCH /pricing/BOOK_UNIQUE` with a new amount
- **THEN** the `PriceItem` amount is updated and the pricing cache is invalidated

#### Scenario: Updated price is read back

- **WHEN** an admin updates a price and `GET /pricing` is then called
- **THEN** the response reflects the new amount

#### Scenario: Non-admin cannot update a price

- **WHEN** a non-admin user calls `PATCH /pricing/:key`
- **THEN** the response is `403 Forbidden` and the amount is unchanged

### Requirement: Coin logic reads amounts from the catalog

The system SHALL resolve coin costs from `PriceItem` by key rather than hardcoded values, so price changes take effect without code changes.

#### Scenario: Charge uses catalog amount

- **WHEN** a cost is charged for a given price key
- **THEN** the amount debited equals the current `PriceItem.amount` for that key

### Requirement: Frontend reads pricing through a tagged cache

The frontend SHALL fetch `/pricing` through the Next.js data cache under a cache tag so screens do not query the API per request, and SHALL revalidate that tag when an admin updates a price.

#### Scenario: Screens reuse cached pricing

- **WHEN** multiple screens render and read pricing
- **THEN** the pricing data is served from the tagged data cache without a per-request fetch to the database

#### Scenario: Admin update refreshes frontend cache

- **WHEN** an admin updates a price
- **THEN** the pricing tag is revalidated and subsequent renders show the new amount
