const Razorpay = require("razorpay");
const Order = require("../models/orderModel");


exports.getPremiumMemebership = async (req, res, next) => {
  try {
    const rzp = new Razorpay({
      key_id: process.env.RAZOR_PAY_KEY_ID,
      key_secret: process.env.RAZOR_PAY_KEY_SECRET,
    });
    const amount = 10000;

    rzp.orders.create(
      {
        amount,
        currency: "INR",
      },
      (err, order) => {
        if (err) {
          throw new Error(JSON.stringify(err));
        }
        req.user
          .createOrder({ orderId: order.id, status: "PENDING" })
          .then(() => {
            return res.status(201).json({
              order,
              key_id: rzp.key_id,
            });
          })
          .catch((err) => {
            throw new Error(err);
          });
      }
    );
  } catch (err) {
    res.status(403).json({ message: "Something went wrong", error: err });
  }
};


exports.updateTransactionDetail = async (req, res) => {
  try {
    const { status, payment_id, order_id } = req.body;

    console.log(status, payment_id, order_id);

    if (status === true) {
      const order = await Order.findOne({ where: { orderId: order_id } });
      const promise1 = await order.update({
        paymentId: payment_id,
        status: "SUCCESSFULL",
      });

      const promise2 = await req.user.update({ isPremium: true });

      Promise.all([promise1, promise2])
        .then(() => {
          return res.status(202).json({
            status: "success",
            message: "Transaction Successfull",
          });
        })
        .catch((err) => {
          throw new Error(err);
        });

      // Order.findOne({ where: { orderId: order_id } })
      //   .then((order) => {
      //     order
      //       .update({ paymentId: payment_id, status: "SUCCESSFULL" })
      //       .then(() => {
      //         req.user.update({ isPremium: true }).then(() => {
      //           return res.status(202).json({
      //             status: "success",
      //             message: "Transaction Successfull",
      //           });
      //         });
      //       });
      //   })
      // .catch((err) => {
      //   throw new Error(err);
      // });
    } else {
      Order.findOne({ where: { orderId: order_id } })
        .then((order) => {
          order.update({ paymentId: payment_id, status: "FAILED" }).then(() => {
            return res.status(202).json({
              status: "fail",
              message: "Transaction failed",
            });
          });
        })
        .catch((err) => {
          throw new Error(err);
        });
    }
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: "Something went wrong",
    });
  }
};
