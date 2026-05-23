# Common Directory

This directory contains reusable components, utilities, and shared code that can be used across the application.

## Structure

```
common/
├── components/          # Reusable UI components
│   ├── Button/         # Button component with variants
│   ├── Input/          # Input component with validation
│   ├── Card/           # Card component
│   ├── EmptyState/     # Empty state component
│   ├── Modal/          # Modal component
│   └── index.js        # Component exports
└── README.md           # This file
```

## Components

All components in the `common/components` directory are:
- **Reusable**: Can be used in multiple places
- **Configurable**: Controlled via props
- **Theme-aware**: Support light/dark themes
- **Accessible**: Follow accessibility best practices
- **Documented**: Include PropTypes and JSDoc comments

See [components/README.md](./components/README.md) for detailed component documentation.

## Usage

Import components from the common directory:

```jsx
// Import multiple components
import { Button, Input, Card, EmptyState, Modal } from '@/common/components'

// Or import individually
import Button from '@/common/components/Button'
```

## Adding New Components

When adding a new component to the common directory:

1. Create a folder with the component name
2. Include the component file, styles, and index.js
3. Add PropTypes for all props
4. Add JSDoc comments
5. Export from `common/components/index.js`
6. Update this README

## Best Practices

- Use props to control behavior, not hardcoded values
- Support theme system via CSS variables
- Include accessibility attributes (aria-labels, roles, etc.)
- Make components flexible but with sensible defaults
- Document all props and usage examples

