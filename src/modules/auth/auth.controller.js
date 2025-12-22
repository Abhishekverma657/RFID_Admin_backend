const authService = require("./auth.service");

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const data = await authService.login(email, password);

    // Agar token hai to bheje, warna sirf user bheje  
    if (data.token) {
      res.json({
        success: true,
        token: data.token,
        user: {
          id: data.user._id,
          name: data.user.name,
          role: data.user.role,
          instituteId: data.user.instituteId,
        },
      });
    } else {
      res.json({
        success: true,
        user: {
          id: data.user._id,
          name: data.user.name,
          role: data.user.role,
          instituteId: data.user.instituteId,
        },
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.createSuperAdmin = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const user = await authService.createSuperAdmin(name, email, password);
    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
};
