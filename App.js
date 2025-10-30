import React, { useState, useEffect } from "react";
import "./styles.css";

function App() {
  const [ingredient, setIngredient] = useState("");
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [categories, setCategories] = useState([]);
  const [areas, setAreas] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [favorites, setFavorites] = useState([]);
  const [darkMode, setDarkMode] = useState(false);

  // Fetch categories, areas, and saved favorites on load
  useEffect(() => {
    fetch("https://www.themealdb.com/api/json/v1/1/list.php?c=list")
      .then((res) => res.json())
      .then((data) => setCategories(data.meals || []));

    fetch("https://www.themealdb.com/api/json/v1/1/list.php?a=list")
      .then((res) => res.json())
      .then((data) => setAreas(data.meals || []));

    const savedFavorites = JSON.parse(localStorage.getItem("favorites")) || [];
    setFavorites(savedFavorites);
  }, []);

  // Fetch meals based on ingredient, category, or area
  const fetchMeals = async () => {
    setMeals([]); // Clear old results
    setLoading(true);
    setError("");
    let allMeals = [];

    try {
      if (ingredient.trim() !== "") {
        const ingredients = ingredient.split(",").map((i) => i.trim());
        for (let ing of ingredients) {
          const res = await fetch(
            `https://www.themealdb.com/api/json/v1/1/filter.php?i=${ing}`
          );
          const data = await res.json();
          if (data.meals) allMeals = [...allMeals, ...data.meals];
        }
      } else if (selectedCategory) {
        const res = await fetch(
          `https://www.themealdb.com/api/json/v1/1/filter.php?c=${selectedCategory}`
        );
        const data = await res.json();
        if (data.meals) allMeals = data.meals;
      } else if (selectedArea) {
        const res = await fetch(
          `https://www.themealdb.com/api/json/v1/1/filter.php?a=${selectedArea}`
        );
        const data = await res.json();
        if (data.meals) allMeals = data.meals;
      } else {
        setError("Please enter an ingredient or select a category/cuisine.");
        setMeals([]);
        setLoading(false);
        return;
      }

      // Remove duplicates by meal ID
      const uniqueMeals = Array.from(
        new Map(allMeals.map((m) => [m.idMeal, m])).values()
      );

      if (uniqueMeals.length > 0) setMeals(uniqueMeals);
      else setError("No recipes found matching your filters.");
    } catch (err) {
      setError("Something went wrong! Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch meal details
  const fetchMealDetails = async (mealId) => {
    try {
      const res = await fetch(
        `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${mealId}`
      );
      const data = await res.json();
      if (data.meals && data.meals[0]) setSelectedMeal(data.meals[0]);
    } catch {
      alert("Failed to load recipe details.");
    }
  };

  // Favorites toggle
  const toggleFavorite = (meal) => {
    let updated;
    if (favorites.some((fav) => fav.idMeal === meal.idMeal)) {
      updated = favorites.filter((fav) => fav.idMeal !== meal.idMeal);
    } else {
      updated = [...favorites, meal];
    }
    setFavorites(updated);
    localStorage.setItem("favorites", JSON.stringify(updated));
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") fetchMeals();
  };

  const closePopup = () => setSelectedMeal(null);

  const toggleTheme = () => setDarkMode(!darkMode);

  return (
    <div className={`app-container ${darkMode ? "dark-mode" : ""}`}>
      <h1 className="title">🍳 Recipe Finder for Taylor</h1>
      <p className="subtitle">
        Discover delicious meals based on your ingredients and preferences!
      </p>

      {/* Theme Toggle */}
      <button className="theme-toggle" onClick={toggleTheme}>
        {darkMode ? "🌙 Dark Mode" : "☀️ Light Mode"}
      </button>

      {/* Search Filters */}
      <div className="search-section">
        <input
          type="text"
          value={ingredient}
          onChange={(e) => setIngredient(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Enter ingredients (e.g., chicken, tomato)..."
          className="search-input"
        />

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="search-input"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.strCategory} value={cat.strCategory}>
              {cat.strCategory}
            </option>
          ))}
        </select>

        <select
          value={selectedArea}
          onChange={(e) => setSelectedArea(e.target.value)}
          className="search-input"
        >
          <option value="">All Cuisines</option>
          {areas.map((area) => (
            <option key={area.strArea} value={area.strArea}>
              {area.strArea}
            </option>
          ))}
        </select>

        <button onClick={fetchMeals} className="search-btn">
          Search
        </button>
      </div>

      {/* Status Messages */}
      {loading && <p className="loading">Loading recipes...</p>}
      {error && <p className="error">{error}</p>}

      {/* Recipes Grid */}
      <div className="recipes-grid">
        {meals.map((meal) => (
          <div key={meal.idMeal} className="recipe-card">
            <img src={meal.strMealThumb} alt={meal.strMeal} />
            <h3>{meal.strMeal}</h3>
            <div>
              <button
                className="view-btn"
                onClick={() => fetchMealDetails(meal.idMeal)}
              >
                View Details
              </button>
              <button className="fav-btn" onClick={() => toggleFavorite(meal)}>
                {favorites.some((f) => f.idMeal === meal.idMeal) ? "💖" : "🤍"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Popup */}
      {selectedMeal && (
        <div className="popup-overlay" onClick={closePopup}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={closePopup}>
              ✖
            </button>
            <h2>{selectedMeal.strMeal}</h2>
            <img
              src={selectedMeal.strMealThumb}
              alt={selectedMeal.strMeal}
              className="popup-image"
            />
            <h3>Instructions</h3>
            <p className="instructions">{selectedMeal.strInstructions}</p>
            {selectedMeal.strYoutube && (
              <div className="video-container">
                <iframe
                  src={selectedMeal.strYoutube.replace("watch?v=", "embed/")}
                  title="Recipe Video"
                  frameBorder="0"
                  allowFullScreen
                ></iframe>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
