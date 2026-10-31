import { Router } from "express";
import {
  handleCreateTestInput,
  handleGetTestInputs,
} from "../controllers/testInput.controller.js";

const router = Router();

router.route("/")
  .post(handleCreateTestInput)
  .get(handleGetTestInputs);

export default router;
