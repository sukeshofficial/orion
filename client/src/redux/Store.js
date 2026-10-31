import { configureStore } from '@reduxjs/toolkit'
import healthReducer from "./Slices/routeslice";
import inputReducer from "./Slices/inputslice";


const store = configureStore({
  reducer: {
     health: healthReducer,
     Health: healthReducer,
     input: inputReducer,

  }
})


export default store;