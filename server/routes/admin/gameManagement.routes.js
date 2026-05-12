import express from "express";
import { 
  getAllHostedGames,
  deleteHostedGame,
  batchDeleteGames,
  batchUpdateGameStatus
} from "../../modules/admin/admin.controller.js";

const gameRouter = express.Router();

gameRouter.get("/list", getAllHostedGames);
gameRouter.delete("/:id", deleteHostedGame);
gameRouter.post("/batch-delete", batchDeleteGames);
gameRouter.put("/batch-status", batchUpdateGameStatus);


export default gameRouter;
