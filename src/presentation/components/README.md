# React Components

This directory contains reusable React components for the Airbnb Image Optimizer application. All components are built with TypeScript, Tailwind CSS, and follow accessibility best practices.

## Components Overview

### ImageComparison
A comprehensive image comparison component with multiple view modes, zoom functionality, and download capabilities.

**Features:**
- Split-screen, slider, and toggle view modes
- Zoom in/out functionality with reset
- Download individual or all optimized images
- Loading states and error handling
- Accessibility support with ARIA labels
- Real-time status indicators

**Usage:**
```tsx
import { ImageComparison } from '@/presentation/components/ImageComparison/ImageComparison';

<ImageComparison
  imagePair={imagePair}
  jobId="job-123"
  onDownload={(pair) => console.log('Download', pair)}
  onDownloadAll={() => console.log('Download all')}
  showDownloadAll={true}
/>
```

### URLInput
A form input component for Airbnb listing URLs with comprehensive validation and user experience features.

**Features:**
- Real-time URL validation for Airbnb domains
- Paste detection with visual feedback
- Debounced validation to prevent excessive API calls
- Advanced options for customizing max images
- Loading states and error handling
- Accessibility support with proper ARIA attributes

**Usage:**
```tsx
import { URLInput } from '@/presentation/components/URLInput/URLInput';

<URLInput
  onSubmit={(request) => console.log('Submit', request)}
  isLoading={false}
  showAdvancedOptions={true}
  maxImages={10}
/>
```

### ProgressIndicator
A real-time progress indicator with detailed status information and interactive controls.

**Features:**
- Real-time progress updates with polling
- Image-by-image progress tracking
- Time estimation for remaining work
- Cancel and retry functionality
- Detailed progress view with metadata
- Auto-refresh with configurable intervals

**Usage:**
```tsx
import { ProgressIndicator } from '@/presentation/components/ProgressIndicator/ProgressIndicator';

<ProgressIndicator
  progress={progressData}
  onCancel={() => console.log('Cancel')}
  onRetry={() => console.log('Retry')}
  showDetailedProgress={true}
  autoRefresh={true}
/>
```

## Design System

### Design Tokens
All components use a centralized design token system located in `src/styles/design-tokens.ts`. This ensures consistent styling across the application.

**Key Design Tokens:**
- **Colors**: Primary, success, error, warning, and room-type specific colors
- **Spacing**: Consistent spacing scale from xs (4px) to 6xl (64px)
- **Typography**: Font families, sizes, and weights
- **Shadows**: Elevation system with multiple shadow levels
- **Animations**: Duration and easing functions for smooth transitions

### Tailwind CSS Integration
Components are styled using Tailwind CSS with custom design tokens. The configuration is located in `tailwind.config.ts` and includes:

- Custom color palettes for brand and room types
- Consistent spacing and typography scales
- Custom animations and transitions
- Responsive breakpoints
- Z-index management

## Testing

All components include comprehensive unit tests with 80%+ coverage:

- **ImageComparison.test.tsx**: Tests for view modes, zoom, download, and error handling
- **URLInput.test.tsx**: Tests for validation, form submission, and accessibility
- **ProgressIndicator.test.tsx**: Tests for progress display, time estimation, and interactions

**Running Tests:**
```bash
npm test
npm run test:coverage
```

## Storybook

Interactive documentation and component playground is available via Storybook:

**Running Storybook:**
```bash
npm run storybook
```

**Stories Available:**
- All component states and variations
- Interactive demos with real-time updates
- Accessibility testing scenarios
- Different room types and processing states

## Accessibility

All components follow WCAG 2.1 AA guidelines:

- **Keyboard Navigation**: Full keyboard support with proper tab order
- **Screen Reader Support**: Comprehensive ARIA labels and roles
- **Color Contrast**: Meets minimum contrast requirements
- **Focus Management**: Clear focus indicators and logical flow
- **Error Handling**: Accessible error messages and validation feedback

## API Integration

Components integrate with the application's API service layer:

- **ApiService**: Centralized API calls with error handling
- **Type Safety**: Full TypeScript support with generated types
- **Error Handling**: Consistent error states across components
- **Loading States**: Proper loading indicators and disabled states

## Performance

Components are optimized for performance:

- **React.memo**: Prevents unnecessary re-renders
- **useCallback**: Memoized event handlers
- **Debounced Validation**: Prevents excessive API calls
- **Lazy Loading**: Images loaded on demand
- **Efficient State Management**: Minimal state updates

## Browser Support

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile**: iOS 14+, Android 8+
- **Accessibility**: Screen readers and assistive technologies

## Development Guidelines

### Component Structure
```
ComponentName/
├── ComponentName.tsx          # Main component
├── ComponentName.test.tsx     # Unit tests
├── ComponentName.stories.tsx  # Storybook stories
└── index.ts                   # Exports
```

### Naming Conventions
- **Components**: PascalCase (e.g., `ImageComparison`)
- **Props**: camelCase (e.g., `onDownload`)
- **CSS Classes**: kebab-case with Tailwind utilities
- **Files**: PascalCase for components, camelCase for utilities

### Code Style
- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb configuration
- **Prettier**: Consistent formatting
- **Husky**: Pre-commit hooks for quality checks

## Contributing

When adding new components or modifying existing ones:

1. **Follow the established patterns** for component structure and styling
2. **Add comprehensive tests** with 80%+ coverage
3. **Create Storybook stories** for all component states
4. **Ensure accessibility compliance** with proper ARIA attributes
5. **Update this README** with any new components or patterns
6. **Test across browsers** and devices
7. **Follow the design token system** for consistent styling

## Troubleshooting

### Common Issues

**Component not rendering:**
- Check that all required props are provided
- Verify TypeScript types are correct
- Check browser console for errors

**Styling issues:**
- Ensure Tailwind CSS is properly configured
- Check that design tokens are imported correctly
- Verify responsive breakpoints are working

**Accessibility issues:**
- Use browser accessibility tools to test
- Check ARIA labels and roles
- Test with keyboard navigation
- Verify screen reader compatibility

**Performance issues:**
- Check for unnecessary re-renders
- Verify memoization is working correctly
- Profile component with React DevTools
