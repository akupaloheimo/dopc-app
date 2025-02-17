import React, { useState } from 'react';
import './App.css';
import { fetchVenueData } from "./utils/api";
import { calculateDistance } from "./utils/distanceCalc";

function App() {
  const [venueSlug, setVenueSlug] = useState("");
  const [cartValue, setCartValue] = useState("");
  const [userLatitude, setUserLatitude] = useState("");
  const [userLongitude, setUserLongitude] = useState("");;
  const [error, setError] = useState("");
  const [smallOrderSurcharge, setSmallOrderSurcharge] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryDistance, setDeliveryDistance] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [isFlashing, setIsFlashing] = useState(false);
  const [loading, setLoading] = useState(false);

  const isFormValid = 
    venueSlug.trim() !== "" &&
    cartValue.trim() !== "" &&
    userLatitude.trim() !== "" &&
    userLongitude.trim() !== "" &&
    !isNaN(parseFloat(cartValue)) &&
    !isNaN(parseFloat(userLatitude)) &&
    !isNaN(parseFloat(userLongitude));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const cartValueCents = Math.round(parseFloat(cartValue) * 100);
      const userLat = parseFloat(userLatitude);
      const userLong = parseFloat(userLongitude);

      if (isNaN(cartValueCents) || isNaN(userLat) || isNaN(userLong)) {
        setError("Provide valid inputs.");
        return;
      }

      const { staticData, dynamicData } = await fetchVenueData(venueSlug);
      const venueCoordinates = staticData.location.coordinates;
      const calculatedDistance = calculateDistance(
        userLat,
        userLong,
        venueCoordinates[1],
        venueCoordinates[0]
      );
      
      const orderMin = dynamicData.delivery_specs.order_minimum_no_surcharge;
      const basePrice = dynamicData.delivery_specs.delivery_pricing.base_price;
      const distanceRanges = dynamicData.delivery_specs.delivery_pricing.distance_ranges;
      
      const calculatedSurcharge = Math.max(0, orderMin - cartValueCents);
      var distanceRange = null;

      for (let i = 0; i < distanceRanges.length; i++) {
        if (distanceRanges[i].min <= calculatedDistance && (distanceRanges[i].max > calculatedDistance || distanceRanges[i].max === 0)) {
          distanceRange = distanceRanges[i];
          if(distanceRanges[i].max === 0){
            distanceRange = null;
          }
        }
      }

      if (distanceRange == null) {
        setError("Delivery is not available for this distance!");
        return;
      }

      const calculatedDeliveryFee = basePrice + distanceRange.a + Math.round((distanceRange.b * calculatedDistance) / 10);

      const calculatedTotalPrice = cartValueCents + calculatedSurcharge + calculatedDeliveryFee;
      
      setDeliveryDistance(calculatedDistance);
      setSmallOrderSurcharge(calculatedSurcharge);
      setDeliveryFee(calculatedDeliveryFee);
      setTotalPrice(calculatedTotalPrice);

      setIsFlashing(true);
      setTimeout(() => {
        setIsFlashing(false);
      }, 500);
    } catch (e) {
      console.error("Error details:", e);
      setError("An error occurred while calculating the price.");
    } finally {
      setLoading(false);
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setUserLatitude(position.coords.latitude.toString());
        setUserLongitude(position.coords.longitude.toString());
      });
    } else {
      setError("Geolocation is not supported by this browser.");
    }
  };

  return (
    <div>
      <header>
        Delivery Order Price Calculator
      </header>
    <div className="container">
      <div className="wrapper">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
        <label data-test-id="venueSlug">
          Venue Slug:
          <input 
            type="text" 
            name="venueSlug"
            value={venueSlug}
            onChange={(e) => setVenueSlug(e.target.value)}
          />
        </label>
        <label data-test-id="cartValue">
          Cart Value:
          <input 
            type="text" 
            name="cartValue"
            value={cartValue}
            onChange={(e) => setCartValue(e.target.value)} 
          />
        </label>
        <label data-test-id="userLatitude">
          User Latitude:
          <input 
            type="text" 
            name="userLatitude" 
            value={userLatitude}
            onChange={(e) => setUserLatitude(e.target.value)}
          />
        </label>
        <label data-test-id="userLongitude">
          User Longitude:
          <input 
            type="text" 
            name="userLongitude" 
            value={userLongitude}
            onChange={(e) => setUserLongitude(e.target.value)}
          />
        </label>
        <div className="buttons">
          <button className="button" onClick={getUserLocation} type="button" name="getLocation" data-test-id="getLocation">
            <i className="material-icons">my_location</i> Get Location
          </button>
          <div className="divider">
              <span></span>
          </div>
          <button className="button" type="submit" disabled={!isFormValid}>
            {loading ? (
                  <div className="loading-spinner">
                    <div className="spinner"></div>
                  </div>
                ) : (
                  <>Calculate Delivery Price</>
              )}
          </button>
        </div>
        </div>
      </form>
      </div>
      <div className="divider">
        <span></span>
      </div>
      <div>
      <h2>Price Breakdown</h2>
        <div className="price-breakdown">
          <div className="row">
            <span className="label">Cart Value:</span>
            <span className="value" data-raw-value={cartValue}>
              {(Number(cartValue)).toFixed(2)} €
            </span>
          </div>
          <div className="row">
            <span className="label">Small Order Surcharge:</span>
            <span className="value" data-raw-value={smallOrderSurcharge}>
              {(smallOrderSurcharge / 100).toFixed(2)} €
            </span>
          </div>
          <div className="row">
            <span className="label">Delivery Fee:</span>
            <span className="value" data-raw-value={deliveryFee}>
              {(deliveryFee / 100).toFixed(2)} €
            </span>
          </div>
          <div className="row">
            <span className="label">Delivery Distance:</span>
            <span className="value" data-raw-value={deliveryDistance}>
              {deliveryDistance} m
            </span>
          </div>
          <div className={`row-total ${isFlashing ? 'flash' : ''}`}>
            <span className="label">Total Price:</span>
            <span className="value" data-raw-value={totalPrice}>
              {(totalPrice / 100).toFixed(2)} €
            </span>
          </div>
        </div>
      </div>
      <span className="error-container">
        {error && <p className="error">{error}</p>}
      </span>
    </div>
    </div>
  );
}

export default App;
