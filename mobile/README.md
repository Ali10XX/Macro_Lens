# MacroLens Mobile App

A React Native mobile application for the MacroLens nutrition tracking system with beautiful page transition animations.

## Features

- **Smooth Page Transitions**: Custom animations inspired by the web design
- **Amenities Animation**: Scrolling card-based transitions between pages
- **Multiple Animation Types**: Fade, slide, scale, and amenities animations
- **Mobile-First Design**: Optimized for mobile devices
- **Gesture Support**: Smooth swipe gestures for navigation

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator or Android Emulator
- Expo Go app on your mobile device (optional)

### Installation

1. **Navigate to the mobile directory**:
   ```bash
   cd mobile
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm start
   ```

4. **Run on device/simulator**:
   - **iOS**: Press `i` in the terminal or run `npm run ios`
   - **Android**: Press `a` in the terminal or run `npm run android`
   - **Expo Go**: Scan the QR code with your device

## Page Transition Animations

### Animation Types

The app includes several types of page transitions:

1. **Amenities Animation** (`amenities`):
   - Inspired by the index.html design
   - Scrolling cards with MacroLens branding
   - Used for main screens like Dashboard and Settings
   - Duration: 800-1200ms

2. **Scale Animation** (`scale`):
   - Smooth scaling effect
   - Used for content-heavy screens like Recipes
   - Duration: 600ms

3. **Slide Animation** (`slide`):
   - Horizontal slide transition
   - Used for form screens and secondary pages
   - Duration: 600ms

4. **Fade Animation** (`fade`):
   - Simple fade in/out effect
   - Used for profile and simple pages
   - Duration: 600ms

### Using PageTransition Component

```tsx
import { PageTransition } from '@/components/PageTransition';

export function YourScreen() {
  return (
    <PageTransition 
      animationType="amenities" 
      duration={800}
      onTransitionComplete={() => {
        console.log('Transition completed');
      }}
    >
      {/* Your screen content */}
    </PageTransition>
  );
}
```

## App Structure

```
mobile/
├── src/
│   ├── components/
│   │   └── PageTransition.tsx     # Main transition component
│   ├── navigation/
│   │   ├── AuthStack.tsx          # Authentication navigation
│   │   └── AppStack.tsx           # Main app navigation
│   ├── screens/
│   │   ├── auth/                  # Login/Register screens
│   │   └── app/                   # Main app screens
│   ├── store/
│   │   └── authStore.ts           # Authentication state
│   ├── contexts/
│   │   └── AuthContext.tsx        # Auth context provider
│   └── constants/
│       └── theme.ts               # App theme constants
├── App.tsx                        # Main app component
└── package.json
```

## Key Features

### Authentication Flow
- Login/Register screens with form validation
- Auto-login with stored tokens
- Smooth transitions between auth states

### Dashboard
- Welcome screen with user stats
- Quick action cards for main features
- Recent activity feed
- Uses the signature "amenities" animation

### Navigation
- Stack-based navigation with React Navigation
- Custom interpolators for smooth transitions
- Gesture support for back navigation

### Theming
- Consistent color scheme
- Material Design icons
- Responsive design for all screen sizes

## Development Notes

### Performance Optimization
- Uses native driver for animations
- Efficient re-renders with React hooks
- Smooth 60fps animations

### Gesture Handling
- Configured for swipe gestures
- Horizontal gesture direction support
- Smooth gesture recognition

### Animation Timing
- Carefully tuned animation durations
- Smooth interpolation curves
- Optimized for mobile performance

## Troubleshooting

1. **Animation not smooth**: Ensure you're using a physical device or high-performance simulator
2. **Gesture conflicts**: Check if other gesture handlers are interfering
3. **Performance issues**: Reduce animation duration or disable complex animations

## Future Enhancements

- [ ] Add swipe gestures for page transitions
- [ ] Implement custom transition curves
- [ ] Add haptic feedback for gestures
- [ ] Create more animation variations
- [ ] Add transition sound effects

## Testing

Run the app on different devices to test:
- Animation smoothness
- Gesture responsiveness
- Performance on older devices
- Memory usage during transitions

The animations are specifically designed to showcase smooth page transitions inspired by the web design, making the mobile app feel premium and engaging. 