import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/api/v1/test-input`;

// GET: Fetch all test inputs
export const checkinput = createAsyncThunk(
  "input/checkinput",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(API_URL);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// POST: Create a test input
export const createinput = createAsyncThunk(
  "input/createinput",
  async (name, { rejectWithValue }) => {
    try {
      const response = await axios.post(API_URL, { name });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

const inputSlice = createSlice({
  name: "input",
  initialState: {
    inputs: [],
    loading: false,
    error: null,
    success: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // GET all inputs
      .addCase(checkinput.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkinput.fulfilled, (state, action) => {
        state.loading = false;
        state.inputs = action.payload;
      })
      .addCase(checkinput.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // POST new input
      .addCase(createinput.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createinput.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.inputs.push(action.payload);
      })
      .addCase(createinput.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default inputSlice.reducer;