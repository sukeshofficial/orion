import { configureStore } from '@reduxjs/toolkit'
import healthReducer from "./Slices/routeslice";
import inputReducer from "./Slices/inputslice";
import customerReducer from "./Slices/customerSlice";
import productReducer from "./Slices/productSlice";
import taxReducer from "./Slices/taxSlice";
import planReducer from "./Slices/planSlice";
import quotationTemplateReducer from "./Slices/quotationTemplateSlice";
import quotationReducer from "./Slices/quotationSlice";
import subscriptionReducer from "./Slices/subscriptionSlice";
import discountReducer from "./Slices/discountSlice";
import invoiceReducer from "./Slices/invoiceSlice";
import paymentReducer from "./Slices/paymentSlice";
import analyticsReducer from "./Slices/analyticsSlice";
import customerPortalReducer from "./Slices/customerPortalSlice";
import staffReducer from "./Slices/staffSlice";

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
    subscription: subscriptionReducer,
    discount: discountReducer,
    invoice: invoiceReducer,
    payment: paymentReducer,
    analytics: analyticsReducer,
    portal: customerPortalReducer,
    staff: staffReducer,
  }
})

export default store;
