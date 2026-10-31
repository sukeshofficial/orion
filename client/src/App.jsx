import React from "react"
import { BrowserRouter, Route, Routes } from "react-router-dom"
import store from "./redux/Store"
import { Provider } from "react-redux"
import HealthStatus from "./components/health/health"
import AppRoutes from "@/routes"

import { AuthProvider } from "./context/AuthContext"

function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Dev / internal utility routes */}
            <Route path="/dev/health/status" element={<HealthStatus />} />

            {/* Auth + app routes — AppRoutes renders its own nested <Routes> */}
            <Route path="/*" element={<AppRoutes />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </Provider>
  )
}

export default App
