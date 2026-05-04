import axios from 'axios';

const BASE_URL = 'https://countriesnow.space/api/v0.1/countries';

export const fetchStates = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/states`, {
      country: "India"
    });
    return response.data.data.states.map(s => s.name);
  } catch (error) {
    console.error("Error fetching states:", error);
    return [];
  }
};

export const fetchCities = async (state) => {
  try {
    const response = await axios.post(`${BASE_URL}/state/cities`, {
      country: "India",
      state: state
    });
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching cities for ${state}:`, error);
    return [];
  }
};
