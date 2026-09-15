import mongoose from "mongoose";

const rolePermissionSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["admin", "agent", "customer"],
      required: true,
      unique: true,
      index: true,
    },

    permissions: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

const RolePermission = mongoose.model("RolePermission", rolePermissionSchema);

export default RolePermission;
