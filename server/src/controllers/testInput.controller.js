import * as testInputService from "../services/testInput.service.js";

export const handleCreateTestInput = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required and cannot be empty",
      });
    }

    const savedInput = await testInputService.createTestInput(name.trim());

    return res.status(201).json({
      success: true,
      message: "Test input created successfully",
      data: savedInput,
    });
  } catch (error) {
    console.error("Error creating test input:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while saving test input",
      error: error.message,
    });
  }
};

export const handleGetTestInputs = async (req, res) => {
  try {
    const inputs = await testInputService.getAllTestInputs();
    return res.status(200).json({
      success: true,
      data: inputs,
    });
  } catch (error) {
    console.error("Error fetching test inputs:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching test inputs",
      error: error.message,
    });
  }
};
