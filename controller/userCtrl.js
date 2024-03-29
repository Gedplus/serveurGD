const User = require("../models/userModel");
const Product = require("../models/productModel");
const Cart = require("../models/cartModel");
const Coupon = require("../models/couponModel");
const asyncHandler =require ("express-async-handler");
const{generateToken} = require("../config/jwtToken");
const validateMongoDbId = require("../utils/validateMongodbId");
const { generateRefreshToken } = require("../config/refreshToken");
const Order = require("../models/orderModel");
const uniqid = require("uniqid");
const sendEmail = require("./emailCtrl");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
// Create a User ----------------------------------------------

const createUser = asyncHandler(async (req, res) => {
    /**
     * TODO:Get the email from req.body
     */
    const email = req.body.email;
    /**
     * TODO:With the help of email find the user exists or not
     */
    const findUser = await User.findOne({ email: email });
  
    if (!findUser) {
      /**
       * TODO:if user not found user create a new user
       */
      const newUser = await User.create(req.body);
      res.json(newUser);
    } else {
      /**
       * TODO:if user found then thow an error: User already exists
       */
      throw new Error("User Already Exists");
    }
  });


// Login a user
const loginUserCtrl = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  // check if user exists or not
  const findUser = await User.findOne({ email });
  console.log(findUser)
  if (findUser && (await findUser.isPasswordMatched(password))) {
    const refreshToken = await generateRefreshToken(findUser?._id);
    const updateuser = await User.findByIdAndUpdate(
      findUser.id,
      {
        refreshToken: refreshToken,
      },
      { new: true }
    );
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 72 * 60 * 60 * 1000,
    });
    res.json({
      _id: findUser?._id,
      firstname: findUser?.firstname,
      lastname: findUser?.lastname,
      email: findUser?.email,
      mobile: findUser?.mobile,
      token: generateToken(findUser?._id),
    });
  } else {
    throw new Error("Invalid Credentials");
  }
});

// admin login

const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  // check if user exists or not
  const findAdmin = await User.findOne({ email });
  if (findAdmin.role !== "admin") throw new Error("Not Authorised");
  if (findAdmin && (await findAdmin.isPasswordMatched(password))) {
    const refreshToken = await generateRefreshToken(findAdmin?._id);
    const updateuser = await User.findByIdAndUpdate(
      findAdmin.id,
      {
        refreshToken: refreshToken,
      },
      { new: true }
    );
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 72 * 60 * 60 * 1000,
    });
    res.json({
      _id: findAdmin?._id,
      firstname: findAdmin?.firstname,
      lastname: findAdmin?.lastname,
      email: findAdmin?.email,
      mobile: findAdmin?.mobile,
      token: generateToken(findAdmin?._id),
    });
  } else {
    throw new Error("Invalid Credentials");
  }
});





 
// Get all users

const getallUser = asyncHandler(async (req, res) => {
    try {
      const getUsers = await User.find();
      res.json(getUsers);
    } catch (error) {
      throw new Error(error);
    }
  });
  // Get a single user

const getaUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongoDbId(id)
  
    try {
      const getaUser = await User.findById(id);
      res.json({
        getaUser,
      });
    } catch (error) {
      throw new Error(error);
    }
  });
  // delete a single user

const deleteaUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongoDbId(id)
  
    try {
      const deleteaUser = await User.findByIdAndDelete(id);
      res.json({
        deleteaUser,
      });
    } catch (error) {
      throw new Error(error);
    }
  });
  // Update a user
  const updatedUser = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    validateMongoDbId(_id)
  
    try {
      const updatedUser = await User.findByIdAndUpdate(
        _id,
        {
          firstname: req?.body?.firstname,
          lastname: req?.body?.lastname,
          email: req?.body?.email,
          mobile: req?.body?.mobile,
        },
        {
          new: true,
        }
      );
      res.json(updatedUser);
    } catch (error) {
      throw new Error(error);
    }
  });
  const blockUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongoDbId(id)
  
    try {
      const blockusr = await User.findByIdAndUpdate(
        id,
        {
          isBlocked: true,
        },
        {
          new: true,
        }
      );
      res.json(blockusr);
    } catch (error) {
      throw new Error(error);
    }
  });
  
  const unblockUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongoDbId(id)
  
    try {
      const unblock = await User.findByIdAndUpdate(
        id,
        {
          isBlocked: false,
        },
        {
          new: true,
        }
      );
      res.json({
        message: "User UnBlocked",
      });
    } catch (error) {
      throw new Error(error);
    }
  });
  // handle refresh token

