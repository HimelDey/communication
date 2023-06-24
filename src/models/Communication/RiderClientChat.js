import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const DataSchema = mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => uuidv4().replace(/\-/g, ""),
    },
    from_user_id: { type: String },
    to_user_id: { type: String },
    from_type: { type: String },
    to_type: { type: String },
    text: { type: String },
    order_id: { type: String },
    is_active: { type: Boolean, default: true },
    created_at: { type: Date, default: Date.now() },
    updated_at: { type: Date, default: Date.now() },
  },
  { 
    collection: "rider_client_chat",
    versionKey: false  
  }
);

const Category = mongoose.model("rider_client_chat", DataSchema);
export default Category;
