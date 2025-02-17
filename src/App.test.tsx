import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import App from "./App";

jest.mock("./utils/api", () => ({
  fetchVenueData: jest.fn(),
}));

jest.mock("./utils/distanceCalc", () => ({
  calculateDistance: jest.fn(),
}));

const { fetchVenueData } = require("./utils/api");
const { calculateDistance } = require("./utils/distanceCalc");

describe("App Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Site renders successfully", () => {
    const { container } = render(<App />);

    const venueSlugElement = container.querySelector('[data-test-id="venueSlug"]');
    const cartValueElement = container.querySelector('[data-test-id="cartValue"]');
    const userLatitudeElement = container.querySelector('[data-test-id="userLatitude"]');
    const userLongitudeElement = container.querySelector('[data-test-id="userLongitude"]');

    const getLocationButton = screen.getByText("Get Location");
    const calculateDeliveryPriceButton = screen.getByText("Calculate Delivery Price");
    const priceBreakdownElement = screen.getByText("Price Breakdown");

    expect(venueSlugElement).toBeInTheDocument();
    expect(cartValueElement).toBeInTheDocument();
    expect(userLatitudeElement).toBeInTheDocument();
    expect(userLongitudeElement).toBeInTheDocument();
    expect(getLocationButton).toBeInTheDocument();
    expect(calculateDeliveryPriceButton).toBeInTheDocument();
    expect(priceBreakdownElement).toBeInTheDocument();
  });

  test("enables submit button when form is valid", () => {
    render(<App />);

    const venueSlugInput = screen.getByLabelText(/Venue Slug:/i);
    const cartValueInput = screen.getByLabelText(/Cart Value:/i);
    const userLatitudeInput = screen.getByLabelText(/User Latitude:/i);
    const userLongitudeInput = screen.getByLabelText(/User Longitude:/i);
    const calculateButton = screen.getByRole("button", { name: /Calculate Delivery Price/i });

    fireEvent.change(venueSlugInput, { target: { value: "test-venue" } });
    fireEvent.change(cartValueInput, { target: { value: "10.00" } });
    fireEvent.change(userLatitudeInput, { target: { value: "52.5200" } });
    fireEvent.change(userLongitudeInput, { target: { value: "13.4050" } });

    expect(calculateButton).not.toBeDisabled();
  });

  test("displays an error for invalid distance", async () => {
    fetchVenueData.mockResolvedValue({
      staticData: { location: { coordinates: [13.4050, 52.5200] } },
      dynamicData: {
        delivery_specs: {
          order_minimum_no_surcharge: 1000,
          delivery_pricing: {
            base_price: 500,
            distance_ranges: [{ min: 0, max: 1000, a: 200, b: 50 }],
          },
        },
      },
    });

    calculateDistance.mockReturnValue(1500);

    render(<App />);

    fireEvent.change(screen.getByLabelText(/Venue Slug:/i), { target: { value: "test-venue" } });
    fireEvent.change(screen.getByLabelText(/Cart Value:/i), { target: { value: "15.00" } });
    fireEvent.change(screen.getByLabelText(/User Latitude:/i), { target: { value: "52.5200" } });
    fireEvent.change(screen.getByLabelText(/User Longitude:/i), { target: { value: "13.4050" } });

    fireEvent.click(screen.getByRole("button", { name: /Calculate Delivery Price/i }));

    await waitFor(() => {
      expect(screen.getByText(/Delivery is not available for this distance!/i)).toBeInTheDocument();
    });
  });

  test("handles form submission and displays results", async () => {
    fetchVenueData.mockResolvedValue({
      staticData: { location: { coordinates: [13.4050, 52.5200] } },
      dynamicData: {
        delivery_specs: {
          order_minimum_no_surcharge: 1000,
          delivery_pricing: {
            base_price: 500,
            distance_ranges: [
              { min: 0, max: 1000, a: 200, b: 5 },
              { min: 1001, max: 2000, a: 400, b: 2 },
            ],
          },
        },
      },
    });

    calculateDistance.mockReturnValue(1200); 

    render(<App />);

    fireEvent.change(screen.getByLabelText(/Venue Slug:/i), { target: { value: "test-venue" } });
    fireEvent.change(screen.getByLabelText(/Cart Value:/i), { target: { value: "15.00" } });
    fireEvent.change(screen.getByLabelText(/User Latitude:/i), { target: { value: "52.5200" } });
    fireEvent.change(screen.getByLabelText(/User Longitude:/i), { target: { value: "13.4050" } });

    fireEvent.click(screen.getByRole("button", { name: /Calculate Delivery Price/i }));

    await waitFor(() => {
      const labels = document.querySelectorAll(".label");
  
      const smallOrderSurchargeLabel = Array.from(labels).find(label => label.textContent === "Small Order Surcharge:");
      const smallOrderSurchargeValue = smallOrderSurchargeLabel!.nextElementSibling;
      expect(smallOrderSurchargeValue!.getAttribute("data-raw-value")).toBe("0");

      const deliveryFeeLabel = Array.from(labels).find(label => label.textContent === "Delivery Fee:");
      const deliveryFeeValue = deliveryFeeLabel!.nextElementSibling;
      expect(deliveryFeeValue!.getAttribute("data-raw-value")).toBe("1140");
  
      const deliveryDistanceLabel = Array.from(labels).find(label => label.textContent === "Delivery Distance:");
      const deliveryDistanceValue = deliveryDistanceLabel!.nextElementSibling;
      expect(deliveryDistanceValue!.getAttribute("data-raw-value")).toBe("1200");
  
      const totalPriceLabel = Array.from(labels).find(label => label.textContent === "Total Price:");
      const totalPriceValue = totalPriceLabel!.nextElementSibling;
      expect(totalPriceValue!.getAttribute("data-raw-value")).toBe("2640");
    });
  });
});