const handleRefreshToken = asyncHandler(async (req, res) => {
  const cookie = req.cookies;
  if (!cookie?.refreshToken) throw new Error("No Refresh Token in Cookies");
  const refreshToken = cookie.refreshToken;
  const user = await User.findOne({ refreshToken });
  if (!user) throw new Error(" No Refresh token present in db or not matched");
  jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
    if (err || user.id !== decoded.id) {
      throw new Error("There is something wrong with refresh token");
    }
    const accessToken = generateToken(user?._id);
    res.json({ accessToken });
  });
});
  

// logout functionality

const logout = asyncHandler(async (req, res) => {
  const cookie = req.cookies;
  if (!cookie?.refreshToken) throw new Error("No Refresh Token in Cookies");
  const refreshToken = cookie.refreshToken;
  const user = await User.findOne({ refreshToken });

  if (!user) {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
    });
    return res.sendStatus(204); 
  }
  await User.findOneAndUpdate(user, {
    refreshToken: "",
  });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true,
  });
  res.sendStatus(204); 
});

const updatePassword = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { password } = req.body;
  validateMongoDbId(_id);
  const user = await User.findById(_id);
  if (password) {
    user.password = password;
    const updatedPassword = await user.save();
    res.json(updatedPassword);
  } else {
    res.json(user);
  }
});
const forgotPasswordToken = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found with this email");
  try {
    const token = await user.createPasswordResetToken();
    await user.save();
    const resetURL = `Hi, Please follow this link to reset Your Password. This link is valid till 10 minutes from now. <a href='http://localhost:3000/reset-password/${token}'>Click Here</>`;
    const data = {
      to: email,
      text: "Hey User",
      subject: "Forgot Password Link",
      htm: resetURL,
    };
    sendEmail(data);
    res.json(token);
  } catch (error) {
    throw new Error(error);
  }
});

const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { token } = req.params;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) throw new Error(" Token Expired, Please try again later");
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  res.json(user);
});
const getWishlist = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  console.log(_id)
  try {
    const findUser = await User.findById(_id).populate("wishlist");
    console.log(findUser)
    res.json(findUser);
  } catch (error) {
    throw new Error(error);
  }
});




// save user Address

const saveAddress = asyncHandler(async (req, res, next) => {
  const { _id } = req.user;
  validateMongoDbId(_id);

  try {
    const updatedUser = await User.findByIdAndUpdate(
      _id,
      {
        address: req?.body?.address,
      },
      {
        new: true,
      }
    );
    res.json(updatedUser);
  } catch (error) {
    throw new Error(error);
  }
});


const userCart = asyncHandler(async (req, res) => {
  const { productId , quantity , price } = req.body;
  const { _id } = req.user;
  validateMongoDbId(_id);
  try {
    
    let newCart = await new Cart({
      userId : _id,
      productId,

price ,
 quantity
    }).save();
    res.json(newCart);
  } catch (error) {
    throw new Error(error);
  }
});

const getUserCart = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  console.log(_id)
  validateMongoDbId(_id);
  try {
    const cart = await Cart.find({ userId: _id }).populate(
      "productId"
    )
    console.log(cart)
    res.json(cart);
  } catch (error) {
    throw new Error(error);
  }
});



const updateProductQuantityFromCart = asyncHandler(async (req, res) => {
  const { _id } = req.user;
 
  const {cartItemId , newQuantity} = req.params


  validateMongoDbId(_id);


  try {
    console.log(_id )
    const cartItem  = await Cart.findOne({ userId:_id , _id: cartItemId });
cartItem.quantity = newQuantity
cartItem.save()
    res.json(cartItem);
  } catch (error) {
    throw new Error(error);
  }
});



