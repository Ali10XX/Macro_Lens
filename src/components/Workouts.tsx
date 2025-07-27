import React, { useState } from 'react';
import ItemCard from './ItemCard';

interface Workout {
  id: string;
  name: string;
  icon: string;
  duration: string;
  calories: string;
  type: string;
  imageUrl?: string;
}

interface WorkoutsProps {
  onAddWorkout: () => void;
}

const Workouts: React.FC<WorkoutsProps> = ({ onAddWorkout }) => {
  const [workouts, setWorkouts] = useState<Workout[]>([
    {
      id: '1',
      name: 'Morning Cardio',
      icon: '🏃‍♂️',
      duration: '35 min',
      calories: '320',
      type: 'Cardio'
    },
    {
      id: '2',
      name: 'Weight Training',
      icon: '🏋️‍♀️',
      duration: '45 min',
      calories: '180',
      type: 'Strength'
    },
    {
      id: '3',
      name: 'Yoga Session',
      icon: '🧘‍♀️',
      duration: '60 min',
      calories: '150',
      type: 'Flexibility'
    },
    {
      id: '4',
      name: 'HIIT Training',
      icon: '💥',
      duration: '25 min',
      calories: '280',
      type: 'HIIT'
    }
  ]);

  const handleEdit = (id: string) => {
    console.log('Edit workout:', id);
    // TODO: Implement edit functionality
  };

  const handleDelete = (id: string) => {
    setWorkouts(workouts.filter(workout => workout.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Your Workouts</h2>
          <p className="text-gray-600">Track and manage your fitness activities</p>
        </div>
        <button
          onClick={onAddWorkout}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Add Workout</span>
        </button>
      </div>

      {/* Workout Filter */}
      <div className="flex flex-wrap gap-2">
        {['All', 'Cardio', 'Strength', 'Flexibility', 'HIIT'].map((filter) => (
          <button
            key={filter}
            className="px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Workouts List */}
      {workouts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏃‍♂️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No workouts yet</h3>
          <p className="text-gray-600 mb-6">Start tracking your fitness journey by adding your first workout!</p>
          <button
            onClick={onAddWorkout}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Add Your First Workout
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {workouts.map((workout) => (
            <ItemCard
              key={workout.id}
              id={workout.id}
              name={workout.name}
              icon={workout.icon}
              imageUrl={workout.imageUrl}
              details={[
                `Duration: ${workout.duration}`,
                `Calories: ${workout.calories}`,
                `Type: ${workout.type}`
              ]}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Workout Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Workout Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{workouts.length}</div>
            <div className="text-sm text-gray-600">Total Workouts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {workouts.reduce((total, workout) => total + parseInt(workout.duration), 0)} min
            </div>
            <div className="text-sm text-gray-600">Total Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {workouts.reduce((total, workout) => total + parseInt(workout.calories), 0)}
            </div>
            <div className="text-sm text-gray-600">Total Calories</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Workouts; 