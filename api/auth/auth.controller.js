// import { authService } from './auth.service.js'
// import { logger } from '../../services/logger.service.js'


// export async function login(req, res) {
// 	const { username, password } = req.body
// 	try {
// 		const user = await authService.login(username, password)
// 		const loginToken = authService.getLoginToken(user)
        
// 		logger.info('User login: ', user)
        
// 		res.cookie('loginToken', loginToken, { sameSite: 'None', secure: true })
// 		res.json(user)
// 	} catch (err) {
// 		logger.error('Failed to Login ' + err)
// 		res.status(401).send({ err: 'Failed to Login' })
// 	}
// }

// export async function signup(req, res) {
// 	try {
// 		const credentials = req.body

// 		// Never log passwords
// 		// logger.debug(credentials)
		
//         const account = await authService.signup(credentials)
// 		logger.debug(`auth.route - new account created: ` + JSON.stringify(account))
		
//         const user = await authService.login(credentials.username, credentials.password)
// 		logger.info('User signup:', user)
		
//         const loginToken = authService.getLoginToken(user)
// 		res.cookie('loginToken', loginToken, { sameSite: 'None', secure: true })
// 		res.json(user)
// 	} catch (err) {
// 		logger.error('Failed to signup ' + err)
// 		res.status(400).send({ err: 'Failed to signup' })
// 	}
// }
// export async function logout(req, res) {
//   try {
//     // path: '/', secure ו־sameSite חייבים להתאים ל־cookie שמוגדר ב-login
//     res.clearCookie('loginToken') //, { path: '/', sameSite: 'None', secure: true }
//     res.send({ msg: 'Logged out successfully' })
//   } catch (err) {
//     res.status(400).send({ err: 'Failed to logout' })
//   }
// }

// export async function validateToken(req, res) {
//   try {
//     // קרא לעוגיה 'loginToken' מהבקשה
//     const loginToken = req.cookies.loginToken
//     // אם אין עוגיה, החזר 401
//     if (!loginToken) return res.status(401).send({ err: 'No token provided' })

//     // פענח את הטוקן (אמור להחזיר אובייקט משתמש בלי סיסמה)
//     const user = authService.validateToken(loginToken)
//     if (!user) {
//       // אם הפענוח נכשל, החזר 401
//       return res.status(401).send({ err: 'Invalid token' })
//     }

//     // אם הכל תקין, החזר JSON של המשתמש
//     res.json(user)
//   } catch (err) {
//     logger.error('Failed to validate token', err)
//     res.status(401).send({ err: 'Invalid token' })
//   }
// }

// ./api/auth/auth.controller.js
import { authService } from './auth.service.js'
import { logger } from '../../services/logger.service.js'

export async function login(req, res) {
  const { username, password } = req.body
  try {
    const user = await authService.login(username, password)
    const loginToken = authService.getLoginToken(user)

    logger.info('User login: ', user)

    // אם אנחנו בסביבת פרודקשן (HTTPS), אז שולחים SameSite=None & Secure
    if (process.env.NODE_ENV === 'production') {
      res.cookie('loginToken', loginToken, {
        sameSite: 'None',
        secure: true,
        // במידת הצורך אפשר להוסיף פה גם httpOnly: true
      })
    } else {
      // בפיתוח (HTTP), שולחים SameSite='Lax' וללא secure
      res.cookie('loginToken', loginToken, {
        sameSite: 'Lax',
        // secure כבר ברירת מחדל: false
        // אפשר להוסיף httpOnly: true אם תרצו
      })
    }

    res.json(user)
  } catch (err) {
    logger.error('Failed to Login ' + err)
    res.status(401).send({ err: 'Failed to Login' })
  }
}

export async function signup(req, res) {
  try {
    const credentials = req.body

    // יוצר חשבון חדש (hash הסיסמה נעשה בתוך authService.signup)
    const account = await authService.signup(credentials)
    logger.debug(`auth.route - new account created: ` + JSON.stringify(account))

    // מבצע login אוטומטי כדי לקבל עוגיה ולהחזיר אובייקט משתמש
    const user = await authService.login(credentials.username, credentials.password)
    logger.info('User signup:', user)

    const loginToken = authService.getLoginToken(user)

    // אותם כללים כמו בלוגין: בפיתוח בלי secure, בפרודקשן עם secure
    if (process.env.NODE_ENV === 'production') {
      res.cookie('loginToken', loginToken, {
        sameSite: 'None',
        secure: true,
      })
    } else {
      res.cookie('loginToken', loginToken, {
        sameSite: 'Lax',
      })
    }

    res.json(user)
  } catch (err) {
    logger.error('Failed to signup ' + err)
    res.status(400).send({ err: 'Failed to signup' })
  }
}

export async function logout(req, res) {
  try {
    // חשוב להגדיר את אותם אופציות כאן אם היינו מגדירים אותן בלוגין
    if (process.env.NODE_ENV === 'production') {
      res.clearCookie('loginToken', {
        sameSite: 'None',
        secure: true,
      })
    } else {
      res.clearCookie('loginToken', {
        sameSite: 'Lax',
      })
    }
    res.send({ msg: 'Logged out successfully' })
  } catch (err) {
    res.status(400).send({ err: 'Failed to logout' })
  }
}

export async function validateToken(req, res) {
  try {
    // קרא לעוגיה 'loginToken' מהבקשה
    const loginToken = req.cookies.loginToken
    // אם אין עוגיה, החזר 401
    if (!loginToken) return res.status(401).send({ err: 'No token provided' })

    // פענח את הטוקן (אמור להחזיר אובייקט משתמש בלי סיסמה)
    const user = authService.validateToken(loginToken)
    if (!user) {
      // אם הפענוח נכשל, החזר 401
      return res.status(401).send({ err: 'Invalid token' })
    }

    // אם הכל תקין, החזר JSON של המשתמש
    res.json(user)
  } catch (err) {
    logger.error('Failed to validate token', err)
    res.status(401).send({ err: 'Invalid token' })
  }
}
