import Articles from "../models/Articles.js";
import Destinations from "../models/Destinations.js"
import {rollbackImage} from "../utils/rollbackImage.js";
import { generateExcerpt } from "../utils/generateExcerpt.js";

class ArticleController {
    static async imageHandler(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: "Tidak ada file yang diupload"
                });
            }
            res.status(200).json({
                success: true,
                message: "Gambar berhasil diupload",
                url: req.file.path,
                public_id: req.file.filename
            });
        } catch (error) {
            console.error('Error Cloudinary Upload:', error);
            res.status(500).json({message: "Internal server error", error})
        }
    }

    static async imageDelete(req, res) {
        try {
            const { public_id } = req.body; 
            
            if (!public_id) {
                return res.status(404).json({
                    error: "image not found",
                    success: false
                })
            }

            await rollbackImage(public_id);
            return res.status(200).json({
                success: true,
                message: "image deleted successfully"
            });
        } catch (error) {
            console.error('Error deleting image:', error);
            return res.status(500).json({
                success: false,
                message: "Internal server error",
                error
            })
        }
    }

    static async createArticle(req, res) {
        let publicId = null;
        try{
            const { title, author, status, content, related, category = null} = req.body;
            let hero = null;
            if (req.file) {
                publicId = req.file.filename;

                hero = {
                    url: req.file.path,
                    public_id: publicId
                }
            }

            if (!title || !author || !content) {
                return res.status(400).json({message: "title, content, and author required"});
            }


            const excerpt = generateExcerpt(content);


            const article = new Articles({
                title,
                author,
                status,
                content,
                excerpt,
                hero,
                related,
                category
            });

            const savedArticle = await article.save();

            return res.status(201).json({message: "article created successfully"}, savedArticle);
        } catch (error) {
            console.error("Error creating article:", error);
            return res.status(500).json({message: "Internal server error"});
        }
    }

    static async getArticle(req, res) {
        try {
            const {
                page=1,
                limit=10,
                category,
                author,
                status,
                related,
            } = req.query

            //dinamic filter
            const query = {}

            if (category) query.category = category
            if (author) query.author = author
            if (status) query.status = status

            if (related) {
                const relatedDest = await Destinations.findOne({ name: related }).select('_id')
                if (relatedDest) {
                    query.related = relatedDest._id
                } else {
                    return res.status(200).json({articles: [], total: 0});
                }
            }

            const pageNum = Math.max(1, parseInt(page))
            const limitNum = Math.max(1, Math.min(100, parseInt(limit)))
            const skip = (pageNum - 1) * limitNum

            const [articles, total] = await Promise.all([
                Articles.find(query)
                    .populate('related', 'name')
                    .skip(skip)
                    .limit(limitNum)
                    .sort({ createdAt: -1}),
                Articles.countDocuments(query),
            ])

            res.status(200).json({
                articles,
                total,
                page: pageNum,
                pageCount: Math.ceil(total / limitNum)
            })
        } catch (error) {
            console.error("Error fetching article:", error);
            res.status(500).json({message: "Internal server error"});
        }
    }

    static async getArticleById(req, res) {
        try {
            const article = await Articles.findById(req.params.id);
            if (!article){
               return res.status(404).json({message: "Article not found"});
            }
            return res.status(200).json(article);
        } catch(error) {
            console.error("Error fetching article:", error);
            return res.status(500).json({message: "Internal Server Error"});
        }
    }

    static async getRelatedArticle(req, res) {
        try {
            const article = await Articles.find({related: req.params.id});
            if (!article || article.length === 0) {
                res.status(404).json({message: "Article not found", success: false});
            }
            res.status(200).json({success: true, data: article});
        } catch(error) {
            console.error("Error fetching article:", error);
            res.status(500).json({message: "Internal Server Error"});
        }
    }

    static async updateRelatedArticle(req, res) {
        let publicId = null;
        try {
            const {title, author, status, content, related, category} = req.body;
            let hero = null;
            if (req.file) {
                publicId = req.file.filename;

                hero = {
                    url: req.file.path,
                    public_id: publicId
                }
            }

            const excerpt = generateExcerpt(content);

            const updatedArticle = await Articles.findOneAndUpdate(
                {related: related},
                {
                    title,
                    author,
                    status,
                    content,
                    excerpt,
                    hero,
                    related,
                    category
                }, {new: true}
            );
            if (!updatedArticle) {
                return res.status(404).json({message: "article not found"})
            }
            res.status(201).json({message:"Article updated successfully"});
        } catch (error) {
            console.error("Error updating article:", error);
            rollbackImage(publicId);
            return res.status(500).json({message: "Internal server error"})
        }
    }

    static async updateArticle(req, res) {
        console.log(req.file.filename);
        let newImagePublicId = null;
        try {
            const { title, author, status, content, related, category} = req.body;

            const article = await Articles.findById(req.params.id);
            if (!article) {
                return res.status(404).json({message: "Article Not Found"});
            }

            let hero = article.hero;

            if (req.file) {
                newImagePublicId = req.file?.filename;

                hero = {
                    url: req.file?.path,
                    public_id: newImagePublicId
                }

                if(article.hero?.public_id) {
                    await rollbackImage(article.hero.public_id)
                }
            }

            const excerpt = generateExcerpt(content);

            const updatedArticle = await Articles.findByIdAndUpdate(
                req.params.id,
                {
                    title,
                    author,
                    status,
                    content,
                    excerpt,
                    hero,
                    related,
                    category
                }, {new: true}
            )

            if(!updatedArticle) {
                return res.status(404).json({message: "Article not found"});
            }
            res.status(200).json({message: "destination updated successfully", data: updatedArticle})
        } catch (error) {
            console.error("Error fetching data", error);
            await rollbackImage(newImagePublicId);
            res.status(500).json({message: "Internal Server Error"});
        }

    }

    static async deleteArticle(req, res) {
        try {
            const deletedArticle = await Articles.findByIdAndDelete(req.params.id);
            if(!deletedArticle) {
                return res.status(404).json({message: "article not found"})
            }
            await rollbackImage(deletedArticle.hero.public_id)
            return res.status(200).json({message: "Article deleted successfully"})
        } catch (error) {
            console.error("Error deleting article data:", error)
            return res.status(500).json({message: "Internal Server Error"})
        }
    }

    static async getOptionFilter(req, res) {
        const [categories, authors, destinations] = await Promise.all([
            Articles.distinct("category"),
            Articles.distinct("author"),
            Destinations.find().select("name").lean(),
        ])

        res.status(200).json({ 
            categories,
            authors,
            status: ["published", "draft"],
            related: destinations.map(d => d.name),
         })
    }
}

export default ArticleController;