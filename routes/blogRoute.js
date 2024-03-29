const express = require("express");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");
const { createBlog, updateBlog, getBlog, getAllBlogs, deleteBlog, liketheBlog, disliketheBlog, uploadImages, getAllBlogsCat } = require("../controller/blogCtrl");
const { uploadPhoto, productImgResize, blogImgResize } = require("../middlewares/uploadImage");
const router = express.Router();
router.post("/" , authMiddleware , isAdmin , createBlog)
router.put("/:id" , authMiddleware , isAdmin , updateBlog)
router.get("/likes" , authMiddleware , liketheBlog)
router.get("/dislikes" , authMiddleware , disliketheBlog)
router.get("/:id" , getBlog)
router.get("/", getAllBlogs)
router.get("/cat/:id", getAllBlogsCat)
router.put(
    "/upload/:id",
    authMiddleware,
    isAdmin,
    uploadPhoto.array("images", 10),
    blogImgResize,
uploadImages
  );
  
router.delete("/:id" , authMiddleware , isAdmin , deleteBlog)

 module.exports = router ;