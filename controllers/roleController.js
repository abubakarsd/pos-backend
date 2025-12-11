const createHttpError = require("http-errors");
const Role = require("../models/roleModel");

const getAllRoles = async (req, res, next) => {
    try {
        const roles = await Role.find({ isActive: true }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: roles });
    } catch (error) {
        next(error);
    }
};

const createRole = async (req, res, next) => {
    try {
        const { name, description, permissions } = req.body;

        if (!name || !description || !permissions) {
            const error = createHttpError(400, "Name, description, and permissions are required!");
            return next(error);
        }

        const roleExists = await Role.findOne({ name });
        if (roleExists) {
            const error = createHttpError(400, "Role already exists!");
            return next(error);
        }

        const newRole = new Role({ name, description, permissions });
        await newRole.save();

        res.status(201).json({ success: true, message: "Role created successfully!", data: newRole });
    } catch (error) {
        next(error);
    }
};

const updateRole = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description, permissions } = req.body;

        const role = await Role.findByIdAndUpdate(
            id,
            { name, description, permissions },
            { new: true, runValidators: true }
        );

        if (!role) {
            const error = createHttpError(404, "Role not found!");
            return next(error);
        }

        res.status(200).json({ success: true, message: "Role updated successfully!", data: role });
    } catch (error) {
        next(error);
    }
};

const deleteRole = async (req, res, next) => {
    try {
        const { id } = req.params;

        const role = await Role.findByIdAndUpdate(
            id,
            { isActive: false },
            { new: true }
        );

        if (!role) {
            const error = createHttpError(404, "Role not found!");
            return next(error);
        }

        res.status(200).json({ success: true, message: "Role deleted successfully!", data: role });
    } catch (error) {
        next(error);
    }
};

const getRoleById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const role = await Role.findById(id);
        if (!role) {
            const error = createHttpError(404, "Role not found!");
            return next(error);
        }

        res.status(200).json({ success: true, data: role });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllRoles,
    createRole,
    updateRole,
    deleteRole,
    getRoleById,
};
