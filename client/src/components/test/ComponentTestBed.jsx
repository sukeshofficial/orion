
import React, { useState } from "react";
import {
  Routes,
  Route,
  NavLink,
  Navigate,
} from "react-router-dom";

import { BrandTitle } from "@/components/ui/brand-title";
import { HomeButton } from "@/components/ui/home-button";
import { AuthField } from "@/components/ui/auth-field";
import { AuthSubmitButton } from "@/components/ui/auth-submit-button";
import { AuthLink } from "@/components/ui/auth-link";
import { PasswordStrengthIndicator } from "@/components/ui/password-strength-indicator";
import { Label } from "@/components/ui/label";
import {
  Progress,
  ProgressTrack,
  ProgressIndicator,
} from "@/components/ui/progress";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

const componentRoutes = [
  { path: "brand-title", label: "Brand Title" },
  { path: "home-button", label: "Home Button" },
  { path: "auth-field", label: "Auth Field" },
  { path: "auth-submit-button", label: "Auth Submit Button" },
  { path: "auth-link", label: "Auth Link" },
  { path: "password-strength", label: "Password Strength" },
  { path: "label", label: "Label" },
  { path: "progress", label: "Progress" },
  { path: "tooltip", label: "Tooltip" },
];

const Section = ({ title, description, children }) => (
  <section className="space-y-6">
    <div className="space-y-1">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    <div className="rounded-xl border bg-card p-6 text-card-foreground">
      {children}
    </div>
  </section>
);

const Preview = ({ children }) => (
  <div className="flex min-h-40 items-center justify-center rounded-lg border border-dashed bg-background p-6">
    {children}
  </div>
);

// 1. BrandTitle
function BrandTitleTest() {
  const [text, setText] = useState("Orion");
  const [href, setHref] = useState("");
  const [linked, setLinked] = useState(false);

  return (
    <Section
      title="BrandTitle"
      description="Test the brand text, link behavior, and configurable label."
    >
      <div className="space-y-4">
        <Preview>
          <BrandTitle
            text={text}
            href={linked ? href || "/home" : undefined}
          />
        </Preview>

        <label className="block space-y-1 text-sm">
          Brand text
          <input
            className="w-full rounded-md border bg-background p-2"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={linked}
            onChange={(e) => setLinked(e.target.checked)}
          />
          Render as a link
        </label>

        {linked && (
          <label className="block space-y-1 text-sm">
            Link destination
            <input
              className="w-full rounded-md border bg-background p-2"
              value={href}
              placeholder="/home"
              onChange={(e) => setHref(e.target.value)}
            />
          </label>
        )}
      </div>
    </Section>
  );
}

// 2. HomeButton
function HomeButtonTest() {
  const [label, setLabel] = useState("Home");
  const [disabled, setDisabled] = useState(false);
  const [linked, setLinked] = useState(false);
  const [message, setMessage] = useState("No interaction yet");

  return (
    <Section
      title="HomeButton"
      description="Test its outline, label, disabled state, and link or button behavior."
    >
      <div className="space-y-4">
        <Preview>
          <HomeButton
            label={label}
            disabled={disabled}
            href={linked ? "/home" : undefined}
            onClick={() => setMessage("Home button clicked")}
          />
        </Preview>

        <label className="block space-y-1 text-sm">
          Button label
          <input
            className="w-full rounded-md border bg-background p-2"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={disabled}
            onChange={(e) => setDisabled(e.target.checked)}
          />
          Disabled
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={linked}
            onChange={(e) => setLinked(e.target.checked)}
          />
          Render as a link to /home
        </label>

        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </Section>
  );
}

