const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    description: {
        type: String,
        required: true,
    },
    permissions: {
        type: [String],
        required: true,
        validate: {
            validator: function (v) {
                const validPermissions = [
                    'view_orders',
                    'create_orders',
                    'edit_orders',
                    'delete_orders',
                    'view_inventory',
                    'edit_inventory',
                    'view_payments',
                    'process_payments',
                    'view_analytics',
                    'manage_users',
                    'manage_roles',
                    'view_reports',
                    'manage_settings',
                    'view_tables',
                    'manage_tables',
                ];
                return v.every(perm => validPermissions.includes(perm));
            },
            message: "Invalid permission specified!"
        }
    },
    isActive: {
        type: Boolean,
        default: true,
    }
}, { timestamps: true });

module.exports = mongoose.model("Role", roleSchema);
