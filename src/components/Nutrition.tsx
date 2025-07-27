import React, { useState } from 'react';
import ItemCard from './ItemCard';

interface Meal {
  id: string;
  name: string;
  icon: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  mealType: string;
  imageUrl?: string;
}

interface NutritionProps {
  onAddMeal: () => void;
}

const Nutrition: React.FC<NutritionProps> = ({ onAddMeal }) => {
  const [meals, setMeals] = useState<Meal[]>([
    {
      id: '1',
      name: 'Avocado Toast',
      icon: '🥑',
      calories: '320',
      protein: '12g',
      carbs: '28g',
      fat: '18g',
      mealType: 'Breakfast'
    },
    {
      id: '2',
      name: 'Grilled Chicken Salad',
      icon: '🥗',
      calories: '450',
      protein: '35g',
      carbs: '15g',
      fat: '25g',
      mealType: 'Lunch'
    },
    {
      id: '3',
      name: 'Protein Smoothie',
      icon: '🥤',
      calories: '280',
      protein: '30g',
      carbs: '20g',
      fat: '8g',
      mealType: 'Snack'
    },
    {
      id: '4',
      name: 'Salmon with Quinoa',
      icon: '🐟',
      calories: '520',
      protein: '40g',
      carbs: '35g',
      fat: '22g',
      mealType: 'Dinner'
    }
  ]);

  const handleEdit = (id: string) => {
    console.log('Edit meal:', id);
    // TODO: Implement edit functionality
  };

  const handleDelete = (id: string) => {
    setMeals(meals.filter(meal => meal.id !== id));
  };

  const getTotalMacros = () => {
    return meals.reduce((totals, meal) => ({
      calories: totals.calories + parseInt(meal.calories),
      protein: totals.protein + parseInt(meal.protein),
      carbs: totals.carbs + parseInt(meal.carbs),
      fat: totals.fat + parseInt(meal.fat)
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  const totals = getTotalMacros();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Nutrition Log</h2>
          <p className="text-gray-600">Track your meals and nutritional intake</p>
        </div>
        <button
          onClick={onAddMeal}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Log Meal</span>
        </button>
      </div>

      {/* Daily Nutrition Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Nutrition</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{totals.calories}</div>
            <div className="text-sm text-gray-600">Calories</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-orange-600 h-2 rounded-full" 
                style={{ width: `${Math.min((totals.calories / 2500) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{totals.protein}g</div>
            <div className="text-sm text-gray-600">Protein</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${Math.min((totals.protein / 150) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{totals.carbs}g</div>
            <div className="text-sm text-gray-600">Carbs</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ width: `${Math.min((totals.carbs / 300) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{totals.fat}g</div>
            <div className="text-sm text-gray-600">Fat</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-purple-600 h-2 rounded-full" 
                style={{ width: `${Math.min((totals.fat / 80) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Meal Type Filter */}
      <div className="flex flex-wrap gap-2">
        {['All', 'Breakfast', 'Lunch', 'Dinner', 'Snack'].map((filter) => (
          <button
            key={filter}
            className="px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Meals List */}
      {meals.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🍎</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No meals logged yet</h3>
          <p className="text-gray-600 mb-6">Start tracking your nutrition by logging your first meal!</p>
          <button
            onClick={onAddMeal}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Log Your First Meal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {meals.map((meal) => (
            <ItemCard
              key={meal.id}
              id={meal.id}
              name={meal.name}
              icon={meal.icon}
              imageUrl={meal.imageUrl}
              details={[
                `${meal.mealType} • ${meal.calories} calories`,
                `Protein: ${meal.protein}`,
                `Carbs: ${meal.carbs} • Fat: ${meal.fat}`
              ]}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Meal History */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Meals</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {meals.slice(0, 3).map((meal) => (
            <div key={meal.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{meal.icon}</span>
                  <div>
                    <h4 className="font-medium text-gray-900">{meal.name}</h4>
                    <p className="text-sm text-gray-600">{meal.mealType}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">{meal.calories} cal</div>
                  <div className="text-sm text-gray-600">{meal.protein} protein</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Nutrition; 