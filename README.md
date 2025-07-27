# Fitness Tracker App - React + Tailwind CSS

A modern, responsive fitness tracking application built with React and Tailwind CSS. Features a clean component-based architecture with reusable components and mobile-first design.

## 🚀 Features

- **Dashboard**: Overview of fitness stats with trend indicators
- **Workouts**: Track exercise sessions with filtering and statistics
- **Nutrition**: Log meals with macro tracking and progress bars
- **Progress**: Monitor goals and achievements with chart placeholders
- **Settings**: Manage profile, preferences, and account settings
- **Amenities Carousel**: Horizontal scrolling property amenities feature
- **Modal System**: Reusable modal for adding workouts and meals
- **Mobile-First**: Fully responsive design optimized for all screen sizes

## 📁 Component Structure

```
src/
├── components/
│   ├── App.tsx                 # Main app container
│   ├── Header.tsx              # Navigation header with mobile menu
│   ├── Dashboard.tsx           # Main dashboard with stats
│   ├── Workouts.tsx            # Workout management section
│   ├── Nutrition.tsx           # Meal logging and nutrition tracking
│   ├── Progress.tsx            # Progress tracking and achievements
│   ├── Settings.tsx            # User settings and preferences
│   ├── AmenitiesCarousel.tsx   # Horizontal scrolling amenities
│   ├── Modal.tsx               # Reusable modal component
│   ├── StatCard.tsx            # Reusable stat display card
│   └── ItemCard.tsx            # Reusable item card (workouts/meals)
├── index.css                   # Global styles and Tailwind imports
└── README.md                   # This file
```

## 🎨 Design System

### Color Palette
- **Primary**: Blue (`blue-500`, `blue-600`)
- **Secondary**: Green (`green-500`, `green-600`)
- **Accent Colors**: Purple, Orange, Red for different data types
- **Neutral**: Gray scale for backgrounds and text

### Typography
- **Font Family**: System font stack with fallbacks
- **Sizes**: Responsive text sizing using Tailwind utilities
- **Weights**: Various font weights for hierarchy

### Spacing
- **Consistent**: Uses Tailwind's spacing scale (4, 6, 8, 12, etc.)
- **Responsive**: Different spacing on mobile vs desktop

## 🧩 Component Details

### App Component
- Main container managing application state
- Handles modal opening/closing
- Section navigation logic
- Responsive layout structure

### Header Component
- Mobile-responsive navigation
- Hamburger menu for mobile devices
- Active section highlighting
- Clean, modern design

### Dashboard Component
- Uses reusable `StatCard` components
- Recent activity feed
- Quick action buttons
- Gradient welcome banner

### Workouts Component
- Uses `ItemCard` for displaying workouts
- Filtering by workout type
- Empty state handling
- Workout statistics summary

### Nutrition Component
- Daily macro tracking with progress bars
- Meal logging with `ItemCard`
- Nutrition summary calculations
- Recent meals history

### Progress Component
- Goal tracking with progress bars
- Achievement system
- Chart placeholders (ready for chart library integration)
- Weekly summary statistics

### Settings Component
- Profile management
- User preferences with toggle switches
- Account actions
- Form validation

### AmenitiesCarousel Component
- Horizontal scrolling (manual only)
- Scroll buttons for navigation
- Gradient fade effects
- Touch-friendly on mobile

### Modal Component
- Dynamic form fields based on type (workout/meal)
- Form validation with error handling
- Backdrop click to close
- Responsive design

### Reusable Components

#### StatCard
```tsx
<StatCard
  title="Total Calories"
  value="2,485"
  icon="🔥"
  color="orange"
  trend={{ value: 12, isPositive: true }}
/>
```

#### ItemCard
```tsx
<ItemCard
  id="1"
  name="Morning Cardio"
  icon="🏃‍♂️"
  details={["Duration: 35 min", "Calories: 320", "Type: Cardio"]}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

## 📱 Mobile Optimization

- **Touch-friendly**: Minimum 44px touch targets
- **Responsive Grid**: Adapts from 1 column on mobile to 4 columns on desktop
- **Mobile Navigation**: Collapsible hamburger menu
- **Optimized Forms**: Better input handling on mobile devices
- **Scroll Behavior**: Smooth scrolling with momentum

## 🎯 State Management

The application uses React's built-in `useState` and `useEffect` hooks for state management:

- **Global State**: Managed in App component (modal state, active section)
- **Local State**: Each component manages its own data (workouts, meals, settings)
- **Form State**: Modal component handles form data and validation

## 🔧 Customization

### Adding New Features
1. Create new component in `src/components/`
2. Add to navigation in `Header.tsx`
3. Add case to `App.tsx` switch statement
4. Update modal if needed

### Styling Customization
- Modify `src/index.css` for global styles
- Use Tailwind classes for component-specific styling
- Color scheme can be easily changed in Tailwind config

### Data Integration
- Replace placeholder data with API calls
- Add loading states and error handling
- Implement data persistence (localStorage, database)

## 🚀 Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm start
```

3. Build for production:
```bash
npm run build
```

## 🔮 Future Enhancements

- **Chart Integration**: Add real charts using Chart.js or D3
- **Dark Mode**: Complete dark mode implementation
- **Animations**: Add smooth transitions and animations
- **PWA**: Progressive Web App capabilities
- **Data Persistence**: Backend integration and data storage
- **Real-time Updates**: WebSocket integration for live data
- **Social Features**: Share workouts and compete with friends

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on different screen sizes
5. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

---

Built with ❤️ using React and Tailwind CSS