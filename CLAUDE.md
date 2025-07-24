# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Next.js 15 React application with TypeScript that serves as a companion webapp for the Orb billing platform. Supports multiple instances (Cloud Infrastructure and AI Agents) with instance-specific configurations and branding.

## Development Commands

### Core Development
```bash
npm run dev     # Start development server
npm run build   # Build for production  
npm start       # Start production server
npm run lint    # Run ESLint
npm test        # Run Jest tests with coverage
```

### Testing
- Tests use Jest with React Testing Library
- Coverage reports generated in `coverage/` directory
- Test files located in `src/__tests__/`

## Architecture

### Multi-Instance Architecture
- Supports two Orb instances: 'cloud-infra' and 'ai-agents'
- Instance configuration in `src/lib/orb-config.ts`
- Each instance has separate API keys and branding
- User selects instance on plan-select page, stored in Zustand state

### Key Directories
- `src/app/` - Next.js App Router with server actions and API routes
- `src/components/` - React components including shadcn/ui components in `ui/`
- `src/lib/store/` - Zustand store definitions with localStorage persistence
- `src/lib/query/` - TanStack Query provider setup
- `src/lib/plans/` - Plan data and pricing utilities
- `src/hooks/` - Custom React hooks

### State Management
- **Global State**: Zustand with persistence for customer sessions and instance selection
- **Server State**: TanStack Query for API data caching and management
- **Customer Store**: Tracks active customer, plan changes, and instance context

### Technology Stack
- **Framework**: Next.js 15 with App Router, React 19, TypeScript
- **Styling**: Tailwind CSS 4, shadcn/ui components, Framer Motion animations
- **API Integration**: orb-billing SDK with lazy-loaded clients - documentation here: https://github.com/orbcorp/orb-node
- **Testing**: Jest with jsdom environment and React Testing Library

### Path Aliases
- `@/*` maps to `./src/*` for clean imports throughout the codebase

### Environment Variables
- API keys for different Orb instances stored in `.env`
- Instance-specific configuration accessed via `getOrbConfig()`

## Key Patterns

### Component Structure
- Uses compound component pattern for complex UI elements
- Server/Client component separation following Next.js App Router patterns
- shadcn/ui components provide consistent design system

### Data Flow
- Server actions handle form submissions
- API routes process webhooks from Orb
- Client-side state manages UI interactions
- Persistent storage maintains user sessions across page loads

### Customer Management
- Dynamic routes at `/customers/[id]` for customer-specific pages
- Customer dashboard shows billing information and usage
- Plan upgrade scheduling through server actions

## Core Philosophy

**TEST-DRIVEN DEVELOPMENT IS NON-NEGOTIABLE.** Every single line of production code must be written in response to a failing test. No exceptions. This is not a suggestion or a preference - it is the fundamental practice that enables all other principles in this document.

I follow Test-Driven Development (TDD) with a strong emphasis on behavior-driven testing and functional programming principles. All work should be done in small, incremental changes that maintain a working state throughout development.

## Quick Reference

**Key Principles:**

- Write tests first (TDD)
- Test behavior, not implementation
- No `any` types or type assertions
- Immutable data only
- Small, pure functions
- TypeScript strict mode always
- Use real schemas/types in tests, never redefine them

**Preferred Tools:**

- **Language**: TypeScript (strict mode)
- **Testing**: Jest/Vitest + React Testing Library
- **State Management**: Prefer immutable patterns

## Testing Principles

### Behavior-Driven Testing

- **No "unit tests"** - this term is not helpful. Tests should verify expected behavior, treating implementation as a black box
- Test through the public API exclusively - internals should be invisible to tests
- No 1:1 mapping between test files and implementation files
- Tests that examine internal implementation details are wasteful and should be avoided
- **Coverage targets**: 100% coverage should be expected at all times, but these tests must ALWAYS be based on business behaviour, not implementation details
- Tests must document expected business behaviour

### Testing Tools

- **Jest** or **Vitest** for testing frameworks
- **React Testing Library** for React components
- **MSW (Mock Service Worker)** for API mocking when needed
- All test code must follow the same TypeScript strict mode rules as production code

### Test Organization

