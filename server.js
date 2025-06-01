

// import express from 'express'
// import cookieParser from 'cookie-parser'
// import http from 'http'
// import cors from 'cors'
// import path, { dirname } from 'path'
// import { fileURLToPath } from 'url'
// import "dotenv/config.js"

// const __filename = fileURLToPath(import.meta.url)
// const __dirname = dirname(__filename)

// import { logger } from './services/logger.service.js'
// logger.info('server.js loaded...')

// const app = express()
// const server = http.createServer(app)

// // Express App Config
// app.use(cookieParser())
// app.use(express.json())
// app.use(express.static('public'))

// if (process.env.NODE_ENV === 'production') {
//     // Express serve static files on production environment
//     app.use(express.static(path.resolve(__dirname, 'public')))
//     console.log('__dirname: ', __dirname)
// } else {
//     // Configuring CORS
//     const corsOptions = {
//         // Make sure origin contains the url your frontend is running on
//         origin: ['http://127.0.0.1:5173', 'http://localhost:5173', 'http://127.0.0.1:3030', 'http://localhost:3030', 'http://127.0.0.1:3000', 'http://localhost:3000'],
//         credentials: true
//     }
//     app.use(cors(corsOptions))
// }

// import { authRoutes } from './api/auth/auth.routes.js'
// import { userRoutes } from './api/user/user.routes.js'
// import { gigRoutes } from './api/gig/gig.routes.js'
// import { orderRoutes } from './api/order/order.routes.js'
// // import { setupSocketAPI } from './services/socket.service.js'

// // import { setupAsyncLocalStorage } from './middlewares/setupAls.middleware.js'

// // app.all('*', setupAsyncLocalStorage)
// // routes
// app.use('/api/auth', authRoutes)
// app.use('/api/user', userRoutes)
// app.use('/api/gig', gigRoutes)
// app.use('/api/order', orderRoutes)
// app.use('/api/order', orderRoutes)
// // setupSocketAPI(server)


// // Make every unmatched server-side-route fall back to index.html
// // So when requesting http://localhost:3030/index.html/car/123 it will still respond with
// // our SPA (single page app) (the index.html file) and allow vue-router to take it from there
// app.post('/api/auth/logout', (req, res) => {
//   try {
//     req.session?.destroy(() => {
//       res.status(200).send({ message: 'Logged out successfully' })
//     })
//   } catch (err) {
//     console.error('Logout failed:', err)
//     res.status(500).send({ error: 'Logout failed' })
//   }
// })

// app.get('/**', (req, res) => {
//     res.sendFile(path.resolve('public/index.html'))
// })

// const port = process.env.PORT || 3030

// server.listen(port, () => {
//     logger.info('Server is running on port: ' + port)
// })

// ./server.js

import express from 'express'
import cookieParser from 'cookie-parser'
import http from 'http'
import cors from 'cors'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import "dotenv/config.js"

import { logger } from './services/logger.service.js'

// הוספת ייבוא של authService ו־userService, כדי שנוכל לבצע seeding
import { authService } from './api/auth/auth.service.js'
import { userService } from './api/user/user.service.js'

logger.info('server.js loaded...')

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const server = http.createServer(app)

// Express App Config
app.use(cookieParser())
app.use(express.json())
app.use(express.static('public'))

if (process.env.NODE_ENV === 'production') {
  // Express serve static files on production environment
  app.use(express.static(path.resolve(__dirname, 'public')))
  console.log('__dirname: ', __dirname)
} else {
  // Configuring CORS
  const corsOptions = {
    // Make sure origin contains the url your frontend is running on
    origin: [
      'http://127.0.0.1:5173',
      'http://localhost:5173',
      'http://127.0.0.1:3030',
      'http://localhost:3030',
      'http://127.0.0.1:3000',
      'http://localhost:3000'
    ],
    credentials: true
  }
  app.use(cors(corsOptions))
}

// ****************************************
//   SEEDING: יצירת שני המשתמשים הקבועים
// ****************************************
async function _seedDemoUsersIfNeeded() {
  try {
    // 1. שולפים את כל המשתמשים הקיימים (collection: "user")
    const existingUsers = await userService.query()
    // 2. אם כבר יש משתמשים, מדלגים על ה-seeding
    if (existingUsers && existingUsers.length) {
      logger.info('Users collection is not empty. Skipping seeding.')
      return
    }
    logger.info('Seeding two default users (demo1, demo2)...')

    // 3. הגדרת המשתמשים הקבועים להוספה
    const usersToSeed = [
      {
        username: 'demo1',
        password: 'Demo1234',
        fullname: 'Demo User One',
        imgUrl:
          'https://cdn.pixabay.com/photo/2020/07/01/12/58/icon-5359553_1280.png'
      },
      {
        username: 'demo2',
        password: 'Demo1234',
        fullname: 'Demo User Two',
        imgUrl:
          'https://cdn.pixabay.com/photo/2020/07/01/12/58/icon-5359553_1280.png'
      }
    ]

    // 4. מוסיפים כל משתמש בעזרת authService.signup (שיבצע hashing לסיסמא)
    for (const usr of usersToSeed) {
      try {
        await authService.signup(usr)
        logger.info(`Created user: ${usr.username}`)
      } catch (err) {
        logger.error(
          `Failed to create user ${usr.username}: ${err.message}`
        )
      }
    }
    logger.info('Seeding completed.')
  } catch (err) {
    logger.error('Error during seeding:', err)
  }
}

// מפעילים את ה־seeding ברגע שהשרת עולה
_seedDemoUsersIfNeeded()

// *************************************
//  ההגדרת ה־routes לאחר ה־seeding
// *************************************
import { authRoutes } from './api/auth/auth.routes.js'
import { userRoutes } from './api/user/user.routes.js'
import { gigRoutes } from './api/gig/gig.routes.js'
import { orderRoutes } from './api/order/order.routes.js'
// import { setupSocketAPI } from './services/socket.service.js'
// import { setupAsyncLocalStorage } from './middlewares/setupAls.middleware.js'

// app.all('*', setupAsyncLocalStorage)
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/gig', gigRoutes)
app.use('/api/order', orderRoutes)
app.use('/api/order', orderRoutes)

// הגדרת Logout כאילו-route POST (כבר לא משתמשים ב־session אלא ב־cookie בלבד)
app.post('/api/auth/logout', (req, res) => {
  try {
    // פשוט ננקה את העוגיה בצד הלקוח; כאן לא עובד עם session
    // אם השתמשת ב־session, צריך לקרוא req.session.destroy()
    res.clearCookie('loginToken')
    res.status(200).send({ message: 'Logged out successfully' })
  } catch (err) {
    console.error('Logout failed:', err)
    res.status(500).send({ error: 'Logout failed' })
  }
})

// Make every unmatched server-side-route fall back to index.html
app.get('/**', (req, res) => {
  res.sendFile(path.resolve('public/index.html'))
})

const port = process.env.PORT || 3030
server.listen(port, () => {
  logger.info('Server is running on port: ' + port)
})
