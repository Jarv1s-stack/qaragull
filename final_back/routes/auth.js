const express = require("express") // Express кітапханасын қосу
const { body } = require("express-validator") // express-validator кітапханасын қосу (мәліметтерді тексеру үшін)
const rateLimit = require("express-rate-limit")
const { register, verifyRegistration, resendRegistrationCode, login, getProfile, updateProfile, uploadAvatar, changePassword } = require("../controllers/authController") // Контроллерлерді қосу
const auth = require("../middleware/auth") // Аутентификация middleware
const upload = require("../middleware/upload")
const router = express.Router() // Express маршруты

const emailActionLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Көп әрекет жасалды. Біраздан соң қайта көріңіз." },
})

// Тіркелу валидациясы
const registerValidation = [
  body("fullName") // Толық аты
    .trim() // Артық бос орындарды өшіру
    .isLength({ min: 2 }) // Ұзындығы 2 таңбадан кем болмауы керек
    .withMessage("Толық аты кемінде 2 таңбадан тұруы керек"),
  body("email") // Email
    .isEmail() // Email пішімі дұрыс болуы керек
    .normalizeEmail() // Email мекенжайын нормализациялау (кіші әріптермен жазу)
    .withMessage("Дұрыс email мекенжайын енгізіңіз"),
  body("password") // Құпия сөз
    .isLength({ min: 6 }) // Құпия сөз кемінде 6 таңбадан тұруы керек
    .withMessage("Құпия сөз кемінде 6 таңбадан тұруы керек"),
]

// Кіру валидациясы
const loginValidation = [
  body("email") // Email
    .isEmail() // Email пішімі дұрыс болуы керек
    .normalizeEmail() // Email мекенжайын нормализациялау (кіші әріптермен жазу)
    .withMessage("Дұрыс email мекенжайын енгізіңіз"),
  body("password") // Құпия сөз
    .notEmpty() // Құпия сөз бос болмауы керек
    .withMessage("Құпия сөзді енгізіңіз"),
]

// Профиль жаңарту валидациясы
const updateProfileValidation = [
  body("fullName") // Толық аты
    .trim() // Артық бос орындарды өшіру
    .isLength({ min: 2 }) // Ұзындығы 2 таңбадан кем болмауы керек
    .withMessage("Толық аты кемінде 2 таңбадан тұруы керек"),
  body("email") // Email
    .isEmail() // Email пішімі дұрыс болуы керек
    .normalizeEmail() // Email мекенжайын нормализациялау (кіші әріптермен жазу)
    .withMessage("Дұрыс email мекенжайын енгізіңіз"),
]

// Құпия сөз өзгерту валидациясы
const changePasswordValidation = [
  body("currentPassword") // Ағымдағы құпия сөз
    .notEmpty() // Құпия сөз бос болмауы керек
    .withMessage("Ағымдағы құпия сөзді енгізіңіз"),
  body("newPassword") // Жаңа құпия сөз
    .isLength({ min: 6 }) // Ұзындығы 6 таңбадан кем болмауы керек
    .withMessage("Жаңа құпия сөз кемінде 6 таңбадан тұруы керек"),
]

const registrationEmailValidation = [
  body("email").isEmail().normalizeEmail().withMessage("Дұрыс email мекенжайын енгізіңіз"),
]

const verifyRegistrationValidation = [
  body("fullName").trim().isLength({ min: 2 }).withMessage("Толық аты кемінде 2 таңбадан тұруы керек"),
  body("email").isEmail().normalizeEmail().withMessage("Дұрыс email мекенжайын енгізіңіз"),
  body("password").isLength({ min: 6 }).withMessage("Құпия сөз кемінде 6 таңбадан тұруы керек"),
  body("token").trim().matches(/^\d{6,8}$/).withMessage("Email-дағы 6–8 таңбалы кодты енгізіңіз"),
]

// Маршруттар
router.post("/register", emailActionLimit, registerValidation, register) // Email растауы басталатын тіркелу
router.post("/verify-registration", emailActionLimit, verifyRegistrationValidation, verifyRegistration)
router.post("/resend-registration-code", emailActionLimit, registrationEmailValidation, resendRegistrationCode)
router.post("/login", loginValidation, login) // Кіру маршруты
router.get("/profile", auth, getProfile) // Профильді алу маршруты
router.put("/profile", auth, updateProfileValidation, updateProfile) // Профильді жаңарту маршруты
router.post("/avatar", auth, upload.single("avatar"), uploadAvatar)
router.put("/change-password", auth, changePasswordValidation, changePassword) // Құпия сөзді өзгерту маршруты

module.exports = router // Маршруттарды экспорттау
