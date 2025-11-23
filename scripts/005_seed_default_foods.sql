-- Seed common foods (non-custom foods available to all users)
insert into public.foods (user_id, name, brand, serving_size, serving_unit, calories, protein, carbs, fat, fiber, is_custom) values
  -- Proteins
  (null, 'Chicken Breast', 'Generic', 100, 'g', 165, 31, 0, 3.6, 0, false),
  (null, 'Salmon', 'Generic', 100, 'g', 208, 20, 0, 13, 0, false),
  (null, 'Ground Beef 85/15', 'Generic', 100, 'g', 250, 25, 0, 17, 0, false),
  (null, 'Eggs', 'Generic', 50, 'g', 72, 6.3, 0.4, 4.8, 0, false),
  (null, 'Greek Yogurt', 'Generic', 170, 'g', 100, 17, 6, 0.7, 0, false),
  (null, 'Whey Protein', 'Generic', 30, 'g', 120, 24, 3, 1.5, 1, false),
  (null, 'Tuna', 'Generic', 100, 'g', 132, 28, 0, 1.3, 0, false),
  
  -- Carbs
  (null, 'White Rice', 'Generic', 100, 'g', 130, 2.7, 28, 0.3, 0.4, false),
  (null, 'Brown Rice', 'Generic', 100, 'g', 112, 2.6, 24, 0.9, 1.8, false),
  (null, 'Oatmeal', 'Generic', 40, 'g', 150, 5, 27, 3, 4, false),
  (null, 'Sweet Potato', 'Generic', 100, 'g', 86, 1.6, 20, 0.1, 3, false),
  (null, 'Whole Wheat Bread', 'Generic', 50, 'g', 120, 6, 20, 2, 3, false),
  (null, 'Pasta', 'Generic', 100, 'g', 131, 5, 25, 1.1, 1.8, false),
  (null, 'Quinoa', 'Generic', 100, 'g', 120, 4.4, 21, 1.9, 2.8, false),
  
  -- Fats
  (null, 'Avocado', 'Generic', 100, 'g', 160, 2, 9, 15, 7, false),
  (null, 'Almonds', 'Generic', 28, 'g', 164, 6, 6, 14, 3.5, false),
  (null, 'Peanut Butter', 'Generic', 32, 'g', 190, 8, 7, 16, 2, false),
  (null, 'Olive Oil', 'Generic', 14, 'g', 120, 0, 0, 14, 0, false),
  
  -- Vegetables
  (null, 'Broccoli', 'Generic', 100, 'g', 34, 2.8, 7, 0.4, 2.6, false),
  (null, 'Spinach', 'Generic', 100, 'g', 23, 2.9, 3.6, 0.4, 2.2, false),
  (null, 'Tomato', 'Generic', 100, 'g', 18, 0.9, 3.9, 0.2, 1.2, false),
  (null, 'Carrots', 'Generic', 100, 'g', 41, 0.9, 10, 0.2, 2.8, false),
  
  -- Fruits
  (null, 'Banana', 'Generic', 100, 'g', 89, 1.1, 23, 0.3, 2.6, false),
  (null, 'Apple', 'Generic', 100, 'g', 52, 0.3, 14, 0.2, 2.4, false),
  (null, 'Berries Mixed', 'Generic', 100, 'g', 57, 0.7, 14, 0.3, 2, false)
on conflict do nothing;
