## MODIFIED Requirements

### Requirement: Step 2 — proceed and exit

Step 2 SHALL provide a primary action that saves the configuration and advances
to step 3 (generation), and a way to save and exit while keeping the draft.
Submission for generation happens in step 3, not step 2 — advancing SHALL NOT
charge or submit the book.

#### Scenario: Proceed to step 3

- **WHEN** the user confirms step 2 with a child selected
- **THEN** the configuration is saved and the wizard advances to the step-3 generation screen for that draft, with no charge and the book still a draft

#### Scenario: Save and exit

- **WHEN** the user leaves the wizard without proceeding
- **THEN** the draft and its saved configuration are retained for later resumption

## ADDED Requirements

### Requirement: Step 3 — generation indicator and layout

The step-3 screen SHALL show the wizard step indicator with step 3 active and
present the book's generation state (ready, in progress, done, or failed).

#### Scenario: Step 3 active

- **WHEN** the user views the generation screen for a book
- **THEN** the step indicator shows step 3 as active

### Requirement: Step 3 — start generation

For a configured draft, step 3 SHALL present a ready state with an action to start
generation. Starting SHALL charge the page-tier surcharge and submit the book,
moving it into the in-progress state. Insufficient coins SHALL keep the draft and
direct the user to top up.

#### Scenario: Start generation

- **WHEN** the user starts generation on a ready draft with sufficient coins
- **THEN** the page-tier surcharge is charged, the book is submitted, and it enters the in-progress state

#### Scenario: Insufficient coins at start

- **WHEN** the user starts generation but cannot afford the surcharge
- **THEN** the book remains a draft and the user is directed to top up

### Requirement: Step 3 — live progress

While the book is generating, step 3 SHALL display the four named stages
(heroes → story → illustrations → assemble) with their completion state and a
progress percentage, refreshing automatically until a terminal status.

#### Scenario: Progress advances

- **WHEN** generation is running
- **THEN** the current stage and progress percentage are shown and update without a manual reload

### Requirement: Step 3 — completion and failure

When the book is done, step 3 SHALL present a completed state that opens the book
for reading and offers a return to the dashboard. When generation has failed,
step 3 SHALL show an error state with a way to try again.

#### Scenario: Done opens the reader

- **WHEN** the book reaches the done state
- **THEN** the user can open and read the finished book

#### Scenario: Failure offers retry

- **WHEN** generation has failed
- **THEN** an error is shown with an option to try again
