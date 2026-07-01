const Area = require("../models/area.model");

// Create Area
const createArea = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: "Area name is required" });

        const exist = await Area.findOne({ name });
        if (exist) return res.status(400).json({ message: "Area already exists" });

        const area = await Area.create({ name });
        return res.status(201).json({ success: true, area });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// Get All Areas
const getAllAreas = async (req, res) => {
    try {
        const { search } = req.query;
        let query = {};
        
        if (search) {
            query.name = { $regex: search, $options: "i" };
        }

        const areas = await Area.find(query).sort({ name: 1 });
        return res.status(200).json({ success: true, areas });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

//edit Area

const editArea = async (req, res) => {
    try {
        const id = req.params.id;
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: "Area name is required" });

        const exist = await Area.findOne({ name, _id: { $ne: id } });
        if (exist) return res.status(400).json({ message: "Area already exists" });

        const area = await Area.findByIdAndUpdate(id, { name }, { new: true });
        return res.status(200).json({ success: true, area });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

module.exports = { createArea, getAllAreas, editArea };
