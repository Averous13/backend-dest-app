import Destination from "../models/Destinations.js";
import {rollbackImage} from "../utils/rollbackImage.js";

class DestinationController{
    static async createDestination(req, res){
        let publicId = null;
        try {
            const {
                name,
                category,
                description,
                loc,
            } = req.body;

            publicId = req.file?.filename;
            const image = {
                url: req.file?.path,
                public_id: publicId,
            };


            const contacts = Array.isArray(req.body.contacts) ? req.body.contacts : req.body.contacts;
            const tags = Array.isArray(req.body.tags) ? req.body.tags : [];


            if (!image) {
                return res.status(400).json({message: "Image is required"});
            }
            
            const coordinate = loc.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)||
                loc.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
            if (!coordinate) {
                return res.status(400).json({message: "Coordinate is invalid"});
            }
            
            const location = {
                    lat: parseFloat(coordinate[1]),
                    long: parseFloat(coordinate[2]),
            };

            let access = { description: "", items: []}
            let time = { description: "", items: []}
            
            try {
                if (req.body.time) time = JSON.parse(req.body.time);
                if (req.body.access) access = JSON.parse(req.body.access);
            } catch (error) {
                console.error("time and access format invalid", error)
            }

            const destination = new Destination({
                name,
                category,
                description,
                image,
                location,
                contacts,
                tags,
                access,
                time
            });

            const savedDestination = await destination.save()
            res.status(201).json({message: "Destination created successfully", data: savedDestination,});

        } catch (error) {
            console.error('Error Creating destination: ', error);
            await rollbackImage(publicId);
            res.status(500).json({message: "Internal server error"});
        }
    }

    static async getAllDestination(req, res){
        try {
            const { 
                page=1,
                limit=10,
                category,
                tags,
            } = req.query;

            const query = {};

            if (category) query.category = category;
            if (tags) query.tags = tags;

            const pageNum = Math.max(1, parseInt(page));
            const pageLimit = Math.max(1, Math.min(parseInt(limit), 100));
            const skip = (pageNum - 1) * pageLimit;

            const [destinations, total] = await Promise.all([
                Destination.find(query)
                    .skip(skip)
                    .limit(pageLimit)
                    .sort({ name: 1})
            ]);

            res.status(200).json({
                destinations,
                total, 
                page: pageNum,
                pageCount: Math.ceil(total / pageLimit)
            })
        } catch (error) {
            console.error("Error fetching data: ", error);
            res.status(500).json({message: "Internal server error"});
        }
    }

    static async getDestinationById(req, res){
        try {
            const destination = await Destination.findById(req.params.id);
            if (!destination){
              return res.status(404).json({message: "Destination not found"})
            } 
            res.status(200).json(destination);
        } catch(error) {
            console.error('Error fetching data:', error);
            res.status(500).json({message: "Internal Server Error"});
        }
    }

    static async updateDestination(req, res){
        let newImagepublicId = null;
        try {
            const {
                name,
                category,
                description,
                loc
            } = req.body

            const destination = await Destination.findById(req.params.id);
            if (!destination) {
                return res.status(404).json({ message: "Destination not found"});
            }

            let image = destination.image;

            if (req.file) {
                newImagepublicId =  req.file?.filename;

                image = {
                    url: req.file?.path,
                    public_id: newImagepublicId
                }

                if(destination.image.public_id){
                    await rollbackImage(destination.image.public_id);
                }
            }

            const contacts = Array.isArray(req.body.contacts) ? req.body.contacts : req.body.contacts;
            const tags = Array.isArray(req.body.tags) ? req.body.tags : [];

            const coordinate = loc.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ||
                loc.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
            if (!coordinate) {
                return res.status(400).json({message: "Coordinate is invalid"});
            }

            const location = {
                lat: parseFloat(coordinate[1]),
                long: parseFloat(coordinate[2])
            }

            let access = { description: "", items: []}
            let time = { description: "", items: []}

            try {
                if (req.body.time) time = JSON.parse(req.body.time);
                if (req.body.access) access = JSON.parse(req.body.access);
            } catch (error) {
                console.error("time and access format invalid", error)
            }

            const updatedDestination = await Destination.findByIdAndUpdate(
                req.params.id,
                {
                    name,
                    category,
                    description,
                    image,
                    location,
                    contacts,
                    tags,
                    access,
                    time
                }, {new: true});
            if (!updatedDestination){
                return res.status(404).json({message: "Destination not found"})
            } 
            res.status(200).json({message: "destination updated successfully",data: updatedDestination});
        } catch (error) {
            console.error("Error fetching data", error);
            await rollbackImage(newImagepublicId);
            res.status(500).json({message: "Internal Server Error"});
        }
    }

    static async deleteDestinations(req, res){
        try{
            const deletedDestination = await Destination.findByIdAndDelete(req.params.id);
            if(!deletedDestination){
                res.status(404).json({message: "Destination not found"});
            }
            await rollbackImage(deletedDestination.image.public_id);
            res.status(200).json({message: "Destination deleted successfully"});
        } catch(error){
            console.error('Error deleting data:', error);
            res.status(500).json({message: "Internal Server Error"});
        }
    }

    static async getOptionDestination(req, res){
        try {
            const [category, tags] = await Promise.all([
                Destination.distinct("category"),
                Destination.distinct("tags"),
            ])

            res.status(200).json({
                category,
                tags
            });
        } catch(error) {
            console.error('Error getting filter option destination:', error)
            res.status(500).json({message: "Internal Server Error"})
        }
    }



    
}

export default DestinationController;




