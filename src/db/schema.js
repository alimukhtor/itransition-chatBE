import mongoose from "mongoose";
const { Schema, model } = mongoose;
const msgSchema = new Schema(
  {
    title: { type: String },
    text: { type: String },
    socketId: { type:String },
    sender: { type:String }
  },
  {timestamps:true}
  // { typeKey: '$type' }
);
export default model("Message", msgSchema);
