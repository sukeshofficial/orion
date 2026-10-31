
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Input } from "@/components/ui/input";
import { Button } from "../ui/button";

import {
  createinput,
  checkinput,
} from "../../redux/Slices/inputslice";

function Justinput() {
  const dispatch = useDispatch();

  const { inputs, loading, error, success } = useSelector(
    (state) => state.input
  );

  const [name, setName] = useState("");

  // GET API: Fetch all names when component loads
  useEffect(() => {
    dispatch(checkinput());
  }, [dispatch]);

  // POST API: Create a new name
  const handleSubmit = async () => {
    if (!name.trim()) return;

    try {
      await dispatch(createinput(name.trim())).unwrap();
      setName("");

      // Refresh list using GET API
      dispatch(checkinput());
    } catch (err) {
      console.error("Failed to create input:", err);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card text-card-foreground border border-border rounded-xl shadow-sm p-6 space-y-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Test Input</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Enter a name to save it to MongoDB and view recorded inputs.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit();
          }}
          className="flex items-center gap-2"
        >
          <Input
            placeholder="Enter text..."
            className="flex-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Button
            type="submit"
            disabled={loading || !name.trim()}
          >
            {loading ? "Saving..." : "Submit"}
          </Button>
        </form>

        {error && (
          <p className="text-xs text-destructive font-medium">{error}</p>
        )}

        {success && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            Input created successfully!
          </p>
        )}

        {/* GET API: Render saved names */}
        <div className="pt-4 border-t border-border space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Saved Names</h2>
            <span className="text-xs text-muted-foreground">
              {inputs.length} {inputs.length === 1 ? "record" : "records"}
            </span>
          </div>

          {loading && <p className="text-xs text-muted-foreground">Loading names...</p>}

          {!loading && inputs.length === 0 && (
            <p className="text-xs text-muted-foreground">No names found.</p>
          )}

          <ul className="max-h-60 overflow-y-auto space-y-2">
            {inputs.map((item) => (
              <li
                key={item._id || item.id}
                className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs font-medium"
              >
                {item.name}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Justinput;