// 3. AuthField
function AuthFieldTest() {
  const [layout, setLayout] = useState("stacked");
  const [type, setType] = useState("email");
  const [label, setLabel] = useState("Your Email");
  const [placeholder, setPlaceholder] = useState("Enter your email");
  const [value, setValue] = useState("");
  const [showError, setShowError] = useState(false);
  const [disabled, setDisabled] = useState(false);

  return (
    <Section
      title="AuthField"
      description="Test input types, both label layouts, controlled values, and validation."
    >
      <div className="space-y-5">
        <Preview>
          <div className="w-full max-w-lg">
            <AuthField
              id="test-auth-field"
              name="testAuthField"
              label={label}
              type={type}
              layout={layout}
              placeholder={placeholder}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              error={showError ? "This field needs attention." : undefined}
              disabled={disabled}
              autoComplete={type === "email" ? "email" : undefined}
            />
          </div>
        </Preview>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            Layout
            <select
              className="w-full rounded-md border bg-background p-2"
              value={layout}
              onChange={(e) => setLayout(e.target.value)}
            >
              <option value="stacked">Stacked</option>
              <option value="horizontal">Horizontal</option>
            </select>
          </label>

          <label className="space-y-1 text-sm">
            Input type
            <select
              className="w-full rounded-md border bg-background p-2"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="text">Text</option>
              <option value="email">Email</option>
              <option value="tel">Phone</option>
              <option value="password">Password</option>
            </select>
          </label>

          <label className="space-y-1 text-sm">
            Label
            <input
              className="w-full rounded-md border bg-background p-2"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </label>

          <label className="space-y-1 text-sm">
            Placeholder
            <input
              className="w-full rounded-md border bg-background p-2"
              value={placeholder}
              onChange={(e) => setPlaceholder(e.target.value)}
            />
          </label>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showError}
            onChange={(e) => setShowError(e.target.checked)}
          />
          Show validation error
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={disabled}
            onChange={(e) => setDisabled(e.target.checked)}
          />
          Disabled
        </label>

        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">
            Current value: {value || "(empty)"}
          </span>
          <button
            className="rounded-md border px-3 py-2"
            onClick={() => setValue("")}
          >
            Clear value
          </button>
        </div>
      </div>
    </Section>
  );
}

// 4. AuthSubmitButton
function AuthSubmitButtonTest() {
  const [label, setLabel] = useState("SIGN IN");
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [message, setMessage] = useState("Ready");

  return (
    <Section
      title="AuthSubmitButton"
      description="Test CTA text, oval styling, disabled behavior, and loading state."
    >
      <div className="space-y-4">
        <Preview>
          <div className="w-full max-w-xs">
            <AuthSubmitButton
              label={label}
              type="button"
              loading={loading}
              disabled={disabled}
              onClick={() => setMessage("CTA clicked")}
              loadingText="Please wait..."
            />
          </div>
        </Preview>

        <label className="block space-y-1 text-sm">
          Button label
          <input
            className="w-full rounded-md border bg-background p-2"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={loading}
            onChange={(e) => setLoading(e.target.checked)}
          />
          Loading
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={disabled}
            onChange={(e) => setDisabled(e.target.checked)}
          />
          Disabled
        </label>

        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </Section>
  );
}

// 5. AuthLink
function AuthLinkTest() {
  const [label, setLabel] = useState("Register here");
  const [href, setHref] = useState("");
  const [message, setMessage] = useState("No interaction yet");

  return (
    <Section
      title="AuthLink"
      description="Test inline link styling and callback behavior without a destination."
    >
      <div className="space-y-4">
        <Preview>
          <p className="text-sm">
            Don't have an account?{" "}
            <AuthLink
              label={label}
              href={href || undefined}
              onClick={() => setMessage("AuthLink clicked")}
            />
          </p>
        </Preview>

        <label className="block space-y-1 text-sm">
          Link label
          <input
            className="w-full rounded-md border bg-background p-2"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </label>

        <label className="block space-y-1 text-sm">
          Destination (leave empty to test callback)
          <input
            className="w-full rounded-md border bg-background p-2"
            value={href}
            placeholder="/login"
            onChange={(e) => setHref(e.target.value)}
          />
        </label>

        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </Section>
  );
}

