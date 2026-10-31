import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// API call
export const checkHealth = createAsyncThunk(
  "health/checkHealth",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/health`);

      if (!response.ok) {
        throw new Error("Backend request failed");
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(
        error.message || "Backend connection failed"
      );
    }
  }
);

const initialState = {
  success: false,
  status: "idle",
  message: "Backend status not checked yet",
  timestamp: null,
  uptime: 0,
  memory: null,
  streamConnected: false,
  connectionState: "disconnected", // 'connected' | 'connecting' | 'disconnected'
  lastUpdated: null,
  isStale: false,
};

const healthSlice = createSlice({
  name: "health",
  initialState,
  reducers: {
    resetHealth: () => initialState,
    updateLiveHealth: (state, action) => {
      Object.assign(state, action.payload);
      state.streamConnected = true;
      state.connectionState = "connected";
      state.lastUpdated = new Date().toISOString();
      state.isStale = false;
    },
    setStreamConnection: (state, action) => {
      state.connectionState = action.payload;
      state.streamConnected = action.payload === "connected";
      if (action.payload === "disconnected" || action.payload === "connecting") {
        state.isStale = true;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkHealth.pending, (state) => {
        state.status = "loading";
        state.message = "Checking backend...";
      })
      .addCase(checkHealth.fulfilled, (state, action) => {
        Object.assign(state, action.payload);
        state.lastUpdated = new Date().toISOString();
        state.isStale = false;
      })
      .addCase(checkHealth.rejected, (state, action) => {
        state.success = false;
        state.status = "unhealthy";
        state.message =
          action.payload || "Backend connection failed";
      });
  },
});

export const { resetHealth, updateLiveHealth, setStreamConnection } = healthSlice.actions;

export default healthSlice.reducer;