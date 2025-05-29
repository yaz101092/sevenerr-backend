// import { config } from '../config/index.js'
// import { asyncLocalStorage } from '../services/als.service.js'
import { logger } from '../services/logger.service.js'
import { authService } from '../api/auth/auth.service.js'


export async function requireAuth(req, res, next) {
    if (!req?.cookies?.loginToken) {
        return res.status(401).send('Not Authenticated')
    }
    
    const loggedinUser = authService.validateToken(req.cookies.loginToken)
    if (!loggedinUser) return res.status(401).send('Not Authenticated')

    req.loggedinUser = loggedinUser
    next()
}

export async function requireAdmin(req, res, next) {
    if (!req?.cookies?.loginToken) {
        return res.status(401).send('Not Authenticated')
    }

    const loggedinUser = authService.validateToken(req.cookies.loginToken)
    if (!loggedinUser.isAdmin) {
        logger.warn(loggedinUser.fullname + 'attempted to perform admin action')
        res.status(403).end('Not Authorized')
        return
    }
    next()
}

// export function requireAuth(req, res, next) {
//     const { loggedinUser } = asyncLocalStorage.getStore()
//     req.loggedinUser = loggedinUser

//     if (config.isGuestMode && !loggedinUser) {
//         req.loggedinUser = { _id: '', fullname: 'Guest' }
//         return next()
//     }
//     if (!loggedinUser) return res.status(401).send('Not Authenticated')
//     next()
// }

// export function requireAdmin(req, res, next) {
//     const { loggedinUser } = asyncLocalStorage.getStore()

//     if (!loggedinUser) return res.status(401).send('Not Authenticated')
//     if (!loggedinUser.isAdmin) {
//         logger.warn(loggedinUser.fullname + 'attempted to perform admin action')
//         res.status(403).end('Not Authorized')
//         return
//     }
//     next()
// }
