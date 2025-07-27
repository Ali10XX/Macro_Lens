import React, { useRef } from 'react';

interface Amenity {
  id: string;
  name: string;
  icon: string;
}

const AmenitiesCarousel: React.FC = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const amenities: Amenity[] = [
    { id: '1', name: 'Bedroom', icon: '🛏️' },
    { id: '2', name: 'Kitchen', icon: '🍳' },
    { id: '3', name: 'Bathroom', icon: '🚿' },
    { id: '4', name: 'Gym', icon: '🏋️' },
    { id: '5', name: 'Parking', icon: '🚗' },
    { id: '6', name: 'Swimming', icon: '🏊' },
    { id: '7', name: 'Laundry', icon: '🧺' },
    { id: '8', name: 'WiFi', icon: '📶' },
    { id: '9', name: 'Garden', icon: '🌱' },
    { id: '10', name: 'Balcony', icon: '🏠' },
  ];

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Property Amenities</h2>
        <div className="flex space-x-2">
          <button
            onClick={scrollLeft}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            aria-label="Scroll left"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={scrollRight}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            aria-label="Scroll right"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="relative">
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto scrollbar-hide space-x-4 pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {amenities.map((amenity) => (
            <div
              key={amenity.id}
              className="flex-shrink-0 flex flex-col items-center justify-center w-20 h-20 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <div className="text-2xl mb-1">{amenity.icon}</div>
              <span className="text-xs text-gray-600 text-center font-medium">
                {amenity.name}
              </span>
            </div>
          ))}
        </div>
        
        {/* Gradient fade on edges */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
      </div>
    </div>
  );
};

export default AmenitiesCarousel; 