// 6. PasswordStrengthIndicator
function PasswordStrengthTest() {
  const [strength, setStrength] = useState("empty");
  const [showLabel, setShowLabel] = useState(true);

  return (
    <Section
      title="PasswordStrengthIndicator"
      description="Inspect every supported strength state and optional label."
    >
      <div className="space-y-5">
        <Preview>
          <div className="w-full max-w-xs">
            <PasswordStrengthIndicator
              strength={strength}
              showLabel={showLabel}
            />
          </div>
        </Preview>

        <label className="block space-y-1 text-sm">
          Strength state
          <select
            className="w-full rounded-md border bg-background p-2"
            value={strength}
            onChange={(e) => setStrength(e.target.value)}
          >
            <option value="empty">Empty</option>
            <option value="weak">Weak</option>
            <option value="medium">Medium</option>
            <option value="strong">Strong</option>
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showLabel}
            onChange={(e) => setShowLabel(e.target.checked)}
          />
          Show strength label
        </label>
      </div>
    </Section>
  );
}

// 7. Label
function LabelTest() {
  const [text, setText] = useState("Your Email");

  return (
    <Section
      title="Label"
      description="Test the shadcn Label primitive with a real associated input."
    >
      <Preview>
        <div className="w-full max-w-sm space-y-2">
          <Label htmlFor="standalone-label-input">{text}</Label>
          <input
            id="standalone-label-input"
            className="w-full rounded-md border bg-background p-2"
            placeholder="Click the label to focus this input"
          />
        </div>
      </Preview>

      <label className="mt-4 block space-y-1 text-sm">
        Label text
        <input
          className="w-full rounded-md border bg-background p-2"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </label>
    </Section>
  );
}

// 8. Progress
function ProgressTest() {
  const [value, setValue] = useState(60);

  return (
    <Section
      title="Progress"
      description="Test the progress primitive independently of the password meter."
    >
      <div className="space-y-4">
        <Preview>
          <div className="w-full max-w-md space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{value}%</span>
            </div>

            <Progress value={value} aria-label="Test progress">
              <ProgressTrack className="h-2 rounded-full bg-muted">
                <ProgressIndicator className="rounded-full bg-blue-600 transition-all" />
              </ProgressTrack>
            </Progress>
          </div>
        </Preview>

        <label className="block space-y-2 text-sm">
          Progress value: {value}%
          <input
            className="w-full"
            type="range"
            min="0"
            max="100"
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
          />
        </label>
      </div>
    </Section>
  );
}

// 9. Tooltip
function TooltipTest() {
  return (
    <Section
      title="Tooltip"
      description="Test the existing tooltip trigger and content primitives."
    >
      <Preview>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
            >
              Hover or focus me
            </TooltipTrigger>
            <TooltipContent>
              This is a reusable tooltip.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </Preview>
    </Section>
  );
}

const testComponents = {
  "brand-title": BrandTitleTest,
  "home-button": HomeButtonTest,
  "auth-field": AuthFieldTest,
  "auth-submit-button": AuthSubmitButtonTest,
  "auth-link": AuthLinkTest,
  "password-strength": PasswordStrengthTest,
  label: LabelTest,
  progress: ProgressTest,
  tooltip: TooltipTest,
};

const ComponentTestBed = () => {
  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <div className="border-b px-6 py-5">
        <h1 className="text-2xl font-bold">Component Test Bed</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Test each reusable UI component independently before layout integration.
        </p>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 p-6 md:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="space-y-2">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Components
          </h2>

          {componentRoutes.map((item) => (
            <NavLink
              key={item.path}
              to={`/test/component-test-bed/${item.path}`}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm transition-colors ${isActive
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </aside>

        <main className="min-w-0">
          <Routes>
            <Route
              index
              element={<Navigate to="brand-title" replace />}
            />

            {componentRoutes.map(({ path }) => {
              const TestComponent = testComponents[path];

              return (
                <Route
                  key={path}
                  path={path}
                  element={<TestComponent />}
                />
              );
            })}

            <Route
              path="*"
              element={
                <div className="rounded-lg border p-8 text-sm">
                  Component test route not found.
                </div>
              }
            />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default ComponentTestBed;
