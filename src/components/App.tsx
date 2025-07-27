import React, { useState } from 'react';
import Header from './Header';
import Dashboard from './Dashboard';
import Workouts from './Workouts';
import Nutrition from './Nutrition';
import Progress from './Progress';
import Settings from './Settings';
import AmenitiesCarousel from './AmenitiesCarousel';
import Modal from './Modal';

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'workout' | 'meal' | null>(null);

  const openModal = (type: 'workout' | 'meal') => {
    setModalType(type);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalType(null);
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'workouts':
        return <Workouts onAddWorkout={() => openModal('workout')} />;
      case 'nutrition':
        return <Nutrition onAddMeal={() => openModal('meal')} />;
      case 'progress':
        return <Progress />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
      />
      
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Amenities Carousel - Small feature on the page */}
        <div className="mb-8">
          <AmenitiesCarousel />
        </div>
        
        {/* Main Content */}
        {renderActiveSection()}
      </main>

      {/* Modal */}
      {modalOpen && (
        <Modal 
          isOpen={modalOpen}
          onClose={closeModal}
          type={modalType}
        />
      )}
    </div>
  );
};

export default App; 