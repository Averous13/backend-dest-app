import ArticleController from "../controllers/ArticleController.js";
import express from "express";
import { uploadArticle } from "../middleware/upload.js";

const route = express.Router();

route.post('/upload-image', uploadArticle.single("image"), ArticleController.imageHandler);
route.delete('/upload-image', uploadArticle.single("image"), ArticleController.imageDelete);
route.post('/',uploadArticle.single("hero") ,ArticleController.createArticle);
route.get('/', ArticleController.getArticle);
route.get('/opt', ArticleController.getOptionFilter)
route.get('/destination/:id', ArticleController.getRelatedArticle);
route.get('/:id', ArticleController.getArticleById);
route.put('/:id', uploadArticle.single("hero"), ArticleController.updateArticle);
route.delete('/:id', ArticleController.deleteArticle)


export default route;