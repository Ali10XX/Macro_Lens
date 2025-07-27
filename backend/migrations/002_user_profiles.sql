-- User Profiles Table for Onboarding
-- Migration 002: Add user_profiles table

CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Basic Info
    full_name VARCHAR(255),
    age INTEGER CHECK (age > 0 AND age < 120),
    gender VARCHAR(50), -- "male", "female", "other", "prefer_not_to_say"
    
    -- Physical Stats
    height_cm DECIMAL(5,2) CHECK (height_cm > 0),
    weight_kg DECIMAL(5,2) CHECK (weight_kg > 0),
    
    -- Fitness Goals
    primary_goal VARCHAR(50), -- "weight_loss", "muscle_gain", "maintenance", "athletic_performance"
    target_weight_kg DECIMAL(5,2) CHECK (target_weight_kg > 0),
    activity_level VARCHAR(50), -- "sedentary", "lightly_active", "moderately_active", "very_active", "extremely_active"
    
    -- Dietary Preferences (JSON arrays)
    dietary_restrictions JSONB DEFAULT '[]'::jsonb,
    food_allergies JSONB DEFAULT '[]'::jsonb,
    
    -- Preferences
    preferred_units VARCHAR(20) DEFAULT 'metric' CHECK (preferred_units IN ('metric', 'imperial')),
    
    -- Experience Level
    fitness_experience VARCHAR(20), -- "beginner", "intermediate", "advanced"
    
    -- Onboarding completion
    onboarding_completed BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(user_id)
);

-- Create indexes for better performance
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_onboarding_completed ON user_profiles(onboarding_completed);
CREATE INDEX idx_user_profiles_primary_goal ON user_profiles(primary_goal);
CREATE INDEX idx_user_profiles_activity_level ON user_profiles(activity_level);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 