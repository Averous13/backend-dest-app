import express from "express";
import DestinationController from "../controllers/DestinationController.js";
import { upload } from "../middleware/upload.js";


const router = express.Router();

router.post('/', upload.single("image") ,DestinationController.createDestination);
router.get('/', DestinationController.getAllDestination);
router.get('/opt', DestinationController.getOptionDestination);
router.get('/:id', DestinationController.getDestinationById);
router.put('/:id', upload.single("image"),DestinationController.updateDestination);
router.delete('/:id', DestinationController.deleteDestinations);

export default router