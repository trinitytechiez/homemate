# Common Components

This directory contains reusable, configurable components that can be used throughout the application.

## Components

### Button
A highly configurable button component with multiple variants and states.

**Props:**
- `variant`: 'primary' | 'secondary' | 'ghost' | 'danger' (default: 'primary')
- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- `isLoading`: boolean (default: false)
- `disabled`: boolean (default: false)
- `type`: 'button' | 'submit' | 'reset' (default: 'button')
- `className`: string
- `onClick`: function
- `children`: ReactNode (required)

**Example:**
```jsx
import { Button } from '@/common/components'

<Button variant="primary" size="md" isLoading={false} onClick={handleClick}>
  Click Me
</Button>
```

### Input
A reusable input component with validation states and labels.

**Props:**
- `type`: string (default: 'text')
- `variant`: 'default' | 'outlined' (default: 'default')
- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- `hasError`: boolean (default: false)
- `errorMessage`: string
- `label`: string
- `placeholder`: string
- `className`: string
- `id`: string
- `name`: string
- All standard input props

**Example:**
```jsx
import { Input } from '@/common/components'

<Input
  type="email"
  label="Email"
  placeholder="Enter your email"
  hasError={errors.email}
  errorMessage={errors.email}
  value={email}
  onChange={handleChange}
/>
```

### Card
A flexible card component with hover and clickable variants.

**Props:**
- `variant`: 'default' | 'elevated' | 'outlined' (default: 'default')
- `hoverable`: boolean (default: false)
- `clickable`: boolean (default: false)
- `className`: string
- `onClick`: function
- `children`: ReactNode (required)

**Example:**
```jsx
import { Card } from '@/common/components'

<Card variant="elevated" hoverable clickable onClick={handleClick}>
  <h3>Card Title</h3>
  <p>Card content</p>
</Card>
```

### EmptyState
Displays an empty state with icon, title, message, and optional action.

**Props:**
- `icon`: string (default: '📭')
- `title`: string
- `message`: string
- `actionLabel`: string
- `onAction`: function
- `variant`: 'default' | 'minimal' | 'centered' (default: 'default')
- `className`: string

**Example:**
```jsx
import { EmptyState } from '@/common/components'

<EmptyState
  icon="📭"
  title="No items found"
  message="Get started by adding your first item"
  actionLabel="Add Item"
  onAction={handleAdd}
/>
```

### Modal
A reusable modal component with configurable behavior.

**Props:**
- `isOpen`: boolean (required)
- `onClose`: function (required)
- `title`: string
- `children`: ReactNode (required)
- `size`: 'small' | 'medium' | 'large' | 'fullscreen' (default: 'medium')
- `showCloseButton`: boolean (default: true)
- `closeOnOverlayClick`: boolean (default: true)
- `closeOnEscape`: boolean (default: true)
- `className`: string

**Example:**
```jsx
import { Modal } from '@/common/components'

<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Confirm Action"
  size="small"
>
  <p>Are you sure you want to proceed?</p>
</Modal>
```

## Usage

All components can be imported from the common components index:

```jsx
import { Button, Input, Card, EmptyState, Modal } from '@/common/components'
```

Or individually:

```jsx
import Button from '@/common/components/Button'
import Input from '@/common/components/Input'
```

## Theme Support

All components use the theme system and will automatically adapt to light/dark themes based on the `data-theme` attribute on the document root.

## Styling

Components use CSS Modules and the theme system. Custom styling can be applied via the `className` prop or by extending the component styles.