```
src/
  features/
    payment/
      payment-processor.ts
      payment-validator.ts
      payment-processor.test.ts // The validator is an implementation detail. Validation is fully covered, but by testing the expected business behaviour, treating the validation code itself as an implementation detail
```

### Test Data Pattern

Use factory functions with optional overrides for test data:

```typescript
const getMockPaymentPostPaymentRequest = (
  overrides?: Partial<PostPaymentsRequestV3>
): PostPaymentsRequestV3 => {
  return {
    CardAccountId: "1234567890123456",
    Amount: 100,
    Source: "Web",
    AccountStatus: "Normal",
    LastName: "Doe",
    DateOfBirth: "1980-01-01",
    PayingCardDetails: {
      Cvv: "123",
      Token: "token",
    },
    AddressDetails: getMockAddressDetails(),
    Brand: "Visa",
    ...overrides,
  };
};

const getMockAddressDetails = (
  overrides?: Partial<AddressDetails>
): AddressDetails => {
  return {
    HouseNumber: "123",
    HouseName: "Test House",
    AddressLine1: "Test Address Line 1",
    AddressLine2: "Test Address Line 2",
    City: "Test City",
    ...overrides,
  };
};
```

Key principles:

- Always return complete objects with sensible defaults
- Accept optional `Partial<T>` overrides
- Build incrementally - extract nested object factories as needed
- Compose factories for complex objects
- Consider using a test data builder pattern for very complex objects

## TypeScript Guidelines

### Strict Mode Requirements

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

- **No `any`** - ever. Use `unknown` if type is truly unknown
- **No type assertions** (`as SomeType`) unless absolutely necessary with clear justification
- **No `@ts-ignore`** or `@ts-expect-error` without explicit explanation
- These rules apply to test code as well as production code

### Type Definitions