const removeProductFromCart = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const {cartItemId} = req.params

  validateMongoDbId(_id);

  console.log(req.params,"sdsd")

  console.log(_id ,"ssd")
  try {
    const deleteProductFromCart  = await Cart.deleteOne({ userId:_id , _id: cartItemId });
    console.log(deleteProductFromCart,"ssd")
    res.json(deleteProductFromCart);
  } catch (error) {
    throw new Error(error);
  }
});

const emptyCart = asyncHandler(async (req, res) => {
  const { _id } = req.user;


  validateMongoDbId(_id);


  try {
    const deleteCart  = await Cart.deleteMany({ userId:_id });

    res.json(deleteCart);
  } catch (error) {
    throw new Error(error);
  }
});


const applyCoupon = asyncHandler(async (req, res) => {
  const { coupon } = req.body;
  const { _id } = req.user;
  validateMongoDbId(_id);
  const validCoupon = await Coupon.findOne({ name: coupon });
  if (validCoupon === null) {
    throw new Error("Invalid Coupon");
  }
  const user = await User.findOne({ _id });
  let { cartTotal } = await Cart.findOne({
    orderby: user._id,
  }).populate("products.product");
  let totalAfterDiscount = (
    cartTotal -
    (cartTotal * validCoupon.discount) / 100
  ).toFixed(2);
  await Cart.findOneAndUpdate(
    { orderby: user._id },
    { totalAfterDiscount },
    { new: true }
  );
  res.json(totalAfterDiscount);
});


/*const createOrder = asyncHandler(async (req, res) => {
  const { COD, couponApplied } = req.body;
  const { _id } = req.user;
  validateMongoDbId(_id);
  try {
    if (!COD) throw new Error("Create cash order failed");
    const user = await User.findById(_id);
    let userCart = await Cart.findOne({ orderby: user._id });
    let finalAmout = 0;
    if (couponApplied && userCart.totalAfterDiscount) {
      finalAmout = userCart.totalAfterDiscount;
    } else {
      finalAmout = userCart.cartTotal;
    }

    let newOrder = await new Order({
      products: userCart.products,
      paymentIntent: {
        id: uniqid(),
        method: "COD",
        amount: finalAmout,
        status: "Cash on Delivery",
        created: Date.now(),
        currency: "usd",
      },
      orderby: user._id,
      orderStatus: "Cash on Delivery",
    }).save();
    let update = userCart.products.map((item) => {
      return {
        updateOne: {
          filter: { _id: item.product._id },
          update: { $inc: { quantity: -item.count, sold: +item.count } },
        },
      };
    });
    const updated = await Product.bulkWrite(update, {});
    res.json({ message: "success" });
  } catch (error) {
    throw new Error(error);
  }
});

const getOrders = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  validateMongoDbId(_id);
  try {
    const userorders = await Order.findOne({ orderby: _id })
      .populate("products.product")
      .populate("orderby")
      .exec();
    res.json(userorders);
  } catch (error) {
    throw new Error(error);
  }
});

const getAllOrders = asyncHandler(async (req, res) => {
  try {
    const alluserorders = await Order.find()
      .populate("products.product")
      .populate("orderby")
      .exec();
    res.json(alluserorders);
  } catch (error) {
    throw new Error(error);
  }
});
const getOrderByUserId = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const userorders = await Order.findOne({ orderby: id })
      .populate("products.product")
      .populate("orderby")
      .exec();
    res.json(userorders);
  } catch (error) {
    throw new Error(error);
  }
});
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const updateOrderStatus = await Order.findByIdAndUpdate(
      id,
      {
        orderStatus: status,
        paymentIntent: {
          status: status,
        },
      },
      { new: true }
    );
    res.json(updateOrderStatus);
  } catch (error) {
    throw new Error(error);
  }
});
*/
const getOrderByUserId = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const userorders = await Order.findOne({ _id: id })
      .populate("orderItems.product")
      .populate("user")
 .exec()
    res.json(userorders);
  } catch (error) {
    throw new Error(error);
  }
});
const getAllOrders = asyncHandler(async (req, res) => {
  try {


      const orders = await Order.find().populate("user").populate("orderItems.product").exec();
    res.json(orders);
  } catch (error) {
    throw new Error(error);
  }
});
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const updateOrderStatus = await Order.findByIdAndUpdate(
      id,
      {
        orderStatus: status,
        paymentIntent: {
          status: status,
        },
      },
      { new: true }
    );
    res.json(updateOrderStatus);
  } catch (error) {
    throw new Error(error);
  }
});
const createOrder = asyncHandler (async(req, res) =>{
  const {shippingInfo,orderItems,totalPrice,totalPriceAfterDiscount,payementInfo} =req.body;
  const {_id} = req.user;
  try{
    const order = await Order.create ({
      shippingInfo,orderItems,totalPrice,totalPriceAfterDiscount,payementInfo , user:_id
    })
    res.json({
      order, success: true
    })

  } catch (error) {
    throw new Error(error)
  }
})


