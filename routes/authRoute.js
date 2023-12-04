const express = require("express");
const {createUser , loginUserCtrl , getallUser, getaUser,getYearlyTotalOrders, deleteaUser,getMonthWiseOrderCount, updatedUser, blockUser, unblockUser, handleRefreshToken, logout, updatePassword, forgotPasswordToken, resetPassword, loginAdmin, getWishlist, saveAddress, userCart, getUserCart, emptyCart, applyCoupon, createOrder, getOrders, getAllOrders, getOrderByUserId, updateOrderStatus, removeProductFromCart, updateProductQuantityFromCart, getMyOrders, getMonthWiseOrderIncome} = require("../controller/userCtrl");
const {authMiddleware, isAdmin} = require("../middlewares/authMiddleware");
const router = express.Router();

router.post("/register",createUser);
router.post("/forget-password-token", forgotPasswordToken)

router.put("/reset-password/:token", resetPassword)
router.put("/password" ,authMiddleware , updatePassword)
router.post("/login", loginUserCtrl);

router.post("/admin-login", loginAdmin); 
router.post("/cart",  authMiddleware, userCart) ; 
router.post("/cart/applycoupon",  authMiddleware, applyCoupon) ; 
router.post("/cart/create-order", authMiddleware, createOrder);

router.delete("/empty", authMiddleware , emptyCart); 
router.delete("/delete-cart/:cartItemId", authMiddleware , removeProductFromCart); 
router.delete("/update-cart/:cartItemId/:newQuantity", authMiddleware , updateProductQuantityFromCart); 
router.get("/cart",  authMiddleware, getUserCart) ; 

router.get("/getMonthWiseOrderIncome",  authMiddleware, getMonthWiseOrderIncome) ; 
router.get("/getMonthWiseOrderCount",  authMiddleware, getMonthWiseOrderCount) ; 
router.get("/getYearlyTotalOrders",  authMiddleware, getYearlyTotalOrders) ; 

router.get("/wishlist",authMiddleware, getWishlist);
router.get("/all-users", getallUser);
 router.get("/getmyorders", authMiddleware, getMyOrders);
/*router.get("/getallorders", authMiddleware, isAdmin, getAllOrders);
router.post("/getorderbyuser/:id", authMiddleware, isAdmin, getOrderByUserId); */ 
router.get("/refresh", handleRefreshToken);
router.get("/logout", logout);

router.get("/:id", authMiddleware , isAdmin   ,getaUser);

router.delete("/:id", deleteaUser);
/*router.put(
    "/order/update-order/:id",
    authMiddleware,
    isAdmin,
    updateOrderStatus
  ); */
router.put("/edit-user",authMiddleware, updatedUser);
router.put("/Save-address",authMiddleware, saveAddress);
router.put("/block-user/:id", authMiddleware, isAdmin, blockUser);
router.put("/unblock-user/:id", authMiddleware, isAdmin, unblockUser);

module.exports=router; 