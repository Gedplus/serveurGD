const express = require("express");
const {authMiddleware, isAdmin} = require("../middlewares/authMiddleware");
const { createProduct, getaProduct, getAllProduct, updateProduct, deleteProduct, addToWishlist, rating, uploadImages, deleteImages, updateProductqty } = require("../controller/productCtrl");
const { productImgResize, uploadPhoto } = require("../middlewares/uploadImage");

const router = express.Router();
router.post("/", authMiddleware ,isAdmin , createProduct);
router.get("/:id",getaProduct);
router.put("/wishlist", authMiddleware, addToWishlist)
router.put("/rating", authMiddleware, rating)
router.put(
    "/upload",
    authMiddleware,
    isAdmin,
    uploadPhoto.array("images", 10),
    productImgResize,
uploadImages
  );
  
router.put("/:id", updateProduct);
router.put("/qty/:id", updateProductqty);
router.delete("/:id", authMiddleware ,isAdmin , deleteProduct);
router.delete("/delete-img/:id", authMiddleware, isAdmin, deleteImages);
router.get("/",getAllProduct);
module.exports =router ;