const getMyOrders = asyncHandler(async (req, res) => {
  const {_id} = req.user;
  try {
    const orders = await Order.find({user:_id}).populate("user").populate("orderItems.product")
    res.json({orders})
  }catch(error){
    throw new Error(error)
  }
})

const getMonthWiseOrderIncome = asyncHandler(async (req , res ) => {
let monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
  ]
  let d = new Date();
  let endDate ="";
  d.setDate(1)
  for (let index =0 ; index< 11 ; index++){
    d.setMonth(d.getMonth() - 1 )
    endDate = monthNames[d.getMonth()] + " "+d.getFullYear()

  }
  const data = await Order.aggregate([
    {
      $match: {
        createdAt :{
          $lte : new Date(),
          $gte:new Date(endDate)
        }
      }
    },{
      $group:{
        _id:{
          month: "$month"
        }, amount:{$sum: "$totalPriceAfterDiscount"},
        count:{$sum:1}
      }
    }
  ])
res.json(data)
})
const getYearlyTotalOrders = asyncHandler(async (req , res ) => {
  let monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
    ]
    let d = new Date();
    let endDate ="";
    d.setDate(1)
    for (let index =0 ; index< 11 ; index++){
      d.setMonth(d.getMonth() - 1 )
      endDate = monthNames[d.getMonth()] + " "+d.getFullYear()
  
    }
    const data = await Order.aggregate([
      {
        $match: {
          createdAt :{
            $lte : new Date(),
            $gte:new Date(endDate)
          }
        }
      },{
        $group:{
          _id:null,
          count:{$sum:1},
          
          amount:{$sum: "$totalPriceAfterDiscount"}
        }
      }
    ])
  res.json(data)
  })

const getMonthWiseOrderCount = asyncHandler(async (req , res ) => {
  let monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
    ]
    let d = new Date();
    let endDate ="";
    d.setDate(1)
    for (let index =0 ; index< 11 ; index++){
      d.setMonth(d.getMonth() - 1 )
      endDate = monthNames[d.getMonth()] + " "+d.getFullYear()
  
    }
    const data = await Order.aggregate([
      {
        $match: {
          createdAt :{
            $lte : new Date(),
            $gte:new Date(endDate)
          }
        }
      },{
        $group:{
          _id:{
            month: "$month"
          }, count:{$sum: 1}
        }
      }
    ])
  res.json(data)
  })

  module.exports = {createUser ,loginUserCtrl,getallUser,getaUser,getOrderByUserId ,getAllOrders,updateOrderStatus, getYearlyTotalOrders, deleteaUser ,updatedUser ,unblockUser ,blockUser , handleRefreshToken , logout , updatePassword , forgotPasswordToken , resetPassword , loginAdmin , getWishlist , saveAddress , userCart , getUserCart , emptyCart , applyCoupon ,  removeProductFromCart ,createOrder,updateProductQuantityFromCart ,getMyOrders ,getMonthWiseOrderIncome , getMonthWiseOrderCount};