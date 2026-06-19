## ADDED Requirements

### Requirement: Shared design system

The frontend SHALL provide a shared visual theme ported from the prototype, available to all screens via Tailwind. The theme SHALL define the brand fonts (Nunito for body, Baloo 2 for headings/brand) and the core palette (background `#fdf6ec`, text `#3a322e`, primary `#e8825a`, plus the prototype's purple/green accents), and SHALL standardize pill-shaped buttons, soft shadows, and the coin badge styling.

#### Scenario: Tokens applied globally

- **WHEN** any screen renders
- **THEN** it uses the shared theme fonts, palette, and component styles without redefining them per page

### Requirement: App shell with decorative backdrop

The frontend SHALL provide a layout shell that renders the prototype's decorative blurred-blob backdrop behind page content on authenticated screens.

#### Scenario: Backdrop on authenticated screens

- **WHEN** an authenticated screen (dashboard, children, wizard, wallet) renders
- **THEN** the decorative backdrop is visible behind the content

### Requirement: Shared navigation bar

The frontend SHALL provide a shared `Navbar` component containing the brand, navigation links ("Мои книги" → dashboard, "Дети" → children), a coin-balance badge, a "Создать книгу" CTA, and the user avatar.

#### Scenario: Navbar shows live balance

- **WHEN** an authenticated user views any screen with the navbar
- **THEN** the coin-balance badge displays the user's current balance fetched from the backend

#### Scenario: Navbar navigation

- **WHEN** the user clicks "Мои книги", "Дети", or "Создать книгу"
- **THEN** they are routed to the dashboard, children screen, or book wizard respectively

#### Scenario: Navbar hidden on pre-auth screens

- **WHEN** the user is on the landing, auth, or onboarding screen
- **THEN** the navbar is not rendered
