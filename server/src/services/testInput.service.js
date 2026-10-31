import TestInput from "../models/testInput.model.js";

export const createTestInput = async (name) => {
  const newInput = new TestInput({ name });
  return await newInput.save();
};

export const getAllTestInputs = async () => {
  return await TestInput.find().sort({ createdAt: -1 });
};
