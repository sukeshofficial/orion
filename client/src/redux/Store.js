import { configureStore } from '@reduxjs/toolkit'
import healthReducer from "./Slices/routeslice";
import inputReducer from "./Slices/inputslice";
import customerReducer from "./Slices/customerSlice";
import productReducer from "./Slices/productSlice";
import taxReducer from "./Slices/taxSlice";
import planReducer from "./Slices/planSlice";
import quotationTemplateReducer from "./Slices/quotationTemplateSlice";
import quotationReducer from "./Slices/quotationSlice";

const store = configureStore({
  reducer: {
    health: healthReducer,
    Health: healthReducer,
    input: inputReducer,
    customer: customerReducer,
    product: productReducer,
    tax: taxReducer,
    plan: planReducer,
    quotationTemplate: quotationTemplateReducer,
    quotation: quotationReducer,
  }
})

export default store;