- **Prefer `type` over `interface`** in all cases
- Use explicit typing where it aids clarity, but leverage inference where appropriate
- Utilize utility types effectively (`Pick`, `Omit`, `Partial`, `Required`, etc.)
- Create domain-specific types (e.g., `UserId`, `PaymentId`) for type safety
- Use Zod or any other [Standard Schema](https://standardschema.dev/) compliant schema library to create types, by creating schemas first

```typescript
// Good
type UserId = string & { readonly brand: unique symbol };
type PaymentAmount = number & { readonly brand: unique symbol };

// Avoid
type UserId = string;
type PaymentAmount = number;
```

#### Schema-First Development with Zod

Always define your schemas first, then derive types from them:

```typescript
import { z } from "zod";

// Define schemas first - these provide runtime validation
const PaymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.enum(["USD", "GBP", "EUR"]),
  cardDetails: z.object({
    cvv: z.string().regex(/^\d{3,4}$/),
    token: z.string().min(1),
  }),
});

// Derive types from schemas
type Payment = z.infer<typeof PaymentSchema>;

// Use schemas at runtime boundaries
export const parsePayment = (data: unknown): Payment => {
  return PaymentSchema.parse(data);
};
```

#### Schema Usage in Tests

**CRITICAL**: Tests must use real schemas and types from the main project, not redefine their own.

- Import schemas from shared locations, never redefine in tests
- Mock data factories should use real types derived from real schemas
- Changes to schemas automatically propagate to tests

## Code Style

### Functional Programming

I follow a "functional light" approach:

- **No data mutation** - work with immutable data structures
- **Pure functions** wherever possible
- **Composition** as the primary mechanism for code reuse
- Use array methods (`map`, `filter`, `reduce`) over imperative loops

```typescript
// Good - Pure function with immutable updates
const applyDiscount = (order: Order, discountPercent: number): Order => {
  return {
    ...order,
    items: order.items.map((item) => ({
      ...item,
      price: item.price * (1 - discountPercent / 100),
    })),
  };
};

// Good - Composition over complex logic
const processOrder = (order: Order): ProcessedOrder => {
  return pipe(order, validateOrder, applyPromotions, calculateTax);
};
```

### Code Structure

- **No nested if/else statements** - use early returns, guard clauses, or composition
- **Avoid deep nesting** in general (max 2 levels)
- Keep functions small and focused on a single responsibility
- Prefer flat, readable code over clever abstractions

### Naming Conventions

- **Functions**: `camelCase`, verb-based (e.g., `calculateTotal`, `validatePayment`)
- **Types**: `PascalCase` (e.g., `PaymentRequest`, `UserProfile`)
- **Constants**: `UPPER_SNAKE_CASE` for true constants, `camelCase` for configuration
- **Files**: `kebab-case.ts` for all TypeScript files
- **Test files**: `*.test.ts` or `*.spec.ts`

### No Comments in Code

Code should be self-documenting through clear naming and structure. Comments indicate that the code itself is not clear enough.

```typescript
// Avoid: Comments explaining what the code does
const calculateDiscount = (price: number, customer: Customer): number => {
  // Check if customer is premium
  if (customer.tier === "premium") {
    // Apply 20% discount for premium customers
    return price * 0.8;
  }
  // Regular customers get 10% discount
  return price * 0.9;
};

// Good: Self-documenting code with clear names
const PREMIUM_DISCOUNT_MULTIPLIER = 0.8;
const STANDARD_DISCOUNT_MULTIPLIER = 0.9;

const isPremiumCustomer = (customer: Customer): boolean => {
  return customer.tier === "premium";
};

const calculateDiscount = (price: number, customer: Customer): number => {
  const discountMultiplier = isPremiumCustomer(customer)
    ? PREMIUM_DISCOUNT_MULTIPLIER
    : STANDARD_DISCOUNT_MULTIPLIER;

  return price * discountMultiplier;
};

// Avoid: Complex logic with comments
const processPayment = (payment: Payment): ProcessedPayment => {
  // First validate the payment
  if (!validatePayment(payment)) {
    throw new Error("Invalid payment");
  }

  // Check if we need to apply 3D secure
  if (payment.amount > 100 && payment.card.type === "credit") {
    // Apply 3D secure for credit cards over £100
    const securePayment = apply3DSecure(payment);
    // Process the secure payment
    return executePayment(securePayment);
  }

  // Process the payment
  return executePayment(payment);
};

// Good: Extract to well-named functions
const requires3DSecure = (payment: Payment): boolean => {
  const SECURE_PAYMENT_THRESHOLD = 100;
  return (
    payment.amount > SECURE_PAYMENT_THRESHOLD && payment.card.type === "credit"
  );
};

const processPayment = (payment: Payment): ProcessedPayment => {
  if (!validatePayment(payment)) {
    throw new PaymentValidationError("Invalid payment");
  }

  const securedPayment = requires3DSecure(payment)
    ? apply3DSecure(payment)
    : payment;

  return executePayment(securedPayment);
};
```

**Exception**: JSDoc comments for public APIs are acceptable when generating documentation, but the code should still be self-explanatory without them.

### Prefer Options Objects

Use options objects for function parameters as the default pattern. Only use positional parameters for single-parameter functions or well-established conventions.

```typescript
// Avoid: Multiple positional parameters
const createPayment = (amount: number, currency: string, cardId: string) => {
  // Unclear what each parameter represents
};

// Good: Options object with clear property names
type CreatePaymentOptions = {
  amount: number;
  currency: string;
  cardId: string;
};

const createPayment = (options: CreatePaymentOptions): Payment => {
  const { amount, currency, cardId } = options;
  // implementation
};

// Clear and readable at call site
const payment = createPayment({
  amount: 100,
  currency: "GBP", 
  cardId: "card_123",
});
```

**Guidelines:**
- Default to options objects for functions with multiple parameters
- Always use for functions with optional parameters  
- Destructure options at the start of functions
- Acceptable exceptions: single-parameter pure functions, array methods

## Development Workflow

### TDD Process - THE FUNDAMENTAL PRACTICE

**CRITICAL**: TDD is not optional. Every feature, every bug fix, every change MUST follow this process:

Follow Red-Green-Refactor strictly:

1. **Red**: Write a failing test for the desired behavior. NO PRODUCTION CODE until you have a failing test.
2. **Green**: Write the MINIMUM code to make the test pass. Resist the urge to write more than needed.
3. **Refactor**: Assess the code for improvement opportunities. If refactoring would add value, clean up the code while keeping tests green. If the code is already clean and expressive, move on.

**Common TDD Violations to Avoid:**

- Writing production code without a failing test first
- Writing multiple tests before making the first one pass
- Writing more production code than needed to pass the current test
- Skipping the refactor assessment step when code could be improved
- Adding functionality "while you're there" without a test driving it

**Remember**: If you're typing production code and there isn't a failing test demanding that code, you're not doing TDD.

#### TDD Example Workflow

```typescript
// Step 1: Red - Write failing test
it("should calculate total with shipping", () => {
  const order = { items: [{ price: 30 }], shipping: 5 };
  expect(calculateTotal(order)).toBe(35);
});

// Step 2: Green - Minimal implementation
const calculateTotal = (order: Order): number => {
  return order.items.reduce((sum, item) => sum + item.price, 0) + order.shipping;
};

// Step 3: Red - Add next behavior
it("should apply free shipping over £50", () => {
  const order = { items: [{ price: 60 }], shipping: 5 };
  expect(calculateTotal(order)).toBe(60); // No shipping charge
});

// Step 4: Green - Extend implementation
const calculateTotal = (order: Order): number => {
  const itemsTotal = order.items.reduce((sum, item) => sum + item.price, 0);
  const shipping = itemsTotal > 50 ? 0 : order.shipping;
  return itemsTotal + shipping;
};

// Step 5: Refactor - Extract constants and functions if it adds value
```

### Refactoring - The Critical Third Step

Evaluating refactoring opportunities is not optional - it's the third step in the TDD cycle. After achieving a green state and committing your work, you MUST assess whether the code can be improved. However, only refactor if there's clear value - if the code is already clean and expresses intent well, move on to the next test.

#### What is Refactoring?

Refactoring means changing the internal structure of code without changing its external behavior. The public API remains unchanged, all tests continue to pass, but the code becomes cleaner, more maintainable, or more efficient. Remember: only refactor when it genuinely improves the code - not all code needs refactoring.

#### When to Refactor

- **Always assess after green**: Once tests pass, before moving to the next test, evaluate if refactoring would add value
- **When you see duplication**: But understand what duplication really means (see DRY below)
- **When names could be clearer**: Variable names, function names, or type names that don't clearly express intent
- **When structure could be simpler**: Complex conditional logic, deeply nested code, or long functions
- **When patterns emerge**: After implementing several similar features, useful abstractions may become apparent

**Remember**: Not all code needs refactoring. If the code is already clean, expressive, and well-structured, commit and move on. Refactoring should improve the code - don't change things just for the sake of change.

#### Refactoring Guidelines

##### 1. Commit Before Refactoring

Always commit your working code before starting any refactoring. This gives you a safe point to return to:

```bash
git add .
git commit -m "feat: add payment validation"
# Now safe to refactor
```

##### 2. Look for Useful Abstractions Based on Semantic Meaning

Create abstractions only when code shares the same semantic meaning and purpose. **Duplicate code is far cheaper than the wrong abstraction**.

```typescript
// Similar structure, DIFFERENT semantic meaning - DO NOT ABSTRACT
const validatePaymentAmount = (amount: number): boolean => {
  return amount > 0 && amount <= 10000;
};

const validateTransferAmount = (amount: number): boolean => {
  return amount > 0 && amount <= 10000;
};
// These represent different business concepts that will evolve independently

// Similar structure, SAME semantic meaning - SAFE TO ABSTRACT  
const formatUserDisplayName = (firstName: string, lastName: string): string => {
  return `${firstName} ${lastName}`.trim();
};

const formatCustomerDisplayName = (firstName: string, lastName: string): string => {
  return `${firstName} ${lastName}`.trim();
};

// These represent the same concept: "format a person's name for display"
const formatPersonDisplayName = (firstName: string, lastName: string): string => {
  return `${firstName} ${lastName}`.trim();
};
```

**Questions before abstracting:**
- Do these represent the same concept or just look similar?
- If business rules change for one, should the others change too?
- Am I abstracting based on structure or semantic meaning?

##### 3. Understanding DRY - It's About Knowledge, Not Code

DRY (Don't Repeat Yourself) is about not duplicating **knowledge** in the system, not eliminating similar-looking code.

```typescript
// NOT a DRY violation - different knowledge despite similar structure
const validateUserAge = (age: number): boolean => {
  return age >= 18 && age <= 100; // Legal age requirements
};

const validateProductRating = (rating: number): boolean => {
  return rating >= 1 && rating <= 5; // 5-star rating system
};
// These represent different business rules that may evolve independently

// IS a DRY violation - same knowledge duplicated
class Order {
  calculateTotal(): number {
    const shippingCost = this.itemsTotal > 50 ? 0 : 5.99; // Duplicated knowledge!
    return this.itemsTotal + shippingCost;
  }
}

class ShippingCalculator {
  calculate(orderAmount: number): number {
    return orderAmount > 50 ? 0 : 5.99; // Same shipping logic!
  }
}

// Refactored - knowledge in one place
const FREE_SHIPPING_THRESHOLD = 50;
const calculateShippingCost = (itemsTotal: number): number => {
  return itemsTotal > FREE_SHIPPING_THRESHOLD ? 0 : 5.99;
};
```

##### 4. Maintain External APIs During Refactoring

Refactoring must never break existing consumers. Change internal structure while keeping the same public interface.

```typescript
// Before refactoring - complex single function
export const processPayment = (payment: Payment): ProcessedPayment => {
  // 50 lines of validation and processing logic
  return result;
};

// After refactoring - same API, cleaner internals  
export const processPayment = (payment: Payment): ProcessedPayment => {
  validatePayment(payment);
  const authorized = authorizePayment(payment);
  return capturePayment(authorized);
};

// Internal functions not exported - tests still pass unchanged
```

##### 5. Verify and Commit After Refactoring

**CRITICAL**: After every refactoring:

1. Run all tests - they must pass without modification
2. Run static analysis (linting, type checking) - must pass
3. Commit the refactoring separately from feature changes

```bash
# After refactoring
npm test          # All tests must pass
npm run lint      # All linting must pass
npm run typecheck # TypeScript must be happy

# Only then commit
git add .
git commit -m "refactor: extract payment validation helpers"
```

#### Refactoring Checklist

Before considering refactoring complete, verify:

- [ ] The refactoring actually improves the code (if not, don't refactor)
- [ ] All tests still pass without modification
- [ ] All static analysis tools pass (linting, type checking)
- [ ] No new public APIs were added (only internal ones)
- [ ] Code is more readable than before
- [ ] Any duplication removed was duplication of knowledge, not just code
- [ ] No speculative abstractions were created
- [ ] The refactoring is committed separately from feature changes

#### Example Refactoring Session

```typescript
// After getting tests green with minimal implementation:
describe("Order processing", () => {
  it("calculates total with items and shipping", () => {
    const order = { items: [{ price: 30 }, { price: 20 }], shipping: 5 };
    expect(calculateOrderTotal(order)).toBe(55);
  });

  it("applies free shipping over £50", () => {
    const order = { items: [{ price: 30 }, { price: 25 }], shipping: 5 };
    expect(calculateOrderTotal(order)).toBe(55);
  });
});

// Green implementation (minimal):
const calculateOrderTotal = (order: Order): number => {
  const itemsTotal = order.items.reduce((sum, item) => sum + item.price, 0);
  const shipping = itemsTotal > 50 ? 0 : order.shipping;
  return itemsTotal + shipping;
};

// Commit the working version
// git commit -m "feat: implement order total calculation with free shipping"

// Assess refactoring opportunities:
// - The variable names could be clearer
// - The free shipping threshold is a magic number
// - The calculation logic could be extracted for clarity
// These improvements would add value, so proceed with refactoring:

const FREE_SHIPPING_THRESHOLD = 50;

const calculateItemsTotal = (items: OrderItem[]): number => {
  return items.reduce((sum, item) => sum + item.price, 0);
};

const calculateShipping = (
  baseShipping: number,
  itemsTotal: number
): number => {
  return itemsTotal > FREE_SHIPPING_THRESHOLD ? 0 : baseShipping;
};

const calculateOrderTotal = (order: Order): number => {
  const itemsTotal = calculateItemsTotal(order.items);
  const shipping = calculateShipping(order.shipping, itemsTotal);
  return itemsTotal + shipping;
};

// Run tests - they still pass!
// Run linting - all clean!
// Run type checking - no errors!

// Now commit the refactoring
// git commit -m "refactor: extract order total calculation helpers"
```

##### Example: When NOT to Refactor

```typescript
// After getting this test green:
describe("Discount calculation", () => {
  it("should apply 10% discount", () => {
    const originalPrice = 100;
    const discountedPrice = applyDiscount(originalPrice, 0.1);
    expect(discountedPrice).toBe(90);
  });
});

// Green implementation:
const applyDiscount = (price: number, discountRate: number): number => {
  return price * (1 - discountRate);
};

// Assess refactoring opportunities:
// - Code is already simple and clear
// - Function name clearly expresses intent
// - Implementation is a straightforward calculation
// - No magic numbers or unclear logic
// Conclusion: No refactoring needed. This is fine as-is.

// Commit and move to the next test
// git commit -m "feat: add discount calculation"
```

### Commit Guidelines

- Each commit should represent a complete, working change
- Use conventional commits format:
  ```
  feat: add payment validation
  fix: correct date formatting in payment processor
  refactor: extract payment validation logic
  test: add edge cases for payment validation
  ```
- Include test changes with feature changes in the same commit

### Pull Request Standards

- Every PR must have all tests passing
- All linting and quality checks must pass
- Work in small increments that maintain a working state
- PRs should be focused on a single feature or fix
- Include description of the behavior change, not implementation details

## Working with Claude

### Expectations

When working with my code:

1. **ALWAYS FOLLOW TDD** - No production code without a failing test. This is not negotiable.
2. **Think deeply** before making any edits
3. **Understand the full context** of the code and requirements
4. **Ask clarifying questions** when requirements are ambiguous
5. **Think from first principles** - don't make assumptions
6. **Assess refactoring after every green** - Look for opportunities to improve code structure, but only refactor if it adds value
7. **Keep project docs current** - update them whenever you introduce meaningful changes
   **At the end of every change, update CLAUDE.md with anything useful you wished you'd known at the start**.
   This is CRITICAL - Claude should capture learnings, gotchas, patterns discovered, or any context that would have made the task easier if known upfront. This continuous documentation ensures future work benefits from accumulated knowledge

### Code Changes

When suggesting or making changes:

- **Start with a failing test** - always. No exceptions.
- After making tests pass, always assess refactoring opportunities (but only refactor if it adds value)
- After refactoring, verify all tests and static analysis pass, then commit
- Respect the existing patterns and conventions
- Maintain test coverage for all behavior changes
- Keep changes small and incremental
- Ensure all TypeScript strict mode requirements are met
- Provide rationale for significant design decisions

**If you find yourself writing production code without a failing test, STOP immediately and write the test first.**

### Communication

- Be explicit about trade-offs in different approaches
- Explain the reasoning behind significant design decisions
- Flag any deviations from these guidelines with justification
- Suggest improvements that align with these principles
- When unsure, ask for clarification rather than assuming

## Example Patterns

### Error Handling

Use Result types or early returns:

```typescript
// Good - Result type pattern
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

const processPayment = (payment: Payment): Result<ProcessedPayment, PaymentError> => {
  if (!isValidPayment(payment)) {
    return { success: false, error: new PaymentError("Invalid payment") };
  }
  return { success: true, data: executePayment(payment) };
};

// Good - early returns with exceptions
const processPayment = (payment: Payment): ProcessedPayment => {
  if (!isValidPayment(payment)) {
    throw new PaymentError("Invalid payment");
  }
  return executePayment(payment);
};
```

### Testing Behavior

```typescript
// Good - tests behavior through public API
describe("PaymentProcessor", () => {
  it("should decline payment when insufficient funds", () => {
    const payment = getMockPaymentPostPaymentRequest({ Amount: 1000 });
    const account = getMockAccount({ Balance: 500 });

    const result = processPayment(payment, account);

    expect(result.success).toBe(false);
    expect(result.error.message).toBe("Insufficient funds");
  });

  it("should process valid payment successfully", () => {
    const payment = getMockPaymentPostPaymentRequest({ Amount: 100 });
    const account = getMockAccount({ Balance: 500 });

    const result = processPayment(payment, account);

    expect(result.success).toBe(true);
    expect(result.data.remainingBalance).toBe(400);
  });
});

// Avoid - testing implementation details
describe("PaymentProcessor", () => {
  it("should call checkBalance method", () => {
    // This tests implementation, not behavior
  });
});
```

#### Achieving 100% Coverage Through Business Behavior

Example showing how validation code gets 100% coverage without testing it directly:

```typescript
// payment-validator.ts (implementation detail)
export const validatePaymentAmount = (amount: number): boolean => {
  return amount > 0 && amount <= 10000;
};

export const validateCardDetails = (card: PayingCardDetails): boolean => {
  return /^\d{3,4}$/.test(card.cvv) && card.token.length > 0;
};

// payment-processor.ts (public API)
export const processPayment = (
  request: PaymentRequest
): Result<Payment, PaymentError> => {
  // Validation is used internally but not exposed
  if (!validatePaymentAmount(request.amount)) {
    return { success: false, error: new PaymentError("Invalid amount") };
  }

  if (!validateCardDetails(request.payingCardDetails)) {
    return { success: false, error: new PaymentError("Invalid card details") };
  }

  // Process payment...
  return { success: true, data: executedPayment };
};

// payment-processor.test.ts
describe("Payment processing", () => {
  // These tests achieve 100% coverage of validation code
  // without directly testing the validator functions

  it("should reject payments with negative amounts", () => {
    const payment = getMockPaymentPostPaymentRequest({ amount: -100 });
    const result = processPayment(payment);

    expect(result.success).toBe(false);
    expect(result.error.message).toBe("Invalid amount");
  });

  it("should reject payments exceeding maximum amount", () => {
    const payment = getMockPaymentPostPaymentRequest({ amount: 10001 });
    const result = processPayment(payment);

    expect(result.success).toBe(false);
    expect(result.error.message).toBe("Invalid amount");
  });

  it("should reject payments with invalid CVV format", () => {
    const payment = getMockPaymentPostPaymentRequest({
      payingCardDetails: { cvv: "12", token: "valid-token" },
    });
    const result = processPayment(payment);

    expect(result.success).toBe(false);
    expect(result.error.message).toBe("Invalid card details");
  });

  it("should process valid payments successfully", () => {
    const payment = getMockPaymentPostPaymentRequest({
      amount: 100,
      payingCardDetails: { cvv: "123", token: "valid-token" },
    });
    const result = processPayment(payment);

    expect(result.success).toBe(true);
    expect(result.data.status).toBe("completed");
  });
});
```

### React Component Testing

```typescript
// Good - testing user-visible behavior
describe("PaymentForm", () => {
  it("should show error when submitting invalid amount", async () => {
    render(<PaymentForm />);

    const amountInput = screen.getByLabelText("Amount");
    const submitButton = screen.getByRole("button", { name: "Submit Payment" });

    await userEvent.type(amountInput, "-100");
    await userEvent.click(submitButton);

    expect(screen.getByText("Amount must be positive")).toBeInTheDocument();
  });
});
```

## Common Patterns to Avoid

### Anti-patterns

```typescript
// Avoid: Mutation
const addItem = (items: Item[], newItem: Item) => {
  items.push(newItem); // Mutates array
  return items;
};

// Prefer: Immutable update
const addItem = (items: Item[], newItem: Item): Item[] => {
  return [...items, newItem];
};

// Avoid: Nested conditionals
if (user) {
  if (user.isActive) {
    if (user.hasPermission) {
      // do something
    }
  }
}

// Prefer: Early returns
if (!user || !user.isActive || !user.hasPermission) {
  return;
}
// do something

// Avoid: Large functions
const processOrder = (order: Order) => {
  // 100+ lines of code
};

// Prefer: Composed small functions
const processOrder = (order: Order) => {
  const validatedOrder = validateOrder(order);
  const pricedOrder = calculatePricing(validatedOrder);
  const finalOrder = applyDiscounts(pricedOrder);
  return submitOrder(finalOrder);
};
```

## Resources and References

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Testing Library Principles](https://testing-library.com/docs/guiding-principles)
- [Kent C. Dodds Testing JavaScript](https://testingjavascript.com/)
- [Functional Programming in TypeScript](https://gcanti.github.io/fp-ts/)

## Summary

The key is to write clean, testable, functional code that evolves through small, safe increments. Every change should be driven by a test that describes the desired behavior, and the implementation should be the simplest thing that makes that test pass. When in doubt, favor simplicity and readability over cleverness.